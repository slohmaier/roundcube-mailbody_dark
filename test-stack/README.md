# Test Stack (Roundcube + Greenmail)

Isolated Docker environment to demo/debug the plugin, **without live data**.
Mounts this repo directly as a Roundcube plugin (`plugins/mailbody_dark`).

## Quick start

```bash
cd test-stack
./start.sh                # up -> set up (user + newsletter mail)
```

Or manually:

```bash
docker compose up -d
./setup.sh
```

Then in the browser: <http://127.0.0.1:8098> — login **test / test**. Open the
"ACME weekly newsletter" and use the moon button in the mail toolbar to cycle
Off → Dark → Light.

Greenmail (dummy IMAP/SMTP) binds to `127.0.0.1:3144` (IMAP) and `127.0.0.1:3026`
(SMTP). All ports bind only to `127.0.0.1`.

> If your user is not in the `docker` group: `sudo docker compose up -d`
> and `DOCKER="sudo docker" ./setup.sh`.

## Screenshots

`test-stack/screenshots/generate.sh` brings the stack up, seeds the newsletter
and captures the mail body in Off/Dark/Light plus the settings block with
Playwright:

```bash
cd test-stack/screenshots
DOCKER="sudo docker" ./generate.sh
```

The PNGs land in `test-stack/screenshots/out/`. For the repo, copy `out/*.png`
to `docs/screenshots/` and commit.

## Cleanup

```bash
docker compose down            # containers gone
docker compose down -v         # including Greenmail state
```
