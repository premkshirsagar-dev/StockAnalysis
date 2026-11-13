# MarketPulse — MERN Stock Market Filter Dashboard

MarketPulse is a ready-to-run MERN starter project for building a stock-market screening product. It includes a responsive React dashboard, an Express API, a Mongoose model, sample stock data, search and fundamental filters, sorting, summary cards, and an optional MongoDB connection.

> The included values are illustrative sample data for development only. This project is not financial advice and does not provide live market data.

## Included features

- React + Vite frontend dashboard
- Express REST API
- Optional MongoDB/Mongoose integration
- Sample data fallback, so the app works even when MongoDB is not running
- Search by ticker or company name
- Filter by sector, price range, minimum market cap, maximum P/E ratio, and minimum daily change
- Sort by market cap, daily change, price, P/E ratio, or volume
- Dashboard summary cards and responsive table layout
- Clean separation between `client` and `server`

## Folder structure

```text
stock-market/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── data/stocks.js
│   │   ├── models/Stock.js
│   │   ├── routes/stocks.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Install these first:

- Node.js 18 or newer (Node.js LTS is recommended)
- npm
- MongoDB Community Server locally, or a MongoDB Atlas database (optional for the first run)

Check your installation:

```bash
node --version
npm --version
```

## Run the project

From the `stock-market` root folder:

```bash
npm run install-all
npm run dev
```

Open the dashboard at:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:5000
```

To stop both processes, press `Ctrl + C` in the terminal.

## First run without MongoDB

No database setup is required for the first run. The server automatically uses `server/src/data/stocks.js` when MongoDB is unavailable. This lets you build the interface and filter behavior immediately.

## Enable MongoDB later

Copy the environment template:

```bash
cd server
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

For local MongoDB, keep:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stock_market
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string. Never commit `.env` or expose your database password in source control.

The server will connect if MongoDB is available. If the database has no records yet, the dashboard still shows the sample data. The model is ready in `server/src/models/Stock.js` for a future seed/import command.

## API endpoints

### Health check

```http
GET /api/health
```

### List and filter stocks

```http
GET /api/stocks
GET /api/stocks?search=apple
GET /api/stocks?sector=Technology&maxPeRatio=40
GET /api/stocks?minPrice=100&maxPrice=500&minChange=1
```

Supported query parameters:

- `search`
- `sector`
- `minPrice`
- `maxPrice`
- `minMarketCap`
- `maxPeRatio`
- `minChange`
- `sortBy`: `price`, `changePercent`, `marketCap`, `peRatio`, or `volume`
- `order`: `asc` or `desc`

The response has this shape:

```json
{
  "count": 2,
  "data": []
}
```

### Summary

```http
GET /api/stocks/summary
```

### Sectors

```http
GET /api/stocks/sectors
```

## How the frontend works

`client/src/App.jsx` loads the API data with Axios. The filter controls update the URL query string, and the dashboard reloads the results whenever a filter or sort value changes. Vite proxies `/api` calls to `http://localhost:5000`, so the frontend does not need a hard-coded API URL during local development.

## Recommended next steps

1. Add a database seed script to insert the sample stocks into MongoDB.
2. Add a real market-data provider in `server/src/services/`.
3. Store provider API keys in `server/.env`.
4. Add a scheduled job to refresh prices.
5. Add user authentication and saved screens.
6. Add watchlists and stock detail pages.
7. Add charting with a library such as Recharts.
8. Add pagination and caching for larger universes.
9. Add backend validation for all filter values.
10. Add tests for the filter logic and API routes.

## Useful commands

Run both apps:

```bash
npm run dev
```

Run only the backend:

```bash
npm run server
```

Run only the frontend:

```bash
npm run client
```

Create a production frontend build:

```bash
cd client
npm run build
```

## Troubleshooting

### `npm` or `node` is not recognized

Install the current Node.js LTS release and reopen your terminal.

### The dashboard says it cannot reach the API

Make sure `npm run dev` is running from the root folder. Check that `http://localhost:5000/api/health` returns JSON.

### Port 5000 is already in use

Change `PORT` in `server/.env` and update the proxy target in `client/vite.config.js` to match.

### MongoDB connection warnings

This is safe for the starter project. The API intentionally falls back to sample data when MongoDB is not reachable. Start MongoDB or remove `MONGO_URI` from `.env` if you want sample-only mode.
