import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Modal, Form, Alert, Spinner,
  Dropdown, InputGroup, FormControl,
  Nav, Offcanvas, Pagination, ButtonGroup
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { theaterAPI } from '../../services/api';
import { fetchTheaters, setTheaterFilters } from '../../features/theaterSlice';

import { useSearchParams } from 'react-router-dom';


// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaSearch,
  FaPlus, FaEdit, FaTrash, FaEye,
  FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaClock, FaCheckCircle, FaTimesCircle,
  FaChevronLeft, FaChevronRight, FaFilter,
  FaSortAmountDown, FaSortAmountUp
} from 'react-icons/fa';

const TheaterManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // ✅ HERE (correct place)
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get('page')) || 1;

  const { user } = useSelector(state => state.auth);
const { theaters, loading, pagination = { page: 1, totalPages: 1 } } =
  useSelector(state => state.theaters);

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: '', lng: '' }
    },
    screens: [{ screenNumber: 1, capacity: 100, screenType: 'Standard' }],
    amenities: [],
    contact: {
      phone: '',
      email: ''
    },
    openingHours: {
      weekdays: { open: '10:00', close: '23:00' },
      weekends: { open: '09:00', close: '00:00' }
    },
    isActive: true,
    description: '',
    parkingAvailable: true,
    foodCourt: true,
    wheelchairAccessible: true,
    premiumLounge: false
  });
  
  const [amenityInput, setAmenityInput] = useState('');
  const [formLoading, setFormLoading] = useState(false);
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
  dispatch(setTheaterFilters({ page: pageFromUrl }));
  dispatch(fetchTheaters());
}, [pageFromUrl, dispatch]);

useEffect(() => {
  dispatch(setTheaterFilters({ search: searchTerm, page: 1 }));
}, [searchTerm]);

useEffect(() => {
  dispatch(setTheaterFilters({
    sortBy: sortOrder === 'asc' ? sortBy : `${sortBy}_desc`,
    page: 1
  }));
}, [sortBy, sortOrder]);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split('.');
    
    if (path.length === 1) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === "checkbox" ? checked : value 
      }));
    } else if (path.length === 2) {
      setFormData(prev => ({
        ...prev,
        [path[0]]: { ...prev[path[0]], [path[1]]: value }
      }));
    } else if (path.length === 3) {
      setFormData(prev => ({
        ...prev,
        [path[0]]: {
          ...prev[path[0]],
          [path[1]]: {
            ...prev[path[0]][path[1]],
            [path[2]]: value
          }
        }
      }));
    }
  };

  const handleAddAmenity = () => {
    const trimmedInput = amenityInput.trim();
    if (trimmedInput && !formData.amenities.includes(trimmedInput)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, trimmedInput]
      }));
      setAmenityInput('');
      toast.success(`Added amenity: ${trimmedInput}`);
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleAddScreen = () => {
    setFormData(prev => ({
      ...prev,
      screens: [...prev.screens, { 
        screenNumber: prev.screens.length + 1, 
        capacity: 100, 
        screenType: 'Standard',
        soundSystem: 'Dolby Digital',
        projectionType: '2K'
      }]
    }));
  };

  const handleRemoveScreen = (index) => {
    if (formData.screens.length > 1) {
      const updatedScreens = formData.screens.filter((_, i) => i !== index);
      const renumberedScreens = updatedScreens.map((screen, idx) => ({
        ...screen,
        screenNumber: idx + 1
      }));
      setFormData(prev => ({ ...prev, screens: renumberedScreens }));
    }
  };

  const handleScreenChange = (index, field, value) => {
    const updatedScreens = [...formData.screens];
    updatedScreens[index] = { ...updatedScreens[index], [field]: value };
    setFormData(prev => ({ ...prev, screens: updatedScreens }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const cleanFormData = {
        ...formData,
        location: {
          ...formData.location,
          coordinates: {
            lat: parseFloat(formData.location.coordinates.lat) || 0,
            lng: parseFloat(formData.location.coordinates.lng) || 0
          }
        },
        screens: formData.screens.map(screen => ({
          ...screen,
          capacity: parseInt(screen.capacity) || 100,
          screenNumber: parseInt(screen.screenNumber) || 1
        }))
      };

      let response;
      if (selectedTheater) {
        response = await theaterAPI.updateTheater(selectedTheater._id, cleanFormData);
        toast.success('🎭 Theater updated successfully!', {
          position: "top-center",
          autoClose: 3000
        });
      } else {
        response = await theaterAPI.createTheater(cleanFormData);
        toast.success('🎭 Theater created successfully!', {
          position: "top-center",
          autoClose: 3000
        });
      }

      if (response.success) {
        setShowModal(false);
        setSelectedTheater(null);
        dispatch(fetchTheaters());
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save theater', {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setFormLoading(false);
    }
  };
const goToPage = (page) => {
  setSearchParams({ page });
  dispatch(setTheaterFilters({ page }));
};

  const handleDeleteTheater = async () => {
    try {
      await theaterAPI.deleteTheater(selectedTheater._id);
      toast.success('🗑️ Theater deleted successfully!', {
        position: "top-center"
      });
      setShowDeleteModal(false);
      setSelectedTheater(null);
      dispatch(fetchTheaters());
    } catch (error) {
      toast.error('Failed to delete theater');
    }
  };

  // Filter and sort theaters
 

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getStatusBadge = (status) => {
    return status ? 
      <Badge bg="success" className="px-3 py-2">
        <FaCheckCircle className="me-1" /> Active
      </Badge> : 
      <Badge bg="danger" className="px-3 py-2">
        <FaTimesCircle className="me-1" /> Inactive
      </Badge>;
  };

  const handlePageChange = (page) => {
    // Implement pagination if needed
    console.log('Page change to:', page);
  };

  const openEditModal = (theater) => {
    setSelectedTheater(theater);
    setFormData({
      name: theater.name || '',
      description: theater.description || '',
      location: {
        address: theater.location?.address || '',
        city: theater.location?.city || '',
        state: theater.location?.state || '',
        zipCode: theater.location?.zipCode || '',
        coordinates: {
          lat: theater.location?.coordinates?.lat || '',
          lng: theater.location?.coordinates?.lng || ''
        }
      },
      screens: theater.screens?.map(screen => ({
        screenNumber: screen.screenNumber || 1,
        capacity: screen.capacity || 100,
        screenType: screen.screenType || 'Standard',
        soundSystem: screen.soundSystem || 'Dolby Digital',
        projectionType: screen.projectionType || '2K'
      })) || [{ screenNumber: 1, capacity: 100, screenType: 'Standard' }],
      amenities: theater.amenities || [],
      contact: {
        phone: theater.contact?.phone || '',
        email: theater.contact?.email || ''
      },
      openingHours: theater.openingHours || {
        weekdays: { open: '10:00', close: '23:00' },
        weekends: { open: '09:00', close: '00:00' }
      },
      isActive: theater.isActive !== undefined ? theater.isActive : true,
      parkingAvailable: theater.parkingAvailable || true,
      foodCourt: theater.foodCourt || true,
      wheelchairAccessible: theater.wheelchairAccessible || true,
      premiumLounge: theater.premiumLounge || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: { lat: '', lng: '' }
      },
      screens: [{ screenNumber: 1, capacity: 100, screenType: 'Standard' }],
      amenities: [],
      contact: {
        phone: '',
        email: ''
      },
      openingHours: {
        weekdays: { open: '10:00', close: '23:00' },
        weekends: { open: '09:00', close: '00:00' }
      },
      isActive: true,
      parkingAvailable: true,
      foodCourt: true,
      wheelchairAccessible: true,
      premiumLounge: false
    });
    setSelectedTheater(null);
  };

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
                <FaTheaterMasks size={20} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">Theater Manager</small>
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
              <h4 className="mb-0">🎭 Theater Management</h4>
              <small className="text-muted">Manage all cinema theaters and screens</small>
            </div>
            
            <div className="d-flex align-items-center gap-3">
<Badge bg="warning" className="px-3 py-2 fs-6">
  {pagination?.total || 0} Theaters
</Badge>

              
              <Button 
                variant="primary" 
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Add Theater
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <Container className="py-4">
          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Row className="g-3 align-items-end">
                  {/* Search */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSearch className="me-2 text-primary" />
                        Search Theaters
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaSearch className="text-muted" />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search by name or city..."
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
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Sort */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSortAmountDown className="me-2 text-primary" />
                        Sort By
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Button
                          variant={sortBy === 'name' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => toggleSort('name')}
                          className="d-flex align-items-center"
                        >
                          Name
                          {sortBy === 'name' && (
                            sortOrder === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                          )}
                        </Button>
                        <Button
                          variant={sortBy === 'city' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => toggleSort('city')}
                          className="d-flex align-items-center"
                        >
                          City
                          {sortBy === 'city' && (
                            sortOrder === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                          )}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  {/* Action Buttons */}
                  <Col md={3} className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSortBy('name');
                          setSortOrder('asc');
                        }}
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

          {/* Theaters Table */}
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
                    <p className="mt-3 fw-semibold">Loading theaters...</p>
                  </div>
                ) : theaters.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="empty-state-icon mb-4 mx-auto">
                      <FaTheaterMasks size={48} className="text-muted" />
                    </div>
                    <h4 className="mb-3">No Theaters Found</h4>
                    <p className="text-muted mb-4">
                      Try adjusting your filters or add a new theater
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        resetForm();
                        setShowModal(true);
                      }}
                      className="rounded-pill px-4"
                    >
                      <FaPlus className="me-2" />
                      Add First Theater
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th className="ps-4">Theater</th>
                          <th>Location</th>
                          <th>Screens</th>
                          <th>Amenities</th>
                          <th>Contact</th>
                          <th>Status</th>
                          <th className="text-center pe-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                       {theaters.map((theater, index) => (

                            <motion.tr
                              key={theater._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="ps-4">
                                <div>
                                  <h6 className="fw-bold mb-1">{theater.name}</h6>
                                  <small className="text-muted">
                                    <FaMapMarkerAlt className="me-1" />
                                    {theater.location?.city || 'N/A'}, {theater.location?.state || 'N/A'}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <small>{theater.location?.address?.substring(0, 30)}...</small>
                                  <br />
                                  <Badge bg="info" className="mt-1">
                                    {theater.location?.zipCode || 'N/A'}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <Badge bg="primary" className="mb-1 px-3 py-2">
                                    {theater.screens?.length || 0} Screens
                                  </Badge>
                                  <small className="text-muted">
                                    {theater.screens?.[0]?.screenType || 'Standard'}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {theater.amenities?.slice(0, 2).map((amenity, idx) => (
                                    <Badge key={idx} bg="secondary" className="px-2 py-1">
                                      {amenity.substring(0, 10)}
                                    </Badge>
                                  ))}
                                  {theater.amenities?.length > 2 && (
                                    <Badge bg="light" text="dark" className="px-2 py-1">
                                      +{theater.amenities.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <small className="d-flex align-items-center">
                                    <FaPhone className="me-1" /> {theater.contact?.phone || 'N/A'}
                                  </small>
                                  <small className="d-flex align-items-center">
                                    <FaEnvelope className="me-1" /> {theater.contact?.email || 'N/A'}
                                  </small>
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(theater.isActive)}
                              </td>
                              <td className="text-center pe-4">
                                <ButtonGroup size="sm">
                                  <Button
                                    variant="outline-primary"
                                    onClick={() => openEditModal(theater)}
                                    className="action-btn"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </Button>
                                  
                                  <Button
                                    variant="outline-info"
                                    onClick={() => navigate(`/admin/shows?theater=${theater._id}`)}
                                    className="action-btn"
                                    title="Manage Shows"
                                  >
                                    <FaCalendarAlt />
                                  </Button>
                                  
                                  <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                      setSelectedTheater(theater);
                                      setShowDeleteModal(true);
                                    }}
                                    className="action-btn"
                                    title="Delete"
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
          </motion.div>
          {pagination.totalPages > 1 && (
  <div className="d-flex justify-content-center mt-4">
<Button
  disabled={pagination.page === 1}
  onClick={() => goToPage(pagination.page - 1)}
>
  Prev
</Button>

{Array.from({ length: pagination.totalPages }, (_, i) => (
  <Button
    key={i}
    variant={pagination.page === i + 1 ? 'primary' : 'outline-primary'}
    onClick={() => goToPage(i + 1)}
  >
    {i + 1}
  </Button>
))}

<Button
  disabled={pagination.page === pagination.totalPages}
  onClick={() => goToPage(pagination.page + 1)}
>
  Next
</Button>

  </div>
)}
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

      {/* Add/Edit Theater Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaTheaterMasks className="me-2 text-primary" />
              {selectedTheater ? 'Edit Theater' : 'Add New Theater'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }} className="pt-0">
            {formLoading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3">
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Saving theater...</span>
              </div>
            )}

            <Row>
              <Col md={8}>
                {/* Basic Information */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaTheaterMasks className="me-2 text-primary" />
                      Basic Information
                    </h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Theater Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter theater name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter theater description"
                      />
                    </Form.Group>

                    <h6 className="mb-3">Location Details</h6>
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Control
                          type="text"
                          name="location.address"
                          value={formData.location.address}
                          onChange={handleInputChange}
                          placeholder="Full Address *"
                          required
                          className="mb-2"
                        />
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={4}>
                        <Form.Control
                          type="text"
                          name="location.city"
                          value={formData.location.city}
                          onChange={handleInputChange}
                          placeholder="City *"
                          required
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          type="text"
                          name="location.state"
                          value={formData.location.state}
                          onChange={handleInputChange}
                          placeholder="State *"
                          required
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          type="text"
                          name="location.zipCode"
                          value={formData.location.zipCode}
                          onChange={handleInputChange}
                          placeholder="ZIP Code *"
                          required
                        />
                      </Col>
                    </Row>

                    <h6 className="mb-3">Contact Information</h6>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Control
                          type="tel"
                          name="contact.phone"
                          value={formData.contact.phone}
                          onChange={handleInputChange}
                          placeholder="Phone Number *"
                          required
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="email"
                          name="contact.email"
                          value={formData.contact.email}
                          onChange={handleInputChange}
                          placeholder="Email *"
                          required
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Screens */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">
                        <FaFilm className="me-2 text-primary" />
                        Screens
                      </h5>
                      <Button variant="outline-primary" size="sm" onClick={handleAddScreen}>
                        <FaPlus className="me-1" /> Add Screen
                      </Button>
                    </div>
                    
                    {formData.screens.map((screen, index) => (
                      <Card key={index} className="mb-3 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Screen {screen.screenNumber}</h6>
                            {formData.screens.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveScreen(index)}
                              >
                                <FaTimesCircle />
                              </Button>
                            )}
                          </div>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-2">
                                <Form.Label>Capacity *</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={screen.capacity}
                                  onChange={(e) => handleScreenChange(index, 'capacity', e.target.value)}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-2">
                                <Form.Label>Screen Type</Form.Label>
                                <Form.Select
                                  value={screen.screenType}
                                  onChange={(e) => handleScreenChange(index, 'screenType', e.target.value)}
                                >
                                  <option value="Standard">Standard</option>
                                  <option value="IMAX">IMAX</option>
                                  <option value="4DX">4DX</option>
                                  <option value="Dolby">Dolby Atmos</option>
                                  <option value="VIP">VIP</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-2">
                                <Form.Label>Sound System</Form.Label>
                                <Form.Select
                                  value={screen.soundSystem}
                                  onChange={(e) => handleScreenChange(index, 'soundSystem', e.target.value)}
                                >
                                  <option value="Dolby Digital">Dolby Digital</option>
                                  <option value="Dolby Atmos">Dolby Atmos</option>
                                  <option value="DTS">DTS</option>
                                  <option value="IMAX Sound">IMAX Sound</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-2">
                                <Form.Label>Projection Type</Form.Label>
                                <Form.Select
                                  value={screen.projectionType}
                                  onChange={(e) => handleScreenChange(index, 'projectionType', e.target.value)}
                                >
                                  <option value="2K">2K</option>
                                  <option value="4K">4K</option>
                                  <option value="IMAX">IMAX</option>
                                  <option value="Laser">Laser</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                {/* Amenities */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaCheckCircle className="me-2 text-primary" />
                      Amenities
                    </h5>
                    
                    <InputGroup className="mb-3">
                      <FormControl
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        placeholder="Add amenity (e.g., Parking)"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
                      />
                      <Button variant="outline-primary" onClick={handleAddAmenity}>
                        Add
                      </Button>
                    </InputGroup>
                    
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {formData.amenities.map((amenity, index) => (
                        <Badge key={index} bg="primary" className="d-flex align-items-center gap-1 px-3 py-2">
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="btn-close btn-close-white btn-sm"
                            style={{ fontSize: '0.6rem' }}
                          />
                        </Badge>
                      ))}
                    </div>

                    <div className="form-switches">
                      <Form.Check
                        type="switch"
                        id="parkingAvailable"
                        name="parkingAvailable"
                        label="Parking Available"
                        checked={formData.parkingAvailable}
                        onChange={handleInputChange}
                        className="mb-3"
                      />
                      
                      <Form.Check
                        type="switch"
                        id="foodCourt"
                        name="foodCourt"
                        label="Food Court"
                        checked={formData.foodCourt}
                        onChange={handleInputChange}
                        className="mb-3"
                      />
                      
                      <Form.Check
                        type="switch"
                        id="wheelchairAccessible"
                        name="wheelchairAccessible"
                        label="Wheelchair Accessible"
                        checked={formData.wheelchairAccessible}
                        onChange={handleInputChange}
                        className="mb-3"
                      />
                      
                      <Form.Check
                        type="switch"
                        id="premiumLounge"
                        name="premiumLounge"
                        label="Premium Lounge"
                        checked={formData.premiumLounge}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Card.Body>
                </Card>

                {/* Opening Hours */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaClock className="me-2 text-primary" />
                      Opening Hours
                    </h5>
                    
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Label>Weekdays</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="time"
                            name="openingHours.weekdays.open"
                            value={formData.openingHours.weekdays.open}
                            onChange={handleInputChange}
                          />
                          <Form.Control
                            type="time"
                            name="openingHours.weekdays.close"
                            value={formData.openingHours.weekdays.close}
                            onChange={handleInputChange}
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <Form.Label>Weekends</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="time"
                            name="openingHours.weekends.open"
                            value={formData.openingHours.weekends.open}
                            onChange={handleInputChange}
                          />
                          <Form.Control
                            type="time"
                            name="openingHours.weekends.close"
                            value={formData.openingHours.weekends.close}
                            onChange={handleInputChange}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Status */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">
                      <FaCheckCircle className="me-2 text-primary" />
                      Status
                    </h5>
                    
                    <Form.Check
                      type="switch"
                      id="isActive"
                      name="isActive"
                      label="Active Theater"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="mb-0"
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
          
          <Modal.Footer className="border-0">
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
              ) : selectedTheater ? (
                <>
                  <FaEdit className="me-2" />
                  Update Theater
                </>
              ) : (
                <>
                  <FaPlus className="me-2" />
                  Create Theater
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger">
            <FaTrash className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="border-0">
            <h6 className="mb-3">Are you sure you want to delete this theater?</h6>
            <p className="mb-0">
              <strong>{selectedTheater?.name}</strong> will be permanently deleted.
            </p>
          </Alert>
          <Alert variant="warning" className="border-0">
            <FaClock className="me-2" />
            This action will also delete all shows and bookings associated with this theater.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-pill px-4"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteTheater}
            className="rounded-pill px-4"
          >
            <FaTrash className="me-2" />
            Delete Theater
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

export default TheaterManagement;