# Climio

**Find your best time to go.**

Climio is a React Native app that turns hourly weather forecasts into a simple, contextual answer: the best time window for an outdoor activity.

Instead of only showing the forecast, it helps users decide **when it is worth going out**.

---

## The problem

Weather APIs expose a lot of data. Most people still want a practical answer:

> "When is the best time to do this?"

Climio combines:

**Activity + Location + Date + Forecast**

into:

**Best time + conditions + explanation + alternatives**

---

## How it works

Current product flow:

```text
Welcome (/)
    ↓
Home
    ↓  (Bottom Sheets: activity → location → date)
Summary
    ↓
Result
    ├─ loading
    ├─ forecast error
    ├─ recommendation
    └─ no recommendation → back to Home to adjust the plan
```

Activity, location, and date are selected through **Bottom Sheets** in the current flow rather than through separate picker routes.

Location can be selected in two ways:

- manual city search (Open-Meteo Geocoding);
- **Use my location** (device GPS via `expo-location`).

Both paths produce the same domain `Location` and call the same `Plan.setLocation` path. There is no separate `CurrentLocation` type.

### Result states

| State | Behavior |
|---|---|
| Loading | Weather forecast analysis is in progress |
| Error | Forecast request failed; retry or return to the start |
| Recommendation | Best time window, weather metrics, explanation, and alternatives |
| No recommendation | No suitable window was found; the user can return to Home and adjust the plan |

---

## Stack

### App

- React Native
- Expo
- Expo Router
- TypeScript (strict)

### State & data

- TanStack Query — server state for geocoding and weather forecasts
- Zustand — client state for the user's plan: activity, location, and date
- Zod — validation of external API responses

### Location

- `expo-location` — permission, GPS fix, and reverse geocoding for “Use my location”

### UI

- NativeWind
- React Native SVG (`ClimioIcon`)

### Testing

- Jest (`jest-expo`)
- React Native Testing Library

### API

- [Open-Meteo](https://open-meteo.com/) — geocoding, timezone resolution (`timezone=auto`), and hourly weather forecasts

---

## Architecture

The project uses a feature-based architecture with a clear separation between presentation, application logic, domain rules, and infrastructure.

```text
Presentation
      ↓
Application / Hooks
      ↓
Domain
      ↓
Infrastructure
```

### Project structure

```text
src/
├── app/                  # Expo Router routes and screen composition
├── features/
│   ├── activity/
│   ├── location/
│   ├── onboarding/
│   ├── plan/
│   ├── recommendation/
│   └── weather/
├── infrastructure/      # HTTP client and Query Client configuration
├── providers/            # App, theme, and repository providers
└── shared/
    ├── theme/            # Design tokens and theme configuration
    └── ui/               # Shared product UI primitives
```

| Folder | Responsibility |
|---|---|
| `app/` | Expo Router routes and screen composition |
| `features/` | Domain, data, hooks, and presentation organized by context |
| `providers/` | Global providers and repository dependency injection |
| `infrastructure/` | HTTP client and Query Client configuration |
| `shared/theme/` | Light/Dark design tokens and theme configuration |
| `shared/ui/` | Shared UI primitives used across the product |

More details: [`docs/development/architecture.md`](docs/development/architecture.md).

### Server state vs. client state

**TanStack Query** handles server state:

- location search;
- hourly weather forecasts;
- caching and request lifecycle.

The Summary screen prefetches the hourly forecast with the same `useHourlyForecast` query used by Result (same query key, repository, and QueryClient), so Result can reuse a warm cache when the plan already has latitude, longitude, and date.

**Zustand** handles the user's current plan:

- `activityId`;
- `location`;
- `date`.

Zustand does not replace the server-state layer. It only stores the user's current selection during the session.

---

## Location selection

### Manual search

```text
City query → Open-Meteo Geocoding → Location → Plan.setLocation
```

Geocoding already provides name, region, country, coordinates, and IANA timezone.

### Use my location

```text
Permission + GPS (`getCurrentDeviceLocation`)
      ↓
reverseGeocodeAsync ─────────┐
                              ├→ Location → Plan.setLocation
Open-Meteo timezone=auto ─────┘
      ↓
Forecast → Recommendation
```

Details:

- reverse geocoding and timezone resolution run **in parallel** after coordinates are available (`Promise.allSettled`);
- GPS-derived locations use a synthetic deterministic id (`gps:latitude,longitude`);
- labels come from `expo-location.reverseGeocodeAsync` (fallback name: `Minha localização`);
- timezone comes from Open-Meteo so it stays aligned with the forecast;
- permission denied, GPS unavailable, reverse-geocode failure, and timezone failure are handled explicitly in the location sheet;
- the Recommendation Engine is unchanged — it only receives a domain `Location`.

---

## Recommendation Engine

The Recommendation Engine is a **pure domain layer**. It receives normalized weather data and activity rules and produces a deterministic result without depending on React, UI, or network calls.

```text
Weather Data  +  Activity Rules
              ↓
      Recommendation Engine
              ↓
       Recommendation
       + Alternatives
       + Score / Status
       + Explanation
```

### Recommendation pipeline

The engine is organized into explicit stages:

| Stage | Responsibility |
|---|---|
| **C3** | Evaluates each hourly period: score, status, blocking conditions, and `activityHours` |
| **C4** | Builds candidate windows, including practical 2h windows and 1h periods |
| **C5** | Selects the best recommendation window |
| **C6** | Selects up to 3 non-overlapping alternatives |
| **C7** | Aggregates factors, classifies them, and builds the structured explanation |

The detailed business rules are documented in [`docs/product/mvp/business-rules.md`](docs/product/mvp/business-rules.md).

### Selecting the best window

C5 follows these rules:

1. If there is at least one practical window of **2h or more**, the recommendation is selected from that pool.
2. If no 2h+ window exists, a **1h fallback** may be considered.
3. A 1h fallback must have `IDEAL` status.
4. A 1h `ACCEPTABLE` window can never become the main recommendation.
5. If no valid option exists, `recommendation` is `null`.

Within the selected pool, the tie-break order is:

1. Daylight preference when applicable and within the configured tolerance;
2. Average score;
3. Minimum score within the window;
4. Duration;
5. Earlier start time.

Activity-specific rules, thresholds, blocking conditions, and scoring details are documented in [`docs/product/mvp/business-rules.md`](docs/product/mvp/business-rules.md).

---

## API

The MVP uses **Open-Meteo** for location search, GPS timezone resolution, and hourly weather forecasts.

```text
Manual search: Geocoding → Location (includes timezone)
GPS path:      Coordinates → reverse geocode + timezone=auto → Location
                    ↓
              Hourly forecast
                    ↓
              HourlyWeather domain model
                    ↓
              Recommendation Engine
```

The UI and domain logic do not consume the external API response directly.

The infrastructure layer validates the response with Zod, maps the DTO into the domain model, and exposes it through repositories. GPS timezone resolution uses a small Open-Meteo forecast request with `timezone=auto` and does not go through the weather repository used for hourly analysis.

---

## Timezone and date handling

The selected plan date is treated as a calendar date in `YYYY-MM-DD` format.

Weather forecasts use the timezone of the selected location. Hourly timestamps are treated as the **local wall-clock time of that location**, rather than being blindly converted to the device timezone.

`Location.timezone` is populated differently by path:

- manual search — from Open-Meteo Geocoding;
- GPS — from Open-Meteo `timezone=auto` for the GPS coordinates.

For the current day, the Recommendation Engine receives the current wall-clock time in that IANA timezone. Periods whose start time has already passed at the selected location are excluded from both the main recommendation and alternative windows.

---

## Testing

Current repository state:

- **40 test suites**
- **406 tests passing**

Test coverage is primarily focused on:

- Recommendation Engine (C3–C7);
- activity rules and blocking conditions;
- geocoding, GPS location resolution, and weather integrations;
- schemas, mappers, repositories, and hooks;
- Plan domain, Zustand store, and Summary forecast prefetch;
- presentation and theme helpers.

### Known testing limitations

There is currently no E2E suite or dedicated screen/navigation test suite.

The strongest coverage is concentrated around the domain rules and data integration layers, where deterministic behavior and business correctness are most critical for the case.

---

## Getting started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

With Metro running, open the app using Expo Go on a physical device, or use one of the available platform commands:

```bash
npm run ios
npm run android
npm run web
```

### Run tests

```bash
npm test
```

### Type checking

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

---

## Quality

The current repository passes:

- test suite;
- TypeScript type checking;
- ESLint.

The project currently has no known TypeScript or lint errors.

---

## Technical decisions

Some of the main technical decisions behind the MVP:

- Feature-based architecture with domain logic isolated from the UI;
- Pure and deterministic Recommendation Engine;
- TanStack Query for server state;
- Zustand for the user's current plan;
- Repository boundaries between external APIs and the domain;
- Zod validation at the API boundary;
- Single domain `Location` for both manual search and GPS;
- Location timezone as the source of truth for temporal analysis;
- Parallel reverse geocode + timezone resolution after a GPS fix;
- Forecast prefetch on Summary via the same TanStack Query as Result;
- 2h as the preferred recommendation window;
- 1h fallback only when the period is `IDEAL`;
- Daylight as a contextual tie-breaker rather than a scoring factor.

More detailed architectural decisions are documented in [`docs/development/architecture.md`](docs/development/architecture.md).

---

## MVP and out of scope

The current MVP includes:

- Welcome and Home flow;
- activity selection from a fixed catalog;
- location via city search or current device location;
- date selection;
- hourly weather forecast;
- 10 supported outdoor activities;
- activity-specific recommendation rules;
- Recommendation Engine C3–C7;
- recommendation explanation;
- alternative windows;
- loading, error, and empty states;
- Light/Dark theme.

Core loop:

```text
Activity + Location + Date
  → Forecast → Analysis → Best time → Explanation → Alternatives
```

The following are intentionally **out of scope for the MVP**:

- natural-language activity input;
- voice / microphone input;
- login and user accounts;
- saved recommendations;
- favorites;
- history;
- notifications;
- advanced personalization;
- custom activities and custom weather criteria.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/product/mvp/business-rules.md`](docs/product/mvp/business-rules.md) | Product and Recommendation Engine business rules |
| [`docs/product/mvp/refinement.md`](docs/product/mvp/refinement.md) | MVP refinement and product decisions |
| [`docs/development/architecture.md`](docs/development/architecture.md) | Architecture and technical decisions |
| [`docs/development/ai-usage.md`](docs/development/ai-usage.md) | AI-assisted development workflow and responsible AI usage |
| [`AGENTS.md`](AGENTS.md) | Repository conventions and agent guidelines |

AI usage and development workflow are documented separately in [`docs/development/ai-usage.md`](docs/development/ai-usage.md).
