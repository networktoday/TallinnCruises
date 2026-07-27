import { escapeHtml as e } from "./mail.js";

export { e as escapeHtml };

const STYLE = `
  :root{
    --ink:#0C2032; --ink-soft:#16354B; --paper:#FAF7F1; --card:#fff;
    --gold:#E3AC4B; --gold-deep:#9C7328; --line:rgba(12,32,50,.12);
    --line-soft:rgba(12,32,50,.07); --muted:#616F7A;
    --ok:#0D7A4F; --no:#9B3232; --wait:#9C7328;
    --serif:'Playfair Display',Georgia,serif; --sans:'Figtree',system-ui,sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--sans);background:var(--paper);color:#2B3A45;font-size:15px;line-height:1.6}
  a{color:inherit}
  h1,h2,h3{font-family:var(--serif);color:var(--ink);font-weight:700;line-height:1.15}
  h1{font-size:30px}h2{font-size:23px}h3{font-size:19px}
  .wrap{max-width:1180px;margin:0 auto;padding:0 26px}
  header.top{background:#FCFAF6;border-bottom:1px solid var(--line-soft);position:sticky;top:0;z-index:10}
  .top-in{display:flex;align-items:center;justify-content:space-between;gap:24px;height:70px}
  .brand{font-family:var(--sans);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:18px;color:var(--ink)}
  .brand small{display:block;font-size:9.5px;letter-spacing:.2em;color:var(--gold-deep);font-weight:600;margin-top:3px}
  nav.tabs{display:flex;gap:26px}
  nav.tabs a{font-size:12.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);text-decoration:none;padding:6px 0;border-bottom:2px solid transparent}
  nav.tabs a.on{color:var(--ink);border-bottom-color:var(--gold)}
  main{padding:38px 0 70px}
  .page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:26px;padding-bottom:18px;border-bottom:1px solid var(--line)}
  .eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:8px}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}
  th{text-align:left;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:13px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
  td{padding:14px;border-bottom:1px solid var(--line-soft);vertical-align:top}
  tr:last-child td{border-bottom:none}
  .num{font-family:var(--serif);font-weight:700;color:var(--ink)}
  .muted{color:var(--muted);font-size:13px}
  .tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:4px 9px;border:1px solid var(--line)}
  .tag-paid{color:var(--ok);border-color:rgba(13,122,79,.45);background:rgba(13,122,79,.07)}
  .tag-wait{color:var(--wait);border-color:rgba(156,115,40,.45);background:rgba(156,115,40,.07)}
  .tag-yes{color:#fff;background:var(--ok);border-color:var(--ok)}
  .tag-no{color:#fff;background:var(--no);border-color:var(--no)}
  .tag-pending{color:var(--muted)}
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#fff;border:1px solid var(--ink);padding:11px 20px;font-size:13.5px;font-weight:600;cursor:pointer;text-decoration:none;border-radius:2px}
  .btn:hover{background:var(--ink-soft)}
  .btn-gold{background:var(--gold);border-color:var(--gold);color:var(--ink)}
  .btn-ghost{background:transparent;color:var(--ink);border-color:var(--line)}
  .btn-sm{padding:7px 13px;font-size:12px}
  .btn-danger{background:transparent;border-color:rgba(155,50,50,.4);color:var(--no)}
  .card{background:var(--card);border:1px solid var(--line);padding:26px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:26px}
  .grid-form{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:end}
  label{display:block;font-size:10.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
  input,select,textarea{width:100%;font:inherit;color:var(--ink);background:transparent;border:none;border-bottom:1px solid var(--line);padding:9px 0;border-radius:0}
  input:focus,select,textarea:focus{outline:none;border-bottom-color:var(--gold)}
  .kv{display:grid;grid-template-columns:auto 1fr;gap:10px 20px;font-size:14px}
  .kv dt{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);padding-top:3px}
  .kv dd{color:var(--ink)}
  .note{border-left:3px solid var(--gold);background:rgba(227,172,75,.09);padding:14px 18px;font-size:13.5px;margin-bottom:24px}
  .note-bad{border-left-color:var(--no);background:rgba(155,50,50,.07)}
  .empty{padding:44px;text-align:center;color:var(--muted);background:var(--card);border:1px dashed var(--line)}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--line);background:var(--card);margin-bottom:30px}
  .stat{padding:20px 22px;border-right:1px solid var(--line)}
  .stat:last-child{border-right:none}
  .stat-n{font-family:var(--serif);font-size:27px;font-weight:700;color:var(--ink);line-height:1}
  .stat-l{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:6px}
  .link{color:var(--gold-deep);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(156,115,40,.35)}
  code{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:rgba(12,32,50,.05);padding:2px 6px;word-break:break-all}
  .center{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:30px}
  .center .card{width:100%;max-width:420px}
  @media(max-width:900px){.grid2,.grid-form,.stats{grid-template-columns:1fr}.stat{border-right:none;border-bottom:1px solid var(--line)}}
`;

function head(title) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${e(title)}</title>
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body>`;
}

export function layout({ title, tab, body }) {
  const link = (href, label, key) =>
    `<a href="${href}"${tab === key ? ' class="on"' : ""}>${label}</a>`;
  return `${head(title)}
<header class="top"><div class="wrap"><div class="top-in">
  <div class="brand">Tallinn <small>Private Tours · Backoffice</small></div>
  <nav class="tabs">
    ${link("/admin", "Bookings", "bookings")}
    ${link("/admin/guides", "Guides", "guides")}
    <a href="https://privatetourstallinn.com" target="_blank" rel="noopener">Site ↗</a>
  </nav>
  <form method="post" action="/admin/logout"><button class="btn btn-ghost btn-sm">Log out</button></form>
</div></div></header>
<main><div class="wrap">${body}</div></main>
</body></html>`;
}

export function standalone({ title, body }) {
  return `${head(title)}<div class="center">${body}</div></body></html>`;
}

export const money = (cents, currency) =>
  `${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(currency).toUpperCase()}`;

export const dateLabel = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const dateShort = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function answerTag(answer) {
  if (answer === "yes") return '<span class="tag tag-yes">Available</span>';
  if (answer === "no") return '<span class="tag tag-no">Declined</span>';
  return '<span class="tag tag-pending">No reply</span>';
}

export function statusTag(status) {
  if (status === "deposit_paid")
    return '<span class="tag tag-paid">Deposit paid</span>';
  if (status === "paid_in_full")
    return '<span class="tag tag-paid">Paid in full</span>';
  if (status === "cancelled")
    return '<span class="tag tag-no">Cancelled</span>';
  return '<span class="tag tag-wait">Awaiting deposit</span>';
}
