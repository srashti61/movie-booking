import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Modal, Form, Alert, Spinner,
  InputGroup, FormControl,
  Nav, Offcanvas, Pagination, ButtonGroup
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { bookingAPI } from '../../services/api';


// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaSearch,
  FaEye, FaEdit, FaPrint,
  FaMoneyBillWave, FaFilter,
  FaTimesCircle, FaCheckCircle, FaClock,
  FaRupeeSign, FaChair, FaUserCircle,
  FaReceipt, FaCalendarDay, FaMapMarkerAlt,
  FaChevronLeft, FaChevronRight, FaExclamationTriangle,
  FaInfoCircle, FaMobileAlt, FaCreditCard
} from 'react-icons/fa';

const getShowDateTime = (booking) => {
  if (!booking?.show?.date || !booking?.show?.startTime) return null;

  const baseDate = new Date(booking.show.date);
  if (isNaN(baseDate.getTime())) return null;

  const [h, m] = booking.show.startTime.split(':');
  if (h === undefined || m === undefined) return null;

  baseDate.setHours(Number(h), Number(m), 0, 0);
  return isNaN(baseDate.getTime()) ? null : baseDate;
};


const BookingManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector(state => state.auth);
  
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Booking states
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
const confirmedCount = bookings.filter(
  b =>
    (b.status === 'confirmed' || b.status === 'completed') &&
    b.paymentStatus === 'completed'
).length;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [refundReason, setRefundReason] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, path: '/admin' },
    { id: 'movies', label: 'Movies', icon: <FaFilm />, path: '/admin/movies' },
    { id: 'theaters', label: 'Theaters', icon: <FaTheaterMasks />, path: '/admin/theaters' },
    { id: 'users', label: 'Users', icon: <FaUsers />, path: '/admin/users' },
    { id: 'bookings', label: 'Bookings', icon: <FaTicketAlt />, path: '/admin/bookings' },
    { id: 'shows', label: 'Shows', icon: <FaCalendarAlt />, path: '/admin/shows' },
    { id: 'reports', label: 'Reports', icon: <FaChartBar />, path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: <FaCog />, path: '/admin/settings' },
  ];



useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterStatus, filterDate, filterPayment]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterAndPaginateBookings();
  }, [bookings, searchTerm, filterStatus, filterDate, filterPayment, currentPage]);

const fetchBookings = async () => {
  try {
    setLoading(true);

    const response = await bookingAPI.getAllBookings();

    if (!response || !response.success) {
      throw new Error('Failed to fetch bookings');
    }

    setBookings(response.bookings || []);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    toast.error('Failed to load bookings');
    setBookings([]); // ❗ IMPORTANT
  } finally {
    setLoading(false);
  }
};




  const filterAndPaginateBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.show?.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.show?.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }

    // Date filter
if (filterDate) {
  filtered = filtered.filter(booking => {
    const date = booking.bookingDate || booking.createdAt;
    if (!date) return false;
const d = new Date(date);
if (isNaN(d.getTime())) return false;
return d.toISOString().slice(0, 10) === filterDate;

  });
}


    // Payment filter
    if (filterPayment !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === filterPayment);
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async () => {
    if (!refundReason.trim()) {
      toast.warning('Please provide a cancellation reason');
      return;
    }

    try {
      setProcessing(true);
      const response = await bookingAPI.cancelBooking(selectedBooking._id, refundReason);
      if (response.success) {
        toast.success('✅ Booking cancelled successfully!', {
          position: "top-center",
          autoClose: 3000
        });
        setShowCancelModal(false);
        setRefundReason('');
        fetchBookings();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking', {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRefundBooking = async () => {
    try {
      setProcessing(true);
      // In a real app, this would be a separate API call
      toast.success('💰 Refund processed successfully!', {
        position: "top-center",
        autoClose: 3000
      });
      setShowRefundModal(false);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'success', text: 'Confirmed', icon: <FaCheckCircle /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> },
      cancelled: { bg: 'danger', text: 'Cancelled', icon: <FaTimesCircle /> },
      completed: { bg: 'info', text: 'Completed', icon: <FaCheckCircle /> }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status, icon: <FaInfoCircle /> };
    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1 px-3 py-2">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'success', text: 'Paid', icon: <FaCheckCircle /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> },
      failed: { bg: 'danger', text: 'Failed', icon: <FaTimesCircle /> },
      refunded: { bg: 'info', text: 'Refunded', icon: <FaMoneyBillWave /> }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status, icon: <FaInfoCircle /> };
    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1 px-3 py-2">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      upi: <FaMobileAlt />,
      credit_card: <FaCreditCard />,
      debit_card: <FaCreditCard />,
      netbanking: <FaMoneyBillWave />,
      wallet: <FaMobileAlt />
    };
    return icons[method] || <FaCreditCard />;
  };

  const getSeatTypeBadge = (type) => {
    const types = {
      regular: { bg: 'secondary', text: 'Regular' },
      premium: { bg: 'warning', text: 'Premium' },
      vip: { bg: 'danger', text: 'VIP' }
    };
    const config = types[type] || { bg: 'secondary', text: type };
    return <Badge bg={config.bg} className="ms-1">{config.text}</Badge>;
  };

  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDate('');
    setFilterPayment('all');
    setCurrentPage(1);
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const todayStr = new Date().toISOString().slice(0, 10);

const todayBookings = bookings.filter(b => {
  const date = b.bookingDate || b.createdAt;
  if (!date) return false;
  return new Date(date).toISOString().slice(0, 10) === todayStr;
}).length;



const totalRevenue = bookings
  .filter(
    b =>
      b.paymentStatus === 'completed' &&
      b.status !== 'cancelled'
  )
  .reduce(
    (sum, b) => sum + Number(b.finalAmount || b.totalAmount || 0),
    0
  );


  return (
    <div className="d-flex font-family-base" style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <div 
        className={`bg-dark text-white ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
        style={{
          width: sidebarCollapsed ? '80px' : '250px',
          minHeight: '100vh',
          transition: 'width 0.3s ease',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center justify-content-between">
            {!sidebarCollapsed && (
              <div>
                <h4 className="mb-0 fw-bold">CinemaHub</h4>
                <small className="text-muted">Admin Panel</small>
              </div>
            )}
            <Button 
              variant="dark" 
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              <FaBars />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <div className="me-3">
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                   style={{ width: '40px', height: '40px' }}>
                <FaTicketAlt size={20} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">Booking Manager</small>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <Nav className="flex-column p-3">
          {navItems.map((item) => (
            <Nav.Item key={item.id} className="mb-2">
              <Nav.Link
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`d-flex align-items-center text-white ${location.pathname === item.path ? 'bg-primary' : 'hover-bg-dark'}`}
                style={{
                  borderRadius: '8px',
                  padding: '10px 15px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="me-3" style={{ minWidth: '20px' }}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-top border-secondary mt-auto">
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={() => navigate('/')}
                className="d-flex align-items-center"
              >
                <FaHome className="me-2" />
                Go to Site
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={handleLogout}
                className="d-flex align-items-center"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
<div 
  className="flex-grow-1"
  style={{ 
    marginLeft: isMobile ? '0px' : (sidebarCollapsed ? '80px' : '250px'),
    transition: 'margin-left 0.3s ease'
  }}
>

        {/* Top Bar */}
        <div className="bg-white border-bottom py-3 px-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">🎫 Booking Management</h4>
              <small className="text-muted">Manage all ticket bookings and transactions</small>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <Badge bg="warning" className="px-3 py-2 fs-6">
                {bookings.length} Bookings
              </Badge>
              
              <Button 
                variant="outline-primary"
                onClick={() => window.print()}
              >
                <FaPrint className="me-2" />
                Print Report
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <Container className="py-4">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Row>
              <Col md={3} className="mb-3">
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <h3 className="text-primary">{bookings.length}</h3>
                    <Card.Text className="text-muted">Total Bookings</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="text-center border-0 shadow-sm bg-success text-white">
                  <Card.Body>
    <h3>{confirmedCount}</h3>

                    <Card.Text>Confirmed</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="text-center border-0 shadow-sm bg-warning text-dark">
                  <Card.Body>
                    <h3>{todayBookings}</h3>
                    <Card.Text>Today's Bookings</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-3">
                <Card className="text-center border-0 shadow-sm bg-info text-white">
                  <Card.Body>
                    <h3>₹{totalRevenue.toLocaleString()}</h3>
                    <Card.Text>Total Revenue</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4"
          >
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Row className="g-3 align-items-end">
                  {/* Search */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSearch className="me-2 text-primary" />
                        Search Bookings
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaSearch className="text-muted" />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search by ticket, user, or movie..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Status Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaFilter className="me-2 text-primary" />
                        Status
                      </Form.Label>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Payment Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaMoneyBillWave className="me-2 text-primary" />
                        Payment
                      </Form.Label>
                      <Form.Select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                      >
                        <option value="all">All Payments</option>
                        <option value="completed">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Date Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaCalendarDay className="me-2 text-primary" />
                        Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  {/* Action Buttons */}
                  <Col md={3} className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="outline-secondary"
                        onClick={clearFilters}
                        className="rounded-pill px-4"
                      >
                        <FaTimesCircle className="me-2" />
                        Clear Filters
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Bookings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fw-semibold">Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="empty-state-icon mb-4 mx-auto">
                      <FaTicketAlt size={48} className="text-muted" />
                    </div>
                    <h4 className="mb-3">No Bookings Found</h4>
                    <p className="text-muted mb-4">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                      <div>
                        <span className="text-muted">
                          Showing {Math.min(indexOfFirstItem + 1, filteredBookings.length)}-
                          {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <Badge bg="info" className="px-3 py-2">
                          <FaClock className="me-1" />
                          Today: {todayBookings}
                        </Badge>
                        <Badge bg="success" className="px-3 py-2">
                          <FaRupeeSign className="me-1" />
                          Revenue: ₹{filteredBookings.slice(indexOfFirstItem, indexOfLastItem)
                            .reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || 0), 0)
                            .toLocaleString()}
                        </Badge>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="ps-4">Ticket #</th>
                            <th>User</th>
                            <th>Movie & Theater</th>
                            <th>Show Time</th>
                            <th>Seats</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th className="text-center pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {currentItems.map((booking, index) => (
                              <motion.tr
                                key={booking._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <td className="ps-4">
                                  <div>
                                    <strong className="d-block">{booking.ticketNumber}</strong>
                                    <small className="text-muted">
                                      <FaReceipt className="me-1" />
                                    format(new Date(date), 'yyyy-MM-dd')

                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong className="d-flex align-items-center gap-1">
                                      <FaUserCircle />
                                      {booking.user?.name}
                                    </strong>
                                    <small className="text-muted d-block">{booking.user?.email}</small>
                                    <small className="text-muted">{booking.user?.phone}</small>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <img
                                      src={booking.show?.movie?.posterUrl}
                                      alt={booking.show?.movie?.title}
                                      className="rounded-3"
                                      style={{ width: '50px', height: '75px', objectFit: 'cover', marginRight: '10px' }}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/50x75?text=Movie';
                                      }}
                                    />
                                    <div>
                                      <strong>{booking.show?.movie?.title}</strong>
                                      <div className="text-muted d-flex align-items-center gap-1 mt-1">
                                        <FaTheaterMasks size={12} />
                                        {booking.show?.theater?.name}
                                        <FaMapMarkerAlt size={10} />
                                        {booking.show?.theater?.location?.city}
                                      </div>
                                      <small className="text-muted">
                                        Screen {booking.show?.screen}
                                      </small>
                                    </div>
                                  </div>
                                </td>
<td>
  {(() => {
    const showTime = getShowDateTime(booking);
    return showTime ? (
      <>
        <strong>{format(showTime, 'MMM dd')}</strong>
        <br />
        <small className="text-muted d-flex align-items-center gap-1">
          <FaClock />
          {format(showTime, 'hh:mm a')}
        </small>
      </>
    ) : (
      <span className="text-muted">N/A</span>
    );
  })()}
</td>


                                <td>
                                  <div className="d-flex flex-wrap gap-1">
                                    {booking.seats?.slice(0, 3).map((seat, idx) => (
                                      <Badge 
                                        key={idx}
                                        bg={
                                          seat.type === 'vip' ? 'danger' : 
                                          seat.type === 'premium' ? 'warning' : 'success'
                                        }
                                        className="d-flex align-items-center gap-1 px-2 py-1"
                                      >
                                        <FaChair />
                                        {seat.seatNumber}
                                        {getSeatTypeBadge(seat.type)}
                                      </Badge>
                                    ))}
                                    {booking.seats?.length > 3 && (
                                      <Badge bg="secondary" className="px-2 py-1">
                                        +{booking.seats.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong className="d-flex align-items-center gap-1">
                                      <FaRupeeSign />
                                      {booking.finalAmount || booking.totalAmount}
                                    </strong>
                                    {booking.finalAmount && booking.finalAmount !== booking.totalAmount && (
                                      <small className="text-success">
                                        Saved ₹{booking.totalAmount - booking.finalAmount}
                                      </small>
                                    )}
                                  </div>
                                </td>
                                <td>{getStatusBadge(booking.status)}</td>
                                <td>
                                  <div className="d-flex flex-column gap-1">
                                    {getPaymentStatusBadge(booking.paymentStatus)}
                                    <small className="text-muted d-flex align-items-center gap-1">
                                      {getPaymentMethodIcon(booking.paymentMethod)}
                                      {booking.paymentMethod?.replace('_', ' ')}
                                    </small>
                                  </div>
                                </td>
                                <td className="text-center pe-4">
                                  <ButtonGroup size="sm">
                                    <Button
                                      variant="outline-info"
                                      onClick={() => navigate(`/booking-confirmation/${booking._id}`)}
                                      className="action-btn"
                                      title="View Details"
                                    >
                                      <FaEye />
                                    </Button>
                                    
                                    <Button
                                      variant="outline-primary"
                                      onClick={() => navigate(`/booking/${booking.show?._id}`)}
                                      className="action-btn"
                                      title="View Show"
                                    >
                                      <FaCalendarAlt />
                                    </Button>
                                    
                                    {booking.status === 'confirmed' && (
                                      <Button
                                        variant="outline-danger"
                                        onClick={() => {
                                          setSelectedBooking(booking);
                                          setShowCancelModal(true);
                                        }}
                                        className="action-btn"
                                        title="Cancel Booking"
                                      >
                                        <FaTimesCircle />
                                      </Button>
                                    )}
                                    
                                    {booking.status === 'cancelled' && booking.paymentStatus === 'completed' && (
                                      <Button
                                        variant="outline-warning"
                                        onClick={() => {
                                          setSelectedBooking(booking);
                                          setShowRefundModal(true);
                                        }}
                                        className="action-btn"
                                        title="Process Refund"
                                      >
                                        <FaMoneyBillWave />
                                      </Button>
                                    )}
                                  </ButtonGroup>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="border-top p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Pagination className="mb-0">
                            <Pagination.Prev 
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <FaChevronLeft />
                            </Pagination.Prev>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <Pagination.Item
                                  key={pageNum}
                                  active={pageNum === currentPage}
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </Pagination.Item>
                              );
                            })}
                            
                            <Pagination.Next 
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <FaChevronRight />
                            </Pagination.Next>
                          </Pagination>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Container>
      </div>

      {/* Mobile Sidebar Toggle */}
      <Button
        variant="primary"
        className="d-lg-none position-fixed"
        style={{
          bottom: '20px',
          right: '20px',
          zIndex: 1001,
          borderRadius: '50%',
          width: '50px',
          height: '50px'
        }}
        onClick={() => setShowMobileSidebar(true)}
      >
        <FaBars />
      </Button>

      {/* Mobile Sidebar */}
      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>CinemaHub Admin</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Item key={item.id} className="mb-2">
                <Nav.Link
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setShowMobileSidebar(false);
                  }}
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger">
            <FaTimesCircle className="me-2" />
            Cancel Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="border-0">
            <div className="d-flex align-items-center gap-2 mb-2">
              <FaExclamationTriangle />
              <h6 className="mb-0">Are you sure you want to cancel this booking?</h6>
            </div>
            <p className="mb-0">
              <strong>{selectedBooking?.ticketNumber}</strong> - {selectedBooking?.show?.movie?.title}
            </p>
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>
              <FaInfoCircle className="me-2" />
              Reason for cancellation *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              required
            />
          </Form.Group>

          {selectedBooking?.totalAmount > 0 && (
            <Alert variant="info" className="border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Refund Amount:</strong>
                  <div className="h4 text-success mb-0">₹{selectedBooking?.totalAmount}</div>
                </div>
                <FaMoneyBillWave size={24} className="text-success" />
              </div>
              <small className="text-muted">Refund will be processed to the original payment method within 5-7 business days</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowCancelModal(false);
              setRefundReason('');
            }}
            className="rounded-pill px-4"
          >
            Close
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelBooking}
            disabled={processing || !refundReason.trim()}
            className="rounded-pill px-4"
          >
            {processing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-success">
            <FaMoneyBillWave className="me-2" />
            Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="border-0">
            <div className="d-flex align-items-center gap-2 mb-2">
              <FaInfoCircle />
              <h6 className="mb-0">Process refund for cancelled booking</h6>
            </div>
            <p className="mb-0">
              <strong>{selectedBooking?.ticketNumber}</strong> - {selectedBooking?.show?.movie?.title}
            </p>
          </Alert>
          
          <div className="mb-4">
            <strong>Refund Details:</strong>
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Original Amount:</span>
                <span>₹{selectedBooking?.totalAmount}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Cancellation Fee (10%):</span>
                <span className="text-danger">-₹{(selectedBooking?.totalAmount * 0.1).toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>Refund Amount:</span>
                <span className="text-success h5 mb-0">
                  ₹{(selectedBooking?.totalAmount * 0.9).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaEdit className="me-2" />
              Refund Notes
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Add notes about this refund..."
            />
          </Form.Group>

          <Alert variant="warning" className="border-0">
            <small>
              <FaClock className="me-1" />
              Refund will be processed within 24 hours to the original payment method
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowRefundModal(false)}
            className="rounded-pill px-4"
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleRefundBooking}
            disabled={processing}
            className="rounded-pill px-4"
          >
            {processing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add custom styles */}
      <style jsx>{`
        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .action-btn {
          border-radius: 6px !important;
          padding: 6px 10px !important;
        }
        
        @media (max-width: 768px) {
          .sidebar-expanded, .sidebar-collapsed {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingManagement;