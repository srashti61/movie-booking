// client/src/pages/Booking.js
import React, { useState, useEffect, useCallback } from 'react';

import {
  Container, Row, Col, Card, Button, Alert,
  ListGroup, Badge, Form, Spinner,
  Modal, Accordion
} from 'react-bootstrap';

import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Confetti from 'react-confetti';

// API
import { showAPI, bookingAPI } from '../services/api';
import { createBooking } from '../features/bookingSlice';

// CSS
import './Booking.css';

// Booking.js-ல் state variables-ன் list-ல் இதை சேர்க்கவும்
const Booking = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { loading: bookingLoading } = useSelector(state => state.bookings);
  
  // State
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState(1); // 1: Select seats, 2: Confirm, 3: Payment, 4: Success
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [showConfetti, setShowConfetti] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [seatHoverInfo, setSeatHoverInfo] = useState(null);

  // Animation states
  const [selectedSeatAnimation, setSelectedSeatAnimation] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ✅ Add bookingData state here (before the functions)
  const [bookingData, setBookingData] = useState(null);
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/booking/${showId}`,
          message: 'Please login to book tickets'
        }
      });
    }
  }, [isAuthenticated, navigate, showId]);

  // Fetch show details



  // Calculate amounts when selections change
  useEffect(() => {
    const basePrice = totalPrice;
    const fee = basePrice * 0.05; // 5% convenience fee
    const taxAmount = basePrice * 0.18; // 18% GST
    const discountedPrice = basePrice - discount;
    const final = Math.max(0, discountedPrice + fee + taxAmount);
    
    setConvenienceFee(fee);
    setTax(taxAmount);
    setFinalAmount(final);
  }, [totalPrice, discount]);
const initializeSeatLayout = (showData) => {
  if (!showData) return;

const seatCounts = showData.seatCounts && Object.values(showData.seatCounts).some(v => v > 0)
  ? showData.seatCounts
  : {
      regular: showData.totalSeats || 50,
      premium: 0,
      vip: 0,
      balcony: 0
    };

  const seatsLimit = showData.seatsLimit || 0;
  const totalSeats =
    Object.values(seatCounts).reduce((a, b) => a + b, 0);

  const maxSeatsToShow =
    seatsLimit > 0 ? Math.min(seatsLimit, totalSeats) : totalSeats;

  const layout = [];
  let rowIndex = 0;
  let seatsCreated = 0;
  const MAX_PER_ROW = 12;

  const createSeatsByType = (type, count) => {
    for (let i = 0; i < count && seatsCreated < maxSeatsToShow; i++) {

      if (!layout[rowIndex]) layout[rowIndex] = [];

      const colIndex = layout[rowIndex].length;
      const seatNumber = getSeatNumber(rowIndex, colIndex);

      const isBooked =
        showData.bookedSeats?.some(b => b.seatNumber === seatNumber) || false;

      layout[rowIndex].push({
        row: rowIndex,
        col: colIndex,
        seatNumber,
        type,
        price: getPriceByType(type, showData),
        section: getSectionByType(type),
        isBooked,
        isSelected: false,
        isHovered: false
      });

      seatsCreated++;

      if (layout[rowIndex].length === MAX_PER_ROW) {
        rowIndex++;
      }
    }
  };

  // 👇 ORDER IMPORTANT (as you want)
  ['vip', 'premium', 'balcony', 'regular'].forEach(type => {
    createSeatsByType(type, seatCounts[type] || 0);
  });

  console.log('Seat layout created:', layout);

  setSeatLayout(layout);
  setSelectedSeats([]);
  setTotalPrice(0);
};
 const fetchShowDetails = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await showAPI.getShowById(showId);

    if (!response.show) {
      throw new Error('Show not found');
    }

    const showData = response.show;

    if (!showData.price) {
      showData.price = {
        regular: 200,
        premium: 300,
        vip: 500,
        balcony: 250
      };
    }

    if (showData.seatsLimit === undefined) {
      showData.seatsLimit = 0;
    }

    setShow(showData);
    initializeSeatLayout(showData);

  } catch (err) {
    const errorMsg =
      err.response?.data?.message || err.message || 'Failed to load show details';

    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
}, [showId]);

useEffect(() => {
  fetchShowDetails();

  return () => {
    setSelectedSeats([]);
    setSeatLayout([]);
  };
}, [fetchShowDetails]);



  const getSeatNumber = (row, col) => {
    const rowLetter = String.fromCharCode(65 + row);
    return `${rowLetter}${col + 1}`;
  };

const getPriceByType = (type, showData) => {
  const price = showData.price || {};
  switch (type) {
    case 'vip': return price.vip ?? 500;
    case 'premium': return price.premium ?? 300;
    case 'balcony': return price.balcony ?? 250;
    default: return price.regular ?? 200;
  }
};



  const getSectionByType = (type) => {
    switch(type) {
      case 'vip': return 'VIP';
      case 'premium': return 'Premium';
      case 'balcony': return 'Balcony';
      default: return 'Standard';
    }
  };



  const handleSeatClick = (row, col) => {
    if (!seatLayout[row] || !seatLayout[row][col]) {
      toast.error('Seat not found');
      return;
    }
    
    const seat = seatLayout[row][col];
    
    // Check if seat is booked
    if (seat.isBooked) {
      toast.warning('This seat is already booked', {
        icon: '⚠️',
        position: 'top-center'
      });
      return;
    }
    
    // Check seats limit before selecting new seat
    if (show?.seatsLimit && selectedSeats.length >= show.seatsLimit) {
      toast.warning(`Maximum ${show.seatsLimit} seats allowed for this show`, {
        icon: '🚫',
        position: 'top-center'
      });
      return;
    }
const layoutCopy = seatLayout.map(r => r.map(s => ({ ...s })));
const clickedSeat = layoutCopy[row][col];
clickedSeat.isSelected = !clickedSeat.isSelected;
setSeatLayout(layoutCopy);


    
    if (clickedSeat.isSelected) {
      // Add to selected seats
      const newSeat = {
        seatNumber: clickedSeat.seatNumber,
        row,
        col,
        type: clickedSeat.type,
        price: clickedSeat.price,
        section: clickedSeat.section
      };
      
      setSelectedSeats(prev => [...prev, newSeat]);
      setTotalPrice(prev => prev + clickedSeat.price);
      
      // Animation effect
      setSelectedSeatAnimation({ row, col });
      setTimeout(() => setSelectedSeatAnimation(null), 300);
      
      // Success message with seat info
      toast.success(
        <div>
          <strong>Seat {clickedSeat.seatNumber} selected</strong>
          <div>Type: {clickedSeat.type.toUpperCase()}</div>
          <div>Price: ₹{clickedSeat.price}</div>
          <div>Section: {clickedSeat.section}</div>
        </div>, 
        {
          icon: '🎟️',
          position: 'top-right',
          autoClose: 2000
        }
      );
    } else {
      // Remove from selected seats
      const removedSeat = selectedSeats.find(s => s.row === row && s.col === col);
      if (removedSeat) {
        setSelectedSeats(prev => prev.filter(s => !(s.row === row && s.col === col)));
        setTotalPrice(prev => prev - removedSeat.price);
        
        toast.info(`Removed seat ${removedSeat.seatNumber}`, {
          icon: '↩️',
          position: 'top-right',
          autoClose: 1500
        });
      }
    }
  };

  const handleSeatHover = (row, col, isHovered) => {
    if (seatLayout[row] && seatLayout[row][col]) {
      const updatedLayout = [...seatLayout];
      updatedLayout[row][col].isHovered = isHovered;
      setSeatLayout(updatedLayout);
      
      if (isHovered) {
        const seat = seatLayout[row][col];
        setSeatHoverInfo({
          seatNumber: seat.seatNumber,
          type: seat.type,
          price: seat.price,
          section: seat.section,
          isBooked: seat.isBooked,
          position: { row, col }
        });
      } else {
        setSeatHoverInfo(null);
      }
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code', {
        icon: '❌'
      });
      return;
    }
    
    const coupons = {
      'WELCOME10': 0.1, // 10% discount
      'MOVIE20': 0.2,   // 20% discount
      'FIRST50': 50,    // ₹50 off
      'PREMIUM30': 0.3,  // 30% discount
      'MOVIE25': 0.25   // 25% discount
    };
    
    const couponKey = couponCode.toUpperCase();
    
    if (coupons[couponKey]) {
      const coupon = coupons[couponKey];
      let discountAmount;
      
      if (typeof coupon === 'number') {
        discountAmount = Math.min(coupon, totalPrice);
      } else {
        discountAmount = totalPrice * coupon;
      }
      
      setDiscount(discountAmount);
      toast.success(
        <div>
          <strong>Coupon Applied!</strong>
          <div>You saved ₹{discountAmount.toFixed(2)}</div>
          <div>Code: {couponCode.toUpperCase()}</div>
        </div>, 
        {
          icon: '🎉',
          autoClose: 3000
        }
      );
    } else {
      toast.error('Invalid coupon code. Try: WELCOME10, MOVIE20, FIRST50, PREMIUM30', {
        icon: '❌'
      });
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat', {
        position: "top-center",
        icon: '🎟️'
      });
      return;
    }
    setStep(2);
  };

// handleConfirmBooking-ஐ இப்படி மாற்றவும்
const handleConfirmBooking = async () => {
  try {
    // Check seat availability before proceeding
    if (!show || !show._id) {
      toast.error('Show information not found');
      return;
    }
    
    // Check if seats are still available
const availabilityCheck = await showAPI.checkSeatAvailability(show._id, selectedSeats.map(s => s.seatNumber));
    if (!availabilityCheck.available) {
      toast.error(
        <div>
          <strong>Seats No Longer Available</strong>
          <div>Some selected seats have been booked by others. Please select different seats.</div>
        </div>,
        { icon: '❌' }
      );
      
      // Refresh seat layout
      fetchShowDetails();
      return;
    }

    // Store booking data in state for payment step
    const bookingDataForPayment = {
      show: show._id,
      seats: selectedSeats.map(seat => ({
        seatNumber: seat.seatNumber,
        row: seat.row,
        col: seat.col,
        type: seat.type,
        price: seat.price
      })),
      totalAmount: totalPrice, // Base amount only
      finalAmount: finalAmount, // Total with charges
      paymentMethod
    };

    console.log('Preparing payment for booking:', bookingDataForPayment);

    // Store booking data in state for payment step
    setBookingData(bookingDataForPayment);
    
    toast.success(
      <div>
        <strong>Booking Prepared Successfully!</strong>
        <div>Proceeding to payment...</div>
      </div>,
      { icon: '🎬', position: 'top-center', autoClose: 1500 }
    );

    setStep(3);

  } catch (err) {
    const msg =
      typeof err === 'string'
        ? err
        : err?.response?.data?.message || 'Failed to prepare booking';

    toast.error(
      <div>
        <strong>Booking Preparation Failed</strong>
        <div>{msg}</div>
      </div>,
      { icon: '❌' }
    );

    console.error('Prepare booking error:', err);
    console.log("🚀 Creating booking with data:", bookingData);
  }
};


// handlePayment-ஐ இப்படி மாற்றவும்
const handlePayment = async () => {
  try {
    if (!bookingData) {
      toast.error('Booking data missing');
      return;
    }

    // ✅ 1️⃣ FIRST create booking
    const bookingResponse = await dispatch(
      createBooking({
        ...bookingData,
        paymentMethod
      })
    ).unwrap();

    const createdBooking = bookingResponse.booking;

    // ✅ 2️⃣ THEN process payment using booking ID
    const paymentResponse = await bookingAPI.processPayment(
      createdBooking._id,
      {
        paymentMethod,
        transactionId: `TXN${Date.now()}`
      }
    );

    if (!paymentResponse.success) {
      throw new Error('Payment failed');
    }

    setPaymentSuccess(true);
    setShowConfetti(true);

    toast.success('🎉 Payment successful & Booking confirmed');

    setTimeout(() => {
      navigate(`/booking-confirmation/${createdBooking._id}`);
    }, 2000);

  } catch (err) {
    console.error(err);
    toast.error(err.message || 'Payment failed');
  }
};




  const getSeatVariant = (seat) => {
    if (seat.isBooked) return 'booked';
    if (seat.isSelected) return 'selected';
    if (seat.isHovered) return 'hover';
    if (seat.type === 'vip') return 'vip';
    if (seat.type === 'premium') return 'premium';
    if (seat.type === 'balcony') return 'balcony';
    return 'available';
  };

  const getSeatBadgeColor = (type) => {
    switch(type) {
      case 'vip': return 'danger';
      case 'premium': return 'warning';
      case 'balcony': return 'info';
      case 'executive': return 'primary';
      default: return 'success';
    }
  };

  const getSeatIcon = (type) => {
    switch(type) {
      case 'vip': return '👑';
      case 'premium': return '⭐';
      case 'balcony': return '🌄';
      default: return '💺';
    }
  };

  const handleCancelBooking = () => {
    setSelectedSeats([]);
    setTotalPrice(0);
    setSeatLayout(layout =>
      layout.map(row =>
        row.map(seat => ({ ...seat, isSelected: false }))
      )
    );
    setShowCancelModal(false);
    toast.info('All seat selections cleared', {
      icon: '🔄',
      position: 'top-center'
    });
  };

  // Calculate seat statistics
  const calculateSeatStats = () => {
    const totalSeats = seatLayout.flat().length;
    const bookedSeats = seatLayout.flat().filter(seat => seat.isBooked).length;
    const availableSeats = totalSeats - bookedSeats;
    const selectedCount = selectedSeats.length;
    
    return { totalSeats, bookedSeats, availableSeats, selectedCount };
  };

  const seatStats = calculateSeatStats();

  if (loading) {
    return (
      <div className="loading-overlay">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="spinner-modern"></div>
          <p className="mt-3 fw-semibold">Loading show details...</p>
          <p className="text-muted small">Please wait while we prepare your booking experience</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert variant="light" className="empty-state-card text-center border-0 shadow-lg">
            <div className="empty-state-icon mb-4">
              <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
            </div>
            <h3 className="font-family-sans-serif mb-3">Error Loading Show</h3>
            <p className="text-muted mb-4">{error}</p>
            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="danger"
                onClick={fetchShowDetails}
                className="book-btn-modern"
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => navigate('/movies')}
                className="rounded-pill px-4"
              >
                Browse Movies
              </Button>
            </div>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  if (!show) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert variant="warning" className="text-center border-0 shadow-sm">
            <i className="fas fa-film fa-3x mb-3 text-warning"></i>
            <h3 className="font-family-sans-serif mb-3">Show Not Found</h3>
            <p className="mb-4">The show you're looking for doesn't exist or has been cancelled.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/movies')}
              className="rounded-pill px-4"
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Movies
            </Button>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  return (
    <div className="font-family-base">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Hero Header */}
      <div className="booking-hero-section py-4 mb-5">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="font-family-sans-serif text-white mb-2">
                  <i className="fas fa-ticket-alt me-2"></i>
                  Book Your Tickets
                </h1>
                <div className="d-flex align-items-center text-white opacity-90 flex-wrap">
                  <span className="me-3">
                    <i className="fas fa-film me-2"></i>
                    {show.movie?.title}
                  </span>
                  <span className="me-3">
                    <i className="fas fa-building me-2"></i>
                    {show.theater?.name}
                  </span>
                  <span className="me-3">
                    <i className="fas fa-clock me-2"></i>
                   {show?.startTime
  ? new Date(show.startTime).toLocaleTimeString()
  : '--'}

                  </span>
                  <span>
                    <i className="fas fa-calendar-day me-2"></i>
                {show?.date
  ? new Date(show.date).toLocaleDateString()
  : 'Date not available'}

                  </span>
                </div>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <Badge bg="warning" className="px-3 py-2 fs-6">
                  <i className="fas fa-ticket-alt me-2"></i>
                  Step {step} of 4
                </Badge>
              </Col>
            </Row>
          </motion.div>
        </Container>
      </div>

      <Container>
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-5"
        >
          <div className="booking-progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Select Seats</div>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Review</div>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">Payment</div>
            </div>
            <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 4 ? 'active' : ''}`}>
              <div className="step-circle">4</div>
              <div className="step-label">Confirmation</div>
            </div>
          </div>
        </motion.div>

        <Row>
          {/* Main Content */}
          <Col xl={8} lg={7}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="booking-card-modern border-0 shadow-lg mb-4">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="font-family-sans-serif mb-0">
                          <i className="fas fa-chair me-2 text-danger"></i>
                          Select Your Seats
                        </h2>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="info" className="px-3 py-2 fs-6">
                            <i className="fas fa-ticket-alt me-2"></i>
                            {selectedSeats.length} selected
                          </Badge>
                          {show.seatsLimit > 0 && (
                            <Badge bg="warning" className="px-3 py-2 fs-6">
                              <i className="fas fa-lock me-2"></i>
                              Max: {show.seatsLimit}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Screen Display */}
                      <div className="screen-display text-center mb-5">
                        <div className="screen-curtain"></div>
                        <div className="screen-text">
                          <i className="fas fa-film me-2"></i>
                          SCREEN THIS WAY
                          <div className="screen-subtext">
                            {show.theater?.name} • Screen {show.screen}
                          </div>
                        </div>
                        <div className="screen-base"></div>
                        <div className="mt-4">
                          <Badge bg="success" className="me-3">
                            <i className="fas fa-chair me-1"></i>
                            {seatStats.availableSeats} seats available
                          </Badge>
                          
                          {/* Show seats limit badge */}
                          {show.seatsLimit > 0 && (
                            <Badge bg="warning" className="me-3">
                              <i className="fas fa-ticket-alt me-1"></i>
                              Max {show.seatsLimit} seats for this show
                            </Badge>
                          )}
                          
                          <Badge bg="info" className="me-3">
                            <i className="fas fa-users me-1"></i>
                            {show.bookedSeats?.length || 0} already booked
                          </Badge>
                          
                          <Badge bg="secondary">
                            <i className="fas fa-clock me-1"></i>
                            Selected seats will be held for 10 minutes
                          </Badge>
                        </div>
                      </div>

                      {/* Seat Hover Info Tooltip */}
                      {seatHoverInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="seat-tooltip-card"
                          style={{
                            position: 'absolute',
                            top: seatHoverInfo.position.row * 60 + 100,
                            left: seatHoverInfo.position.col * 60 + 100,
                            zIndex: 1000,
                            background: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: '1px solid #dee2e6',
                            maxWidth: '200px'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div className={`seat-preview ${getSeatVariant(seatHoverInfo)} me-2`}></div>
                            <div>
                              <strong>Seat {seatHoverInfo.seatNumber}</strong>
                              <div className="small">
                                <Badge bg={getSeatBadgeColor(seatHoverInfo.type)} className="me-1">
                                  {seatHoverInfo.type.toUpperCase()}
                                </Badge>
                                <span className="text-danger fw-bold">₹{seatHoverInfo.price}</span>
                              </div>
                              <div className="text-muted small">{seatHoverInfo.section}</div>
                              {seatHoverInfo.isBooked && (
                                <Badge bg="danger" className="mt-1">Booked</Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Seat Layout */}
                      <div className="seat-layout-container position-relative">
                        <div className="seat-layout-grid">
                          {seatLayout.map((row, rowIndex) => (
                            <div key={rowIndex} className="seat-row mb-3">
                              <div className="row-label">
                                {String.fromCharCode(65 + rowIndex)}
                              </div>
                              <div className="seats-wrapper">
                                {row.map((seat, colIndex) => (
                                  <motion.div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`seat-item ${getSeatVariant(seat)} ${
                                      selectedSeatAnimation?.row === rowIndex &&
                                      selectedSeatAnimation?.col === colIndex ? 'animate' : ''
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onMouseEnter={() => handleSeatHover(rowIndex, colIndex, true)}
                                    onMouseLeave={() => handleSeatHover(rowIndex, colIndex, false)}
                                    onClick={() => handleSeatClick(rowIndex, colIndex)}
                                    animate={{
                                      scale: seat.isSelected ? [1, 1.2, 1] : 1,
                                      transition: { duration: 0.3 }
                                    }}
                                  >
                                    <div className="seat-number">{seat.seatNumber}</div>
                                    <div className="seat-price">₹{seat.price}</div>
                                    
                                    {seat.isBooked && (
                                      <div className="seat-booked-overlay">
                                        <i className="fas fa-ban"></i>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Walkway */}
                        <div className="walkway my-4">
                          <div className="walkway-line"></div>
                          <div className="walkway-text">WALKWAY</div>
                          <div className="walkway-subtext">Please maintain aisle clearance</div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="legend-container mt-5">
                        <h5 className="font-family-sans-serif mb-3">
                          <i className="fas fa-info-circle me-2"></i>
                          Seat Legend
                        </h5>
                        <div className="d-flex flex-wrap gap-3">
                          <div className="legend-item">
                            <div className="seat-legend available"></div>
                            <span>Available</span>
                          </div>
                          <div className="legend-item">
                            <div className="seat-legend selected"></div>
                            <span>Selected</span>
                          </div>
                          <div className="legend-item">
                            <div className="seat-legend booked"></div>
                            <span>Booked</span>
                          </div>
                          <div className="legend-item">
                            <div className="seat-legend vip"></div>
                            <span>VIP {getSeatIcon('vip')}</span>
                          </div>
                          <div className="legend-item">
                            <div className="seat-legend premium"></div>
                            <span>Premium {getSeatIcon('premium')}</span>
                          </div>
                          <div className="legend-item">
                            <div className="seat-legend balcony"></div>
                            <span>Balcony {getSeatIcon('balcony')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Seat Stats */}
                      <div className="seat-stats mt-4">
                        <Row>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <div className="stat-number">{seatStats.totalSeats}</div>
                              <div className="stat-label">Total Seats</div>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <div className="stat-number">{seatStats.availableSeats}</div>
                              <div className="stat-label">Available</div>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box">
                              <div className="stat-number">{seatStats.bookedSeats}</div>
                              <div className="stat-label">Booked</div>
                            </div>
                          </Col>
                          <Col md={3} className="text-center">
                            <div className="stat-box selected-stat">
                              <div className="stat-number">{selectedSeats.length}</div>
                              <div className="stat-label">Selected</div>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      {/* Action Buttons */}
<div className="booking-bar d-flex justify-content-between align-items-center mt-4 pt-3">

  <Button
    variant="outline-danger"
    className="clear-btn"
    onClick={() => setShowCancelModal(true)}
    disabled={selectedSeats.length === 0}
  >
    <i className="fas fa-times me-2"></i>
    Clear Selection
  </Button>

  <div className="booking-price text-center px-3">
    <h4 className="m-0 text-danger fw-bold">₹{totalPrice}</h4>
    <small className="text-muted">Base Price</small>
  </div>

  <Button
    variant="danger"
    className="proceed-btn"
    onClick={handleProceed}
    disabled={selectedSeats.length === 0}
  >
    <i className="fas fa-arrow-right me-2"></i>
    Proceed
    <Badge bg="light" text="dark" className="ms-2">
      {selectedSeats.length}
    </Badge>
  </Button>
</div>

                    </Card.Body>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="booking-card-modern border-0 shadow-lg mb-4">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="font-family-sans-serif mb-0">
                          <i className="fas fa-file-invoice me-2 text-danger"></i>
                          Review Your Booking
                        </h2>
                        <Badge bg="warning" className="px-3 py-2 fs-6">
                          Review & Confirm
                        </Badge>
                      </div>

                      <Row>
                        <Col lg={8}>
                          {/* Show Details */}
                          <Card className="info-card-modern mb-4">
                            <Card.Body>
                              <h4 className="font-family-sans-serif mb-3">Show Details</h4>
                              <Row>
                                <Col md={6} className="mb-3">
                                  <div className="detail-item">
                                    <i className="fas fa-film text-danger me-2"></i>
                                    <div>
                                      <div className="text-muted small">Movie</div>
                                      <strong>{show.movie?.title}</strong>
                                      <div className="small text-muted">
                                        {show.movie?.language} • {Math.floor(show.movie?.duration / 60)}h {show.movie?.duration % 60}m
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                  <div className="detail-item">
                                    <i className="fas fa-building text-danger me-2"></i>
                                    <div>
                                      <div className="text-muted small">Theater</div>
                                      <strong>{show.theater?.name}</strong>
                                      <div className="small text-muted">
                                        {show.theater?.location?.address}
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                  <div className="detail-item">
                                    <i className="fas fa-calendar-alt text-danger me-2"></i>
                                    <div>
                                      <div className="text-muted small">Date & Time</div>
                                      <strong>
                                        {format(new Date(show.startTime), 'EEE, MMM dd • h:mm a')}
                                      </strong>
                                      <div className="small text-muted">
                                        Duration: {Math.floor(show.movie?.duration / 60)}h {show.movie?.duration % 60}m
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                  <div className="detail-item">
                                    <i className="fas fa-video text-danger me-2"></i>
                                    <div>
                                      <div className="text-muted small">Screen & Format</div>
                                      <strong>Screen {show.screen} • 2D</strong>
                                      {show.seatsLimit > 0 && (
                                        <div className="small text-warning mt-1">
                                          <i className="fas fa-info-circle me-1"></i>
                                          Seats Limit: {show.seatsLimit} seats
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>

                          {/* Selected Seats */}
                          <Card className="info-card-modern mb-4">
                            <Card.Body>
                              <h4 className="font-family-sans-serif mb-3">
                                Selected Seats ({selectedSeats.length})
                                {show.seatsLimit > 0 && (
                                  <Badge bg="warning" className="ms-2">
                                    Max: {show.seatsLimit}
                                  </Badge>
                                )}
                              </h4>
                              <div className="selected-seats-grid">
                                {selectedSeats.map((seat, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="selected-seat-card"
                                  >
                                    <div className="seat-card-header">
                                      <div className="seat-number-large">{seat.seatNumber}</div>
                                      <Badge bg={getSeatBadgeColor(seat.type)}>
                                        {getSeatIcon(seat.type)} {seat.type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="seat-card-body">
                                      <div className="seat-section">
                                        <i className="fas fa-layer-group me-2"></i>
                                        {seat.section}
                                      </div>
                                      <div className="seat-price">
                                        <i className="fas fa-rupee-sign me-1"></i>
                                        {seat.price}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>

                          {/* Coupon Section */}
                          <Card className="info-card-modern mb-4">
                            <Card.Body>
                              <h4 className="font-family-sans-serif mb-3">
                                <i className="fas fa-tag me-2 text-danger"></i>
                                Apply Coupon
                              </h4>
                              <div className="d-flex gap-2">
                                <Form.Control
                                  type="text"
                                  placeholder="Enter coupon code (WELCOME10, MOVIE20, FIRST50)"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value)}
                                  className="form-control-modern"
                                />
                                <Button
                                  variant="outline-danger"
                                  className="rounded-pill px-4"
                                  onClick={applyCoupon}
                                >
                                  Apply
                                </Button>
                              </div>
                              {discount > 0 && (
                                <Alert variant="success" className="mt-3 border-0">
                                  <i className="fas fa-check-circle me-2"></i>
                                  Coupon applied! You saved ₹{discount.toFixed(2)}
                                </Alert>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col lg={4}>
                          {/* Price Breakdown */}
                          <Card className="price-breakdown-card sticky-top" style={{ top: '20px' }}>
                            <Card.Body>
                              <h4 className="font-family-sans-serif mb-3">Price Breakdown</h4>
                              <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Base Price ({selectedSeats.length} seats)</span>
                                  <span>₹{totalPrice.toFixed(2)}</span>
                                </ListGroup.Item>
                                {discount > 0 && (
                                  <ListGroup.Item className="d-flex justify-content-between border-0 py-2 text-success">
                                    <span>
                                      <i className="fas fa-tag me-1"></i>
                                      Discount
                                    </span>
                                    <span>-₹{discount.toFixed(2)}</span>
                                  </ListGroup.Item>
                                )}
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Convenience Fee (5%)</span>
                                  <span>₹{convenienceFee.toFixed(2)}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Tax (18% GST)</span>
                                  <span>₹{tax.toFixed(2)}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2 bg-light rounded-3">
                                  <strong>Total Amount</strong>
                                  <strong className="text-danger">₹{finalAmount.toFixed(2)}</strong>
                                </ListGroup.Item>
                              </ListGroup>
                              
                              <div className="text-center mt-4">
                                <div className="final-amount-display">
                                  ₹{finalAmount.toFixed(2)}
                                </div>
                                <small className="text-muted">Amount to pay</small>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                        <Button
                          variant="outline-secondary"
                          className="rounded-pill px-4"
                          onClick={() => setStep(1)}
                        >
                          <i className="fas fa-arrow-left me-2"></i>
                          Back to Seat Selection
                        </Button>
                        
                        <Button
                          variant="danger"
                          size="lg"
                          className="book-btn-modern px-5"
                          onClick={handleConfirmBooking}
                          disabled={bookingLoading || selectedSeats.length === 0}
                        >
                          {bookingLoading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Creating Booking...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check-circle me-2"></i>
                              Confirm & Proceed to Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="booking-card-modern border-0 shadow-lg mb-4">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="font-family-sans-serif mb-0">
                          <i className="fas fa-credit-card me-2 text-danger"></i>
                          Secure Payment
                        </h2>
                        <Badge bg="info" className="px-3 py-2 fs-6">
                          Complete Payment
                        </Badge>
                      </div>

                      <Row>
                        <Col lg={8}>
                          {paymentSuccess ? (
                            <div className="payment-success text-center py-5">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <div className="success-icon mb-4">
                                  <i className="fas fa-check-circle fa-4x text-success"></i>
                                </div>
                                <h3 className="font-family-sans-serif mb-3">
                                  Payment Successful!
                                </h3>
                                <p className="text-muted mb-4">
                                  Your booking has been confirmed. Redirecting to confirmation page...
                                </p>
                                <Spinner animation="border" variant="success" />
                              </motion.div>
                            </div>
                          ) : (
                            <>
                              <Card className="info-card-modern mb-4">
                                <Card.Body>
                                  <h4 className="font-family-sans-serif mb-3">
                                    Select Payment Method
                                  </h4>
                                  <div className="payment-methods-grid">
                                    {[
                                      {
                                        id: 'card',
                                        icon: 'fa-credit-card',
                                        label: 'Credit/Debit Card',
                                        description: 'Pay using Visa, Mastercard, or RuPay',
                                        popular: true
                                      },
                                      {
                                        id: 'upi',
                                        icon: 'fa-mobile-alt',
                                        label: 'UPI',
                                        description: 'Google Pay, PhonePe, Paytm',
                                        popular: true
                                      },
                                      {
                                        id: 'netbanking',
                                        icon: 'fa-university',
                                        label: 'Net Banking',
                                        description: 'All major banks supported'
                                      },
                                      {
                                        id: 'wallet',
                                        icon: 'fa-wallet',
                                        label: 'Wallet',
                                        description: 'Paytm, Amazon Pay, Mobikwik'
                                      }
                                    ].map((method) => (
                                      <div
                                        key={method.id}
                                        className={`payment-method-card ${
                                          paymentMethod === method.id ? 'active' : ''
                                        }`}
                                        onClick={() => setPaymentMethod(method.id)}
                                      >
                                        <div className="payment-method-icon">
                                          <i className={`fas ${method.icon} fa-2x`}></i>
                                        </div>
                                        <div className="payment-method-info">
                                          <div className="d-flex align-items-center">
                                            <h6 className="mb-1">{method.label}</h6>
                                            {method.popular && (
                                              <Badge bg="success" className="ms-2">Popular</Badge>
                                            )}
                                          </div>
                                          <p className="text-muted small mb-0">{method.description}</p>
                                        </div>
                                        <div className="payment-method-check">
                                          {paymentMethod === method.id && (
                                            <i className="fas fa-check-circle fa-2x text-success"></i>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </Card.Body>
                              </Card>

                              {/* Security Info */}
                              <Alert variant="light" className="border-0 mb-4">
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-shield-alt fa-2x me-3 text-primary"></i>
                                  <div>
                                    <strong>Secure Payment</strong>
                                    <p className="mb-0 mt-1">
                                      Your payment is secured with 256-bit SSL encryption.
                                      We never store your card details.
                                    </p>
                                  </div>
                                </div>
                              </Alert>
                            </>
                          )}
                        </Col>

                        <Col lg={4}>
                          {/* Final Amount */}
                          <Card className="final-amount-card sticky-top" style={{ top: '20px' }}>
                            <Card.Body>
                              <h4 className="font-family-sans-serif mb-3">Amount to Pay</h4>
                              <div className="text-center mb-4">
                                <div className="amount-display">
                                  ₹{finalAmount.toFixed(2)}
                                </div>
                                <small className="text-muted">Inclusive of all charges</small>
                              </div>
                              
                              <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Seats</span>
                                  <span>{selectedSeats.length} ×</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Base Price</span>
                                  <span>₹{totalPrice.toFixed(2)}</span>
                                </ListGroup.Item>
                                {discount > 0 && (
                                  <ListGroup.Item className="d-flex justify-content-between border-0 py-2 text-success">
                                    <span>Discount</span>
                                    <span>-₹{discount.toFixed(2)}</span>
                                  </ListGroup.Item>
                                )}
                                <ListGroup.Item className="d-flex justify-content-between border-0 py-2">
                                  <span>Charges</span>
                                  <span>₹{(convenienceFee + tax).toFixed(2)}</span>
                                </ListGroup.Item>
                              </ListGroup>

                              {!paymentSuccess && (
                                <Button
                                  variant="danger"
                                  size="lg"
                                  className="w-100 book-btn-modern py-3"
                                  onClick={handlePayment}
                                  disabled={paymentSuccess}
                                >
                                  <i className="fas fa-lock me-2"></i>
                                  Pay ₹{finalAmount.toFixed(2)} Now
                                </Button>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Col>

          {/* Sidebar */}
          <Col xl={4} lg={5}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="booking-sidebar-card border-0 shadow-lg sticky-top" style={{ top: '20px' }}>
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <img
                      src={show.movie?.posterUrl}
                      alt={show.movie?.title}
                      className="img-fluid rounded-4 mb-3"
                      style={{ maxHeight: '250px', objectFit: 'cover', width: '100%' }}
                    />
                    <h4 className="font-family-sans-serif mb-2">{show.movie?.title}</h4>
                    <div className="d-flex justify-content-center gap-2 mb-3">
                      <Badge bg="warning" className="px-3">
                        ⭐ {show.movie?.rating?.toFixed(1) || 'N/A'}
                      </Badge>
                      <Badge bg="info">{show.movie?.language}</Badge>
                      <Badge bg="dark">{Math.floor(show.movie?.duration / 60)}h {show.movie?.duration % 60}m</Badge>
                    </div>
                  </div>

                  <Accordion defaultActiveKey="0" className="mb-4">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        <i className="fas fa-info-circle me-2"></i>
                        Show Details
                      </Accordion.Header>
                      <Accordion.Body>
                        <ListGroup variant="flush">
                          <ListGroup.Item className="border-0 py-2">
                            <div className="d-flex justify-content-between">
                              <span><i className="fas fa-building me-2"></i>Theater</span>
                              <strong>{show.theater?.name}</strong>
                            </div>
                          </ListGroup.Item>
                          <ListGroup.Item className="border-0 py-2">
                            <div className="d-flex justify-content-between">
                              <span><i className="fas fa-location-dot me-2"></i>Location</span>
                              <small className="text-end">{show.theater?.location?.address}</small>
                            </div>
                          </ListGroup.Item>
                          <ListGroup.Item className="border-0 py-2">
                            <div className="d-flex justify-content-between">
                              <span><i className="fas fa-calendar me-2"></i>Date & Time</span>
                              <div className="text-end">
                                <div>{format(new Date(show.date), 'MMM dd, yyyy')}</div>
                                <div className="text-danger fw-bold">
                                  {format(new Date(show.startTime), 'h:mm a')}
                                </div>
                              </div>
                            </div>
                          </ListGroup.Item>
                          <ListGroup.Item className="border-0 py-2">
                            <div className="d-flex justify-content-between">
                              <span><i className="fas fa-hourglass me-2"></i>Duration</span>
                              <strong>
                                {Math.floor(show.movie?.duration / 60)}h {show.movie?.duration % 60}m
                              </strong>
                            </div>
                          </ListGroup.Item>
                          <ListGroup.Item className="border-0 py-2">
                            <div className="d-flex justify-content-between">
                              <span><i className="fas fa-video me-2"></i>Format</span>
                              <Badge bg="dark">2D</Badge>
                            </div>
                          </ListGroup.Item>
                          
                          {/* Seats Limit Info */}
                          {show.seatsLimit > 0 && (
                            <ListGroup.Item className="border-0 py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <span><i className="fas fa-ticket-alt me-2"></i>Seats Limit</span>
                                <Badge bg="warning">
                                  <i className="fas fa-lock me-1"></i>
                                  Max {show.seatsLimit} seats
                                </Badge>
                              </div>
                            </ListGroup.Item>
                          )}
                        </ListGroup>
                      </Accordion.Body>
                    </Accordion.Item>
                    
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>
                        <i className="fas fa-chair me-2"></i>
                        Seat Prices
                      </Accordion.Header>
                      <Accordion.Body>
                        <ListGroup variant="flush">
                          <ListGroup.Item className="border-0 py-2 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="seat-legend regular me-2"></div>
                              <span>Regular</span>
                            </div>
                            <strong className="text-danger">₹{show.price?.regular || 200}</strong>
                          </ListGroup.Item>
                          {show.price?.premium && (
                            <ListGroup.Item className="border-0 py-2 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <div className="seat-legend premium me-2"></div>
                                <span>Premium</span>
                              </div>
                              <strong className="text-danger">₹{show.price.premium}</strong>
                            </ListGroup.Item>
                          )}
                          {show.price?.vip && (
                            <ListGroup.Item className="border-0 py-2 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <div className="seat-legend vip me-2"></div>
                                <span>VIP</span>
                              </div>
                              <strong className="text-danger">₹{show.price.vip}</strong>
                            </ListGroup.Item>
                          )}
                          {show.price?.balcony && (
                            <ListGroup.Item className="border-0 py-2 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <div className="seat-legend balcony me-2"></div>
                                <span>Balcony</span>
                              </div>
                              <strong className="text-danger">₹{show.price.balcony}</strong>
                            </ListGroup.Item>
                          )}
                        </ListGroup>
                        
                        {/* Selected seats summary */}
                        <div className="mt-3 p-3 bg-light rounded-3">
                          <small className="text-muted d-block mb-1">Your Selection:</small>
                          <div className="d-flex justify-content-between mb-2">
                            <span>{selectedSeats.length} seats selected</span>
                            <strong>₹{totalPrice}</strong>
                          </div>
                          
                          {selectedSeats.length > 0 && (
                            <>
                              <small className="text-muted d-block mb-1">Selected seats:</small>
                              <div className="selected-seats-mini">
                                {selectedSeats.map((seat, idx) => (
                                  <Badge key={idx} bg={getSeatBadgeColor(seat.type)} className="me-1 mb-1">
                                    {seat.seatNumber} (₹{seat.price})
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  {/* User Info */}
                  <Card className="user-info-card border-0 bg-light mb-4">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="user-avatar me-3">
                          <i className="fas fa-user-circle fa-2x text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{user?.name || 'Guest'}</h6>
                          <small className="text-muted">{user?.email}</small>
                          <div className="small text-muted mt-1">
                            <i className="fas fa-phone me-1"></i>
                            {user?.phone || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Important Notes */}
                  <Alert variant="light" className="border-0">
                    <h6 className="mb-2">
                      <i className="fas fa-exclamation-circle me-2 text-warning"></i>
                      Important Notes
                    </h6>
                    <ul className="small mb-0 ps-3">
                      <li>Arrive 30 minutes before showtime</li>
                      <li>ID proof required for entry</li>
                      <li>No cancellation within 3 hours of showtime</li>
                      <li>Carry e-ticket or booking confirmation</li>
                      <li>Children under 3 years free (no seat)</li>
                      {show.seatsLimit > 0 && (
                        <li className="text-warning">
                          <i className="fas fa-info-circle me-1"></i>
                          This show has a limit of {show.seatsLimit} seats
                        </li>
                      )}
                    </ul>
                  </Alert>

                  {/* Help Section */}
                  <div className="text-center mt-4">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill me-2"
                      onClick={() => navigate('/help')}
                    >
                      <i className="fas fa-question-circle me-1"></i>
                      Help
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="rounded-pill"
                      onClick={() => navigate(-1)}
                    >
                      <i className="fas fa-times me-1"></i>
                      Cancel Booking
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* Cancel Selection Modal */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="font-family-sans-serif">
            <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
            Clear Selection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to clear all selected seats?
            This action cannot be undone.
          </p>
          <div className="text-center">
            <div className="selected-seats-preview">
              {selectedSeats.map((seat, index) => (
                <Badge key={index} bg={getSeatBadgeColor(seat.type)} className="me-2 mb-2">
                  {seat.seatNumber} (₹{seat.price})
                </Badge>
              ))}
            </div>
            {selectedSeats.length > 0 && (
              <div className="mt-3">
                <strong>Total: ₹{totalPrice}</strong>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowCancelModal(false)}
            className="rounded-pill"
          >
            Keep Seats
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelBooking}
            className="rounded-pill"
          >
            <i className="fas fa-trash-alt me-2"></i>
            Clear All Seats
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Booking;