# Security Policy

My Navigator is a frontend-first personal navigation dashboard. It can optionally call a user-configured backend proxy for image fetching.

## Supported Versions

Security fixes target the default branch.

## Reporting a Vulnerability

Please use GitHub private vulnerability reporting if it is enabled for this repository. If it is not enabled, open a GitHub issue with a minimal description and avoid posting working exploits, tokens, or private URLs.

## Security Notes

- Do not store sensitive production tokens in shared browser profiles.
- The optional backend proxy should validate and restrict outbound requests to avoid SSRF risks.
- User-provided icon URLs are rendered in the browser, so deployments should use a restrictive Content Security Policy where possible.
