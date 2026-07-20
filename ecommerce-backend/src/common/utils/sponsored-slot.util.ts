const FIRST_SLOT_POSITION = 5;
const MAX_FIXED_POINT_ITERATIONS = 64;

export function slotPosition(n: number): number {
  if (n < 1) return Infinity;
  return FIRST_SLOT_POSITION * 2 ** (n - 1);
}

export function countSlotsUpTo(mergedPosition: number): number {
  if (mergedPosition < FIRST_SLOT_POSITION) return 0;
  const n = Math.floor(Math.log2(mergedPosition / FIRST_SLOT_POSITION) + 1e-9) + 1;
  return Math.max(0, n);
}

export function organicIndexToMergedPosition(k: number): number {
  if (k <= 0) return 0;
  let merged = k;
  for (let i = 0; i < MAX_FIXED_POINT_ITERATIONS; i++) {
    const next = k + countSlotsUpTo(merged);
    if (next === merged) return merged;
    merged = next;
  }
  return merged;
}

export type PageSlot = { type: 'organic' } | { type: 'sponsored'; slotNumber: number };

export interface SponsoredPagePlan {
  layout: PageSlot[];
  sponsoredCount: number;
}

export function planSponsoredPage(organicOffset: number, limit: number): SponsoredPagePlan {
  const mPrevEnd = organicIndexToMergedPosition(organicOffset);
  const mLast = organicIndexToMergedPosition(organicOffset + limit);

  const slotsBefore = countSlotsUpTo(mPrevEnd);
  const slotsThrough = countSlotsUpTo(mLast);

  const slotPositionsInPage = new Map<number, number>(); // mergedPosition -> slotNumber
  for (let n = slotsBefore + 1; n <= slotsThrough; n++) {
    slotPositionsInPage.set(slotPosition(n), n);
  }

  const layout: PageSlot[] = [];
  for (let mergedPos = mPrevEnd + 1; mergedPos <= mLast; mergedPos++) {
    const slotNumber = slotPositionsInPage.get(mergedPos);
    layout.push(slotNumber ? { type: 'sponsored', slotNumber } : { type: 'organic' });
  }

  return { layout, sponsoredCount: slotPositionsInPage.size };
}
