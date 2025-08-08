const { createSeededRng, choice, intInRange, floatInRange, shuffle } = require('./random');
const dayjs = require('dayjs');
const { generateId } = require('./id');

const AIRPORTS = [
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
  // Middle East
  { code: 'DXB', city: 'Dubai', country: 'UAE' },
  { code: 'DWC', city: 'Dubai', country: 'UAE' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'DOH', city: 'Doha', country: 'Qatar' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey' },
  // North America
  { code: 'JFK', city: 'New York', country: 'USA' },
  { code: 'EWR', city: 'Newark', country: 'USA' },
  { code: 'BOS', city: 'Boston', country: 'USA' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', city: 'San Francisco', country: 'USA' },
  { code: 'SEA', city: 'Seattle', country: 'USA' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada' },
  { code: 'YVR', city: 'Vancouver', country: 'Canada' },
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
];

const AIRLINES = ['AC', 'AF', 'BA', 'CX', 'DL', 'EK', 'EY', 'LH', 'QR', 'QF', 'SQ', 'TK', 'UA', 'VS'];
const CABINS = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

const HOTEL_CHAINS = ['Marina', 'Aurora', 'Pioneer', 'Grand', 'PrimeStay', 'UrbanNest', 'Skyline', 'Harbor'];
const HOTEL_CITIES = [
  'London', 'Paris', 'Amsterdam', 'Frankfurt', 'Madrid', 'Barcelona',
  'New York', 'Los Angeles', 'San Francisco', 'Toronto', 'Vancouver',
  // India
  'Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Goa', 'Ahmedabad', 'Pune', 'Kochi',
  // UAE
  'Dubai', 'Abu Dhabi',
  // Vietnam
  'Hanoi', 'Ho Chi Minh City', 'Da Nang',
  // APAC
  'Tokyo', 'Osaka', 'Sydney', 'Melbourne',
];

const COUNTRIES = ['UK', 'France', 'Netherlands', 'Germany', 'Spain', 'UAE', 'Qatar', 'Turkey', 'USA', 'Canada', 'India', 'Japan', 'Australia'];
const REGIONS = ['Europe', 'North America', 'Asia', 'Middle East', 'Oceania'];

function randomDateInNextMonths(rng, months = 6) {
  const now = dayjs();
  const days = intInRange(rng, 0, months * 30);
  const hours = intInRange(rng, 0, 23);
  const minutes = intInRange(rng, 0, 59);
  return now.add(days, 'day').hour(hours).minute(minutes).second(0).millisecond(0).toISOString();
}

function generateFlights(rng, count) {
  const flights = [];
  for (let i = 0; i < count; i += 1) {
    const from = choice(rng, AIRPORTS);
    let to = choice(rng, AIRPORTS);
    while (to.code === from.code) {
      to = choice(rng, AIRPORTS);
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

function generateHotels(rng, count) {
  const hotels = [];
  for (let i = 0; i < count; i += 1) {
    const city = choice(rng, HOTEL_CITIES);
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
  return {
    meta: { airports: AIRPORTS, airlines: AIRLINES, hotelCities: HOTEL_CITIES, countries: COUNTRIES, regions: REGIONS },
    flights: generateFlights(rng, config.sizes.flights),
    hotels: generateHotels(rng, config.sizes.hotels),
    insurance: generateInsurancePlans(rng, config.sizes.insurance),
    esims: generateEsims(rng, config.sizes.esims),
  };
}

module.exports = { generateData };


