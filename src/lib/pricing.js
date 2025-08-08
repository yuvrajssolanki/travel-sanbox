const dayjs = require('dayjs');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function surgeMultiplier(now, seedFactor = 0.0) {
  const hour = now.hour();
  const weekday = now.day();
  const rush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 21);
  const weekend = weekday === 0 || weekday === 6;
  let m = 1.0;
  if (rush) m += 0.15;
  if (weekend) m += 0.1;
  m += seedFactor * 0.2;
  return clamp(m, 0.7, 2.2);
}

function proximityMultiplier(travelDate, now) {
  const days = dayjs(travelDate).startOf('day').diff(now.startOf('day'), 'day');
  if (Number.isNaN(days)) return 1.0;
  if (days <= 1) return 1.6;
  if (days <= 3) return 1.4;
  if (days <= 7) return 1.2;
  if (days <= 14) return 1.1;
  if (days >= 120) return 0.9;
  return 1.0;
}

function occupancyMultiplier(occupancyRatio) {
  // 0.0 (empty) → 0.9, 0.5 → 1.0, 0.9 → 1.5
  const base = 0.9 + (occupancyRatio * 0.7);
  return clamp(base, 0.8, 1.7);
}

function applyFeesAndTaxes(subtotal, feeRate = 0.07, taxRate = 0.12) {
  const fees = subtotal * feeRate;
  const taxes = (subtotal + fees) * taxRate;
  const total = subtotal + fees + taxes;
  return { subtotal: round(subtotal), fees: round(fees), taxes: round(taxes), total: round(total) };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function priceFlight({ base, now, travelDate, loadFactor, seedFactor }) {
  const m = surgeMultiplier(now, seedFactor) * proximityMultiplier(travelDate, now) * occupancyMultiplier(loadFactor);
  return applyFeesAndTaxes(base * m);
}

function priceHotelNight({ base, now, occupancyRatio, seedFactor }) {
  const m = surgeMultiplier(now, seedFactor) * occupancyMultiplier(occupancyRatio);
  return applyFeesAndTaxes(base * m, 0.05, 0.1);
}

function pricePerDay({ base, now, seedFactor }) {
  const m = surgeMultiplier(now, seedFactor);
  return applyFeesAndTaxes(base * m, 0.02, 0.08);
}

module.exports = {
  priceFlight,
  priceHotelNight,
  pricePerDay,
};


