const express = require("express");
const router = express.Router();

const { addReview, getReviews } = require("../controllers/reviewController");


router.post("/", addReview);

router.get("/:movieId", getReviews);

module.exports = router;