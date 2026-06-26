import { useEffect, useMemo, useState } from "react";
import ContentRow, { type ContentRowData } from "../ContentRow/ContentRow";
import Header from "../header/header";
import HeroBanner, { type HeroBannerContent } from "../HeroBanner/HeroBanner";
import { useLanguage } from "../../Language/LanguageContext";
import "./HeroPage.css";

type HeroPageData = {
  hero: HeroBannerContent;
  rows: ContentRowData[];
};

type HeroPageProps = {
  page: "home" | "movies" | "tv" | "animes";
};

const API_BASE_URLS = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const fetchPageData = async (page: HeroPageProps["page"], language: string, signal: AbortSignal) => {
  let lastError = "Unable to load TMDB content";

  for (const baseUrl of API_BASE_URLS) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const params = new URLSearchParams({ language });
        const response = await fetch(`${baseUrl}/api/tmdb/page/${page}?${params.toString()}`, { signal });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as { message?: string } | null;
          lastError = errorData?.message || "Unable to load TMDB content";

          if (response.status < 500) {
            break;
          }
        } else {
          return (await response.json()) as HeroPageData;
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          throw loadError;
        }

        lastError = "Connecting to content server...";
      }

      await wait(450);
    }
  }

  throw new Error(lastError);
};

export default function HeroPage({ page }: HeroPageProps) {
  const [data, setData] = useState<HeroPageData | null>(null);
  const [error, setError] = useState("");
  const { tmdbLanguage, t } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();

    const loadPage = async () => {
      setError("");

      try {
        setData(await fetchPageData(page, tmdbLanguage, controller.signal));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(loadError instanceof Error ? t(loadError.message) : t("Unable to load TMDB content"));
      }
    };

    loadPage();

    return () => {
      controller.abort();
    };
  }, [page, tmdbLanguage, t]);

  const translatedHero = useMemo(() => {
    if (!data) {
      return null;
    }

    return {
      ...data.hero,
      rankText: t(data.hero.rankText),
      statusText: t(data.hero.statusText),
      runtime: t(data.hero.runtime),
      languages: t(data.hero.languages),
      primaryActionLabel: t(data.hero.primaryActionLabel),
      previews: data.hero.previews.map((preview) => ({
        ...preview,
        runtime: preview.runtime ? t(preview.runtime) : preview.runtime,
        languages: preview.languages ? t(preview.languages) : preview.languages,
      })),
    };
  }, [data, t]);

  return (
    <>
      <Header />

      {data ? (
        <>
          {translatedHero && <HeroBanner content={translatedHero} />}

          <div className="hero-page-rows">
            {data.rows.map((row) => (
              <ContentRow row={{ ...row, title: t(row.title) }} key={row.title} />
            ))}
          </div>
        </>
      ) : (
        <div className="hero-page-loading">
          <span className="hero-page-spinner" aria-label="Loading" />
          {error && <span className="hero-page-loading-text">{error}</span>}
        </div>
      )}
    </>
  );
}
