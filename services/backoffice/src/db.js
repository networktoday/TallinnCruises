import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const q = (text, params) => pool.query(text, params);

/**
 * Idempotent schema bootstrap. Runs on every boot: the database lives on the
 * internal docker network, so drizzle-kit push from the host cannot reach it.
 */
export async function migrate() {
  await q(`
    CREATE TABLE IF NOT EXISTS guides (
      id          serial PRIMARY KEY,
      first_name  text NOT NULL,
      last_name   text NOT NULL,
      phone       text NOT NULL,
      email       text NOT NULL UNIQUE,
      active      boolean NOT NULL DEFAULT true,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                serial PRIMARY KEY,
      ref               text NOT NULL UNIQUE,
      ship_name         text NOT NULL,
      excursion_date    date NOT NULL,
      guests_label      text NOT NULL,
      guests_count      integer NOT NULL,
      tour_key          text NOT NULL,
      tour_label        text NOT NULL,
      tour_hours        integer NOT NULL,
      price_pp_cents    integer NOT NULL,
      total_cents       integer NOT NULL,
      deposit_cents     integer NOT NULL,
      currency          text NOT NULL,
      customer_email    text NOT NULL,
      customer_phone    text NOT NULL,
      addons            jsonb NOT NULL DEFAULT '[]'::jsonb,
      notes             text,
      status            text NOT NULL DEFAULT 'awaiting_deposit',
      stripe_session_id text,
      stripe_payment_id text,
      created_at        timestamptz NOT NULL DEFAULT now(),
      paid_at           timestamptz
    );
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS guide_requests (
      id           serial PRIMARY KEY,
      booking_id   integer NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      guide_id     integer NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
      token        text NOT NULL UNIQUE,
      answer       text,
      answered_at  timestamptz,
      mail_status  text NOT NULL DEFAULT 'pending',
      mail_error   text,
      sent_at      timestamptz,
      created_at   timestamptz NOT NULL DEFAULT now(),
      UNIQUE (booking_id, guide_id)
    );
  `);

  await q(
    `CREATE INDEX IF NOT EXISTS guide_requests_booking_idx ON guide_requests (booking_id);`,
  );

  // Delivery state of the two transactional emails sent on submission.
  await q(
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_mail text NOT NULL DEFAULT 'pending';`,
  );
  await q(
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_mail text NOT NULL DEFAULT 'pending';`,
  );

  // Cancellation is a bookkeeping state: refunds stay a manual Stripe action.
  await q(
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;`,
  );
  await q(
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason text;`,
  );
  await q(
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status_before_cancel text;`,
  );
}
