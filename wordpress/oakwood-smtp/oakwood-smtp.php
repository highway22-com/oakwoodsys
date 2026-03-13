<?php
/**
 * Plugin Name: Oakwood SMTP
 * Description: Configura wp_mail para usar SMTP. Define las constantes en wp-config.php para activar.
 * Version: 1.0.0
 * Author: Aetro
 *
 * Uso en wp-config.php (antes de "That's all, stop editing!"):
 *
 *   // SMTP - relay GoDaddy (sin autenticación)
 *   define('OAKWOOD_SMTP_HOST', 'relay-hosting.secureserver.net');
 *   define('OAKWOOD_SMTP_PORT', 25);
 *   define('OAKWOOD_SMTP_FROM', 'noreply@oakwoodsystemsgroup.com');
 *   define('OAKWOOD_SMTP_FROM_NAME', 'Oakwood Systems');
 *
 *   // O con autenticación (smtpout.secureserver.net, SendGrid, etc.):
 *   define('OAKWOOD_SMTP_USER', 'tu-email@dominio.com');
 *   define('OAKWOOD_SMTP_PASS', 'tu-password');
 *   define('OAKWOOD_SMTP_SECURE', 'tls'); // 'tls', 'ssl' o ''
 */

defined('ABSPATH') || exit;

if (!defined('OAKWOOD_SMTP_HOST') || !OAKWOOD_SMTP_HOST) {
    return;
}

add_action('phpmailer_init', function ($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host = OAKWOOD_SMTP_HOST;
    $phpmailer->Port = defined('OAKWOOD_SMTP_PORT') ? (int) OAKWOOD_SMTP_PORT : 25;
    $phpmailer->SMTPAuth = defined('OAKWOOD_SMTP_USER') && defined('OAKWOOD_SMTP_PASS')
        && OAKWOOD_SMTP_USER !== '' && OAKWOOD_SMTP_PASS !== '';

    if ($phpmailer->SMTPAuth) {
        $phpmailer->Username = OAKWOOD_SMTP_USER;
        $phpmailer->Password = OAKWOOD_SMTP_PASS;
    }

    $secure = defined('OAKWOOD_SMTP_SECURE') ? OAKWOOD_SMTP_SECURE : '';
    if ($secure === 'tls' || $secure === 'ssl') {
        $phpmailer->SMTPSecure = $secure;
    } else {
        $phpmailer->SMTPSecure = '';
        $phpmailer->SMTPAutoTLS = false;
    }

    if (defined('OAKWOOD_SMTP_FROM') && is_email(OAKWOOD_SMTP_FROM)) {
        $phpmailer->From = OAKWOOD_SMTP_FROM;
    }
    if (defined('OAKWOOD_SMTP_FROM_NAME') && OAKWOOD_SMTP_FROM_NAME) {
        $phpmailer->FromName = OAKWOOD_SMTP_FROM_NAME;
    }
}, 10, 1);
