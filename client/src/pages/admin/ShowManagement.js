// client/src/pages/admin/ShowManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Modal, Form, Alert, Spinner,
  InputGroup, Nav, Offcanvas, ButtonGroup
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { showAPI } from '../../services/api';
import { fetchMovies } from '../../features/movieSlice';
import { fetchTheaters } from '../../features/theaterSlice';

import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaCalendarAlt,
  FaBars, FaHome, FaSignOutAlt, FaClock, FaRupeeSign,
  FaChair, FaCalendarDay, FaTimesCircle, FaCalendarPlus,
  FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimes, FaInfoCircle,
  FaPlus, FaMinus, FaTicketAlt,
  FaUsers, FaChartBar, FaCog, FaUserCircle
} from 'react-icons/fa';

const ShowManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { movies } = useSelector(s => s.movies);
  const { theaters } = useSelector(s => s.theaters);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // data + loading
  const [shows, setShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
const handleLogout = () => {
  dispatch({ type: 'auth/logout' }); // or logoutUser() if you use thunk
  navigate('/login');
};


  // filters + sorting
  const [filters, setFilters] = useState({
    movie: '',
    theater: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  // modal/editing
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);

  // form data - UPDATED WITH seatsLimit
  const emptyForm = {
    movie: '',
    theater: '',
    screen: '',
    showtimes: [{ date: format(new Date(), 'yyyy-MM-dd'), startTime: '10:00', endTime: '12:00' }],
    totalSeats: 0,
    seatsLimit: 0, // NEW: seats limit field (0 = no limit)
    overrideTotalSeats: false,
    seatCounts: { regular: 0, premium: 0, vip: 0, balcony: 0 },
   price: { regular: "", premium: "", vip: "", balcony: "" },
    seatLayout: 'standard',
    isActive: true
  };
  const [formData, setFormData] = useState({ ...emptyForm });

  // Nav items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, path: '/admin' },
  { id: 'movies', label: 'Movies', icon: <FaFilm />, path: '/admin/movies' },
  { id: 'theaters', label: 'Theaters', icon: <FaTheaterMasks />, path: '/admin/theaters' },
  { id: 'users', label: 'Users', icon: <FaUsers />, path: '/admin/users' }, // 👈 HERE
  { id: 'bookings', label: 'Bookings', icon: <FaTicketAlt />, path: '/admin/bookings' },
  { id: 'shows', label: 'Shows', icon: <FaCalendarAlt />, path: '/admin/shows' },
  { id: 'reports', label: 'Reports', icon: <FaChartBar />, path: '/admin/reports' },
  { id: 'settings', label: 'Settings', icon: <FaCog />, path: '/admin/settings' },
];

  useEffect(() => {
    (async () => {
      try {
        await dispatch(fetchMovies());
        await dispatch(fetchTheaters());
        await loadShows();
      } catch (err) {
        toast.error('Failed to initialize');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // load shows
  const loadShows = async () => {
    try {
      const res = await showAPI.getAllShows();
      if (res && res.success) setShows(res.shows || []);
      else setShows([]);
    } catch (err) {
      toast.error('Failed to load shows');
      setShows([]);
    }
  };

  // filters apply
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [shows, filters, sortBy, sortOrder]);

  const applyFilters = () => {
    let list = [...shows];
    if (filters.movie) list = list.filter(s => s.movie && s.movie._id === filters.movie);
    if (filters.theater) list = list.filter(s => s.theater && s.theater._id === filters.theater);
if (filters.date !== 'all') {
  list = list.filter(s => {
    if (!s.startTime) return false;

    const d = new Date(
      new Date(s.startTime).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );

    return format(d, 'yyyy-MM-dd') === filters.date;
  });
}

    if (filters.status === 'active') list = list.filter(s => s.isActive && s.availableSeats > 0);
    if (filters.status === 'housefull') list = list.filter(s => s.availableSeats === 0);
    if (filters.status === 'cancelled') list = list.filter(s => !s.isActive);

    list.sort((a, b) => {
      let aV, bV;
      switch (sortBy) {
        case 'movie':
          aV = (a.movie?.title || '').toLowerCase();
          bV = (b.movie?.title || '').toLowerCase();
          break;
        case 'theater':
          aV = (a.theater?.name || '').toLowerCase();
          bV = (b.theater?.name || '').toLowerCase();
          break;
        case 'seatsLimit':
          aV = a.seatsLimit || 0;
          bV = b.seatsLimit || 0;
          break;
        default:
          aV = new Date(a.startTime).getTime();
          bV = new Date(b.startTime).getTime();
      }
      if (sortOrder === 'asc') return aV > bV ? 1 : -1;
      return aV < bV ? 1 : -1;
    });

    setFilteredShows(list);
  };

  // helpers
  const getSelectedTheater = () => theaters.find(t => t._id === formData.theater);
  const getAvailableScreens = () => getSelectedTheater()?.screens || [];
  const getMovieById = (id) => movies.find(m => m._id === id);

  // when theater/screen changes set totalSeats unless overridden
  useEffect(() => {
    const screenNum = Number(formData.screen);
    const screenObj = getAvailableScreens().find(s => Number(s.screenNumber) === screenNum);
    if (screenObj && !formData.overrideTotalSeats) {
      setFormData(prev => ({
        ...prev,
        totalSeats: Number(screenObj.capacity || 0),
        seatCounts: {
          regular: Number(screenObj.capacity || 0),
          premium: 0, vip: 0, balcony: 0
        }
      }));
    }
    // eslint-disable-next-line
  }, [formData.screen, formData.theater]);

  // calculate endTime automatically when movie or startTime changes for each showtime
  useEffect(() => {
    if (!formData.movie) return;
    const movie = getMovieById(formData.movie);
    if (!movie || typeof movie.duration !== 'number') return;
    const newShowtimes = formData.showtimes.map(st => {
      if (!st.startTime) return st;
      const [h, m] = st.startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + movie.duration * 60000);
      return { ...st, endTime: format(end, 'HH:mm') };
    });
    setFormData(prev => ({ ...prev, showtimes: newShowtimes }));
    // eslint-disable-next-line
  }, [formData.movie, formData.showtimes.length, movies]);

  // input handlers - UPDATED WITH seatsLimit
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle seatsLimit
    if (name === 'seatsLimit') {
      const limitValue = Math.max(0, parseInt(value) || 0);
      setFormData(prev => ({ 
        ...prev, 
        seatsLimit: limitValue 
      }));
      return;
    }

    // nested: price.*
   if (name.startsWith('price.')) {
  const key = name.split('.')[1];
  setFormData(prev => ({
    ...prev,
    price: {
      ...prev.price,
      [key]: value   // keep string
    }
  }));
  return;
}

    // nested: seatCounts.*
    if (name.startsWith('seatCounts.')) {
  const key = name.split('.')[1];
  setFormData(prev => ({
    ...prev,
    seatCounts: {
      ...prev.seatCounts,
      [key]: value   // keep string while typing
    }
  }));
  return;
}

    if (name === 'overrideTotalSeats') {
      setFormData(prev => ({ ...prev, overrideTotalSeats: checked }));
      return;
    }
    if (name === 'totalSeats') {
      const total = Number(value || 0);
      setFormData(prev => ({ 
        ...prev, 
        totalSeats: total,
        // Auto-adjust seatsLimit if it's larger than new total
        seatsLimit: prev.seatsLimit > total ? total : prev.seatsLimit
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // showtime specific handlers
  const addShowtime = () => {
    setFormData(prev => ({ 
      ...prev, 
      showtimes: [...prev.showtimes, { 
        date: format(new Date(), 'yyyy-MM-dd'), 
        startTime: '10:00', 
        endTime: '12:00' 
      }] 
    }));
  };
  
  const removeShowtime = (i) => {
    if (formData.showtimes.length === 1) return;
    setFormData(prev => ({ 
      ...prev, 
      showtimes: prev.showtimes.filter((_, idx) => idx !== i) 
    }));
  };
  
  const updateShowtime = (i, key, val) => {
    const arr = [...formData.showtimes];
    arr[i] = { ...arr[i], [key]: val };
    // if startTime changed and movie is set, auto compute endTime
    if (key === 'startTime' && formData.movie) {
      const movie = getMovieById(formData.movie);
      if (movie && typeof movie.duration === 'number') {
        const [h, m] = val.split(':').map(Number);
        const st = new Date(); st.setHours(h, m, 0, 0);
        const end = new Date(st.getTime() + movie.duration * 60000);
        arr[i].endTime = format(end, 'HH:mm');
      }
    }
    setFormData(prev => ({ ...prev, showtimes: arr }));
  };

  // validate seatCounts sum equals totalSeats
  const seatCountsValid = () => {
    const c = formData.seatCounts;
    const sum = Number(c.regular || 0) + Number(c.premium || 0) + Number(c.vip || 0) + Number(c.balcony || 0);
    return sum === Number(formData.totalSeats);
  };

  // FORM VALIDATION - UPDATED WITH seatsLimit
  const validateForm = () => {
    const errors = [];

    // Movie
    if (!formData.movie) errors.push("Please select a movie.");

    // Theater
    if (!formData.theater) errors.push("Please select a theater.");

    // Screen
    if (!formData.screen) errors.push("Please select a screen.");

    // Showtimes
    if (!formData.showtimes?.length) {
      errors.push("Please add at least one showtime.");
    } else {
      formData.showtimes.forEach((st, i) => {
        if (!st.date) errors.push(`Showtime ${i + 1}: Date is required`);
        if (!st.startTime) errors.push(`Showtime ${i + 1}: Start time is required`);
        if (!st.endTime) errors.push(`Showtime ${i + 1}: End time missing (auto-calc failed)`);
      });
    }

    // Seats
    if (!formData.totalSeats || formData.totalSeats <= 0) {
      errors.push("Total seats must be greater than 0.");
    }

    // Seats Limit validation
    if (formData.seatsLimit < 0) {
      errors.push("Seats limit cannot be negative.");
    }
    
    if (formData.seatsLimit > formData.totalSeats) {
      errors.push(`Seats limit (${formData.seatsLimit}) cannot exceed total seats (${formData.totalSeats}).`);
    }

    // Seat Counts Match
    const c = formData.seatCounts;
    const sum =
      Number(c.regular || 0) +
      Number(c.premium || 0) +
      Number(c.vip || 0) +
      Number(c.balcony || 0);

    if (sum !== Number(formData.totalSeats)) {
      errors.push(`Seat count mismatch: Total seats = ${formData.totalSeats} but seat allocation = ${sum}`);
    }

    // Prices
    if (!formData.price?.regular || Number(formData.price.regular) <= 0) {
      errors.push("Regular ticket price must be greater than ₹0.");
    }

    // Extra: Prevent negative or empty values
    ["regular", "premium", "vip", "balcony"].forEach(type => {
      if (formData.price[type] < 0) {
        errors.push(`${type.toUpperCase()} price cannot be negative.`);
      }
      if (formData.seatCounts[type] < 0) {
        errors.push(`${type.toUpperCase()} seat count cannot be negative.`);
      }
    });

    return errors;
  };

  // overlap check wrapper using API if available
  const checkOverlapAPI = async ({ theaterId, screen, date, startISO, endISO, excludeShowId = null }) => {
    if (!showAPI.checkOverlap) return { success: false, error: 'No overlap API' };
    try {
      const resp = await showAPI.checkOverlap({ 
        theaterId, 
        screen, 
        date, 
        startTime: startISO, 
        endTime: endISO, 
        excludeShowId 
      });
      return resp;
    } catch (err) {
      return { 
        success: false, 
        error: err?.response?.data?.message || err.message || 'Overlap check failed' 
      };
    }
  };

  // submit -> supports multiple showtimes (creates each show separately) - UPDATED WITH seatsLimit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err));
      setFormLoading(false);
      return;
    }

    // Build payloads for each showtime - INCLUDING seatsLimit
    const payloads = formData.showtimes.map(st => {
      const dateStr = st.date;
      const startISO = new Date(`${dateStr}T${st.startTime}`).toISOString();
      const endISO = new Date(`${dateStr}T${st.endTime}`).toISOString();
      return {
        movie: formData.movie,
        theater: formData.theater,
        screen: Number(formData.screen),
        date: dateStr,
        startTime: startISO,
        endTime: endISO,
        totalSeats: Number(formData.totalSeats),
        seatsLimit: Number(formData.seatsLimit) || 0, // INCLUDE seatsLimit
        seatCounts: {
  regular: Number(formData.seatCounts.regular || 0),
  premium: Number(formData.seatCounts.premium || 0),
  vip: Number(formData.seatCounts.vip || 0),
  balcony: Number(formData.seatCounts.balcony || 0)
},

        price: {
  regular: Number(formData.price.regular || 0),
  premium: Number(formData.price.premium || 0),
  vip: Number(formData.price.vip || 0),
  balcony: Number(formData.price.balcony || 0)
},

        seatLayout: formData.seatLayout,
        isActive: !!formData.isActive
      };
    });

    // Sequentially validate overlap and create
    try {
      const createdShows = [];
      for (let i = 0; i < payloads.length; i++) {
        const p = payloads[i];
        
        // Overlap check
        const overlapResp = await checkOverlapAPI({
          theaterId: p.theater,
          screen: p.screen,
          date: p.date,
          startISO: p.startTime,
          endISO: p.endTime,
          excludeShowId: selectedShow?._id || null
        });

        if (overlapResp && overlapResp.success && overlapResp.overlap) {
          toast.error(`Showtime ${format(new Date(p.startTime), 'hh:mm a')} overlaps with existing show.`);
          setFormLoading(false);
          return;
        } else if (overlapResp && overlapResp.success === false && overlapResp.error && overlapResp.error !== 'No overlap API') {
          toast.warn('Overlap check failed — will rely on server validation on save.');
        }

        // Create or update
        let res;
        if (selectedShow && selectedShow._id && payloads.length === 1) {
          // Update existing show
          res = await showAPI.updateShow(selectedShow._id, p);
        } else {
          // Create new show
          res = await showAPI.createShow(p);
        }

        if (!res || !res.success) {
          const msg = (res && (res.message || (res.errors && res.errors.join(', ')))) || 'Server error creating show';
          toast.error(msg);
          setFormLoading(false);
          return;
        }
        createdShows.push(res.show || res.data || res);
      }

      // Success message
      const seatsLimitMsg = formData.seatsLimit > 0 
        ? ` with ${formData.seatsLimit} seats limit` 
        : '';
      toast.success(
        selectedShow 
          ? `Show updated${seatsLimitMsg}` 
          : `Created ${createdShows.length} show(s)${seatsLimitMsg}`,
        { icon: '🎬' }
      );
      
      setShowModal(false);
      resetForm();
      await loadShows();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Save failed';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (show) => {
    setSelectedShow(show);
    setFormData({
      movie: show.movie?._id || '',
      theater: show.theater?._id || '',
      screen: show.screen || '',
      showtimes: [{
        date: format(new Date(show.date), 'yyyy-MM-dd'),
        startTime: format(new Date(show.startTime), 'HH:mm'),
        endTime: format(new Date(show.endTime), 'HH:mm')
      }],
      totalSeats: show.totalSeats || 0,
      seatsLimit: show.seatsLimit || 0, // INCLUDE seatsLimit
      overrideTotalSeats: true,
      seatCounts: show.seatCounts || { regular: 0, premium: 0, vip: 0, balcony: 0 },
     price: {
  regular: show.price?.regular?.toString() || "",
  premium: show.price?.premium?.toString() || "",
  vip: show.price?.vip?.toString() || "",
  balcony: show.price?.balcony?.toString() || ""
},

      seatLayout: show.seatLayout || 'standard',
      isActive: !!show.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setSelectedShow(null);
  };

  const handleDelete = async () => {
    try {
      if (!selectedShow || !selectedShow._id) throw new Error('No show selected');
      const res = await showAPI.deleteShow(selectedShow._id);
      if (res && res.success) {
        toast.success('Show deleted');
        setShowDeleteModal(false);
        setSelectedShow(null);
        await loadShows();
      } else {
        toast.error(res?.message || 'Delete failed');
      }
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const getStatusBadge = (s) => {
    if (!s.isActive) return <Badge bg="danger">Cancelled</Badge>;
    if (s.availableSeats === 0) return <Badge bg="warning">Housefull</Badge>;
    return <Badge bg="success">Active</Badge>;
  };

  const getSeatsLimitBadge = (s) => {
    if (s.seatsLimit > 0) {
      return (
        <Badge bg="warning" className="ms-1">
          <FaTicketAlt className="me-1" /> 
          Limit: {s.seatsLimit}
        </Badge>
      );
    }
    return (
      <Badge bg="info" className="ms-1">
        No Limit
      </Badge>
    );
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
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
                <FaUserCircle size={24} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">{user?.email || 'admin@cinemahub.com'}</small>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <Nav className="flex-column p-3">
          {navItems.map((item) => (
            <Nav.Item key={item.id} className="mb-2">
<Nav.Link
  as={Link}
  to={item.path}
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

      {/* Main */}
      <div style={{ marginLeft: sidebarCollapsed ? 80 : 250, flex: 1, transition: 'margin-left .25s' }}>
        <div className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Show Management</h4>
            <small className="text-muted">Schedule and manage movie shows</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Badge bg="warning">{shows.length} Shows</Badge>
            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <FaCalendarPlus /> Schedule Show
            </Button>
          </div>
        </div>

        <Container className="py-4">
          {/* Filters */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Movie</Form.Label>
                    <Form.Select 
                      value={filters.movie} 
                      onChange={e => setFilters(prev => ({ ...prev, movie: e.target.value }))}
                    >
                      <option value="">All Movies</option>
                      {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Theater</Form.Label>
                    <Form.Select 
                      value={filters.theater} 
                      onChange={e => setFilters(prev => ({ ...prev, theater: e.target.value }))}
                    >
                      <option value="">All Theaters</option>
                      {theaters.map(t => <option key={t._id} value={t._id}>{t.name} - {t.location?.city}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
  <Button
    variant="outline-primary"
    className="w-100"
    onClick={() =>
      setFilters(prev => ({ ...prev, date: 'all' }))
    }
  >
    🎬 All Shows
  </Button>
</Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={filters.date} 
                      onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))} 
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select 
                      value={filters.status} 
                      onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="housefull">Housefull</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="text-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setFilters({ movie: '', theater: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'all' })}
                  >
                    <FaTimesCircle /> Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Shows table - UPDATED WITH SEATSLIMIT COLUMN */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5"><Spinner /></div>
              ) : filteredShows.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No shows found</h5>
                  <p className="text-muted">Schedule your first show.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Movie</th>
                        <th>Theater</th>
                        <th>Date & Time</th>
                        <th>Screen</th>
                        <th>Seats</th>
                        <th>Limit</th> {/* NEW COLUMN */}
                        <th>Price</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredShows.map((s, idx) => (
                          <motion.tr 
                            key={s._id || idx} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img 
                                  src={s.movie?.posterUrl} 
                                  alt="" 
                                  style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 6 }} 
                                  onError={e => e.target.src = 'https://via.placeholder.com/48x72?text=Movie'} 
                                />
                                <div>
                                  <strong>{s.movie?.title}</strong>
                                  <div className="text-muted" style={{ fontSize: 12 }}>
                                    {getMovieById(s.movie?._id)?.duration ? 
                                      `${Math.floor(getMovieById(s.movie?._id).duration/60)}h ${getMovieById(s.movie?._id).duration%60}m` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {s.theater?.name}
                              <div className="text-muted" style={{ fontSize: 12 }}>
                                {s.theater?.location?.city}
                              </div>
                            </td>
                            <td>
                            <div>
  <strong>
    {format(
      new Date(
        new Date(s.startTime).toLocaleString("en-US", {
          timeZone: "Asia/Kolkata"
        })
      ),
      'MMM dd, yyyy'
    )}
  </strong>
</div>

                              <div className="text-muted" style={{ fontSize: 13 }}>
                                {format(new Date(s.startTime), 'hh:mm a')} - {format(new Date(s.endTime), 'hh:mm a')}
                              </div>
                            </td>
                            <td>
                              <Badge bg="dark">Screen {s.screen}</Badge>
                            </td>
                            <td>
                              <div>
                                <strong>{s.availableSeats}/{s.totalSeats}</strong>
                                {getSeatsLimitBadge(s)}
                              </div>
                              <div className="progress mt-1" style={{ height: 6, width: 120 }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar" 
                                  style={{ width: `${(s.availableSeats/s.totalSeats)*100}%` }} 
                                />
                              </div>
                            </td>
                            <td> {/* SEATS LIMIT COLUMN */}
                              {s.seatsLimit > 0 ? (
                                <Badge bg="warning" className="px-2 py-1">
                                  Max {s.seatsLimit}
                                </Badge>
                              ) : (
                                <Badge bg="info" className="px-2 py-1">
                                  No Limit
                                </Badge>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: 13 }}>
                                <div>₹ {s.price?.regular} Regular</div>
                                {s.price?.premium ? <div>₹ {s.price?.premium} Premium</div> : null}
                                {s.price?.vip ? <div>₹ {s.price?.vip} VIP</div> : null}
                                {s.price?.balcony ? <div>₹ {s.price?.balcony} Balcony</div> : null}
                              </div>
                            </td>
                            <td>{getStatusBadge(s)}</td>
<td className="text-center">
  <ButtonGroup size="sm">

    {/* 👁 View Booking Page */}
    <Button
      variant="outline-info"
      disabled={!s.isActive || s.availableSeats === 0}
      title={
        !s.isActive
          ? 'Show is cancelled'
          : s.availableSeats === 0
          ? 'Housefull'
          : 'View Booking Page'
      }
      onClick={() => navigate(`/booking/${s._id}`)}
    >
      <FaEye />
    </Button>

    {/* ✏️ Edit Show */}
    <Button
      variant="outline-primary"
      title="Edit Show"
      onClick={() => openEditModal(s)}
    >
      <FaEdit />
    </Button>

    {/* 🗑 Delete Show */}
    <Button
      variant="outline-danger"
      disabled={s.bookedSeats?.length > 0}
      title={
        s.bookedSeats?.length > 0
          ? 'Cannot delete – bookings exist'
          : 'Delete Show'
      }
      onClick={() => {
        setSelectedShow(s);
        setShowDeleteModal(true);
      }}
    >
      <FaTrash />
    </Button>

  </ButtonGroup>
</td>

                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Add / Edit Modal - UPDATED WITH SEATSLIMIT FIELD */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedShow ? 'Edit Show' : 'Schedule New Show'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formLoading && (
              <div 
                className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center" 
                style={{ zIndex: 9, background: 'rgba(255,255,255,0.7)' }}
              >
                <Spinner />
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Movie *</Form.Label>
                  <Form.Select 
                    name="movie" 
                    value={formData.movie} 
                    onChange={(e) => { handleFormChange(e); }} 
                    required
                  >
                    <option value="">Choose movie...</option>
                    {movies.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.title} ({Math.floor(m.duration/60)}h {m.duration%60}m)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Theater *</Form.Label>
                  <Form.Select 
                    name="theater" 
                    value={formData.theater} 
                    onChange={handleFormChange} 
                    required
                  >
                    <option value="">Choose theater...</option>
                    {theaters.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} - {t.location?.city}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.theater && (
              <Form.Group className="mb-3">
                <Form.Label>Select Screen *</Form.Label>
                <Form.Select 
                  name="screen" 
                  value={formData.screen} 
                  onChange={handleFormChange} 
                  required
                >
                  <option value="">Choose screen...</option>
                  {getAvailableScreens().map(s => (
                    <option key={s.screenNumber} value={s.screenNumber}>
                      Screen {s.screenNumber} ({s.screenType}) - {s.capacity} seats
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <hr />

            <h6>Showtimes</h6>
            {formData.showtimes.map((st, i) => (
              <Row className="g-2 align-items-end mb-2" key={i}>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={st.date} 
                      onChange={(e) => updateShowtime(i, 'date', e.target.value)} 
                      min={format(new Date(), 'yyyy-MM-dd')} 
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start</Form.Label>
                    <Form.Control 
                      type="time" 
                      value={st.startTime} 
                      onChange={(e) => updateShowtime(i, 'startTime', e.target.value)} 
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>End</Form.Label>
                    <Form.Control 
                      type="time" 
                      value={st.endTime} 
                      readOnly 
                    />
                    <Form.Text className="text-muted">Auto from movie duration</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={2} className="text-end">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeShowtime(i)} 
                    disabled={formData.showtimes.length === 1}
                  >
                    <FaMinus />
                  </Button>{' '}
                  <Button 
                    variant="outline-success" 
                    size="sm" 
                    onClick={addShowtime}
                  >
                    <FaPlus />
                  </Button>
                </Col>
              </Row>
            ))}

            <hr />

            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Seats *</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number" 
                      name="totalSeats" 
                      value={formData.totalSeats} 
                      onChange={handleFormChange} 
                      min={1} 
                      disabled={!formData.overrideTotalSeats} 
                      required 
                    />
                    <InputGroup.Text>
                      <Form.Check 
                        type="checkbox" 
                        name="overrideTotalSeats" 
                        checked={formData.overrideTotalSeats} 
                        onChange={handleFormChange} 
                        title="Override screen capacity" 
                      />
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Uncheck to use screen capacity automatically.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Seat Layout</Form.Label>
                  <Form.Select 
                    name="seatLayout" 
                    value={formData.seatLayout} 
                    onChange={handleFormChange}
                  >
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Check 
                  label="Active Show" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleFormChange} 
                />
              </Col>
            </Row>

            <hr />

            {/* ✅ SEATS LIMIT FIELD */}
            <h6>Seats Limit Configuration *</h6>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Maximum Seats Allowed</strong>
                    <small className="text-muted ms-2">(0 = No Limit)</small>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="seatsLimit"
                    value={formData.seatsLimit}
                    onChange={handleFormChange}
                    min="0"
                    max={formData.totalSeats}
                    placeholder="Enter maximum seats allowed for this show"
                  />
                  <Form.Text className="text-muted">
                    <strong>Example:</strong> Theater has <strong>{formData.totalSeats}</strong> seats, 
                    but you want to allow only <strong>{formData.seatsLimit || formData.totalSeats}</strong> seats for this show.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <h6 className="mb-2">Seats Limit Guide</h6>
                  <ul className="small mb-0">
                    <li><strong>0</strong> = No limit (show all {formData.totalSeats} seats)</li>
                    <li><strong>3</strong> = Show only 3 seats out of {formData.totalSeats}</li>
                    <li><strong>10</strong> = Show only 10 seats out of {formData.totalSeats}</li>
                    <li><strong>{formData.totalSeats}</strong> = Show all seats (same as 0)</li>
                  </ul>
                  {formData.seatsLimit > 0 && formData.seatsLimit < formData.totalSeats && (
                    <Alert variant="warning" className="mt-2 p-2 small">
                      <FaInfoCircle className="me-1" />
                      Only {formData.seatsLimit} seats will be available for booking out of {formData.totalSeats} total seats.
                    </Alert>
                  )}
                </div>
              </Col>
            </Row>

            <hr />

            <h6>Seat allocation (counts) *</h6>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Regular (count)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="seatCounts.regular" 
                    value={formData.seatCounts.regular} 
                    onChange={handleFormChange} 
                    min={0} 
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Premium (count)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="seatCounts.premium" 
                    value={formData.seatCounts.premium} 
                    onChange={handleFormChange} 
                    min={0} 
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>VIP (count)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="seatCounts.vip" 
                    value={formData.seatCounts.vip} 
                    onChange={handleFormChange} 
                    min={0} 
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Balcony (count)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="seatCounts.balcony" 
                    value={formData.seatCounts.balcony} 
                    onChange={handleFormChange} 
                    min={0} 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Text className="text-muted">
              Make sure counts sum equals total seats ({formData.totalSeats}).
            </Form.Text>

            <hr />

            <h6>Pricing (per seat)</h6>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Regular (₹)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="price.regular" 
                      value={formData.price.regular} 
                      onChange={handleFormChange} 
                      min={0} 
                      required 
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Premium (₹)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="price.premium" 
                      value={formData.price.premium} 
                      onChange={handleFormChange} 
                      min={0} 
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>VIP (₹)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="price.vip" 
                      value={formData.price.vip} 
                      onChange={handleFormChange} 
                      min={0} 
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Balcony (₹)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="price.balcony" 
                      value={formData.price.balcony} 
                      onChange={handleFormChange} 
                      min={0} 
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <div className="text-muted">
              <FaInfoCircle /> 
              Make sure seat counts sum equals total seats. Regular price required.
              {formData.seatsLimit > 0 && (
                <span className="text-warning ms-2">
                  <FaTicketAlt /> Seats limit: {formData.seatsLimit} seats
                </span>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outline-secondary" 
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Spinner size="sm" className="me-2" /> 
                  Saving...
                </>
              ) : (
                selectedShow ? 'Update Show' : 'Schedule Show'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete confirm */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete show <strong>{selectedShow?.movie?.title}</strong> at <strong>{selectedShow?.theater?.name}</strong>?
          </p>
          <Alert variant="warning">
            This will cancel all bookings for the show (if any).
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShowManagement;