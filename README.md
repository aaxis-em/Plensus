# Plensus 🎵

Consensus on music play.

Have you fought over which song to play next in gathering. This tries to solve it.

## Project Structure

```
plensus/
├── apps/
│   ├── web/        # Next.js frontend (port 3000)
│   └── server/     # Express + Socket.IO backend (port 3001)
└── packages/
    └── shared-types/   # Shared TypeScript types
```

## Setup

### Prerequisites

- Node.js >= 18
- npm (or your preferred package manager)
- A [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key

### 1. Clone the repo

```bash
git clone https://github.com/your-username/plensus.git
cd plensus
```

### 2. Install dependencies

```bash
# Install for both apps
cd apps/server && npm install
cd ../web && npm install
```

### 3. Configure environment

Create a `.env` file inside `apps/server/`:

```bash
cp apps/server/.env.example apps/server/.env
```

Then fill in your values (see [Environment Variables](#environment-variables) below).

### 4. Start the servers

In two separate terminals:

```bash
# Terminal 1 — backend
cd apps/server
npm run dev

# Terminal 2 — frontend
cd apps/web
npm run dev
```

The app will be available at **http://localhost:3000**.

## Environment Variables

### `apps/server/.env`

```env
# Port the server listens on (default: 3001)
PORT=3001

# Node environment: development | production
NODE_ENV=development

# YouTube Data API v3 key (required for search)
# Get one at: https://console.cloud.google.com/apis/library/youtube.googleapis.com
YOUTUBE_API_KEY=your_youtube_api_key_here

# Allowed client origin in production (ignored in development)
CLIENT_URL=http://localhost:3000
```

> ⚠️ Without `YOUTUBE_API_KEY`, song search will not work.

### `apps/web/.env.local` _(optional)_

```env
# Override the backend URL if not running on localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## How It Works

1. A user **creates a room** and becomes the **host**.
2. The host searches for songs (proxied through the backend to filter non-embeddable videos).
3. Songs are added to a shared **queue** synced in real-time via Socket.IO.
4. Only the **host controls playback** — play, pause, and skip are broadcast to all listeners.
5. If the host leaves, **host transfer** is handled automatically.

## Note

This system is completely coded by AI. I was only responsible for architecture and functionality.
