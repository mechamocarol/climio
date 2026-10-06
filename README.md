# Climio

Climio is a React Native application designed to help users identify a suitable time of day for an outdoor activity based on weather conditions.

## Overview

The repository currently contains the project foundation: tooling, folder structure, and documentation placeholders. Product behavior is not implemented yet.

## Tech Stack

- React Native with Expo
- TypeScript (strict)
- Expo Router
- NativeWind
- TanStack Query
- Zustand
- Zod
- React Hook Form
- Jest
- React Native Testing Library

## Architecture

Presentation → Application → Domain → Infrastructure.

Business logic is meant to stay independent of React Native and external APIs. Detailed decisions are TODO. See [docs/development/architecture.md](docs/development/architecture.md).

## Project Structure

```text
src/
├── app/                 # Expo Router routes only
├── providers/           # AppProviders, RepositoriesProvider
├── features/            # activity, plan, location, weather, recommendation
├── shared/              # components, theme, utils
└── infrastructure/api/
tests/
├── unit/
├── integration/
└── fixtures/
docs/
├── product/mvp/
└── development/
```

Feature modules are placeholders. `src/app` is reserved for Expo Router screens.

## Development

```bash
npm install
npm start
```

Then open the project in Expo Go, an iOS simulator, an Android emulator, or the web bundler.

## Testing

```bash
npm test
npm run typecheck
```

## Documentation

Product refinement and business rules live under `docs/product/mvp/`. Architecture and AI usage notes live under `docs/development/`.

## AI-assisted development

See [docs/development/ai-usage.md](docs/development/ai-usage.md). TODO.
