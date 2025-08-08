const express = require('express');
const dayjs = require('dayjs');
const { createSeededRng } = require('../lib/random');
const { priceHotelNight } = require('../lib/pricing');
const { convertBreakdownUSDToCurrency } = require('../lib/currency');

const router = express.Router();

router.get('/', (req, res) => {
  const { db, config, now } = req.context;
  const { city, checkIn, checkOut, adults = 1, page = 1, pageSize = 20 } = req.query;

  let items = db.hotels;
  if (city) items = items.filter(h => h.city.toUpperCase() === String(city).toUpperCase());

  const nights = (() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = dayjs(String(checkIn)).startOf('day');
    const d2 = dayjs(String(checkOut)).startOf('day');
    const diff = d2.diff(d1, 'day');
    return diff > 0 ? diff : 1;
  })();

  const p = Math.max(1, parseInt(page, 10));
  const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
  const offset = (p - 1) * ps;
  const paged = items.slice(offset, offset + ps);

  const rng = createSeededRng(config.seed);
  const response = paged.map((h, idx) => {
    const seedFactor = (rng() + (idx % 11) * 0.01) % 1;
    let perNight = priceHotelNight({ base: config.base.hotel, now, occupancyRatio: h.occupancyRatio, seedFactor });
    if (config.currency?.code === 'INR') {
      perNight = convertBreakdownUSDToCurrency(perNight, config.currency.usdToInr || 83);
    }
    const total = { ...perNight, total: Math.round(perNight.total * nights * 100) / 100 };
    return { ...h, pricing: { perNight, total }, currency: config.currency?.code || 'USD', currencySymbol: config.currency?.symbol || '$', adults: Number(adults), nights };
  });

  res.json({ total: items.length, page: p, pageSize: ps, results: response });
});

module.exports = router;


