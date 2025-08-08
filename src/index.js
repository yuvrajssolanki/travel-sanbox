const express = require('express');
const cors = require('cors');
const dayjs = require('dayjs');

const { loadConfig } = require('./lib/config');
const { generateData } = require('./lib/generate');
const flightsRouter = require('./routes/flights');
const hotelsRouter = require('./routes/hotels');
const insuranceRouter = require('./routes/insurance');
const esimsRouter = require('./routes/esims');
const configRouter = require('./routes/config');

const app = express();
app.use(cors());
app.use(express.json());

const config = loadConfig();
const db = generateData(config);

app.get('/', (req, res) => {
  res.json({
    name: 'travel-sandbox-api',
    version: '1.0.0',
    endpoints: [
      '/',
      '/health',
      '/version',
      '/flights',
      '/hotels',
      '/insurance',
      '/esims',
      '/config',
    ],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', epoch: Date.now() });
});

app.get('/version', (req, res) => {
  res.json({ name: 'travel-sandbox-api', version: '1.0.0', node: process.version });
});

app.use((req, _res, next) => {
  req.context = { config, db, now: dayjs() };
  next();
});

app.use('/flights', flightsRouter);
app.use('/hotels', hotelsRouter);
app.use('/insurance', insuranceRouter);
app.use('/esims', esimsRouter);
app.use('/config', configRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Travel Sandbox API listening on port ${port}`);
});


