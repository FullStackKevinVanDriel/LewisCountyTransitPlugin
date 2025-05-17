<?php
/*
Plugin Name: Lewis County Transit Route Planner
Version: 0.1.30-alpha
Description: A transit route planner for Lewis County, WA using Google Maps transit (Proof of Concept).
Author: Web Design By Mark
Author URI: https://webdesignbymark.com
Plugin URI: https://github.com/FullStackKevinVanDriel/LewisCountyTransitPlugin
*/

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
    ?>
    <div class="wrap">
        <h1>Transit Route Planner Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('trp_settings_group');
            do_settings_sections('trp-settings');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}