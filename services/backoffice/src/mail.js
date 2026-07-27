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
export function guideRequestMail({ guide, hours, dateLabel, yesUrl, noUrl }) {
  const text = [
    `Gentile ${guide.first_name},`,
    `sei disponibile per fare una guida di ${hours} ore per il giorno ${dateLabel} ?`,
    "",
    "Rispondere: SI oppure NO",
    "",
    `SI  -> ${yesUrl}`,
    `NO  -> ${noUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1b2b38;line-height:1.6">
  <p>Gentile ${escapeHtml(guide.first_name)},</p>
  <p>sei disponibile per fare una guida di <strong>${hours} ore</strong> per il giorno <strong>${escapeHtml(dateLabel)}</strong> ?</p>
  <p>Rispondere: SI oppure NO</p>
  <p style="margin:26px 0">
    <a href="${yesUrl}" style="background:#0d7a4f;color:#fff;text-decoration:none;padding:13px 34px;font-weight:bold;display:inline-block">SI</a>
    <a href="${noUrl}" style="background:#8d2f2f;color:#fff;text-decoration:none;padding:13px 34px;font-weight:bold;display:inline-block;margin-left:12px">NO</a>
  </p>
  <p style="font-size:12px;color:#6b7885">Tallinn Private Tours</p>
</div>`;

  return {
    subject: `Disponibilità guida — ${dateLabel} (${hours} ore)`,
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

/** Operations notification with everything needed to act on the booking. */
export function internalNotificationMail({ booking, fmtMoney, fmtDate, adminUrl }) {
  const addons = Array.isArray(booking.addons) ? booking.addons : [];
  const pairs = [
    ["Reference", booking.ref],
    ["Tour", booking.tour_label],
    ["Date", fmtDate(booking.excursion_date)],
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
