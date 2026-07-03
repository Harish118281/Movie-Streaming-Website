import { Play, Plus, VolumeX } from "lucide-react";
import { openMovieDetails } from "../MovieDetails/MovieDetails";
import "./ContentRow.css";

export type ContentCard = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  year: string;
  rating: string;
  originalLanguage: string;
};

export type ContentRowData = {
  title: string;
  items: ContentCard[];
};

type ContentRowProps = {
  row: ContentRowData;
};

export default function ContentRow({ row }: ContentRowProps) {
  return (
    <section className="content-row" aria-label={row.title}>
      <h2 className="content-row-title">{row.title}</h2>

      <div className="content-row-track">
        {row.items.map((item) => (
          <button
            className="content-card"
            type="button"
            key={`${item.mediaType}-${item.id}`}
            onClick={() => openMovieDetails({ id: item.id, mediaType: item.mediaType })}
            onMouseEnter={(event) => {
              const card = event.currentTarget;
              const rect = card.getBoundingClientRect();
              const containerRect = card.parentElement?.getBoundingClientRect();
              const visibleLeft = Math.max(containerRect?.left ?? 0, 96);
              const visibleRight = Math.min(containerRect?.right ?? window.innerWidth, window.innerWidth - 24);
              const isPartlyHidden = rect.left < visibleLeft || rect.right > visibleRight;

              if (isPartlyHidden) {
                card.dataset.previewEdge = "hidden";
                return;
              }

              const previewHalfWidth = 216;
              const cardCenter = rect.left + rect.width / 2;
              card.dataset.previewEdge = cardCenter - visibleLeft < previewHalfWidth
                ? "left"
                : visibleRight - cardCenter < previewHalfWidth
                  ? "right"
                  : "center";
            }}
          >
            <img src={item.posterUrl || item.backdropUrl} alt={item.title} />
            <span className="content-card-title">{item.title}</span>
            <span className="content-card-hover">
              <span className="content-hover-art">
                <img src={item.backdropUrl || item.posterUrl} alt="" />
                <span className="content-hover-language">{item.originalLanguage || "TMDB"}</span>
                <VolumeX className="content-hover-muted" size={22} />
                <strong>{item.title}</strong>
              </span>
              <span className="content-hover-actions">
                <span className="content-hover-watch"><Play size={16} fill="currentColor" /> Watch Now</span>
                <span className="content-hover-add"><Plus size={22} /></span>
              </span>
              <span className="content-hover-meta">{item.year} / TMDB {item.rating}</span>
              <span className="content-hover-overview">{item.overview}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
