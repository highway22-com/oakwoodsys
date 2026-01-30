<?php
/**
 * Plugin Name: Oakwood CORS Configuration
 * Plugin URI: https://oakwoodsys.com
 * Description: Configuración de CORS para GraphQL - Permite conexiones desde Angular y otros clientes externos
 * Version: 1.0.0
 * Author: Oakwood Systems
 * Author URI: https://oakwoodsys.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: oakwood-cors
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Configuración de dominios permitidos
 * Agrega tus dominios aquí
 */
function oakwood_get_allowed_origins() {
    return apply_filters('oakwood_allowed_origins', [
        'http://localhost:4200',           // Desarrollo local Angular
        'http://localhost:3000',           // Desarrollo alternativo
        'https://oakwoodsys.com',          // Producción (reemplaza con tu dominio)
        'https://www.oakwoodsys.com',      // Producción con www
        'https://oakwoodsys.netlify.app',    // Netlify (reemplaza con tu URL)
    ]);
}

/**
 * Agregar headers CORS para todas las peticiones
 */
function oakwood_add_cors_headers() {
    $allowed_origins = oakwood_get_allowed_origins();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Verificar si el origen está permitido
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 horas
    }

    // Manejar preflight requests (OPTIONS)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
add_action('init', 'oakwood_add_cors_headers', 1);

/**
 * Configurar headers específicos para WPGraphQL
 */
function oakwood_graphql_cors_headers($headers) {
    $allowed_origins = oakwood_get_allowed_origins();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        $headers['Access-Control-Allow-Origin'] = $origin;
        $headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
        $headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        $headers['Access-Control-Allow-Credentials'] = 'true';
        $headers['Access-Control-Max-Age'] = '86400';
    }

    return $headers;
}
add_filter('graphql_response_headers', 'oakwood_graphql_cors_headers', 10, 1);

/**
 * Agregar página de configuración en el admin (opcional)
 */
function oakwood_cors_admin_menu() {
    add_options_page(
        'Oakwood CORS Settings',
        'Oakwood CORS',
        'manage_options',
        'oakwood-cors',
        'oakwood_cors_settings_page'
    );
}
add_action('admin_menu', 'oakwood_cors_admin_menu');

/**
 * Página de configuración del plugin
 */
function oakwood_cors_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    $allowed_origins = oakwood_get_allowed_origins();
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <div class="card">
            <h2>Dominios Permitidos</h2>
            <p>Los siguientes dominios tienen permitido hacer peticiones CORS a GraphQL:</p>
            <ul>
                <?php foreach ($allowed_origins as $origin): ?>
                    <li><code><?php echo esc_html($origin); ?></code></li>
                <?php endforeach; ?>
            </ul>
            <p><strong>Nota:</strong> Para agregar o modificar dominios, edita el archivo del plugin o usa el filtro <code>oakwood_allowed_origins</code>.</p>
        </div>
        <div class="card">
            <h2>Estado del Plugin</h2>
            <p>✅ CORS está activo y funcionando</p>
            <p>✅ WPGraphQL headers configurados</p>
        </div>
    </div>
    <?php
}

/**
 * Mensaje de activación
 */
function oakwood_cors_activation_notice() {
    ?>
    <div class="notice notice-success is-dismissible">
        <p><strong>Oakwood CORS Configuration</strong> ha sido activado. Los headers CORS están configurados para GraphQL.</p>
    </div>
    <?php
}
register_activation_hook(__FILE__, function() {
    add_action('admin_notices', 'oakwood_cors_activation_notice');
});
