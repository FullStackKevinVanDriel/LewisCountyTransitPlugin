#!/bin/bash

# deploy-plugin.sh
ENV_FILE=".env"

# Source the .env file from the project root
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
else
    echo ".env file not found at $ENV_FILE. Exiting..."
    exit 1
fi

# Navigate to the project root to run npm commands
cd "$PROJECT_ROOT" || { echo "Failed to navigate to $PROJECT_ROOT. Exiting..."; exit 1; }

# Step 1: Prompt user to choose between npm run build or npm run dev
echo "Choose an option:"
echo "1. Run 'npm run build'"
echo "2. Run 'npm run dev'"
read -p "Enter 1 or 2: " choice

if [ "$choice" = "1" ]; then
    echo "Running npm run build..."
    npm run build
elif [ "$choice" = "2" ]; then
    echo "Running npm run dev..."
    npm run dev
    echo "npm run dev completed. Exiting as per request..."
    exit 0
else
    echo "Invalid choice. Exiting..."
    exit 1
fi

# Check if the npm command was successful
if [ $? -ne 0 ]; then
    echo "npm command failed. Exiting..."
    exit 1
fi

# Step 2: Increment the version number in transit-route-planner.php (only for npm run build)
CURRENT_VERSION=$(grep "Version: [0-9]\+\.[0-9]\+\.[0-9]\+-alpha" "$PHP_FILE" | head -n 1 | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+-alpha")

if [ -z "$CURRENT_VERSION" ]; then
    echo "Could not find version pattern 'Version: X.X.X-alpha' in $PHP_FILE. Exiting..."
    exit 1
fi

LAST_NUMBER=$(echo "$CURRENT_VERSION" | grep -o "[0-9]\+-alpha" | grep -o "[0-9]\+")
NEW_LAST_NUMBER=$((LAST_NUMBER + 1))

NEW_VERSION=$(echo "$CURRENT_VERSION" | sed "s/[0-9]\+-alpha/$NEW_LAST_NUMBER-alpha/")

sed -i "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+-alpha/Version: $NEW_VERSION/g" "$PHP_FILE"

echo "Updated version in $PHP_FILE to Version: $NEW_VERSION"

# Ensure Author URI and Plugin URI are in the header
AUTHOR_URI="Author URI: https://vandromeda.com"
PLUGIN_URI="Plugin URI: https://github.com/FullStackKevinVanDriel/LewisCountyTransitPlugin"

sed -i "/Owner:/d" "$PHP_FILE"
sed -i "/Owner URI:/d" "$PHP_FILE"

if ! grep -q "Author URI:" "$PHP_FILE"; then
    sed -i "/Author:.*$/a $AUTHOR_URI" "$PHP_FILE"
else
    sed -i "s|Author URI:.*|$AUTHOR_URI|g" "$PHP_FILE"
fi

if ! grep -q "Plugin URI:" "$PHP_FILE"; then
    sed -i "/Description:.*$/a $PLUGIN_URI" "$PHP_FILE"
else
    sed -i "s|Plugin URI:.*|$PLUGIN_URI|g" "$PHP_FILE"
fi

echo "Updated Author URI and Plugin URI in $PHP_FILE"

# Step 3: Copy files from dist to the target dist directory (only for npm run build)
# Ensure the destination directory exists
mkdir -p "$DEST_DIR"

# Delete everything in dist/assets before copying new files
if [ -d "$DEST_DIR/assets" ]; then
    rm -rf "$DEST_DIR/assets"/*
fi

echo "Copying files from $SOURCE_DIST to $DEST_DIR..."
cp -r "$SOURCE_DIST"/* "$DEST_DIR"

# Step 4: Update transit-route-planner.php with new asset filenames (only for npm run build)
ASSETS_DIR="$DEST_DIR/assets"

JS_FILE=$(ls "$ASSETS_DIR" | grep "index-.*\.js" | head -n 1)
CSS_FILE=$(ls "$ASSETS_DIR" | grep "index-.*\.css" | head -n 1)

if [ -z "$JS_FILE" ] || [ -z "$CSS_FILE" ]; then
    echo "Could not find new JS or CSS files in $ASSETS_DIR. Exiting..."
    exit 1
fi

# Extract the old JS and CSS filenames within plugins_url
OLD_JS_FILENAME=$(grep "wp_enqueue_script('trp-react-app', plugins_url('/dist/assets/" "$PHP_FILE" | grep -o "index-.*\.js" | head -n 1)
OLD_CSS_FILENAME=$(grep "wp_enqueue_style('trp-styles', plugins_url('/dist/assets/" "$PHP_FILE" | grep -o "index-.*\.css" | head -n 1)

if [ -z "$OLD_JS_FILENAME" ] || [ -z "$OLD_CSS_FILENAME" ]; then
    echo "Could not find existing JS or CSS filenames in $PHP_FILE. Exiting..."
    exit 1
fi

# Replace only the filename part within plugins_url while preserving PHP syntax
sed -i "s|/dist/assets/$OLD_JS_FILENAME|/dist/assets/$JS_FILE|g" "$PHP_FILE"
sed -i "s|/dist/assets/$OLD_CSS_FILENAME|/dist/assets/$CSS_FILE|g" "$PHP_FILE"

echo "Updated $PHP_FILE with new asset filenames:"
echo "JS: $JS_FILE"
echo "CSS: $CSS_FILE"

# Step 5: Zip the transit-route-planner folder (only for npm run build)
if ! command -v zip &> /dev/null; then
    echo "zip command not found. Please install zip to create the archive."
    echo "On Git Bash (MINGW64), install via Chocolatey: choco install zip"
    echo "On WSL (e.g., Ubuntu), install with: sudo apt install zip"
    echo "Skipping zip creation..."
else
    ZIP_NAME="transit-route-planner-$NEW_VERSION.zip"
    ZIP_FULL_PATH="$ZIP_DEST/$ZIP_NAME"

    echo "Creating zip file $ZIP_NAME..."
    cd "$(dirname "$TRANSIT_DIR")" || { echo "Failed to navigate to $(dirname "$TRANSIT_DIR"). Exiting..."; exit 1; }
    zip -r "$ZIP_FULL_PATH" "$(basename "$TRANSIT_DIR")"

    if [ $? -eq 0 ]; then
        echo "Created zip file: $ZIP_FULL_PATH"
    else
        echo "Failed to create zip file. Exiting..."
        exit 1
    fi
fi

echo "Deployment complete!"