import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Card, Row, Col, Table, Button,
  Badge, Dropdown, Alert, Spinner,
  Tab, Tabs, ListGroup, Offcanvas,
  Nav   // ✅ ADD THIS
} from 'react-bootstrap';

import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { toast } from 'react-toastify';
import { format, subDays } from 'date-fns';

// Redux imports
import { fetchMovies } from '../../features/movieSlice';
import { fetchTheaters } from '../../features/theaterSlice';

// API imports
import adminAPI from '../../services/adminApi';

// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaRupeeSign,
  FaUserCircle, FaBell, FaChartLine, FaChartPie
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // State variables
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalTheaters: 0,
    totalUsers: 0,
    totalBookings: 0,
    todayRevenue: 0,
    pendingBookings: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    todayBookings: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [theaterPerformance, setTheaterPerformance] = useState([]);
  const [moviePerformance, setMoviePerformance] = useState([]);
  const [revenueDistribution, setRevenueDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiErrors, setApiErrors] = useState({});
  const [chartRange, setChartRange] = useState(7);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New booking received', time: '2 mins ago', read: false },
    { id: 2, text: 'System update completed', time: '1 hour ago', read: false },
    { id: 3, text: 'New user registered', time: '3 hours ago', read: true }
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    handleResize();
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

  // Stats cards data
  const statCards = [
    {
      title: 'Total Movies',
      value: stats.totalMovies || 0,
      icon: <FaFilm />,
      color: 'primary',
      link: '/admin/movies'
    },
    {
      title: 'Total Theaters',
      value: stats.totalTheaters || 0,
      icon: <FaTheaterMasks />,
      color: 'success',
      link: '/admin/theaters'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: <FaUsers />,
      color: 'info',
      link: '/admin/users'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings || 0,
      icon: <FaTicketAlt />,
      color: 'warning',
      link: '/admin/bookings'
    },
    {
      title: "Today's Revenue",
      value: `₹${Number(stats.todayRevenue || 0).toLocaleString()}`,
      icon: <FaRupeeSign />,
      color: 'danger'
    },
    {
      title: 'Weekly Revenue',
      value: `₹${Number(stats.weeklyRevenue || 0).toLocaleString()}`,
      icon: <FaChartLine />,
      color: 'primary'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${Number(stats.monthlyRevenue || 0).toLocaleString()}`,
      icon: <FaChartBar />,
      color: 'success'
    },
    {
      title: 'Cancel Bookings',
      value: stats.pendingBookings || 0,
      icon: <FaCalendarAlt />,
      color: 'secondary'
    }
  ];

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return null;
    }

    if (!user || !user.isAdmin) {
      navigate('/');
      return null;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setApiErrors({});

      // Fetch dashboard stats first
      try {
        const statsData = await adminAPI.getDashboardStats();
        setStats(statsData || {
          totalMovies: 0,
          totalTheaters: 0,
          totalUsers: 0,
          totalBookings: 0,
          todayRevenue: 0,
          pendingBookings: 0,
          weeklyRevenue: 0,
          monthlyRevenue: 0,
          todayBookings: 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setApiErrors(prev => ({ ...prev, stats: 'Failed to load dashboard statistics' }));
      }

      // Fetch recent bookings
      try {
        const bookingsData = await adminAPI.getRecentBookings({ limit: 10 });
        setRecentBookings(bookingsData?.bookings || []);
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
        setApiErrors(prev => ({ ...prev, bookings: 'Failed to load recent bookings' }));
        setRecentBookings([]);
      }

      // Fetch recent users
      try {
        const usersData = await adminAPI.getRecentUsers({ limit: 10 });
        setRecentUsers(usersData?.users || []);
      } catch (error) {
        console.error('Error fetching recent users:', error);
        setApiErrors(prev => ({ ...prev, users: 'Failed to load recent users' }));
        setRecentUsers([]);
      }

      // Fetch chart data
      try {
        const chartResponse = await adminAPI.getChartData(chartRange);
        setChartData(chartResponse || []);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setApiErrors(prev => ({ ...prev, chart: 'Failed to load chart data' }));
        setChartData([]);
      }

      // Fetch theater performance
      try {
        const theaterPerfData = await adminAPI.getTheaterPerformance();
        setTheaterPerformance(theaterPerfData || []);
      } catch (error) {
        console.error('Error fetching theater performance:', error);
        setApiErrors(prev => ({ ...prev, theater: 'Failed to load theater performance' }));
        setTheaterPerformance([]);
      }

      // Fetch movie performance
      try {
        const moviePerfData = await adminAPI.getMoviePerformance();
        setMoviePerformance(moviePerfData || []);
      } catch (error) {
        console.error('Error fetching movie performance:', error);
        setApiErrors(prev => ({ ...prev, movie: 'Failed to load movie performance' }));
        setMoviePerformance([]);
      }

      // Fetch revenue distribution
      try {
        const revenueDistData = await adminAPI.getRevenueDistribution();
        setRevenueDistribution(revenueDistData || null);
      } catch (error) {
        console.error('Error fetching revenue distribution:', error);
        setApiErrors(prev => ({ ...prev, revenue: 'Failed to load revenue distribution' }));
        setRevenueDistribution(null);
      }

      // Fetch Redux data
      try {
        await Promise.all([
          dispatch(fetchMovies()),
          dispatch(fetchTheaters())
        ]);
      } catch (error) {
        console.error('Error fetching redux data:', error);
        setApiErrors(prev => ({ ...prev, redux: 'Failed to load some data' }));
      }

      // Check if all API calls failed
      const errors = Object.keys(apiErrors);
      if (errors.length > 3) {
        setError('Some data failed to load. Please try refreshing.');
      }

    } catch (error) {
      console.error('Unexpected error in fetchDashboardData:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, chartRange]);

  // Generate default chart data
  const getChartData = useMemo(() => {
    if (chartData.length > 0) return chartData;

    // Generate last 7 days data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      date: format(subDays(new Date(), 6 - index), 'yyyy-MM-dd'),
      bookings: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 20000) + 5000,
      newUsers: Math.floor(Math.random() * 3) + 1
    }));
  }, [chartData]);

  // Generate default revenue distribution
  const getRevenueDistribution = useMemo(() => {
    if (revenueDistribution) return revenueDistribution;

    return {
      totalRevenue: 250000,
      regular: { revenue: 100000, percentage: 40 },
      premium: { revenue: 75000, percentage: 30 },
      vip: { revenue: 50000, percentage: 20 },
      other: { revenue: 25000, percentage: 10 }
    };
  }, [revenueDistribution]);

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusMap = {
      'confirmed': 'success',
      'pending': 'warning',
      'cancelled': 'danger',
      'completed': 'info'
    };

    const normalizedStatus = status?.toLowerCase();
    return (
      <Badge bg={statusMap[normalizedStatus] || 'secondary'}>
        {normalizedStatus || 'Unknown'}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return 'Invalid Time';
    }
  };

  // Handle logout
  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar Navigation - Hidden on mobile */}
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
                  <h4 className="mb-0 fw-bold">FilmZone</h4>
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
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1030 }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            <div>
              <h4 className="mb-0">Dashboard</h4>
              <small className="text-muted">Welcome back, {user?.name || 'Admin'}</small>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowSidebar(true)}
              className="rounded-circle"
              style={{ width: '45px', height: '45px' }}
            >
              <FaBars />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="main-content"
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
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">Admin Dashboard</h4>
                <small className="text-muted">Welcome back, {user?.name || 'Admin'}</small>
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Notifications */}
                <Dropdown>
                  <Dropdown.Toggle variant="light" className="position-relative">
                    <FaBell />
                    {unreadNotificationsCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" style={{ minWidth: '300px' }}>
                    <Dropdown.Header>Notifications</Dropdown.Header>
                    {notifications.map(notif => (
                      <Dropdown.Item
                        key={notif.id}
                        className={`d-flex justify-content-between ${!notif.read ? 'fw-bold' : ''}`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <span>{notif.text}</span>
                        <small className="text-muted">{notif.time}</small>
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => setNotifications([])}>
                      Clear all notifications
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                {/* Refresh Button */}
                <Button
                  variant="primary"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  className="d-flex align-items-center"
                >
                  <FaBars className={`me-2 ${refreshing ? 'fa-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <Container fluid className="py-4 px-3 px-md-4">
          {/* Error Alert */}
          {(error || Object.keys(apiErrors).length > 0) && (
            <Alert variant="warning" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error || 'Some data failed to load. Displaying available data.'}
              {Object.keys(apiErrors).length > 0 && (
                <div className="mt-2 small">
                  <strong>Failed APIs:</strong>
                  <ul className="mb-0">
                    {Object.entries(apiErrors).map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          {/* Mobile Top Actions */}
          {isMobile && (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Dashboard</h4>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  size="sm"
                >
                  <FaBars className={`${refreshing ? 'fa-spin' : ''}`} />
                </Button>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="position-relative">
                    <FaBell />
                    {unreadNotificationsCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" style={{ minWidth: '250px' }}>
                    <Dropdown.Header>Notifications</Dropdown.Header>
                    {notifications.map(notif => (
                      <Dropdown.Item
                        key={notif.id}
                        className={`d-flex justify-content-between ${!notif.read ? 'fw-bold' : ''}`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <span>{notif.text}</span>
                        <small className="text-muted">{notif.time}</small>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          )}

          {/* Stats Cards - Responsive Grid */}
          <Row className="mb-4 g-3">
            {statCards.map((stat, index) => (
              <Col key={index} xxl={3} xl={4} lg={6} md={6} sm={12} className="mb-3">
                <Card
                  className="border-0 shadow-sm h-100 hover-shadow"
                  style={{ cursor: stat.link ? 'pointer' : 'default' }}
                  onClick={() => stat.link && navigate(stat.link)}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <h6 className="text-muted mb-1 small">{stat.title}</h6>
                        <h4 className="mb-0 fw-bold">{stat.value}</h4>
                      </div>
                      <div className={`bg-${stat.color} text-white rounded-circle p-3 d-flex align-items-center justify-content-center`}
                        style={{ minWidth: '60px', minHeight: '60px' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                          {stat.icon}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Section */}
          <Row className="mb-4 g-3">
            <Col xl={8} lg={12} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Revenue & Bookings Trends</h5>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                      Last {chartRange} Days
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setChartRange(7)}>
                        Last 7 Days
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setChartRange(30)}>
                        Last 30 Days
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setChartRange(90)}>
                        Last 3 Months
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                    {getChartData.length > 0 ? (
                      <>
                        <div className="d-flex align-items-end h-100 w-100 gap-1 gap-sm-2">
                          {getChartData.map((day, index) => {
                            const maxBookings = Math.max(...getChartData.map(d => d.bookings || 0)) || 1;
                            const maxRevenue = Math.max(...getChartData.map(d => d.revenue || 0)) || 1;

                            return (
                              <div key={index} className="flex-fill d-flex flex-column align-items-center">
                                <div
                                  className="w-100 bg-primary rounded-top"
                                  style={{
                                    height: `${((day.bookings || 0) / maxBookings) * 100}%`,
                                    minHeight: '10px'
                                  }}
                                  title={`${day.bookings || 0} bookings`}
                                ></div>
                                <div
                                  className="w-100 bg-success rounded-top mt-1"
                                  style={{
                                    height: `${((day.revenue || 0) / maxRevenue) * 30}%`,
                                    minHeight: '10px'
                                  }}
                                  title={`₹${(day.revenue || 0).toLocaleString()} revenue`}
                                ></div>
                                <small className="mt-2 text-truncate" style={{ fontSize: '0.7rem' }}>{day.day}</small>
                              </div>
                            );
                          })}
                        </div>
                        <div className="d-flex flex-wrap justify-content-center mt-3 gap-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary me-2" style={{ width: '12px', height: '12px' }}></div>
                            <small>Bookings ({getChartData.reduce((sum, day) => sum + (day.bookings || 0), 0)})</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="bg-success me-2" style={{ width: '12px', height: '12px' }}></div>
                            <small>Revenue (₹{getChartData.reduce((sum, day) => sum + (day.revenue || 0), 0).toLocaleString()})</small>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <div className="text-muted">No chart data available</div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={4} lg={12} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Revenue Distribution</h5>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    {getRevenueDistribution ? (
                      <div className="text-muted">
                        <div className="d-flex justify-content-center">
                          <FaChartPie size={isMobile ? 64 : 48} className="text-muted" />
                        </div>
                        <p className="mt-3 mb-1">Total Revenue</p>
                        <h4 className="fw-bold">₹{getRevenueDistribution.totalRevenue?.toLocaleString() || '0'}</h4>
                        <div className="mt-3 text-start small">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Regular Seats</span>
                            <span>{getRevenueDistribution.regular?.percentage || 0}%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Premium Seats</span>
                            <span>{getRevenueDistribution.premium?.percentage || 0}%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>VIP Seats</span>
                            <span>{getRevenueDistribution.vip?.percentage || 0}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted">No revenue data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            <Tab eventKey="overview" title="Overview">
              <Row className="g-3">
                <Col xl={8} lg={7} md={12} className="mb-4">
                  {/* Recent Bookings */}
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Recent Bookings</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate('/admin/bookings')}
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <Table hover className="mb-0">
                          <thead className="sticky-top bg-light" style={{ zIndex: 1 }}>
                            <tr>
                              <th className="border-0">Ticket #</th>
                              <th className="border-0">User</th>
                              <th className="border-0">Movie</th>
                              <th className="border-0">Amount</th>
                              <th className="border-0">Status</th>
                              <th className="border-0">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentBookings.length > 0 ? (
                              recentBookings.map((booking) => (
                                <tr key={booking._id}>
                                  <td>
                                    <strong className="text-truncate d-inline-block" style={{ maxWidth: '80px' }}>
                                      {booking.ticketNumber || `BK-${booking._id?.slice(-6)}`}
                                    </strong>
                                  </td>
                                  <td className="text-truncate" style={{ maxWidth: '100px' }}>
                                    {booking.user?.name || 'Guest'}
                                  </td>
                                  <td className="text-truncate" style={{ maxWidth: '120px' }}>
                                    {booking.show?.movie?.title || booking.movie?.title || 'Unknown'}
                                  </td>
                                  <td>₹{booking.finalAmount?.toLocaleString() || 0}</td>
                                  <td>{renderStatusBadge(booking.status)}</td>
                                  <td>
                                    <small>{formatDate(booking.createdAt)}</small>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="text-center py-4">
                                  <FaTicketAlt size={32} className="text-muted mb-3" />
                                  <p className="text-muted mb-0">No recent bookings found</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={4} lg={5} md={12} className="mb-4">
                  {/* Recent Users */}
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Recent Users</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate('/admin/users')}
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <ListGroup variant="flush">
                          {recentUsers.length > 0 ? (
                            recentUsers.map((user) => (
                              <ListGroup.Item key={user._id} className="p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1 me-3">
                                    <strong className="d-block text-truncate">{user.name || 'Unknown User'}</strong>
                                    <small className="text-muted d-block text-truncate">{user.email || 'No email'}</small>
                                    <small className="text-muted">{user.phone || 'No phone'}</small>
                                  </div>
                                  <div className="text-end">
                                    {user.isAdmin ? (
                                      <Badge bg="danger" className="mb-1">Admin</Badge>
                                    ) : (
                                      <Badge bg="success" className="mb-1">User</Badge>
                                    )}
                                    <br />
                                    <small className="text-muted">{formatDate(user.createdAt)}</small>
                                  </div>
                                </div>
                              </ListGroup.Item>
                            ))
                          ) : (
                            <ListGroup.Item className="text-center py-4">
                              <FaUsers size={32} className="text-muted mb-3" />
                              <p className="text-muted mb-0">No recent users found</p>
                            </ListGroup.Item>
                          )}
                        </ListGroup>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="analytics" title="Analytics">
              <Row>
                <Col lg={12}>
                  <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Detailed Analytics</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center py-5">
                        <FaChartLine size={48} className="text-muted mb-3" />
                        <h5 className="text-muted">Analytics data will appear here once APIs are working</h5>
                        <p className="text-muted">Check your backend server and API endpoints</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>

          {/* Quick Actions */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="g-3">
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="primary"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={() => navigate('/admin/movies/new')}
                  >
                    <FaFilm size={20} className="mb-2" />
                    <div className="small">Add Movie</div>
                  </Button>
                </Col>
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="success"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={() => navigate('/admin/theaters/new')}
                  >
                    <FaTheaterMasks size={20} className="mb-2" />
                    <div className="small">Add Theater</div>
                  </Button>
                </Col>
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="warning"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={() => navigate('/admin/shows/new')}
                  >
                    <FaCalendarAlt size={20} className="mb-2" />
                    <div className="small">Schedule Show</div>
                  </Button>
                </Col>
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="info"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={() => navigate('/admin/reports')}
                  >
                    <FaChartBar size={20} className="mb-2" />
                    <div className="small">View Reports</div>
                  </Button>
                </Col>
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="secondary"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                  >
                    <FaBars size={20} className={`mb-2 ${refreshing ? 'fa-spin' : ''}`} />
                    <div className="small">{refreshing ? 'Refreshing...' : 'Refresh Data'}</div>
                  </Button>
                </Col>
                <Col xxl={2} xl={3} lg={4} md={4} sm={6} xs={6}>
                  <Button
                    variant="dark"
                    className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <FaCog size={20} className="mb-2" />
                    <div className="small">Settings</div>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
        style={{ zIndex: 1050 }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>CinemaHub Admin</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* User Profile in Mobile Sidebar */}
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                  style={{ width: '50px', height: '50px' }}>
                  <FaUserCircle size={30} />
                </div>
              </div>
              <div>
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">{user?.email || 'admin@cinemahub.com'}</small>
              </div>
            </div>
          </div>

          {/* Navigation in Mobile Sidebar */}
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Item key={item.id}>
                <Nav.Link
                  as={Link}
                  to={item.path}
                  onClick={() => setShowSidebar(false)}
                  className={`d-flex align-items-center py-3 ${location.pathname === item.path ? 'bg-primary text-white' : ''}`}
                >
                  <span className="me-3" style={{ width: '24px' }}>
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
                  setShowSidebar(false);
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
                  setShowSidebar(false);
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

      {/* Add CSS for better responsiveness */}
      <style jsx>{`
        @media (max-width: 768px) {
          .main-content {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          
          .card {
            margin-bottom: 15px;
          }
          
          .table-responsive {
            font-size: 0.85rem;
          }
          
          h4, h5, h6 {
            font-size: 1.1rem;
          }
        }
        
        @media (max-width: 576px) {
          .btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
          
          .stat-card h3 {
            font-size: 1.5rem;
          }
        }
        
        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease;
        }
        
        /* Fix for mobile viewport */
        @media (max-width: 992px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
        
        /* Ensure proper spacing on very small screens */
        @media (max-width: 360px) {
          .container-fluid {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          
          .col-xs-6 {
            padding-left: 4px !important;
            padding-right: 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;