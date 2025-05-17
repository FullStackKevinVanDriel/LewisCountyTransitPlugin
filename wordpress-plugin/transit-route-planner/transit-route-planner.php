<?php
/*
Plugin Name: Transit Route Planner
Version: 0.1.34-alpha
Description: A transit route planner using Google Maps transit (Proof of Concept).
Author: Kevin A. VanDriel
Author URI: https://vandromeda.com
Plugin URI: https://github.com/FullStackKevinVanDriel/LewisCountyTransitPlugin
*/

// Clear the transient to force a fresh GitHub API check
delete_transient('trp_github_update_check');
delete_site_transient('update_plugins');

add_action('shutdown', function() {
    $update_plugins = get_site_transient('update_plugins');
    error_log('TRP Update Check - Full Update Plugins Transient: ' . print_r($update_plugins, true));
});

// Enqueue assets
function trp_enqueue_assets() {
    wp_enqueue_script('trp-react-app', plugins_url('/dist/assets/index-vjo38AUv.js', __FILE__), [], '1.0', true);
    wp_enqueue_style('trp-styles', plugins_url('/dist/assets/index-DjDgUale.css', __FILE__), [], '1.0');

    // Localize the API key for the React app
    $api_key = get_option('trp_api_key', '');
    wp_localize_script('trp-react-app', 'trpSettings', array(
        'apiKey' => $api_key
    ));
}
add_action('wp_enqueue_scripts', 'trp_enqueue_assets');

// Shortcode for the route planner
function trp_shortcode() {
    return '<div id="root" style="min-height: 500px; width: 100%; max-width: 1200px; margin: 0 auto;"></div>';
}
add_shortcode('transit_route_planner', 'trp_shortcode');

// Add settings page
function trp_register_settings() {
    // Register the API key setting
    register_setting('trp_settings_group', 'trp_api_key', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => ''
    ));

    // Add settings section
    add_settings_section(
        'trp_settings_section',
        'API Settings',
        'trp_settings_section_callback',
        'trp-settings'
    );

    // Add API key field
    add_settings_field(
        'trp_api_key_field',
        'Google Maps API Key',
        'trp_api_key_field_callback',
        'trp-settings',
        'trp_settings_section'
    );
}
add_action('admin_init', 'trp_register_settings');

// Callback for settings section
function trp_settings_section_callback() {
    echo '<p>Enter your Google Maps API key below to enable transit route planning.</p>';
}

// Callback for API key field
function trp_api_key_field_callback() {
    $api_key = get_option('trp_api_key', '');
    echo '<input type="text" name="trp_api_key" value="' . esc_attr($api_key) . '" size="50" />';
}

// Add top-level menu to the admin sidebar
function trp_add_admin_menu() {
    add_menu_page(
        'Transit Route Planner Settings', // Page title
        'Transit Route Planner',          // Menu title
        'manage_options',                 // Capability
        'trp-settings',                   // Menu slug
        'trp_settings_page',              // Callback function
        'dashicons-admin-site-alt3',      // Icon (Dashicons bus-like icon)
        80                                // Position in the menu
    );
}
add_action('admin_menu', 'trp_add_admin_menu');

// Render the settings page
function trp_settings_page() {
    echo '<div class="wrap">';
    echo '<h1>Transit Route Planner Settings</h1>';
    echo '<form method="post" action="options.php">';
    settings_fields('trp_settings_group');
    do_settings_sections('trp-settings');
    submit_button();
    echo '</form>';
    echo '</div>';
}

// Check for plugin updates from GitHub repository
add_filter('site_transient_update_plugins', function ($transient) {
    static $already_checked = false;
    if ($already_checked || empty($transient->checked)) {
        return $transient;
    }
    $already_checked = true;

    $plugin_file = plugin_basename(__FILE__);
    $repo_url = 'https://api.github.com/repos/FullStackKevinVanDriel/LewisCountyTransitPlugin/releases/latest';

    $cache_key = 'trp_github_update_check';
    $release = get_transient($cache_key);
    if ($release === false) {
        $response = wp_remote_get($repo_url, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/vnd.github.v3+json',
                'User-Agent' => 'WordPress Plugin Update Checker'
            ]
        ]);

        if (is_wp_error($response)) {
            error_log('GitHub API Error: ' . $response->get_error_message());
            return $transient;
        }

        if (wp_remote_retrieve_response_code($response) !== 200) {
            error_log('GitHub API Response Code: ' . wp_remote_retrieve_response_code($response));
            return $transient;
        }

        $release = json_decode(wp_remote_retrieve_body($response));
        set_transient($cache_key, $release, 12 * HOUR_IN_SECONDS);
    }

    if (!$release || empty($release->tag_name)) {
        error_log('GitHub Release Data Missing: ' . print_r($release, true));
        return $transient;
    }

    $plugin_data = get_plugin_data(__FILE__);
    $current_version = $plugin_data['Version'];
    $remote_version = ltrim($release->tag_name, 'v');

    error_log('TRP Update Check - Current Version: ' . $current_version);
    error_log('TRP Update Check - Remote Version: ' . $remote_version);
    $comparison_result = version_compare($remote_version, $current_version, '>');
    error_log('TRP Update Check - Is Remote Newer? ' . ($comparison_result ? 'Yes' : 'No'));

    if ($comparison_result) {
        $existing_response = isset($transient->response) ? (array) $transient->response : [];
        $existing_response[$plugin_file] = (object) [
            'id' => $plugin_file,
            'slug' => dirname($plugin_file),
            'plugin' => $plugin_file,
            'new_version' => $remote_version,
            'url' => 'https://github.com/FullStackKevinVanDriel/LewisCountyTransitPlugin',
            'package' => $release->assets[0]->browser_download_url ?? '',
            'tested' => '6.5',
            'requires' => '5.0',
            'requires_php' => '7.0',
        ];
        $transient->response = $existing_response;
        error_log('TRP Update Check - Transient Response: ' . print_r($transient->response[$plugin_file], true));

        // Directly set the transient to ensure persistence
        set_site_transient('update_plugins', $transient);
    }

    return $transient;
}, 999);

// Provide plugin details for the "View Details" link
add_filter('plugins_api', function ($result, $action, $args) {
    if ($action !== 'plugin_information') {
        return $result;
    }

    $plugin_file = plugin_basename(__FILE__);
    if ($args->slug !== dirname($plugin_file)) {
        return $result;
    }

    // Use cached response
    $cache_key = 'trp_github_update_check';
    $release = get_transient($cache_key);
    if (!$release) {
        return $result;
    }

    $remote_version = ltrim($release->tag_name, 'v');

    // Fetch plugin header data to avoid hardcoding
    $plugin_data = get_plugin_data(__FILE__);

    $result = new stdClass();
    $result->name = $plugin_data['Name'];
    $result->slug = $args->slug;
    $result->version = $remote_version;
    $result->author = $plugin_data['Author'];
    $result->homepage = $plugin_data['PluginURI'];
    $result->download_link = $release->assets[0]->browser_download_url ?? '';
    $result->sections = [
        'description' => $plugin_data['Description'],
        'changelog' => $release->body ?? 'No changelog provided.'
    ];
    $result->banners = [
        'low' => '',
        'high' => ''
    ];

    return $result;
}, 20, 3);
?>