<?php
/**
 * Plugin Name: Oakwood Contact
 * Plugin URI: https://oakwoodsys.com
 * Description: Endpoint REST para enviar formularios de contacto vía wp_mail. Usado por Angular (oakwoodsys.com).
 * Version: 1.0.0
 * Author: Aetro
 * Author URI: https://oakwoodsys.com
 * License: GPL v2 or later
 * Text Domain: oakwood-contact
 */

defined('ABSPATH') || exit;

define('OAKWOOD_CONTACT_OPTION', 'oakwood_contact_fields');
define('OAKWOOD_CONTACT_EMAIL_OPTION', 'oakwood_contact_to_email');

/**
 * Campos por defecto del formulario de contacto
 */
function oakwood_contact_default_fields() {
    return [
        'fullName' => [
            'key'      => 'fullName',
            'label'    => 'Your full name',
            'enabled'  => true,
            'required' => true,
            'type'     => 'text',
        ],
        'email' => [
            'key'      => 'email',
            'label'    => 'Work email address',
            'enabled'  => true,
            'required' => true,
            'type'     => 'email',
        ],
        'company' => [
            'key'      => 'company',
            'label'    => 'Company',
            'enabled'  => true,
            'required' => false,
            'type'     => 'text',
        ],
        'message' => [
            'key'      => 'message',
            'label'    => 'Message',
            'enabled'  => true,
            'required' => true,
            'type'     => 'textarea',
        ],
    ];
}

/**
 * Obtener configuración de campos (desde opciones o por defecto)
 */
function oakwood_contact_get_fields() {
    $saved = get_option(OAKWOOD_CONTACT_OPTION, []);
    $defaults = oakwood_contact_default_fields();

    $fields = [];
    foreach ($defaults as $key => $def) {
        $fields[$key] = wp_parse_args($saved[$key] ?? [], $def);
    }

    return apply_filters('oakwood_contact_fields', $fields);
}

/**
 * Menú y página de configuración en el admin
 */
add_action('admin_menu', function () {
    add_options_page(
        __('Contact Form Fields', 'oakwood-contact'),
        __('Contact Form', 'oakwood-contact'),
        'manage_options',
        'oakwood-contact',
        'oakwood_contact_settings_page'
    );
});

function oakwood_contact_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    if (isset($_POST['oakwood_contact_save']) && check_admin_referer('oakwood_contact_save')) {
        $fields = oakwood_contact_default_fields();
        $saved = [];

        foreach ($fields as $key => $def) {
            $saved[$key] = [
                'key'      => $key,
                'label'    => sanitize_text_field($_POST['oakwood_contact_label'][$key] ?? $def['label']),
                'enabled'  => !empty($_POST['oakwood_contact_enabled'][$key]),
                'required' => !empty($_POST['oakwood_contact_required'][$key]),
                'type'     => $def['type'],
            ];
        }

        update_option(OAKWOOD_CONTACT_OPTION, $saved);

        $to_email = sanitize_email($_POST['oakwood_contact_to_email'] ?? '');
        if (is_email($to_email)) {
            update_option(OAKWOOD_CONTACT_EMAIL_OPTION, $to_email);
        }

        echo '<div class="notice notice-success"><p>' . esc_html__('Settings saved.', 'oakwood-contact') . '</p></div>';
    }

    $fields = oakwood_contact_get_fields();
    $to_email = get_option(OAKWOOD_CONTACT_EMAIL_OPTION, 'marketing@oakwoodsys.com');
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <form method="post" action="">
            <?php wp_nonce_field('oakwood_contact_save'); ?>

            <h2><?php esc_html_e('Recipient email', 'oakwood-contact'); ?></h2>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="oakwood_contact_to_email"><?php esc_html_e('Email to receive submissions', 'oakwood-contact'); ?></label></th>
                    <td>
                        <input type="email" id="oakwood_contact_to_email" name="oakwood_contact_to_email"
                            value="<?php echo esc_attr($to_email); ?>" class="regular-text" placeholder="marketing@oakwoodsys.com" />
                        <p class="description"><?php esc_html_e('All contact form submissions will be sent to this address.', 'oakwood-contact'); ?></p>
                    </td>
                </tr>
            </table>

            <h2><?php esc_html_e('Form fields', 'oakwood-contact'); ?></h2>
            <p><?php esc_html_e('Configure which fields appear in the contact form and whether they are required.', 'oakwood-contact'); ?></p>
            <table class="form-table">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Field', 'oakwood-contact'); ?></th>
                        <th><?php esc_html_e('Label', 'oakwood-contact'); ?></th>
                        <th><?php esc_html_e('Enabled', 'oakwood-contact'); ?></th>
                        <th><?php esc_html_e('Required', 'oakwood-contact'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($fields as $key => $field) : ?>
                        <tr>
                            <td><code><?php echo esc_html($key); ?></code></td>
                            <td>
                                <input type="text" name="oakwood_contact_label[<?php echo esc_attr($key); ?>]"
                                    value="<?php echo esc_attr($field['label']); ?>" class="regular-text" />
                            </td>
                            <td>
                                <input type="checkbox" name="oakwood_contact_enabled[<?php echo esc_attr($key); ?>]"
                                    value="1" <?php checked($field['enabled']); ?> />
                            </td>
                            <td>
                                <input type="checkbox" name="oakwood_contact_required[<?php echo esc_attr($key); ?>]"
                                    value="1" <?php checked($field['required']); ?> <?php echo !$field['enabled'] ? 'disabled' : ''; ?> />
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <p class="submit">
                <input type="submit" name="oakwood_contact_save" class="button button-primary" value="<?php esc_attr_e('Save Changes', 'oakwood-contact'); ?>" />
            </p>
        </form>

        <hr>
        <h2><?php esc_html_e('API endpoint', 'oakwood-contact'); ?></h2>
        <p><?php esc_html_e('Angular sends the form data to:', 'oakwood-contact'); ?></p>
        <code><?php echo esc_url(rest_url('oakwood/v1/send-contact')); ?></code>
        <p><?php esc_html_e('Form config (for dynamic forms):', 'oakwood-contact'); ?></p>
        <code><?php echo esc_url(rest_url('oakwood/v1/contact-fields')); ?></code>
    </div>
    <?php
}

/**
 * REST: GET /wp-json/oakwood/v1/contact-fields - devuelve la configuración para Angular
 */
add_action('rest_api_init', function () {
    register_rest_route('oakwood/v1', '/contact-fields', [
        'methods'             => 'GET',
        'callback'           => function () {
            $fields = oakwood_contact_get_fields();
            $list = [];
            foreach ($fields as $key => $f) {
                if ($f['enabled']) {
                    $list[] = [
                        'key'      => $key,
                        'label'    => $f['label'],
                        'required' => (bool) $f['required'],
                        'type'     => $f['type'],
                    ];
                }
            }
            return new \WP_REST_Response($list, 200);
        },
        'permission_callback' => '__return_true',
    ]);

    /**
     * REST: POST /wp-json/oakwood/v1/send-contact - envía el email
     */
    register_rest_route('oakwood/v1', '/send-contact', [
        'methods'             => 'POST',
        'callback'           => 'oakwood_contact_send',
        'permission_callback' => '__return_true',
        'args'                => oakwood_contact_rest_args(),
    ]);
});

/**
 * Generar args dinámicos para el REST según la configuración
 */
function oakwood_contact_rest_args() {
    $fields = oakwood_contact_get_fields();
    $args = [];

    foreach ($fields as $key => $f) {
        if (!$f['enabled']) {
            continue;
        }

        $arg = [
            'required' => $f['required'],
            'type'     => 'string',
        ];

        if ($key === 'email') {
            $arg['sanitize_callback'] = 'sanitize_email';
            $arg['validate_callback'] = function ($param) {
                return is_email($param);
            };
        } elseif ($key === 'message') {
            $arg['sanitize_callback'] = 'sanitize_textarea_field';
        } else {
            $arg['sanitize_callback'] = 'sanitize_text_field';
        }

        $args[$key] = $arg;
    }

    return $args;
}

/**
 * Callback: enviar email con wp_mail
 */
function oakwood_contact_send(\WP_REST_Request $request) {
    $fields = oakwood_contact_get_fields();
    $body_parts = [];

    foreach ($fields as $key => $f) {
        if (!$f['enabled']) {
            continue;
        }
        $value = $request->get_param($key);
        $value = $value !== null ? trim((string) $value) : '';
        $body_parts[] = sprintf('%s: %s', $f['label'], $value ?: '—');
    }

    $fullName = $request->get_param('fullName') ?: '';
    $email = $request->get_param('email') ?: '';

    $to = apply_filters('oakwood_contact_to_email', get_option(OAKWOOD_CONTACT_EMAIL_OPTION, 'marketing@oakwoodsys.com'));
    $subject = apply_filters('oakwood_contact_subject', 'New contact form submission - Oakwood Systems');

    $body = implode("\n", $body_parts);

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $fullName . ' <' . $email . '>',
    ];

    $sent = wp_mail($to, $subject, $body, $headers);

    if ($sent) {
        return new \WP_REST_Response(['success' => true, 'message' => 'Email sent'], 200);
    }

    return new \WP_REST_Response(
        ['success' => false, 'message' => 'Failed to send email'],
        500
    );
}
