import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container, Card, Button, Alert, Row, Col, 
  Badge, ListGroup, Modal, Form, Spinner,
  ButtonGroup, ProgressBar, Accordion, Image
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format, addHours, isAfter, parseISO, differenceInHours } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import Confetti from 'react-confetti';
import { Helmet } from 'react-helmet';

import { bookingAPI } from '../services/api';
import { fetchBookingById } from '../features/bookingSlice';

// CSS
import './BookingConfirmation.css';
const safeFormat = (dateValue, formatStr) => {
  try {
    if (!dateValue) return 'N/A';

    const date =
      typeof dateValue === 'string'
        ? parseISO(dateValue)
        : new Date(dateValue);

    if (isNaN(date.getTime())) return 'N/A';

    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { currentBooking: booking, loading, error } = useSelector(state => state.bookings);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('details');
  const [refundAmount, setRefundAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isCopied, setIsCopied] = useState(false);

  // Fetch booking data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking-confirmation/${bookingId}` } });
      return;
    }

    dispatch(fetchBookingById(bookingId));
    
    // Trigger confetti animation
    if (booking?.status === 'confirmed') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [bookingId, dispatch, isAuthenticated, navigate, booking?.status]);

  // Calculate refund amount and countdown
  useEffect(() => {
    if (booking?.show?.startTime) {
const showTime = booking?.show?.startTime
  ? new Date(booking.show.startTime)
  : null;

if (!showTime || isNaN(showTime.getTime())) return;

      const now = new Date();
      const hoursBeforeShow = Math.max(0, differenceInHours(showTime, now));
      
      // Calculate refund percentage based on time
      let refundPercentage = 0;
      if (hoursBeforeShow > 24) refundPercentage = 1.0;
      else if (hoursBeforeShow > 12) refundPercentage = 0.8;
      else if (hoursBeforeShow > 3) refundPercentage = 0.5;
      
      setRefundAmount((booking.finalAmount || booking.totalAmount || 0) * refundPercentage);

      // Start countdown timer
      const updateCountdown = () => {
        const now = new Date();
        const diff = showTime - now;
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [booking]);

  // Check if user can access this booking
  const canAccess = useCallback(() => {
    if (!user || !booking) return false;
    
    // Admin can access all bookings
    if (user.isAdmin || user.role === 'admin') return true;
    
    // User can access their own bookings
    const bookingUserId = booking.user?._id || booking.user;
    return bookingUserId === user._id;
  }, [user, booking]);

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      toast.warning('Please provide a cancellation reason', {
        icon: '⚠️',
        position: 'top-center'
      });
      return;
    }

    try {
      setCancelling(true);
      const response = await bookingAPI.cancelBooking(bookingId, cancellationReason);
      
      if (response.success) {
        toast.success('Booking cancelled successfully!', {
          icon: '✅',
          position: 'top-center',
          autoClose: 3000
        });
        
        setShowCancelModal(false);
        setCancellationReason('');
        
        // Refresh booking data
        dispatch(fetchBookingById(bookingId));
        
        setTimeout(() => {
          navigate('/my-bookings');
        }, 1500);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error(error.message || 'Failed to cancel booking', {
        icon: '❌',
        position: 'top-center'
      });
    } finally {
      setCancelling(false);
    }
  };

  const printTicket = () => {
    const printWindow = window.open('', '_blank');
    const ticketContent = document.getElementById('ticket-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${booking?.show?.movie?.title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { padding: 20px; font-family: Arial, sans-serif; }
          .ticket-print { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .mb-3 { margin-bottom: 1rem; }
          .mt-3 { margin-top: 1rem; }
          .fw-bold { font-weight: bold; }
          .qr-code { width: 200px; height: 200px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="ticket-print">
          ${ticketContent}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareTicket = async () => {
    const shareData = {
      title: `🎬 ${booking?.show?.movie?.title} - Movie Ticket`,
      text: `I've booked tickets for ${booking?.show?.movie?.title} at ${booking?.show?.theater?.name} on ${safeFormat(booking.show?.date, 'MMM dd')
} ${format(parseISO(booking?.show?.startTime), 'h:mm a')}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Ticket shared successfully!', {
          icon: '📤',
          position: 'bottom-right'
        });
      } catch (error) {
        console.log('Sharing cancelled:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        toast.success('Ticket link copied to clipboard!', {
          icon: '📋',
          position: 'bottom-right'
        });
        
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy link', {
          icon: '❌',
          position: 'bottom-right'
        });
      }
    }
  };

  const downloadTicket = () => {
    const element = document.createElement('a');
    const ticketData = `
      Movie: ${booking?.show?.movie?.title}
      Theater: ${booking?.show?.theater?.name}
      Screen: ${booking?.show?.screen}
      Date: ${safeFormat(booking?.show?.date, 'MMM dd')
}
      Time: ${safeFormat(booking?.show?.startTime, 'h:mm a')
}
      Seats: ${booking?.seats?.map(s => s.seatNumber).join(', ')}
      Ticket Number: ${booking?.ticketNumber}
      Total Amount: ₹${booking?.finalAmount || booking?.totalAmount}
      Status: ${booking?.status}
      
      Thank you for booking with CineBook!
    `;
    
    const file = new Blob([ticketData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ticket-${booking?.ticketNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Ticket downloaded!', {
      icon: '📥',
      position: 'bottom-right'
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      confirmed: { bg: 'success', text: '✅ Confirmed', icon: 'check-circle' },
      pending: { bg: 'warning', text: '⏳ Pending', icon: 'clock' },
      cancelled: { bg: 'danger', text: '❌ Cancelled', icon: 'times-circle' },
      completed: { bg: 'info', text: '🎬 Completed', icon: 'film' }
    };
    
    const config = configs[status] || { bg: 'secondary', text: status, icon: 'info-circle' };
    
    return (
      <Badge bg={config.bg} className="px-3 py-2 fw-normal d-inline-flex align-items-center gap-1">
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const configs = {
      completed: { bg: 'success', text: '💳 Paid', icon: 'check-circle' },
      pending: { bg: 'warning', text: '⏳ Pending', icon: 'clock' },
      failed: { bg: 'danger', text: '❌ Failed', icon: 'times-circle' },
      refunded: { bg: 'info', text: '↩️ Refunded', icon: 'undo' }
    };
    
    const config = configs[status] || { bg: 'secondary', text: status, icon: 'info-circle' };
    
    return (
      <Badge bg={config.bg} className="px-3 py-2 fw-normal d-inline-flex align-items-center gap-1">
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  const getSeatBadgeColor = (type) => {
    const colors = {
      vip: 'danger',
      premium: 'warning',
      executive: 'info',
      regular: 'success'
    };
    return colors[type] || 'secondary';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading your booking...</p>
        <p className="text-muted small">This may take a moment</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert variant="light" className="empty-state-card text-center border-0">
            <div className="empty-state-icon mb-4">
              <i className="fas fa-exclamation-triangle text-warning"></i>
            </div>
            <h3 className="font-family-sans-serif mb-3">Error Loading Booking</h3>
            <p className="text-muted mb-4">{error}</p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button 
                variant="danger" 
                onClick={() => dispatch(fetchBookingById(bookingId))}
                className="book-btn-modern"
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={() => navigate('/my-bookings')}
                className="rounded-pill px-4"
              >
                Go to My Bookings
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/')}
                className="rounded-pill px-4"
              >
                <i className="fas fa-home me-2"></i>
                Home
              </Button>
            </div>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  // No booking found
  if (!booking) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center border-0 shadow-sm">
          <div className="empty-state-icon mb-4 mx-auto">
            <i className="fas fa-ticket-alt text-warning"></i>
          </div>
          <h3 className="font-family-sans-serif mb-3">Booking Not Found</h3>
          <p className="mb-4">The booking you're looking for doesn't exist or has been deleted.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="primary" 
              onClick={() => navigate('/my-bookings')}
              className="rounded-pill px-4"
            >
              <i className="fas fa-arrow-left me-2"></i>
              My Bookings
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/movies')}
              className="rounded-pill px-4"
            >
              <i className="fas fa-film me-2"></i>
              Browse Movies
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Check access permissions
  if (!canAccess()) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center border-0 shadow-sm">
          <div className="empty-state-icon mb-4 mx-auto">
            <i className="fas fa-ban text-danger"></i>
          </div>
          <h3 className="font-family-sans-serif mb-3">Access Denied</h3>
          <p className="mb-4">You are not authorized to view this booking.</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/my-bookings')}
            className="rounded-pill px-4"
          >
            Go to My Bookings
          </Button>
        </Alert>
      </Container>
    );
  }

 const showTime = booking?.show?.startTime
  ? new Date(booking.show.startTime)
  : null;

  const isUpcoming = showTime && isAfter(showTime, new Date());
  const canCancel = booking.status === 'confirmed' && isUpcoming;
  const movieTitle = booking?.show?.movie?.title || 'Movie';
  const theaterName = booking?.show?.theater?.name || 'Theater';

  return (
    <>
      <Helmet>
        <title>Booking Confirmation - {movieTitle} | CineBook</title>
        <meta name="description" content={`Your ticket for ${movieTitle} at ${theaterName}`} />
      </Helmet>

      <div className="font-family-base">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={300}
            gravity={0.15}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}

        {/* Hero Header */}
        <div className="confirmation-hero-section py-5 mb-5">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white text-center"
            >
              <motion.div
                className="success-icon mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 1.5, repeat: 0 }}
              >
                <i className="fas fa-check-circle"></i>
              </motion.div>
              
              <h1 className="display-5 fw-bold mb-3 font-family-sans-serif">
                {booking.status === 'cancelled' ? 'Booking Cancelled' : 'Booking Confirmed!'}
              </h1>
              
              <p className="lead opacity-90 mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {booking.status === 'cancelled' 
                  ? 'Your booking has been cancelled.'
                  : `Your tickets for ${movieTitle} are ready`
                }
              </p>
              
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Badge bg="warning" className="px-3 py-2 fs-6 d-flex align-items-center">
                  <i className="fas fa-ticket-alt me-2"></i>
                  Ticket #{booking.ticketNumber}
                </Badge>
                <Badge bg="info" className="px-3 py-2 fs-6 d-flex align-items-center">
                  <i className="fas fa-calendar-alt me-2"></i>
                  {booking.show?.date ? format(parseISO(booking.show.date), 'MMM dd') : 'Date N/A'}
                </Badge>
                <Badge bg="success" className="px-3 py-2 fs-6 d-flex align-items-center">
                  <i className="fas fa-clock me-2"></i>
                  {showTime ? format(showTime, 'h:mm a') : 'Time N/A'}
                </Badge>
              </div>
            </motion.div>
          </Container>
        </div>

        <Container id="ticket-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="ticket-card-modern border-0 shadow-lg overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                <Row>
                  {/* Left Column - Ticket Details */}
                  <Col lg={8}>
                    {/* Status & Actions */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
                      <div className="d-flex flex-wrap gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                      
                      <ButtonGroup className="d-flex flex-wrap gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3 d-flex align-items-center"
                          onClick={printTicket}
                        >
                          <i className="fas fa-print me-2"></i>
                          Print
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3 d-flex align-items-center"
                          onClick={shareTicket}
                        >
                          <i className={`fas ${isCopied ? 'fa-check' : 'fa-share-alt'} me-2`}></i>
                          {isCopied ? 'Copied!' : 'Share'}
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="rounded-pill px-3 d-flex align-items-center"
                          onClick={downloadTicket}
                        >
                          <i className="fas fa-download me-2"></i>
                          Download
                        </Button>
                      </ButtonGroup>
                    </div>

                    {/* Movie Header */}
                    <div className="d-flex flex-column flex-md-row align-items-start mb-5">
                      <div className="movie-poster-confirmation mb-3 mb-md-0 me-md-4">
                        <Image
                          src={booking.show?.movie?.posterUrl || 'https://via.placeholder.com/120x180?text=Movie'}
                          alt={movieTitle}
                          className="rounded-4 shadow-sm"
                          style={{ width: '120px', height: '180px', objectFit: 'cover' }}
                          fluid
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/120x180?text=Movie';
                          }}
                        />
                        {booking.show?.movie?.isFeatured && (
                          <div className="featured-badge">
                            <i className="fas fa-star"></i>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow-1">
                        <h2 className="font-family-sans-serif mb-2">{movieTitle}</h2>
                        
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {booking.show?.movie?.genre?.map((genre, index) => (
                            <Badge key={index} className="genre-badge" bg="light" text="dark">
                              {genre}
                            </Badge>
                          )) || <Badge bg="secondary">No genres</Badge>}
                          
                          <Badge bg="info" className="text-white">
                            {booking.show?.movie?.language || 'Language N/A'}
                          </Badge>
                          
                          <Badge bg="dark" className="text-white">
                            {formatDuration(booking.show?.movie?.duration)}
                          </Badge>
                        </div>
                        
                        <p className="text-muted mb-0">
                          {booking.show?.movie?.description?.substring(0, 200) || 'No description available'}...
                        </p>
                      </div>
                    </div>

                    {/* Show Details Accordion */}
                    <Accordion activeKey={activeAccordion} onSelect={setActiveAccordion} className="mb-4">
                      <Accordion.Item eventKey="details">
                        <Accordion.Header className="fw-semibold">
                          <i className="fas fa-info-circle me-2 text-primary"></i>
                          Show Details
                        </Accordion.Header>
                        <Accordion.Body>
                          <Row>
                            <Col md={6}>
                              <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span className="fw-semibold">
                                    <i className="fas fa-building me-2 text-primary"></i>
                                    Theater
                                  </span>
                                  <span className="text-end">
                                    <div>{theaterName}</div>
                                    <small className="text-muted">
                                      {booking.show?.theater?.location?.address || 'Address not available'}
                                    </small>
                                  </span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span className="fw-semibold">
                                    <i className="fas fa-film me-2 text-primary"></i>
                                    Screen
                                  </span>
                                  <span>Screen {booking.show?.screen || 'N/A'}</span>
                                </ListGroup.Item>
                              </ListGroup>
                            </Col>
                            <Col md={6}>
                              <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span className="fw-semibold">
                                    <i className="fas fa-calendar-alt me-2 text-primary"></i>
                                    Date
                                  </span>
                                  <span>{booking.show?.date ? format(parseISO(booking.show.date), 'EEEE, MMMM dd, yyyy') : 'Date not set'}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-3">
                                  <span className="fw-semibold">
                                    <i className="fas fa-clock me-2 text-primary"></i>
                                    Show Time
                                  </span>
                                  <div className="text-end">
                                    <div className="text-danger fw-bold">
                                      {showTime ? format(showTime, 'h:mm a') : 'Time not set'}
                                    </div>
                                    {booking.show?.movie?.duration && showTime && (
                                      <small className="text-muted">
                                        Ends {format(addHours(showTime, Math.floor(booking.show.movie.duration / 60)), 'h:mm a')}
                                      </small>
                                    )}
                                  </div>
                                </ListGroup.Item>
                              </ListGroup>
                            </Col>
                          </Row>
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="seats">
                        <Accordion.Header className="fw-semibold">
                          <i className="fas fa-chair me-2 text-warning"></i>
                          Seat Details ({booking.seats?.length || 0})
                        </Accordion.Header>
                        <Accordion.Body>
                          {booking.seats?.length > 0 ? (
                            <div className="selected-seats-grid">
                              {booking.seats.map((seat, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="selected-seat-card"
                                >
                                  <div className="seat-card-header">
                                    <div className="seat-number-large">{seat.seatNumber}</div>
                                    <Badge bg={getSeatBadgeColor(seat.type)}>
                                      {seat.type?.toUpperCase() || 'SEAT'}
                                    </Badge>
                                  </div>
                                  <div className="seat-card-body">
                                    <div className="seat-price">
                                      <i className="fas fa-rupee-sign me-1"></i>
                                      {seat.price || 0}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <Alert variant="light" className="text-center border-0">
                              <i className="fas fa-chair fa-2x text-muted mb-3"></i>
                              <p className="mb-0">No seat information available</p>
                            </Alert>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="payment">
                        <Accordion.Header className="fw-semibold">
                          <i className="fas fa-credit-card me-2 text-success"></i>
                          Payment Details
                        </Accordion.Header>
                        <Accordion.Body>
                          <Card className="payment-details-card border-0">
                            <Card.Body className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="mb-0 fw-bold">Payment Summary</h6>
                                <Badge bg="success" className="px-3 py-2 text-white">
                                  {booking.paymentMethod?.toUpperCase() || 'N/A'}
                                </Badge>
                              </div>
                              
                              <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span className="text-muted">Ticket Price</span>
                                  <span className="fw-semibold">₹{booking.totalAmount?.toFixed(2) || '0.00'}</span>
                                </ListGroup.Item>
                                
                                {booking.discount > 0 && (
                                  <ListGroup.Item className="d-flex justify-content-between border-0 py-2 text-success">
                                    <span className="text-muted">Discount</span>
                                    <span className="fw-semibold">-₹{booking.discount.toFixed(2)}</span>
                                  </ListGroup.Item>
                                )}
                                
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span className="text-muted">Convenience Fee</span>
                                  <span className="fw-semibold">₹{(booking.totalAmount * 0.05).toFixed(2)}</span>
                                </ListGroup.Item>
                                
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span className="text-muted">Tax (18% GST)</span>
                                  <span className="fw-semibold">₹{(booking.gstAmount || (booking.totalAmount * 0.18)).toFixed(2)}</span>
                                </ListGroup.Item>
                                
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2 mt-3 pt-3 bg-light rounded-3">
                                  <span className="fw-bold">Total Amount Paid</span>
                                  <span className="fw-bold text-danger fs-5">
                                    ₹{booking.finalAmount?.toFixed(2) || booking.totalAmount?.toFixed(2) || '0.00'}
                                  </span>
                                </ListGroup.Item>
                              </ListGroup>

                              {booking.transactionId && (
                                <div className="transaction-info mt-4 p-3 bg-light rounded-3">
                                  <small className="text-muted d-flex align-items-center">
                                    <i className="fas fa-receipt me-2"></i>
                                    Transaction ID: <span className="fw-semibold ms-2">{booking.transactionId}</span>
                                  </small>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>

                    {/* Important Instructions */}
                    <Alert variant="light" className="border-0 shadow-sm">
                      <h6 className="mb-3 fw-bold">
                        <i className="fas fa-exclamation-circle me-2 text-warning"></i>
                        Important Instructions
                      </h6>
                      <Row>
                        <Col md={6}>
                          <ul className="mb-0">
                            <li>Arrive 30 minutes before showtime</li>
                            <li>Carry valid ID proof for verification</li>
                            <li>Show this ticket at the entrance</li>
                          </ul>
                        </Col>
                        <Col md={6}>
                          <ul className="mb-0">
                            <li>No outside food or beverages</li>
                            <li>Mobile phones on silent mode</li>
                            <li>Ticket valid for 1 entry only</li>
                          </ul>
                        </Col>
                      </Row>
                    </Alert>
                  </Col>

                  {/* Right Column - QR Code & Actions */}
                  <Col lg={4}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="sticky-top"
                      style={{ top: '20px' }}
                    >
                      {/* QR Code */}
                      <Card className="qr-card-modern border-0 shadow-lg mb-4">
                        <Card.Body className="text-center p-4">
                          <div className="qr-container mb-3">
                            <QRCodeSVG 
                              value={JSON.stringify({
                                bookingId: booking._id,
                                ticketNumber: booking.ticketNumber,
                                movie: movieTitle,
                                theater: theaterName,
                                screen: booking.show?.screen || 1,
                                showTime: booking.show?.startTime,
                                seats: booking.seats?.map(s => s.seatNumber) || []
                              })}
                              size={200}
                              level="H"
                              includeMargin={true}
                              className="qr-code"
                            />
                          </div>
                          <h6 className="fw-bold mb-2">Scan at Entry</h6>
                          <p className="text-muted small mb-0">
                            Show this QR code at theater entrance for quick entry
                          </p>
                        </Card.Body>
                      </Card>

                      {/* Quick Actions */}
                      <Card className="actions-card-modern border-0 shadow-lg mb-4">
                        <Card.Body className="p-4">
                          <h6 className="font-family-sans-serif mb-3 fw-bold">
                            <i className="fas fa-bolt me-2 text-primary"></i>
                            Quick Actions
                          </h6>
                          <div className="d-grid gap-2">
                            <Button
                              variant="primary"
                              as={Link}
                              to={`/movies/${booking.show?.movie?._id || '#'}`}
                              className="action-btn py-2"
                            >
                              <i className="fas fa-film me-2"></i>
                              View Movie Details
                            </Button>
                            
                            <Button
                              variant="outline-primary"
                              as={Link}
                              to={`/theaters/${booking.show?.theater?._id || '#'}`}
                              className="action-btn py-2"
                            >
                              <i className="fas fa-building me-2"></i>
                              Theater Information
                            </Button>
                            
                            <Button
                              variant="outline-success"
                              as={Link}
                              to="/my-bookings"
                              className="action-btn py-2"
                            >
                              <i className="fas fa-ticket-alt me-2"></i>
                              All My Bookings
                            </Button>
                            
                            {canCancel && (
                              <Button
                                variant="outline-danger"
                                onClick={() => setShowCancelModal(true)}
                                className="action-btn py-2"
                              >
                                <i className="fas fa-times-circle me-2"></i>
                                Cancel Booking
                              </Button>
                            )}
                            
                            <Button
                              variant="outline-secondary"
                              onClick={() => navigate('/movies')}
                              className="action-btn py-2"
                            >
                              <i className="fas fa-plus-circle me-2"></i>
                              Book More Tickets
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>

                      {/* Show Time Countdown */}
                      {isUpcoming && (
                        <Card className="countdown-card-modern border-0 shadow-lg mb-4">
                          <Card.Body className="p-4">
                            <h6 className="font-family-sans-serif mb-3 fw-bold">
                              <i className="fas fa-hourglass-half me-2 text-warning"></i>
                              Show Starts In
                            </h6>
                            <div className="text-center">
                              <div className="countdown-display mb-3">
                                {timeLeft.hours.toString().padStart(2, '0')}:
                                {timeLeft.minutes.toString().padStart(2, '0')}:
                                {timeLeft.seconds.toString().padStart(2, '0')}
                              </div>
                              <ProgressBar 
                                now={Math.max(0, Math.min(100, 100 - (timeLeft.hours / 24 * 100)))} 
                                variant="warning"
                                style={{ height: '8px', borderRadius: '4px' }}
                              />
                              <small className="text-muted mt-3 d-block">
                                <i className="fas fa-info-circle me-1"></i>
                                Arrive 30 minutes early for hassle-free entry
                              </small>
                            </div>
                          </Card.Body>
                        </Card>
                      )}

                      {/* Support */}
                      <Card className="support-card-modern border-0 shadow-lg">
                        <Card.Body className="p-4">
                          <h6 className="font-family-sans-serif mb-3 fw-bold">
                            <i className="fas fa-headset me-2 text-info"></i>
                            Need Help?
                          </h6>
                          <div className="support-options">
                            <div className="mb-3">
                              <Button
                                variant="link"
                                className="text-start p-0 d-flex align-items-center text-decoration-none text-dark"
                                as={Link}
                                to="/help"
                              >
                                <i className="fas fa-question-circle me-2 text-primary fs-5"></i>
                                <div>
                                  <div className="fw-semibold">FAQ & Help Center</div>
                                  <small className="text-muted">Find answers to common questions</small>
                                </div>
                              </Button>
                            </div>
                            <div className="mb-3">
                              <Button
                                variant="link"
                                className="text-start p-0 d-flex align-items-center text-decoration-none text-dark"
                                href="tel:18001234567"
                              >
                                <i className="fas fa-phone me-2 text-success fs-5"></i>
                                <div>
                                  <div className="fw-semibold">Call Support</div>
                                  <small className="text-muted">1800-123-4567</small>
                                </div>
                              </Button>
                            </div>
                            <div>
                              <Button
                                variant="link"
                                className="text-start p-0 d-flex align-items-center text-decoration-none text-dark"
                                href="mailto:support@cinebook.com"
                              >
                                <i className="fas fa-envelope me-2 text-info fs-5"></i>
                                <div>
                                  <div className="fw-semibold">Email Support</div>
                                  <small className="text-muted">support@cinebook.com</small>
                                </div>
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                </Row>
              </Card.Body>
              
              <Card.Footer className="ticket-footer border-0">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Booking ID: {booking._id} • Created: {booking.bookingDate ? safeFormat(booking.bookingDate, 'MMM dd, yyyy h:mm a')
: 'N/A'}
                  </small>
                  {showTime && (
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Ticket valid until {format(addHours(showTime, 1), 'h:mm a')}
                    </small>
                  )}
                </div>
              </Card.Footer>
            </Card>
          </motion.div>
        </Container>

        {/* Cancellation Modal */}
        <Modal
          show={showCancelModal}
          onHide={() => setShowCancelModal(false)}
          centered
          size="lg"
          backdrop="static"
          className="cancellation-modal-modern"
        >
          <Modal.Header closeButton className="border-0 bg-light">
            <Modal.Title className="font-family-sans-serif fw-bold">
              <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
              Cancel Booking
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="p-4">
            <Alert variant="warning" className="border-0 bg-warning bg-opacity-10 mb-4">
              <div className="d-flex align-items-start">
                <i className="fas fa-info-circle fa-lg me-3 text-warning mt-1"></i>
                <div>
                  <h6 className="fw-bold mb-2">Cancellation Policy</h6>
                  <p className="mb-0">
                    {refundAmount > 0 
                      ? `You will receive a refund of ₹${refundAmount.toFixed(2)} based on our cancellation policy.`
                      : 'No refund available as showtime is within 3 hours. You can transfer this ticket to another person.'}
                  </p>
                </div>
              </div>
            </Alert>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold mb-2">
                <i className="fas fa-comment-dots me-2 text-danger"></i>
                Reason for Cancellation
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Please let us know why you're cancelling..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="form-control-modern border-2"
                style={{ minHeight: '100px' }}
              />
              <Form.Text className="text-muted">
                Your feedback helps us improve our service
              </Form.Text>
            </Form.Group>

            {refundAmount > 0 && (
              <div className="refund-summary p-4 bg-light rounded-4 border mb-4">
                <h6 className="fw-bold mb-3">Refund Summary</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Amount Paid</span>
                  <span className="fw-semibold">₹{(booking.finalAmount || booking.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Cancellation Charges</span>
                  <span className="text-danger fw-semibold">
                    -₹{((booking.finalAmount || booking.totalAmount || 0) - refundAmount).toFixed(2)}
                  </span>
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">Refund Amount</div>
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Processed in 5-7 business days
                    </small>
                  </div>
                  <span className="text-success fw-bold fs-4">₹{refundAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </Modal.Body>
          
          <Modal.Footer className="border-0 bg-light p-4">
            <Button
              variant="outline-secondary"
              onClick={() => setShowCancelModal(false)}
              className="rounded-pill px-4 py-2"
            >
              <i className="fas fa-arrow-left me-2"></i>
              Keep Booking
            </Button>
            
            <Button
              variant="danger"
              onClick={handleCancelBooking}
              disabled={cancelling || !cancellationReason.trim()}
              className="rounded-pill px-5 py-2"
            >
              {cancelling ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
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

        {/* Share Success Modal */}
        <Modal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          centered
          size="sm"
        >
          <Modal.Body className="text-center p-5">
            <div className="share-icon mb-4">
              <motion.i 
                className="fas fa-check-circle fa-4x text-success"
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              ></motion.i>
            </div>
            <h5 className="fw-bold mb-3">Link Copied!</h5>
            <p className="text-muted mb-4">
              Ticket link has been copied to your clipboard. Share it with your friends.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowShareModal(false)}
              className="rounded-pill px-4 py-2"
            >
              Got it!
            </Button>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default BookingConfirmation;