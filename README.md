# Climio

Climio is a React Native application designed to help users identify a suitable time of day for an outdoor activity based on weather conditions.

## Overview

The repository currently contains the project foundation: tooling, folder structure, and documentation placeholders. Product behavior is not implemented yet.

## Tech Stack

- React Native with Expo
- TypeScript (strict)
- TanStack Query
- Zod
- React Hook Form
- Jest
- React Native Testing Library

## Architecture

Presentation → Application → Domain → Infrastructure.

Business logic is meant to stay independent of React Native and external APIs. Detailed decisions are TODO. See [docs/architecture.md](docs/architecture.md).

## Project Structure

```text
src/
├── app/                 # application shell (providers, navigation)
├── routes/              # Expo Router screens
├── features/            # location, weather, recommendation
├── shared/
└── infrastructure/api/
tests/
├── unit/
└── integration/
docs/
```

Feature modules are placeholders. `src/routes` exists because Expo Router cannot share its routes directory with non-screen modules.

## Development

```bash
npm install
npm start
```

Then open the project in Expo Go, an iOS simulator, an Android emulator, or the web bundler.

## Testing

```bash
npm test
npx tsc --noEmit
```

## Documentation

Product refinement, business rules, architecture, and AI usage notes live under `docs/`. Most of that content is still TODO.

## AI-assisted development

See [docs/ai-usage.md](docs/ai-usage.md). TODO.
