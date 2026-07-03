import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { useEffect } from "react";

import Login from "./Pages/login";
import Signup from "./Pages/signup";

import CatogoriesBox from "./Components/catogories_box/catogories_box";
import Footer from "./Components/Footer/Footer";
import MovieDetails from "./Components/MovieDetails/MovieDetails";
import Sidebar from "./Components/sidebar/sidebar";

import Home from "./Pages/home";
import Intro from "./Pages/intro";
import Search from "./Pages/search";
import TV from "./Pages/tv";
import Movies from "./Pages/movies";
import Animes from "./Pages/Animes";
import Categories from "./Pages/categories";
import MySpace from "./Pages/myspace";
import "./App.css";
import "./Components/Footer/Footer"


function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const authPaths = ["/", "/login", "/signup"];
  const isAuthPage = authPaths.includes(location.pathname.toLowerCase());

  return (
    <>
      <ScrollToTop />
      {!isAuthPage && <Sidebar />}

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={<Intro />}
          />

          <Route
            path="/home"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/search"
            element={<Search />}
          />

          <Route
            path="/tv"
            element={<TV />}
          />

          <Route
            path="/movies"
            element={<Movies />}
          />

          <Route
            path="/Animes"
            element={<Animes />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/categories/:slug"
            element={<CatogoriesBox />}
          />

          <Route
            path="/myspace"
            element={<MySpace />}
          />
        </Routes>

        {!isAuthPage && <Footer />}
      </main>

      {!isAuthPage && <MovieDetails />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
