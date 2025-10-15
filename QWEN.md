# Project Documentation

## Project Overview

This is a Vue 3 project built with Vite, TypeScript, and Element Plus. The project appears to be a navigation application called "my-navigator" (which translates to "My Navigator" in Chinese).

Key technologies used:
- Vue 3 (with Composition API)
- TypeScript
- Vite for development and building
- Element Plus for UI components
- Pinia for state management
- Vue Router for routing
- ESLint with Vue plugin for code quality
- Prettier for code formatting

## Project Structure

```
my-navigator/
├── src/                 # Source code directory
│   ├── components/      # Reusable Vue components
│   ├── views/           # Page components
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   ├── assets/          # Static assets
│   ├── App.vue          # Root Vue component
│   └── main.ts          # Application entry point
├── public/              # Static assets copied to dist
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig*.json       # TypeScript configurations
├── eslint.config.ts     # ESLint configuration
└── README.md            # Project documentation
```

## Building and Running

### Prerequisites
- Node.js version ^20.19.0 || >=22.12.0

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Type Checking
```bash
npm run type-check
```

## Development Conventions

1. **TypeScript**: All code is written in TypeScript with strict type checking
2. **Vue 3 Composition API**: Modern Vue 3 development using Composition API
3. **Component Structure**: Components are organized in the `src/components` directory
4. **Routing**: Vue Router is used for navigation between pages
5. **State Management**: Pinia is used for global state management
6. **UI Components**: Element Plus components are used for UI elements
7. **Code Quality**: 
   - ESLint with Vue plugin for linting
   - Prettier for code formatting
   - TypeScript type checking
8. **Project Structure**: 
   - Views in `src/views/`
   - Components in `src/components/`
   - Stores in `src/stores/`
   - Routing configuration in `src/router/`