# Lewis County Transit Plugin

A WordPress plugin for transit route planning in Lewis County, WA, with a React-based frontend displaying county margins on a map.

## Project Structure

- `src/`: React/TypeScript source files (`App.tsx`, `main.tsx`, etc.).
- `dist/`: Built assets (`index.js`, `index.css`) for WordPress.
- `wordpress-plugin/`: WordPress plugin folder (`transit-route-planner.php`).
- `.env`: Environment variables (ignored in `.gitignore`).
- `vite.config.ts`: Vite config for build settings.

## Prerequisites

- Node.js (v16+ recommended) and npm.
- WordPress environment (e.g., `www.mytransitsite.com`).
- Git for version control.
- VS Code (optional, for development).

## Setup

1. **Clone the Repository**  
   Clone the repo to your local machine (Linux, WSL, or server):

   ```
   git clone git@github.com:FullStackKevinVanDriel/LewisCountyTransit.git
   cd LewisCountyTransit
   ```

2. **Install Dependencies**  
   Install required npm packages:
   ```
   npm install
   ```

## Development

Run the development server to work on the React frontend.

### On Linux (Server, Laptop, or WSL on Windows)

1. Open the project in VS Code:
   ```
   code .
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
   - This runs Vite’s dev server, accessible at `http://localhost:5173` (port may vary).
   - Edit files in `src/` (e.g., `App.tsx`) to see live updates.

## Build for Production

Generate the `dist` folder for WordPress deployment.

1. **Build the Project**

   ```
   npm run build
   ```

   - This recreates the `dist` folder with compiled assets (`dist/assets/index.js`, `dist/assets/index.css`).
   - Filenames are fixed (hashing disabled in `vite.config.ts`).

2. **Verify Output**  
   Check `dist/assets/` for `index.js` and `index.css`.

## Deploy to WordPress

1. **Zip the Plugin**
   ```
   cd wordpress-plugin
   zip -r ../transit-route-planner.zip .
   ```
2. **Upload to WordPress**
   - Log in to your WordPress admin (e.g., `www.mytransitsite.com/wp-admin`).
   - Go to Plugins > Add New > Upload Plugin, upload `transit-route-planner.zip`, and activate.
3. **Clear Caches**  
   Clear any caches (e.g., WP Super Cache, Cloudflare) to ensure the updated plugin loads.

## Git Workflow

- **Remote**: `git@github.com:FullStackKevinVanDriel/LewisCountyTransit.git`
- **Ignore `.env`**: Added to `.gitignore` to protect sensitive data.
- **Push Changes**:
  ```
  git add .
  git commit -m "Update plugin"
  git push origin main
  ```

## Notes

- Ensure your SSH key (`id_ed_25519_lewiscounty`) is added to GitHub for `FullStackKevinVanDriel`.
- If the map layout is narrow on WordPress, adjust the shortcode CSS: `max-width: 1200px`.
- To avoid caching issues with fixed filenames, append a version query in `transit-route-planner.php` (e.g., `index.js?v=1.1`).
