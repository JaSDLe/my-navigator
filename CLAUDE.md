# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a Vue 3 application built with Vite, using the following key technologies:

- **State Management**: Pinia for global state (settings store in `src/stores/settings.ts`)
- **Routing**: Vue Router (configured in `src/router/index.ts`)
- **UI Framework**: Element Plus for components and icons
- **Configuration**: Navigation links and sections are defined in `src/config/nav.ts`

### Key Directories and Files

- `src/config/nav.ts`: Contains the navigation data structure with `NavSection` and `NavLink` types, defining all the links displayed in the application
- `src/stores/settings.ts`: Pinia store that manages dark mode, site title, and navigation sections with localStorage persistence
- `src/router/index.ts`: Vue Router configuration with a single route for the HomeView
- `src/main.ts`: Application entry point that initializes Vue, Pinia, Vue Router, and Element Plus
- `src/views/HomeView.vue`: Main view component
- `src/components/`: Contains reusable components like `AppNavbar.vue`, `SectionGrid.vue`, and `SettingsDrawer.vue`

The application is a personal navigation dashboard that displays categorized links with icons and supports dark mode theming.