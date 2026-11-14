# Changelog

All notable changes to MealaweRiderAppRN are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Rider app foundation: login (OTP), onboarding, permissions, shift and attendance, orders and
  route, pickup and delivery with proof, background tracking, wallet and incentives.
- Push events: in-app banner, order refresh, tap-to-open; notification channel for closed-app pushes.
- Dark-mode route map, accessibility pass, Maestro flows.

### Changed
### Fixed
- Root URL "/" had no screen and showed "Unmatched Route"; added the boot-gate `index`.
- Android build failed on `app.notifee:core`; added the notifee Maven repo config plugin.
