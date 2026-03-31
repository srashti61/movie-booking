const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const movieController = require("../controllers/movieController");
const { auth, admin } = require("../middleware/auth");

// LOG
console.log("📁 movies.js loaded");

// ----------------------------
// MULTER SETUP
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/movies/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ----------------------------
// 🚀 TEST ROUTE (MUST BE FIRST)
// ----------------------------
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "Movies test route working!" });
});

// ----------------------------
// 🚀 IMAGE UPLOAD ROUTE (BEFORE :id)
// ----------------------------
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  res.json({
    success: true,
    url: `/uploads/movies/${req.file.filename}`
  });
});
router.get("/random", movieController.getRandomMovies);
// ----------------------------
// PUBLIC ROUTES (SAFE ORDER)
// ----------------------------
router.get("/", movieController.getAllMovies);

// MUST COME BEFORE ":id"
router.get("/:id/shows", movieController.getMovieShows);

// MUST COME LAST
router.get("/:id", movieController.getMovieById);

// ----------------------------
// ADMIN
// ----------------------------
router.post("/", auth, admin, movieController.createMovie);
router.put("/:id", auth, admin, movieController.updateMovie);
router.delete("/:id", auth, admin, movieController.deleteMovie);

module.exports = router;
