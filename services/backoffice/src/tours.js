/** Catalogue mirrored from the public site's tour cards. */
export const TOURS = {
  classic: {
    label: "Old Town Walking Tour — Classic Essential (3h)",
    package: "Classic Essential",
    hours: 3,
    pricePp: 89,
    itinerary: [
      "UNESCO Old Town walking tour",
      "Toompea Castle & panoramic viewpoints",
      "Alexander Nevsky Cathedral",
      "Town Hall Square & medieval pharmacy",
    ],
  },
  signature: {
    label: "Best of Tallinn Shore Excursion — Signature Tour (6h)",
    package: "Signature Tour",
    hours: 6,
    pricePp: 149,
    itinerary: [
      "Old Town walking tour",
      "Kadriorg Palace & rose garden",
      "Song Festival Grounds",
      "Pirita Beach & sea views",
      "Lunch at a local restaurant",
    ],
  },
  complete: {
    label: "Old Town, Kadriorg & Pirita — Most Complete (8h)",
    package: "Most Complete",
    hours: 8,
    pricePp: 179,
    itinerary: [
      "Deep-dive Old Town with hidden spots",
      "Kadriorg Art Museum & palace gardens",
      "Pirita Convent ruins & coastal views",
      "Latvian Market & local lunch stop",
    ],
  },
  original: {
    label: "Hidden Stories & Local Life — Most Original (4h)",
    package: "Most Original",
    hours: 4,
    pricePp: 109,
    itinerary: [
      "Kalamaja & Telliskivi Creative Quarter",
      "Balti jaam market & local street food",
      "Street art & independent creative hubs",
      "Estonian café culture & local snacks",
    ],
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
