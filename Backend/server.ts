import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import tmdbRoutes from "./routes/tmdb";
import authRoutes from "./routes/auth";
import "./db"

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const configuredFrontendUrl = process.env.FRONTEND_URL;

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (configuredFrontendUrl && origin === configuredFrontendUrl) {
    return true;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`
    <main style="font-family: system-ui; padding: 32px; line-height: 1.5;">
      <h1>MovieFlix Backend</h1>
      <p>Backend is running.</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/tmdb/page/home">/api/tmdb/page/home</a></li>
        <li><a href="/api/tmdb/page/movies">/api/tmdb/page/movies</a></li>
        <li><a href="/api/tmdb/page/tv">/api/tmdb/page/tv</a></li>
        <li><a href="/api/tmdb/page/animes">/api/tmdb/page/animes</a></li>
        <li><a href="/api/tmdb/search">/api/tmdb/search</a></li>
        <li><a href="/api/tmdb/categories">/api/tmdb/categories</a></li>
        <li><a href="/api/tmdb/category/language-tamil">/api/tmdb/category/language-tamil</a></li>
      </ul>
    </main>
  `);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/tmdb", tmdbRoutes);

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});


