import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Badge, 
  ListGroup, Alert, Tab, Tabs, Form, Spinner,
  Carousel, Modal, Accordion, ProgressBar
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns';
import { toast } from 'react-toastify';

// Redux
import { fetchTheaterById, fetchTheaterShows as fetchShowsAction } from '../features/theaterSlice';
import { fetchMovies } from '../features/movieSlice';

// CSS
import './TheaterDetails.css';

const TheaterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentTheater, shows, loading, error } = useSelector(state => state.theaters);
  const { movies: allMovies } = useSelector(state => state.movies);
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMovie, setSelectedMovie] = useState('');
  const [filteredShows, setFilteredShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('shows');
  const [screenModalShow, setScreenModalShow] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
const formatTimeOnly = (date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  // Available dates for filtering (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'EEE, MMM dd');
    let badge = '';
    
    if (i === 0) badge = 'TODAY';
    else if (i === 1) badge = 'TOMORROW';
    
    return {
      date: dateStr,
      display: displayDate,
      badge,
      day: format(date, 'EEEE'),
      dayShort: format(date, 'EEE'),
      dayNumber: format(date, 'dd'),
      month: format(date, 'MMM'),
      isToday: i === 0,
      isTomorrow: i === 1
    };
  });

  // Fetch theater details
  useEffect(() => {
    dispatch(fetchTheaterById(id));
    dispatch(fetchMovies({ limit: 100 }));
  }, [id, dispatch]);

  // Fetch shows when date changes
  useEffect(() => {
    if (currentTheater) {
      loadTheaterShows();
    }
  }, [currentTheater, selectedDate]);

  // Filter shows when movie changes
  useEffect(() => {
    filterShows();
  }, [shows, selectedMovie]);

  const loadTheaterShows = async () => {
    try {
      setShowsLoading(true);
      await dispatch(fetchShowsAction({
        id,
        params: { date: selectedDate }
      })).unwrap();
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Failed to load shows', {
        position: "top-center"
      });
    } finally {
      setShowsLoading(false);
    }
  };

  const filterShows = () => {
    let filtered = shows || [];
    
    if (selectedMovie) {
      filtered = filtered.filter(show => 
        show.movie && show.movie._id === selectedMovie
      );
    }
    
    // Group shows by movie
    const groupedShows = {};
    filtered.forEach(show => {
      if (!show.movie) return;
      
      const movieId = show.movie._id;
      if (!groupedShows[movieId]) {
        groupedShows[movieId] = {
          movie: show.movie,
          shows: []
        };
      }
      groupedShows[movieId].shows.push(show);
    });
    
    setFilteredShows(Object.values(groupedShows));
  };

  const handleBookNow = (showId) => {
    navigate(`/booking/${showId}`);
  };

  const handleQuickBook = (show) => {
    navigate(`/booking/${show._id}`);
  };

  const handleViewMovie = (movieId) => {
    navigate(`/movies/${movieId}?date=${selectedDate}&theater=${id}`);
  };

  const getTheaterType = (amenities) => {
    if (!amenities) return 'Standard';
    if (amenities.includes('IMAX') || amenities.includes('4DX')) return 'Premium';
    if (amenities.includes('VIP Lounge') || amenities.includes('Gold Class')) return 'Luxury';
    if (amenities.includes('Dolby Atmos') || amenities.includes('Dolby Vision')) return 'Deluxe';
    return 'Standard';
  };

  const getAmenityIcon = (amenity) => {
    const iconMap = {
      'Dolby Atmos': 'fa-volume-up',
      'IMAX': 'fa-expand',
      '4DX': 'fa-film',
      'VIP Lounge': 'fa-crown',
      'Food Court': 'fa-utensils',
      'Parking': 'fa-parking',
      'Wheelchair Access': 'fa-wheelchair',
      'Online Booking': 'fa-mobile-alt',
      'Cafeteria': 'fa-coffee',
      'Gold Class': 'fa-gem',
      'Recliner Seats': 'fa-chair',
      '3D': 'fa-vr-cardboard',
      'Free WiFi': 'fa-wifi',
      'ATM': 'fa-credit-card',
      'Baby Changing': 'fa-baby'
    };
    return iconMap[amenity] || 'fa-check';
  };

  const openScreenModal = (screen) => {
    setSelectedScreen(screen);
    setScreenModalShow(true);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading theater details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5 px-3 px-md-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert variant="light" className="empty-state-card text-center border-0 m-0">
            <div className="empty-state-icon mb-3 mb-md-4">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="font-family-sans-serif mb-2 mb-md-3">Error Loading Theater</h3>
            <p className="text-muted mb-3 mb-md-4 px-2">{error}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-md-3">
              <Button 
                variant="danger" 
                onClick={() => dispatch(fetchTheaterById(id))}
                className="book-btn-modern px-3 px-md-4 py-2"
              >
                <i className="fas fa-redo me-1 me-md-2"></i>
                Try Again
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={() => navigate('/theaters')}
                className="rounded-pill px-3 px-md-4 py-2"
              >
                Browse Theaters
              </Button>
            </div>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  if (!currentTheater) {
    return (
      <Container className="py-5 px-3 px-md-4">
        <Alert variant="warning" className="text-center border-0 shadow-sm m-0">
          <i className="fas fa-building fa-3x mb-3 text-warning"></i>
          <h3 className="font-family-sans-serif mb-2 mb-md-3">Theater Not Found</h3>
          <p className="mb-3 mb-md-4 px-2">The theater you're looking for doesn't exist.</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/theaters')}
            className="rounded-pill px-3 px-md-4 py-2"
          >
            <i className="fas fa-arrow-left me-1 me-md-2"></i>
            Back to Theaters
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="font-family-base theater-details-container">
      {/* Hero Header */}
      <section 
        className="theater-hero-section py-4 py-md-5 mb-4 mb-md-5"
        style={{
          background: `linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(0, 0, 0, 0.85) 40%,
            rgba(0, 0, 0, 0.5) 70%,
            rgba(0, 0, 0, 0.9) 100%
          ),
          url(${currentTheater.bannerUrl || currentTheater.imageUrl || '/theater-bg.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '0 0 24px 24px',
          boxShadow: 'inset 0 -80px 120px rgba(0,0,0,0.95)'
        }}
      >
        <Container className="px-3 px-md-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-3 mb-md-4 gap-3">
              <div className="w-100">
                <Badge bg="warning" className="px-2 px-md-3 py-1 py-md-2 fs-6 mb-2 mb-md-3">
                  {getTheaterType(currentTheater.amenities)} Theater
                </Badge>
                <h1 className="display-5 display-md-4 fw-bold mb-2 mb-md-3 font-family-sans-serif">
                  {currentTheater.name}
                </h1>
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center opacity-90 mb-3 mb-md-4 gap-1 gap-md-4">
                  <div className="d-flex align-items-center mb-1 mb-md-0">
                    <i className="fas fa-map-marker-alt me-1 me-md-2 fs-6"></i>
                    <span className="fs-6 fs-md-base">{currentTheater.location?.address}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-city me-1 me-md-2 fs-6"></i>
                    <span className="fs-6 fs-md-base">{currentTheater.location?.city}, {currentTheater.location?.state}</span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline-light"
                className="rounded-pill px-3 px-md-4 py-2 align-self-start align-self-md-center"
                onClick={() => navigate(-1)}
              >
                <i className="fas fa-arrow-left me-1 me-md-2"></i>
                <span className="d-none d-md-inline">Back</span>
              </Button>
            </div>

            <div className="d-flex flex-wrap gap-2 gap-md-3">
              <Badge bg="info" className="px-2 px-md-3 py-1 py-md-2 fs-6">
                <i className="fas fa-film me-1 me-md-2"></i>
                {currentTheater.screens?.length || 0} Screens
              </Badge>
              <Badge bg="success" className="px-2 px-md-3 py-1 py-md-2 fs-6">
                <i className="fas fa-chair me-1 me-md-2"></i>
                {currentTheater.totalSeats?.toLocaleString() || '2,000'} Seats
              </Badge>
              <Badge bg="danger" className="px-2 px-md-3 py-1 py-md-2 fs-6">
                <i className="fas fa-star me-1 me-md-2"></i>
                {currentTheater.amenities?.length || 0} Amenities
              </Badge>
              {currentTheater.contact?.phone && (
                <Badge bg="primary" className="px-2 px-md-3 py-1 py-md-2 fs-6 d-none d-md-flex">
                  <i className="fas fa-phone me-1 me-md-2"></i>
                  {currentTheater.contact.phone}
                </Badge>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="px-3 px-md-4">
        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="theater-details-tabs mb-3 mb-md-4"
            variant="pills"
          >
            <Tab 
              eventKey="shows" 
              title={
                <span>
                  <i className="fas fa-clock me-1 me-md-2"></i>
                  <span className="d-none d-md-inline">Show Times</span>
                  <span className="d-md-none">Shows</span>
                </span>
              }
            >
              <Card className="border-0 shadow-sm shadow-md-lg mt-3 mt-md-4">
                <Card.Body className="p-3 p-md-4">
                  {/* Date Selection */}
                  <div className="mb-4 mb-md-5">
                    <h4 className="font-family-sans-serif mb-2 mb-md-3 mb-lg-4 fs-5 fs-md-4">
                      <i className="fas fa-calendar-day me-1 me-md-2 text-danger"></i>
                      Select Date
                    </h4>
                    <div className="date-selector-scroll">
                      <div className="d-flex flex-nowrap gap-2 gap-md-3 pb-2" style={{ overflowX: 'auto' }}>
                        {availableDates.map((dateItem) => (
                          <motion.div
                            key={dateItem.date}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ minWidth: '100px' }}
                          >
                            <Card 
                              className={`date-card-modern ${selectedDate === dateItem.date ? 'active' : ''}`}
                              onClick={() => setSelectedDate(dateItem.date)}
                            >
                              <Card.Body className="text-center p-2 p-md-3">
                                <div className={`date-day ${dateItem.isToday ? 'text-danger' : 'text-muted'} fs-6 fs-md-base`}>
                                  {dateItem.dayShort.toUpperCase()}
                                </div>
                                <div className="date-number fw-bold mb-1 fs-4 fs-md-3">
                                  {dateItem.dayNumber}
                                </div>
                                <div className="date-month text-muted fs-6">
                                  {dateItem.month}
                                </div>
                                {dateItem.badge && (
                                  <div className="date-badge">
                                    {dateItem.badge}
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Movie Filter */}
                  <div className="mb-4 mb-md-5">
                    <h4 className="font-family-sans-serif mb-2 mb-md-3 mb-lg-4 fs-5 fs-md-4">
                      <i className="fas fa-filter me-1 me-md-2 text-danger"></i>
                      Filter by Movie
                    </h4>
                    <Form.Select
                      value={selectedMovie}
                      onChange={(e) => setSelectedMovie(e.target.value)}
                      className="form-select-modern py-2 py-md-3"
                    >
                      <option value="">All Movies ({filteredShows.length})</option>
                      {Array.from(new Set(shows?.map(show => show.movie?._id).filter(Boolean))).map(movieId => {
                        const movie = shows.find(s => s.movie?._id === movieId)?.movie;
                        return movie ? (
                          <option key={movie._id} value={movie._id}>
                            {movie.title} • {formatDuration(movie.duration)}
                          </option>
                        ) : null;
                      })}
                    </Form.Select>
                  </div>

                  {/* Shows Content */}
                  {showsLoading ? (
                    <div className="text-center py-4 py-md-5">
                      <div className="spinner-modern mx-auto"></div>
                      <p className="mt-3 text-muted">Loading shows...</p>
                    </div>
                  ) : filteredShows.length === 0 ? (
                    <Alert variant="light" className="empty-state-card text-center border-0 m-0">
                      <div className="empty-state-icon mb-3 mb-md-4">
                        <i className="fas fa-film"></i>
                      </div>
                      <h4 className="font-family-sans-serif mb-2 mb-md-3 fs-5 fs-md-4">No Shows Available</h4>
                      <p className="text-muted mb-3 mb-md-4 px-2">
                        {selectedMovie 
                          ? `No shows available for selected movie on ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}`
                          : `No shows available on ${format(parseISO(selectedDate), 'MMMM dd, yyyy')}`
                        }
                      </p>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => {
                          setSelectedDate(availableDates[0].date);
                          setSelectedMovie('');
                        }}
                        className="rounded-pill px-3 px-md-4 py-2"
                      >
                        View Tomorrow's Shows
                      </Button>
                    </Alert>
                  ) : (
                    <div className="shows-list-modern">
                      {filteredShows.map((movieGroup, index) => (
                        <motion.div
                          key={movieGroup.movie._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="movie-show-group mb-4 mb-md-5"
                        >
                          <Card className="border-0 shadow-sm movie-card-modern">
                            <Card.Body className="p-3 p-md-4">
                              {/* Movie Header */}
                              <div className="d-flex flex-column flex-md-row mb-3 mb-md-4 gap-3">
                                <div className="movie-poster-thumb">
                                  <img
                                    src={movieGroup.movie.posterUrl}
                                    alt={movieGroup.movie.title}
                                    className="rounded-3 rounded-md-4"
                                    style={{ width: '100%', maxWidth: '100px', height: '150px', objectFit: 'cover' }}
                                  />
                                  {movieGroup.movie.isFeatured && (
                                    <div className="featured-badge">
                                      <i className="fas fa-star"></i>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-grow-1">
                                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2 gap-2">
                                    <h3 className="font-family-sans-serif mb-0 fs-4 fs-md-3">
                                      {movieGroup.movie.title}
                                    </h3>
                                    <Badge bg="warning" className="px-2 px-md-3 align-self-start">
                                      ⭐ {movieGroup.movie.rating?.toFixed(1) || 'N/A'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mb-2 mb-md-3">
                                    {movieGroup.movie.genre?.slice(0, 3).map((genre, i) => (
<Badge
  key={i}
  className="genre-badge me-1 me-md-2 mb-1"
  style={{ color: '#3a3737ff' }}
>
  {genre}
</Badge>

                                    ))}
                                    <Badge bg="info" className="me-1 me-md-2 mb-1">
                                      {movieGroup.movie.language || 'English'}
                                    </Badge>
                                    <Badge bg="dark" className="mb-1">
                                      {formatDuration(movieGroup.movie.duration)}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-muted mb-2 mb-md-3 d-none d-md-block">
                                    {movieGroup.movie.description?.substring(0, 150)}...
                                  </p>
                                  <p className="text-muted mb-2 mb-md-3 d-md-none">
                                    {movieGroup.movie.description?.substring(0, 100)}...
                                  </p>
                                  
                                  <div className="d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-center">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="rounded-pill px-3"
                                      onClick={() => handleViewMovie(movieGroup.movie._id)}
                                    >
                                      <i className="fas fa-info-circle me-1"></i>
                                      Movie Details
                                    </Button>
                                    <Badge bg="light" text="dark" className="px-2 px-md-3 py-1 align-self-start">
                                      {movieGroup.shows.length} shows
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Show Times Grid */}
                              <Row className="g-2 g-md-3">
                                {movieGroup.shows.map((show, showIndex) => (
                                  <Col key={showIndex} xs={6} md={4} lg={3}>
                                    <motion.div
                                      whileHover={{ y: -6 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      <Card className="show-time-card-modern h-100">
                                        <Card.Body className="p-2 p-md-3">
                                          {/* Show Header */}
                                          <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                                            <div>
                                              <Badge bg="dark" className="mb-1 fs-7">
                                                <i className="fas fa-film me-1"></i>
                                                Screen {show.screen}
                                              </Badge>
                                              <div className="show-type-badge mb-1 fs-7">
                                                {show.format || '2D'}
                                              </div>
                                            </div>
                                            <Badge bg={show.availableSeats > 20 ? 'success' : 'warning'} className="px-1 px-md-2 fs-7">
                                              {show.availableSeats > 20 ? 'Available' : 'Few Left'}
                                            </Badge>
                                          </div>

                                          {/* Show Time */}
                                          
                                          <div className="text-center mb-2 mb-md-3">
<div className="show-time-display fs-5 fs-md-4">
  {formatTimeOnly(show.startTime)}
</div>

                                
                                          </div>

                                          {/* Seat Availability */}
                                          <div className="mb-2 mb-md-3">
                                            <div className="d-flex justify-content-between mb-1">
                                              <small className="text-muted fs-7">
                                                <i className="fas fa-chair me-1"></i>
                                                {show.availableSeats} seats left
                                              </small>
                                              <small className="fw-bold fs-7">
                                                {show.totalSeats - show.availableSeats}/{show.totalSeats}
                                              </small>
                                            </div>
                                            <ProgressBar 
                                              now={((show.totalSeats - show.availableSeats) / show.totalSeats) * 100} 
                                              variant={show.availableSeats > 20 ? 'success' : 'warning'}
                                              style={{ height: '4px' }}
                                            />
                                          </div>

                                          {/* Price */}
                                          <div className="mb-2 mb-md-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                              <small className="text-muted fs-7">From</small>
                                              <div className="text-end">
                                                <div className="show-price text-danger fw-bold fs-5 fs-md-4">
                                                  ₹{show.price?.regular}
                                                </div>
                                                <small className="text-muted d-none d-md-block fs-7">
                                                  <s>₹{Math.round(show.price?.regular * 1.2)}</s> • Save 20%
                                                </small>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Action Button */}
                                          <motion.div
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                          >
                                            <Button 
                                              variant="danger" 
                                              className="w-100 book-show-btn py-1 py-md-2"
                                              onClick={() => handleQuickBook(show)}
                                              disabled={show.availableSeats === 0}
                                            >
                                              {show.availableSeats === 0 ? (
                                                <>
                                                  <i className="fas fa-times-circle me-1 me-md-2"></i>
                                                  Sold Out
                                                </>
                                              ) : (
                                                <>
                                                  <i className="fas fa-ticket-alt me-1 me-md-2"></i>
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
                  <i className="fas fa-info-circle me-1 me-md-2"></i>
                  <span className="d-none d-md-inline">Details</span>
                  <span className="d-md-none">Info</span>
                </span>
              }
            >
              <Card className="border-0 shadow-sm shadow-md-lg mt-3 mt-md-4">
                <Card.Body className="p-3 p-md-4">
                  <Row className="g-3 g-md-4">
                    <Col lg={8}>
                      {/* About Theater */}
                      <Card className="info-card-modern mb-3 mb-md-4">
                        <Card.Body className="p-3 p-md-4">
                          <h4 className="font-family-sans-serif mb-3 mb-md-4 fs-5 fs-md-4">
                            <i className="fas fa-building me-1 me-md-2 text-danger"></i>
                            About {currentTheater.name}
                          </h4>
                          <p className="lead mb-3 mb-md-4">
                            {currentTheater.description || 
                              `${currentTheater.name} is a premier cinema destination in ${currentTheater.location?.city}, offering state-of-the-art facilities and the best movie-watching experience.`}
                          </p>

                          {/* Facilities Carousel */}
                          {currentTheater.images && currentTheater.images.length > 0 && (
                            <div className="mb-4 mb-md-5">
                              <h5 className="font-family-sans-serif mb-2 mb-md-3 fs-5">Gallery</h5>
                              <Carousel className="theater-gallery">
                                {currentTheater.images.map((img, idx) => (
                                  <Carousel.Item key={idx}>
                                    <div 
                                      className="gallery-image"
                                      style={{
                                        backgroundImage: `url(${img})`,
                                        height: '300px',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '16px'
                                      }}
                                    />
                                  </Carousel.Item>
                                ))}
                              </Carousel>
                            </div>
                          )}

                          {/* Screens */}
                          {currentTheater.screens && currentTheater.screens.length > 0 && (
                            <div className="mb-4 mb-md-5">
                              <h5 className="font-family-sans-serif mb-3 mb-md-4 fs-5">
                                <i className="fas fa-film me-1 me-md-2 text-danger"></i>
                                Screens & Facilities
                              </h5>
                              <Row className="g-3">
                                {currentTheater.screens.map((screen, index) => (
                                  <Col key={index} xs={12} sm={6}>
                                    <Card className="screen-card border-0">
                                      <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <h6 className="fw-bold mb-0 fs-6">
                                            Screen {screen.screenNumber}
                                          </h6>
                                          <Badge bg={screen.screenType === 'IMAX' ? 'warning' : 'info'} className="fs-7">
                                            {screen.screenType}
                                          </Badge>
                                        </div>
                                        <div className="mb-2">
                                          <div className="d-flex justify-content-between mb-1">
                                            <small className="text-muted fs-7">Capacity</small>
                                            <small className="fw-bold fs-7">{screen.capacity} seats</small>
                                          </div>
                                          <div className="d-flex justify-content-between">
                                            <small className="text-muted fs-7">Sound System</small>
                                            <small className="fw-bold fs-7">{screen.soundSystem}</small>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          className="w-100 py-1"
                                          onClick={() => openScreenModal(screen)}
                                        >
                                          <i className="fas fa-expand me-1 me-md-2"></i>
                                          View Layout
                                        </Button>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}

                          {/* How to Reach */}
                          <Card className="info-card-modern">
                            <Card.Body className="p-3">
                              <h5 className="font-family-sans-serif mb-2 mb-md-3 fs-5">
                                <i className="fas fa-directions me-1 me-md-2 text-danger"></i>
                                How to Reach
                              </h5>
                              <div className="row g-3">
                                <Col md={6}>
                                  <div className="location-info">
                                    <h6 className="fw-semibold mb-2 fs-6">Address</h6>
                                    <p className="mb-0 fs-6">
                                      {currentTheater.location?.address}<br />
                                      {currentTheater.location?.city}, {currentTheater.location?.state}<br />
                                      {currentTheater.location?.zipCode && `PIN: ${currentTheater.location.zipCode}`}
                                    </p>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="transport-info">
                                    <h6 className="fw-semibold mb-2 fs-6">Transportation</h6>
                                    <div className="d-flex flex-column gap-2">
                                      <div className="d-flex align-items-center">
                                        <i className="fas fa-subway me-2 text-info fs-6"></i>
                                        <small className="fs-6">Nearest Metro: 5 mins walk</small>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <i className="fas fa-bus me-2 text-success fs-6"></i>
                                        <small className="fs-6">Bus Stop: Opposite theater</small>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <i className="fas fa-car me-2 text-warning fs-6"></i>
                                        <small className="fs-6">Parking: Available for 200+ cars</small>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </div>
                            </Card.Body>
                          </Card>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={4}>
                      {/* Amenities */}
                      <Card className="info-card-modern mb-3 mb-md-4">
                        <Card.Body className="p-3">
                          <h4 className="font-family-sans-serif mb-3 mb-md-4 fs-5 fs-md-4">
                            <i className="fas fa-star me-1 me-md-2 text-danger"></i>
                            Amenities & Facilities
                          </h4>
                          <div className="amenities-list">
                            {currentTheater.amenities?.map((amenity, index) => (
                              <div key={index} className="amenity-item d-flex align-items-center mb-2">
                                <div className="amenity-icon me-2 me-md-3">
                                  <i className={`fas ${getAmenityIcon(amenity)} text-primary fs-6`}></i>
                                </div>
                                <div>
                                  <h6 className="mb-0 fs-6">{amenity}</h6>
                                  <small className="text-muted fs-7">Available</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>

                      {/* Opening Hours */}
                      <Card className="info-card-modern mb-3 mb-md-4">
                        <Card.Body className="p-3">
                          <h4 className="font-family-sans-serif mb-3 mb-md-4 fs-5 fs-md-4">
                            <i className="fas fa-clock me-1 me-md-2 text-danger"></i>
                            Opening Hours
                          </h4>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                              <span className="fs-6">Weekdays (Mon-Thu)</span>
                              <strong className="fs-6">
                                {currentTheater.openingHours?.weekdays?.open || '10:00 AM'} - 
                                {currentTheater.openingHours?.weekdays?.close || '11:00 PM'}
                              </strong>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                              <span className="fs-6">Weekends (Fri-Sun)</span>
                              <strong className="fs-6">
                                {currentTheater.openingHours?.weekends?.open || '9:00 AM'} - 
                                {currentTheater.openingHours?.weekends?.close || '12:00 AM'}
                              </strong>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                              <span className="fs-6">Holidays</span>
                              <strong className="fs-6">Open 24 Hours</strong>
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>

                      {/* Contact Info */}
                      <Card className="info-card-modern">
                        <Card.Body className="p-3">
                          <h4 className="font-family-sans-serif mb-3 mb-md-4 fs-5 fs-md-4">
                            <i className="fas fa-headset me-1 me-md-2 text-danger"></i>
                            Contact Information
                          </h4>
                          <div className="contact-list">
                            {currentTheater.contact?.phone && (
                              <div className="d-flex align-items-center mb-2">
                                <div className="contact-icon me-2 me-md-3">
                                  <i className="fas fa-phone text-success fs-6"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0 fs-6">Phone</h6>
                                  <p className="mb-0 fs-6">{currentTheater.contact.phone}</p>
                                </div>
                              </div>
                            )}
                            
                            {currentTheater.contact?.email && (
                              <div className="d-flex align-items-center mb-2">
                                <div className="contact-icon me-2 me-md-3">
                                  <i className="fas fa-envelope text-primary fs-6"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0 fs-6">Email</h6>
                                  <p className="mb-0 fs-6">{currentTheater.contact.email}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="d-flex align-items-center">
                              <div className="contact-icon me-2 me-md-3">
                                <i className="fas fa-map-marker-alt text-danger fs-6"></i>
                              </div>
                              <div>
                                <h6 className="mb-0 fs-6">Visit Us</h6>
                                <p className="mb-0 fs-6">{currentTheater.location?.address}</p>
                              </div>
                            </div>
                          </div>
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

      {/* Screen Layout Modal */}
      <Modal
        show={screenModalShow}
        onHide={() => setScreenModalShow(false)}
        size="lg"
        centered
        className="screen-modal-modern"
      >
        <Modal.Header closeButton className="border-0 p-3 p-md-4">
          <Modal.Title className="font-family-sans-serif fs-5 fs-md-4">
            <i className="fas fa-film me-1 me-md-2"></i>
            Screen {selectedScreen?.screenNumber} Layout
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
          {selectedScreen && (
            <>
              <div className="text-center mb-3 mb-md-4">
                <div className="screen-display">
                  <div className="screen-curtain"></div>
                  <div className="screen-text">
                    SCREEN {selectedScreen.screenNumber} - {selectedScreen.screenType}
                  </div>
                  <div className="screen-base"></div>
                </div>
              </div>
              
              <div className="screen-details">
                <Row className="g-3">
                  <Col md={6}>
                    <div className="detail-item mb-2">
                      <i className="fas fa-users me-2 text-primary"></i>
                      <span>Capacity:</span>
                      <strong>{selectedScreen.capacity} seats</strong>
                    </div>
                    <div className="detail-item mb-2">
                      <i className="fas fa-volume-up me-2 text-primary"></i>
                      <span>Sound System:</span>
                      <strong>{selectedScreen.soundSystem}</strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item mb-2">
                      <i className="fas fa-video me-2 text-primary"></i>
                      <span>Projection:</span>
                      <strong>{selectedScreen.projectionType || '4K Digital'}</strong>
                    </div>
                    <div className="detail-item mb-2">
                      <i className="fas fa-chair me-2 text-primary"></i>
                      <span>Seat Types:</span>
                      <strong>Standard, Premium, VIP</strong>
                    </div>
                  </Col>
                </Row>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-3 p-md-4">
          <Button
            variant="outline-secondary"
            onClick={() => setScreenModalShow(false)}
            className="rounded-pill px-3 px-md-4 py-2"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Helper function to format duration
const formatDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default TheaterDetails;