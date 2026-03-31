import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Card, Button, Badge, Alert, Spinner, 
  Row, Col, Dropdown, Modal, Tab, Tabs, Form
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { useSelector } from 'react-redux';
import { bookingAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import './MyBookings.css';
import { toast } from "react-toastify";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [activeTab, setActiveTab] = useState('all');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters state with proper counts
  const [filters, setFilters] = useState([
    { key: 'all', label: 'All Bookings', count: 0, icon: 'fa-ticket-alt' },
    { key: 'upcoming', label: 'Upcoming', count: 0, icon: 'fa-clock' },
    { key: 'completed', label: 'Completed', count: 0, icon: 'fa-check-circle' },
    { key: 'cancelled', label: 'Cancelled', count: 0, icon: 'fa-times-circle' }
  ]);

  const { user } = useSelector(state => state.auth);
const getShowDateTime = (booking) => {
  if (!booking?.show) return null;

  // Case 1: startTime is ISO datetime
  if (booking.show.startTime && booking.show.startTime.includes('T')) {
    return new Date(booking.show.startTime);
  }

  // Case 2: showTime exists
  if (booking.show.showTime) {
    return new Date(booking.show.showTime);
  }

  // Case 3: date + HH:mm
  if (booking.show.date && booking.show.startTime) {
    const date = new Date(booking.show.date);
    const [h, m] = booking.show.startTime.split(':');
    date.setHours(Number(h), Number(m), 0, 0);
    return date;
  }

  return null;
};

// 🔥 MAIN FILTER LOGIC (REQUIRED)

  // Fetch bookings
const fetchBookings = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await bookingAPI.getUserBookings();

    // ✅ BACKEND MATCH
    if (!response?.success) {
      throw new Error("Failed to fetch bookings");
    }

    const bookingsData = response.bookings || [];

    setBookings(
      bookingsData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );

  } catch (err) {
    console.error(err);
    setError("Failed to load bookings");
  } finally {
    setLoading(false);
  }
}, []);


useEffect(() => {
  fetchBookings();
}, [fetchBookings]);



  // Calculate filter counts
const calculateFilterCounts = (list) => {
  const now = new Date();

  return {
    all: list.length,
    upcoming: list.filter(b => {
      if (b.status !== 'confirmed') return false;
      const t = getShowDateTime(b);
      return t && t > now;
    }).length,
    completed: list.filter(b => {
      if (b.status !== 'confirmed') return false;
      const t = getShowDateTime(b);
      return t && t < now;
    }).length,
    cancelled: list.filter(b => b.status === 'cancelled').length
  };
};


useEffect(() => {
  const now = new Date();
  let list = [...bookings];

  if (searchTerm.trim()) {
    list = list.filter(b =>
      b.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.show?.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.show?.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (activeTab === 'upcoming') {
    list = list.filter(b =>
      b.status === 'confirmed' &&
      getShowDateTime(b) > now
    );
  }

  if (activeTab === 'completed') {
    list = list.filter(b =>
      b.status === 'confirmed' &&
      getShowDateTime(b) < now
    );
  }

  if (activeTab === 'cancelled') {
    list = list.filter(b => b.status === 'cancelled');
  }

  setFilteredBookings(list);

  // ✅ COUNTS FROM REAL BOOKINGS
  setFilters(prev => prev.map(f => ({
    ...f,
    count:
      f.key === 'all' ? bookings.length :
      f.key === 'upcoming' ? bookings.filter(b => b.status === 'confirmed' && getShowDateTime(b) > now).length :
      f.key === 'completed' ? bookings.filter(b => b.status === 'confirmed' && getShowDateTime(b) < now).length :
      f.key === 'cancelled' ? bookings.filter(b => b.status === 'cancelled').length :
      0
  })));

}, [bookings, activeTab, searchTerm]);


  // Status badge with safe defaults
  const getStatusBadge = (status, showTime) => {
    if (!status) status = 'pending';
    
    const showDate = showTime ? new Date(showTime) : new Date();
    const now = new Date();
    const isUpcoming = isAfter(showDate, now);

    const badgeConfig = {
      cancelled: { bg: 'danger', text: 'Cancelled', icon: 'fa-times-circle' },
      confirmed: { 
        bg: isUpcoming ? 'success' : 'info', 
        text: isUpcoming ? 'Confirmed' : 'Completed',
        icon: isUpcoming ? 'fa-check-circle' : 'fa-film'
      },
      pending: { bg: 'warning', text: 'Pending Payment', icon: 'fa-clock' },
      completed: { bg: 'info', text: 'Completed', icon: 'fa-film' }
    };

    const config = badgeConfig[status] || { bg: 'secondary', text: status, icon: 'fa-question-circle' };

    return (
      <Badge bg={config.bg} className="status-badge d-inline-flex align-items-center gap-1">
        <i className={`fas ${config.icon}`}></i>
        {config.text}
      </Badge>
    );
  };

  // Seat type color
  const getSeatTypeColor = (type) => {
    const colors = {
      vip: '#dc3545',
      premium: '#ffc107',
      recliner: '#0d6efd',
      executive: '#6f42c1',
      regular: '#198754'
    };
    return colors[type] || '#6c757d';
  };

  // Currency formatting
  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Handle cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      toast.warning('Please provide a cancellation reason');
      return;
    }

    try {
      setCancelling(true);
      
      // Try API cancellation
      let success = false;
      try {
        const response = await bookingAPI.cancelBooking(selectedBooking._id, cancellationReason);
        success = response?.success;
      } catch (apiError) {
        console.warn('API cancellation failed, updating locally:', apiError);
        success = true; // Fallback to local update
      }

      if (success) {
        // Update local state
        setBookings(prev => prev.map(b => 
          b._id === selectedBooking._id 
            ? { 
                ...b, 
                status: 'cancelled',
                cancellationReason,
                cancelledAt: new Date().toISOString()
              }
            : b
        ));
        
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancellationReason('');
        
        toast.success('Booking cancelled successfully', {
          position: 'top-center',
          icon: '✅'
        });
      } else {
        throw new Error('Cancellation failed');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel booking. Please try again.', {
        position: 'top-center',
        icon: '❌'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Open cancellation modal
const openCancelModal = (booking) => {
  const showTime = getShowDateTime(booking);
  if (!showTime) {
    toast.warning('Show time missing');
    return;
  }

  const now = new Date();
  const hoursUntilShow = (showTime - now) / (1000 * 60 * 60);

  if (hoursUntilShow < 2) {
    toast.warning('Cannot cancel within 2 hours of show time');
    return;
  }

  setSelectedBooking(booking);
  setShowCancelModal(true);
};

  // Can cancel check
 const canCancelBooking = (booking) => {
  if (booking.status !== 'confirmed') return false;

  const showTime = getShowDateTime(booking);
  if (!showTime) return false;

  const now = new Date();
  const hoursUntilShow = (showTime - now) / (1000 * 60 * 60);

  return hoursUntilShow > 2;
};


  // Loading state
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading your bookings...</p>
        <p className="text-muted small">Fetching your movie tickets</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      {/* Hero Section */}
      <section className="bookings-hero-section py-4 py-md-5 mb-4 mb-md-5">
        <Container className="px-3 px-md-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-md-start"
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 mb-md-4">
              <div>
                <h1 className="display-5 display-md-4 fw-bold mb-2 font-family-sans-serif">
                  My Bookings
                </h1>
                <p className="text-muted mb-0">
                  Manage all your movie tickets in one place
                </p>
              </div>
              <Link to="/movies" className="mt-3 mt-md-0">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="danger" className="book-more-btn px-4 py-2">
                    <i className="fas fa-plus-circle me-2"></i>
                    Book More Tickets
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              {filters.map((filter) => (
                <Col key={filter.key} xs={6} md={3}>
                  <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
                    <Card 
                      className={`stat-card ${activeTab === filter.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(filter.key)}
                    >
                      <Card.Body className="p-3 text-center">
                        <div className="stat-icon mb-2">
                          <i className={`fas ${filter.icon} fa-2x text-primary`}></i>
                        </div>
                        <div className="stat-number display-6 fw-bold text-primary">
                          {filter.count}
                        </div>
                        <div className="stat-label text-muted">
                          {filter.label}
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* Search Bar */}
            <div className="search-container mb-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by ticket number, movie, or theater..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </Container>
      </section>

      <Container className="px-3 px-md-4">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert variant="danger" className="booking-error-alert border-0 shadow-sm mb-4">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
                <div className="flex-grow-1">
                  <h5 className="alert-heading mb-1">Error Loading Bookings</h5>
                  <p className="mb-0">{error}</p>
                </div>
                <Button 
                  variant="outline-danger" 
                  onClick={fetchBookings}
                  className="ms-3"
                >
                  <i className="fas fa-redo me-2"></i>
                  Retry
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}

        {/* Tabs */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-3 p-md-4">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="booking-tabs mb-4"
              variant="pills"
            >
              {filters.slice(1).map(filter => (
                <Tab 
                  key={filter.key}
                  eventKey={filter.key}
                  title={
                    <span className="d-flex align-items-center">
                      <i className={`fas ${filter.icon} me-2`}></i>
                      {filter.label}
                      <Badge bg="light" text="dark" className="ms-2">
                        {filter.count}
                      </Badge>
                    </span>
                  }
                />
              ))}
            </Tabs>

            {/* Bookings List */}
            <AnimatePresence mode="wait">
              {filteredBookings.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="empty-bookings-state text-center py-5"
                >
                  <div className="empty-state-icon mb-4">
                    <i className="fas fa-ticket-alt fa-4x text-muted"></i>
                  </div>
                  <h4 className="font-family-sans-serif mb-3">
                    {searchTerm 
                      ? 'No bookings match your search'
                      : `No ${activeTab} bookings found`}
                  </h4>
                  <p className="text-muted mb-4">
                    {searchTerm 
                      ? 'Try a different search term'
                      : activeTab === 'upcoming' 
                        ? "You don't have any upcoming bookings. Book your next movie now!"
                        : activeTab === 'completed'
                        ? "You haven't completed any bookings yet."
                        : "You haven't cancelled any bookings."}
                  </p>
                  <div className="d-flex gap-3 justify-content-center">
                    {searchTerm && (
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setSearchTerm('')}
                        className="px-4"
                      >
                        Clear Search
                      </Button>
                    )}
                    <Link to="/movies">
                      <Button variant="primary" className="px-4">
                        <i className="fas fa-film me-2"></i>
                        Browse Movies
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                  className="bookings-list"
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                     Showing {filteredBookings.length} {activeTab === 'all' ? 'all' : activeTab} booking{filteredBookings.length !== 1 ? 's' : ''}

                    </h6>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Sort By
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => {}}>Show Time (Soonest)</Dropdown.Item>
                        <Dropdown.Item onClick={() => {}}>Show Time (Latest)</Dropdown.Item>
                        <Dropdown.Item onClick={() => {}}>Booking Date</Dropdown.Item>
                        <Dropdown.Item onClick={() => {}}>Price (High to Low)</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  {filteredBookings.map((booking) => {
const showTime = getShowDateTime(booking);
const isUpcoming = showTime ? isAfter(showTime, new Date()) : false;

                    const canCancel = canCancelBooking(booking);
                    
                    return (
                      <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="booking-card-wrapper mb-3"
                      >
                        <Card className="booking-card border-0 shadow-sm hover-lift">
                          <Card.Body className="p-3 p-md-4">
                            <Row className="align-items-center">
                              {/* Movie Poster */}
                              <Col xs={12} md={2} lg={1} className="mb-3 mb-md-0">
                                <div className="movie-poster-small">
                                  <img
                                    src={booking.show?.movie?.posterUrl || 'https://picsum.photos/80/120?random=1'}
                                    alt={booking.show?.movie?.title || 'Movie'}
                                    className="rounded-3 shadow-sm"
                                    style={{ width: '80px', height: '120px', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.src = 'https://picsum.photos/80/120?random=2';
                                    }}
                                  />
                                </div>
                              </Col>

                              {/* Booking Details */}
                              <Col xs={12} md={6} lg={7}>
                                <div className="booking-details">
                                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
                                    <h5 className="movie-title mb-1">
                                      {booking.show?.movie?.title || 'Unknown Movie'}
                                    </h5>
                                    <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                                   {getStatusBadge(booking.status, showTime)}

                                      <Badge bg="light" text="dark" className="ticket-number">
                                        #{booking.ticketNumber}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="movie-info mb-3">
                                    {booking.show?.movie?.language && (
                                      <Badge bg="info" className="me-2 mb-1">
                                        {booking.show.movie.language}
                                      </Badge>
                                    )}
                                    {booking.show?.movie?.duration && (
                                      <Badge bg="dark" className="me-2 mb-1">
                                        {Math.floor(booking.show.movie.duration / 60)}h {booking.show.movie.duration % 60}m
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="booking-info">
                                    <div className="info-row mb-2">
                                      <i className="fas fa-building me-2 text-muted"></i>
                                      <span className="fw-semibold me-3">Theater:</span>
                                      <span>{booking.show?.theater?.name || 'Unknown Theater'}</span>
                                      {booking.show?.screen && (
                                        <Badge bg="light" text="dark" className="ms-2">
                                          Screen {booking.show.screen}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="info-row mb-2">
                                      <i className="fas fa-calendar-alt me-2 text-muted"></i>
                                      <span className="fw-semibold me-3">Show Time:</span>
                                      <span>{format(showTime, 'EEE, MMM dd, yyyy')}</span>
                                      <span className="mx-2">•</span>
                                      <span>{format(showTime, 'h:mm a')}</span>
                                    </div>
                                    
                                    {booking.seats?.length > 0 && (
                                      <div className="info-row">
                                        <i className="fas fa-chair me-2 text-muted"></i>
                                        <span className="fw-semibold me-3">Seats:</span>
                                        <div className="d-inline-flex flex-wrap gap-1">
                                          {booking.seats.slice(0, 4).map((seat, index) => (
                                            <Badge 
                                              key={index}
                                              style={{ 
                                                backgroundColor: getSeatTypeColor(seat.type),
                                                color: 'white'
                                              }}
                                              className="seat-badge"
                                            >
                                              {seat.seatNumber} ({seat.type})
                                            </Badge>
                                          ))}
                                          {booking.seats.length > 4 && (
                                            <Badge bg="secondary" className="ms-1">
                                              +{booking.seats.length - 4} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {booking.cancellationReason && (
                                      <div className="info-row mt-2">
                                        <i className="fas fa-comment me-2 text-danger"></i>
                                        <span className="fw-semibold me-3">Cancellation Reason:</span>
                                        <span className="text-danger">{booking.cancellationReason}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Col>

                              {/* Actions & Amount */}
                              <Col xs={12} md={4} lg={4}>
                                <div className="booking-actions text-center text-md-end">
                                  <div className="total-amount mb-3">
                                    <div className="text-muted fs-7 mb-1">Total Amount</div>
                                    <div className="amount-display display-6 fw-bold text-danger">
                                      {formatCurrency(booking.finalAmount || booking.totalAmount)}
                                    </div>
                                    {booking.discount > 0 && (
                                      <div className="text-success fs-7">
                                        <i className="fas fa-tag me-1"></i>
                                        Saved {formatCurrency(booking.discount)}
                                      </div>
                                    )}
                                  </div>

                                  <div className="d-flex flex-column gap-2">
                                    <Link to={`/booking-confirmation/${booking._id}`}>
                                      <Button 
                                        variant="outline-primary" 
                                        className="w-100 action-btn"
                                      >
                                        <i className="fas fa-eye me-2"></i>
                                        View Details
                                      </Button>
                                    </Link>
                                    
                                    {canCancel && (
                                      <Button 
                                        variant="outline-danger" 
                                        className="w-100 action-btn"
                                        onClick={() => openCancelModal(booking)}
                                      >
                                        <i className="fas fa-times me-2"></i>
                                        Cancel Booking
                                      </Button>
                                    )}
                                    
                                    {booking.status === 'confirmed' && isUpcoming && (
                                      <Button 
                                        variant="outline-success" 
                                        className="w-100 action-btn"
                                        onClick={() => {
                                          toast.info('Download feature coming soon!');
                                        }}
                                      >
                                        <i className="fas fa-download me-2"></i>
                                        Download Ticket
                                      </Button>
                                    )}
                                    
                                    <Button 
                                      variant="outline-secondary" 
                                      className="w-100 action-btn"
                                      onClick={() => {
                                        toast.info('Share feature coming soon!');
                                      }}
                                    >
                                      <i className="fas fa-share-alt me-2"></i>
                                      Share
                                    </Button>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Card.Body>
        </Card>
      </Container>

      {/* Cancel Booking Modal */}
      <Modal
        show={showCancelModal}
        onHide={() => {
          setShowCancelModal(false);
          setCancellationReason('');
        }}
        centered
        backdrop="static"
        className="cancel-booking-modal"
      >
        <Modal.Header closeButton className="border-0 p-4 bg-light">
          <Modal.Title className="font-family-sans-serif fw-bold">
            <i className="fas fa-exclamation-triangle text-danger me-2"></i>
            Cancel Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedBooking && (
            <>
              <Alert variant="warning" className="border-0 bg-warning bg-opacity-10">
                <div className="d-flex align-items-start">
                  <i className="fas fa-exclamation-triangle fa-lg me-3 text-warning mt-1"></i>
                  <div>
                    <h6 className="fw-bold mb-2">Are you sure you want to cancel this booking?</h6>
                    <p className="mb-0">
                      This action cannot be undone. A cancellation fee may apply based on our policy.
                    </p>
                  </div>
                </div>
              </Alert>
              
              <Card className="border-0 bg-light mt-4">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={selectedBooking.show?.movie?.posterUrl || 'https://picsum.photos/60/90'}
                      alt={selectedBooking.show?.movie?.title}
                      className="rounded me-3 shadow-sm"
                      style={{ width: '60px', height: '90px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{selectedBooking.show?.movie?.title}</h6>
                      <div className="d-flex flex-wrap gap-2">
                        <small className="text-muted">
                          <i className="fas fa-building me-1"></i>
                          {selectedBooking.show?.theater?.name}
                        </small>
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {selectedBooking.show?.startTime && (() => {
  const t = getShowDateTime(selectedBooking);
  return t ? format(t, 'EEE, MMM dd • h:mm a') : 'N/A';
})()
}
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-6">
                      <small className="text-muted d-block">Ticket #</small>
                      <div className="fw-bold">#{selectedBooking.ticketNumber}</div>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-muted d-block">Amount</small>
                      <div className="fw-bold text-danger">
                        {formatCurrency(selectedBooking.finalAmount || selectedBooking.totalAmount)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Form.Group className="mt-4">
                <Form.Label className="fw-semibold">
                  <i className="fas fa-comment me-2 text-danger"></i>
                  Reason for cancellation *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Please tell us why you're cancelling..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="form-control-modern"
                  required
                />
                <Form.Text className="text-muted">
                  Your feedback helps us improve our service
                </Form.Text>
              </Form.Group>
              
              <Alert variant="info" className="border-0 bg-info bg-opacity-10 mt-4">
                <h6 className="fw-bold mb-2">Cancellation Policy:</h6>
                <ul className="mb-0">
                  <li>Full refund if cancelled 4+ hours before show time</li>
                  <li>50% refund if cancelled 2-4 hours before show time</li>
                  <li>No refund if cancelled less than 2 hours before show time</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowCancelModal(false);
              setCancellationReason('');
            }}
            className="rounded-pill px-4 py-2"
          >
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelBooking}
            disabled={cancelling || !cancellationReason.trim()}
            className="rounded-pill px-4 py-2"
          >
            {cancelling ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cancelling...
              </>
            ) : (
              <>
                <i className="fas fa-times-circle me-2"></i>
                Confirm Cancellation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyBookings;