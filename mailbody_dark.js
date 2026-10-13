/**
 * mailbody_dark — DarkReader for the mail body (Roundcube 1.7 / Elastic).
 *
 * Three roles, one file:
 *  - Parent (list/preview): registers the toolbar command, controls the mode.
 *  - Preview frame (#messagecontframe, env.framed, action=preview/show): applies
 *    DarkReader to ITS OWN document -> colours only the mail content.
 *  - extwin (mail in its own window): button + body in the same document.
 *
 * Mode in localStorage ('off'|'dark'|'light'|'auto'|'system'); the default +
 * theme tuning (brightness/contrast/grayscale/sepia) come from rcmail.env
 * (server preferences). localStorage is same-origin -> parent and frame share
 * the choice; the 'storage' event re-applies it in the frame.
 */
(function () {
    if (!window.rcmail) return;

    var KEY   = 'mailbody_dark_mode';
    var MODES = ['off', 'dark', 'light'];      // Button-Cycle (auto/system nur via Settings)

    function getMode() {
        try { var m = localStorage.getItem(KEY); if (m) return m; } catch (e) {}
        return (rcmail.env && rcmail.env.mailbody_dark_default) || 'off';
    }
    function setMode(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }

    function num(v, def) { v = parseInt(v, 10); return isNaN(v) ? def : v; }
    function theme() {
        var e = rcmail.env || {};
        return {
            brightness: num(e.mailbody_dark_brightness, 100),
            contrast:   num(e.mailbody_dark_contrast,   90),
            grayscale:  num(e.mailbody_dark_grayscale,  0),
            sepia:      num(e.mailbody_dark_sepia,      0)
        };
    }

    function uiIsDark() {
        var docs = [];
        try { docs.push(document); } catch (e) {}
        try { if (window.parent && window.parent !== window) docs.push(window.parent.document); } catch (e) {}
        for (var i = 0; i < docs.length; i++) {
            try { if (docs[i].documentElement.classList.contains('dark-mode')) return true; } catch (e) {}
        }
        return false;
    }
    function systemDark() {
        try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
        catch (e) { return false; }
    }
    function effective() {
        var m = getMode();
        if (m === 'auto')   return uiIsDark()   ? 'dark' : 'off';
        if (m === 'system') return systemDark() ? 'dark' : 'off';
        return m;
    }

    // Derive the DarkReader URL from the loaded plugin script (static.php prefix)
    function darkreaderSrc(doc) {
        var cands = [];
        try { if (doc) cands.push(doc); } catch (e) {}
        cands.push(document);
        for (var i = 0; i < cands.length; i++) {
            try {
                var s = cands[i].querySelector('script[src*="mailbody_dark/mailbody_dark.js"]');
                if (s && s.src) {
                    return s.src.replace(/\?.*$/, '').replace(/mailbody_dark\.js$/, 'darkreader.min.js');
                }
            } catch (e) {}
        }
        return location.origin + '/static.php/plugins/mailbody_dark/darkreader.min.js';
    }

    function applyTo(win) {
        if (!win) return;
        function run() {
            try {
                var DR = win.DarkReader;
                if (!DR) return;
                var m = effective(), th = theme();
                if (m === 'dark')       DR.enable({ mode: 1, brightness: th.brightness, contrast: th.contrast, grayscale: th.grayscale, sepia: th.sepia });
                else if (m === 'light') DR.enable({ mode: 0, brightness: th.brightness, contrast: th.contrast, grayscale: th.grayscale, sepia: th.sepia });
                else                    DR.disable();
            } catch (e) {}
        }
        if (win.DarkReader) { run(); return; }
        try {
            var doc = win.document;
            var s = doc.createElement('script');
            s.src = darkreaderSrc(doc);
            s.onload = run;
            (doc.head || doc.documentElement).appendChild(s);
        } catch (e) {}
    }

    window.__mailbodyDarkApply = function () { applyTo(window); };

    function applyCurrent() {
        if (rcmail.env.extwin) { applyTo(window); return; }
        var f = document.getElementById('messagecontframe');
        if (f && f.contentWindow) {
            try {
                if (f.contentWindow.__mailbodyDarkApply) { f.contentWindow.__mailbodyDarkApply(); return; }
            } catch (e) {}
            applyTo(f.contentWindow);
        }
    }

    function t(k) { try { return rcmail.gettext(k, 'mailbody_dark'); } catch (e) { return k; } }
    function labelFor(m) {
        return m === 'dark' ? t('modedark') : m === 'light' ? t('modelight') : t('modeoff');
    }

    function updateButton() {
        var m = getMode();
        try {
            $('a.button.mailbodydark')
                .toggleClass('active', effective() !== 'off')
                .toggleClass('mode-light', m === 'light')
                .attr('title', t('buttontitle') + ' [' + labelFor(effective()) + ']');
        } catch (e) {}
    }

    function toggle() {
        var idx  = MODES.indexOf(getMode());     // 'auto'/'system' -> -1 -> next 'off'
        var next = MODES[(idx + 1) % MODES.length];
        setMode(next);
        applyCurrent();
        updateButton();
        rcmail.display_message(t('nowusing') + ' ' + labelFor(next), 'confirmation');
        return false;
    }

    // The frame reacts to the parent's mode change + OS theme change (system mode)
    function wireFrameListeners() {
        try {
            window.addEventListener('storage', function (e) {
                if (!e || e.key === KEY || e.key === null) applyTo(window);
            });
        } catch (e) {}
        try {
            var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            if (mq && mq.addEventListener) mq.addEventListener('change', function () { applyTo(window); });
            else if (mq && mq.addListener) mq.addListener(function () { applyTo(window); });
        } catch (e) {}
    }

    rcmail.addEventListener('init', function () {
        if (rcmail.env.framed) {
            wireFrameListeners();
            applyTo(window);
            return;
        }
        rcmail.register_command('plugin.mailbody_dark.toggle', toggle, true);
        updateButton();
        if (rcmail.env.extwin) {
            applyTo(window);
        } else {
            var f = document.getElementById('messagecontframe');
            if (f) f.addEventListener('load', function () { setTimeout(applyCurrent, 60); });
        }
    });
})();
