# Climio

React Native application built with Expo. Follow these rules when changing the project.

## Principles

- Use TypeScript strict mode.
- Prefer feature-based architecture.
- Keep business/domain logic independent from React components.
- Keep API/infrastructure concerns separated from business logic.
- Do not put API calls directly inside components.
- Use TanStack Query for server state.
- Prefer pure functions for business/domain logic.
- Business rules must be independently testable.
- Avoid unnecessary abstractions and overengineering.
- Do not introduce dependencies without justification.
- Follow existing project conventions.
- Favor small, composable functions and components.
- Keep components focused on presentation and user interaction.
- Use semantic and descriptive names.
- Do not implement functionality that has not been explicitly requested.

## Expo

- Install packages with `npx expo install` so versions stay compatible with the Expo SDK in `package.json`.
- Read versioned Expo docs for that SDK before using an Expo API.
- Expo Router treats every `.ts` / `.tsx` file in its routes directory as a screen. Route files live in `src/routes`. Do not put providers, features, or domain code there.
- The application shell (providers and future navigation composition) lives in `src/app`.
- Do not create or edit `ios/` and `android/` by hand. Native projects are generated from `app.json`.
