const express = require('express');
const dayjs = require('dayjs');
const { createSeededRng } = require('../lib/random');
const { pricePerDay } = require('../lib/pricing');

const router = express.Router();

router.get('/', (req, res) => {
  const { db, config, now } = req.context;
  const { country, startDate, endDate, travellers = 1 } = req.query;

  let items = db.insurance;
  if (country) items = items.filter(p => p.country.toUpperCase() === String(country).toUpperCase());

  const days = (() => {
    if (!startDate || !endDate) return 7;
    const d1 = dayjs(String(startDate)).startOf('day');
    const d2 = dayjs(String(endDate)).startOf('day');
    const diff = d2.diff(d1, 'day');
    return diff > 0 ? diff : 1;
  })();

  const rng = createSeededRng(config.seed);
  const results = items.map((p, idx) => {
    const seedFactor = (rng() + (idx % 9) * 0.01) % 1;
    const perDay = pricePerDay({ base: config.base.insuranceDay || config.base.insurance, now, seedFactor });
    const total = Math.round(perDay.total * days * Number(travellers) * 100) / 100;
    return { ...p, days, travellers: Number(travellers), pricing: { perDay, total } };
  });

  res.json({ total: results.length, results });
});

module.exports = router;


