import React, { useEffect, useState,useMemo } from 'react';
import { 
  Container, Row, Col, Card, Button, Spinner, Modal 
} from 'react-bootstrap';

import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);
const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  return [...array].sort(() => Math.random() - 0.5);
};

const fetchMovies = async () => {
  try {
    const res = await axios.get("https://movie-booking-backend.onrender.com/api/movies/random?limit=8");
   setMovies(res?.data?.movies || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const shuffledMovies = useMemo(() => {
  return shuffleArray(movies || []);
}, [movies]);

const [showTrailer, setShowTrailer] = useState(false);
const [activeTrailer, setActiveTrailer] = useState(null);


  // Font classes for consistent typography
  const fontClasses = {
    heading: 'font-family-sans-serif',
    body: 'font-family-base',
  };

  return (
    <div className={`${fontClasses.body} text-gray-800`}>
      {/* Hero Section */}
      <section 
        className="hero-section text-white py-5 py-lg-6 mb-5"
style={{
  background: `
    linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.75) 40%,
      rgba(0, 0, 0, 0.4) 70%,
      rgba(0, 0, 0, 0.9) 100%
    ),
    url(/a.avif)
  `,
  backgroundSize: 'cover',
  backgroundPosition: 'center right',
  backgroundRepeat: 'no-repeat',
  minHeight: '50vh',
  display: 'flex',
  alignItems: 'center',
  boxShadow: 'inset 0 -120px 200px rgba(0,0,0,0.95)'
}}

      >
        <Container fluid>
          
          <Row className="justify-content-center">
            <Col xl={8} lg={10} md={12} className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className={`display-4 fw-bold mb-4 ${fontClasses.heading}`} style={{
  textShadow: '0 10px 40px rgba(0,0,0,0.9)',
  letterSpacing: '-1px'
}}
>
                  Book Your Movie Tickets <span className="text-danger">Online</span>
                </h1>
                <p className="lead fs-4 mb-4 opacity-90" style={{ fontWeight: 300 }}>
                  Experience the magic of cinema with seamless online booking and premium seating
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link to="/movies">
                    <Button 
                      variant="danger" 
                      size="lg" 
                      className="px-5 py-3 fw-bold fs-5 shadow-lg"
style={{ 
  borderRadius: '50px',
  background: 'linear-gradient(135deg, #d8b4fe 0%, purple 100%)',
  border: 'none',
  boxShadow: '0 15px 40px rgba(255, 61, 0, 0.6)',
  paddingLeft: '3rem',
  paddingRight: '3rem'
}}

                    >
                      Browse Movies
                      <i className="fas fa-arrow-right ms-2"></i>
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Movies */}
<section className="now-showing-section pb-5">
  <Container>
    
    {/* Header */}
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 className={`fw-bold mb-1 ${fontClasses.heading}`}>
          🎬 Now Showing
        </h2>
        <p className="text-muted mb-0">
          Book tickets for the latest blockbusters
        </p>
      </div>

      <Link to="/movies" className="text-decoration-none">
        <Button className="rounded-pill px-4"
       style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}>
          View All <i className="fas fa-arrow-right ms-2"></i>
        </Button>
      </Link>
    </div>

    {/* Loader */}
{loading ? (
  <div className="text-center py-5">
    <Spinner animation="border" variant="danger" />
    <p className="mt-3 text-muted">Loading movies...</p>
  </div>
) : (
  <Row className="g-4">
    {shuffledMovies.map((movie) => (
      <Col key={movie._id} xl={3} lg={3} md={6} sm={6} xs={12}>
            
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="h-100"
            >
<Card className="home-movie-card border-0 movie-modern-card">
  
  {/* Poster */}
  <div className="yt-thumb-box">
    <img
      src={movie.posterUrl}
      alt={movie.title}
      className="yt-thumb-img"
    />

    <div className="yt-gradient"></div>

    {movie.trailerUrl && (
      <div
        className="yt-play-btn"
        onClick={() => {
          setActiveTrailer(movie.trailerUrl);
          setShowTrailer(true);
        }}
      >
        <div className="yt-play-icon"></div>
      </div>
    )}
  </div>

  {/* Content */}
  <Card.Body className="card-body d-flex flex-column">

    <h5 className="movie-title">
      {movie.title}
    </h5>

    <p className="movie-genre">
      🎞 {Array.isArray(movie.genre) ? movie.genre.join(', ') : 'N/A'}
    </p>

    <p className="movie-duration">
      ⏱ {movie.duration
        ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`
        : 'N/A'}
    </p>

    <Link to={`/movies/${movie._id}`} className="mt-auto">
      <Button 
  className="w-100 rounded-pill"
  style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
>
  🎟 Book Tickets
</Button>
    </Link>

  </Card.Body>
</Card>

            </motion.div>

          </Col>
        ))}
      </Row>
    )}

  </Container>
</section>


      {/* Features */}
<section className="features-bright-section py-5 ">
  <Container>

    {/* Heading */}
    <div className="text-center mb-5">
      <h2 className={`fw-bold ${fontClasses.heading}`}>
        Why Choose <span className="text-danger">FilmZone</span>?
      </h2>
      <p className="text-muted mt-2">
        Premium movie booking experience at your fingertips
      </p>
    </div>

    <Row className="g-4 justify-content-center">
      {[
        {
          icon: 'fas fa-ticket-alt',
          title: 'Easy Booking',
          desc: 'Fast & simple ticket booking with live seat availability',
          color: '#dc3545'
        },
        {
          icon: 'fas fa-chair',
          title: 'Premium Seats',
          desc: 'Choose your favourite seats with smart seat layout',
          color: '#0dcaf0'
        },
        {
          icon: 'fas fa-shield-alt',
          title: 'Secure Payments',
          desc: '100% encrypted payment with trusted gateways',
          color: '#20c997'
        },
        {
          icon: 'fas fa-mobile-alt',
          title: 'Mobile Tickets',
          desc: 'Instant QR code tickets directly on your phone',
          color: '#ffc107'
        }
      ].map((feature, index) => (
        <Col xl={3} lg={4} md={6} sm={12} key={index}>

          <motion.div
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 260 }}
            className="h-100"
          >
            <div className="feature-bright-card text-center h-100 p-4">

              {/* Icon */}
<div
  className="feature-icon-bright mx-auto mb-4"
  style={{
    background: `linear-gradient(135deg, ${feature.color}, #000)`,
    boxShadow: `0 10px 25px ${feature.color}66`
  }}
>
  <i className={`${feature.icon} fa-2x text-white`}></i>
</div>


              {/* Title */}
              <h4 className={`fw-bold mb-3 ${fontClasses.heading}`}>
                {feature.title}
              </h4>

              {/* Description */}
              <p className="text-muted mb-0" style={{ lineHeight: '1.7' }}>
                {feature.desc}
              </p>

            </div>
          </motion.div>

        </Col>
      ))}
    </Row>

  </Container>
</section>


      {/* CTA Section */}
<section className="cta-premium-section py-5 mt-5">
  <Container>
    <div className="cta-premium-box text-center p-5">

      <h2 className={`fw-bold mb-3 ${fontClasses.heading}`}>
        Ready for an <span className="text-danger">Unforgettable Experience?</span>
      </h2>

      <p className="lead mb-4 text-muted">
        Join thousands of movie lovers who book with FilmZone every day
      </p>

      <Link to="/movies">
        <Button 
          variant="danger" 
          size="lg"
          className="px-5 py-3 fw-bold fs-5 "
          style={{ borderRadius: '50px',
            background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'
           }}
        >
          <i className="fas fa-play-circle me-2"></i>
          Start Booking Now
        </Button>
      </Link>

    </div>
  </Container>
</section>
{/* 🎬 HOME PAGE TRAILER MODAL */}
<Modal
  show={showTrailer}
  onHide={() => setShowTrailer(false)}
  centered
  size="lg"
>
  <Modal.Body className="p-0 bg-black position-relative">

    {/* Close */}
    <Button
      variant="dark"
      className="position-absolute top-0 end-0 m-2 rounded-circle"
      style={{ zIndex: 10 }}
      onClick={() => setShowTrailer(false)}
    >
      ✕
    </Button>

    {activeTrailer ? (
      <div className="ratio ratio-16x9">
        <iframe
          src={activeTrailer.replace("watch?v=", "embed/") + "?autoplay=1"}
          title="Trailer"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    ) : null}

  </Modal.Body>
</Modal>

      {/* Add global font styling */}
{/* Global & Responsive Styling */}


    </div>
    
  );
  

};

export default Home;