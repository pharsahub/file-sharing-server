# FileShare Pro

A self-hosted, scalable file-sharing system featuring local network discovery and secure cloud uploads.

## Features
- **Local Network Sharing:** Discover nearby devices on the same WiFi (using WebSockets logic similar to Snapdrop) and initiate transfers.
- **Secure File Uploads:** Authenticated uploads with JWT.
- **Link Sharing:** Generate expiring, password-protected download links to share over the internet.
- **Docker Ready:** Deploy easily using Docker Compose (App, Nginx, PostgreSQL, Redis).

## Architecture
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL. WebSockets for local device discovery.
- **Frontend:** React, Vite, Vanilla CSS. Modern UI with smooth animations and dark theme.
- **Reverse Proxy:** Nginx proxying both HTTP API and WebSockets securely.

---

## Setup & Local Development

1. **Clone the repository.**
2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and supply your JWT_SECRET and Postgres credentials.
   ```
3. **Start the application using Docker Compose:**
   ```bash
   docker compose up --build
   ```
4. **Access the Application:**
   Open [http://localhost](http://localhost) in your browser. Nginx acts as the entry point on port 80.
   - Frontend is statically served or proxied via the client container on port 80 initially.
   - APIs are routed to `/api/*`
   - Discovery WebSocket is at `/discovery`

---

## API Documentation

### Auth
- `POST /api/auth/register` - Register a new user (`username`, `email`, `password`)
- `POST /api/auth/login` - Authenticate (`email`, `password`). Returns JWT.

### Files
Headers: `Authorization: Bearer <token>`
- `GET /api/files` - List user's uploaded files.
- `POST /api/files/upload` - Form-Data: `file`. Uploads new file securely.
- `GET /api/files/:id` - Download your specific file.
- `DELETE /api/files/:id` - Delete a file.

### Shares
- `POST /api/share` - Payload: `{ fileId, expiresInDays (optional), password (optional) }`. Returns share link info.
- `GET /api/share/:token` - Get basic public info about a share link (e.g. filename, requiresPassword).
- `POST /api/share/:token/download` - Payload: `{ password (optional) }`. Downloads the shared file.

---

## Technical Details

- **File Storage Structure:** Local uploads are saved in `/storage/uploads`. In a production multi-server setup, the `StorageService` can easily be configured to pipe to S3.
- **Databases:** PostgreSQL maintains the source of truth for users, files, and shares.
- **Local Share Discovery:** Uses `ws` broadcast to propagate user existence directly among local subnet IPs when deployed together.
