/**
 * Email delivery through the Resend HTTP API (https://resend.com).
 * RESEND_API_KEY is read from the environment; MAIL_FROM must be an address on
 * a domain verified in the Resend dashboard.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export const mailConfigured = Boolean(process.env.RESEND_API_KEY);

export const mailFrom =
  process.env.MAIL_FROM || "Tallinn Private Tours <onboarding@resend.dev>";

export async function sendMail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: mailFrom, to: [to], subject, text, html }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = payload?.message || payload?.error || res.statusText;
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return payload;
}

/**
 * Availability request sent to every guide. The wording is fixed by the client;
 * SI / NO are links carrying the request token.
 */
export function guideRequestMail({
  guide,
  hours,
  dateLabel,
  yesUrl,
  noUrl,
  packageName,
  tourLabel,
  itinerary = [],
  guestsLabel,
  startTime,
}) {
  const text = [
    `Gentile ${guide.first_name},`,
    `sei disponibile per fare una guida di ${hours} ore per il giorno ${dateLabel} con inizio alle ${startTime || "orario da confermare"} ?`,
    "",
    "Rispondere: SI oppure NO",
    "",
    `SI  -> ${yesUrl}`,
    `NO  -> ${noUrl}`,
    "",
    "— Dettagli dell'escursione —",
    `Orario di inizio: ${startTime || "da confermare"}`,
    `Pacchetto scelto: ${packageName || tourLabel}`,
    `Tour: ${tourLabel}`,
    guestsLabel ? `Partecipanti: ${guestsLabel}` : null,
    "",
    "Itinerario incluso:",
    ...itinerary.map((step) => `  · ${step}`),
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `<!doctype html>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1b2b38;line-height:1.6;max-width:620px">
  <p>Gentile ${escapeHtml(guide.first_name)},</p>
  <p>sei disponibile per fare una guida di <strong>${hours} ore</strong> per il giorno <strong>${escapeHtml(dateLabel)}</strong> con inizio alle <strong>${escapeHtml(startTime || "orario da confermare")}</strong> ?</p>
  <p>Rispondere: SI oppure NO</p>
  <p style="margin:26px 0">
    <a href="${yesUrl}" style="background:#0d7a4f;color:#fff;text-decoration:none;padding:13px 34px;font-weight:bold;display:inline-block">SI</a>
    <a href="${noUrl}" style="background:#8d2f2f;color:#fff;text-decoration:none;padding:13px 34px;font-weight:bold;display:inline-block;margin-left:12px">NO</a>
  </p>

  <div style="border-top:1px solid #e2ddd2;margin-top:30px;padding-top:22px">
    <p style="margin:0 0 12px;font-size:11px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;color:#9C7328">Dettagli dell'escursione</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:5px 18px 5px 0;color:#6b7885;font-size:13px">Pacchetto scelto</td><td style="padding:5px 0"><strong>${escapeHtml(packageName || tourLabel)}</strong></td></tr>
      <tr><td style="padding:5px 18px 5px 0;color:#6b7885;font-size:13px">Tour</td><td style="padding:5px 0">${escapeHtml(tourLabel)}</td></tr>
      ${guestsLabel ? `<tr><td style="padding:5px 18px 5px 0;color:#6b7885;font-size:13px">Partecipanti</td><td style="padding:5px 0">${escapeHtml(guestsLabel)}</td></tr>` : ""}
      <tr><td style="padding:5px 18px 5px 0;color:#6b7885;font-size:13px">Orario di inizio</td><td style="padding:5px 0"><strong>${startTime || "da confermare"}</strong></td></tr>
      <tr><td style="padding:5px 18px 5px 0;color:#6b7885;font-size:13px">Durata</td><td style="padding:5px 0">${hours} ore</td></tr>
    </table>

    <p style="margin:20px 0 8px;font-size:13px;color:#6b7885">Itinerario incluso nel pacchetto:</p>
    <ul style="margin:0;padding-left:20px">
      ${itinerary.map((step) => `<li style="margin-bottom:6px">${escapeHtml(step)}</li>`).join("")}
    </ul>
  </div>

  <p style="margin-top:28px;font-size:12px;color:#6b7885">Tallinn Private Tours</p>
</div>`;

  return {
    subject: `Disponibilità guida — ${dateLabel} · ${packageName || tourLabel} (${hours} ore)`,
    text,
    html,
  };
}

const wrap = (inner) => `<!doctype html>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1b2b38;line-height:1.65;max-width:620px">
${inner}
<p style="margin-top:30px;padding-top:16px;border-top:1px solid #e2ddd2;font-size:12px;color:#6b7885">
  Tallinn Private Tours · privatetourstallinn.com
</p></div>`;

const rows = (pairs) =>
  pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 18px 6px 0;color:#6b7885;font-size:13px;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join("");

/** Summary sent to the customer as soon as the request is submitted. */
export function customerSummaryMail({ booking, fmtMoney, fmtDate }) {
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
    ["Start time", booking.start_time || "to confirm"],
    ["Duration", `${booking.tour_hours} hours`],
    ["Guests", booking.guests_label],
    ["Cruise ship", booking.ship_name],
    ["Total", fmtMoney(booking.total_cents, booking.currency)],
    ["Deposit (10%)", fmtMoney(booking.deposit_cents, booking.currency)],
    [
      "Balance on the day",
      fmtMoney(booking.total_cents - booking.deposit_cents, booking.currency),
    ],
  ];

  return {
    subject: `Your Tallinn private tour — request ${booking.ref}`,
    text: [
      `Thank you for your booking request.`,
      ``,
      ...pairs.map(([k, v]) => `${k}: ${v}`),
      ``,
      `We are confirming your guide now and will email you within 24 hours.`,
      `Tallinn Private Tours`,
    ].join("\n"),
    html: wrap(`<p>Thank you for your booking request — here is a summary.</p>
      <table style="border-collapse:collapse;margin:22px 0">${rows(pairs)}</table>
      <p>We are confirming your guide now and will email you within 24 hours.</p>`),
  };
}

/** Deposit payment request, sent on demand from the backoffice. */
export function depositRequestMail({ booking, payUrl, fmtMoney, fmtDate }) {
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
    ["Start time", booking.start_time || "to confirm"],
    ["Guests", booking.guests_label],
    ["Total", fmtMoney(booking.total_cents, booking.currency)],
    ["Deposit to pay now (10%)", fmtMoney(booking.deposit_cents, booking.currency)],
    [
      "Balance on the day",
      fmtMoney(booking.total_cents - booking.deposit_cents, booking.currency),
    ],
  ];

  return {
    subject: `Confirm your Tallinn tour — pay the ${fmtMoney(booking.deposit_cents, booking.currency)} deposit`,
    text: [
      `Your private tour is reserved. To confirm it, please pay the 10% deposit:`,
      payUrl,
      ``,
      ...pairs.map(([k, v]) => `${k}: ${v}`),
      ``,
      `The payment link stays valid for 24 hours — reply to this email if it expires.`,
      `Tallinn Private Tours`,
    ].join("\n"),
    html: wrap(`<p>Your private tour is reserved. To confirm it, please pay the 10% deposit.</p>
      <p style="margin:26px 0">
        <a href="${payUrl}" style="background:#0C2032;color:#fff;text-decoration:none;padding:14px 32px;font-weight:bold;display:inline-block">Pay the deposit</a>
      </p>
      <table style="border-collapse:collapse;margin:22px 0">${rows(pairs)}</table>
      <p style="font-size:13px;color:#6b7885">The payment link stays valid for 24 hours — reply to this email if it expires.</p>`),
  };
}

/**
 * Sent to the customer once enough guides have confirmed: the tour is on,
 * paying the balance completes the booking.
 */
export function balanceRequestMail({ booking, payUrl, fmtMoney, fmtDate }) {
  const balance = booking.total_cents - booking.deposit_cents;
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
    ["Start time", booking.start_time || "to confirm"],
    ["Guests", booking.guests_label],
    ["Total", fmtMoney(booking.total_cents, booking.currency)],
    ["Deposit already paid", fmtMoney(booking.deposit_cents, booking.currency)],
    ["Balance to pay now", fmtMoney(balance, booking.currency)],
  ];

  return {
    subject: `Your guide is confirmed — settle the balance to finalise ${booking.ref}`,
    text: [
      `Good news: your private Tallinn tour has a confirmed guide.`,
      ``,
      `Pay the remaining balance and your booking is fully confirmed:`,
      payUrl,
      ``,
      ...pairs.map(([k, v]) => `${k}: ${v}`),
      ``,
      `The payment link stays valid for 24 hours — reply to this email if it expires.`,
      `Tallinn Private Tours`,
    ].join("\n"),
    html: wrap(`<p><strong>Good news: your private Tallinn tour has a confirmed guide.</strong></p>
      <p>Pay the remaining balance and your booking is fully confirmed.</p>
      <p style="margin:26px 0">
        <a href="${payUrl}" style="background:#0C2032;color:#fff;text-decoration:none;padding:14px 32px;font-weight:bold;display:inline-block">Pay the balance</a>
      </p>
      <table style="border-collapse:collapse;margin:22px 0">${rows(pairs)}</table>
      <p style="font-size:13px;color:#6b7885">The payment link stays valid for 24 hours — reply to this email if it expires.</p>`),
  };
}

/** Ops alert: enough guides said yes, the customer has been asked to settle. */
export function guidesConfirmedMail({
  booking,
  guides,
  fmtMoney,
  fmtDate,
  adminUrl,
}) {
  const balance = booking.total_cents - booking.deposit_cents;
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
    ["Start time", booking.start_time || "to confirm"],
    ["Duration", `${booking.tour_hours} hours`],
    ["Guests", `${booking.guests_label} (priced for ${booking.guests_count})`],
    ["Cruise ship", booking.ship_name],
    ["Customer", `${booking.customer_email} · ${booking.customer_phone}`],
    ["Total", fmtMoney(booking.total_cents, booking.currency)],
    ["Deposit paid", fmtMoney(booking.deposit_cents, booking.currency)],
    ["Balance requested", fmtMoney(balance, booking.currency)],
    ["Notes", booking.notes || "none"],
  ];

  const list = guides
    .map((g) => `${g.first_name} ${g.last_name} (${g.email} · ${g.phone})`)
    .join("\n  · ");

  return {
    subject: `${guides.length} guides available — ${booking.ref} on ${fmtDate(booking.excursion_date)}`,
    text: [
      `${guides.length} guides confirmed availability for this excursion.`,
      ``,
      `Guides who said SI:`,
      `  · ${list}`,
      ``,
      ...pairs.map(([k, v]) => `${k}: ${v}`),
      ``,
      `The customer has been emailed a Stripe link for the balance.`,
      `Backoffice: ${adminUrl}`,
    ].join("\n"),
    html: wrap(`<p><strong>${guides.length} guides confirmed availability for this excursion.</strong></p>
      <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;color:#9C7328">Guides who said SI</p>
      <ul style="margin:0 0 22px;padding-left:20px">
        ${guides.map((g) => `<li style="margin-bottom:6px">${escapeHtml(`${g.first_name} ${g.last_name}`)} — ${escapeHtml(g.email)} · ${escapeHtml(g.phone)}</li>`).join("")}
      </ul>
      <table style="border-collapse:collapse;margin:0 0 22px">${rows(pairs)}</table>
      <p>The customer has been emailed a Stripe link for the balance.</p>
      <p><a href="${adminUrl}" style="background:#0C2032;color:#fff;text-decoration:none;padding:12px 26px;display:inline-block">Open in the backoffice</a></p>`),
  };
}

/** Operations notification with everything needed to act on the booking. */
export function internalNotificationMail({ booking, fmtMoney, fmtDate, adminUrl }) {
  const addons = Array.isArray(booking.addons) ? booking.addons : [];
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
    ["Start time", booking.start_time || "to confirm"],
    ["Duration", `${booking.tour_hours} hours`],
    ["Guests", `${booking.guests_label} (priced for ${booking.guests_count})`],
    ["Cruise ship", booking.ship_name],
    ["Email", booking.customer_email],
    ["Phone", booking.customer_phone],
    ["Total", fmtMoney(booking.total_cents, booking.currency)],
    ["Deposit (10%)", fmtMoney(booking.deposit_cents, booking.currency)],
    ["Add-ons", addons.length ? addons.join(", ") : "none"],
    ["Notes", booking.notes || "none"],
  ];

  return {
    subject: `New booking ${booking.ref} — ${fmtDate(booking.excursion_date)} (${booking.tour_hours}h)`,
    text: [
      `New booking request from the site.`,
      ``,
      ...pairs.map(([k, v]) => `${k}: ${v}`),
      ``,
      `Backoffice: ${adminUrl}`,
    ].join("\n"),
    html: wrap(`<p><strong>New booking request from the site.</strong></p>
      <table style="border-collapse:collapse;margin:22px 0">${rows(pairs)}</table>
      <p><a href="${adminUrl}" style="background:#0C2032;color:#fff;text-decoration:none;padding:12px 26px;display:inline-block">Open in the backoffice</a></p>`),
  };
}

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}
