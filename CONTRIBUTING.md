# Contributing

Thanks for considering a contribution to My Navigator.

## Development Setup

```sh
npm install
npm run dev
```

Before opening a pull request, run:

```sh
npm run type-check
npm run lint
npm run build
```

## Working Guidelines

- Keep changes focused and easy to review.
- Open an issue first for large UI changes, data model changes, or new backend assumptions.
- Do not commit private navigation data, real tokens, or organization-only URLs.
- Prefer typed Vue and Pinia changes over implicit `any` behavior.
- Keep default navigation data generally useful for developers.

## Pull Request Checklist

- The change has a clear user-facing purpose.
- Type checking passes.
- The production build passes.
- New configuration is documented in `README.md`.
- Screenshots or short screen recordings are included for visible UI changes.
