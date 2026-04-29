import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, Button, Badge,
  Tab, Tabs, ListGroup, Alert, Modal,
  Form, Spinner, ProgressBar, ButtonGroup
} from 'react-bootstrap';
import { format, parseISO, isValid, addDays, isToday, isTomorrow } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { reviewAPI } from '../services/api';

// Redux


// API
import { movieAPI, theaterAPI } from '../services/api';
import { fetchMovieById, fetchMovieShows } from '../features/movieSlice';

// CSS
import './MovieDetails.css';


const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
 
   const {
    currentMovie,
    loading,
    error,
    shows = []
  } = useSelector(state => state.movies);

  // ✅ AUTH STATE
  const { isAuthenticated } = useSelector(state => state.auth);

  // State variables

  const [theaters, setTheaters] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTheater, setSelectedTheater] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [filteredShows, setFilteredShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('shows');
  const [userRating, setUserRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
 const [reviews, setReviews] = useState([]);
const [reviewText, setReviewText] = useState("");
const [reviewRating, setReviewRating] = useState(0);
const [showReviewModal, setShowReviewModal] = useState(false);
const [avgRating, setAvgRating] = useState(0);

  // Font classes for consistent typography
  const fontClasses = {
    heading: 'font-family-sans-serif',
    body: 'font-family-base',
  };

  // Available dates for filtering (next 7 days)
  // ---- TIMEZONE SAFE FUNCTIONS ----
  const toIST = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  const formatIST = (dateString, pattern = "h:mm a") => {
    return format(toIST(dateString), pattern);
  };


// ===== TODAY (IST – start of day) =====
const todayIST = (() => {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  d.setHours(0, 0, 0, 0);
  return d;
})();

// ===== AVAILABLE DATES (NO PAST DATES) =====
const availableDates = shows
  .map(show => {
    if (!show.startTime) return null;

    const showDate = new Date(
      new Date(show.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );
    showDate.setHours(0, 0, 0, 0);

    // ❌ REMOVE PAST DATES
    if (showDate < todayIST) return null;

    let badge = "";
    if (isToday(showDate)) badge = "TODAY";
    else if (isTomorrow(showDate)) badge = "TOMORROW";

    return {
      date: format(showDate, "yyyy-MM-dd"),
      badge,
      dayShort: format(showDate, "EEE"),
      dayNumber: format(showDate, "dd"),
      month: format(showDate, "MMM"),
      isToday: isToday(showDate),
      isTomorrow: isTomorrow(showDate)
    };
  })
  .filter(Boolean)
  // remove duplicate dates
  .filter(
    (d, i, self) => i === self.findIndex(x => x.date === d.date)
  );

useEffect(() => {
  fetchReviews();
}, [id]);

const fetchReviews = async () => {
  const res = await reviewAPI.getReviews(id);
  setReviews(res.data.reviews);
  setAvgRating(res.data.avgRating);
};

useEffect(() => {
  if (availableDates.length > 0) {
    setSelectedDate(availableDates[0].date);
  }
}, [shows]);


  // Fetch movie details
  useEffect(() => {
    dispatch(fetchMovieById(id));
    fetchTheaters();
    fetchSimilarMovies();
  }, [id, dispatch]);

  // Fetch shows when date changes
useEffect(() => {
  if (id) {
    dispatch(fetchMovieShows({ movieId: id }));
  }
}, [id, dispatch]);


  // Filter shows when theater changes
useEffect(() => {
  filterShows();
}, [selectedTheater, selectedDate, shows]);


  const fetchTheaters = async () => {
    try {
      const response = await theaterAPI.getAllTheaters();
      setTheaters(response.theaters || response.data || []);
    } catch (error) {
  console.error('Error fetching theaters:', error);
  setTheaters([]);   // ✅ no fake theaters
}

  };

  const fetchSimilarMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies({ limit: 6 });
      if (response.movies) {
        setSimilarMovies(response.movies.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    }
  };





  // Mock function for demonstration
const filterShows = () => {
  if (!shows || shows.length === 0) {
    setFilteredShows([]);
    return;
  }

  let filtered = shows.filter(show => {
    if (!show.startTime) return false;

    const showDate = new Date(
      new Date(show.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );

    return format(showDate, 'yyyy-MM-dd') === selectedDate;
  });

  if (selectedTheater) {
    filtered = filtered.filter(
      show => show.theater?._id === selectedTheater
    );
  }

  const grouped = {};
  filtered.forEach(show => {
    const tId = show.theater?._id;
    if (!tId) return;

    if (!grouped[tId]) {
      grouped[tId] = { theater: show.theater, shows: [] };
    }
    grouped[tId].shows.push(show);
  });

  setFilteredShows(Object.values(grouped));
};


  const handleBookNow = (show) => {
    if (!isAuthenticated) {
      navigate('/login');
      toast.info('Please login to book tickets');
      return;
    }

    setSelectedShow(show);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    toast.success(`Redirecting to seat selection...`, {
      position: "top-center",
      autoClose: 1500,
      theme: "dark"
    });

    // Navigate to booking page
    setTimeout(() => {
      navigate(`/booking/${selectedShow?._id}`);
    }, 1500);
  };

  const handleQuickBook = (time, theaterId) => {
    if (!isAuthenticated) {
      navigate('/login');
      toast.info('Please login to book tickets');
      return;
    }

    const quickShow = shows.find(s =>
      s.theater?._id === theaterId &&
      formatTime(s.startTime) === time
    );

    if (quickShow) {
      handleBookNow(quickShow);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return formatIST(timeString, "h:mm a");
  };


  const getRatingColor = (rating) => {
    if (rating >= 8) return '#20c997';
    if (rating >= 6.5) return '#ffc107';
    return '#dc3545';
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    toast.success(!isFavorite ? 'Added to favorites!' : 'Removed from favorites!');
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading movie details...</p>
      </div>
    );
  }

  if (error || !currentMovie) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert variant="light" className="empty-state-card text-center border-0">
            <div className="empty-state-icon mb-4">
              <i className="fas fa-film"></i>
            </div>
            <h3 className={`${fontClasses.heading} mb-3`}>
              {error ? 'Error Loading Movie' : 'Movie Not Found'}
            </h3>
            <p className="text-muted mb-4">{error || 'The requested movie could not be found.'}</p>
            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="danger"
                onClick={() => dispatch(fetchMovieById(id))}
                className="book-btn-modern"
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
              <Link to="/movies">
                <Button variant="outline-danger" className="rounded-pill px-4">
                  Browse Movies
                </Button>
              </Link>
            </div>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  return (
    <div className={fontClasses.body}>
      {/* Movie Header Hero */}
      <section
        className="movie-hero-section position-relative overflow-hidden mb-5"
        style={{
          background: `linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(0, 0, 0, 0.85) 40%,
            rgba(0, 0, 0, 0.5) 70%,
            rgba(0, 0, 0, 0.9) 100%
          ),
          url(${currentMovie.backdropUrl || currentMovie.posterUrl || '/a.avif'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '50vh',
          padding: '4rem 0',
          boxShadow: 'inset 0 -120px 200px rgba(0,0,0,0.95)'
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col lg={4} md={5}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="position-relative"
              >
                <Card className="movie-poster-card border-0 shadow-lg">
                  <Card.Img
                    variant="top"
                    src={
  currentMovie.posterUrl
    ? `https://api-backend-60wz.onrender.com${currentMovie.posterUrl}`
    : 'https://via.placeholder.com/300x450?text=No+Poster'
}
                    alt={currentMovie.title}
                    className="rounded-4"
                  />
                  <div className="position-absolute top-0 start-0 m-3">
                    <div className="movie-rating-badge"
                    style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}>
                      <i className="fas fa-star me-1"></i>
                      <span className="fw-bold">{currentMovie.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>

            <Col lg={8} md={7}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white"
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h1 className={`display-4 fw-bold mb-3 ${fontClasses.heading}`}>
                      {currentMovie.title}
                    </h1>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="movie-meta-badge">
                        <i className="fas fa-clock me-1"></i>
                        {formatDuration(currentMovie.duration)}
                      </div>
                      <div className="movie-meta-badge">
                        <i className="fas fa-language me-1"></i>
                        {currentMovie.language || 'English'}
                      </div>
                      <div className="movie-meta-badge">
                        <i className="fas fa-calendar-alt me-1"></i>
                        {currentMovie.releaseDate
                          ? format(parseISO(currentMovie.releaseDate), 'yyyy')
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-light"
                      size="lg"
                      className="rounded-circle px-3"
                      onClick={handleFavoriteToggle}
                    >
                      <i className={`fas fa-heart ${isFavorite ? 'text-danger' : ''}`}></i>
                    </Button>
                    {currentMovie.trailerUrl && (
                      <Button
                        variant="danger"
                        size="lg"
                        className="rounded-pill px-4"
                        as="a"
                        href={currentMovie.trailerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                      >
                        <i className="fas fa-play-circle me-2"></i>
                        Trailer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  {currentMovie.genre?.map((genre, index) => (
                    <Badge
                      key={index}
                      className="genre-badge-modern me-2 mb-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>

                <p className="lead opacity-90 mb-4" style={{ fontSize: '1.5rem', maxWidth: '800px' }}>
                  {currentMovie.description}
                </p>

                <div className="d-flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="danger"
                      style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                      size="lg"
                      className="book-btn-modern px-5"
                      onClick={() => {
                        document.getElementById('show-times-section')?.scrollIntoView({
                          behavior: 'smooth'
                        });
                      }}
                    >
                      <i className="fas fa-ticket-alt me-2"
                      ></i>
                      Book Tickets
                    </Button>
                  </motion.div>

                  <Button
                    variant="outline-light"
                    size="lg"
                    className="rounded-pill px-4"
                    onClick={() => navigate(-1)}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back
                  </Button>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container id="show-times-section">
        {/* Quick Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5"
        >
          <Card className="quick-actions-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={3} className="text-center mb-md-0 mb-3">
                  <div className="movie-stats-box p-3 rounded-4">
                    <div className="display-6 fw-bold mb-1" style={{ color: getRatingColor(currentMovie.rating) }}>
                      {currentMovie.rating?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-muted">Audience Score</div>
                    <div className="rating-stars mt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                        <i
                          key={star}
                          className={`fas fa-star ${star <= Math.round(currentMovie.rating || 0) ? 'text-warning' : 'text-muted'}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                </Col>

                <Col md={6} className="text-center">
                  <h3 className={`${fontClasses.heading} mb-3`}>
                    <i className="fas fa-calendar-alt me-2"></i>
                    Available Showtimes
                  </h3>
                  <p className="text-muted mb-0">
                    Select date and theater to see available shows
                  </p>
                </Col>

                <Col md={3} className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="dark"
                      size="lg"
                      className="w-100 py-3 rounded-4"
                      onClick={() => window.open(currentMovie.trailerUrl, '_blank')}
                    >
                      <i className="fas fa-play-circle me-2"></i>
                      Watch Trailer
                    </Button>
                  </motion.div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="movie-details-tabs mb-4"
            variant="pills"
          >
            <Tab
              eventKey="shows"
              title={
                <span>
                  <i className="fas fa-clock me-2"></i>
                  Show Times
                </span>
              }
            >
              <Card className="border-0 shadow-lg my-4">
                <Card.Body className="p-4">
                  {/* Date Selection */}
                  <div className="mb-5">
                    <h4 className={`${fontClasses.heading} mb-4 d-flex align-items-center`}>
                      <i className="fas fa-calendar-day me-2 text-primary"></i>
                      Select Date
                    </h4>

                    <div className="date-selector-scroll">
                      <Row className="g-3 flex-nowrap">
                        {availableDates.map((dateItem) => (
                          <Col key={dateItem.date} xs="auto">
                            <motion.div
                              whileHover={{ y: -6 }}
                              whileTap={{ scale: 0.94 }}
                            >
                              <Card
                                className={`date-card-modern ${selectedDate === dateItem.date ? "active" : ""
                                  }`}
                                onClick={() => setSelectedDate(dateItem.date)}
                              >
                                <Card.Body className="text-center p-3 position-relative">

                                  {/* BADGE */}
                                  {dateItem.badge && (
                                    <div
                                      className={`date-badge ${dateItem.badge === "TODAY"
                                        ? "badge-today"
                                        : "badge-tomorrow"
                                        }`}
                                    >
                                      {dateItem.badge}
                                    </div>
                                  )}

                                  {/* DAY */}
                                  <div
                                    className={`date-day ${dateItem.isToday ? "text-danger" : "text-muted"
                                      }`}
                                  >
                                    {dateItem.dayShort.toUpperCase()}
                                  </div>

                                  {/* DATE NUMBER */}
                                  <div className="date-number fw-bold">
                                    {dateItem.dayNumber}
                                  </div>

                                  {/* MONTH */}
                                  <div className="date-month">
                                    {dateItem.month}
                                  </div>

                                </Card.Body>
                              </Card>
                            </motion.div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>


                  {/* Theater Filter */}
                  <div className="mb-5">
                    <h4 className={`${fontClasses.heading} mb-4`}>
                      <i className="fas fa-filter me-2 text-danger"></i>
                      Filter Theaters
                    </h4>
                    <Form.Select
                      value={selectedTheater}
                      onChange={(e) => setSelectedTheater(e.target.value)}
                      className="form-select-modern"
                    >
                      <option value="">All Theaters ({theaters.length})</option>
                      {theaters.map(theater => (
                        <option key={theater._id} value={theater._id}>
                          {theater.name} • {theater.location?.address}
                        </option>
                      ))}
                    </Form.Select>

                    {/* Theater Badges */}
                    <div className="mt-3">
                      {theaters.slice(0, 5).map(theater => (
                        <Badge
                          key={theater._id}
                          className="theater-badge me-2 mb-2"
                          bg={selectedTheater === theater._id ? 'danger' : 'light'}
                          text={selectedTheater === theater._id ? 'white' : 'dark'}
                          onClick={() => setSelectedTheater(
                            selectedTheater === theater._id ? '' : theater._id
                          )}
                          style={{ cursor: 'pointer' }}
                        >
                          {theater.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Shows List */}
                  {showsLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-modern mx-auto"></div>
                      <p className="mt-3 text-muted">Loading available shows...</p>
                    </div>
                  ) : filteredShows.length === 0 ? (
                    <Alert variant="light" className="empty-state-card text-center border-0">
                      <div className="empty-state-icon mb-4">
                        <i className="fas fa-film"></i>
                      </div>
                      <h4 className={`${fontClasses.heading} mb-3`}>No Shows Available</h4>
                      <p className="text-muted mb-4">
                        {selectedTheater
                          ? `No shows available for selected theater on ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}`
                          : `No shows available on ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}`
                        }
                      </p>
<Button
  variant="outline-danger"
  onClick={() => {
    if (availableDates.length > 0) {
      setSelectedDate(availableDates[0].date);
      setSelectedTheater('');
    }
  }}
  className="rounded-pill px-4"
>
  View Tomorrow's Shows
</Button>

                    </Alert>
                  ) : (
                    <div className="shows-list-modern">
                      {filteredShows.map((theaterGroup, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="theater-show-group mb-5"
                        >
                          <Card className="border-0 shadow-sm theater-card-modern">
                            <Card.Body className="p-4">
                              {/* Theater Header */}
                              <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                  <div className="d-flex align-items-center gap-3 mb-2">
                                    <h3 className={`${fontClasses.heading} mb-0`}>
                                      <i className="fas fa-building me-2 text-danger"></i>
                                      {theaterGroup.theater?.name}
                                    </h3>
                                    <Badge bg={theaterGroup.theater?.type === 'luxury' ? 'warning' : 'info'}>
                                      {theaterGroup.theater?.type?.toUpperCase() || 'STANDARD'}
                                    </Badge>
                                  </div>
                                  <p className="text-muted mb-0">
                                    <i className="fas fa-map-marker-alt me-2"></i>
                                    {theaterGroup.theater?.location?.address}
                                  </p>
                                </div>
                                <Badge bg="light" text="dark" className="px-3 py-2">
                                  {theaterGroup.shows.length} shows
                                </Badge>
                              </div>

                              {/* Theater Features */}
                              {theaterGroup.theater?.amenities && (
                                <div className="mb-4">
                                  <div className="d-flex flex-wrap gap-2">
                                    {theaterGroup.theater.amenities.slice(0, 5).map((amenity, i) => (
                                      <Badge key={i} className="amenity-badge">
                                        <i className="fas fa-check-circle me-1"></i>
                                        {amenity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Show Times Grid */}
                              <Row className="g-3">
                                {theaterGroup.shows?.map((show, showIndex) => (
                                  <Col key={showIndex} xl={3} lg={4} md={6}>
                                    <motion.div
                                      whileHover={{ y: -8 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      <Card className="show-time-card-modern h-100">
                                        <Card.Body className="p-3">
                                          {/* Show Header */}
                                          <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                              <Badge bg="dark" className="mb-2">
                                                <i className="fas fa-film me-1"></i>
                                                Screen {show.screen}
                                              </Badge>
                                              <div className="show-type-badge mb-2">
                                                {show.showType}
                                              </div>
                                            </div>
                                            <Badge bg="success" className="px-2">
                                              {show.availableSeats > 10 ? 'Available' : 'Few Left'}
                                            </Badge>
                                          </div>

                                          {/* Show Time */}
                                          <div className="text-center mb-3">
                                            <div className="show-time-display">
                                              {formatTime(show.startTime)}
                                            </div>
                                          </div>

                                          {/* Seat Availability */}
                                          <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-2">
                                              <small className="text-muted">
                                                <i className="fas fa-chair me-1"></i>
                                                {show.availableSeats} seats left
                                              </small>

                                              <small className="fw-bold">
                                                {show.totalSeats - show.availableSeats}/{show.totalSeats}
                                              </small>
                                            </div>

                                            <ProgressBar
                                              now={Math.round(
                                                ((show.totalSeats - show.availableSeats) / show.totalSeats) * 100
                                              )}
                                              variant={
                                                (show.totalSeats - show.availableSeats) / show.totalSeats > 0.8
                                                  ? "danger"
                                                  : (show.totalSeats - show.availableSeats) / show.totalSeats > 0.5
                                                    ? "warning"
                                                    : "success"
                                              }
                                              style={{ height: "6px", borderRadius: "6px" }}
                                            />
                                          </div>


                                          {/* Price */}
                                          <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                              <small className="text-muted">From</small>
                                              <div className="text-end">
                                                <div className="show-price text-danger fw-bold">
                                                  ₹{show.price?.regular}
                                                </div>
                                                <small className="text-muted">
                                                  <s>₹{Math.round(show.price?.regular * 1.2)}</s> • Save 20%
                                                </small>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Action Button */}
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              style={{background: 'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                                              className="w-100 book-show-btn"
                                              onClick={() => handleBookNow(show)}
                                              disabled={show.availableSeats === 0}
                                            >
                                              {show.availableSeats === 0 ? (
                                                <>
                                                  <i className="fas fa-times-circle me-2"></i>
                                                  Sold Out
                                                </>
                                              ) : (
                                                <>
                                                  <i className="fas fa-ticket-alt me-2"></i>
                                                  Book Now
                                                </>
                                              )}
                                            </Button>
                                          </motion.div>
                                        </Card.Body>
                                      </Card>
                                    </motion.div>
                                  </Col>
                                ))}
                              </Row>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab
              eventKey="details"
              title={
                <span>
                  <i className="fas fa-info-circle me-2"></i>
                  Details
                </span>
              }
            >
              <Card className="border-0 shadow-lg mt-4">
                <Card.Body className="p-4">
                  <Row>
                    <Col lg={8}>
                      <h3 className={`${fontClasses.heading} mb-4`}>Movie Details</h3>

                      {/* Synopsis */}
                      <div className="mb-5">
                        <h4 className="mb-3">
                          <i className="fas fa-book-open me-2 text-danger"></i>
                          Synopsis
                        </h4>
                        <p className="lead">{currentMovie.description}</p>
                      </div>

                      {/* Cast & Crew */}
                      {currentMovie.cast && currentMovie.cast.length > 0 && (
                        <div className="mb-5">
                          <h4 className="mb-4">
                            <i className="fas fa-users me-2 text-danger"></i>
                            Cast & Crew
                          </h4>
                          <Row className="g-3">
                            {currentMovie.cast.map((actor, index) => (
                              <Col key={index} md={6}>
                                <Card className="cast-card border-0 bg-light">
                                  <Card.Body className="p-3">
                                    <div className="d-flex align-items-center">
                                      <div className="cast-avatar me-3">
                                        <i className="fas fa-user-circle fa-2x text-muted"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-1 fw-bold">{actor.name}</h6>
                                        <p className="text-muted small mb-0">
                                          as <strong className="text-dark">{actor.character}</strong>
                                        </p>
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="row g-4">
                        <Col md={6}>
                          <Card className="info-card-modern border-0">
                            <Card.Body className="p-4">
                              <h5 className="mb-4">
                                <i className="fas fa-cogs me-2 text-danger"></i>
                                Technical Details
                              </h5>
                              <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span>Duration</span>
                                  <strong>{formatDuration(currentMovie.duration)}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span>Language</span>
                                  <strong>{currentMovie.language || 'English'}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span>Release Date</span>
                                  <strong>
                                    {currentMovie.releaseDate
                                      ? format(parseISO(currentMovie.releaseDate), 'MMMM dd, yyyy')
                                      : 'N/A'}
                                  </strong>
                                </ListGroup.Item>
                                {currentMovie.director && (
                                  <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                    <span>Director</span>
                                    <strong>{currentMovie.director}</strong>
                                  </ListGroup.Item>
                                )}
                              </ListGroup>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="info-card-modern border-0">
                            <Card.Body className="p-4">
                              <h5 className="mb-4">
                                <i className="fas fa-star me-2 text-danger"></i>
                                Ratings & Reviews
                              </h5>
                              <div className="text-center mb-4">
                                <div className="display-3 fw-bold mb-2" style={{ color: getRatingColor(currentMovie.rating) }}>
                                  {currentMovie.rating?.toFixed(1) || 'N/A'}
                                  <small className="text-muted d-block fs-6">/10</small>
                                </div>
                                <div className="rating-stars mb-3">
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                                    <i
                                      key={star}
                                      className={`fas fa-star fa-lg ${star <= Math.round(currentMovie.rating || 0) ? 'text-warning' : 'text-muted'}`}
                                    ></i>
                                  ))}
                                </div>
                                <Button
                                 variant="outline-danger"
                                 className="rounded-pill"
                                 onClick={() => setShowReviewModal(true)}
                                >
                                <i className="fas fa-pen me-2"></i>
                                Write Review

                                </Button>
                               <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Write Review</Modal.Title>
  </Modal.Header>

  <Modal.Body>

    {/* STARS */}
    <div className="text-center mb-3">
      {[1,2,3,4,5].map(star => (
        <i
          key={star}
          className={`fas fa-star fa-2x mx-1 ${
            star <= reviewRating ? "text-warning" : "text-muted"
          }`}
          style={{ cursor: "pointer" }}
          onClick={() => setReviewRating(star)}
        ></i>
      ))}
    </div>

    {/* TEXT */}
    <Form.Control
      as="textarea"
      rows={3}
      placeholder="Write your review..."
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
    />

  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
      Cancel
    </Button>

    <Button
      variant="danger"
      onClick={async () => {
        await reviewAPI.addReview({
          movieId: id,
          rating: reviewRating,
          text: reviewText,
        });

        fetchReviews();

        setReviewText("");
        setReviewRating(0);
        setShowReviewModal(false);
      }}
    >
      Submit
    </Button>
  </Modal.Footer>
</Modal>

<div className="text-center mb-3">
  <h3>{avgRating.toFixed(1)} / 5 ⭐</h3>
</div>

<div className="mt-4">
  {reviews.map((rev, i) => (
    <Card key={i} className="mb-3 shadow-sm">
      <Card.Body>

        {/* USER */}
        <div className="d-flex align-items-center mb-2">
          <img
            src={rev.userImage || "https://i.pravatar.cc/40"}
            alt=""
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              marginRight: 10,
            }}
          />
          <strong>{rev.userName}</strong>
        </div>

        {/* STARS */}
        <div>
          {[1,2,3,4,5].map(star => (
            <i
              key={star}
              className={`fas fa-star ${
                star <= rev.rating ? "text-warning" : "text-muted"
              }`}
            ></i>
          ))}
        </div>

        {/* TEXT */}
        <p>{rev.text}</p>

      </Card.Body>
    </Card>
  ))}
</div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </div>
                    </Col>
                    <Col lg={4}>
                      {/* Similar Movies */}
                      <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-4">
                          <h5 className={`${fontClasses.heading} mb-4`}>
                            <i className="fas fa-film me-2 text-danger"></i>
                            Similar Movies
                          </h5>
                          <div className="similar-movies-list">
                            {similarMovies.map((movie, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Card className="similar-movie-card border-0 mb-3">
                                  <Card.Body className="p-3">
                                    <div className="d-flex">
                                      <div className="similar-movie-poster me-3">
                                        <img
                                          src={movie.posterUrl}
                                          alt={movie.title}
                                          className="rounded-3"
                                          style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                                        />
                                      </div>
                                      <div>
                                        <h6 className="fw-bold mb-1">{movie.title}</h6>
                                        <div className="d-flex align-items-center mb-2">
                                          <Badge bg="warning" text="dark" className="me-2">
                                            ⭐ {movie.rating?.toFixed(1) || 'N/A'}
                                          </Badge>
                                          <small className="text-muted">
                                            {formatDuration(movie.duration)}
                                          </small>
                                        </div>
                                        <Link to={`/movies/${movie._id}`}>
                                          <Button variant="outline-danger" size="sm" className="rounded-pill">
                                            View Details
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>

                      {/* Quick Stats */}
                      <Card className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                          <h5 className={`${fontClasses.heading} mb-4`}>
                            <i className="fas fa-chart-line me-2 text-danger"></i>
                            Quick Stats
                          </h5>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="border-0 py-3">
                              <div className="d-flex justify-content-between">
                                <span>Daily Shows</span>
<Badge bg="primary">
  {shows.filter(s => {
    if (!s.startTime) return false;

    const d = new Date(
      new Date(s.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );

    return format(d, 'yyyy-MM-dd') === selectedDate;
  }).length}
</Badge>

                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="border-0 py-3">
                              <div className="d-flex justify-content-between">
                                <span>Available Theaters</span>
                                <Badge bg="success">{theaters.length}</Badge>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="border-0 py-3">
                              <div className="d-flex justify-content-between">
                                <span>Total Seats Today</span>
                              <Badge bg="info">
  {shows.filter(s => {
    const d = new Date(
      new Date(s.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );
    return format(d, 'yyyy-MM-dd') === selectedDate;
  }).reduce((acc, s) => acc + (s.availableSeats || 0), 0)}
</Badge>

                              </div>
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </motion.div>
      </Container>

      {/* Booking Confirmation Modal */}
      <Modal
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        centered
        className="booking-modal-modern"
        size="lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className={`${fontClasses.heading}`}>
            <i className="fas fa-ticket-alt me-2 text-danger"></i>
            Confirm Your Booking
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-0">
          {selectedShow && (
            <>
              <div className="text-center mb-4">
                <div className="booking-icon mb-3">
                  <i className="fas fa-chair fa-4x text-danger"></i>
                </div>
                <h4 className="fw-bold mb-2">Ready to experience the movie?</h4>
                <p className="text-muted">You're just one step away from securing your seats!</p>
              </div>

              <Card className="booking-summary-card border-0">
                <Card.Body className="p-4">
                  <div className="row">
                    <div className="col-md-3 text-center mb-md-0 mb-3">
                      <img
                        src={currentMovie.posterUrl}
                        alt={currentMovie.title}
                        className="rounded-3 img-fluid"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                    <div className="col-md-9">
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                          <span className="text-muted">Movie</span>
                          <strong className="text-dark">{currentMovie.title}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                          <span className="text-muted">Theater</span>
                          <strong>{selectedShow.theater?.name}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                          <span className="text-muted">Screen & Time</span>
                          <strong>Screen {selectedShow.screen} • {formatTime(selectedShow.startTime)}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                          <span className="text-muted">Date</span>
                          <strong>
  {format(
    new Date(
      new Date(selectedShow.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    ),
    'EEEE, MMMM dd, yyyy'
  )}
</strong>

                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                          <span className="text-muted">Seats Available</span>
                          <Badge bg={selectedShow.availableSeats > 20 ? 'success' : 'warning'} className="px-3 py-2">
                            {selectedShow.availableSeats} seats
                          </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between border-0 py-3 bg-light rounded-3">
                          <span className="text-muted">Ticket Price (Starting)</span>
                          <div className="text-end">
                            <div className="text-danger fw-bold display-6">
                              ₹{selectedShow.price?.regular}
                            </div>
                            <small className="text-success">
                              <i className="fas fa-tag me-1"></i>
                              Best price guaranteed
                            </small>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Alert variant="info" className="border-0 mt-4"
                style={{ background: 'linear-gradient(135deg, #eef4ff 0%, #e3f2fd 100%)' }}>
                <div className="d-flex">
                  <i className="fas fa-info-circle fa-2x me-3 text-primary"></i>
                  <div>
                    <strong>Next Step: Seat Selection</strong>
                    <p className="mb-0 mt-1">You'll be able to choose your preferred seats, select ticket types, and complete payment in the next step.</p>
                  </div>
                </div>
              </Alert>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowBookingModal(false)}
            className="rounded-pill px-4"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmBooking}
            className="book-btn-modern px-5"
          >
            <i className="fas fa-chair me-2"></i>
            Proceed to Seat Selection
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MovieDetails;