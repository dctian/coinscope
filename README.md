# CoinScope

A cross-platform coin identification app powered by AI Vision Language Models.

Take a photo of one or more coins, and CoinScope will identify each coin's country, year, denomination, and more.

## Features

- **Multi-platform**: Runs on iOS, Android, and Web
- **AI-powered**: Uses Vision Language Models (GPT-4V, Gemini, Claude) via LiteLLM
- **Multi-coin detection**: Identify multiple coins in a single photo
- **Detailed info**: Country, year, denomination, currency, and descriptions

## Project Structure

```
coinscope/
├── frontend/          # Flutter app (iOS, Android, Web)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/    # Data models
│   │   ├── screens/   # UI screens
│   │   ├── services/  # API and camera services
│   │   └── widgets/   # Reusable widgets
│   └── pubspec.yaml
│
├── backend/           # Python/FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models/    # Pydantic models
│   │   ├── routers/   # API endpoints
│   │   └── services/  # VLM service
│   └── requirements.txt
│
└── PLAN.md           # Project plan
```

## Getting Started

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at http://localhost:8000

### Frontend Setup

1. Ensure Flutter is installed:
   ```bash
   flutter doctor
   ```

2. Get dependencies:
   ```bash
   cd frontend
   flutter pub get
   ```

3. Run the app:
   ```bash
   # Web
   flutter run -d chrome
   
   # iOS Simulator
   flutter run -d ios
   
   # Android Emulator
   flutter run -d android
   ```

## API Endpoints

### POST /api/v1/coins/identify

Upload an image to identify coins.

**Request:**
```
Content-Type: multipart/form-data
Body: image file (JPEG, PNG, GIF, or WebP)
```

**Response:**
```json
{
  "coins": [
    {
      "id": "uuid",
      "name": "Lincoln Penny",
      "country": "United States",
      "year": 1982,
      "denomination": "1 cent",
      "face_value": 0.01,
      "currency": "USD",
      "obverse_description": "Abraham Lincoln portrait",
      "reverse_description": "Lincoln Memorial",
      "confidence": 0.92
    }
  ],
  "total_coins_detected": 1,
  "model_used": "gpt-4-vision-preview"
}
```

### GET /api/v1/coins/health

Health check endpoint.

## VLM Configuration

CoinScope uses LiteLLM to support multiple Vision Language Model providers. Set the `VLM_MODEL` environment variable to choose your provider:

| Provider | Model Name |
|----------|------------|
| OpenAI | `gpt-4-vision-preview` |
| Google | `gemini/gemini-1.5-pro` |
| Anthropic | `claude-3-opus-20240229` |
| Anthropic | `claude-3-sonnet-20240229` |

## Future Roadmap

- [ ] Coin pricing integration (eBay, Numista)
- [ ] Related seller links
- [ ] User authentication
- [ ] Personal coin collections
- [ ] Scan history sync

## License

MIT

