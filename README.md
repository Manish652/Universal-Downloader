# BlackHole Downloader 2.1

> **Universal Media Downloader** — Download videos, music, and playlists from YouTube, Vimeo, Twitter/X, and 1000+ other sites. Also supports merging multiple videos in sequence.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎥 Video Download | MP4, WebM, MKV, AVI, MOV — up to 4K |
| 🎵 Audio Download | MP3, M4A, Opus, FLAC, WAV — up to 320kbps |
| 📋 Batch Download | Queue multiple URLs at once |
| 🎬 Video Merge | Combine multiple videos in custom order using ffmpeg |
| 📁 Local File Merge | Upload local videos and mix with URLs |
| ⏱️ Real-time Progress | Live speed, ETA, and percent display |
| 🕐 Download History | Persisted to browser storage |
| 📡 Queue Status | View active / waiting / completed jobs |
| 🔴 Redis Optional | Works with or without Redis |

---

## 📋 Prerequisites

Install these before anything else:

| Tool | Required | Purpose |
|------|----------|---------|
| [Node.js](https://nodejs.org/) v18+ | ✅ Yes | Server + frontend |
| [Python](https://www.python.org/) 3.8+ | ✅ Yes | Required by yt-dlp |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | ✅ Yes | Video downloading |
| [ffmpeg](https://ffmpeg.org/) | ✅ Yes | Merging videos |
| [Redis](https://redis.io/) | ⚠️ Optional | Download queue (graceful fallback) |

---

## 🚀 Quick Setup (Step by Step)

### Step 1 — Clone the repository

```bash
git clone https://github.com/yourusername/blackhole2.1.git
cd blackhole2.1
```

---

### Step 2 — Install system tools

#### Install yt-dlp

```bash
# Linux / macOS
pip3 install yt-dlp

# Or via pipx (recommended)
pipx install yt-dlp

# Verify
yt-dlp --version
```

#### Install ffmpeg

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install ffmpeg -y

# macOS (Homebrew)
brew install ffmpeg

# Windows — download from https://ffmpeg.org/download.html
# Add ffmpeg to your PATH environment variable

# Verify
ffmpeg -version
```

---

### Step 3 — Set up the Server

```bash
cd server

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` as needed (defaults work for local dev):

```ini
PORT=4000

# ── Redis (Optional) ──────────────────────────────────────────
# Set USE_REDIS=false to skip Redis entirely (downloads still work!)
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

> **If you DON'T want Redis:** just set `USE_REDIS=false` and skip Step 4 entirely.

Start the server:

```bash
npm run dev      # development (auto-reload)
# or
npm start        # production
```

The server will be available at `http://localhost:4000`

---

### Step 4 — (Optional) Set up Redis

Skip this step if you set `USE_REDIS=false`.

Redis enables the download queue (concurrent downloads, job tracking across restarts).

**Ubuntu / Debian:**
```bash
sudo apt update && sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify it's running
redis-cli ping   # should print: PONG
```

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
redis-cli ping
```

**Windows:**
Download from [Redis for Windows](https://github.com/tporadowski/redis/releases) or use WSL2.

---

### Step 5 — Set up the Client

Open a new terminal:

```bash
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at **`http://localhost:5173`**

---

### Step 6 — Open in browser

Go to [http://localhost:5173](http://localhost:5173) and start downloading!

---

## 📂 Project Structure

```
blackhole2.1/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── UniversalDownloader.jsx  # Main downloader UI
│       │   ├── MergeVideos.jsx          # Video merge tab
│       │   ├── DownloaderOptions.jsx    # Quality/format selectors
│       │   ├── VideoInfoCard.jsx        # Video preview card
│       │   └── ProgressBar.jsx          # Animated progress bar
│       ├── App.jsx
│       └── main.jsx
│
└── server/                     # Express backend
    ├── controllers/
    │   ├── downloadController.js   # Download logic (Redis optional)
    │   ├── infoController.js       # Video info + subtitles
    │   └── mergeController.js      # ffmpeg merge logic
    ├── routes/
    │   ├── downloadRoutes.js
    │   ├── infoRoutes.js
    │   ├── mergeRoutes.js          # Includes file upload endpoint
    │   └── healthRoutes.js
    ├── utils/
    │   ├── validateUrl.js
    │   └── ytDlpUtils.js
    ├── .env.example
    └── server.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/download` | Start a download |
| `GET` | `/progress/:id` | Poll download progress |
| `DELETE` | `/download/:id` | Cancel a download |
| `POST` | `/download/batch` | Queue multiple URLs |
| `GET` | `/queue/status` | Queue overview |
| `POST` | `/info` | Fetch video metadata |
| `POST` | `/subtitles` | Fetch available subtitles |
| `POST` | `/merge` | Start a video merge job |
| `GET` | `/merge/:id` | Poll merge progress |
| `DELETE` | `/merge/:id` | Cancel a merge |
| `POST` | `/merge/upload` | Upload a local video file |

---

## ⚙️ Environment Variables

All variables go in `server/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `USE_REDIS` | `true` | Set to `false` to disable Redis entirely |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |

---

## 🐛 Troubleshooting

**`yt-dlp: command not found`**
```bash
pip3 install --upgrade yt-dlp
# or
sudo pip3 install yt-dlp
```

**`ffmpeg: command not found`**
```bash
# Ubuntu
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

**Port 4000 already in use**
```bash
lsof -ti:4000 | xargs kill -9
```

**Redis connection errors (and you want to skip Redis)**
```bash
# In server/.env
USE_REDIS=false
```

**No video info showing up**
- Check the server terminal for yt-dlp errors
- Some videos are region-locked or require login cookies
- Try updating yt-dlp: `pip3 install -U yt-dlp`

**Downloads go to...**
Files are saved to your `~/Downloads` folder automatically.

---

## 🛠 Development

```bash
# Run both together (from root)
cd server && npm run dev &
cd client && npm run dev
```

Or use [concurrently](https://www.npmjs.com/package/concurrently):
```bash
npm install -g concurrently
concurrently "cd server && npm run dev" "cd client && npm run dev"
```

---

## 📄 License

MIT — free to use, modify, and distribute.
