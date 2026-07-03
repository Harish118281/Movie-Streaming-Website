import { useEffect, useState } from "react";
import { Play, Plus, X } from "lucide-react";
import type { ContentCard } from "../ContentRow/ContentRow";
import "./MovieDetails.css";

export type MovieDetailsTarget = {
  id: number;
  mediaType: "movie" | "tv";
};

type MovieDetailsData = MovieDetailsTarget & {
  title: string;
  overview: string;
  backdropUrl: string;
  posterUrl: string;
  year: string;
  rating: string;
  runtime: string;
  languages: string;
  genres: string[];
  trailerKey: string;
  moreLikeThis: ContentCard[];
};

const apiBaseUrls = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

export const openMovieDetails = (target: MovieDetailsTarget) => {
  window.dispatchEvent(new CustomEvent<MovieDetailsTarget>("movieflix:open-details", { detail: target }));
};

export const playMovieTrailer = (target: MovieDetailsTarget) => {
  window.dispatchEvent(new CustomEvent<MovieDetailsTarget>("movieflix:play-trailer", { detail: target }));
};

export default function MovieDetails() {
  const [target, setTarget] = useState<MovieDetailsTarget | null>(null);
  const [details, setDetails] = useState<MovieDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState("");
  const [trailerMessage, setTrailerMessage] = useState("");
  const [autoPlayTrailer, setAutoPlayTrailer] = useState(false);

  useEffect(() => {
    const openDetails = (event: Event) => {
      const customEvent = event as CustomEvent<MovieDetailsTarget>;
      setAutoPlayTrailer(false);
      setTrailerKey("");
      setTrailerMessage("");
      setTarget(customEvent.detail);
    };
    const playTrailerDirectly = (event: Event) => {
      const customEvent = event as CustomEvent<MovieDetailsTarget>;
      setAutoPlayTrailer(true);
      setTrailerKey("");
      setTrailerMessage("");
      setTarget(customEvent.detail);
    };

    window.addEventListener("movieflix:open-details", openDetails);
    window.addEventListener("movieflix:play-trailer", playTrailerDirectly);

    return () => {
      window.removeEventListener("movieflix:open-details", openDetails);
      window.removeEventListener("movieflix:play-trailer", playTrailerDirectly);
    };
  }, []);

  useEffect(() => {
    if (!target) {
      setDetails(null);
      setTrailerMessage("");
      setAutoPlayTrailer(false);
      return;
    }

    const controller = new AbortController();

    const loadDetails = async () => {
      setLoading(true);
      setTrailerMessage("");
      setTrailerKey("");

      for (const baseUrl of apiBaseUrls) {
        try {
          const params = new URLSearchParams({ language: "en-US" });
          const response = await fetch(
            `${baseUrl}/api/tmdb/details/${target.mediaType}/${target.id}?${params.toString()}`,
            { signal: controller.signal },
          );

          if (!response.ok) continue;

          const nextDetails = (await response.json()) as MovieDetailsData;
          setDetails(nextDetails);

          if (autoPlayTrailer) {
            if (nextDetails.trailerKey) {
              setTrailerKey(nextDetails.trailerKey);
            } else {
              setTrailerMessage("Trailer is not available for this title.");
            }
          }

          setLoading(false);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      setLoading(false);
    };

    loadDetails();

    return () => controller.abort();
  }, [target, autoPlayTrailer]);

  const closeDetails = () => {
    setTarget(null);
    setDetails(null);
    setTrailerKey("");
    setTrailerMessage("");
    setAutoPlayTrailer(false);
  };

  const playTrailer = () => {
    if (!details?.trailerKey) {
      setTrailerMessage("Trailer is not available for this title.");
      return;
    }

    setTrailerMessage("");
    setTrailerKey(details.trailerKey);
  };

  if (!target) {
    return null;
  }

  return (
    <div className="movie-details-backdrop" role="dialog" aria-modal="true">
      <div className="movie-details-panel">
        <button className="movie-details-close" type="button" onClick={closeDetails} aria-label="Close details">
          <X size={34} />
        </button>

        {loading || !details ? (
          <div className="movie-details-loading">
            <span className="movie-details-spinner" aria-label="Loading" />
          </div>
        ) : (
          <>
            <section className="movie-details-hero" style={{ backgroundImage: `url(${details.backdropUrl || details.posterUrl})` }}>
              <div className="movie-details-hero-shade" />
              <div className="movie-details-copy">
                <h1>{details.title}</h1>
                <p className="movie-details-meta">
                  {details.year}
                  <span>/</span>
                  {details.rating}
                  <span>/</span>
                  {details.runtime}
                  <span>/</span>
                  {details.languages}
                </p>
                <p className="movie-details-overview">{details.overview}</p>
                <p className="movie-details-genres">{details.genres.join("  |  ")}</p>
                <div className="movie-details-actions">
                  <button className="movie-details-watch" type="button" onClick={playTrailer}>
                    <Play size={22} fill="currentColor" />
                    Watch Now
                  </button>
                  <button className="movie-details-add" type="button" aria-label={`Add ${details.title}`}>
                    <Plus size={28} />
                  </button>
                </div>
                {trailerMessage && <p className="movie-details-trailer-message">{trailerMessage}</p>}
              </div>
            </section>

            <section className="movie-details-more">
              <h2>More Like This</h2>
              <div className="movie-details-related-grid">
                {details.moreLikeThis.map((item) => (
                  <button className="movie-details-related-card" type="button" key={`${item.mediaType}-${item.id}`} onClick={() => {
                    setAutoPlayTrailer(false);
                    setTarget({ id: item.id, mediaType: item.mediaType });
                  }}>
                    <img src={item.backdropUrl || item.posterUrl} alt={item.title} />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {trailerKey && (
        <div className="movie-trailer-fullscreen">
          <button className="movie-trailer-close" type="button" onClick={() => setTrailerKey("")} aria-label="Close trailer">
            <X size={34} />
          </button>
          <iframe
            title="Trailer"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
