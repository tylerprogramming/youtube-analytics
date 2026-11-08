# YouTube Analytics

A small dashboard for a YouTube channel's stats and recent videos.

- `app.py`: Flask API on port 5005. `GET /api/channel_data` calls the YouTube Data API v3 and returns channel info plus per-video stats.
- `youtube-data/`: Next.js 14 dashboard on port 3005 that reads that endpoint.

## 1. API server

Requires Python 3.10+ and a YouTube Data API v3 key ([create one](https://console.cloud.google.com/apis/credentials) and enable "YouTube Data API v3").

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export YOUTUBE_API_KEY=your-key
python app.py
```

`app.py` reads environment variables directly (it does not load a `.env` file).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `YOUTUBE_API_KEY` | yes | none | YouTube Data API key |
| `FRONTEND_ORIGIN` | no | `http://localhost:3005` | Origin allowed by CORS (the dashboard) |

Query parameters for `/api/channel_data`:

- `channel_url`: a channel URL (`https://www.youtube.com/@handle`) or a channel ID. Default `https://www.youtube.com/@TylerReedAI`.
- `video_count`: a number, or `all` (default). The dashboard asks for 10.

Quick check: `curl "http://localhost:5005/api/channel_data?video_count=3"`

## 2. Dashboard

Requires Node.js 18.17+ (Next.js 14).

```bash
cd youtube-data
npm install
npm run dev
```

Open http://localhost:3005. The dashboard calls `http://localhost:5005` unless `NEXT_PUBLIC_API_URL` is set.

## Other files

- `templates/` and the root `tailwind.config.js` belong to an earlier "YouTube Audio Processor" page. `app.py` does not serve them.
- `youtube-data/autogen/analytics_flow.py` is an unfinished AutoGen stub. Its model filter lists `gpt-4` variants, which OpenAI shut down on 2026-10-23.
