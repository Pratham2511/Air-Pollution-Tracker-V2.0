# Air-Pollution-Tracker-V2.0

Air Pollution Tracker is a modern React application that visualises live and historical air-quality
data for Indian cities. It includes differentiated experiences for citizens and government teams, map
based insights, and a suite of environmental intelligence dashboards.

## Features

- Tailwind-powered UI with glassmorphism accents and responsive layouts
- Citizen landing page with hero, feature highlights, and quick stats
- Secure authentication flows for citizens and government officials
- Government portal featuring heatmaps, incident desk, pollutant intelligence, and reporting panels
- Dashboard map view with clustering, user geolocation, and AQI insights
- Utility hooks for persistent state, OTP timers, and Supabase-backed auth services

## Tech Stack

- React 19 + React Router 6
- Tailwind CSS 3 with PostCSS & Autoprefixer
- Supabase client for authentication
- Leaflet & React Leaflet for mapping
- Recharts for data visualisation
- Jest + Testing Library for unit tests

## Getting Started

```bash
npm install
npm start
```

The development server runs at <http://localhost:3000>. Hot reload is enabled and lint errors appear in
the console.

## Testing & Production Builds

- `npm test` – run unit tests in watch mode
- `npm run build` – create an optimised production bundle under `build/`

## Project Structure

```
src/
	components/      # UI components grouped by feature
	pages/           # Route-level pages for landing, dashboard, government
	hooks/           # Custom React hooks
	context/         # Global context providers (e.g., auth)
	services/        # API and Supabase helpers
	utils/           # Shared utilities and tests
```

## Deployment

The build output can be deployed to any static host. For quick previews:

```bash
npm install -g serve
serve -s build
```

## License

This project is maintained by [Pratham Pansare](https://github.com/Pratham2511). See the repository for
licensing details.
