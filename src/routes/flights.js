const express = require('express');
const dayjs = require('dayjs');
const { createSeededRng } = require('../lib/random');
const { priceFlight } = require('../lib/pricing');

const router = express.Router();

const METRO_CODES = {
  // UK / Europe
  LON: ['LHR', 'LGW', 'LTN', 'STN'],
  PAR: ['CDG', 'ORY'],
  // UAE
  DXB_ALL: ['DXB', 'DWC'],
  UAE: ['DXB', 'DWC', 'AUH'],
  // India (pseudo-group)
  IN: ['DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'AMD', 'PNQ', 'COK', 'GOI'],
  // Vietnam
  VN: ['SGN', 'HAN', 'DAD'],
  // USA
  NYC: ['JFK', 'EWR'],
};

router.get('/', (req, res) => {
  const { db, config, now } = req.context;
  const { origin, destination, date, flexDays = 0, adults = 1, cabin, page = 1, pageSize = 20 } = req.query;

  let items = db.flights;
  if (origin) {
    const o = String(origin).toUpperCase();
    const expand = METRO_CODES[o];
    items = expand ? items.filter(f => expand.includes(f.origin)) : items.filter(f => f.origin.toUpperCase() === o);
  }
  if (destination) {
    const d = String(destination).toUpperCase();
    const expand = METRO_CODES[d];
    items = expand ? items.filter(f => expand.includes(f.destination)) : items.filter(f => f.destination.toUpperCase() === d);
  }
  if (cabin) items = items.filter(f => f.cabin.toUpperCase() === String(cabin).toUpperCase());
  if (date) {
    const target = dayjs(String(date)).startOf('day');
    const fd = Math.max(0, parseInt(flexDays, 10) || 0);
    if (fd > 0) {
      const start = target.subtract(fd, 'day');
      const end = target.add(fd, 'day').endOf('day');
      items = items.filter(f => {
        const dep = dayjs(f.departure);
        return dep.isAfter(start) && dep.isBefore(end);
      });
    } else {
      items = items.filter(f => dayjs(f.departure).isSame(target, 'day'));
    }
  }

  const p = Math.max(1, parseInt(page, 10));
  const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
  const offset = (p - 1) * ps;
  let paged = items.slice(offset, offset + ps);

  const rng = createSeededRng(config.seed);
  let response = paged.map((f, idx) => {
    const seedFactor = (rng() + (idx % 7) * 0.01) % 1;
    const pricing = priceFlight({
      base: config.base.flight,
      now,
      travelDate: f.departure,
      loadFactor: f.loadFactor,
      seedFactor,
    });
    return { ...f, pricing, adults: Number(adults) };
  });

  // Fallback: if no flights matched, synthesize a small set for the requested route/date window
  if (items.length === 0 && (origin || destination)) {
    const allAirports = db.meta.airports.map(a => a.code);
    const airlines = db.meta.airlines;
    const cabinUpper = cabin ? String(cabin).toUpperCase() : undefined;

    const originSet = (() => {
      if (!origin) return allAirports;
      const o = String(origin).toUpperCase();
      const expand = METRO_CODES[o];
      return expand || [o];
    })();
    const destSet = (() => {
      if (!destination) return allAirports;
      const d = String(destination).toUpperCase();
      const expand = METRO_CODES[d];
      return expand || [d];
    })();

    const target = date ? dayjs(String(date)).startOf('day') : now.startOf('day');
    const fd = Math.max(0, parseInt(flexDays, 10) || 0);
    const start = target.subtract(fd || 1, 'day');
    const end = target.add(fd || 3, 'day').endOf('day');

    const synth = [];
    const totalSynthetic = 24;
    for (let i = 0; i < totalSynthetic; i += 1) {
      const ori = originSet[i % originSet.length];
      const dest = destSet[i % destSet.length];
      if (ori === dest) continue;
      const airline = airlines[i % airlines.length];
      const flightNumber = `${airline}${100 + i}`;
      const dep = start.add((i % 7), 'day').hour(8 + (i % 12)).minute((i * 7) % 60).second(0).millisecond(0);
      if (!dep.isAfter(start) || !dep.isBefore(end)) continue;
      const durationMin = 60 + ((i * 37) % 720);
      const arr = dep.add(durationMin, 'minute');
      const seats = 150 + (i % 100);
      const sold = Math.min(seats - 1, 20 + ((i * 17) % seats));
      const loadFactor = sold / seats;
      const stops = (i % 5 === 0) ? 1 : 0;
      synth.push({
        id: `SYN${i}`,
        airline,
        flightNumber,
        origin: ori,
        destination: dest,
        departure: dep.toISOString(),
        arrival: arr.toISOString(),
        durationMin,
        cabin: cabinUpper || (i % 10 === 0 ? 'BUSINESS' : 'ECONOMY'),
        seats,
        sold,
        loadFactor,
        stops,
      });
    }

    const total = synth.length;
    paged = synth.slice(offset, offset + ps);
    response = paged.map((f, idx) => {
      const seedFactor = (rng() + (idx % 7) * 0.01) % 1;
      const pricing = priceFlight({ base: config.base.flight, now, travelDate: f.departure, loadFactor: f.loadFactor, seedFactor });
      return { ...f, pricing, adults: Number(adults) };
    });
    return res.json({ total, page: p, pageSize: ps, results: response, synthetic: true });
  }

  res.json({ total: items.length, page: p, pageSize: ps, results: response, synthetic: false });
});

module.exports = router;


