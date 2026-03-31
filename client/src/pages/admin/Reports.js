
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Modal, Form, Alert, Spinner,
  Dropdown, InputGroup, FormControl,
  Nav, Offcanvas, Pagination, ButtonGroup,
  Tabs, Tab
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { adminAPI } from '../../services/api';

// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaSearch,
  FaFilter, FaDownload, FaPrint, FaFileExcel,
  FaFilePdf, FaChartLine, FaChartPie, FaChartArea,
  FaMoneyBillWave, FaCalendarDay, FaCalendarWeek,
  FaCalendar, FaTimes, 
  FaArrowUp, FaArrowDown, FaEye, FaSyncAlt,
  FaRegChartBar, FaPercentage, FaRegCalendarAlt
} from 'react-icons/fa';


const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector(state => state.auth);
  
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Report states
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: new Date()
  });
  const [reportType, setReportType] = useState('sales');
  const [theaterFilter, setTheaterFilter] = useState('all');
  const [movieFilter, setMovieFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('excel');

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [detailedData, setDetailedData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = useState('month');
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');
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

  // Time filters options
  const timeFilters = [
    { value: 'today', label: 'Today', icon: <FaCalendarDay /> },
    { value: 'week', label: 'This Week', icon: <FaCalendarWeek /> },
{ value: 'month', label: 'This Month', icon: <FaCalendarAlt /> },

    { value: 'quarter', label: 'This Quarter', icon: <FaRegCalendarAlt /> },
    { value: 'year', label: 'This Year', icon: <FaCalendar /> },
    { value: 'custom', label: 'Custom Range', icon: <FaCalendar /> }
  ];

  // Report types
  const reportTypes = [
    { value: 'sales', label: 'Sales Report', icon: <FaMoneyBillWave /> },
    { value: 'bookings', label: 'Bookings Report', icon: <FaTicketAlt /> },
    { value: 'users', label: 'User Analytics', icon: <FaUsers /> },
    { value: 'movies', label: 'Movie Performance', icon: <FaFilm /> },
    { value: 'theaters', label: 'Theater Performance', icon: <FaTheaterMasks /> }
  ];
const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  }

  if (period === 'week') {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }

  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
};

  // Fetch initial data
useEffect(() => {
  fetchReports();
}, [
  dateRange.startDate,
  dateRange.endDate,
  reportType,
  theaterFilter,
  movieFilter,
  timeFilter   // ✅ ADD THIS
]);

useEffect(() => {
  const loadFilters = async () => {
    try {
      const [theaterRes, movieRes] = await Promise.all([
        adminAPI.getTheaters(),
        adminAPI.getMovies()
      ]);

      setTheaters([{ id: 'all', name: 'All Theaters' }, ...theaterRes.data]);
      setMovies([{ id: 'all', title: 'All Movies' }, ...movieRes.data]);
    } catch {
      toast.error('Failed to load filters');
    }
  };

  loadFilters();
}, []);


  useEffect(() => {
    if (timeFilter !== 'custom') {
      applyTimeFilter(timeFilter);
    }
  }, [timeFilter]);

const fetchReports = async () => {
  try {
    setLoading(true);

    const params = {
      startDate: new Date(dateRange.startDate).toISOString(),
      endDate: new Date(dateRange.endDate).toISOString(),
      reportType,
      theater: theaterFilter,
      movie: movieFilter
    };

    // 🔹 Always call summary & detailed
    const requests = [
      adminAPI.getReportSummary(params),
      adminAPI.getReportDetailed(params)
    ];

    // 🔹 Chart only for sales & bookings
    const needsChart = reportType === 'sales' || reportType === 'bookings';
    if (needsChart) {
      requests.push(adminAPI.getReportChart(params));
    }

    const responses = await Promise.all(requests);

    const summaryRes = responses[0];
    const detailedRes = responses[1];
    const chartRes = needsChart ? responses[2] : null;

    // ✅ Set summary safely
    setSummaryData(summaryRes?.data || null);

    // ✅ Normalize detailed data safely
    setDetailedData(
      Array.isArray(detailedRes?.data)
        ? normalizeDetailedData(detailedRes.data)
        : []
    );

    // ✅ Set chart only when available
    if (needsChart && chartRes?.data) {
      setChartData(chartRes.data);
    } else {
      setChartData(null);
    }

  } catch (error) {
    console.error('Report fetch error:', error?.response?.data || error);

    toast.error(
      error?.response?.data?.message || 'Failed to load reports'
    );
  } finally {
    setLoading(false);
  }
};






const applyTimeFilter = (filter) => {
  const now = new Date();
  let startDate, endDate;

  if (filter === 'today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  else if (filter === 'week') {
    startDate = startOfWeek(now, { weekStartsOn: 1 });
    startDate.setHours(0, 0, 0, 0);

    endDate = endOfWeek(now, { weekStartsOn: 1 });
    endDate.setHours(23, 59, 59, 999);
  }

  else if (filter === 'month') {
    startDate = startOfMonth(now);
    startDate.setHours(0, 0, 0, 0);

    endDate = endOfMonth(now);
    endDate.setHours(23, 59, 59, 999);
  }

  else if (filter === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
  }

  setDateRange({
    startDate,
    endDate
  });
};


const normalizeDetailedData = (data) => {

  // ✅ USERS REPORT
  if (reportType === 'users') {
    return data.map(u => ({
      movie: '-',
      theater: '-',
      bookings: 0,
      revenue: 0,
      occupancy: 0,
      avgTicketPrice: 0,
      date: u.date || '-'
    }));
  }

  if (reportType === 'bookings') {
    return data.map(b => ({
      movie: b.movie || 'N/A',
      theater: b.theater || 'N/A',
      bookings: b.bookings || 0,
      revenue: b.revenue || 0,
      occupancy: 0,
      avgTicketPrice: b.bookings
        ? Math.round(b.revenue / b.bookings)
        : 0,
      date: b.date
    }));
  }

  return data; // sales
};

useEffect(() => {
  if (!detailedData.length) return;

  const top = [...detailedData].sort((a, b) => b.revenue - a.revenue)[0];

setSummaryData(prev => ({
  ...(prev || {}),
  topMovie: top?.movie || 'N/A',
  topTheater: top?.theater || 'N/A'
}));

}, [detailedData]);

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reportData = {
        type: reportType,
        dateRange,
        theater: theaterFilter,
        movie: movieFilter,
        timestamp: new Date().toISOString()
      };

      // In real app, this would be an API call
      toast.success('Report generated successfully!', {
        position: "top-center"
      });

      // Update data based on filters

    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = () => {
    const formats = {
      excel: 'Excel (.xlsx)',
      pdf: 'PDF (.pdf)',
      csv: 'CSV (.csv)'
    };

    toast.success(`Exporting report as ${formats[exportFormat]}`, {
      position: "top-center"
    });

    // In real app, this would trigger file download
    // For now, we'll simulate download
    setTimeout(() => {
      toast.info('Report exported successfully!', {
        position: "top-center"
      });
    }, 2000);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setTimeFilter('month');
    setReportType('sales');
    setTheaterFilter('all');
    setMovieFilter('all');
    setSortBy('revenue');
    setSortOrder('desc');
    applyTimeFilter('month');
  };

  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Mock data generators



 

 


  const getGrowthIndicator = (value, previousValue) => {
    const growth = ((value - previousValue) / previousValue) * 100;
    const isPositive = growth >= 0;
    
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive,
      icon: isPositive ? <FaArrowUp /> : <FaArrowDown />
    };
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
                <FaChartBar size={20} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">Reports Analyst</small>
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
              <h4 className="mb-0">📊 Analytics & Reports</h4>
              <small className="text-muted">Generate insights and performance reports</small>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <Badge bg="info" className="px-3 py-2 fs-6">
                Real-time Analytics
              </Badge>
              
              <Button 
                variant="outline-primary"
                onClick={fetchReports}
                disabled={loading}
              >
                <FaSyncAlt className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                Refresh
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
                  {/* Report Type */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaRegChartBar className="me-2 text-primary" />
                        Report Type
                      </Form.Label>
                      <Form.Select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
{reportTypes.map(type => (
  <option key={`report-${type.value}`} value={type.value}>
    {type.label}
  </option>
))}


                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Time Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Time Period
                      </Form.Label>
                      <Form.Select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                      >
{timeFilters.map(filter => (
  <option key={`time-${filter.value}`} value={filter.value}>
    {filter.label}
  </option>
))}

                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Date Range for Custom */}
                  {timeFilter === 'custom' && (
                    <>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2">From</Form.Label>
                          <DatePicker
                            selected={dateRange.startDate}
                            onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-2">To</Form.Label>
                          <DatePicker
                            selected={dateRange.endDate}
                            onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                          />
                        </Form.Group>
                      </Col>
                    </>
                  )}

                  {/* Theater Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaTheaterMasks className="me-2 text-primary" />
                        Theater
                      </Form.Label>
                      <Form.Select
                        value={theaterFilter}
                        onChange={(e) => setTheaterFilter(e.target.value)}
                      >
{theaters.map((theater, index) => (
  <option
    key={theater._id || theater.id || index}
    value={theater._id || theater.id || 'all'}
  >
    {theater.name}
  </option>
))}

                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Movie Filter */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold mb-2">
                        <FaFilm className="me-2 text-primary" />
                        Movie
                      </Form.Label>
                      <Form.Select
                        value={movieFilter}
                        onChange={(e) => setMovieFilter(e.target.value)}
                      >
{movies.map((movie, index) => (
  <option
    key={movie._id || movie.id || index}
    value={movie._id || movie.id || 'all'}
  >
    {movie.title}
  </option>
))}

                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Action Buttons */}
                  <Col md={timeFilter === 'custom' ? 1 : 3} className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="outline-secondary"
                        onClick={clearFilters}
                        className="rounded-pill px-3"
                        title="Clear Filters"
                      >
                        <FaTimes />
                      </Button>
                      
                      <Button
                        variant="primary"
                        onClick={generateReport}
                        disabled={generatingReport}
                        className="rounded-pill px-4"
                      >
                        {generatingReport ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FaChartBar className="me-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            <Tab eventKey="summary" title="Summary">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Row>
                  {/* Key Metrics */}
                  <Col lg={12}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body>
                        <h5 className="mb-4">📈 Key Performance Indicators</h5>
                        <Row>
                          <Col md={3} className="mb-4">
                            <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3">
                              <h2 className="text-primary mb-2">
                                ₹{summaryData?.totalRevenue?.toLocaleString() || '0'}
                              </h2>
                              <div className="text-muted">Total Revenue</div>
<Badge bg="secondary" className="mt-2">
  Selected period
</Badge>

                            </div>
                          </Col>
                          
                          <Col md={3} className="mb-4">
                            <div className="text-center p-3 bg-success bg-opacity-10 rounded-3">
                              <h2 className="text-success mb-2">
                                {summaryData?.totalBookings?.toLocaleString() || '0'}
                              </h2>
                              <div className="text-muted">Total Bookings</div>
                              <Badge bg="success" className="mt-2">
                                <FaArrowUp className="me-1" />
                                +8.3%
                              </Badge>
                            </div>
                          </Col>
                          
                          <Col md={3} className="mb-4">
                            <div className="text-center p-3 bg-warning bg-opacity-10 rounded-3">
                              <h2 className="text-warning mb-2">
                                {summaryData?.occupancyRate || '0'}%
                              </h2>
                        <div className="text-muted">Occupancy Rate (TBD)</div>

                              <Badge bg="warning" className="mt-2">
                                <FaArrowUp className="me-1" />
                                +2.1%
                              </Badge>
                            </div>
                          </Col>
                          
                          <Col md={3} className="mb-4">
                            <div className="text-center p-3 bg-info bg-opacity-10 rounded-3">
                              <h2 className="text-info mb-2">
                                {summaryData?.newUsers?.toLocaleString() || '0'}
                              </h2>
                              <div className="text-muted">New Users</div>
                              <Badge bg="info" className="mt-2">
                                <FaArrowUp className="me-1" />
                                +15.7%
                              </Badge>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Charts */}
                  <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Revenue Trend</h5>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Last 7 Days
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item>Last 7 Days</Dropdown.Item>
                            <Dropdown.Item>Last 30 Days</Dropdown.Item>
                            <Dropdown.Item>Last 3 Months</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
                          {chartData ? (
                            <div className="d-flex align-items-end h-100 w-100 gap-2">
                              {chartData.labels.map((label, index) => {
                                const maxRevenue = Math.max(...chartData.datasets[0].data);
                                const maxBookings = Math.max(...chartData.datasets[1].data);
                                
                                return (
                                  <div key={index} className="flex-fill d-flex flex-column align-items-center">
                                    <div 
                                      className="w-100 bg-primary rounded-top"
                                      style={{ 
                                        height: `${(chartData.datasets[0].data[index] / maxRevenue) * 100}%`,
                                        minHeight: '20px'
                                      }}
                                      title={`₹${chartData.datasets[0].data[index].toLocaleString()}`}
                                    ></div>
                                    <div 
                                      className="w-100 bg-success rounded-top mt-1"
                                      style={{ 
                                        height: `${(chartData.datasets[1].data[index] / maxBookings) * 30}%`,
                                        minHeight: '20px'
                                      }}
                                      title={`${chartData.datasets[1].data[index]} bookings`}
                                    ></div>
                                    <small className="mt-2">{label}</small>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100">
                              <Spinner animation="border" variant="primary" />
                            </div>
                          )}
                        </div>
                        <div className="d-flex justify-content-center mt-3 gap-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary me-2" style={{ width: '15px', height: '15px' }}></div>
                            <small>Revenue</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="bg-success me-2" style={{ width: '15px', height: '15px' }}></div>
                            <small>Bookings</small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Top Performers */}
                  <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Header className="bg-white">
                        <h5 className="mb-0">🏆 Top Performers</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <h6>Top Movie</h6>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '40px', height: '40px' }}>
                              <FaFilm />
                            </div>
                            <div>
                              <strong>{summaryData?.topMovie || 'N/A'}</strong>
                              <div className="text-success small">
                                <FaArrowUp className="me-1" />
                                +24% revenue growth
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h6>Top Theater</h6>
                          <div className="d-flex align-items-center">
                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '40px', height: '40px' }}>
                              <FaTheaterMasks />
                            </div>
                            <div>
                              <strong>{summaryData?.topTheater || 'N/A'}</strong>
                              <div className="text-success small">
                                <FaArrowUp className="me-1" />
                                92% occupancy rate
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </motion.div>
            </Tab>

            <Tab eventKey="detailed" title="Detailed">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Detailed Report</h5>
                    <div className="d-flex gap-2">
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          <FaDownload className="me-2" />
                          Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => { setExportFormat('excel'); exportReport(); }}>
                            <FaFileExcel className="me-2" />
                            Excel
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => { setExportFormat('pdf'); exportReport(); }}>
                            <FaFilePdf className="me-2" />
                            PDF
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => { setExportFormat('csv'); exportReport(); }}>
                            <FaFilePdf className="me-2" />
                            CSV
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      
                      <Button variant="outline-primary" size="sm" onClick={() => window.print()}>
                        <FaPrint className="me-2" />
                        Print
                      </Button>
                    </div>
                  </Card.Header>
                  
                  <Card.Body className="p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 fw-semibold">Loading report data...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead>
                            <tr>
                              <th className="ps-4">
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('movie')}
                                >
                                  Movie
                                  {sortBy === 'movie' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th>
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('theater')}
                                >
                                  Theater
                                  {sortBy === 'theater' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th className="text-end">
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('bookings')}
                                >
                                  Bookings
                                  {sortBy === 'bookings' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th className="text-end">
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('revenue')}
                                >
                                  Revenue
                                  {sortBy === 'revenue' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th className="text-end">
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('occupancy')}
                                >
                                  Occupancy
                                  {sortBy === 'occupancy' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th className="text-end">
                                <Button
                                  variant="link"
                                  className="text-decoration-none p-0"
                                  onClick={() => toggleSort('avgTicketPrice')}
                                >
                                  Avg. Ticket
                                  {sortBy === 'avgTicketPrice' && (
                                    sortOrder === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />
                                  )}
                                </Button>
                              </th>
                              <th className="text-center pe-4">Date</th>
                            </tr>
                          </thead>
<tbody>
  <AnimatePresence>
    {detailedData.map((item, index) => (
      <motion.tr
        key={`${item.movie}-${item.theater}-${item.date}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <td className="ps-4">
          <strong>{item.movie}</strong>
        </td>
        <td>{item.theater}</td>
        <td className="text-end">
          <Badge bg="info">{item.bookings}</Badge>
        </td>
        <td className="text-end text-success">
          ₹{item.revenue.toLocaleString()}
        </td>
        <td className="text-end">{item.occupancy}%</td>
        <td className="text-end">₹{item.avgTicketPrice}</td>
        <td className="text-center">{item.date}</td>
      </motion.tr>
    ))}
  </AnimatePresence>
</tbody>

                          <tfoot>
                            <tr className="bg-light">
                              <td colSpan="2" className="ps-4">
                                <strong>Totals</strong>
                              </td>
                              <td className="text-end">
                                <strong>
                                  {detailedData.reduce((sum, item) => sum + item.bookings, 0).toLocaleString()}
                                </strong>
                              </td>
                              <td className="text-end">
                                <strong className="text-success">
                                  ₹{detailedData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                                </strong>
                              </td>
                              <td colSpan="3"></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            </Tab>

            <Tab eventKey="reports" title="Saved Reports">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">📁 Saved Reports</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
{reports.map((report, index) => (
  <Col md={4} key={report.id || index} className="mb-3">

                          <Card className="border h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <Badge 
                                    bg={
                                      report.type === 'sales' ? 'primary' :
                                      report.type === 'users' ? 'info' :
                                      report.type === 'movies' ? 'warning' :
                                      report.type === 'theaters' ? 'success' : 'secondary'
                                    }
                                    className="mb-2"
                                  >
                                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                                  </Badge>
                                  <h6 className="mb-1">{report.name}</h6>
                                </div>
                                <Button variant="link" className="p-0">
                                  <FaEye />
                                </Button>
                              </div>
                              <div className="d-flex justify-content-between text-muted small">
                                <span>Generated: {report.date}</span>
                                <span>{report.size}</span>
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent border-top-0">
                              <div className="d-flex gap-2">
                                <Button variant="outline-primary" size="sm" className="flex-fill">
                                  <FaDownload className="me-1" />
                                  Download
                                </Button>
                                <Button variant="outline-secondary" size="sm">
                                  <FaPrint />
                                </Button>
                              </div>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </motion.div>
            </Tab>
          </Tabs>

          {/* Quick Stats */}
          <Row>
            <Col md={3} className="mb-3">
              <Card className="text-center border-0 shadow-sm bg-primary bg-opacity-10">
                <Card.Body>
                  <FaChartLine className="text-primary mb-3" size={24} />
                  <h4 className="text-primary">78.5%</h4>
                  <Card.Text className="text-muted">Avg. Occupancy Rate</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center border-0 shadow-sm bg-success bg-opacity-10">
                <Card.Body>
                  <FaPercentage className="text-success mb-3" size={24} />
                  <h4 className="text-success">+12.5%</h4>
                  <Card.Text className="text-muted">Revenue Growth</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center border-0 shadow-sm bg-warning bg-opacity-10">
                <Card.Body>
                  <FaUsers className="text-warning mb-3" size={24} />
                  <h4 className="text-warning">₹532</h4>
                  <Card.Text className="text-muted">Avg. Ticket Price</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center border-0 shadow-sm bg-info bg-opacity-10">
                <Card.Body>
                  <FaTicketAlt className="text-info mb-3" size={24} />
                  <h4 className="text-info">2.3</h4>
                  <Card.Text className="text-muted">Avg. Tickets/Booking</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
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

      {/* Add custom styles */}
<style>{`
  .hover-bg-dark:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }

  .chart-container {
    min-height: 300px;
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

export default Reports;
