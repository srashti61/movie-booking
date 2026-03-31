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
import { format, parseISO, isToday, subDays } from 'date-fns';
import { userAPI } from '../../services/api';

// Icons
import {
  FaTachometerAlt,
  FaFilm,
  FaTheaterMasks,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaBars,
  FaUserShield,
  FaUserCircle,
  FaUserCheck,
  FaUserSlash,
  FaClock,
  FaStar,
  FaHome,
  FaSignOutAlt,
  FaPrint,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimesCircle,
  FaPhone,
  FaMoneyBillWave,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaEnvelope,
  FaExclamationTriangle,
  FaTicketAlt
} from "react-icons/fa";


const UserManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // User states
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isAdmin: false,
    status: 'active',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: true
    }
  });
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
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      if (response.success) {
        setUsers(response.users || generateMockUsers());
      } else {
        setUsers(generateMockUsers());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers(generateMockUsers());
    } finally {
      setLoading(false);
    }
  };

  const generateMockUsers = () => {
    const mockUsers = [];
    const firstNames = ['John', 'Jane', 'Robert', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
    const statuses = ['active', 'active', 'active', 'active', 'suspended', 'pending']; // Weighted for more active users

    for (let i = 1; i <= 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const isAdmin = i % 10 === 0; // Every 10th user is admin
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const joinDate = subDays(new Date(), Math.floor(Math.random() * 365));
      const totalBookings = Math.floor(Math.random() * 50);
      const totalSpent = totalBookings * (200 + Math.floor(Math.random() * 300));
      const loyaltyPoints = totalBookings * 10;

      mockUsers.push({
        _id: `user_${i}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`,
        isAdmin,
        status,
        createdAt: joinDate,
        updatedAt: new Date(),
        profileImage: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        address: `${Math.floor(Math.random() * 1000)} Street`,
        city,
        state: 'Maharashtra',
        zipCode: '4000' + Math.floor(Math.random() * 100),
        bookings: totalBookings,
        totalSpent,
        loyaltyPoints,
        preferences: {
          emailNotifications: Math.random() > 0.5,
          smsNotifications: Math.random() > 0.5,
          newsletter: Math.random() > 0.5
        }
      });
    }

    return mockUsers;
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user =>
        filterRole === 'admin' ? user.isAdmin : !user.isAdmin
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch(sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'bookings':
          aValue = a.bookings || 0;
          bValue = b.bookings || 0;
          break;
        case 'totalSpent':
          aValue = a.totalSpent || 0;
          bValue = b.totalSpent || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [prefField]: checked }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (selectedUser) {
        const response = await userAPI.updateUser(selectedUser._id, formData);
        if (response.success) {
          toast.success('👤 User updated successfully!', {
            position: "top-center",
            autoClose: 3000
          });
          setShowModal(false);
          fetchUsers();
        }
      } else {
        toast.info('User creation requires registration form');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save user', {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await userAPI.deleteUser(selectedUser._id);
      if (response.success) {
        toast.success('🗑️ User deleted successfully!', {
          position: "top-center"
        });
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleMakeAdmin = async (userId, makeAdmin) => {
    try {
      const response = await userAPI.updateUser(userId, { isAdmin: makeAdmin });
      if (response.success) {
        toast.success(`User ${makeAdmin ? 'promoted to admin' : 'demoted from admin'}!`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      const response = await userAPI.updateUser(userId, { status });
      if (response.success) {
        toast.success(`User ${status} successfully!`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getRoleBadge = (isAdmin) => {
    return isAdmin ? (
      <Badge bg="danger" className="d-flex align-items-center gap-1 px-3 py-2">
        <FaUserShield />
        Admin
      </Badge>
    ) : (
      <Badge bg="secondary" className="d-flex align-items-center gap-1 px-3 py-2">
        <FaUserCircle />
        User
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'success', text: 'Active', icon: <FaUserCheck /> },
      suspended: { bg: 'danger', text: 'Suspended', icon: <FaUserSlash /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> }
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status, icon: <FaUserCircle /> };
    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1 px-3 py-2">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getLoyaltyBadge = (points) => {
    if (points > 2000) return { bg: 'warning', text: 'Gold', icon: <FaStar /> };
    if (points > 1000) return { bg: 'secondary', text: 'Silver', icon: <FaStar /> };
    return { bg: 'dark', text: 'Bronze', icon: <FaStar /> };
  };

  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      isAdmin: user.isAdmin || false,
      status: user.status || 'active',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      preferences: user.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        newsletter: true
      }
    });
    setShowModal(true);
  };

const stats = {
  totalUsers: users.length,
  adminUsers: users.filter(u => u.isAdmin).length,
  activeUsers: users.filter(u => u.status === 'active').length,
  newToday: users.filter(u => isToday(new Date(u.createdAt))).length,
  totalRevenue: users.reduce((sum, u) => sum + Number(u.totalSpent || 0), 0),
 totalBookings: users.reduce(
  (sum, u) => sum + Number(u.totalBookings || 0),
  0
),

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
                <FaUsers size={20} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">User Manager</small>
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
              <h4 className="mb-0">👥 User Management</h4>
              <small className="text-muted">Manage all user accounts and permissions</small>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <Badge bg="warning" className="px-3 py-2 fs-6">
                {users.length} Users
              </Badge>
              
              <Button 
                variant="outline-primary"
                onClick={() => window.print()}
              >
                <FaPrint className="me-2" />
                Export Report
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
<Row className="g-3">
  <Col xs={6} sm={4} md={2} lg>
    <Card className="text-center border-0 shadow-sm h-100">
      <Card.Body>
        <h3 className="text-primary">{stats.totalUsers}</h3>
        <Card.Text className="text-muted">Total Users</Card.Text>
      </Card.Body>
    </Card>
  </Col>

  <Col xs={6} sm={4} md={2} lg>
    <Card className="text-center border-0 shadow-sm bg-danger text-white h-100">
      <Card.Body>
        <h3>{stats.adminUsers}</h3>
        <Card.Text>Admins</Card.Text>
      </Card.Body>
    </Card>
  </Col>

  <Col xs={6} sm={4} md={2} lg>
    <Card className="text-center border-0 shadow-sm bg-success text-white h-100">
      <Card.Body>
        <h3>{stats.activeUsers}</h3>
        <Card.Text>Active</Card.Text>
      </Card.Body>
    </Card>
  </Col>

  <Col xs={6} sm={4} md={2} lg>
    <Card className="text-center border-0 shadow-sm bg-info text-white h-100">
      <Card.Body>
        <h3>{stats.newToday}</h3>
        <Card.Text>New Today</Card.Text>
      </Card.Body>
    </Card>
  </Col>

  <Col xs={12} sm={4} md={2} lg>
    <Card className="text-center border-0 shadow-sm bg-warning text-dark h-100">
      <Card.Body>
        <h3>{stats.totalBookings}</h3>
        <Card.Text>Total Bookings</Card.Text>
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
                        Search Users
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaSearch className="text-muted" />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search by name, email, or city..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* Role Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaUserShield className="me-2 text-primary" />
                        Role
                      </Form.Label>
                      <Form.Select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </Form.Select>
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
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Sort Options */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaSortAmountDown className="me-2 text-primary" />
                        Sort By
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Button
                          variant={sortBy === 'createdAt' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => toggleSort('createdAt')}
                          className="d-flex align-items-center"
                        >
                          Date
                          {sortBy === 'createdAt' && (
                            sortOrder === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                          )}
                        </Button>
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
                      </div>
                    </Form.Group>
                  </Col>

                  {/* Action Buttons */}
                  <Col md={2} className="text-end">
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

          {/* Users Table */}
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
                    <p className="mt-3 fw-semibold">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="empty-state-icon mb-4 mx-auto">
                      <FaUsers size={48} className="text-muted" />
                    </div>
                    <h4 className="mb-3">No Users Found</h4>
                    <p className="text-muted mb-4">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                      <div>
                        <span className="text-muted">
                          Showing {Math.min(indexOfFirstItem + 1, filteredUsers.length)}-
                          {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <Button 
                          variant="primary"
                          onClick={() => window.open('/register', '_blank')}
                        >
                          <FaUserPlus className="me-2" />
                          Add New User
                        </Button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="ps-4">User</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Activity</th>
                            <th className="text-center pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {currentItems.map((user, index) => (
                              <motion.tr
                                key={user._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <td className="ps-4">
                                  <div className="d-flex align-items-center">
                                    <img
                                      src={user.profileImage}
                                      alt={user.name}
                                      className="rounded-circle"
                                      style={{ width: '45px', height: '45px', objectFit: 'cover', marginRight: '10px' }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                      }}
                                    />
                                    <div>
                                      <strong>{user.name}</strong>
                                      <div className="text-muted small">{user.email}</div>
                                      <small className="text-muted">
                                        Joined: {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <small className="d-flex align-items-center gap-1">
                                      <FaPhone size={12} />
                                      {user.phone || 'Not provided'}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <small>{user.city || 'N/A'}</small>
                                    <br />
                                    <small className="text-muted">{user.state || ''}</small>
                                  </div>
                                </td>
                                <td>{getRoleBadge(user.isAdmin)}</td>
                                <td>{getStatusBadge(user.status)}</td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <div className="d-flex gap-2">
<td>
  <Badge
    bg="info"
    style={{
      maxWidth: "180px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      display: "inline-block"
    }}
    title={user._id}
  >
    {user._id.slice(0, 8)}...{user._id.slice(-4)}
  </Badge>
</td>

                                      <Badge bg={getLoyaltyBadge(user.loyaltyPoints || 0).bg} className="px-2 py-1">
                                        <FaMoneyBillWave className="me-1" />
                                        ₹{user.totalSpent || 0}
                                      </Badge>
                                    </div>
                                    <small className="text-muted mt-1">
                                      <FaStar className="me-1" />
                                      {getLoyaltyBadge(user.loyaltyPoints || 0).text} Member
                                    </small>
                                  </div>
                                </td>
                                <td className="text-center pe-4">
                                  <ButtonGroup size="sm">

                                    
                                    <Button
                                      variant="outline-primary"
                                      onClick={() => openEditModal(user)}
                                      className="action-btn"
                                      title="Edit User"
                                    >
                                      <FaEdit />
                                    </Button>
                                    
                                    {user.isAdmin ? (
                                      <Button
                                        variant="outline-danger"
                                        onClick={() => handleMakeAdmin(user._id, false)}
                                        className="action-btn"
                                        title="Remove Admin"
                                      >
                                        <FaUserShield />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline-success"
                                        onClick={() => handleMakeAdmin(user._id, true)}
                                        className="action-btn"
                                        title="Make Admin"
                                      >
                                        <FaUserShield />
                                      </Button>
                                    )}
                                    
                                    <Button
                                      variant="outline-danger"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDeleteModal(true);
                                      }}
                                      className="action-btn"
                                      title="Delete User"
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

      {/* Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaEdit className="me-2 text-primary" />
              Edit User
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="pt-0">
            {formLoading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-3">
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Saving user...</span>
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserCircle className="me-2" />
                    Name *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaEnvelope className="me-2" />
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaPhone className="me-2" />
                    Phone
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Administrator"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mb-3">Preferences</h6>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  label="Email Notifications"
                  name="preferences.emailNotifications"
                  checked={formData.preferences.emailNotifications}
                  onChange={handleInputChange}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  label="SMS Notifications"
                  name="preferences.smsNotifications"
                  checked={formData.preferences.smsNotifications}
                  onChange={handleInputChange}
                />
              </Col>
              <Col md={4}>
                <Form.Check
                  type="checkbox"
                  label="Newsletter"
                  name="preferences.newsletter"
                  checked={formData.preferences.newsletter}
                  onChange={handleInputChange}
                />
              </Col>
            </Row>
          </Modal.Body>
          
          <Modal.Footer className="border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowModal(false)}
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
              ) : (
                <>
                  <FaEdit className="me-2" />
                  Save Changes
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
            <div className="d-flex align-items-center gap-2 mb-2">
              <FaExclamationTriangle />
              <h6 className="mb-0">Are you sure you want to delete this user?</h6>
            </div>
            <p className="mb-0">
              <strong>{selectedUser?.name}</strong> ({selectedUser?.email}) will be permanently deleted.
            </p>
          </Alert>
          <Alert variant="warning" className="border-0">
            <FaClock className="me-2" />
            This will delete all user data including bookings and cannot be undone!
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
            onClick={handleDeleteUser}
            className="rounded-pill px-4"
          >
            <FaTrash className="me-2" />
            Delete User
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

export default UserManagement;