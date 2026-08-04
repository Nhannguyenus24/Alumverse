# Refactoring-and-Enhancing-the-Student-Alumni-System-for-HCMUS

VNU HCMUS FIT Graduation Project — **AlumVerse**

This project consists of four main components: a Spring Boot backend, a React/Vite frontend, a Flutter mobile app, and **FitBOT** — a Python/FastAPI RAG assistant (Google Gemini + FAISS).

## Prerequisites
- **Docker** & **Docker Compose** (for database)
- **Java 17+** (for backend)
- **Node.js 18+** & **npm** (for frontend)
- **Flutter SDK** (for mobile)
- **Python 3.9+** (for FitBOT AI assistant)

## Required Configurations
Before running the project, you must provide your own credentials and URLs. Replace the placeholders in the respective files:

### Backend (`backend/src/main/resources/application.properties` & `application-prod.properties`)
- `YOUR_DB_PASSWORD`: Password for your PostgreSQL database.
- `YOUR_R2DBC_URL`: R2DBC connection URL for the database.
- `YOUR_FLYWAY_URL`: JDBC connection URL for Flyway migrations.
- `YOUR_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID for authentication.
- `YOUR_RECAPTCHA_SECRET_KEY`: Google reCAPTCHA Secret Key.
- `YOUR_MAIL_USERNAME`, `YOUR_MAIL_PASSWORD`, `YOUR_MAIL_FROM_ADDRESS`: SMTP server configurations for sending emails.
- `YOUR_SERVER_URL`: The base URL where your backend server is hosted.
- `YOUR_SEPAY_API_KEY`: API Key for SePay integration.
- `YOUR_SEPAY_QR_URL`: URL for generating SePay QR codes.
- `YOUR_GEMINI_API_KEY`: API Key for Google Gemini AI features.
- `YOUR_IMAGE_DOMAIN`: Domain URL for serving uploaded images.
- `YOUR_CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (e.g. frontend domains).

### Frontend (`frontend/.env`)
- `YOUR_API_BASE_URL`: Base URL of your backend API.
- `YOUR_WS_CHAT_URL`: WebSocket URL for the chat service.
- `YOUR_SSE_URL`: Server-Sent Events (SSE) URL.
- `YOUR_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID.
- `YOUR_RECAPTCHA_SITE_KEY`: Google reCAPTCHA Site Key.
- `YOUR_PROMETHEUS_URL`: URL for Prometheus metrics.
- `YOUR_FITBOT_API_URL`: API URL for FitBot services.

### Mobile (`mobile_flutter/lib/core/config/env.dart`)
- `YOUR_API_BASE_URL`: Base URL of your backend API.
- `YOUR_WS_BASE_URL`: WebSocket URL for the chat service.
- `YOUR_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID.
- `YOUR_IMAGE_BASE_URL`: Base URL for fetching images.

> These values can also be passed at runtime via `--dart-define` (see the Mobile setup step below): `API_BASE_URL`, `WS_BASE_URL`, `GOOGLE_CLIENT_ID`, `DEFAULT_ORG_SLUG`.

### FitBOT (`FitBOT/.env`)
- `GOOGLE_API_KEY`: Google AI Studio API key used by Gemini. Get one at [Google AI Studio](https://aistudio.google.com/app/apikey).

### Nginx (Production only)
- `YOUR_DOMAIN`: If deploying to production, replace all occurrences of `YOUR_DOMAIN` in `nginx.prod.conf` with your actual domain name and ensure you have valid SSL certificates in the `/etc/letsencrypt/live/YOUR_DOMAIN/` directory.

## Setup Instructions

### 1. Database & Nginx Configuration
The database (PostgreSQL) and Nginx can be started using Docker Compose from the root of the project:
```bash
docker-compose up -d
```
*Note: By default, `docker-compose.yml` mounts `nginx.conf` for local development. If you are deploying to production, rename or copy `nginx.prod.conf` to `nginx.conf` before starting Docker.*

### 2. Backend (Java Spring Boot)
Navigate to the `backend` directory and run the application:
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### 3. Frontend (React + Vite)
Navigate to the `frontend` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```

### 4. Mobile (Flutter)
Navigate to the `mobile_flutter` directory and run the app:
```bash
cd mobile_flutter
flutter pub get
flutter run
```
To inject environment values at runtime:
```bash
flutter run \
  --dart-define=API_BASE_URL=https://your-api-url \
  --dart-define=WS_BASE_URL=wss://your-api-url \
  --dart-define=GOOGLE_CLIENT_ID=your-google-client-id \
  --dart-define=DEFAULT_ORG_SLUG=fit-hcmus
```
Build a release APK with `flutter build apk`.

### 5. FitBOT (AI Assistant — optional)
FitBOT is a standalone RAG service (Google Gemini + FAISS) that powers the in-app chatbot. It runs independently of Docker Compose on port `8000`.

**Run locally:**
```bash
cd FitBOT
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
# create FitBOT/.env with GOOGLE_API_KEY=...
cd src
python api_server.py
```
The API serves on `http://localhost:8000` (Swagger UI at `/docs`). To let the frontend reach it, set `VITE_FITBOT_API_URL=http://localhost:8000` in `frontend/.env`.

**Run on Google Colab (no local setup):** open `FitBOT/FITBOT_Colab.ipynb`, add `GOOGLE_API_KEY` and `NGROK_TOKEN` to Colab Secrets, run the cells, and use the printed ngrok public URL as `VITE_FITBOT_API_URL`.

> First launch downloads the `BAAI/bge-m3` embedding and `BAAI/bge-reranker-base` reranker models, which may take a few minutes.

## Sample Accounts
After loading the seed data (`docs/postgres.sql`), you can sign in with:

| Email             | Password     | Role  |
| ----------------- | ------------ | ----- |
| `admin@gmail.com` | `Admin2026@` | ADMIN |

> ⚠️ This is a demo/testing credential. Change the password or remove the account before deploying to production.
