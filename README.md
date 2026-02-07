# CoinScope

A cross-platform coin identification app powered by AI Vision Language Models.

Take a photo of one or more coins, and CoinScope will identify each coin's country, year, denomination, and more.

## Features

- **Multi-platform**: React web app + Flutter mobile (iOS, Android)
- **AI-powered**: Uses Vision Language Models (Gemini, GPT-4V, Claude) with multi-provider support
- **Multi-coin detection**: Identify multiple coins in a single photo with bounding boxes
- **Detailed info**: Country, year, denomination, currency, confidence score, and descriptions
- **Rate limited**: 10 requests/minute per client on the identify endpoint

## Project Structure

```
coinscope/
├── frontend_react/        # React web app (primary frontend)
│   ├── src/
│   │   ├── pages/         # HomePage, ResultsPage
│   │   ├── components/    # CoinCard, CoinDetailModal, ConfidenceBadge
│   │   ├── hooks/         # useIdentifyCoins (TanStack Query mutation)
│   │   ├── lib/           # API client (fetch-based)
│   │   └── types/         # TypeScript interfaces
│   ├── e2e/               # Playwright E2E tests
│   └── package.json
│
├── frontend/              # Flutter app (iOS, Android, Web)
│   ├── lib/
│   │   ├── models/        # Data models
│   │   ├── screens/       # UI screens
│   │   ├── services/      # API and camera services
│   │   └── widgets/       # Reusable widgets
│   └── pubspec.yaml
│
├── backend/               # Python/FastAPI backend
│   ├── app/
│   │   ├── main.py        # App entry, CORS, logging middleware
│   │   ├── models/        # Pydantic models (Coin with bbox)
│   │   ├── routers/       # API endpoints with DI and rate limiting
│   │   └── services/
│   │       ├── vlm_service.py       # Orchestrator
│   │       ├── image_processor.py   # Resize, encode, MIME detection
│   │       ├── prompt_builder.py    # VLM prompt template
│   │       ├── response_parser.py   # JSON parsing, coin extraction
│   │       └── providers/           # Gemini, LiteLLM (OpenAI/Claude)
│   ├── tests/             # pytest unit + integration tests
│   └── requirements.txt
│
├── testdata/              # Sample coin images for testing
├── docker-compose.yml     # Docker deployment
└── PLAN.md
```

## Getting Started

### Backend

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your API keys (GEMINI_API_KEY, OPENAI_API_KEY, etc.)
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

   API available at http://localhost:8000 (docs at http://localhost:8000/docs)

### React Frontend

1. Install dependencies:
   ```bash
   cd frontend_react
   npm install
   ```

2. Configure the API URL (optional, defaults to `http://localhost:8000`):
   ```bash
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

   App available at http://localhost:3000

### Flutter Frontend

```bash
cd frontend
flutter pub get
flutter run -d chrome        # Web
flutter run -d ios           # iOS Simulator
flutter run -d android       # Android Emulator
```

### Docker Deployment

Run both the backend and React frontend with Docker Compose:

```bash
docker compose up --build
```

This starts:
- **Backend** at http://localhost:8000
- **Frontend** at http://localhost:3000

To point the frontend at a different backend URL:

```bash
# In docker-compose.yml, change the build arg:
VITE_API_BASE_URL: https://your-backend-url.com
```

### Android Deployment (Capacitor)

The React frontend can be deployed to Android as a native app via Capacitor:

```bash
cd frontend_react

# 1. Set the backend URL (use your machine's LAN IP for device testing)
echo "VITE_API_BASE_URL=http://YOUR_LAN_IP:8000" > .env

# 2. Build the web app
npm run build

# 3. Sync web assets into the Android project
npx cap sync android

# 4. Build the APK
cd android && ./gradlew assembleDebug && cd ..

# 5. Install on a connected device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Requirements:** Node.js 20+, Android SDK, Java 21 (e.g. `brew install openjdk@21`).

**Notes:**
- The Android WebView uses `http://` scheme (configured in `capacitor.config.ts`) to avoid mixed-content blocking when connecting to a local HTTP backend
- Camera access uses the `@capacitor/camera` plugin for native camera integration
- Find your LAN IP with `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| POST | `/api/v1/coins/identify` | Identify coins in an uploaded image |
| GET | `/api/v1/coins/health` | Health check |
| GET | `/api/v1/coins/providers` | Active model and supported providers |

### POST /api/v1/coins/identify

Upload an image (JPEG, PNG, GIF, WebP; max 20MB) to identify coins.

```bash
curl -X POST http://localhost:8000/api/v1/coins/identify \
  -F "image=@testdata/coin1.jpg"
```

**Response:**
```json
{
  "coins": [
    {
      "id": "uuid",
      "name": "5 Forint",
      "country": "Hungary",
      "year": 2017,
      "denomination": "5 forint",
      "face_value": 5.0,
      "currency": "HUF",
      "obverse_description": "Great Egret bird facing left",
      "reverse_description": "Denomination with year",
      "confidence": 0.95,
      "bbox": [0.12, 0.18, 0.52, 0.58]
    }
  ],
  "total_coins_detected": 1,
  "model_used": "gemini/gemini-flash-latest"
}
```

## VLM Configuration

Set `VLM_MODEL` in `.env` to choose your provider:

| Provider | Model Name | SDK |
|----------|------------|-----|
| Google | `gemini/gemini-flash-latest` (default) | Direct Gemini SDK |
| Google | `gemini/gemini-1.5-pro` | Direct Gemini SDK |
| OpenAI | `gpt-4-vision-preview` | LiteLLM |
| Anthropic | `claude-3-opus-20240229` | LiteLLM |
| Anthropic | `claude-3-sonnet-20240229` | LiteLLM |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VLM_MODEL` | `gemini/gemini-flash-latest` | VLM model to use |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `DEBUG` | `false` | Enable debug logging |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |

## Testing

### Backend Unit Tests (62 tests)

```bash
cd backend
python -m pytest tests/ -v --ignore=tests/test_coins.py
```

Tests cover: image processing, prompt building, response parsing, Pydantic models, VLM service with mocked providers, and FastAPI endpoints via ASGI transport (no running server needed).

### React Frontend Unit Tests (54 tests)

```bash
cd frontend_react
npx vitest run
```

Tests cover: API client, ConfidenceBadge, CoinCard, CoinDetailModal, HomePage, ResultsPage.

### Playwright E2E Tests (11 tests)

```bash
cd frontend_react
npx playwright test                              # All tests (needs backend for full flow)
npx playwright test e2e/home.spec.ts             # Home page only (no backend needed)
npx playwright test e2e/identify-coins.spec.ts   # Full flow (needs backend)
```

Tests cover: page load, upload flow, full identification pipeline, detail modal interaction, error states, loading states.

## Backend Architecture

The backend follows a modular, service-oriented architecture:

- **`VLMService`** — slim orchestrator composing the modules below
- **`ImageProcessor`** — resize, base64 encode, MIME type detection
- **`PromptBuilder`** — VLM prompt template for coin identification
- **`ResponseParser`** — JSON extraction from VLM responses, coin model parsing
- **`GeminiProvider`** — direct Google Gemini SDK integration
- **`LiteLLMProvider`** — OpenAI, Claude, and other providers via LiteLLM
- **Dependency injection** via FastAPI `Depends()` for testability
- **Rate limiting** via slowapi (10 req/min on identify)
- **Structured logging** with Python's logging module
- **Request logging middleware** — logs method, path, status, and duration

## Future Roadmap

- [ ] Coin pricing integration (eBay, Numista)
- [ ] Related seller links
- [ ] User authentication
- [ ] Personal coin collections
- [ ] Scan history with persistence

## License

MIT
