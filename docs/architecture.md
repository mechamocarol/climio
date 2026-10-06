# Architecture

This document describes the intended separation of responsibilities in Climio. Detailed decisions are not defined yet. Record those later as ADRs in `docs/decisions/`.

## Layers

Presentation → Application → Domain → Infrastructure

- **Presentation.** Screens and components. Rendering and user interaction only.
- **Application.** Providers, navigation composition, and feature hooks that connect the UI to the rest of the app.
- **Domain.** Business rules as pure functions, independent of React Native and external APIs, so they can be unit tested on their own.
- **Infrastructure.** API access and other external boundaries. Not called directly from components. Server state goes through TanStack Query.

TODO: Define how each feature uses these layers, including weather data, geocoding, and the recommendation flow.

## Routes

Expo Router registers every module in its routes directory as a screen. Those files live in `src/routes`. Providers and navigation composition live in `src/app`, outside that directory. Navigation flows are TODO.
