import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Modal, Form, Alert, Spinner,
  InputGroup, ButtonGroup, Pagination, Dropdown,
  Nav, Offcanvas, DropdownButton
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { 
  fetchMovies, 
  setFilters, 
  clearFilters 
} from '../../features/movieSlice';
import { movieAPI } from '../../services/api';

// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaSearch,
  FaFilter, FaPlusCircle, FaStar, FaEdit,
  FaToggleOn, FaToggleOff, FaTrash, FaInfoCircle,
  FaLink, FaTags, FaUserFriends, FaSave,
  FaTimes, FaChevronLeft, FaChevronRight,
  FaClock, FaEye, FaEllipsisV, FaSort,
  FaSortUp, FaSortDown, FaDownload, FaUpload,
  FaCalendar, FaLanguage, FaVideo
} from 'react-icons/fa';

const MovieManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { movies, loading, pagination, filters } = useSelector(state => state.movies);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1200);
  
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    genre: [],
    releaseDate: "",
    posterUrl: "",
    trailerUrl: "",
    bannerUrl: "",
    rating: "",
    totalRatings: "",
    language: "English",
    cast: [],
    director: "",
    producer: "",
    writers: "",
    isActive: true,
    isFeatured: false
  });

  // Input states
  const [castInput, setCastInput] = useState({ 
    name: "", 
    character: "", 
    imageUrl: "" ,
  });
  const [genreInput, setGenreInput] = useState("");

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

  // Language options
  const languageOptions = [
    'English', 'Hindi', 'Tamil', 'Telugu', 
    'Malayalam', 'Kannada', 'Other'
  ];

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 992);
      setIsTablet(width < 1200 && width >= 768);
      if (width < 992) {
        setSidebarCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchMovies(filters));
  }, [filters, dispatch]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  // Handle filters
useEffect(() => {
  const filterUpdates = { page: 1 };

  // Status
  if (statusFilter === 'active') {
    filterUpdates.isActive = true;
  } else if (statusFilter === 'inactive') {
    filterUpdates.isActive = false;
  }

  // Featured ✅ FIXED
  if (featuredFilter === 'featured') {
    filterUpdates.isFeatured = true;
  } else if (featuredFilter === 'not-featured') {
    filterUpdates.isFeatured = false;
  }

  // Language
  if (languageFilter !== 'all') {
    filterUpdates.language = languageFilter;
  }

  // Sorting
  if (sortBy) {
    filterUpdates.sortBy = sortBy;
    filterUpdates.sortOrder = sortOrder;
  }

  dispatch(setFilters(filterUpdates));
}, [
  statusFilter,
  featuredFilter,
  languageFilter,
  sortBy,
  sortOrder,
  dispatch
]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Add genre
  const addGenre = () => {
    const trimmedInput = genreInput.trim();
    if (trimmedInput && !formData.genre.includes(trimmedInput)) {
      setFormData(prev => ({ 
        ...prev, 
        genre: [...prev.genre, trimmedInput] 
      }));
      setGenreInput("");
      toast.success(`Added genre: ${trimmedInput}`, {
        icon: '🏷️',
        position: "bottom-right"
      });
    }
  };

  // Remove genre
  const removeGenre = (genreToRemove) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(g => g !== genreToRemove)
    }));
  };

  // Add cast member
  const addCast = () => {
  if (castInput.name.trim() && castInput.character.trim()) {
    const newCast = {
      name: castInput.name.trim(),
      character: castInput.character.trim(),
      imageUrl: castInput.imageUrl
        ? castInput.imageUrl
        : `https://ui-avatars.com/api/?name=${castInput.name}&background=random`
    };

    setFormData(prev => ({
      ...prev,
      cast: [...prev.cast, newCast]
    }));

    setCastInput({ name: "", character: "", imageUrl: "" });

    toast.success(`Added cast: ${newCast.name}`, {
      icon: '🎭',
      position: "bottom-right"
    });
  }
};
  // Remove cast member
  const removeCast = (index) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.filter((_, i) => i !== index)
    }));
  };

  // Format date for form
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString.substring(0, 10);
    }
  };

  // Upload image
  const uploadImage = async (file, type) => {
    try {
      const form = new FormData();
      form.append("image", file);

      const res = await movieAPI.uploadImage(form);
      const imageUrl = res?.data?.url || res?.url;

      if (!imageUrl) {
        toast.error(`${type} upload failed`);
        return null;
      }

      setFormData(prev => ({
        ...prev,
        [type === 'poster' ? 'posterUrl' : 'bannerUrl']: imageUrl
      }));

      toast.success(`${type} uploaded!`);
      return imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`${type} upload failed`);
      return null;
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const movieData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration) || 120,
        genre: formData.genre || [],
        releaseDate: new Date(formData.releaseDate).toISOString(),
        posterUrl: formData.posterUrl || 'https://via.placeholder.com/300x450?text=Movie+Poster',
        trailerUrl: formData.trailerUrl || '',
        bannerUrl: formData.bannerUrl || formData.posterUrl || 'https://via.placeholder.com/1920x1080?text=Movie+Banner',
        rating: Number(formData.rating) || 0,
        totalRatings: Number(formData.totalRatings) || 0,
        language: formData.language || 'English',
        cast: formData.cast || [],
        director: formData.director || '',
        producer: formData.producer || '',
        writers: formData.writers
          ? formData.writers.split(",").map(w => w.trim()).filter(w => w)
          : [],
        isActive: formData.isActive,
        isFeatured: formData.isFeatured
      };

      let response;

      if (selectedMovie) {
        response = await movieAPI.updateMovie(selectedMovie._id, movieData);
        toast.success('🎬 Movie Updated Successfully!', {
          position: "top-center",
          autoClose: 3000
        });
      } else {
        response = await movieAPI.createMovie(movieData);
        toast.success('🎬 Movie Created Successfully!', {
          position: "top-center",
          autoClose: 3000
        });
      }

      setShowModal(false);
      setSelectedMovie(null);
      dispatch(fetchMovies(filters));

    } catch (error) {
      console.error("MOVIE SAVE ERROR:", error);
      toast.error(error?.response?.data?.message || error?.message || "Movie Save Failed", {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (movieId) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await movieAPI.deleteMovie(movieId);
        toast.success('🗑️ Movie Deleted Successfully!', {
          position: "top-center"
        });
        dispatch(fetchMovies(filters));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to delete movie");
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (movieId, currentStatus) => {
    try {
      await movieAPI.updateMovie(movieId, { isActive: !currentStatus });
      toast.success(`Status ${!currentStatus ? 'Activated' : 'Deactivated'}`, {
        position: "bottom-right"
      });
      dispatch(fetchMovies(filters));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (movieId, currentFeatured) => {
    try {
      await movieAPI.updateMovie(movieId, { isFeatured: !currentFeatured });
      toast.success(`Featured ${!currentFeatured ? 'Added' : 'Removed'}`, {
        position: "bottom-right"
      });
      dispatch(fetchMovies(filters));
    } catch (error) {
      toast.error("Failed to update featured status");
    }
  };

  // Open view modal
  const openViewModal = (movie) => {
    setSelectedMovie(movie);
    setShowViewModal(true);
  };

  // Open edit modal
  const openEditModal = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || "",
      genre: movie.genre || [],
      releaseDate: formatDateForInput(movie.releaseDate),
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      bannerUrl: movie.bannerUrl || "",
      rating: movie.rating || "",
      totalRatings: movie.totalRatings || "",
      language: movie.language || "English",
      cast: movie.cast || [],
      director: movie.director || "",
      producer: movie.producer || "",
      writers: movie.writers?.join(", ") || "",
      isActive: movie.isActive,
      isFeatured: movie.isFeatured
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: "",
      genre: [],
      releaseDate: "",
      posterUrl: "",
      trailerUrl: "",
      bannerUrl: "",
      rating: "",
      totalRatings: "",
      language: "English",
      cast: [],
      director: "",
      producer: "",
      writers: "",
      isActive: true,
      isFeatured: false
    });
    setSelectedMovie(null);
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    dispatch(setFilters({ page }));
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Handle logout
  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="opacity-50" />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Mobile table columns
  const mobileColumns = [
    { key: 'poster', label: '', width: '80px' },
    { key: 'title', label: 'Movie', width: 'auto' },
    { key: 'actions', label: '', width: '60px' }
  ];

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar Navigation */}
      {!isMobile && (
        <div 
          className={`bg-dark text-white position-fixed ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
          style={{
            width: sidebarCollapsed ? '80px' : '250px',
            height: '100vh',
            top: 0,
            left: 0,
            zIndex: 1000,
            overflowY: 'auto',
            transition: 'width 0.3s ease'
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
                  <FaFilm size={20} />
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-grow-1">
                  <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                  <small className="text-muted">Movie Manager</small>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <Nav className="flex-column p-3">
            {navItems.map((item) => (
              <Nav.Item key={item.id} className="mb-2">
                <Nav.Link
                  as={Button}
                  variant="link"
                  onClick={() => navigate(item.path)}
                  className={`d-flex align-items-center text-white text-decoration-none ${location.pathname === item.path ? 'bg-primary' : 'hover-bg-dark'}`}
                  style={{
                    borderRadius: '8px',
                    padding: '10px 15px',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    width: '100%'
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
              <div className="d-flex flex-column gap-2">
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaHome className="me-2" />
                  Go to Site
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={handleLogout}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Header */}
{/* Mobile Header */}



      {/* Main Content */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: !isMobile ? (sidebarCollapsed ? '80px' : '250px') : '0',
          paddingTop: isMobile ? '0' : '20px',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh'
        }}
      >
        {/* Top Bar - Desktop Only */}
        {!isMobile && (
          <div className="bg-white border-bottom py-3 px-4 shadow-sm">
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">🎬 Movie Management</h4>
                <small className="text-muted">Manage all movies in your cinema</small>
              </div>
              
              <div className="d-flex align-items-center gap-3">
                <Badge bg="warning" className="px-3 py-2">
                  {pagination?.total || 0} Movies
                </Badge>
                
                <Button 
                  variant="primary" 
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <FaPlusCircle className="me-2" />
                  Add Movie
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <Container fluid className="py-4 px-3 px-md-4">
          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-3 p-md-4">
                <Row className="g-3 align-items-end">
                  {/* Search */}
                  <Col xl={3} lg={4} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSearch className="me-2 text-primary" />
                        Search Movies
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaSearch className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by title or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Status Filter */}
                  <Col xl={2} lg={3} md={4} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaToggleOn className="me-2 text-primary" />
                        Status
                      </Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Featured Filter */}
                  <Col xl={2} lg={3} md={4} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaStar className="me-2 text-primary" />
                        Featured
                      </Form.Label>
                      <Form.Select
                        value={featuredFilter}
                        onChange={(e) => setFeaturedFilter(e.target.value)}
                      >
                        <option value="all">All Movies</option>
                        <option value="featured">Featured Only</option>
                        <option value="not-featured">Not Featured</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Language Filter */}
                  <Col xl={2} lg={3} md={4} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaLanguage className="me-2 text-primary" />
                        Language
                      </Form.Label>
                      <Form.Select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                      >
                        <option value="all">All Languages</option>
                        {languageOptions.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Sort By */}
                  <Col xl={2} lg={3} md={4} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSort className="me-2 text-primary" />
                        Sort By
                      </Form.Label>
                      <Form.Select
                        value={sortBy}
                        onChange={(e) => handleSort(e.target.value)}
                      >
                        <option value="createdAt">Date Added</option>
                        <option value="title">Title</option>
                        <option value="rating">Rating</option>
                        <option value="releaseDate">Release Date</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Action Buttons */}
                  <Col xl={1} lg={12} className="text-end mt-3 mt-xl-0">
                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setFeaturedFilter('all');
                          setLanguageFilter('all');
                          setSortBy('createdAt');
                          setSortOrder('desc');
                          dispatch(clearFilters());
                        }}
                        className="rounded-pill"
                      >
                        <FaTimes className="me-2" />
                        {!isMobile ? 'Clear' : 'Reset'}
                      </Button>
                      
                      {/* Mobile Add Button */}
                      {isMobile && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            resetForm();
                            setShowModal(true);
                          }}
                          className="rounded-pill"
                        >
                          <FaPlusCircle className="me-2" />
                          Add
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Movies Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 fw-semibold">Loading movies...</p>
              </div>
            ) : movies.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <div className="empty-state-icon mb-4 mx-auto">
                    <FaFilm size={48} className="text-muted" />
                  </div>
                  <h4 className="mb-3">No Movies Found</h4>
                  <p className="text-muted mb-4">
                    Try adjusting your filters or add a new movie
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    className="rounded-pill px-4"
                  >
                    <FaPlusCircle className="me-2" />
                    Add First Movie
                  </Button>
                </Card.Body>
              </Card>
            ) : isMobile ? (
              /* Mobile View */
              <div className="d-flex flex-column gap-3">
                {movies.map((movie) => (
                  <Card key={movie._id} className="border-0 shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex gap-3">
                        {/* Poster */}
                        <div className="position-relative" style={{ width: '70px', height: '105px', flexShrink: 0 }}>
                          <img 
                            src={movie.posterUrl} 
                            alt={movie.title}
                            className="rounded-3 w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/70x105?text=Poster';
                            }}
                          />
                          {movie.isFeatured && (
                            <div className="position-absolute top-0 end-0 translate-middle badge bg-warning rounded-circle p-1">
                              <FaStar size={10} />
                            </div>
                          )}
                        </div>
                        
                        {/* Movie Info */}
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="fw-bold mb-1">{movie.title}</h6>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                <Badge bg="info" className="px-2 py-1">
                                  {movie.language || 'English'}
                                </Badge>
                                <Badge bg={movie.isActive ? "success" : "secondary"} className="px-2 py-1">
                                  {movie.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            <Dropdown>
                              <Dropdown.Toggle variant="light" size="sm" className="rounded-circle p-1">
                                <FaEllipsisV />
                              </Dropdown.Toggle>
                              <Dropdown.Menu align="end">
                                <Dropdown.Item onClick={() => openViewModal(movie)}>
                                  <FaEye className="me-2" />
                                  View Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => openEditModal(movie)}>
                                  <FaEdit className="me-2" />
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleToggleStatus(movie._id, movie.isActive)}>
                                  {movie.isActive ? (
                                    <>
                                      <FaToggleOff className="me-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <FaToggleOn className="me-2" />
                                      Activate
                                    </>
                                  )}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleToggleFeatured(movie._id, movie.isFeatured)}>
                                  <FaStar className="me-2" />
                                  {movie.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleDelete(movie._id)} className="text-danger">
                                  <FaTrash className="me-2" />
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                          
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {movie.genre?.slice(0, 2).map((g, i) => (
                              <Badge key={i} bg="light" text="dark" className="border px-2 py-1">
                                {g}
                              </Badge>
                            ))}
                            {movie.genre?.length > 2 && (
                              <Badge bg="secondary" className="px-2 py-1">
                                +{movie.genre.length - 2}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <FaStar className="text-warning me-1" />
                              <span className="fw-bold me-2">{movie.rating?.toFixed(1) || 'N/A'}</span>
                              <small className="text-muted">
                                <FaClock className="me-1" />
                                {formatDuration(movie.duration)}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              /* Desktop/Tablet View */
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: '80px' }} className="ps-4">Poster</th>
                          <th style={{ minWidth: '200px' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('title')}
                            >
                              Title {getSortIcon('title')}
                            </Button>
                          </th>
                          <th>Genre</th>
                          <th>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('language')}
                            >
                              Language {getSortIcon('language')}
                            </Button>
                          </th>
                          <th>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('rating')}
                            >
                              Rating {getSortIcon('rating')}
                            </Button>
                          </th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th className="text-end pe-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {movies.map((movie, index) => (
                            <motion.tr
                              key={movie._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="ps-4">
                                <div className="position-relative" style={{ width: '60px', height: '90px' }}>
                                  <img 
                                    src={movie.posterUrl} 
                                    alt={movie.title}
                                    className="rounded-3 w-100 h-100 object-fit-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/60x90?text=Poster';
                                    }}
                                  />
                                  {movie.isFeatured && (
                                    <div className="position-absolute top-0 end-0 translate-middle badge bg-warning rounded-circle p-1">
                                      <FaStar size={10} />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <h6 className="fw-bold mb-1">{movie.title}</h6>
                                  <small className="text-muted d-block">
                                    <FaCalendar className="me-1" />
                                    {formatDisplayDate(movie.releaseDate)}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '150px' }}>
                                  {movie.genre?.slice(0, 2).map((g, i) => (
                                    <Badge key={i} bg="light" text="dark" className="border">
                                      {g}
                                    </Badge>
                                  ))}
                                  {movie.genre?.length > 2 && (
                                    <Badge bg="secondary">
                                      +{movie.genre.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Badge bg="info" className="px-3 py-2">
                                  {movie.language || 'English'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaStar className="text-warning me-1" />
                                  <span className="fw-bold">{movie.rating?.toFixed(1) || 'N/A'}</span>
                                  <small className="text-muted ms-2">
                                    ({movie.totalRatings || 0})
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="text-muted">
                                  <FaClock className="me-1" />
                                  {formatDuration(movie.duration)}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  <Badge 
                                    bg={movie.isActive ? "success" : "secondary"}
                                    className="px-3 py-2"
                                  >
                                    {movie.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  {movie.isFeatured && (
                                    <Badge bg="warning" className="px-3 py-2">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="text-end pe-4">
                                <div className="d-flex justify-content-end gap-2">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => openViewModal(movie)}
                                    title="View Details"
                                    className="rounded-circle"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    <FaEye />
                                  </Button>
                                  
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openEditModal(movie)}
                                    title="Edit"
                                    className="rounded-circle"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    <FaEdit />
                                  </Button>
                                  
                                  <Button
                                    variant={movie.isActive ? "outline-warning" : "outline-success"}
                                    size="sm"
                                    onClick={() => handleToggleStatus(movie._id, movie.isActive)}
                                    title={movie.isActive ? "Deactivate" : "Activate"}
                                    className="rounded-circle"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    {movie.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                  </Button>
                                  
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(movie._id)}
                                    title="Delete"
                                    className="rounded-circle"
                                    style={{ width: '36px', height: '36px' }}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>

                {/* Pagination */}
                {pagination?.totalPages > 1 && (
                  <div className="border-top p-3 p-md-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center">
                      <div className="text-muted mb-3 mb-md-0">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} movies
                      </div>

                      <Pagination className="mb-0 flex-wrap justify-content-center">
                        <Pagination.Prev
                          disabled={pagination.page === 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >
                          <FaChevronLeft />
                        </Pagination.Prev>

                        {(() => {
                          const pages = [];
                          const totalPages = pagination.totalPages;
                          const currentPage = pagination.page;
                          let startPage = Math.max(1, currentPage - 2);
                          let endPage = Math.min(totalPages, currentPage + 2);

                          if (currentPage - 2 < 1) {
                            endPage = Math.min(totalPages, endPage + (3 - currentPage));
                          }
                          if (currentPage + 2 > totalPages) {
                            startPage = Math.max(1, startPage - (2 - (totalPages - currentPage)));
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <Pagination.Item
                                key={i}
                                active={i === currentPage}
                                onClick={() => handlePageChange(i)}
                              >
                                {i}
                              </Pagination.Item>
                            );
                          }
                          return pages;
                        })()}

                        <Pagination.Next
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        >
                          <FaChevronRight />
                        </Pagination.Next>
                      </Pagination>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        </Container>
      </div>

      {/* Mobile Sidebar Toggle */}


      {/* Mobile Sidebar */}
      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
        style={{ zIndex: 1050 }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>FilmZone Admin</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* User Profile in Mobile Sidebar */}
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                  style={{ width: '50px', height: '50px' }}>
                  <FaFilm size={24} />
                </div>
              </div>
              <div>
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">Movie Manager</small>
              </div>
            </div>
          </div>

          {/* Navigation in Mobile Sidebar */}
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Item key={item.id}>
                <Nav.Link
                  as={Button}
                  variant="link"
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileSidebar(false);
                  }}
                  className={`d-flex align-items-center text-dark text-decoration-none py-3 ${location.pathname === item.path ? 'bg-light' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <span className="me-3" style={{ width: '24px', color: location.pathname === item.path ? '#0d6efd' : '#6c757d' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {/* Mobile Sidebar Footer */}
          <div className="p-3 border-top mt-auto">
            <div className="d-grid gap-2">
              <Button
                variant="outline-primary"
                onClick={() => {
                  navigate('/');
                  setShowMobileSidebar(false);
                }}
                className="d-flex align-items-center justify-content-center"
              >
                <FaHome className="me-2" />
                Go to Site
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => {
                  handleLogout();
                  setShowMobileSidebar(false);
                }}
                className="d-flex align-items-center justify-content-center"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* View Movie Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <FaFilm className="me-2 text-primary" />
            Movie Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMovie && (
            <div className="row g-4">
              <div className="col-md-4">
                <div className="position-relative">
                  <img 
                    src={selectedMovie.posterUrl} 
                    alt={selectedMovie.title}
                    className="img-fluid rounded-3 shadow"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x450?text=Poster';
                    }}
                  />
                  {selectedMovie.isFeatured && (
                    <div className="position-absolute top-0 end-0 m-2 badge bg-warning rounded-pill p-2">
                      <FaStar className="me-1" />
                      Featured
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-8">
                <h3 className="fw-bold mb-3">{selectedMovie.title}</h3>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge bg="info" className="px-3 py-2">
                    {selectedMovie.language || 'English'}
                  </Badge>
                  <Badge bg={selectedMovie.isActive ? "success" : "secondary"} className="px-3 py-2">
                    {selectedMovie.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge bg="light" text="dark" className="border px-3 py-2">
                    <FaClock className="me-1" />
                    {formatDuration(selectedMovie.duration)}
                  </Badge>
                </div>
                <p className="text-muted mb-4">{selectedMovie.description}</p>
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Release Date</small>
                    <strong>{formatDisplayDate(selectedMovie.releaseDate)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Rating</small>
                    <div className="d-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <strong>{selectedMovie.rating?.toFixed(1) || 'N/A'}</strong>
                      <small className="text-muted ms-2">
                        ({selectedMovie.totalRatings || 0} ratings)
                      </small>
                    </div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">Genres</small>
                    <div className="d-flex flex-wrap gap-1">
                      {selectedMovie.genre?.map((g, i) => (
                        <Badge key={i} bg="light" text="dark" className="border">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedMovie.trailerUrl && (
                    <div className="col-12">
                      <small className="text-muted d-block">Trailer</small>
                      <a href={selectedMovie.trailerUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center text-decoration-none">
                        <FaVideo className="me-2 text-danger" />
                        Watch Trailer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowViewModal(false)}
            className="rounded-pill px-4"
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowViewModal(false);
              openEditModal(selectedMovie);
            }}
            className="rounded-pill px-4"
          >
            <FaEdit className="me-2" />
            Edit Movie
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        size="xl"
        centered
        backdrop="static"

      >
        <Modal.Header closeButton className="border-0 pb-0 sticky-top bg-white" style={{ zIndex: 1 }}>
          <Modal.Title>
            <FaFilm className="me-2 text-primary" />
            {selectedMovie ? 'Edit Movie' : 'Add New Movie'}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-0"
          style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {formLoading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3">
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Saving movie...</span>
              </div>
            )}

            <Row>
              <Col lg={8}>
                {/* Basic Info */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaInfoCircle className="me-2 text-primary" />
                      Basic Information
                    </h5>
                    
                    <Row className="g-3">
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Title *</Form.Label>
                          <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Movie title"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Language</Form.Label>
                          <Form.Select
                            name="language"
                            value={formData.language}
                            onChange={handleInputChange}
                          >
                            {languageOptions.map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Duration (minutes) *</Form.Label>
                          <Form.Control
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            required
                            min="1"
                            placeholder="e.g., 120"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Release Date *</Form.Label>
                          <Form.Control
                            type="date"
                            name="releaseDate"
                            value={formData.releaseDate}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Description *</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            placeholder="Movie description"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Media URLs */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaLink className="me-2 text-primary" />
                      Media URLs
                    </h5>
                    
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Poster Image *</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                uploadImage(e.target.files[0], 'poster');
                              }
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Recommended: 300x450px
                          </small>
                          {formData.posterUrl && (
                            <div className="mt-2">
                              <img 
                                src={formData.posterUrl}
                                className="rounded border"
                                style={{ width: '100px', height: '150px', objectFit: 'cover' }}
                                alt="Poster preview"
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Trailer URL</Form.Label>
                          <Form.Control
                            type="url"
                            name="trailerUrl"
                            value={formData.trailerUrl}
                            onChange={handleInputChange}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Banner Image</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                uploadImage(e.target.files[0], 'banner');
                              }
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Recommended: 1920x1080px
                          </small>
                          {formData.bannerUrl && (
                            <div className="mt-2">
                              <img 
                                src={formData.bannerUrl}
                                className="rounded border"
                                style={{ width: '200px', height: '112px', objectFit: 'cover' }}
                                alt="Banner preview"
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                {/* Genres */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaTags className="me-2 text-primary" />
                      Genres
                    </h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Add Genre</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          value={genreInput}
                          onChange={(e) => setGenreInput(e.target.value)}
                          placeholder="Action, Comedy, Drama, Horror, War, Thriller, ..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addGenre();
                            }
                          }}
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={addGenre}
                        >
                          Add
                        </Button>
                      </InputGroup>
                    </Form.Group>
                    
                    <div className="d-flex flex-wrap gap-2">
                      {formData.genre.map((genre, index) => (
                        <Badge key={index} bg="primary" className="d-flex align-items-center gap-1 px-3 py-2">
                          {genre}
                          <button
                            type="button"
                            onClick={() => removeGenre(genre)}
                            className="btn-close btn-close-white btn-sm"
                            style={{ fontSize: '0.6rem' }}
                          />
                        </Badge>
                      ))}
                      {formData.genre.length === 0 && (
                        <small className="text-muted">No genres added yet</small>
                      )}
                    </div>
                  </Card.Body>
                </Card>

                {/* Ratings */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaStar className="me-2 text-primary" />
                      Ratings
                    </h5>
                    
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Rating</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            name="rating"
                            value={formData.rating}
                            onChange={handleInputChange}
                            placeholder="0-10"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Total Ratings</Form.Label>
                          <Form.Control
                            type="number"
                            name="totalRatings"
                            value={formData.totalRatings}
                            onChange={handleInputChange}
                            placeholder="0"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Toggles */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaToggleOn className="me-2 text-primary" />
                      Settings
                    </h5>
                    
                    <div className="form-switches">
                      <Form.Check
                        type="switch"
                        id="isActive"
                        name="isActive"
                        label="Active Movie"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="mb-3"
                      />
                      
                      <Form.Check
                        type="switch"
                        id="isFeatured"
                        name="isFeatured"
                        label="Featured Movie"
                        checked={formData.isFeatured}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Crew & Cast */}
            <Row>
              <Col md={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaUserFriends className="me-2 text-primary" />
                      Crew & Cast
                    </h5>
                    
                    <Row className="g-3 mb-4">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Director</Form.Label>
                          <Form.Control
                            type="text"
                            name="director"
                            value={formData.director}
                            onChange={handleInputChange}
                            placeholder="Director name"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Producer</Form.Label>
                          <Form.Control
                            type="text"
                            name="producer"
                            value={formData.producer}
                            onChange={handleInputChange}
                            placeholder="Producer name"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Writers (comma separated)</Form.Label>
                          <Form.Control
                            type="text"
                            name="writers"
                            value={formData.writers}
                            onChange={handleInputChange}
                            placeholder="Writer1, Writer2, ..."
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    {/* Cast Members */}
                    {/* Cast Members */}
<div className="mb-3">
  <h6 className="fw-semibold mb-3">Cast Members</h6>

  <Row className="g-2 mb-3">
    {/* Actor Name */}
    <Col md={4}>
      <Form.Control
        type="text"
        placeholder="Actor name"
        value={castInput.name}
        onChange={(e) =>
          setCastInput({ ...castInput, name: e.target.value })
        }
      />
    </Col>

    {/* Character Name */}
    <Col md={4}>
      <Form.Control
        type="text"
        placeholder="Character name"
        value={castInput.character}
        onChange={(e) =>
          setCastInput({ ...castInput, character: e.target.value })
        }
      />
    </Col>

    <Col md={4}>
    <Form.Control
      type="text"
      placeholder="Image URL"
      value={castInput.imageUrl}
      onChange={(e) => setCastInput({ ...castInput, imageUrl: e.target.value })}
    />
    <small className="text-muted">Paste any direct image URL here</small>
  </Col>

  <Col md={2}>
    <Button variant="outline-primary" onClick={addCast} className="w-100">
      Add
    </Button>
  </Col>
</Row>
  <div className="d-flex flex-wrap gap-2">
    {formData.cast.length > 0 ? (
      formData.cast.map((member, index) => (
        <Badge
          key={index}
          bg="light"
          text="dark"
          className="d-flex align-items-center gap-2 px-3 py-2 border"
        >
          <img
            src={member.imageUrl}
            alt={member.name}
            className="rounded-circle"
            style={{ width: "30px", height: "30px", objectFit: "cover" }}
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${member.name}&background=random`;
            }}
          />
          <div>
            <div className="fw-bold">{member.name}</div>
            <small>{member.character}</small>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.6rem" }}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                cast: prev.cast.filter((_, i) => i !== index),
              }))
            }
          />
        </Badge>
      ))
    ) : (
      <small className="text-muted">No cast members added yet</small>
    )}
  </div>
</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
          
          <Modal.Footer className="border-0 bg-white sticky-bottom" style={{ zIndex: 1 }}>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="rounded-pill px-4"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={formLoading}
              className="rounded-pill px-5"
            >
              {formLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : selectedMovie ? (
                <>
                  <FaSave className="me-2" />
                  Update Movie
                </>
              ) : (
                <>
                  <FaPlusCircle className="me-2" />
                  Create Movie
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MovieManagement;