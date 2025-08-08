const DEFAULTS = {
  SEED: 'travel-sandbox-seed',
  NUM_FLIGHTS: 1500,
  NUM_HOTELS: 1200,
  NUM_INSURANCE: 20,
  NUM_ESIMS: 60,
  BASE_FLIGHT_PRICE: 120,
  BASE_HOTEL_NIGHT: 75,
  BASE_INSURANCE_DAY: 2.5,
  BASE_ESIM_DAY: 1.2,
  CURRENCY_CODE: 'INR',
  CURRENCY_SYMBOL: '\u20B9',
  USD_TO_INR: 83,
};

function toInt(value, fallback) {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value, fallback) {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

function loadConfig() {
  return {
    seed: process.env.SEED || DEFAULTS.SEED,
    sizes: {
      flights: toInt(process.env.NUM_FLIGHTS, DEFAULTS.NUM_FLIGHTS),
      hotels: toInt(process.env.NUM_HOTELS, DEFAULTS.NUM_HOTELS),
      insurance: toInt(process.env.NUM_INSURANCE, DEFAULTS.NUM_INSURANCE),
      esims: toInt(process.env.NUM_ESIMS, DEFAULTS.NUM_ESIMS),
    },
    base: {
      flight: toFloat(process.env.BASE_FLIGHT_PRICE, DEFAULTS.BASE_FLIGHT_PRICE),
      hotel: toFloat(process.env.BASE_HOTEL_NIGHT, DEFAULTS.BASE_HOTEL_NIGHT),
      insurance: toFloat(process.env.BASE_INSURANCE_DAY, DEFAULTS.BASE_INSURANCE_DAY),
      esim: toFloat(process.env.BASE_ESIM_DAY, DEFAULTS.BASE_ESIM_DAY),
    },
    currency: {
      code: process.env.CURRENCY_CODE || DEFAULTS.CURRENCY_CODE,
      symbol: process.env.CURRENCY_SYMBOL || DEFAULTS.CURRENCY_SYMBOL,
      usdToInr: toFloat(process.env.USD_TO_INR, DEFAULTS.USD_TO_INR),
    },
  };
}

module.exports = { loadConfig };


