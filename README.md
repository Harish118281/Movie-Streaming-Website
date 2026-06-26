# MovieFlix

## Description

MovieFlix is a full-stack movie streaming style web application built with React, TypeScript, Express, PostgreSQL, and the TMDB API. The app shows movies, TV shows, animes, categories, search results, hero banners, trailers, user authentication, and a user profile page.

The frontend displays the streaming website UI, while the backend connects to TMDB for movie data and PostgreSQL for user signup/login information.

## Features

- Intro landing page with login and signup navigation.
- User signup and login with PostgreSQL storage.
- Password hashing with bcrypt.
- JWT token generation after successful login/signup.
- Strong password validation on signup.
- Duplicate email validation.
- Empty-field validation for login and signup forms.
- Home, Movies, TV, Animes, Search, Categories, and My Space pages.
- TMDB-powered hero banners, movie rows, categories, search results, and details pages.
- Movie details modal with trailer playback.
- Profile page showing logged-in user email, username, member date, and account status.
- Logout from the My Space profile page.
- Language selection support for UI labels and TMDB language-aware content where available.

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- React Router
- Lucide React icons
- CSS

Backend:
- Node.js
- Express
- TypeScript
- PostgreSQL
- pg
- bcrypt
- JSON Web Token
- dotenv
- cors

External API:
- TMDB API

Database:
- PostgreSQL

## Project Structure

```text
FULL_STACK_PROJECT/
  Backend/
    controllers/
    routes/
    db.ts
    server.ts
    package.json
    .env

  database/
    schema.sql

  frontend/
    public/
    src/
      assets/
      Components/
      Language/
      Pages/
    package.json

  README.md
```

## Installation

Install dependencies separately for the frontend and backend.

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd Backend
npm install
```

## How To Run Frontend

Open a terminal in the frontend folder:

```bash
cd frontend
npm run dev
```

The frontend usually runs on:

```text
http://localhost:5173
```

To create a production build:

```bash
npm run build
```

## How To Run Backend

Before running the backend, create a `.env` file inside the `Backend` folder.

Required backend environment variables:

```text
PORT
FRONTEND_URL
TMDB_API_KEY
JWT_SECRET
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Example values should be added only in your local `.env` file. Do not push real API keys, database passwords, or JWT secrets to GitHub.

Start the backend in development mode:

```bash
cd Backend
npm run dev
```

The backend usually runs on:

```text
http://localhost:5000
```

Useful backend routes:

- `/api/health`
- `/api/auth/signup`
- `/api/auth/login`
- `/api/tmdb/page/home`
- `/api/tmdb/page/movies`
- `/api/tmdb/page/tv`
- `/api/tmdb/page/animes`
- `/api/tmdb/search`
- `/api/tmdb/categories`
- `/api/tmdb/category/:slug`
- `/api/tmdb/details/:mediaType/:id`

## Database Setup

This project uses PostgreSQL to store user account information.

1. Install PostgreSQL.
2. Create a database for the project.
3. Add the database connection details to `Backend/.env`.
4. Run the schema file located at:

```text
database/schema.sql
```

The database contains a `users` table for:

- user id
- username
- email
- hashed password
- created date

After the database is ready, start the backend. If the connection is successful, the backend terminal will show that PostgreSQL is connected.
