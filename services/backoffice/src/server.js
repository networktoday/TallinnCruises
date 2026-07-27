import crypto from "node:crypto";
import express from "express";
import Stripe from "stripe";

import { migrate, q } from "./db.js";
import { GUEST_RANGES, TOURS, priceBooking, DEPOSIT_RATE } from "./tours.js";
import {
  customerSummaryMail,
  depositRequestMail,
  escapeHtml as esc,
  guideRequestMail,
  internalNotificationMail,
  mailConfigured,
  mailFrom,
  sendMail,
} from "./mail.js";
import {
  answerTag,
  dateLabel,
  dateShort,
  layout,
  money,
  standalone,
  statusTag,
} from "./ui.js";

const PORT = Number(process.env.PORT || 5001);
const SITE_URL = process.env.SITE_URL || "https://privatetourstallinn.com";
const CURRENCY = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "info@viabaltica.eu";
const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const app = express();
app.set("trust proxy", true);

/* ─────────────────────────  session  ───────────────────────── */

const sign = (value) =>
  crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");

function issueSession(res) {
  const issued = String(Date.now());
  const token = `${issued}.${sign(issued)}`;
  res.setHeader(
    "Set-Cookie",
    `bo_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`,
  );
}

function readCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((kv) => kv.length === 2)
      .map(([k, v]) => [k, decodeURIComponent(v)]),
  );
}

function isLoggedIn(req) {
  const token = readCookies(req).bo_session;
  if (!token) return false;
  const [issued, mac] = token.split(".");
  if (!issued || !mac) return false;
  const expected = sign(issued);
  if (
    mac.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  )
    return false;
  return Date.now() - Number(issued) < 12 * 60 * 60 * 1000;
}

function requireAuth(req, res, next) {
  if (isLoggedIn(req)) return next();
  return res.redirect("/admin/login");
}

/* ───────────────────  stripe webhook (raw body)  ─────────────────── */

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) return res.status(503).send("Stripe not configured");

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = secret
        ? stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            secret,
          )
        : JSON.parse(req.body.toString("utf8"));
    } catch (err) {
      console.error("webhook signature check failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      try {
        await onDepositPaid(event.data.object);
      } catch (err) {
        console.error("deposit handling failed:", err);
        return res.status(500).send("handler failed");
      }
    }

    res.json({ received: true });
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────  public booking API  ───────────────────── */

app.post("/api/bookings", async (req, res) => {
  try {
    const {
      ship_name,
      excursion_date,
      guests,
      tour,
      email,
      phone,
      notes,
      addons,
    } = req.body || {};

    const priced = priceBooking(tour, guests);
    if (!priced)
      return res.status(400).json({ error: "Unknown tour or guest range" });
    if (!ship_name || !excursion_date || !email || !phone)
      return res.status(400).json({ error: "Missing required fields" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(excursion_date))
      return res.status(400).json({ error: "Invalid date" });

    const ref = `TPT-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;
    const addonList = Array.isArray(addons) ? addons.slice(0, 10) : [];

    const { rows } = await q(
      `INSERT INTO bookings
         (ref, ship_name, excursion_date, guests_label, guests_count, tour_key,
          tour_label, tour_hours, price_pp_cents, total_cents, deposit_cents,
          currency, customer_email, customer_phone, addons, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        ref,
        String(ship_name).slice(0, 160),
        excursion_date,
        priced.range.label,
        priced.range.count,
        tour,
        priced.tour.label,
        priced.tour.hours,
        priced.pricePpCents,
        priced.totalCents,
        priced.depositCents,
        CURRENCY,
        String(email).slice(0, 200),
        String(phone).slice(0, 60),
        JSON.stringify(addonList),
        notes ? String(notes).slice(0, 2000) : null,
      ],
    );
    const booking = rows[0];

    if (!stripe) {
      return res.status(503).json({
        error: "Payments are not configured yet",
        ref: booking.ref,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customer_email,
      client_reference_id: booking.ref,
      metadata: { booking_id: String(booking.id), ref: booking.ref },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: booking.deposit_cents,
            product_data: {
              name: `Deposit 10% — ${priced.tour.label}`,
              description: `${priced.range.label} · ${dateShort(booking.excursion_date)} · total ${money(booking.total_cents, CURRENCY)}`,
            },
          },
        },
      ],
      success_url: `${SITE_URL}/booking/success?ref=${booking.ref}`,
      cancel_url: `${SITE_URL}/booking/cancelled?ref=${booking.ref}`,
    });

    await q(`UPDATE bookings SET stripe_session_id=$1 WHERE id=$2`, [
      session.id,
      booking.id,
    ]);

    // Customer summary, ops notification and guide requests. Detached: the
    // customer is on their way to Stripe and should not wait for SMTP.
    void dispatchBookingEmails(booking).catch((err) =>
      console.error("dispatch failed:", err),
    );

    res.json({
      ref: booking.ref,
      deposit: booking.deposit_cents,
      total: booking.total_cents,
      currency: CURRENCY,
      checkout_url: session.url,
    });
  } catch (err) {
    console.error("booking failed:", err);
    res.status(500).json({ error: "Could not create the booking" });
  }
});

/* ──────────  emails fired when the booking form is submitted  ────────── */

const fmtMoney = (cents, currency) => money(cents, currency);
const fmtDate = (value) => dateLabel(value);

/**
 * Customer summary, operations notification, and one availability request per
 * active guide. Runs detached from the HTTP response so the customer is not
 * held up on their way to Stripe Checkout.
 */
async function dispatchBookingEmails(booking) {
  if (!mailConfigured) {
    await q(
      `UPDATE bookings SET customer_mail='not_sent', internal_mail='not_sent' WHERE id=$1`,
      [booking.id],
    );
  } else {
    try {
      await sendMail({
        to: booking.customer_email,
        ...customerSummaryMail({ booking, fmtMoney, fmtDate }),
      });
      await q(`UPDATE bookings SET customer_mail='sent' WHERE id=$1`, [
        booking.id,
      ]);
    } catch (err) {
      console.error("customer mail failed:", err.message);
      await q(`UPDATE bookings SET customer_mail=$2 WHERE id=$1`, [
        booking.id,
        `failed: ${err.message}`.slice(0, 400),
      ]);
    }

    try {
      await sendMail({
        to: NOTIFY_EMAIL,
        ...internalNotificationMail({
          booking,
          fmtMoney,
          fmtDate,
          adminUrl: `${SITE_URL}/admin/bookings/${booking.id}`,
        }),
      });
      await q(`UPDATE bookings SET internal_mail='sent' WHERE id=$1`, [
        booking.id,
      ]);
    } catch (err) {
      console.error("internal mail failed:", err.message);
      await q(`UPDATE bookings SET internal_mail=$2 WHERE id=$1`, [
        booking.id,
        `failed: ${err.message}`.slice(0, 400),
      ]);
    }
  }

  // Guides are only asked once money is in — see askGuides().
  await askGuides(booking);
}

const PAID = new Set(["deposit_paid", "paid_in_full"]);

/**
 * One availability request per active guide. Refuses to run until the deposit
 * has been paid, and is safe to call more than once.
 */
async function askGuides(booking) {
  if (!PAID.has(booking.status)) {
    console.log(
      `guides not asked for ${booking.ref}: status is ${booking.status}`,
    );
    return { asked: 0, skipped: "unpaid" };
  }

  const guides = await q(
    `SELECT * FROM guides WHERE active ORDER BY first_name, last_name`,
  );
  for (const guide of guides.rows) {
    const token = crypto.randomBytes(24).toString("base64url");
    const inserted = await q(
      `INSERT INTO guide_requests (booking_id, guide_id, token)
       VALUES ($1,$2,$3)
       ON CONFLICT (booking_id, guide_id) DO NOTHING
       RETURNING *`,
      [booking.id, guide.id, token],
    );
    if (!inserted.rows.length) continue; // already asked
    await deliverGuideRequest(booking, guide, inserted.rows[0]);
  }
  return { asked: guides.rows.length };
}

/* ──────────  deposit paid → confirm, and cover any missed guide  ────────── */

async function onDepositPaid(session) {
  const bookingId = Number(session.metadata?.booking_id);
  if (!bookingId) return;

  const { rows } = await q(
    `UPDATE bookings
        SET status='deposit_paid', paid_at=now(), stripe_payment_id=$2
      WHERE id=$1 AND status <> 'deposit_paid'
      RETURNING *`,
    [bookingId, session.payment_intent || null],
  );
  if (!rows.length) return; // already handled — webhooks retry

  // Guides are asked on submission; this covers a guide added in between.
  await askGuides(rows[0]);
}

async function deliverGuideRequest(booking, guide, request) {
  const tour = TOURS[booking.tour_key] || {};
  const mail = guideRequestMail({
    guide,
    hours: booking.tour_hours,
    dateLabel: dateShort(booking.excursion_date),
    yesUrl: `${SITE_URL}/g/${request.token}/yes`,
    noUrl: `${SITE_URL}/g/${request.token}/no`,
    packageName: tour.package,
    tourLabel: booking.tour_label,
    itinerary: tour.itinerary || [],
    guestsLabel: booking.guests_label,
  });

  if (!mailConfigured) {
    await q(
      `UPDATE guide_requests SET mail_status='not_sent', mail_error=$2 WHERE id=$1`,
      [request.id, "RESEND_API_KEY missing — links available in backoffice"],
    );
    return;
  }

  try {
    await sendMail({ to: guide.email, ...mail });
    await q(
      `UPDATE guide_requests SET mail_status='sent', sent_at=now(), mail_error=NULL WHERE id=$1`,
      [request.id],
    );
  } catch (err) {
    console.error("guide mail failed:", guide.email, err.message);
    await q(
      `UPDATE guide_requests SET mail_status='failed', mail_error=$2 WHERE id=$1`,
      [request.id, err.message.slice(0, 400)],
    );
  }
}

/* ─────────────────  guide answer links (SI / NO)  ───────────────── */

app.get("/g/:token/:answer", async (req, res) => {
  const { token, answer } = req.params;
  if (!["yes", "no"].includes(answer)) return res.status(404).send("Not found");

  const { rows } = await q(
    `SELECT gr.*, g.first_name, g.last_name,
            b.ref, b.excursion_date, b.tour_hours, b.tour_label
       FROM guide_requests gr
       JOIN guides g   ON g.id = gr.guide_id
       JOIN bookings b ON b.id = gr.booking_id
      WHERE gr.token = $1`,
    [token],
  );
  if (!rows.length)
    return res.status(404).send(
      standalone({
        title: "Link not valid",
        body: `<div class="card"><h2>Link not valid</h2><p class="muted">This availability link does not exist or has been removed.</p></div>`,
      }),
    );

  const request = rows[0];
  const alreadySame = request.answer === answer;

  await q(
    `UPDATE guide_requests SET answer=$2, answered_at=now() WHERE id=$1`,
    [request.id, answer],
  );

  const yes = answer === "yes";
  res.send(
    standalone({
      title: yes ? "Availability confirmed" : "Availability declined",
      body: `<div class="card">
        <div class="eyebrow">Tallinn Private Tours</div>
        <h2>${yes ? "Grazie, disponibilità registrata." : "Grazie, risposta registrata."}</h2>
        <p style="margin-top:14px">Gentile ${esc(request.first_name)}, hai risposto
          <strong>${yes ? "SI" : "NO"}</strong> per l'escursione di
          <strong>${request.tour_hours} ore</strong> del
          <strong>${dateShort(request.excursion_date)}</strong>.</p>
        ${alreadySame ? '<p class="muted" style="margin-top:12px">(Questa risposta era già stata registrata.)</p>' : ""}
        <p class="muted" style="margin-top:18px">Puoi cambiare la risposta riaprendo l'altro link ricevuto per email.</p>
      </div>`,
    }),
  );
});

/* ───────────────────  customer return pages  ─────────────────── */

app.get("/booking/success", async (req, res) => {
  const ref = String(req.query.ref || "");
  const { rows } = await q(
    `SELECT * FROM bookings WHERE ref=$1`,
    [ref],
  );
  const booking = rows[0];
  res.send(
    standalone({
      title: "Booking received",
      body: `<div class="card">
        <div class="eyebrow">Tallinn Private Tours</div>
        <h2>Thank you — your deposit is in.</h2>
        ${
          booking
            ? `<dl class="kv" style="margin-top:20px">
                 <dt>Reference</dt><dd><code>${esc(booking.ref)}</code></dd>
                 <dt>Tour</dt><dd>${esc(booking.tour_label)}</dd>
                 <dt>Date</dt><dd>${dateLabel(booking.excursion_date)}</dd>
                 <dt>Guests</dt><dd>${esc(booking.guests_label)}</dd>
                 <dt>Deposit paid</dt><dd>${money(booking.deposit_cents, booking.currency)}</dd>
                 <dt>Balance due</dt><dd>${money(booking.total_cents - booking.deposit_cents, booking.currency)}</dd>
               </dl>`
            : ""
        }
        <p class="muted" style="margin-top:20px">We are confirming your guide now and will email you within 24 hours.</p>
        <p style="margin-top:24px"><a class="btn" href="${SITE_URL}">Back to the site</a></p>
      </div>`,
    }),
  );
});

app.get("/booking/cancelled", (req, res) => {
  res.send(
    standalone({
      title: "Payment cancelled",
      body: `<div class="card">
        <div class="eyebrow">Tallinn Private Tours</div>
        <h2>Payment cancelled</h2>
        <p class="muted" style="margin-top:14px">Nothing was charged. Your request is saved — you can pay the deposit whenever you are ready.</p>
        <p style="margin-top:24px"><a class="btn" href="${SITE_URL}#booking">Try again</a></p>
      </div>`,
    }),
  );
});

/* ────────────────────────  admin: auth  ──────────────────────── */

app.get("/admin/login", (req, res) => {
  if (isLoggedIn(req)) return res.redirect("/admin");
  const failed = req.query.e === "1";
  res.send(
    standalone({
      title: "Backoffice — sign in",
      body: `<form class="card" method="post" action="/admin/login">
        <div class="eyebrow">Tallinn Private Tours</div>
        <h2>Backoffice</h2>
        ${failed ? '<div class="note note-bad" style="margin-top:18px">Wrong username or password.</div>' : ""}
        <div style="margin-top:22px"><label>Username</label><input name="username" autocomplete="username" autofocus required></div>
        <div style="margin-top:18px"><label>Password</label><input type="password" name="password" autocomplete="current-password" required></div>
        <button class="btn btn-gold" style="margin-top:26px;width:100%;justify-content:center">Sign in</button>
      </form>`,
    }),
  );
});

app.post("/admin/login", (req, res) => {
  const { username = "", password = "" } = req.body || {};
  const ok =
    ADMIN_PASS &&
    username === ADMIN_USER &&
    password.length === ADMIN_PASS.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASS));
  if (!ok) return res.redirect("/admin/login?e=1");
  issueSession(res);
  res.redirect("/admin");
});

app.post("/admin/logout", (req, res) => {
  res.setHeader("Set-Cookie", "bo_session=; Path=/; Max-Age=0");
  res.redirect("/admin/login");
});

/* ──────────────────────  admin: bookings  ────────────────────── */

app.get("/admin", requireAuth, async (req, res) => {
  const bookings = await q(
    `SELECT b.*,
            count(gr.id)                                  AS asked,
            count(gr.id) FILTER (WHERE gr.answer='yes')   AS yes_count,
            count(gr.id) FILTER (WHERE gr.answer='no')    AS no_count
       FROM bookings b
       LEFT JOIN guide_requests gr ON gr.booking_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 200`,
  );

  const totals = await q(
    `SELECT count(*)::int AS all_count,
            count(*) FILTER (WHERE status='deposit_paid')::int AS paid_count,
            coalesce(sum(deposit_cents) FILTER (WHERE status='deposit_paid'),0)::int AS deposits,
            (SELECT count(*)::int FROM guides WHERE active) AS guides
       FROM bookings`,
  );
  const t = totals.rows[0];

  const rows = bookings.rows
    .map(
      (b) => `<tr>
      <td><a class="link" href="/admin/bookings/${b.id}">${esc(b.ref)}</a>
          <div class="muted">${dateShort(b.created_at)}</div></td>
      <td>${dateShort(b.excursion_date)}<div class="muted">${b.tour_hours}h</div></td>
      <td>${esc(b.tour_label)}<div class="muted">${esc(b.guests_label)} · ${esc(b.ship_name)}</div></td>
      <td><a class="link" href="mailto:${esc(b.customer_email)}">${esc(b.customer_email)}</a>
          <div class="muted">${esc(b.customer_phone)}</div></td>
      <td class="num">${money(b.deposit_cents, b.currency)}
          <div class="muted">of ${money(b.total_cents, b.currency)}</div></td>
      <td>${statusTag(b.status)}</td>
      <td>${
        Number(b.asked) === 0
          ? '<span class="muted">—</span>'
          : `<span class="tag tag-yes">${b.yes_count} yes</span>
             <span class="tag tag-no" style="margin-left:5px">${b.no_count} no</span>
             <div class="muted">${b.asked} asked</div>`
      }</td>
    </tr>`,
    )
    .join("");

  const body = `
    <div class="page-head">
      <div><div class="eyebrow">Backoffice</div><h1>Bookings</h1></div>
      <div style="display:flex;gap:10px">
        <a class="btn btn-ghost btn-sm" href="/admin">Refresh</a>
        <a class="btn btn-gold btn-sm" href="/admin/bookings/new">+ New booking</a>
      </div>
    </div>
    ${mailConfigured ? "" : `<div class="note note-bad"><strong>Email sending is off.</strong> Add <code>RESEND_API_KEY</code> to <code>.env</code> and restart the service. Availability requests are still created — open a booking to copy each guide's SI / NO link by hand.</div>`}
    <div class="stats">
      <div class="stat"><div class="stat-n">${t.all_count}</div><div class="stat-l">Bookings</div></div>
      <div class="stat"><div class="stat-n">${t.paid_count}</div><div class="stat-l">Deposits paid</div></div>
      <div class="stat"><div class="stat-n">${money(t.deposits, CURRENCY)}</div><div class="stat-l">Deposits collected</div></div>
      <div class="stat"><div class="stat-n">${t.guides}</div><div class="stat-l">Active guides</div></div>
    </div>
    ${
      bookings.rows.length
        ? `<table><thead><tr>
            <th>Reference</th><th>Excursion</th><th>Tour</th><th>Customer</th>
            <th>Deposit (10%)</th><th>Status</th><th>Guides</th>
           </tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">No bookings yet. They appear here as soon as a customer submits the form on the site.</div>`
    }`;

  res.send(layout({ title: "Bookings — Backoffice", tab: "bookings", body }));
});

/* ────────────────  admin: manual booking entry  ──────────────── */

app.get("/admin/bookings/new", requireAuth, (req, res) => {
  const tourOptions = Object.entries(TOURS)
    .map(
      ([key, t]) =>
        `<option value="${key}">${esc(t.label)} — $${t.pricePp}/pp</option>`,
    )
    .join("");
  const guestOptions = Object.entries(GUEST_RANGES)
    .map(([key, r]) => `<option value="${key}">${esc(r.label)}</option>`)
    .join("");

  const body = `
    <div class="page-head">
      <div><div class="eyebrow">Backoffice</div><h1>New booking</h1></div>
      <a class="btn btn-ghost btn-sm" href="/admin">← All bookings</a>
    </div>
    <form class="card" method="post" action="/admin/bookings">
      <h3>Excursion</h3>
      <div class="grid-form" style="margin-top:20px">
        <div><label>Cruise ship *</label><input name="ship_name" required></div>
        <div><label>Excursion date *</label><input type="date" name="excursion_date" required></div>
        <div><label>Guests *</label><select name="guests" required>${guestOptions}</select></div>
        <div><label>Tour *</label><select name="tour" required>${tourOptions}</select></div>
      </div>

      <h3 style="margin-top:34px">Customer</h3>
      <div class="grid-form" style="margin-top:20px">
        <div><label>Email *</label><input type="email" name="email" required></div>
        <div><label>Phone *</label><input name="phone" required></div>
        <div style="grid-column:span 2"><label>Notes</label><input name="notes" placeholder="dietary needs, mobility, interests…"></div>
      </div>

      <h3 style="margin-top:34px">Payment &amp; notifications</h3>
      <div class="grid-form" style="margin-top:20px">
        <div>
          <label>Payment state</label>
          <select name="status">
            <option value="awaiting_deposit">No payment yet</option>
            <option value="deposit_paid">Deposit (10%) paid</option>
            <option value="paid_in_full">Paid in full</option>
          </select>
        </div>
        <div style="grid-column:span 3;padding-bottom:9px">
          <label>Emails</label>
          <label style="text-transform:none;letter-spacing:0;font-size:14px;font-weight:400;color:#2B3A45">
            <input type="checkbox" name="notify" value="1" checked style="width:auto;margin-right:8px">
            Email the customer a summary, notify ${esc(NOTIFY_EMAIL)}, and ask every active guide for availability
          </label>
        </div>
      </div>

      <button class="btn btn-gold" style="margin-top:28px">Create booking</button>
    </form>`;

  res.send(layout({ title: "New booking — Backoffice", tab: "bookings", body }));
});

app.post("/admin/bookings", requireAuth, async (req, res) => {
  const {
    ship_name,
    excursion_date,
    guests,
    tour,
    email,
    phone,
    notes,
    status,
    notify,
  } = req.body || {};

  const priced = priceBooking(tour, guests);
  if (!priced || !ship_name || !excursion_date || !email || !phone)
    return res.redirect("/admin/bookings/new");

  const state = ["awaiting_deposit", "deposit_paid", "paid_in_full"].includes(
    status,
  )
    ? status
    : "awaiting_deposit";

  const ref = `TPT-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;
  const { rows } = await q(
    `INSERT INTO bookings
       (ref, ship_name, excursion_date, guests_label, guests_count, tour_key,
        tour_label, tour_hours, price_pp_cents, total_cents, deposit_cents,
        currency, customer_email, customer_phone, addons, notes, status, paid_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'[]'::jsonb,$15,$16,$17)
     RETURNING *`,
    [
      ref,
      String(ship_name).slice(0, 160),
      excursion_date,
      priced.range.label,
      priced.range.count,
      tour,
      priced.tour.label,
      priced.tour.hours,
      priced.pricePpCents,
      priced.totalCents,
      priced.depositCents,
      CURRENCY,
      String(email).trim().slice(0, 200),
      String(phone).trim().slice(0, 60),
      notes ? String(notes).slice(0, 2000) : "Added by hand in the backoffice",
      state,
      state === "awaiting_deposit" ? null : new Date(),
    ],
  );

  if (notify) {
    void dispatchBookingEmails(rows[0]).catch((err) =>
      console.error("manual dispatch failed:", err),
    );
  }

  res.redirect(`/admin/bookings/${rows[0].id}`);
});

app.get("/admin/bookings/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await q(`SELECT * FROM bookings WHERE id=$1`, [id]);
  if (!rows.length) return res.status(404).send("Not found");
  const b = rows[0];

  const requests = await q(
    `SELECT gr.*, g.first_name, g.last_name, g.email, g.phone
       FROM guide_requests gr
       JOIN guides g ON g.id = gr.guide_id
      WHERE gr.booking_id = $1
      ORDER BY (gr.answer='yes') DESC NULLS LAST, gr.answered_at NULLS LAST, g.first_name`,
    [id],
  );

  const addons = Array.isArray(b.addons) ? b.addons : [];
  const paid = PAID.has(b.status);

  const guideRows = requests.rows
    .map(
      (r) => `<tr>
        <td><strong>${esc(r.first_name)} ${esc(r.last_name)}</strong>
            <div class="muted">${esc(r.email)} · ${esc(r.phone)}</div></td>
        <td>${answerTag(r.answer)}${r.answered_at ? `<div class="muted">${dateShort(r.answered_at)}</div>` : ""}</td>
        <td>${
          r.mail_status === "sent"
            ? '<span class="muted">sent</span>'
            : r.mail_status === "failed"
              ? `<span class="tag tag-no">failed</span><div class="muted">${esc(r.mail_error || "")}</div>`
              : `<span class="tag tag-pending">${esc(r.mail_status)}</span>`
        }</td>
        <td class="muted"><code>${SITE_URL}/g/${esc(r.token)}/yes</code><br><code>${SITE_URL}/g/${esc(r.token)}/no</code></td>
      </tr>`,
    )
    .join("");

  const body = `
    <div class="page-head">
      <div><div class="eyebrow">Booking ${esc(b.ref)}</div><h1>${esc(b.tour_label)}</h1></div>
      <a class="btn btn-ghost btn-sm" href="/admin">← All bookings</a>
    </div>
    ${req.query.ok === "link" ? '<div class="note">Payment link emailed to the customer.</div>' : ""}
    ${req.query.e === "link" ? '<div class="note note-bad">Could not send the payment link — check the service logs.</div>' : ""}
    ${req.query.e === "cfg" ? '<div class="note note-bad">Stripe or Resend is not configured, so no link was sent.</div>' : ""}
    ${req.query.e === "unpaid" ? '<div class="note note-bad">Guides are asked only after the deposit is paid.</div>' : ""}

    <div class="grid2">
      <div class="card">
        <h3>Excursion</h3>
        <dl class="kv" style="margin-top:18px">
          <dt>Date</dt><dd>${dateLabel(b.excursion_date)}</dd>
          <dt>Duration</dt><dd>${b.tour_hours} hours</dd>
          <dt>Guests</dt><dd>${esc(b.guests_label)} <span class="muted">(priced for ${b.guests_count})</span></dd>
          <dt>Ship</dt><dd>${esc(b.ship_name)}</dd>
          <dt>Add-ons</dt><dd>${addons.length ? addons.map((a) => esc(a)).join("<br>") : '<span class="muted">none</span>'}</dd>
          <dt>Notes</dt><dd>${b.notes ? esc(b.notes) : '<span class="muted">none</span>'}</dd>
        </dl>
      </div>
      <div class="card">
        <h3>Customer &amp; payment</h3>
        <dl class="kv" style="margin-top:18px">
          <dt>Email</dt><dd><a class="link" href="mailto:${esc(b.customer_email)}">${esc(b.customer_email)}</a></dd>
          <dt>Phone</dt><dd>${esc(b.customer_phone)}</dd>
          <dt>Status</dt><dd>${statusTag(b.status)}</dd>
          <dt>Price / person</dt><dd>${money(b.price_pp_cents, b.currency)}</dd>
          <dt>Total</dt><dd>${money(b.total_cents, b.currency)}</dd>
          <dt>Deposit 10%</dt><dd><strong>${money(b.deposit_cents, b.currency)}</strong>${b.paid_at ? ` <span class="muted">paid ${dateShort(b.paid_at)}</span>` : ""}</dd>
          <dt>Balance</dt><dd>${money(b.total_cents - b.deposit_cents, b.currency)}</dd>
          <dt>Stripe</dt><dd class="muted"><code>${esc(b.stripe_payment_id || b.stripe_session_id || "—")}</code></dd>
        </dl>
        ${
          !paid && b.status !== "cancelled"
            ? `<form method="post" action="/admin/bookings/${b.id}/payment-link" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--line)">
                 <button class="btn btn-gold btn-sm">Email the deposit payment link</button>
                 <div class="muted" style="margin-top:10px">Sends ${esc(b.customer_email)} a Stripe checkout link for ${money(b.deposit_cents, b.currency)}. Valid 24 hours — press again to issue a new one.</div>
               </form>`
            : ""
        }
      </div>
    </div>

    <div class="card" style="margin-top:26px">
      <h3>${b.status === "cancelled" ? "This booking is cancelled" : "Cancel this booking"}</h3>
      ${
        b.status === "cancelled"
          ? `<p class="muted" style="margin-top:12px">Cancelled on ${dateShort(b.cancelled_at)}${b.cancel_reason ? ` — ${esc(b.cancel_reason)}` : ""}.</p>
             ${b.paid_at ? `<div class="note" style="margin-top:18px">A deposit of <strong>${money(b.deposit_cents, b.currency)}</strong> was collected. Refunds are not issued from here — do it in the Stripe dashboard on payment <code>${esc(b.stripe_payment_id || "—")}</code>.</div>` : ""}
             <form method="post" action="/admin/bookings/${b.id}/reopen" style="margin-top:18px">
               <button class="btn btn-ghost btn-sm">Reopen booking</button>
             </form>`
          : `<p class="muted" style="margin-top:10px">Works at any stage — unpaid, deposit paid or paid in full. The customer is not emailed automatically${b.paid_at ? ", and no money is refunded: issue the refund in Stripe" : ""}.</p>
             <form method="post" action="/admin/bookings/${b.id}/cancel" style="margin-top:20px"
                   onsubmit="return confirm('Cancel booking ${esc(b.ref)}?')">
               <label>Reason (optional)</label>
               <input name="reason" placeholder="e.g. ship skipped the port, customer changed plans">
               <button class="btn btn-danger btn-sm" style="margin-top:18px">Cancel booking</button>
             </form>`
      }
    </div>

    <div class="page-head" style="margin-top:44px">
      <div><div class="eyebrow">Availability</div><h2>Guide answers</h2></div>
      ${
        b.status === "cancelled" || !paid
          ? ""
          : `<form method="post" action="/admin/bookings/${b.id}/resend"><button class="btn btn-sm">${requests.rows.length ? "Re-send requests" : "Ask the guides now"}</button></form>`
      }
    </div>
    ${!paid && b.status !== "cancelled" ? '<div class="note">Guides are asked for availability only once the 10% deposit has been paid.</div>' : ""}
    ${
      requests.rows.length
        ? `<table><thead><tr><th>Guide</th><th>Answer</th><th>Email</th><th>Links</th></tr></thead><tbody>${guideRows}</tbody></table>`
        : `<div class="empty">${
            b.status === "deposit_paid"
              ? "No guides were on file when the deposit landed. Add guides, then use “Re-send requests”."
              : "Requests go out automatically once the 10% deposit is paid."
          }</div>`
    }`;

  res.send(
    layout({ title: `${b.ref} — Backoffice`, tab: "bookings", body }),
  );
});

app.post("/admin/bookings/:id/resend", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await q(`SELECT * FROM bookings WHERE id=$1`, [id]);
  if (!rows.length) return res.redirect("/admin");
  const booking = rows[0];

  // Availability requests require money in the door.
  if (!PAID.has(booking.status))
    return res.redirect(`/admin/bookings/${id}?e=unpaid`);

  const guides = await q(`SELECT * FROM guides WHERE active`);
  for (const guide of guides.rows) {
    const token = crypto.randomBytes(24).toString("base64url");
    const existing = await q(
      `INSERT INTO guide_requests (booking_id, guide_id, token)
       VALUES ($1,$2,$3)
       ON CONFLICT (booking_id, guide_id) DO UPDATE SET mail_status='pending'
       RETURNING *`,
      [booking.id, guide.id, token],
    );
    await deliverGuideRequest(booking, guide, existing.rows[0]);
  }
  res.redirect(`/admin/bookings/${id}`);
});

/** Email the customer a Stripe Checkout link for the 10% deposit. */
app.post("/admin/bookings/:id/payment-link", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await q(`SELECT * FROM bookings WHERE id=$1`, [id]);
  if (!rows.length) return res.redirect("/admin");
  const booking = rows[0];

  if (!stripe || !mailConfigured)
    return res.redirect(`/admin/bookings/${id}?e=cfg`);
  if (PAID.has(booking.status) || booking.status === "cancelled")
    return res.redirect(`/admin/bookings/${id}`);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customer_email,
      client_reference_id: booking.ref,
      metadata: { booking_id: String(booking.id), ref: booking.ref },
      expires_at: Math.floor(Date.now() / 1000) + 23 * 3600,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: booking.currency,
            unit_amount: booking.deposit_cents,
            product_data: {
              name: `Deposit 10% — ${booking.tour_label}`,
              description: `${booking.guests_label} · ${dateShort(booking.excursion_date)} · total ${money(booking.total_cents, booking.currency)}`,
            },
          },
        },
      ],
      success_url: `${SITE_URL}/booking/success?ref=${booking.ref}`,
      cancel_url: `${SITE_URL}/booking/cancelled?ref=${booking.ref}`,
    });

    await sendMail({
      to: booking.customer_email,
      ...depositRequestMail({
        booking,
        payUrl: session.url,
        fmtMoney,
        fmtDate,
      }),
    });

    await q(
      `UPDATE bookings SET stripe_session_id=$2, customer_mail='deposit link sent' WHERE id=$1`,
      [booking.id, session.id],
    );
    res.redirect(`/admin/bookings/${id}?ok=link`);
  } catch (err) {
    console.error("payment link failed:", err.message);
    res.redirect(`/admin/bookings/${id}?e=link`);
  }
});

app.post("/admin/bookings/:id/cancel", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await q(
    `UPDATE bookings
        SET status_before_cancel = CASE WHEN status <> 'cancelled' THEN status ELSE status_before_cancel END,
            status='cancelled', cancelled_at=now(), cancel_reason=$2
      WHERE id=$1`,
    [id, req.body?.reason ? String(req.body.reason).slice(0, 400) : null],
  );
  res.redirect(`/admin/bookings/${id}`);
});

app.post("/admin/bookings/:id/reopen", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await q(
    `UPDATE bookings
        SET status = coalesce(status_before_cancel, 'awaiting_deposit'),
            cancelled_at=NULL, cancel_reason=NULL, status_before_cancel=NULL
      WHERE id=$1 AND status='cancelled'`,
    [id],
  );
  res.redirect(`/admin/bookings/${id}`);
});

/* ───────────────────────  admin: guides  ─────────────────────── */

app.get("/admin/guides", requireAuth, async (req, res) => {
  const guides = await q(
    `SELECT g.*,
            count(gr.id) FILTER (WHERE gr.answer='yes')::int AS accepted
       FROM guides g
       LEFT JOIN guide_requests gr ON gr.guide_id = g.id
      GROUP BY g.id
      ORDER BY g.active DESC, g.first_name, g.last_name`,
  );

  const editing = Number(req.query.edit || 0);

  const rows = guides.rows
    .map((g) =>
      g.id === editing
        ? `<tr><td colspan="6" style="background:rgba(227,172,75,.07)">
             <form method="post" action="/admin/guides/${g.id}">
               <div class="grid-form">
                 <div><label>First name</label><input name="first_name" value="${esc(g.first_name)}" required></div>
                 <div><label>Last name</label><input name="last_name" value="${esc(g.last_name)}" required></div>
                 <div><label>Mobile</label><input name="phone" value="${esc(g.phone)}" required></div>
                 <div><label>Email</label><input type="email" name="email" value="${esc(g.email)}" required></div>
               </div>
               <div style="margin-top:18px;display:flex;gap:10px">
                 <button class="btn btn-gold btn-sm">Save changes</button>
                 <a class="btn btn-ghost btn-sm" href="/admin/guides">Cancel</a>
               </div>
             </form></td></tr>`
        : `<tr>
      <td><strong>${esc(g.first_name)} ${esc(g.last_name)}</strong></td>
      <td><a class="link" href="mailto:${esc(g.email)}">${esc(g.email)}</a></td>
      <td>${esc(g.phone)}</td>
      <td>${g.active ? '<span class="tag tag-paid">Active</span>' : '<span class="tag tag-pending">Paused</span>'}</td>
      <td class="num">${g.accepted}</td>
      <td style="white-space:nowrap">
        <a class="btn btn-ghost btn-sm" href="/admin/guides?edit=${g.id}">Edit</a>
        <form method="post" action="/admin/guides/${g.id}/toggle" style="display:inline">
          <button class="btn btn-ghost btn-sm">${g.active ? "Pause" : "Activate"}</button>
        </form>
        <form method="post" action="/admin/guides/${g.id}/delete" style="display:inline"
              onsubmit="return confirm('Remove ${esc(g.first_name)} ${esc(g.last_name)}? Their answers are removed too.')">
          <button class="btn btn-danger btn-sm">Remove</button>
        </form>
      </td>
    </tr>`,
    )
    .join("");

  const body = `
    <div class="page-head">
      <div><div class="eyebrow">Backoffice</div><h1>Tour guides</h1></div>
    </div>
    ${req.query.e === "dup" ? '<div class="note note-bad">That email is already on the list.</div>' : ""}
    <form class="card" method="post" action="/admin/guides" style="margin-bottom:30px">
      <h3>Add a guide</h3>
      <div class="grid-form" style="margin-top:20px">
        <div><label>First name</label><input name="first_name" required></div>
        <div><label>Last name</label><input name="last_name" required></div>
        <div><label>Mobile</label><input name="phone" placeholder="+372 …" required></div>
        <div><label>Email</label><input type="email" name="email" required></div>
      </div>
      <button class="btn btn-gold" style="margin-top:24px">Add guide</button>
    </form>
    ${
      guides.rows.length
        ? `<table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Status</th><th>Jobs accepted</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">No guides yet. Add the first one above — availability requests go to every active guide.</div>`
    }`;

  res.send(layout({ title: "Guides — Backoffice", tab: "guides", body }));
});

app.post("/admin/guides", requireAuth, async (req, res) => {
  const { first_name, last_name, phone, email } = req.body || {};
  if (!first_name || !last_name || !phone || !email)
    return res.redirect("/admin/guides");
  try {
    await q(
      `INSERT INTO guides (first_name, last_name, phone, email)
       VALUES ($1,$2,$3,$4)`,
      [
        String(first_name).trim().slice(0, 80),
        String(last_name).trim().slice(0, 80),
        String(phone).trim().slice(0, 40),
        String(email).trim().toLowerCase().slice(0, 200),
      ],
    );
  } catch (err) {
    if (err.code === "23505") return res.redirect("/admin/guides?e=dup");
    throw err;
  }
  res.redirect("/admin/guides");
});

app.post("/admin/guides/:id", requireAuth, async (req, res) => {
  const { first_name, last_name, phone, email } = req.body || {};
  if (!first_name || !last_name || !phone || !email)
    return res.redirect("/admin/guides");
  try {
    await q(
      `UPDATE guides SET first_name=$2, last_name=$3, phone=$4, email=$5 WHERE id=$1`,
      [
        Number(req.params.id),
        String(first_name).trim().slice(0, 80),
        String(last_name).trim().slice(0, 80),
        String(phone).trim().slice(0, 40),
        String(email).trim().toLowerCase().slice(0, 200),
      ],
    );
  } catch (err) {
    if (err.code === "23505")
      return res.redirect(`/admin/guides?edit=${req.params.id}&e=dup`);
    throw err;
  }
  res.redirect("/admin/guides");
});

app.post("/admin/guides/:id/toggle", requireAuth, async (req, res) => {
  await q(`UPDATE guides SET active = NOT active WHERE id=$1`, [
    Number(req.params.id),
  ]);
  res.redirect("/admin/guides");
});

app.post("/admin/guides/:id/delete", requireAuth, async (req, res) => {
  await q(`DELETE FROM guides WHERE id=$1`, [Number(req.params.id)]);
  res.redirect("/admin/guides");
});

/* ────────────────────────────  misc  ──────────────────────────── */

app.get("/api/health", async (req, res) => {
  try {
    await q("SELECT 1");
    res.json({
      ok: true,
      stripe: Boolean(stripe),
      mail: mailConfigured ? mailFrom : false,
      currency: CURRENCY,
      depositRate: DEPOSIT_RATE,
      tours: Object.keys(TOURS),
      guestRanges: Object.keys(GUEST_RANGES),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error("unhandled:", err);
  if (res.headersSent) return next(err);
  res.status(500).send("Internal error");
});

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `backoffice on :${PORT} — stripe=${Boolean(stripe)} mail=${mailConfigured}`,
      );
    });
  })
  .catch((err) => {
    console.error("migration failed:", err);
    process.exit(1);
  });
