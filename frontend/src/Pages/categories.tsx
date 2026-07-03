import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Monitor, PlaySquare, Sparkles } from "lucide-react";
import "./page.css";

type CategoryTile = {
  title: string;
  slug: string;
  subtitle?: string;
  route: string;
  imageUrl: string;
};

type CategoriesResponse = {
  browse: CategoryTile[];
  studios: CategoryTile[];
  popularLanguages: CategoryTile[];
  popularGenres: CategoryTile[];
  popularAnimes: CategoryTile[];
};

const withoutNews = (tiles: CategoryTile[]) => (
  tiles.filter((tile) => tile.slug !== "news" && tile.title.toLowerCase() !== "news")
);

const apiBaseUrls = [
  import.meta.env.VITE_API_BASE_URL || "",
  "http://localhost:5000",
].filter((url, index, urls) => urls.indexOf(url) === index);

const browseIcons = [PlaySquare, Monitor, Clapperboard, Sparkles];
const browseClasses = ["browse-teal", "browse-purple", "browse-blue", "browse-violet", "browse-plum"];
const tileClasses = ["genre-rose", "genre-teal", "genre-gold", "genre-cyan", "genre-blue"];

function ImageRail({ title, tiles, viewAll = false, studio = false }: { title: string; tiles: CategoryTile[]; viewAll?: boolean; studio?: boolean }) {
  return (
    <section className="category-section">
      <div className="category-section-header">
        <h2>{title}</h2>
        {viewAll && <Link to={tiles[0]?.route || "/categories"}>View All</Link>}
      </div>

      <div className={studio ? "category-rail studio-rail" : "category-rail"}>
        {tiles.map((tile, index) => (
          <Link
            className={`${studio ? "category-tile studio-tile" : "category-tile"} ${tileClasses[index % tileClasses.length]}`}
            to={tile.route}
            key={tile.slug}
          >
            <img src={tile.imageUrl} alt="" />
            <span className="category-tile-shade" />
            <strong>{tile.title}</strong>
            {tile.subtitle && <small>{tile.subtitle}</small>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Categories() {
  const [data, setData] = useState<CategoriesResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      for (const baseUrl of apiBaseUrls) {
        try {
          const params = new URLSearchParams({ language: "en-US" });
          const response = await fetch(`${baseUrl}/api/tmdb/categories?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) continue;

          setData((await response.json()) as CategoriesResponse);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
    };

    loadCategories();

    return () => controller.abort();
  }, []);

  return (
    <>

      <section className="categories-page">
        {!data ? (
          <div className="page-loading-state">
            <span className="page-loading-spinner" aria-label="Loading" />
          </div>
        ) : (
          <>
            <section className="category-section">
              <h1>Browse</h1>
              <div className="browse-grid">
                {withoutNews(data.browse).map((tile, index) => {
                  const Icon = browseIcons[index % browseIcons.length];

                  return (
                    <Link className={`browse-card ${browseClasses[index % browseClasses.length]}`} to={tile.route} key={tile.slug}>
                      <img src={tile.imageUrl} alt="" />
                      <span className="browse-card-shade" />
                      <strong>{tile.title}</strong>
                      <Icon size={92} strokeWidth={1.2} />
                    </Link>
                  );
                })}
              </div>
            </section>

            <ImageRail title="Studios" tiles={data.studios} viewAll studio />
            <ImageRail title="Popular Languages" tiles={data.popularLanguages} />
            <ImageRail title="Popular Genres" tiles={data.popularGenres} viewAll />
            <ImageRail title="Popular Animes" tiles={data.popularAnimes} />
          </>
        )}
      </section>
    </>
  );
}
