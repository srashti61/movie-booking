import Review from "../models/reviewModel.js";

// ADD REVIEW
export const addReview = async (req, res) => {
  try {
    const { movieId, rating, text } = req.body;

    const review = new Review({
      movie: movieId,
      user: req.user?._id,
      userName: req.user?.name || "User",
      userImage: req.user?.profilePic || "",
      rating,
      text,
    });

    await review.save();

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET REVIEWS + AVG
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      movie: req.params.movieId,
    }).sort({ createdAt: -1 });

    const avgRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) /
      (reviews.length || 1);

    res.json({
      reviews,
      avgRating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};