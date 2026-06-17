# mailbody_dark

A [Roundcube](https://roundcube.net/) plugin that renders the **HTML mail body**
in dark or light mode via [DarkReader](https://darkreader.org/) — without
re-colouring the rest of the Roundcube UI. Think of it as the DarkReader browser
add-on, but scoped to just the message content.

Tested with Roundcube 1.7.x and the **Elastic** skin.

## Features

- Toolbar button in the message view that cycles **Off → Dark → Light**.
- Per-browser persistence (the chosen mode applies to every message you open).
- Settings block (Settings → Preferences → Mailbox View → *Dark mode for mail
  content*) with a server-side **default mode** and DarkReader tuning:
  - **Default mode**: Off / Dark / Light / Auto (follow Roundcube theme) /
    System (follow OS `prefers-color-scheme`)
  - **Brightness**, **Contrast**, **Grayscale**, **Sepia**
- DarkReader runs **inside the message preview frame**, so only the mail content
  is themed — the folder list, toolbar and headers stay untouched.
- Live reaction to OS theme changes when *System* mode is selected.

## Requirements

- Roundcube 1.6+ (developed and tested on 1.7.1)
- Elastic skin (the bundled icon CSS targets Elastic)

## Installation

### Composer (recommended)

```sh
composer require slohmaier/mailbody_dark
```

### Manual

Copy this repository into your Roundcube `plugins/` directory as
`plugins/mailbody_dark/`.

### Enable

Add `mailbody_dark` to the `plugins` array in your Roundcube config
(`config/config.inc.php`):

```php
$config['plugins'] = ['archive', 'zipdownload', /* ... */ 'mailbody_dark'];
```

Then reload Roundcube in your browser (hard-reload, Ctrl+Shift+R, so the new
JS/CSS is picked up). A moon icon appears in the mail toolbar.

## Configuration (optional)

Per-user preferences are set in Settings and need no config file. To change the
**global defaults**, copy `config.inc.php.dist` to `config.inc.php` (or set the
keys in your main config):

```php
$config['mailbody_dark_default']    = 'off';   // off | dark | light | auto | system
$config['mailbody_dark_brightness'] = 100;     // 0..200
$config['mailbody_dark_contrast']   = 90;       // 0..200
$config['mailbody_dark_grayscale']  = 0;        // 0..100
$config['mailbody_dark_sepia']      = 0;        // 0..100
```

The per-button choice is stored in the browser (`localStorage`,
`mailbody_dark_mode`) and overrides the default once set; `auto`/`system` are
only selectable as a default.

## How it works

In Elastic the HTML mail body is rendered inside the same-origin preview iframe
`#messagecontframe`. The plugin loads DarkReader into **that** frame and calls
`DarkReader.enable()/disable()` there, so theming is confined to the message.
The toolbar button (parent window) writes the mode to `localStorage`; the frame
re-applies on the `storage` event and on `prefers-color-scheme` changes.

### Notes for Roundcube/Elastic plugin authors

A few things that are easy to miss when building toolbar plugins for Elastic:

- Toolbar buttons go through the command framework. A button added via
  `add_button(..., 'toolbar')` stays **disabled/invisible** unless its command is
  registered in JS with `rcmail.register_command('plugin.<name>.<cmd>', fn, true)`
  (the third `true` enables it). A raw `onclick` is not enough.
- The message preview loads with `action=preview` (not `show`) — include
  per-message assets for both actions.
- Plugin assets are served under `/static.php/plugins/...`, not `/plugins/...`.

## Third-party

Bundles [DarkReader](https://github.com/darkreader/darkreader) 4.9.109
(`darkreader.min.js`), MIT-licensed, © Alexander Shutau and contributors. See
[NOTICE](NOTICE).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
