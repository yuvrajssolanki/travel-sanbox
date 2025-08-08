const { createSeededRng, choice, intInRange, floatInRange, shuffle } = require('./random');
const dayjs = require('dayjs');
const { generateId } = require('./id');

// Base real airports kept for realism
const BASE_AIRPORTS = [
  // UK / Europe
  { code: 'LHR', city: 'London', country: 'UK' },
  { code: 'LGW', city: 'London', country: 'UK' },
  { code: 'LTN', city: 'London', country: 'UK' },
  { code: 'STN', city: 'London', country: 'UK' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'ORY', city: 'Paris', country: 'France' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain' },
  { code: 'VIE', city: 'Vienna', country: 'Austria' },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland' },
  { code: 'BRU', city: 'Brussels', country: 'Belgium' },
  { code: 'MUC', city: 'Munich', country: 'Germany' },
  { code: 'BER', city: 'Berlin', country: 'Germany' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', city: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', city: 'Oslo', country: 'Norway' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland' },
  { code: 'FCO', city: 'Rome', country: 'Italy' },
  { code: 'MXP', city: 'Milan', country: 'Italy' },
  { code: 'ATH', city: 'Athens', country: 'Greece' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal' },
  { code: 'OPO', city: 'Porto', country: 'Portugal' },
  { code: 'PRG', city: 'Prague', country: 'Czechia' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary' },
  { code: 'WAW', city: 'Warsaw', country: 'Poland' },
  { code: 'KRK', city: 'Krakow', country: 'Poland' },
  { code: 'GVA', city: 'Geneva', country: 'Switzerland' },
  { code: 'LYS', city: 'Lyon', country: 'France' },
  { code: 'NCE', city: 'Nice', country: 'France' },
  // Middle East
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'DWC', city: 'Dubai', country: 'UAE' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'DOH', city: 'Doha', country: 'Qatar' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'MCT', city: 'Muscat', country: 'Oman' },
  { code: 'BAH', city: 'Manama', country: 'Bahrain' },
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait' },
  { code: 'AMM', city: 'Amman', country: 'Jordan' },
  { code: 'BEY', city: 'Beirut', country: 'Lebanon' },
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel' },
  // North America
  { code: 'JFK', city: 'New York', country: 'USA' },
  { code: 'EWR', city: 'Newark', country: 'USA' },
  { code: 'BOS', city: 'Boston', country: 'USA' },
  { code: 'IAD', city: 'Washington', country: 'USA' },
  { code: 'DCA', city: 'Washington', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', city: 'San Francisco', country: 'USA' },
  { code: 'SEA', city: 'Seattle', country: 'USA' },
  { code: 'ORD', city: 'Chicago', country: 'USA' },
  { code: 'DFW', city: 'Dallas', country: 'USA' },
  { code: 'IAH', city: 'Houston', country: 'USA' },
  { code: 'ATL', city: 'Atlanta', country: 'USA' },
  { code: 'MIA', city: 'Miami', country: 'USA' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada' },
  { code: 'YVR', city: 'Vancouver', country: 'Canada' },
  { code: 'YUL', city: 'Montreal', country: 'Canada' },
  { code: 'YYC', city: 'Calgary', country: 'Canada' },
  // Latin America
  { code: 'MEX', city: 'Mexico City', country: 'Mexico' },
  { code: 'BOG', city: 'Bogota', country: 'Colombia' },
  { code: 'LIM', city: 'Lima', country: 'Peru' },
  { code: 'SCL', city: 'Santiago', country: 'Chile' },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'GRU', city: 'Sao Paulo', country: 'Brazil' },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil' },
  // India (expanded)
  { code: 'DEL', city: 'Delhi', country: 'India' },
  { code: 'BOM', city: 'Mumbai', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', country: 'India' },
  { code: 'MAA', city: 'Chennai', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', city: 'Kolkata', country: 'India' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India' },
  { code: 'PNQ', city: 'Pune', country: 'India' },
  { code: 'COK', city: 'Kochi', country: 'India' },
  { code: 'GOI', city: 'Goa', country: 'India' },
  { code: 'JAI', city: 'Jaipur', country: 'India' },
  { code: 'NAG', city: 'Nagpur', country: 'India' },
  { code: 'LKO', city: 'Lucknow', country: 'India' },
  // Vietnam (added)
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam' },
  { code: 'DAD', city: 'Da Nang', country: 'Vietnam' },
  // APAC
  { code: 'HKG', city: 'Hong Kong', country: 'China' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan' },
  { code: 'KIX', city: 'Osaka', country: 'Japan' },
  { code: 'SYD', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea' },
  { code: 'PEK', city: 'Beijing', country: 'China' },
  { code: 'PVG', city: 'Shanghai', country: 'China' },
  { code: 'CAN', city: 'Guangzhou', country: 'China' },
  // Africa
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa' },
  { code: 'CAI', city: 'Cairo', country: 'Egypt' },
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya' },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco' },
  { code: 'RAK', city: 'Marrakesh', country: 'Morocco' },
];

const AIRLINES = [
  // India & regional
  'AI', // Air India
  '6E', // IndiGo
  'UK', // Vistara
  'IX', // Air India Express
  'AK', // AirAsia
  'VJ', // VietJet Air
  'TR', // Scoot
  // Global
  'AC', 'AF', 'BA', 'CX', 'DL', 'EK', 'EY', 'LH', 'QR', 'QF', 'SQ', 'TK', 'UA', 'VS'
];
const CABINS = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

const HOTEL_CHAINS = ['Marina', 'Aurora', 'Pioneer', 'Grand', 'PrimeStay', 'UrbanNest', 'Skyline', 'Harbor'];

function uniqueBy(array, keyFn) {
  const map = new Map();
  for (const item of array) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

function buildAirports(rng) {
  const airports = [...BASE_AIRPORTS];

  // Add a large pool of synthetic airports to reach 120+ countries and 300+ cities
  const desiredTotal = 360;
  const usedCodes = new Set(airports.map(a => a.code));

  function generateCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (true) {
      const c = letters[intInRange(rng, 0, 25)] + letters[intInRange(rng, 0, 25)] + letters[intInRange(rng, 0, 25)];
      if (!usedCodes.has(c)) { usedCodes.add(c); return c; }
    }
  }

  let syntheticIndex = 1;
  while (airports.length < desiredTotal) {
    const code = generateCode();
    const countryIndex = 100 + syntheticIndex; // ensures many distinct country names
    const country = `Country-${String(countryIndex).padStart(3, '0')}`;
    const city = `City-${String(syntheticIndex).padStart(3, '0')}`;
    airports.push({ code, city, country });
    syntheticIndex += 1;
  }

  return airports;
}

const COUNTRIES = ['UK', 'France', 'Netherlands', 'Germany', 'Spain', 'UAE', 'Qatar', 'Turkey', 'USA', 'Canada', 'India', 'Japan', 'Australia'];
const REGIONS = ['Europe', 'North America', 'Asia', 'Middle East', 'Oceania'];

function randomDateInNextMonths(rng, months = 6) {
  const now = dayjs();
  const days = intInRange(rng, 0, months * 30);
  const hours = intInRange(rng, 0, 23);
  const minutes = intInRange(rng, 0, 59);
  return now.add(days, 'day').hour(hours).minute(minutes).second(0).millisecond(0).toISOString();
}

function generateFlights(rng, count, airports) {
  const flights = [];
  for (let i = 0; i < count; i += 1) {
    const from = choice(rng, airports);
    let to = choice(rng, airports);
    while (to.code === from.code) {
      to = choice(rng, airports);
    }
    const airline = choice(rng, AIRLINES);
    const flightNumber = `${airline}${intInRange(rng, 10, 9999)}`;
    const departure = randomDateInNextMonths(rng, 6);
    const durationMin = intInRange(rng, 60, 900);
    const arrival = dayjs(departure).add(durationMin, 'minute').toISOString();
    const cabin = choice(rng, CABINS);
    const seats = intInRange(rng, 100, 320);
    const sold = intInRange(rng, 5, Math.floor(seats * 0.95));
    const loadFactor = sold / seats;
    const stops = intInRange(rng, 0, 2);
    flights.push({
      id: generateId(10), airline, flightNumber, origin: from.code, destination: to.code,
      departure, arrival, durationMin, cabin, seats, sold, loadFactor, stops,
    });
  }
  return flights;
}

function ensureIndiaOutboundFlights(rng, airports, minDestinationsPerOrigin = 120) {
  const origins = ['DEL', 'AMD', 'BLR', 'BOM'];
  const airportsByCode = new Map(airports.map(a => [a.code, a]));
  const flights = [];
  const destinationPool = airports.filter(a => a.country !== 'India');

  for (const originCode of origins) {
    const originAirport = airportsByCode.get(originCode);
    if (!originAirport) continue;
    // Pick a wide range of destinations across many countries
    const shuffled = shuffle(rng, destinationPool);
    const picks = shuffled.slice(0, Math.min(minDestinationsPerOrigin, destinationPool.length));
    let i = 0;
    for (const dest of picks) {
      if (dest.code === originCode) continue;
      const airline = choice(rng, AIRLINES);
      const flightNumber = `${airline}${100 + (i % 9000)}`;
      const departure = randomDateInNextMonths(rng, 6);
      const durationMin = intInRange(rng, 120, 900);
      const arrival = dayjs(departure).add(durationMin, 'minute').toISOString();
      const cabin = choice(rng, CABINS);
      const seats = intInRange(rng, 140, 340);
      const sold = intInRange(rng, 10, Math.floor(seats * 0.95));
      const loadFactor = sold / seats;
      const stops = intInRange(rng, 0, 1);
      flights.push({
        id: generateId(10), airline, flightNumber, origin: originCode, destination: dest.code,
        departure, arrival, durationMin, cabin, seats, sold, loadFactor, stops,
      });
      i += 1;
    }
  }
  return flights;
}

// Curated major destinations (non-India) for round-trips
const DESTINATIONS_MAJOR = BASE_AIRPORTS
  .filter(a => a.country !== 'India')
  .map(a => a.code);

function generateRoundTripFlights(rng, airports, perOriginDestinations = 60) {
  const origins = ['DEL', 'BOM', 'AMD', 'BLR'];
  const flights = [];
  const destCodes = DESTINATIONS_MAJOR.filter(code => !origins.includes(code));
  const pickCount = Math.min(perOriginDestinations, destCodes.length);

  function makeLeg(originCode, destCode, depISO, durationMin) {
    const airline = choice(rng, AIRLINES);
    const flightNumber = `${airline}${intInRange(rng, 100, 9999)}`;
    const arrival = dayjs(depISO).add(durationMin, 'minute').toISOString();
    const cabin = choice(rng, CABINS);
    const seats = intInRange(rng, 140, 340);
    const sold = intInRange(rng, 10, Math.floor(seats * 0.95));
    const loadFactor = sold / seats;
    const stops = intInRange(rng, 0, 1);
    return {
      id: generateId(10), airline, flightNumber, origin: originCode, destination: destCode,
      departure: depISO, arrival, durationMin, cabin, seats, sold, loadFactor, stops,
    };
  }

  for (const origin of origins) {
    const shuffled = shuffle(rng, destCodes).slice(0, pickCount);
    for (const dest of shuffled) {
      const outboundDep = randomDateInNextMonths(rng, 6);
      const outDuration = intInRange(rng, 180, 900);
      const returnGapDays = intInRange(rng, 3, 14);
      const returnDep = dayjs(outboundDep).add(returnGapDays, 'day').hour(intInRange(rng, 6, 23)).minute(intInRange(rng, 0, 59)).second(0).millisecond(0).toISOString();
      const retDuration = intInRange(rng, 180, 900);
      flights.push(makeLeg(origin, dest, outboundDep, outDuration));
      flights.push(makeLeg(dest, origin, returnDep, retDuration));
    }
  }

  return flights;
}

function buildHotelCities(airports) {
  const cities = uniqueBy(airports, a => a.city).map(a => a.city);
  const result = [...cities];
  // Ensure at least 200 different cities
  let idx = 1;
  while (result.length < 220) {
    const syntheticCity = `City-${String(idx).padStart(3, '0')}`;
    if (!result.includes(syntheticCity)) result.push(syntheticCity);
    idx += 1;
  }
  return result;
}

function generateHotels(rng, count, hotelCities) {
  const hotels = [];
  for (let i = 0; i < count; i += 1) {
    const city = choice(rng, hotelCities);
    const chain = choice(rng, HOTEL_CHAINS);
    const stars = intInRange(rng, 2, 5);
    const totalRooms = intInRange(rng, 40, 400);
    const occupied = intInRange(rng, 5, Math.floor(totalRooms * 0.9));
    const occupancyRatio = occupied / totalRooms;
    const name = `${chain} ${city} ${intInRange(rng, 1, 99)}`;
    hotels.push({ id: generateId(10), name, city, stars, totalRooms, occupied, occupancyRatio });
  }
  return hotels;
}

function generateInsurancePlans(rng, count) {
  const providers = ['SafeTrip', 'GlobeCover', 'JourneyShield', 'TravelGuard'];
  const plans = [];
  for (let i = 0; i < count; i += 1) {
    const provider = choice(rng, providers);
    const coverage = choice(rng, ['Basic', 'Standard', 'Premium']);
    const country = choice(rng, COUNTRIES);
    plans.push({ id: generateId(10), provider, coverage, country, maxCoverageUSD: intInRange(rng, 10000, 100000) });
  }
  return plans;
}

function generateEsims(rng, count) {
  const vendors = ['AirLink', 'eRoam', 'NomadSIM', 'FlyData'];
  const esims = [];
  for (let i = 0; i < count; i += 1) {
    const vendor = choice(rng, vendors);
    const coverage = rng() < 0.6 ? { country: choice(rng, COUNTRIES) } : { region: choice(rng, REGIONS) };
    const dataGb = intInRange(rng, 1, 50);
    const validityDays = intInRange(rng, 3, 90);
    esims.push({ id: generateId(10), vendor, dataGb, validityDays, coverage });
  }
  return esims;
}

function generateData(config) {
  const rng = createSeededRng(config.seed);
  const airports = buildAirports(rng);
  const hotelCities = buildHotelCities(airports);
  // Generate curated round-trip flights only between 4 Indian origins and major world destinations
  const perOrigin = Math.max(20, Math.floor((config.sizes.flights || 1200) / (4 * 2))); // two legs per destination
  const flights = generateRoundTripFlights(rng, airports, perOrigin);
  return {
    meta: { airports, airlines: AIRLINES, hotelCities, countries: COUNTRIES, regions: REGIONS },
    flights,
    hotels: generateHotels(rng, config.sizes.hotels, hotelCities),
    insurance: generateInsurancePlans(rng, config.sizes.insurance),
    esims: generateEsims(rng, config.sizes.esims),
  };
}

module.exports = { generateData };


