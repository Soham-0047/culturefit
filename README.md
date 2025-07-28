# CultureFit

CultureFit is a personalized cultural discovery and recommendation platform. It helps users explore, track, and receive tailored recommendations for movies, music, literature, art, and design. The platform leverages the Qloo API for cultural intelligence and provides a modern, responsive user experience.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Qloo API](#qloo-api)
- [License](#license)

---

## Features

- Personalized recommendations for movies, music, books, art, and design
- User profiles with preferences, favorites, and analytics
- Trending and search features for cultural content
- Secure authentication (Google OAuth)
- Modern, responsive UI with dark mode
- Analytics and stats for user engagement

---

## Tech Stack

**Frontend:**
- React (with Vite)
- TypeScript
- Tailwind CSS
- Radix UI & shadcn/ui components
- React Router
- React Hook Form, Zod (validation)
- Axios (API requests)

**Backend:**
- Node.js, Express.js
- MongoDB (Mongoose)
- Passport.js (Google OAuth)
- Qloo API (cultural recommendations)
- Security: Helmet, CORS, express-rate-limit, compression
- Logging: Morgan, Winston

---

## Project Structure

```text
culturefit/
  client/      # Frontend (React, Vite, Tailwind)
  server/      # Backend (Node.js, Express, MongoDB)
```

---

## API Endpoints

### Auth (`/api/auth`)
- `GET /google` — Google OAuth login
- `GET /google/callback` — OAuth callback
- `GET /status` — Check authentication status
- `GET /profile` — Get user profile
- `GET/POST/PUT /preferences` — Get, save, or update user preferences
- `PUT /cultural-profile` — Update cultural profile
- `POST /favorites` — Add to favorites
- `DELETE /favorites/:itemId` — Remove from favorites
- `POST /logout` — Logout
- `DELETE /account` — Delete account

### Discover (`/api/discover`)
- `GET /trending` — Trending discoveries
- `GET /stats` — Discovery stats
- `GET /insights` — Personalized cultural insights
- `GET /personalized` — Personalized recommendations
- `POST/GET /preferences` — Manage discover preferences
- `GET /search` — Search discoveries

### User (`/api/user`)
- `GET /dashboard` — User dashboard
- `GET /recommendations` — Recommendation history
- `GET /favorites` — Favorites
- `PUT /profile` — Update profile
- `POST /recommendations` — Add recommendation
- `GET /analytics` — User analytics

### (If present) Chat (`/api/chat`)
- `POST /message` — Send message
- `GET /history` — Chat history
- `POST /clear` — Clear chat
- `GET /suggestions` — Chat suggestions

---

## Setup & Installation

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)
- Qloo API credentials
- Google OAuth credentials

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/culturefit.git
cd culturefit
```

### 2. Setup Environment Variables

Create `.env` files in both `server/` and `client/` directories.

#### server/.env

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
QLOO_API_URL=https://api.qloo.com
QLOO_API_KEY=your_qloo_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=development
```

#### client/.env

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd ../client
npm install
```

### 4. Run the Application

#### Start Backend

```bash
cd server
npm run dev
```

#### Start Frontend

```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Usage

1. Open the frontend in your browser.
2. Sign in with Google.
3. Set your cultural preferences.
4. Explore personalized recommendations, trending content, and analytics.
5. Add favorites, track your history, and update your profile.

---

## Qloo API

Qloo is a cultural intelligence platform providing recommendations and insights for movies, music, books, art, and more.  
CultureFit uses Qloo's API to fetch and personalize cultural content for users.

- [Qloo API Documentation](https://api.qloo.com/docs) (requires API key)

---

## License

This project is licensed under the ISC License. 