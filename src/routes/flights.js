const express = require('express');
const dayjs = require('dayjs');
const { createSeededRng } = require('../lib/random');
const { priceFlight } = require('../lib/pricing');
const { convertBreakdownUSDToCurrency } = require('../lib/currency');

const router = express.Router();

// Airline code to human-readable name map (extendable)
const AIRLINE_NAMES = {
  AC: 'Air Canada',
  AF: 'Air France',
  BA: 'British Airways',
  CX: 'Cathay Pacific',
  DL: 'Delta Air Lines',
  EK: 'Emirates',
  EY: 'Etihad Airways',
  LH: 'Lufthansa',
  QR: 'Qatar Airways',
  QF: 'Qantas',
  SQ: 'Singapore Airlines',
  TK: 'Turkish Airlines',
  UA: 'United Airlines',
  VS: 'Virgin Atlantic',
  AI: 'Air India',
  '6E': 'IndiGo',
  UK: 'Vistara',
  IX: 'Air India Express',
  AK: 'AirAsia',
  VJ: 'VietJet Air',
  TR: 'Scoot',
};

const AIRCRAFT_TYPES = [
  'Airbus A320', 'Airbus A320neo', 'Airbus A321', 'Airbus A330-300', 'Airbus A350-900',
  'Boeing 737-800', 'Boeing 737 MAX 8', 'Boeing 777-300ER', 'Boeing 787-8', 'Boeing 787-9',
];

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function baggageForCabin(cabin) {
  const c = String(cabin || '').toUpperCase();
  if (c === 'FIRST' || c === 'BUSINESS') return '30kg check-in, 10kg cabin';
  if (c === 'PREMIUM_ECONOMY') return '20kg check-in, 8kg cabin';
  return '15kg check-in, 7kg cabin';
}

function titleCaseCabin(cabin) {
  const c = String(cabin || '').toUpperCase();
  if (c === 'PREMIUM_ECONOMY') return 'Premium Economy';
  if (c === 'BUSINESS') return 'Business';
  if (c === 'FIRST') return 'First';
  return 'Economy';
}

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
    let pricing = priceFlight({
      base: config.base.flight,
      now,
      travelDate: f.departure,
      loadFactor: f.loadFactor,
      seedFactor,
    });
    // Convert to INR (or configured currency)
    if (config.currency?.code === 'INR') {
      pricing = convertBreakdownUSDToCurrency(pricing, config.currency.usdToInr || 83);
    }
    // Airport lookup
    const airportsByCode = new Map(db.meta.airports.map(a => [a.code, a]));
    const from = airportsByCode.get(f.origin) || { city: f.origin, code: f.origin, country: '' };
    const to = airportsByCode.get(f.destination) || { city: f.destination, code: f.destination, country: '' };
    const fromAirportName = (
      {
        DEL: 'Indira Gandhi International Airport (DEL)',
        DXB: 'Dubai International Airport (DXB)',
        BOM: 'Chhatrapati Shivaji Maharaj International Airport (BOM)',
        BLR: 'Kempegowda International Airport (BLR)',
        AMD: 'Sardar Vallabhbhai Patel International Airport (AMD)',
      }[f.origin]
    ) || `${from.city} International Airport (${from.code})`;
    const toAirportName = (
      {
        DEL: 'Indira Gandhi International Airport (DEL)',
        DXB: 'Dubai International Airport (DXB)',
        BOM: 'Chhatrapati Shivaji Maharaj International Airport (BOM)',
        BLR: 'Kempegowda International Airport (BLR)',
        AMD: 'Sardar Vallabhbhai Patel International Airport (AMD)',
      }[f.destination]
    ) || `${to.city} International Airport (${to.code})`;

    // Layovers list based on stops
    const layovers = [];
    if (f.stops && f.stops > 0) {
      const pool = db.meta.airports.filter(a => a.code !== f.origin && a.code !== f.destination);
      for (let i = 0; i < f.stops; i += 1) {
        const a = pool[(idx + i) % pool.length];
        if (a) layovers.push(a.code);
      }
    }

    const airlineCode = String(f.flightNumber || '').slice(0, 2);
    const airlineName = AIRLINE_NAMES[airlineCode] || AIRLINE_NAMES[f.airline] || f.airline;
    const aircraft = AIRCRAFT_TYPES[(idx + f.durationMin) % AIRCRAFT_TYPES.length];
    const fareClass = titleCaseCabin(f.cabin);
    const refundable = ((idx + f.seats) % 3) !== 0; // ~66% refundable
    const baggage = baggageForCabin(f.cabin);
    const price = pricing.total;

    const enriched = {
      flight_id: f.id,
      airline_name: airlineName,
      flight_number: f.flightNumber,
      aircraft_type: aircraft,
      from_city: from.city,
      from_airport: fromAirportName,
      to_city: to.city,
      to_airport: toAirportName,
      departure_time: f.departure,
      arrival_time: f.arrival,
      duration: formatDuration(f.durationMin),
      layovers,
      price,
      fare_class: fareClass,
      refundable,
      baggage_included: baggage,
    };

    return { ...f, pricing, currency: config.currency?.code || 'USD', currencySymbol: config.currency?.symbol || '$', adults: Number(adults), ...enriched };
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
      let pricing = priceFlight({ base: config.base.flight, now, travelDate: f.departure, loadFactor: f.loadFactor, seedFactor });
      if (config.currency?.code === 'INR') {
        pricing = convertBreakdownUSDToCurrency(pricing, config.currency.usdToInr || 83);
      }
      const airportsByCode = new Map(db.meta.airports.map(a => [a.code, a]));
      const from = airportsByCode.get(f.origin) || { city: f.origin, code: f.origin, country: '' };
      const to = airportsByCode.get(f.destination) || { city: f.destination, code: f.destination, country: '' };
      const fromAirportName = (
        { DEL: 'Indira Gandhi International Airport (DEL)', DXB: 'Dubai International Airport (DXB)', BOM: 'Chhatrapati Shivaji Maharaj International Airport (BOM)', BLR: 'Kempegowda International Airport (BLR)', AMD: 'Sardar Vallabhbhai Patel International Airport (AMD)' }[f.origin]
      ) || `${from.city} International Airport (${from.code})`;
      const toAirportName = (
        { DEL: 'Indira Gandhi International Airport (DEL)', DXB: 'Dubai International Airport (DXB)', BOM: 'Chhatrapati Shivaji Maharaj International Airport (BOM)', BLR: 'Kempegowda International Airport (BLR)', AMD: 'Sardar Vallabhbhai Patel International Airport (AMD)' }[f.destination]
      ) || `${to.city} International Airport (${to.code})`;
      const layovers = [];
      if (f.stops && f.stops > 0) {
        const pool = db.meta.airports.filter(a => a.code !== f.origin && a.code !== f.destination);
        for (let i = 0; i < f.stops; i += 1) {
          const a = pool[(idx + i) % pool.length];
          if (a) layovers.push(a.code);
        }
      }
      const airlineCode = String(f.flightNumber || '').slice(0, 2);
      const airlineName = AIRLINE_NAMES[airlineCode] || AIRLINE_NAMES[f.airline] || f.airline;
      const aircraft = AIRCRAFT_TYPES[(idx + f.durationMin) % AIRCRAFT_TYPES.length];
      const fareClass = titleCaseCabin(f.cabin);
      const refundable = ((idx + f.seats) % 3) !== 0;
      const baggage = baggageForCabin(f.cabin);
      const price = pricing.total;
      const enriched = {
        flight_id: f.id,
        airline_name: airlineName,
        flight_number: f.flightNumber,
        aircraft_type: aircraft,
        from_city: from.city,
        from_airport: fromAirportName,
        to_city: to.city,
        to_airport: toAirportName,
        departure_time: f.departure,
        arrival_time: f.arrival,
        duration: formatDuration(f.durationMin),
        layovers,
        price,
        fare_class: fareClass,
        refundable,
        baggage_included: baggage,
      };
      return { ...f, pricing, currency: config.currency?.code || 'USD', currencySymbol: config.currency?.symbol || '$', adults: Number(adults), ...enriched };
    });
    return res.json({ total, page: p, pageSize: ps, results: response, synthetic: true });
  }

  res.json({ total: items.length, page: p, pageSize: ps, results: response, synthetic: false });
});

module.exports = router;


