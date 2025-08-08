### Travel Sandbox API

A fake travel API for local development and testing bots/clients. Provides endpoints for flights, hotels, travel insurance, and eSIMs. Includes dynamic pricing, filtering, and pagination. Ready to deploy on Railway.

#### Features
- Flights, hotels, insurance, eSIM mock data with realistic fields
- Dynamic pricing on each request using deterministic pseudo-random logic
- CORS enabled, JSON responses, ISO8601 dates
- Seeded data generated on boot (configurable via env)
- Health and version endpoints
- Ready for Railway deployment

#### Endpoints (summary)
- GET `/health`
- GET `/version`
- GET `/flights` — query: `origin`, `destination`, `date`, `adults`, `cabin`, `page`, `pageSize`
- GET `/hotels` — query: `city`, `checkIn`, `checkOut`, `adults`, `page`, `pageSize`
- GET `/insurance` — query: `country`, `startDate`, `endDate`, `travellers`
- GET `/esims` — query: `country` or `region`, `days`
- GET `/config` — current data sizes, pricing modifiers

#### Quick start
```bash
npm install
npm run dev
# or
npm start
```

Default URL: `http://localhost:8080`

#### Env Vars
- `PORT` (default: 8080)
- `SEED` (default: fixed seed for reproducible data)
- `NUM_FLIGHTS` (default: 500)
- `NUM_HOTELS` (default: 300)
- `NUM_INSURANCE` (default: 20)
- `NUM_ESIMS` (default: 60)

#### Deploy to Railway
1. Create a new GitHub repo with this project
2. Push to GitHub
3. On Railway, create a New Project → Deploy from GitHub
4. Set environment variables if desired
5. Railway will detect Node and run `npm start`

#### Example
```bash
curl "http://localhost:8080/flights?origin=LON&destination=NYC&date=2025-09-01&adults=1&cabin=ECONOMY&page=1&pageSize=20"
```

License: MIT

