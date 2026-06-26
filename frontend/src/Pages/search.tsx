import { useEffect, useMemo, useState } from "react";
import { Play, Plus, Search as SearchIcon, VolumeX } from "lucide-react";
import { openMovieDetails } from "../Components/MovieDetails/MovieDetails";
import type { ContentCard, ContentRowData } from "../Components/ContentRow/ContentRow";
import Header from "../Components/header/header";
import { useLanguage } from "../Language/LanguageContext";
import "./page.css";

type SearchResponse = {
  title?: string;
  rows?: ContentRowData[];
  items?: ContentCard[];
};

const apiBaseUrls = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

export default function Search() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { tmdbLanguage, t } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer = 0;

    const loadSearch = async () => {
      setLoading(true);

      for (const baseUrl of apiBaseUrls) {
        try {
          const params = new URLSearchParams({ option: "movies", language: tmdbLanguage });

          if (query.trim()) {
            params.set("query", query.trim());
          }

          const response = await fetch(`${baseUrl}/api/tmdb/search?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) continue;

          const data = (await response.json()) as SearchResponse;
          const nextItems = data.items || data.rows?.flatMap((row) => row.items) || [];
          const movieItems = nextItems.filter((item) => item.mediaType === "movie" && (item.posterUrl || item.backdropUrl));

          if (movieItems.length > 0) {
            setItems(movieItems);
            setLoading(false);
            return;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      if (!controller.signal.aborted) {
        retryTimer = window.setTimeout(loadSearch, 900);
      }
    };

    const startTimer = window.setTimeout(loadSearch, query.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(retryTimer);
      controller.abort();
    };
  }, [query, tmdbLanguage]);

  const title = useMemo(
    () => (query.trim() ? `${t("Search results for")} ${query.trim()}` : t("Trending Movies")),
    [query, t],
  );

  return (
    <>
      <Header />

      <section className="search-page search-poster-page" aria-busy={loading}>
        <label className="search-hero-box">
          <SearchIcon size={36} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Movies, shows and more")}
            aria-label={t("Search movies")}
          />
        </label>

        <h1 className="search-grid-title">{title}</h1>

        {items.length > 0 ? (
          <div className="search-poster-grid">
            {items.map((item, index) => (
              <button
                className="search-poster-card"
                type="button"
                key={`${item.mediaType}-${item.id}`}
                onClick={() => openMovieDetails({ id: item.id, mediaType: item.mediaType })}
                onMouseEnter={(event) => {
                  const card = event.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const containerRect = card.parentElement?.getBoundingClientRect();
                  const visibleLeft = Math.max(containerRect?.left ?? 0, 112);
                  const visibleRight = Math.min(containerRect?.right ?? window.innerWidth, window.innerWidth - 32);
                  const previewHalfWidth = 190;
                  const cardCenter = rect.left + rect.width / 2;

                  card.dataset.previewEdge = cardCenter - visibleLeft < previewHalfWidth
                    ? "left"
                    : visibleRight - cardCenter < previewHalfWidth
                      ? "right"
                      : "center";
                }}
              >
                <img src={item.posterUrl || item.backdropUrl} alt={item.title} />
                {(index + 1) % 4 === 0 && <span className="search-top-badge">{t("TOP")}<br />10</span>}
                <span className="poster-hover-card">
                  <span className="poster-hover-art">
                    <img src={item.backdropUrl || item.posterUrl} alt="" />
                    <span className="poster-hover-language">{item.originalLanguage || "TMDB"}</span>
                    <VolumeX className="poster-hover-muted" size={22} />
                    <strong>{item.title}</strong>
                  </span>
                  <span className="poster-hover-actions">
                    <span className="poster-hover-watch"><Play size={16} fill="currentColor" /> {t("Watch Now")}</span>
                    <span className="poster-hover-add"><Plus size={22} /></span>
                  </span>
                  <span className="poster-hover-meta">{item.year} / TMDB {item.rating}</span>
                  <span className="poster-hover-overview">{item.overview}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="page-loading-state">
            <span className="page-loading-spinner" aria-label="Loading" />
          </div>
        )}
      </section>
    </>
  );
}

