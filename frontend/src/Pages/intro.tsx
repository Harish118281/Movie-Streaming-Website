import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Download,
  Languages,
  Monitor,
  Smartphone,
  UsersRound,
} from "lucide-react";
import backgroundImage from "../assets/background.jpg";
import "./intro.css";

type IntroCard = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string;
  backdropUrl: string;
  rating: string;
};

type IntroPageData = {
  rows?: Array<{
    title: string;
    items: IntroCard[];
  }>;
};

const API_BASE_URLS = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

const reasonCards = [
  {
    title: "Enjoy on your TV",
    text: "Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.",
    icon: Monitor,
  },
  {
    title: "Download your shows to watch offline",
    text: "Save your favorites easily and always have something to watch.",
    icon: Download,
  },
  {
    title: "Watch everywhere",
    text: "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
    icon: Smartphone,
  },
  {
    title: "Create profiles for kids",
    text: "Send kids on adventures with their favorite characters in a space made just for them.",
    icon: UsersRound,
  },
];

export default function Intro() {
  const [items, setItems] = useState<IntroCard[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTrending = async () => {
      for (const baseUrl of API_BASE_URLS) {
        try {
          const params = new URLSearchParams({ language: "en-US" });
          const response = await fetch(`${baseUrl}/api/tmdb/page/home?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as IntroPageData;
          setItems(data.rows?.flatMap((row) => row.items) || []);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }
    };

    loadTrending();

    return () => controller.abort();
  }, []);

  const trending = useMemo(() => {
    const seen = new Set<string>();

    return items
      .filter((item) => item.posterUrl || item.backdropUrl)
      .sort((first, second) => Number(second.rating) - Number(first.rating))
      .filter((item) => {
        const key = `${item.mediaType}-${item.id}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }, [items]);

  return (
    <main className="intro-page">
      <section className="intro-hero">
        <img src={backgroundImage} alt="" className="intro-bg" />
        <div className="intro-hero-shade" />

        <header className="intro-topbar">
          <Link className="intro-brand" to="/">
            MOVIEFLIX
          </Link>

          <div className="intro-top-actions">
            <span className="intro-language" aria-label="Website language">
              <Languages size={20} />
              <span>English</span>
            </span>

            <Link className="intro-signup" to="/signup">
              Signup
            </Link>
          </div>
        </header>

        <div className="intro-hero-copy">
          <h1>Unlimited movies, TV shows, and more</h1>

          <Link className="intro-login-button" to="/login">
            Login
            <ChevronRight size={34} />
          </Link>
        </div>

        <div className="intro-curve" />
      </section>

      <section className="intro-more">
        <div className="intro-section-inner">
          <h2>Trending Now</h2>

          <div className="intro-trending-row" aria-label="Trending movies and shows">
            {trending.map((item, index) => (
              <article className="intro-trending-card" key={`${item.mediaType}-${item.id}`}>
                <img src={item.posterUrl || item.backdropUrl} alt={item.title} />
                <span>{index + 1}</span>
              </article>
            ))}
          </div>

          <h2>More Reasons to Join</h2>

          <div className="intro-reasons-grid">
            {reasonCards.map(({ title, text, icon: Icon }) => (
              <article className="intro-reason-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
                <Icon size={58} strokeWidth={1.8} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
