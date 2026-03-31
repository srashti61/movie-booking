import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, Button, Alert,
  Modal, Form, Spinner, Badge
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// API
import { showAPI, bookingAPI } from '../services/api';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    fetchShow();
  }, [showId]);

  // ✅ SAFE FETCH SHOW
  const fetchShow = async () => {
    try {
      setLoading(true);
      const response = await showAPI.getShowById(showId);
      const showData = response?.data?.show || response?.show;

      if (!showData) {
        setError('Show data not found');
        return;
      }

      setShow(showData);
    } catch (error) {
      console.error('Show fetch error:', error);
      setError('Failed to load show details');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE SEAT CLICK HANDLER
  const handleSeatClick = (rowIndex, colIndex, seat) => {
    if (!seat.isAvailable) {
      toast.warning('Seat is already booked');
      return;
    }

    const seatKey = `${rowIndex}-${colIndex}`;
    const isSelected = selectedSeats.some(s => s.key === seatKey);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.key !== seatKey));
    } else {
      if (selectedSeats.length >= 6) {
        toast.warning('Maximum 6 seats only');
        return;
      }

      setSelectedSeats([
        ...selectedSeats,
        {
          key: seatKey,
          row: rowIndex,
          col: colIndex,
          seatNumber: seat.seatNumber,
          type: seat.type,
          price: seat.price
        }
      ]);
    }
  };

  // ✅ SAFE COLOR LOGIC
  const getSeatColor = (seat, rowIndex, colIndex) => {
    if (!seat.isAvailable) return '#dc3545';

    if (selectedSeats.some(s => s.row === rowIndex && s.col === colIndex)) {
      return '#28a745';
    }

    switch (seat.type) {
      case 'vip': return '#6f42c1';
      case 'premium': return '#fd7e14';
      default: return '#007bff';
    }
  };

  const calculateTotal = () =>
    selectedSeats.reduce((total, seat) => total + seat.price, 0);

  // ✅ SAFE LOGIN CHECK
  const handleProceedToPayment = () => {
    if (!user) {
      toast.info('Please login to continue');
      navigate('/login', { state: { from: `/seat-selection/${showId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Select at least one seat');
      return;
    }

    setShowPaymentModal(true);
  };

  // ✅ SAFE BOOKING + PAYMENT
  const handleConfirmBooking = async () => {
    try {
      setProcessing(true);

      const bookingData = {
        showId,
        seats: selectedSeats.map(seat => ({
          row: seat.row,
          col: seat.col,
          type: seat.type
        }))
      };

      const bookingResponse = await bookingAPI.createBooking(bookingData);

      const bookingId =
        bookingResponse?.data?.booking?._id ||
        bookingResponse?.booking?._id;

      if (!bookingId) throw new Error('Booking ID not received');

      const paymentResponse = await bookingAPI.processPayment(bookingId, {
        paymentMethod,
        transactionId: `TXN${Date.now()}`
      });

      if (paymentResponse?.success) {
        toast.success('Booking confirmed!');
        navigate(`/booking-confirmation/${bookingId}`);
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Booking failed');
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading seat map...</p>
      </Container>
    );
  }

  // ✅ ERROR STATE
  if (error || !show) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Show not found'}</p>
          <Button onClick={() => navigate('/movies')}>
            Browse Movies
          </Button>
        </Alert>
      </Container>
    );
  }

  // ✅ SAFE SCREEN ACCESS
  const screen = show?.screen || show?.screenId;
  if (!screen || !screen.seats) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Screen configuration not available
        </Alert>
      </Container>
    );
  }

  // ✅ FINAL PRICE CALC
  const subtotal = calculateTotal();
  const fee = subtotal * 0.05;
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + fee + tax;

  return (
    <Container className="py-4">

      <div className="text-center mb-4">
        <h1>Select Your Seats</h1>
        <p className="lead">
          {show.movie?.title} • {show.theater?.name} • Screen {screen.screenNumber}
        </p>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow mb-4">
            <Card.Body>

              {screen.seats.map((row, rowIndex) => (
                <div key={rowIndex} className="d-flex justify-content-center mb-2">
                  {row.map((seat, colIndex) => (
                    <button
                      key={colIndex}
                      className="btn m-1"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: getSeatColor(seat, rowIndex, colIndex),
                        color: '#fff'
                      }}
                      onClick={() => handleSeatClick(rowIndex, colIndex, seat)}
                    >
                      {colIndex + 1}
                    </button>
                  ))}
                </div>
              ))}

            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow sticky-top">

            <Card.Body>
              <h6>Total Seats: {selectedSeats.length}</h6>
              <h5>Total: ₹{grandTotal.toFixed(2)}</h5>

              <Button
                className="w-100 mt-3"
                onClick={handleProceedToPayment}
              >
                Proceed to Payment
              </Button>
            </Card.Body>

          </Card>
        </Col>
      </Row>

      {/* ✅ PAYMENT MODAL */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Payment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          >
            <option value="upi">UPI</option>
            <option value="card">Credit Card</option>
          </Form.Select>

          <h5 className="mt-3">Amount: ₹{grandTotal.toFixed(2)}</h5>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmBooking} disabled={processing}>
            {processing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default SeatSelection;
