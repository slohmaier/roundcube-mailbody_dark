# Changelog

## 1.0.2 — 2026-10-13

- Moved `roundcube/plugin-installer` to `require-dev` so requiring the plugin no
  longer pulls the whole `roundcube/roundcubemail` dependency tree. The plugin
  type is still handled by the installer in the Roundcube root project.

## 1.0.1 — 2026-10-13

- English-only code comments and docs.
- Added README screenshots (Off / Dark / Light and the settings block) plus a
  reproducible Docker test stack (`test-stack/`) with Playwright capture.
- Published on Packagist as `slohmaier/mailbody_dark`.

## 1.0.0 — 2026-06-17

Initial release.

- Toolbar button cycling Off / Dark / Light for the HTML mail body (DarkReader).
- DarkReader confined to the message preview frame; the rest of the UI is untouched.
- Settings block (Mailbox View): default mode (off/dark/light/auto/system) plus
  brightness, contrast, grayscale and sepia tuning.
- Per-browser persistence via `localStorage`; live reaction to OS theme changes
  in `system` mode.
- Tested on Roundcube 1.7.1 with the Elastic skin.
