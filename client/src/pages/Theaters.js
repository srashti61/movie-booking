import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Container, Button, Spinner, Alert,
  Badge, InputGroup, Form, ProgressBar, ButtonGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { theaterAPI } from '../services/api';
import { fetchTheaters, setTheaterFilters } from '../features/theaterSlice';

// CSS
import './Theaters.css';

const Theaters = () => {
  const dispatch = useDispatch();
  const { theaters, loading, error, filters, pagination } = useSelector(state => state.theaters);

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [amenityFilter, setAmenityFilter] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');

  // Available amenities for filtering
  const availableAmenities = [
    'Dolby Atmos', 'IMAX', '4DX', '3D', 'VIP Lounge',
    'Food Court', 'Parking', 'Wheelchair Access',
    'Online Booking', 'Cafeteria', 'Gold Class', 'Recliner Seats'
  ];

  // 🔹 FIRST define function
  const getTotalSeats = (theater) => {
    if (!theater.screens) return 0;
    return theater.screens.reduce((total, screen) => {
      return total + (screen.seats?.reduce((rowTotal, row) => rowTotal + row.length, 0) || 0);
    }, 0);
  };

  // 🔹 THEN sort
  const sortedTheaters = [...theaters].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);

      case 'name_desc':
        return b.name.localeCompare(a.name);

      case 'screens':
        return (b.screens?.length || 0) - (a.screens?.length || 0);

      case 'seats':
        return getTotalSeats(b) - getTotalSeats(a);

      default:
        return 0;
    }
  });

  // Available cities from theaters
  const availableCities = ['all', ...new Set(theaters.map(t => t.location?.city).filter(Boolean).sort())];

  useEffect(() => {
    dispatch(fetchTheaters(filters));
  }, [dispatch, filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setTheaterFilters({ search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  // City filter
  useEffect(() => {
    dispatch(setTheaterFilters({ city: cityFilter === 'all' ? null : cityFilter }));
  }, [cityFilter, dispatch]);

  // Amenity filter
  useEffect(() => {
    if (amenityFilter === 'all') {
      dispatch(setTheaterFilters({ amenities: [] }));
    } else if (amenityFilter === 'selected') {
      dispatch(setTheaterFilters({ amenities: Array.from(selectedAmenities) }));
    }
  }, [amenityFilter, selectedAmenities, dispatch]);

  // Sort
  useEffect(() => {
    dispatch(setTheaterFilters({ sortBy }));
  }, [sortBy, dispatch]);

  const toggleAmenity = (amenity) => {
    const newSelected = new Set(selectedAmenities);
    if (newSelected.has(amenity)) {
      newSelected.delete(amenity);
    } else {
      newSelected.add(amenity);
    }
    setSelectedAmenities(newSelected);
    setAmenityFilter('selected');
  };

  const getLocationString = (location) => {
    if (!location) return 'Location not specified';
    const { address, city, state } = location;
    return `${address}, ${city}`;
  };

  const getFullLocation = (location) => {
    if (!location) return 'Location not specified';
    const { address, city, state, pincode } = location;
    return `${address}, ${city}, ${state}${pincode ? ` - ${pincode}` : ''}`;
  };

  const getScreenCount = (screens) => {
    return screens ? screens.length : 0;
  };

  const totalScreens = theaters.reduce((total, theater) => {
    return total + (theater.screens?.length || 0);
  }, 0);

  const totalShows = theaters.reduce((total, theater) => {
    return total + (theater.upcomingShows?.length || 0);
  }, 0);

  const getTheaterType = (amenities) => {
    if (!amenities) return 'Standard';
    if (amenities.includes('IMAX') || amenities.includes('4DX')) return 'Premium';
    if (amenities.includes('VIP Lounge') || amenities.includes('Gold Class')) return 'Luxury';
    return 'Standard';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setAmenityFilter('all');
    setSelectedAmenities(new Set());
    setSortBy('name');
    dispatch(setTheaterFilters({
      search: '',
      city: null,
      amenities: [],
      sortBy: 'name'
    }));
  };

  if (loading && theaters.length === 0) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading theaters...</p>
      </div>
    );
  }

  return (
    <div className="font-family-base">
      {/* Hero Header */}
      <section
        className="theaters-hero-section py-5 mb-5"
        style={{
          background: `linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(0, 0, 0, 0.85) 40%,
            rgba(0, 0, 0, 0.5) 70%,
            rgba(0, 0, 0, 0.9) 100%
          ),
          url(/a.avif)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '0 0 30px 30px',
          boxShadow: 'inset 0 -120px 200px rgba(0,0,0,0.95)'
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white text-center"
          >
            <h1 className="display-4 fw-bold mb-3 font-family-sans-serif">
              🎬 Our Premium Theaters
            </h1>
            <p className="lead opacity-90 mb-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
              Experience movies in state-of-the-art theaters with world-class amenities
            </p>
            <div className="d-flex justify-content-center gap-3">

              <Badge bg="warning" className="px-3 py-2 fs-6">
                {theaters.length} Locations
              </Badge>

              <Badge bg="info" className="px-3 py-2 fs-6">
                {totalScreens} Screens
              </Badge>

              <Badge bg="success" className="px-3 py-2 fs-6">
                {totalShows} Shows Available
              </Badge>

            </div>

          </motion.div>
        </Container>

      </section>

      <Container>
        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5"
        >
          <Card className="theaters-filter-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <Row className="g-3 align-items-end">
                {/* Search */}
                <Col xl={3} lg={4} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold mb-2">
                      <i className="fas fa-search me-2 text-danger"></i>
                      Search Theaters
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="form-control-modern">
                        <i className="fas fa-search text-muted"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by theater name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control-modern"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                {/* City Filter */}
                <Col xl={2} lg={3} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold mb-2">
                      <i className="fas fa-city me-2 text-danger"></i>
                      City
                    </Form.Label>
                    <Form.Select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="form-select-modern"
                    >
                      <option value="all">All Cities</option>
                      {availableCities.filter(city => city !== 'all').map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Sort */}
                <Col xl={2} lg={3} md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold mb-2">
                      <i className="fas fa-sort me-2 text-danger"></i>
                      Sort By
                    </Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-select-modern"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="screens">Most Screens</option>
                      <option value="seats">Most Seats</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Filter Actions */}
                <Col xl={5} lg={2} md={6} className="text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      variant="outline-secondary"
                      onClick={clearFilters}
                      className="rounded-pill px-4"
                    >
                      <i className="fas fa-filter-circle-xmark me-2"></i>
                      Clear Filters
                    </Button>

                    <Button
                      style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                      onClick={() => setAmenityFilter('all')}
                      className="rounded-pill px-4 theaters-action-btn"
                    >
                      <i className="fas fa-sliders-h me-2"></i>
                      Filter Amenities
                    </Button>
                  </div>
                </Col>
              </Row>

              {/* Amenities Filter */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-semibold mb-3">
                  <i className="fas fa-star me-2 text-danger"></i>
                  Filter by Amenities
                </h6>
                <div className="amenities-filter-list">
                  <Badge
                    style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)',
                       cursor: 'pointer'
                    }}
                    text={amenityFilter === 'all' ? 'white' : 'dark'}
                    className="me-2 mb-2 px-3 py-2"
                    onClick={() => setAmenityFilter('all')}
                  >
                    All Amenities
                  </Badge>

                  {availableAmenities.map((amenity, index) => (
                    <Badge
                      key={index}
                      bg={selectedAmenities.has(amenity) ? 'success' : 'light'}
                      text={selectedAmenities.has(amenity) ? 'white' : 'dark'}
                      className="amenity-badge me-2 mb-2"
                      onClick={() => toggleAmenity(amenity)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-check-circle me-1"></i>
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Alert variant="warning" className="theaters-error-card border-0">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                <div>
                  <Alert.Heading className="mb-2">Using Sample Data</Alert.Heading>
                  <p className="mb-0">
                    Unable to load theaters from server. Showing sample data.
                    <br />
                    <small className="text-muted">Error: {error}</small>
                  </p>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

        {/* Theaters Grid */}
        <AnimatePresence>
          {theaters.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-5"
            >
              <div className="empty-state-icon mb-4 mx-auto">
                <i className="fas fa-film"></i>
              </div>
              <h4 className="font-family-sans-serif mb-3">No Theaters Found</h4>
              <p className="text-muted mb-4">
                {searchTerm || cityFilter !== 'all' || selectedAmenities.size > 0
                  ? 'Try adjusting your filters or search term'
                  : 'No theaters available at the moment'}
              </p>
              <Button
                variant="outline-danger"
                onClick={clearFilters}
                className="rounded-pill px-4"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            <Row>
              <AnimatePresence>
                {sortedTheaters.map((theater, index) => (

                  <Col
                    key={theater._id || theater.id}
                    xl={3}   // ✅ 4 cards per row (12 / 3 = 4)
                    lg={4}   // 3 cards
                    md={6}   // 2 cards
                    sm={12}  // 1 card
                    className="mb-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      layout
                    >
                      <Card className="theater-card-modern h-100 d-flex flex-column border-0 shadow-lg">
                        {/* Card Header */}
                        <div className="theater-card-header position-relative">
                          <div
                            className="theater-card-bg"
                            style={{
                              backgroundImage: `url(${theater.image ||
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfln-xY3LzfnfQFzegt-wMCW1H-_2jDRAkbw&s"
                                })`
                            }}
                          ></div>
                          <div className="theater-card-overlay">
                            <div className="theater-type-badge">
                              {getTheaterType(theater.amenities)}
                            </div>
                            <h3 className="theater-name mb-0">{theater.name}</h3>
                            <div className="theater-location">
                              <i className="fas fa-map-marker-alt me-2"></i>
                              {getLocationString(theater.location)}
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <Card.Body className="p-4">
                          {/* Stats */}
                          <div className="theater-stats d-flex justify-content-between mb-4">
                            <div className="stat-item text-center">
                              <div className="stat-number fw-bold" style={{ color: '#a363e6' }}>
                                {getScreenCount(theater.screens)}
                              </div>
                              <div className="stat-label text-muted small fw-bold">Screens</div>
                            </div>
                            <div className="stat-item text-center">
                              <div className="stat-number fw-bold" style={{ color: '#a363e6' }}>
                                {getTotalSeats(theater).toLocaleString()}
                              </div>
                              <div className="stat-label text-muted small fw-bold">Total Seats</div>
                            </div>
                            <div className="stat-item text-center">
                              <div className="stat-number fw-bold" style={{ color: '#a363e6' }}>
                                {theater.contact?.phone ? '📞' : 'N/A'}
                              </div>
                              <div className="stat-label text-muted small fw-bold">Contact</div>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="mb-4">
                            <h6 className="fw-semibold mb-3">
                              <i className="fas fa-star me-2 style={{ color: '#a363e6'}}"></i>
                              Amenities
                            </h6>
                            <div className="theater-amenities">
                              {theater.amenities?.slice(0, 5).map((amenity, index) => (
                                <Badge key={index} className="amenity-badge-sm me-1 mb-2">
                                  {amenity}
                                </Badge>
                              ))}
                              {theater.amenities?.length > 5 && (
                                <Badge className="amenity-badge-sm more-badge me-1 mb-2">
                                  +{theater.amenities.length - 5}
                                </Badge>
                              )}
                              {(!theater.amenities || theater.amenities.length === 0) && (
                                <small className="text-muted">No amenities listed</small>
                              )}
                            </div>
                          </div>

                          {/* Location Details */}
                          <div className="mb-4">
                            <h6 className="fw-semibold mb-2">
                              <i className="fas fa-location-dot me-2 style={{ color: '#a363e6'}}"></i>
                              Location Details
                            </h6>
                            <p className="small text-muted mb-2">
                              {getFullLocation(theater.location)}
                            </p>
                            {theater.contact && (
                              <div className="contact-info">
                                {theater.contact.phone && (
                                  <div className="mb-1">
                                    <i className="fas fa-phone me-2 text-success"></i>
                                    <small>{theater.contact.phone}</small>
                                  </div>
                                )}
                                {theater.contact.email && (
                                  <div>
                                    <i className="fas fa-envelope me-2 text-primary"></i>
                                    <small>{theater.contact.email}</small>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Show Times Summary */}
                          {theater.upcomingShows && theater.upcomingShows.length > 0 && (
                            <div className="mb-4">
                              <h6 className="fw-semibold mb-2">
                                <i className="fas fa-clock me-2 text-danger"></i>
                                Today's Shows
                              </h6>
                              <div className="d-flex flex-wrap gap-1">
                                {theater.upcomingShows.slice(0, 4).map((show, idx) => (
                                  <Badge key={idx} bg="dark" className="px-2">
                                    {show.time}
                                  </Badge>
                                ))}
                                {theater.upcomingShows.length > 4 && (
                                  <Badge bg="light" text="dark" className="px-2">
                                    +{theater.upcomingShows.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="d-grid gap-2 mt-4">
                            <Link to={`/theaters/${theater._id || theater.id}`}>
                              <Button  style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                               className="w-100 theaters-action-btn py-2">
                                <i className="fas fa-info-circle me-2"></i>
                                View Details
                              </Button>
                            </Link>
                            <Link to={`/theaters/${theater._id || theater.id}/shows`}>
                              <Button variant="outline-danger" className="w-100 py-2">
                                <i className="fas fa-ticket-alt me-2"></i>
                                View Shows
                              </Button>
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </AnimatePresence>
            </Row>
          )}
        </AnimatePresence>

        {/* Loading More Indicator */}
        {loading && theaters.length > 0 && (
          <div className="text-center my-4">
            <Spinner animation="border" size="sm" variant="danger" />
            <span className="ms-2 text-muted">Loading more theaters...</span>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 pt-5"
        >
          <Card className="theaters-cta-card border-0 text-center shadow-lg">
            <Card.Body className="p-5">
              <i className="fas fa-film fa-4x text-danger mb-4"></i>
              <h2 className="font-family-sans-serif mb-3">
                Can't Find Your Preferred Theater?
              </h2>
              <p className="lead text-muted mb-4">
                Suggest a new location or partner with us to bring premium cinema experience to your city
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}} className="rounded-pill px-4">
                  <i className="fas fa-lightbulb me-2"></i>
                  Suggest Location
                </Button>
                <Button style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}} className="rounded-pill px-4 theaters-action-btn">
                  <i className="fas fa-handshake me-2"></i>
                  Partner With Us
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

      </Container>
    </div>
  );
};

export default Theaters;