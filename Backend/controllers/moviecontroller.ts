import type { Request, Response } from "express";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

type MediaType = "movie" | "tv";
type PageKind = "home" | "movies" | "tv" | "animes";

type TmdbListItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  original_language?: string;
};

type TmdbListResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbListItem[];
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbGenreResponse = {
  genres: TmdbGenre[];
};

type TmdbDetails = TmdbListItem & {
  runtime?: number;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  spoken_languages?: Array<{ english_name?: string; name?: string }>;
};

type ContentCard = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  year: string;
  rating: string;
  originalLanguage: string;
};

type HeroCandidate = TmdbListItem & {
  mediaType: MediaType;
};

const INDIAN_LANGUAGES = new Set(["hi", "ta", "te", "kn", "ml", "bn", "mr", "pa", "gu", "or"]);

const imageUrl = (path?: string | null, size = "w500") => {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : "";
};

const getApiKey = () => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is missing in Backend/.env");
  }

  return apiKey;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tmdbRequest = async <T>(path: string, params: Record<string, string | number | boolean> = {}) => {
  const apiKey = getApiKey();
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const url = new URL(`${TMDB_BASE_URL}${path}`);
    const headers: Record<string, string> = {};

    if (apiKey.startsWith("eyJ")) {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      url.searchParams.set("api_key", apiKey);
    }

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    try {
      const response = await fetch(url, { headers });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const message = await response.text();
      lastError = new Error(`TMDB request failed (${response.status}): ${message}`);

      if (response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(350 * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("TMDB request failed");
};

const titleFor = (item: TmdbListItem) => item.title || item.name || "Untitled";

const yearFor = (item: TmdbListItem) => {
  const date = item.release_date || item.first_air_date || "";
  return date ? date.slice(0, 4) : "N/A";
};

const ratingFor = (item: TmdbListItem) => {
  return item.vote_average ? item.vote_average.toFixed(1) : "N/A";
};

const mapCard = (item: TmdbListItem, mediaType: MediaType): ContentCard => ({
  id: item.id,
  mediaType,
  title: titleFor(item),
  overview: item.overview || "",
  posterUrl: imageUrl(item.poster_path, "w500"),
  backdropUrl: imageUrl(item.backdrop_path, "original"),
  year: yearFor(item),
  rating: ratingFor(item),
  originalLanguage: item.original_language || "",
});

const discover = async (
  mediaType: MediaType,
  language: string,
  params: Record<string, string | number | boolean> = {},
) => {
  return tmdbRequest<TmdbListResponse>(`/discover/${mediaType}`, {
    include_adult: false,
    include_null_first_air_dates: false,
    language,
    page: 1,
    sort_by: "popularity.desc",
    ...params,
  });
};

const randomTmdbPage = () => Math.floor(Math.random() * 5) + 1;

const shuffleItems = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const buildPriorityHeroPool = (...groups: Array<{ items: TmdbListItem[]; mediaType: MediaType }>) => {
  const seen = new Set<string>();
  const candidates = groups.flatMap(({ items, mediaType }) => (
    shuffleItems(items)
      .filter((item) => item.backdrop_path || item.poster_path)
      .map((item) => ({ ...item, mediaType }))
  ));

  return candidates.filter((item) => {
    const key = `${item.mediaType}-${item.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildHeroPool = (...groups: Array<{ items: TmdbListItem[]; mediaType: MediaType }>) => (
  shuffleItems(buildPriorityHeroPool(...groups))
);

const isIndianContent = (item: TmdbListItem | ContentCard) => {
  const language = "originalLanguage" in item ? item.originalLanguage : item.original_language;
  return INDIAN_LANGUAGES.has(language || "");
};

const prioritizeIndianItems = <T extends TmdbListItem | ContentCard>(items: T[]) => {
  return [...items].sort((first, second) => Number(isIndianContent(second)) - Number(isIndianContent(first)));
};

const getGenreNames = async (mediaType: MediaType, ids: number[], language: string) => {
  if (ids.length === 0) {
    return [];
  }

  const data = await tmdbRequest<TmdbGenreResponse>(`/genre/${mediaType}/list`, { language });
  const genreMap = new Map(data.genres.map((genre) => [genre.id, genre.name]));
  return ids.map((id) => genreMap.get(id)).filter((name): name is string => Boolean(name)).slice(0, 4);
};

const formatRuntime = (details?: TmdbDetails) => {
  const minutes = details?.runtime || details?.episode_run_time?.[0];

  if (!minutes) {
    return "Runtime N/A";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const languageCount = (details?: TmdbDetails) => {
  const count = details?.spoken_languages?.length || 1;
  return `${count} ${count === 1 ? "Language" : "Languages"}`;
};

const detailsFor = (mediaType: MediaType, id: number, language: string) => {
  return tmdbRequest<TmdbDetails>(`/${mediaType}/${id}`, { language });
};

const pickHero = async (items: HeroCandidate[], language: string, statusText: string) => {
  const heroItem = items.find((item) => item.backdrop_path && item.overview) || items[0];

  if (!heroItem) {
    throw new Error("TMDB did not return any hero items");
  }

  const heroMediaType = heroItem.mediaType;
  const details = await detailsFor(heroMediaType, heroItem.id, language);
  const detailGenres = details.genres?.map((genre) => genre.name).slice(0, 4);
  const genres = detailGenres && detailGenres.length > 0
    ? detailGenres
    : await getGenreNames(heroMediaType, heroItem.genre_ids || [], language);
  const previewItems = items
    .filter((item) => item.backdrop_path || item.poster_path)
    .slice(0, 7);
  const previewGenres = await Promise.all(previewItems.map((item) => (
    getGenreNames(item.mediaType, item.genre_ids || [], language).catch(() => [])
  )));

  return {
    title: titleFor(heroItem),
    backdropUrl: imageUrl(heroItem.backdrop_path, "original"),
    rankText: "Trending Today",
    statusText,
    year: yearFor(heroItem),
    rating: `TMDB ${ratingFor(heroItem)}`,
    runtime: formatRuntime(details),
    languages: languageCount(details),
    description: heroItem.overview || "",
    genres,
    primaryActionLabel: "Watch Now",
    previews: previewItems
      .map((item, index) => ({
        id: `${item.mediaType}-${item.id}`,
        title: titleFor(item),
        imageUrl: imageUrl(item.backdrop_path || item.poster_path, "w300"),
        backdropUrl: imageUrl(item.backdrop_path || item.poster_path, "original"),
        year: yearFor(item),
        rating: `TMDB ${ratingFor(item)}`,
        runtime: item.mediaType === "tv" ? "Series" : "Movie",
        languages: languageCount(details),
        description: item.overview || "",
        genres: previewGenres[index].length > 0 ? previewGenres[index] : genres,
      })),
  };
};

const rowFrom = (title: string, mediaType: MediaType, response: TmdbListResponse, limit = 20) => ({
  title,
  items: response.results
    .filter((item) => item.poster_path || item.backdrop_path)
    .slice(0, limit)
    .map((item) => mapCard(item, mediaType)),
});

const buildHomePage = async (language: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const [
    thriller,
    horror,
    indianCinema,
    bollywood,
    popular,
    teluguAction,
    newMovies,
    topHindi,
    comedyCarnival,
    dadStories,
    loveStory,
    familySaga,
    comingSoon,
    popularAction,
    popularComedy,
    popularDrama,
    popularCrime,
    popularKids,
    popularReality,
  ] = await Promise.all([
    discover("movie", language, { with_genres: 53, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 27, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", sort_by: "vote_average.desc", "vote_count.gte": 50, page: randomTmdbPage() }),
    discover("movie", language, { with_original_language: "hi", region: "IN", sort_by: "vote_average.desc", "vote_count.gte": 30, page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 28, with_original_language: "te", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", sort_by: "primary_release_date.desc", page: randomTmdbPage() }),
    discover("movie", language, { with_original_language: "hi", region: "IN", sort_by: "popularity.desc", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 35, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: "18,10751", with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 10749, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 10751, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", sort_by: "primary_release_date.asc", "primary_release_date.gte": today, page: 1 }),
    discover("movie", language, { with_genres: 28, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 35, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 18, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 80, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 10751, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("tv", language, { with_genres: 10764, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
  ]);
  const heroPool = buildPriorityHeroPool(
    { items: popular.results, mediaType: "movie" },
    { items: indianCinema.results, mediaType: "movie" },
    { items: bollywood.results, mediaType: "movie" },
    { items: topHindi.results, mediaType: "movie" },
    { items: teluguAction.results, mediaType: "movie" },
    { items: popularReality.results, mediaType: "tv" },
  );

  return {
    hero: await pickHero(heroPool, language, "Featured"),
    rows: [
      rowFrom("Thriller Movies", "movie", thriller),
      rowFrom("Horror Movies", "movie", horror),
      rowFrom("The Great Indian Cinema", "movie", indianCinema),
      rowFrom("Best of Bollywood Movies", "movie", bollywood),
      rowFrom("Popular Movies", "movie", popular),
      rowFrom("Telugu Action: Gravity Optional", "movie", teluguAction),
      rowFrom("New Movies", "movie", newMovies),
      rowFrom("Top 10 in India Today - Hindi", "movie", topHindi, 10),
      rowFrom("Comedy Carnival", "movie", comedyCarnival),
      rowFrom("Stories to Share with Your Dad", "movie", dadStories),
      rowFrom("Find Your Love Story", "movie", loveStory),
      rowFrom("The Family Saga", "movie", familySaga),
      rowFrom("Coming Soon", "movie", comingSoon),
      rowFrom("Popular in Action", "movie", popularAction),
      rowFrom("Popular in Comedy", "movie", popularComedy),
      rowFrom("Popular in Drama", "movie", popularDrama),
      rowFrom("Popular in Crime", "movie", popularCrime),
      rowFrom("Popular in Kids", "movie", popularKids),
      rowFrom("Popular in Reality", "tv", popularReality),
    ],
  };
};

const buildMoviesPage = async (language: string) => {
  const [
    thriller,
    horror,
    drama,
    popular,
    topHindi,
    bollywood,
    loveStory,
    biopic,
    teluguAction,
    recommended,
    hollywoodDubbed,
    love2010s,
    indianCinema,
    kids,
  ] = await Promise.all([
    discover("movie", language, { with_genres: 53, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 27, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 18, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_original_language: "hi", region: "IN", sort_by: "popularity.desc", page: randomTmdbPage() }),
    discover("movie", language, { with_original_language: "hi", region: "IN", sort_by: "vote_average.desc", "vote_count.gte": 30, page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 10749, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: "18,36", with_origin_country: "IN", region: "IN", sort_by: "vote_average.desc", "vote_count.gte": 20, page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 28, with_original_language: "te", region: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", sort_by: "popularity.desc", page: randomTmdbPage() }),
    discover("movie", language, { with_original_language: "en", region: "IN", watch_region: "IN", sort_by: "popularity.desc", page: randomTmdbPage() }),
    discover("movie", language, {
      with_genres: 10749,
      with_origin_country: "IN",
      region: "IN",
      "primary_release_date.gte": "2010-01-01",
      "primary_release_date.lte": "2019-12-31",
      page: randomTmdbPage(),
    }),
    discover("movie", language, { with_origin_country: "IN", region: "IN", sort_by: "vote_average.desc", "vote_count.gte": 50, page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 10751, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
  ]);
  const heroPool = buildPriorityHeroPool(
    { items: popular.results, mediaType: "movie" },
    { items: recommended.results, mediaType: "movie" },
    { items: bollywood.results, mediaType: "movie" },
    { items: hollywoodDubbed.results, mediaType: "movie" },
  );

  return {
    hero: await pickHero(heroPool, language, "Newly Added"),
    rows: [
      rowFrom("Thriller Movies", "movie", thriller),
      rowFrom("Horror Movies", "movie", horror),
      rowFrom("Drama Movies", "movie", drama),
      rowFrom("Popular Movies", "movie", popular),
      rowFrom("Top 10 Movies - Hindi", "movie", topHindi, 10),
      rowFrom("Best of Bollywood Movies", "movie", bollywood),
      rowFrom("Find Your Love Story", "movie", loveStory),
      rowFrom("Biopic Movies", "movie", biopic),
      rowFrom("Telugu Action: Gravity Optional", "movie", teluguAction),
      rowFrom("Movies Recommended For You", "movie", recommended),
      rowFrom("Best of Hollywood Dubbed", "movie", hollywoodDubbed),
      rowFrom("Love in the 2010s", "movie", love2010s),
      rowFrom("The Great Indian Cinema", "movie", indianCinema),
      rowFrom("Popular Kids Movies", "movie", kids),
    ],
  };
};

const buildTvPage = async (language: string) => {
  const [indianShows, popular, topRated, serials, drama] = await Promise.all([
    discover("tv", language, { with_origin_country: "IN", watch_region: "IN", page: randomTmdbPage() }),
    discover("tv", language, { page: randomTmdbPage() }),
    discover("tv", language, { sort_by: "vote_average.desc", "vote_count.gte": 200, page: randomTmdbPage() }),
    discover("tv", language, { sort_by: "first_air_date.desc", page: randomTmdbPage() }),
    discover("tv", language, { with_genres: 18, page: randomTmdbPage() }),
  ]);
  const heroPool = buildPriorityHeroPool(
    { items: indianShows.results, mediaType: "tv" },
    { items: popular.results, mediaType: "tv" },
  );

  return {
    hero: await pickHero(heroPool, language, "Popular Series"),
    rows: [
      rowFrom("Indian TV Shows", "tv", indianShows),
      rowFrom("Popular TV Shows", "tv", popular),
      rowFrom("Top Rated TV Shows", "tv", topRated),
      rowFrom("Serials", "tv", serials),
      rowFrom("Drama Shows", "tv", drama),
    ],
  };
};

const buildAnimesPage = async (language: string) => {
  const [indiaAnimeSeries, indiaAnimeMovies, animeSeries, animeMovies, cartoons, familyAnimation] = await Promise.all([
    discover("tv", language, { with_genres: 16, with_origin_country: "IN", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 16, with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
    discover("tv", language, { with_genres: 16, with_origin_country: "JP", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 16, with_origin_country: "JP", page: randomTmdbPage() }),
    discover("movie", language, { with_genres: 16, page: randomTmdbPage() }),
    discover("tv", language, { with_genres: 16, page: randomTmdbPage() }),
  ]);
  const heroPool = buildPriorityHeroPool(
    { items: indiaAnimeSeries.results, mediaType: "tv" },
    { items: indiaAnimeMovies.results, mediaType: "movie" },
    { items: animeSeries.results, mediaType: "tv" },
    { items: animeMovies.results, mediaType: "movie" },
  );

  return {
    hero: await pickHero(heroPool, language, "Anime Spotlight"),
    rows: [
      rowFrom("India Anime", "tv", indiaAnimeSeries),
      rowFrom("Indian Anime Movies", "movie", indiaAnimeMovies),
      rowFrom("Anime Series", "tv", animeSeries),
      rowFrom("Anime Movies", "movie", animeMovies),
      rowFrom("Cartoons", "movie", cartoons),
      rowFrom("Animated Shows", "tv", familyAnimation),
    ],
  };
};

const buildPage = (page: PageKind, language: string) => {
  if (page === "movies") {
    return buildMoviesPage(language);
  }

  if (page === "tv") {
    return buildTvPage(language);
  }

  if (page === "animes") {
    return buildAnimesPage(language);
  }

  return buildHomePage(language);
};

const fallbackItems: TmdbListItem[] = [
  {
    id: 550,
    title: "Fight Club",
    overview: "An office worker and a soap maker form an underground fight club that evolves into something much more.",
    backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    release_date: "1999-10-15",
    vote_average: 8.4,
    genre_ids: [18],
    original_language: "en",
  },
  {
    id: 157336,
    title: "Interstellar",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    backdrop_path: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg",
    poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    release_date: "2014-11-05",
    vote_average: 8.5,
    genre_ids: [12, 18, 878],
    original_language: "en",
  },
  {
    id: 129,
    title: "Spirited Away",
    overview: "A young girl becomes trapped in a strange world of spirits and must find courage to save her family.",
    backdrop_path: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg",
    poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    release_date: "2001-07-20",
    vote_average: 8.5,
    genre_ids: [16, 14, 10751],
    original_language: "ja",
  },
  {
    id: 94605,
    name: "Arcane",
    overview: "Two sisters find themselves on rival sides of a war between magic technologies and clashing beliefs.",
    backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",
    poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    first_air_date: "2021-11-06",
    vote_average: 8.7,
    genre_ids: [16, 10765, 10759],
    original_language: "en",
  },
];

const fallbackResponse = (page: PageKind) => {
  const mediaType: MediaType = page === "tv" || page === "animes" ? "tv" : "movie";
  const heroItems = page === "tv" || page === "animes"
    ? [fallbackItems[3], fallbackItems[2], fallbackItems[1], fallbackItems[0]]
    : fallbackItems;
  const safeHeroItems = heroItems.filter((item): item is TmdbListItem => Boolean(item));
  const heroItem = safeHeroItems[0];

  return {
    hero: {
      title: titleFor(heroItem),
      backdropUrl: imageUrl(heroItem.backdrop_path, "original"),
      rankText: "Featured",
      statusText: "Available Now",
      year: yearFor(heroItem),
      rating: `TMDB ${ratingFor(heroItem)}`,
      runtime: mediaType === "tv" ? "Series" : "Movie",
      languages: "All Languages",
      description: heroItem.overview || "",
      genres: page === "animes" ? ["Anime", "Adventure", "Fantasy"] : ["Action", "Drama", "Adventure"],
      primaryActionLabel: "Watch Now",
      previews: safeHeroItems.map((item) => ({
        id: String(item.id),
        title: titleFor(item),
        imageUrl: imageUrl(item.backdrop_path || item.poster_path, "w300"),
        backdropUrl: imageUrl(item.backdrop_path || item.poster_path, "original"),
        year: yearFor(item),
        rating: `TMDB ${ratingFor(item)}`,
        runtime: mediaType === "tv" ? "Series" : "Movie",
        languages: "All Languages",
        description: item.overview || "",
        genres: page === "animes" ? ["Anime", "Adventure", "Fantasy"] : ["Action", "Drama", "Adventure"],
      })),
    },
    rows: [
      {
        title: page === "animes" ? "Animes" : page === "tv" ? "TV Shows" : "Movies",
        items: safeHeroItems.map((item) => mapCard(item, mediaType)),
      },
      {
        title: "Recommended",
        items: fallbackItems.map((item) => mapCard(item, item.name ? "tv" : "movie")),
      },
    ],
  };
};

type CategoryTile = {
  title: string;
  slug: string;
  subtitle?: string;
  route: string;
  imageUrl: string;
};

type CategoryConfig = {
  title: string;
  slug: string;
  subtitle?: string;
  mediaType: MediaType;
  params: Record<string, string | number | boolean>;
};

const browseCategories: CategoryConfig[] = [
  { title: "Sparks", slug: "sparks", mediaType: "movie", params: { sort_by: "popularity.desc" } },
  { title: "TV", slug: "tv", mediaType: "tv", params: { sort_by: "popularity.desc" } },
  { title: "Movies", slug: "movies", mediaType: "movie", params: { sort_by: "popularity.desc" } },
  { title: "Animes", slug: "animes", mediaType: "tv", params: { with_genres: 16, with_origin_country: "JP" } },
];

const studioCategories: CategoryConfig[] = [
  { title: "hotstar specials", slug: "studio-hotstar", mediaType: "movie", params: { with_watch_providers: 122, watch_region: "IN" } },
  { title: "Disney+", slug: "studio-disney-plus", mediaType: "movie", params: { with_watch_providers: 337, watch_region: "US" } },
  { title: "HBO Max", slug: "studio-hbo-max", mediaType: "tv", params: { with_watch_providers: 1899, watch_region: "US" } },
  { title: "peacock", slug: "studio-peacock", mediaType: "movie", params: { with_watch_providers: 386, watch_region: "US" } },
  { title: "Paramount+", slug: "studio-paramount-plus", mediaType: "movie", params: { with_watch_providers: 531, watch_region: "US" } },
];
const languageCategories: CategoryConfig[] = [
  { title: "Hindi", slug: "language-hindi", subtitle: "Hindi", mediaType: "movie", params: { with_original_language: "hi" } },
  { title: "English", slug: "language-english", subtitle: "English", mediaType: "movie", params: { with_original_language: "en" } },
  { title: "Tamil", slug: "language-tamil", subtitle: "Tamil", mediaType: "movie", params: { with_original_language: "ta" } },
  { title: "Telugu", slug: "language-telugu", subtitle: "Telugu", mediaType: "movie", params: { with_original_language: "te" } },
  { title: "Kannada", slug: "language-kannada", subtitle: "Kannada", mediaType: "movie", params: { with_original_language: "kn" } },
  { title: "Malayalam", slug: "language-malayalam", subtitle: "Malayalam", mediaType: "movie", params: { with_original_language: "ml" } },
];

const genreCategories: CategoryConfig[] = [
  { title: "Romance", slug: "genre-romance", mediaType: "movie", params: { with_genres: 10749 } },
  { title: "Drama", slug: "genre-drama", mediaType: "movie", params: { with_genres: 18 } },
  { title: "Family", slug: "genre-family", mediaType: "movie", params: { with_genres: 10751 } },
  { title: "Reality", slug: "genre-reality", mediaType: "tv", params: { with_genres: 10764 } },
  { title: "Comedy", slug: "genre-comedy", mediaType: "movie", params: { with_genres: 35 } },
];

const animeCategories: CategoryConfig[] = [
  { title: "Action Anime", slug: "anime-action", mediaType: "tv", params: { with_genres: 16, with_origin_country: "JP", sort_by: "popularity.desc" } },
  { title: "Fantasy Anime", slug: "anime-fantasy", mediaType: "tv", params: { with_genres: "16,10765", with_origin_country: "JP" } },
  { title: "Adventure Anime", slug: "anime-adventure", mediaType: "tv", params: { with_genres: "16,10759", with_origin_country: "JP" } },
  { title: "Kids Anime", slug: "anime-kids", mediaType: "tv", params: { with_genres: "16,10762" } },
  { title: "Anime Movies", slug: "anime-movies", mediaType: "movie", params: { with_genres: 16, with_origin_country: "JP" } },
];

const allCategories = [...browseCategories, ...studioCategories, ...languageCategories, ...genreCategories, ...animeCategories];

type CategoriesPayload = {
  browse: CategoryTile[];
  studios: CategoryTile[];
  popularLanguages: CategoryTile[];
  popularGenres: CategoryTile[];
  popularAnimes: CategoryTile[];
};

const categoriesCacheTtlMs = 10 * 60 * 1000;
let categoriesCache: { language: string; expiresAt: number; data: CategoriesPayload } | null = null;

const imageFromItems = (items: TmdbListItem[]) => {
  const item = items.find((result) => result.backdrop_path || result.poster_path) || fallbackItems[0];
  return imageUrl(item.backdrop_path || item.poster_path || fallbackItems[0].backdrop_path, "w780");
};

const buildCategoryImagePool = async (language: string) => {
  const [movies, tvShows, animes, animationMovies] = await Promise.all([
    discover("movie", language, { sort_by: "popularity.desc", watch_region: "IN", page: 1 }),
    discover("tv", language, { sort_by: "popularity.desc", watch_region: "IN", page: 1 }),
    discover("tv", language, { with_genres: 16, with_origin_country: "JP", sort_by: "popularity.desc", page: 1 }),
    discover("movie", language, { with_genres: 16, sort_by: "popularity.desc", page: 1 }),
  ]);

  const pool = [...movies.results, ...tvShows.results, ...animes.results, ...animationMovies.results].filter(
    (item) => item.backdrop_path || item.poster_path,
  );

  return pool.length > 0 ? pool : fallbackItems;
};

const imageFromPool = (pool: TmdbListItem[], index: number) => {
  const item = pool[index % pool.length] || fallbackItems[0];
  return imageFromItems([item]);
};

const sectionFromPool = (categories: CategoryConfig[], pool: TmdbListItem[], startIndex: number): CategoryTile[] => {
  return categories.map((category, index) => ({
    title: category.title,
    slug: category.slug,
    subtitle: category.subtitle,
    route: `/categories/${category.slug}`,
    imageUrl: imageFromPool(pool, startIndex + index),
  }));
};

const buildCategoriesPayload = (pool: TmdbListItem[]): CategoriesPayload => ({
  browse: sectionFromPool(browseCategories, pool, 0),
  studios: sectionFromPool(studioCategories, pool, 5),
  popularLanguages: sectionFromPool(languageCategories, pool, 10),
  popularGenres: sectionFromPool(genreCategories, pool, 16),
  popularAnimes: sectionFromPool(animeCategories, pool, 21),
});

const buildCategoriesPayloadFromTmdb = async (language: string) => {
  const pool = await buildCategoryImagePool(language);
  return buildCategoriesPayload(pool);
};

const categoriesFastTimeoutMs = 900;
const categoriesFallbackCacheTtlMs = 30 * 1000;

const loadCategoriesWithTimeout = async (language: string) => {
  const request = buildCategoriesPayloadFromTmdb(language)
    .then((data) => {
      categoriesCache = { language, expiresAt: Date.now() + categoriesCacheTtlMs, data };
      return data;
    })
    .catch(() => null);

  return Promise.race<CategoriesPayload | null>([
    request,
    sleep(categoriesFastTimeoutMs).then(() => null),
  ]);
};

export const getTmdbCategories = async (req: Request, res: Response) => {
  try {
    const language = String(req.query.language || "en-US");
    const now = Date.now();

    if (categoriesCache && categoriesCache.language === language && categoriesCache.expiresAt > now) {
      res.json(categoriesCache.data);
      return;
    }

    const freshData = await loadCategoriesWithTimeout(language);

    if (freshData) {
      res.json(freshData);
      return;
    }

    const fallbackData = buildCategoriesPayload(fallbackItems);
    categoriesCache = { language, expiresAt: now + categoriesFallbackCacheTtlMs, data: fallbackData };
    res.json(fallbackData);
  } catch (error) {
    const fallbackData = buildCategoriesPayload(fallbackItems);
    res.json(fallbackData);
  }
};
export const getTmdbCategory = async (req: Request, res: Response) => {
  try {
    const language = String(req.query.language || "en-US");
    const page = Number(req.query.page || 1);
    const slug = String(req.params.slug || "").toLowerCase();
    const category = allCategories.find((item) => item.slug === slug);

    if (!category) {
      res.status(404).json({ message: "Unknown category" });
      return;
    }

    const data = await discover(category.mediaType, language, { ...category.params, page });

    res.json({
      title: category.title,
      slug: category.slug,
      page: data.page,
      totalPages: data.total_pages,
      items: data.results
        .filter((item) => item.poster_path || item.backdrop_path)
        .map((item) => mapCard(item, category.mediaType)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch category";
    res.status(500).json({ message });
  }
};

export const getTmdbSearch = async (req: Request, res: Response) => {
  try {
    const language = String(req.query.language || "en-US");
    const query = String(req.query.query || "").trim();
    const option = String(req.query.option || "all").toLowerCase();

    if (query) {
      const data = await tmdbRequest<TmdbListResponse>("/search/multi", {
        include_adult: false,
        language,
        page: 1,
        query,
      });

      const items = prioritizeIndianItems(data.results.filter((item) => item.poster_path || item.backdrop_path))
        .map((item) => mapCard(item, item.name ? "tv" : "movie"));

      res.json({ title: `Search results for ${query}`, items });
      return;
    }

    const [indiaMovies, movies, tvShows, animes] = await Promise.all([
      discover("movie", language, { with_origin_country: "IN", region: "IN", page: randomTmdbPage() }),
      discover("movie", language, { page: Math.floor(Math.random() * 4) + 1 }),
      discover("tv", language, { page: Math.floor(Math.random() * 4) + 1 }),
      discover("tv", language, { with_genres: 16, with_origin_country: "JP", page: Math.floor(Math.random() * 4) + 1 }),
    ]);

    const rows = [
      rowFrom("Trending in India", "movie", indiaMovies),
      rowFrom("Random Movies", "movie", movies),
      rowFrom("Random TV Shows", "tv", tvShows),
      rowFrom("Random Animes", "tv", animes),
    ];

    const filteredRows = option === "movies"
      ? [rows[0], rows[1]]
      : option === "tv shows"
        ? [rows[2]]
        : option === "animes"
          ? [rows[3]]
          : rows;

    res.json({ title: "Search", rows: filteredRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch search content";
    res.status(500).json({ message });
  }
};
type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
};

type TmdbVideosResponse = {
  results: TmdbVideo[];
};

const videoLanguageMap: Record<string, string[]> = {
  bn: ["bn-IN"],
  gu: ["gu-IN"],
  hi: ["hi-IN"],
  ja: ["ja-JP"],
  kn: ["kn-IN"],
  ko: ["ko-KR"],
  ml: ["ml-IN"],
  mr: ["mr-IN"],
  pa: ["pa-IN"],
  ta: ["ta-IN"],
  te: ["te-IN"],
};

const uniqueValues = (values: string[]) => [...new Set(values.filter(Boolean))];

const videoLanguageCandidates = (requestedLanguage: string, originalLanguage?: string) => {
  const requestedBase = requestedLanguage.split("-")[0];
  const originalBase = originalLanguage || requestedBase;
  const requestedFallbacks = requestedBase !== originalBase && requestedBase
    ? videoLanguageMap[requestedBase] || []
    : [];

  return uniqueValues([
    requestedLanguage,
    ...((originalBase && videoLanguageMap[originalBase]) || []),
    ...requestedFallbacks,
    "en-US",
  ]);
};

const trailerScore = (video: TmdbVideo) => {
  if (video.site.toLowerCase() !== "youtube") {
    return -1;
  }

  const type = video.type.toLowerCase();
  const name = video.name.toLowerCase();
  let score = 1;

  if (type === "trailer") score += 80;
  if (type === "teaser") score += 42;
  if (video.official) score += 30;
  if (name.includes("official trailer")) score += 18;
  if (name.includes("trailer")) score += 12;
  if (name.includes("teaser")) score += 6;
  if (name.includes("song") || name.includes("lyrical")) score -= 18;
  if (name.includes("promo")) score -= 8;

  return score;
};

const pickTrailer = (videos: TmdbVideo[]) => {
  return videos
    .map((video) => ({ video, score: trailerScore(video) }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)[0]?.video;
};

const getVideosForTitle = async (
  mediaType: MediaType,
  id: number,
  language: string,
  originalLanguage?: string,
) => {
  const languageResults = await Promise.all(
    videoLanguageCandidates(language, originalLanguage).map((videoLanguage) => (
      tmdbRequest<TmdbVideosResponse>(`/${mediaType}/${id}/videos`, { language: videoLanguage }).catch(() => ({ results: [] }))
    )),
  );
  const unfilteredResult = await tmdbRequest<TmdbVideosResponse>(`/${mediaType}/${id}/videos`).catch(() => ({ results: [] }));
  const seen = new Set<string>();

  return [...languageResults, unfilteredResult].flatMap((response) => response.results).filter((video) => {
    if (seen.has(video.key)) {
      return false;
    }

    seen.add(video.key);
    return true;
  });
};

export const getTmdbDetails = async (req: Request, res: Response) => {
  try {
    const mediaType = String(req.params.mediaType || "movie") as MediaType;
    const id = Number(req.params.id);
    const language = String(req.query.language || "en-US");

    if (!id || !["movie", "tv"].includes(mediaType)) {
      res.status(400).json({ message: "Invalid media details request" });
      return;
    }

    const [details, recommendations, similar] = await Promise.all([
      detailsFor(mediaType, id, language),
      tmdbRequest<TmdbListResponse>(`/${mediaType}/${id}/recommendations`, { language, page: 1 }),
      tmdbRequest<TmdbListResponse>(`/${mediaType}/${id}/similar`, { language, page: 1 }),
    ]);
    const videos = await getVideosForTitle(mediaType, id, language, details.original_language);

    const trailer = pickTrailer(videos);

    const uniqueRelated = new Map<number, TmdbListItem>();

    for (const item of [...recommendations.results, ...similar.results]) {
      if (item.id !== id && (item.poster_path || item.backdrop_path)) {
        uniqueRelated.set(item.id, item);
      }
    }

    if (uniqueRelated.size < 8 && details.genres && details.genres.length > 0) {
      const genreFallback = await discover(mediaType, language, {
        with_genres: details.genres.slice(0, 2).map((genre) => genre.id).join("|"),
        sort_by: "popularity.desc",
      });

      for (const item of genreFallback.results) {
        if (item.id !== id && (item.poster_path || item.backdrop_path)) {
          uniqueRelated.set(item.id, item);
        }
      }
    }

    const relatedItems = [...uniqueRelated.values()].slice(0, 8);

    res.json({
      id: details.id,
      mediaType,
      title: titleFor(details),
      overview: details.overview || "",
      backdropUrl: imageUrl(details.backdrop_path, "original"),
      posterUrl: imageUrl(details.poster_path, "w500"),
      year: yearFor(details),
      rating: `TMDB ${ratingFor(details)}`,
      runtime: formatRuntime(details),
      languages: languageCount(details),
      genres: details.genres?.map((genre) => genre.name).slice(0, 4) || [],
      trailerKey: trailer?.key || "",
      moreLikeThis: relatedItems.map((item) => mapCard(item, mediaType)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch media details";
    res.status(500).json({ message });
  }
};
const pageCache = new Map<string, Awaited<ReturnType<typeof buildPage>>>();

const pageCacheKey = (page: PageKind, language: string) => `${page}:${language}`;

export const getTmdbPage = async (req: Request, res: Response) => {
  const page = String(req.params.page || "home").toLowerCase() as PageKind;

  try {
    const language = String(req.query.language || "en-US");
    const allowedPages: PageKind[] = ["home", "movies", "tv", "animes"];

    if (!allowedPages.includes(page)) {
      res.status(404).json({ message: "Unknown TMDB page" });
      return;
    }

    const pageData = await buildPage(page, language);
    pageCache.set(pageCacheKey(page, language), pageData);
    res.json(pageData);
  } catch (_error) {
    const language = String(req.query.language || "en-US");
    const cachedPage = pageCache.get(pageCacheKey(page, language));

    if (cachedPage) {
      res.json(cachedPage);
      return;
    }

    res.status(503).json({ message: "Connecting to TMDB content..." });
  }
};

export const getTmdbHome = async (req: Request, res: Response) => {
  req.params.page = "home";
  return getTmdbPage(req, res);
};
export const getTmdbMovies = async (req: Request, res: Response) => {
  try {
    const language = String(req.query.language || "en-US");
    const page = Number(req.query.page || 1);
    const data = await discover("movie", language, { page });

    res.json({
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      items: data.results.map((item) => mapCard(item, "movie")),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch movies";
    res.status(500).json({ message });
  }
};



















