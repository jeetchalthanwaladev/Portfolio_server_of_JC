# Jeet Chalthanwala — Portfolio

A responsive, scroll-based portfolio built with React, Vite, and a Node.js/Express API.

## Project structure

- `client/src/componants/` contains the page sections and reusable UI pieces, including the Three.js `VoxelCoder` scene.
- `client/src/data/defaultPortfolioContent.js` contains the starter content used by the public site and admin editor.
- `client/src/componants/admin/` contains the protected `/adminportalofjc` content manager.
- `client/src/styles/` contains the base, header, hero, section, and responsive stylesheets.
- `server/index.js` contains the Express API and production static-file server.

## Run locally

1. Install Node.js 20.19 or newer (required by the current Vite release).
2. From this folder, install the dependencies:

   ```sh
   npm install
   ```

3. Start the frontend and API together:

   ```sh
   npm run dev
   ```

4. Open the local address printed by Vite (usually `http://localhost:5173`).

The Vite development server forwards `/api` requests to the Express API at port 3001. `GET /api/health` is available as a simple service status endpoint.

## Portfolio admin

The private admin page is available at `/adminportalofjc` (`/adJC` redirects there). On first successful Atlas connection, the server creates the initial admin user in the `admins` collection from `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD` in the private `.env`. Admin IDs and password hashes are then stored in MongoDB. It supports editing the navigation, hero, about section, projects, tech stack, process, contact details, footer, and SEO metadata. List fields can be added or removed. Save changes to publish them to the public site; already-open portfolio tabs refresh the saved content automatically. Project and social-preview images upload to Cloudinary.

Before signing in, copy `.env.example` to `.env` in the project root and set:

- `MONGODB_URI` to your MongoDB Atlas connection string. The content, admin account, and login sessions use the database named in the URI, or `jeet_portfolio` if the URI does not name one. This project's Render Blueprint selects `portfolio_db` to use the existing portfolio data; set `MONGODB_DB_NAME` to use another database name.
- `ADMIN_USERNAME` and either `ADMIN_PASSWORD_HASH` (recommended) or `ADMIN_PASSWORD`.
- `ADMIN_SESSION_SECRET` to a private, random value of 32 characters or more.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for project image uploads.

The admin login remains unavailable until MongoDB, the admin ID/password, and a 32-character session secret are configured. Keep `.env` private and set the same values as environment variables on the production host. Use HTTPS in production so the secure session cookie is sent correctly. When Atlas is unavailable, the public portfolio still renders with its built-in starter content.

## Contact form email delivery

The contact form sends submissions to `POST /api/contact`. To deliver messages by email, create a `.env` file in the project root using `.env.example` as a guide, then provide SMTP settings and an inbox address. Keep `.env` private; it is ignored by Git. Without SMTP settings, the form shows a helpful direct-email fallback.

## Production

Run `npm run build` to create the React app in `dist/`, then run `npm start`. Express serves both the built app and its API. Set `PORT` in the deployment environment if the host assigns a port. Once a public domain is selected, set `SITE_URL` to its HTTPS origin (for example, `https://your-domain.com`) so the canonical link, Open Graph URL, `robots.txt`, and `sitemap.xml` all use the public address.

## Deploy to Render

The root `render.yaml` defines a single Node web service for the whole app. It builds the React client with `npm ci && npm run build`, starts Express with `npm start`, and uses `/api/health` for Render's health check. The server binds to Render's assigned `PORT` on `0.0.0.0`; do not set a fixed `PORT` in the Render dashboard.

1. Push this repository to GitHub. Keep the root `package.json`, `package-lock.json`, `client/`, `server/`, and `render.yaml` in the repository. Do not upload or commit `.env`.
2. In Render, create a Blueprint from the repository and review the service before deploying.
3. Provide the prompted environment variables using the values from your private local `.env`: `MONGODB_URI` and the three `CLOUDINARY_*` values. Keep the database URI and Cloudinary API secret private. Render generates `ADMIN_SESSION_SECRET` and sets `SITE_URL` to the service's public HTTPS URL. The existing admin account is stored in Atlas; if you instead connect a fresh database, add `ADMIN_USERNAME` and either `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD` in Render before the first deploy.
4. In MongoDB Atlas, add the Render service's outbound IP ranges to Network Access. Find them on the service page under **Connect → Outbound**. The current computer's IP allowlist entry does not authorize Render, and the app cannot read Atlas data or enable admin login until Render can connect.
5. After the first deploy, open `/api/health`, the public site, and `/adminportalofjc`. If you attach a custom domain, update `SITE_URL` to that domain's HTTPS origin.

The Blueprint starts on Render's Free plan to avoid an unexpected charge. Free web services sleep after 15 minutes without incoming traffic and can take about a minute to wake; choose a paid plan in Render if you need the portfolio to stay warm for visitors and crawlers. The Render Blueprint keeps secrets out of source control with `sync: false` and a generated session secret. See Render's [Blueprint environment variable rules](https://render.com/docs/blueprint-spec), [Atlas connection guide](https://render.com/docs/connect-to-mongodb-atlas), and [Free service limitations](https://render.com/docs/free).
