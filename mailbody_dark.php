<?php
/**
 * mailbody_dark — DarkReader dark/light mode for the mail body.
 *
 * Button in the mail toolbar (Roundcube command 'plugin.mailbody_dark.toggle'),
 * cycles Off -> Dark -> Light. DarkReader runs INSIDE the message frame
 * (#messagecontframe, action=preview/show) and only colours the mail content,
 * not the Roundcube UI. The mode persists via localStorage; the default +
 * theme tuning are per user under Settings > Preferences >
 * Mailbox View (block "Dark mode for mail content").
 *
 * Docs/background: README.md. Roundcube 1.7.1, Elastic skin.
 */
class mailbody_dark extends rcube_plugin
{
    // NO $task -> runs on 'mail' (button) AND 'settings' (prefs)

    private $defaults = [
        'mailbody_dark_default'    => 'off',
        'mailbody_dark_brightness' => 100,
        'mailbody_dark_contrast'   => 90,
        'mailbody_dark_grayscale'  => 0,
        'mailbody_dark_sepia'      => 0,
    ];

    function init()
    {
        $rcmail = rcube::get_instance();

        $this->add_texts('localization/', true);

        if ($rcmail->task == 'mail') {
            $this->include_script('mailbody_dark.js');
            if (in_array($rcmail->action, ['show', 'preview'], true)) {
                $this->include_script('darkreader.min.js');
            }
            $this->include_stylesheet($this->local_skin_path() . '/mailbody_dark.css');

            $this->add_button([
                'command'    => 'plugin.mailbody_dark.toggle',
                'type'       => 'link',
                'class'      => 'button buttonPas mailbodydark disabled',
                'classact'   => 'button mailbodydark',
                'classsel'   => 'button mailbodydark pressed',
                'innerclass' => 'inner',
                'title'      => 'mailbody_dark.buttontitle',
                'label'      => 'mailbody_dark.buttonlabel',
            ], 'toolbar');

            foreach ($this->defaults as $key => $def) {
                $rcmail->output->set_env($key, $rcmail->config->get($key, $def));
            }
        }
        else if ($rcmail->task == 'settings') {
            $this->add_hook('preferences_list', [$this, 'prefs_list']);
            $this->add_hook('preferences_save', [$this, 'prefs_save']);
        }
    }

    function prefs_list($args)
    {
        if ($args['section'] != 'mailview') {
            return $args;
        }

        $rcmail = rcube::get_instance();

        // Default mode
        $select = new html_select(['name' => '_mailbody_dark_default', 'id' => 'mailbody_dark_default']);
        $select->add($this->gettext('modeoff'),    'off');
        $select->add($this->gettext('modedark'),   'dark');
        $select->add($this->gettext('modelight'),  'light');
        $select->add($this->gettext('modeauto'),   'auto');
        $select->add($this->gettext('modesystem'), 'system');

        $options = [
            'mailbody_dark_default' => [
                'title'   => html::label('mailbody_dark_default', rcube::Q($this->gettext('defaultmode'))),
                'content' => $select->show($rcmail->config->get('mailbody_dark_default', $this->defaults['mailbody_dark_default'])),
            ],
        ];

        // Numeric theme knobs
        $nums = [
            'mailbody_dark_brightness' => ['label' => 'brightness', 'min' => 0, 'max' => 200, 'step' => 5],
            'mailbody_dark_contrast'   => ['label' => 'contrast',   'min' => 0, 'max' => 200, 'step' => 5],
            'mailbody_dark_grayscale'  => ['label' => 'grayscale',  'min' => 0, 'max' => 100, 'step' => 5],
            'mailbody_dark_sepia'      => ['label' => 'sepia',      'min' => 0, 'max' => 100, 'step' => 5],
        ];
        foreach ($nums as $key => $cfg) {
            $field = new html_inputfield([
                'name' => '_' . $key, 'id' => $key, 'type' => 'number',
                'min'  => $cfg['min'], 'max' => $cfg['max'], 'step' => $cfg['step'], 'size' => 4,
            ]);
            $options[$key] = [
                'title'   => html::label($key, rcube::Q($this->gettext($cfg['label']))),
                'content' => $field->show((string) $rcmail->config->get($key, $this->defaults[$key])),
            ];
        }

        $args['blocks']['mailbody_dark'] = [
            'name'    => rcube::Q($this->gettext('blocktitle')),
            'options' => $options,
        ];

        return $args;
    }

    function prefs_save($args)
    {
        if ($args['section'] != 'mailview') {
            return $args;
        }

        $mode = rcube_utils::get_input_value('_mailbody_dark_default', rcube_utils::INPUT_POST);
        if (!in_array($mode, ['off', 'dark', 'light', 'auto', 'system'], true)) {
            $mode = 'off';
        }
        $args['prefs']['mailbody_dark_default'] = $mode;

        $clamp = [
            'mailbody_dark_brightness' => [0, 200],
            'mailbody_dark_contrast'   => [0, 200],
            'mailbody_dark_grayscale'  => [0, 100],
            'mailbody_dark_sepia'      => [0, 100],
        ];
        foreach ($clamp as $key => $range) {
            $v = (int) rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST);
            $v = max($range[0], min($range[1], $v));
            $args['prefs'][$key] = $v;
        }

        return $args;
    }
}
