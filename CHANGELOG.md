# Changelog

## 1.0.0 — 2026-06-17

Initial release.

- Toolbar button cycling Off / Dark / Light for the HTML mail body (DarkReader).
- DarkReader confined to the message preview frame; the rest of the UI is untouched.
- Settings block (Mailbox View): default mode (off/dark/light/auto/system) plus
  brightness, contrast, grayscale and sepia tuning.
- Per-browser persistence via `localStorage`; live reaction to OS theme changes
  in `system` mode.
- Tested on Roundcube 1.7.1 with the Elastic skin.
