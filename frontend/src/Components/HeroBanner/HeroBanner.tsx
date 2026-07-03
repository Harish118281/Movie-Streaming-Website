import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import { openMovieDetails, playMovieTrailer, type MovieDetailsTarget } from "../MovieDetails/MovieDetails";
import "./HeroBanner.css";


export type HeroPreviewItem = {
  id: string;
  title: string;
  imageUrl: string;
  backdropUrl?: string;
  year?: string;
  rating?: string;
  runtime?: string;
  languages?: string;
  description?: string;
  genres?: string[];
};

export type HeroBannerContent = {
  title: string;
  titleImageUrl?: string;
  backdropUrl: string;
  rankText: string;
  statusText: string;
  year: string;
  rating: string;
  runtime: string;
  languages: string;
  description: string;
  genres: string[];
  primaryActionLabel: string;
  previews: HeroPreviewItem[];
};

type HeroBannerProps = {
  content: HeroBannerContent;
};

const SLIDE_INTERVAL_MS = 5200;

const heroSlideTargetFromId = (id: string): MovieDetailsTarget | null => {
  const [mediaType, rawId] = id.split("-");
  const tmdbId = Number(rawId);

  if ((mediaType === "movie" || mediaType === "tv") && Number.isFinite(tmdbId)) {
    return { id: tmdbId, mediaType };
  }

  return null;
};

export default function HeroBanner({ content }: HeroBannerProps) {
  const previewTrackRef = useRef<HTMLDivElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const slides = useMemo(() => {
    const previewSlides = content.previews.length > 0
      ? content.previews
      : [{ id: "hero", title: content.title, imageUrl: content.backdropUrl, backdropUrl: content.backdropUrl }];

    return previewSlides.map((preview, index) => ({
      id: preview.id,
      title: preview.title || content.title,
      titleImageUrl: index === 0 ? content.titleImageUrl : undefined,
      backdropUrl: preview.backdropUrl || preview.imageUrl || content.backdropUrl,
      rankText: content.rankText,
      statusText: content.statusText,
      year: preview.year || content.year,
      rating: preview.rating || content.rating,
      runtime: preview.runtime || content.runtime,
      languages: preview.languages || content.languages,
      description: preview.description || content.description,
      genres: preview.genres?.length ? preview.genres : content.genres,
      primaryActionLabel: content.primaryActionLabel,
      thumbnailUrl: preview.imageUrl || preview.backdropUrl || content.backdropUrl,
    }));
  }, [content]);

  const activeSlide = slides[activePreviewIndex] || slides[0];

  const heroStyle = {
    backgroundImage: `url(${activeSlide.backdropUrl})`,
  } as CSSProperties;
  const activeSlideTarget = activeSlide ? heroSlideTargetFromId(activeSlide.id) : null;

  const openActiveSlideDetails = () => {
    if (activeSlideTarget) {
      openMovieDetails(activeSlideTarget);
   }
 };

  const selectSlide = (index: number) => {
    setActivePreviewIndex((index + slides.length) % slides.length);
  };

  const scrollPreviews = (direction: -1 | 1) => {
    if (slides.length === 0) {
      return;
    }

    selectSlide(activePreviewIndex + direction);
  };

  const playActiveSlideTrailer = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (activeSlideTarget) {
      playMovieTrailer(activeSlideTarget);
    }
  };

  useEffect(() => {
    setActivePreviewIndex(slides.length > 0 ? Math.floor(Math.random() * slides.length) : 0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActivePreviewIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const previewTrack = previewTrackRef.current;
    const activeButton = previewTrack?.querySelector<HTMLButtonElement>(`[data-slide-index="${activePreviewIndex}"]`);

    if (!previewTrack || !activeButton) {
      return;
    }

    previewTrack.scrollTo({
      left: activeButton.offsetLeft - (previewTrack.clientWidth - activeButton.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [activePreviewIndex]);

  return (
    <section className="hero-banner" style={heroStyle} onClick={openActiveSlideDetails}>
      <div className="hero-banner-overlay" />

      <div className="hero-banner-content" key={activeSlide.id}>
        <div className="hero-title-lockup">
          {activeSlide.titleImageUrl ? (
            <img
              src={activeSlide.titleImageUrl}
              alt={activeSlide.title}
              className="hero-title-image"
            />
          ) : (
            <h1 className="hero-title-text">{activeSlide.title}</h1>
          )}
        </div>

        <p className="hero-rank-line">
          {activeSlide.rankText}
          <span>/</span>
          {activeSlide.statusText}
        </p>

        <p className="hero-meta-line">
          {activeSlide.year}
          <span>/</span>
          {activeSlide.rating}
          <span>/</span>
          {activeSlide.runtime}
          <span>/</span>
          {activeSlide.languages}
        </p>

        <p className="hero-description">{activeSlide.description}</p>

        <p className="hero-genres">{activeSlide.genres.join("  |  ")}</p>

        <div className="hero-actions">
          <button className="hero-watch-button" type="button" onClick={playActiveSlideTrailer} >
            <Play size={24} fill="currentColor" />
            <span>{activeSlide.primaryActionLabel}</span>
          </button>

          <button className="hero-add-button" type="button" aria-label={`Add ${activeSlide.title}`}>
            <Plus size={30} />
          </button>
        </div>
      </div>

      <div className="hero-preview-strip" aria-label="Featured titles">
        <button
          className="hero-preview-arrow hero-preview-arrow-left"
          type="button"
          aria-label="Previous featured title"
          onClick={(event) => {
            event.stopPropagation();
            scrollPreviews(-1);
          }}
        >
          <ChevronLeft size={28} />
        </button>

        <div className="hero-preview-track" ref={previewTrackRef}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              data-slide-index={index}
              className={`hero-preview-card ${index === activePreviewIndex ? "active" : ""}`}
              aria-label={slide.title}
              onClick={(event) => {
                event.stopPropagation();
                selectSlide(index);
              }}
            >
              <img src={slide.thumbnailUrl} alt="" />
            </button>
          ))}
        </div>

        <button
          className="hero-preview-arrow hero-preview-arrow-right"
          type="button"
          aria-label="Next featured title"
          onClick={(event) => {
            event.stopPropagation();
            scrollPreviews(1);
          }}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </section>
  );
}
