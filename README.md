# Refactoring-and-Enhancing-the-Student-Alumni-System-for-HCMUS

VNU HCMUS FIT Graduation Project — **AlumVerse**

This project consists of three main components: a Spring Boot backend, a React/Vite frontend, and a Flutter mobile app.

## Prerequisites
- **Docker** & **Docker Compose** (for database)
- **Java 17+** (for backend)
- **Node.js 18+** & **npm** (for frontend)
- **Flutter SDK** (for mobile)

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

### Mobile (`mobile_flutter/lib/core/config/env.dart`)
- `YOUR_API_BASE_URL`: Base URL of your backend API.
- `YOUR_WS_BASE_URL`: WebSocket URL for the chat service.
- `YOUR_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID.
- `YOUR_IMAGE_BASE_URL`: Base URL for fetching images.

## Setup Instructions

### 1. Database Configuration
The database (PostgreSQL) can be started using Docker Compose from the root of the project:
```bash
docker-compose up -d db
```

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
