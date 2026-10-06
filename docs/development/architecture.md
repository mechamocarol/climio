# Architecture

This document describes the intended separation of responsibilities in Climio. Detailed decisions are not defined yet. Record those later as ADRs in `docs/development/decisions/`.

## Layers

Presentation → Application → Domain → Infrastructure

- **Presentation.** Screens and components. Rendering and user interaction only.
- **Application.** Providers, feature hooks, and UI stores that connect the UI to the rest of the app.
- **Domain.** Business rules as pure functions, independent of React Native and external APIs, so they can be unit tested on their own.
- **Infrastructure.** API access and other external boundaries. Not called directly from components. Server state goes through TanStack Query.

TODO: Define how each feature uses these layers, including weather data, geocoding, and the recommendation flow.

The Recommendation Engine (not implemented yet) must remain a pure, deterministic domain module. It should receive activity + weather data + activity rules, and return recommendation, candidate periods, score, status, relevant factors, and explanation. Infrastructure only maps external API payloads into the domain model. Natural-language activity and date resolution happen outside the engine; the engine receives already-resolved inputs.

## Project structure

```text
src/
├── app/                 # Expo Router routes only
├── providers/           # AppProviders, RepositoriesProvider
├── features/            # activity, plan, location, weather, recommendation
├── shared/              # components, theme, utils
└── infrastructure/api/  # QueryClient, HTTP client
```

## Routes

Expo Router registers every module in `src/app` as a screen. Keep providers, features, domain, and infrastructure code outside that directory.

Navigation flows and screen composition are TODO.
