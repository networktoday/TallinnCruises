/** Catalogue mirrored from the public site's tour cards. */
export const TOURS = {
  classic: {
    label: "Old Town Walking Tour — Classic Essential (3h)",
    hours: 3,
    pricePp: 89,
  },
  signature: {
    label: "Best of Tallinn Shore Excursion — Signature Tour (6h)",
    hours: 6,
    pricePp: 149,
  },
  complete: {
    label: "Old Town, Kadriorg & Pirita — Most Complete (8h)",
    hours: 8,
    pricePp: 179,
  },
  original: {
    label: "Hidden Stories & Local Life — Most Original (4h)",
    hours: 4,
    pricePp: 109,
  },
};

/** Guest ranges from the form; priced on the upper bound of the range. */
export const GUEST_RANGES = {
  "1-2": { label: "1–2 guests", count: 2 },
  "3-4": { label: "3–4 guests", count: 4 },
  "5-6": { label: "5–6 guests", count: 6 },
  "7-10": { label: "7–10 guests", count: 10 },
  "11-15": { label: "11–15 guests", count: 15 },
};

export const DEPOSIT_RATE = 0.1;

export function priceBooking(tourKey, guestsKey) {
  const tour = TOURS[tourKey];
  const range = GUEST_RANGES[guestsKey];
  if (!tour || !range) return null;

  const totalCents = tour.pricePp * 100 * range.count;
  return {
    tour,
    range,
    pricePpCents: tour.pricePp * 100,
    totalCents,
    depositCents: Math.round(totalCents * DEPOSIT_RATE),
  };
}
