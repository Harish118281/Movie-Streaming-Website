import { useEffect, useState } from "react";
import { Play, Plus, VolumeX } from "lucide-react";
import { useParams } from "react-router-dom";
import { openMovieDetails } from "../MovieDetails/MovieDetails";
import Header from "../header/header";
import type { ContentCard } from "../ContentRow/ContentRow";
import "./catogories_box.css";

type CategoryResponse = {
  title: string;
  slug: string;
  items: ContentCard[];
};

const apiBaseUrls = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

export default function CatogoriesBox() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadCategory = async () => {
      setLoading(true);

      for (const baseUrl of apiBaseUrls) {
        try {
          const params = new URLSearchParams({ language: "en-US" });
          const response = await fetch(`${baseUrl}/api/tmdb/category/${slug}?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) continue;

          setData((await response.json()) as CategoryResponse);
          setLoading(false);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      setData(null);
      setLoading(false);
    };

    loadCategory();

    return () => controller.abort();
  }, [slug]);

  return (
    <>
      <Header />

      <section className="catogories-box-page">
        {loading ? (
          <div className="catogories-box-state">
            <span className="catogories-box-spinner" aria-label="Loading" />
          </div>
        ) : data ? (
          <>
            <h1>{data.title}</h1>
            <div className="catogories-box-grid">
              {data.items.map((item, index) => (
                <button
                  className="catogories-box-card"
                  type="button"
                  key={`${item.mediaType}-${item.id}`}
                  onClick={() => openMovieDetails({ id: item.id, mediaType: item.mediaType })}
                  onMouseEnter={(event) => {
                    const card = event.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const containerRect = card.parentElement?.getBoundingClientRect();
                    const visibleLeft = Math.max(containerRect?.left ?? 0, 112);
                    const visibleRight = Math.min(containerRect?.right ?? window.innerWidth, window.innerWidth - 32);
                    const previewHalfWidth = 170;
                    const cardCenter = rect.left + rect.width / 2;

                    card.dataset.previewEdge = cardCenter - visibleLeft < previewHalfWidth
                      ? "left"
                      : visibleRight - cardCenter < previewHalfWidth
                        ? "right"
                        : "center";
                  }}
                >
                  <img src={item.posterUrl || item.backdropUrl} alt={item.title} />
                  {(index + 1) % 3 === 0 && <span className="catogories-box-badge">TOP<br />10</span>}
                  <span className="catogories-box-language">{item.originalLanguage || item.year}</span>
                  <strong>{item.title}</strong>
                  <span className="catogories-box-hover">
                    <span className="catogories-hover-art">
                      <img src={item.backdropUrl || item.posterUrl} alt="" />
                      <span className="catogories-hover-language">{item.originalLanguage || "TMDB"}</span>
                      <VolumeX className="catogories-hover-muted" size={22} />
                      <b>{item.title}</b>
                    </span>
                    <span className="catogories-hover-actions">
                      <span className="catogories-hover-watch"><Play size={16} fill="currentColor" /> Watch Now</span>
                      <span className="catogories-hover-add"><Plus size={22} /></span>
                    </span>
                    <span className="catogories-hover-meta">{item.year} / TMDB {item.rating}</span>
                    <small>{item.overview}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="catogories-box-state">No TMDB category found</div>
        )}
      </section>
    </>
  );
}



