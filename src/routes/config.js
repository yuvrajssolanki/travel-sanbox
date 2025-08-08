const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  const { config, db } = req.context;
  res.json({
    seed: config.seed,
    sizes: config.sizes,
    base: config.base,
    dataset: {
      flights: db.flights.length,
      hotels: db.hotels.length,
      insurance: db.insurance.length,
      esims: db.esims.length,
    },
  });
});

module.exports = router;


