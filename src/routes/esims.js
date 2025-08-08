const express = require('express');
const { createSeededRng } = require('../lib/random');
const { pricePerDay } = require('../lib/pricing');
const { convertBreakdownUSDToCurrency } = require('../lib/currency');

const router = express.Router();

router.get('/', (req, res) => {
  const { db, config, now } = req.context;
  const { country, region, days = 7 } = req.query;

  let items = db.esims;
  if (country) items = items.filter(e => e.coverage.country && e.coverage.country.toUpperCase() === String(country).toUpperCase());
  if (region) items = items.filter(e => e.coverage.region && e.coverage.region.toUpperCase() === String(region).toUpperCase());

  const rng = createSeededRng(config.seed);
  const results = items.map((e, idx) => {
    const seedFactor = (rng() + (idx % 13) * 0.01) % 1;
    let perDay = pricePerDay({ base: config.base.esim, now, seedFactor });
    if (config.currency?.code === 'INR') {
      perDay = convertBreakdownUSDToCurrency(perDay, config.currency.usdToInr || 83);
    }
    const total = Math.round(perDay.total * Number(days) * 100) / 100;
    return { ...e, days: Number(days), pricing: { perDay, total }, currency: config.currency?.code || 'USD', currencySymbol: config.currency?.symbol || '$' };
  });

  res.json({ total: results.length, results });
});

module.exports = router;


