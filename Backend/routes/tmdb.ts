import { Router } from "express";
import {
  getTmdbCategories,
  getTmdbCategory,
  getTmdbDetails,
  getTmdbHome,
  getTmdbMovies,
  getTmdbPage,
  getTmdbSearch,
} from "../controllers/moviecontroller";

const router = Router();

router.get("/home", getTmdbHome);
router.get("/page/:page", getTmdbPage);
router.get("/movies", getTmdbMovies);
router.get("/search", getTmdbSearch);
router.get("/categories", getTmdbCategories);
router.get("/category/:slug", getTmdbCategory);
router.get("/details/:mediaType/:id", getTmdbDetails);

export default router;
