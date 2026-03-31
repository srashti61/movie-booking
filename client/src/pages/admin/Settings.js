import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button,
  Alert, Spinner, Tab, Tabs, InputGroup,
  Nav, Offcanvas, Badge
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Icons
import {
  FaTachometerAlt, FaFilm, FaTheaterMasks, FaUsers,
  FaTicketAlt, FaCalendarAlt, FaChartBar, FaCog,
  FaBars, FaHome, FaSignOutAlt, FaSave,
  FaUndo, FaEnvelope, FaCreditCard, FaCalendarCheck,
  FaGlobe, FaMoneyBillWave, FaShieldAlt,
  FaBell, FaSlidersH, FaDatabase, FaServer,
  FaInfoCircle, FaExclamationTriangle, FaCheckCircle,
  FaTimesCircle, FaWrench, FaMobileAlt
} from 'react-icons/fa';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Loading and saving states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Movie Ticket Booking',
    siteUrl: 'https://movietickets.com',
    adminEmail: 'admin@movietickets.com',
    supportEmail: 'support@movietickets.com',
    supportPhone: '+91 9876543210',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    currencySymbol: '₹',
    maintenanceMode: false,
    defaultLanguage: 'en',
    enableAnalytics: true,
    enableCookies: true,
    privacyPolicyUrl: '/privacy-policy',
    termsUrl: '/terms'
  });

  // Booking Settings
  const [bookingSettings, setBookingSettings] = useState({
    maxSeatsPerBooking: 10,
    cancellationWindow: 3, // hours
    refundPercentage: 90,
    bookingConfirmationEmail: true,
    bookingReminderEmail: true,
    autoCancelUnpaid: true,
    unpaidBookingTimeout: 15, // minutes
    allowSeatSelection: true,
    allowMultipleBookings: true,
    earlyBookingDiscount: 10,
    lastMinuteBookingFee: 20,
    bookingBufferTime: 30, // minutes before show
    enableWaitlist: true
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enablePayments: true,
    testMode: true,
    paymentMethods: ['upi', 'card', 'netbanking', 'wallet'],
    taxPercentage: 18,
    convenienceFee: 5,
    minBookingAmount: 100,
    maxBookingAmount: 10000,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    stripeKeyId: '',
    stripeKeySecret: '',
    paymentGateway: 'razorpay'
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@movietickets.com',
    fromName: 'Movie Tickets',
    enableSSL: true,
    enableTLS: true,
    emailProvider: 'gmail',
    sendgridApiKey: '',
    mailgunApiKey: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingConfirmed: true,
    bookingCancelled: true,
    paymentSuccess: true,
    paymentFailed: true,
    showReminder: true,
    newsletterSubscribers: true,
    marketingEmails: false,
    systemAlerts: true
  });
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
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In real app, load from API
      const savedGeneral = localStorage.getItem('admin_general_settings');
      const savedBooking = localStorage.getItem('admin_booking_settings');
      const savedPayment = localStorage.getItem('admin_payment_settings');
      const savedEmail = localStorage.getItem('admin_email_settings');
      const savedNotification = localStorage.getItem('admin_notification_settings');

      if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
      if (savedBooking) setBookingSettings(JSON.parse(savedBooking));
      if (savedPayment) setPaymentSettings(JSON.parse(savedPayment));
      if (savedEmail) setEmailSettings(JSON.parse(savedEmail));
      if (savedNotification) setNotificationSettings(JSON.parse(savedNotification));

      setLoading(false);
    }, 1000);
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBookingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value) || value
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name.includes('Percentage') || name.includes('Fee') ? 
        parseFloat(value) || 0 : value
    }));
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePaymentMethodToggle = (method) => {
    setPaymentSettings(prev => {
      const methods = [...prev.paymentMethods];
      if (methods.includes(method)) {
        return { ...prev, paymentMethods: methods.filter(m => m !== method) };
      } else {
        return { ...prev, paymentMethods: [...methods, method] };
      }
    });
  };

  const handlePaymentGatewayChange = (gateway) => {
    setPaymentSettings(prev => ({ ...prev, paymentGateway: gateway }));
  };

  const handleEmailProviderChange = (provider) => {
    setEmailSettings(prev => ({ ...prev, emailProvider: provider }));
  };

  const handleSaveSettings = async (section) => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage (in real app, save to API)
      switch(section) {
        case 'general':
          localStorage.setItem('admin_general_settings', JSON.stringify(generalSettings));
          break;
        case 'booking':
          localStorage.setItem('admin_booking_settings', JSON.stringify(bookingSettings));
          break;
        case 'payment':
          localStorage.setItem('admin_payment_settings', JSON.stringify(paymentSettings));
          break;
        case 'email':
          localStorage.setItem('admin_email_settings', JSON.stringify(emailSettings));
          break;
        case 'notification':
          localStorage.setItem('admin_notification_settings', JSON.stringify(notificationSettings));
          break;
      }
      
      toast.success(`✅ ${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`, {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      toast.error('❌ Failed to save settings', {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = (section) => {
    if (window.confirm('Are you sure you want to reset to default settings?')) {
      switch(section) {
        case 'general':
          setGeneralSettings({
            siteName: 'Movie Ticket Booking',
            siteUrl: 'https://movietickets.com',
            adminEmail: 'admin@movietickets.com',
            supportEmail: 'support@movietickets.com',
            supportPhone: '+91 9876543210',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            currency: 'INR',
            currencySymbol: '₹',
            maintenanceMode: false,
            defaultLanguage: 'en',
            enableAnalytics: true,
            enableCookies: true,
            privacyPolicyUrl: '/privacy-policy',
            termsUrl: '/terms'
          });
          break;
        case 'booking':
          setBookingSettings({
            maxSeatsPerBooking: 10,
            cancellationWindow: 3,
            refundPercentage: 90,
            bookingConfirmationEmail: true,
            bookingReminderEmail: true,
            autoCancelUnpaid: true,
            unpaidBookingTimeout: 15,
            allowSeatSelection: true,
            allowMultipleBookings: true,
            earlyBookingDiscount: 10,
            lastMinuteBookingFee: 20,
            bookingBufferTime: 30,
            enableWaitlist: true
          });
          break;
        case 'payment':
          setPaymentSettings({
            enablePayments: true,
            testMode: true,
            paymentMethods: ['upi', 'card', 'netbanking', 'wallet'],
            taxPercentage: 18,
            convenienceFee: 5,
            minBookingAmount: 100,
            maxBookingAmount: 10000,
            razorpayKeyId: '',
            razorpayKeySecret: '',
            stripeKeyId: '',
            stripeKeySecret: '',
            paymentGateway: 'razorpay'
          });
          break;
        case 'email':
          setEmailSettings({
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUsername: '',
            smtpPassword: '',
            fromEmail: 'noreply@movietickets.com',
            fromName: 'Movie Tickets',
            enableSSL: true,
            enableTLS: true,
            emailProvider: 'gmail',
            sendgridApiKey: '',
            mailgunApiKey: ''
          });
          break;
        case 'notification':
          setNotificationSettings({
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            bookingConfirmed: true,
            bookingCancelled: true,
            paymentSuccess: true,
            paymentFailed: true,
            showReminder: true,
            newsletterSubscribers: true,
            marketingEmails: false,
            systemAlerts: true
          });
          break;
      }
      toast.info(`⚙️ ${section.charAt(0).toUpperCase() + section.slice(1)} settings reset to defaults`, {
        position: "top-center"
      });
    }
  };

  const handleLogout = () => {
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache?')) {
      localStorage.clear();
      toast.success('🗑️ All cache cleared successfully!');
      loadSettings();
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading settings...</span>
      </div>
    );
  }

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
                <FaCog size={20} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-grow-1">
                <h6 className="mb-0">{user?.name || 'Admin'}</h6>
                <small className="text-muted">System Administrator</small>
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
              <h4 className="mb-0">⚙️ System Settings</h4>
              <small className="text-muted">Configure application settings and preferences</small>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={handleClearCache}
              >
                <FaDatabase className="me-2" />
                Clear Cache
              </Button>
              
              <Badge bg="info" className="px-3 py-2">
                <FaInfoCircle className="me-1" />
                Settings saved to browser storage
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <Container className="py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
              fill
            >
              {/* General Settings Tab */}
              <Tab eventKey="general" title={
                <span className="d-flex align-items-center gap-2">
                  <FaGlobe /> General
                </span>
              }>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <FaGlobe className="me-2 text-primary" />
                        General Settings
                      </h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleResetToDefaults('general')}
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Reset
                      </Button>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaGlobe className="me-2" />
                            Site Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="siteName"
                            value={generalSettings.siteName}
                            onChange={handleGeneralChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Site URL</Form.Label>
                          <Form.Control
                            type="url"
                            name="siteUrl"
                            value={generalSettings.siteUrl}
                            onChange={handleGeneralChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Admin Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="adminEmail"
                            value={generalSettings.adminEmail}
                            onChange={handleGeneralChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Support Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="supportEmail"
                            value={generalSettings.supportEmail}
                            onChange={handleGeneralChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Support Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="supportPhone"
                            value={generalSettings.supportPhone}
                            onChange={handleGeneralChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Timezone</Form.Label>
                          <Form.Select
                            name="timezone"
                            value={generalSettings.timezone}
                            onChange={handleGeneralChange}
                          >
                            <option value="Asia/Kolkata">India (IST)</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Currency</Form.Label>
                          <Form.Select
                            name="currency"
                            value={generalSettings.currency}
                            onChange={handleGeneralChange}
                          >
                            <option value="INR">Indian Rupee (₹)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Currency Symbol</Form.Label>
                          <Form.Control
                            type="text"
                            name="currencySymbol"
                            value={generalSettings.currencySymbol}
                            onChange={handleGeneralChange}
                            maxLength={3}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Enable Analytics"
                          name="enableAnalytics"
                          checked={generalSettings.enableAnalytics}
                          onChange={handleGeneralChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Enable Cookies"
                          name="enableCookies"
                          checked={generalSettings.enableCookies}
                          onChange={handleGeneralChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Maintenance Mode"
                          name="maintenanceMode"
                          checked={generalSettings.maintenanceMode}
                          onChange={handleGeneralChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    {generalSettings.maintenanceMode && (
                      <Alert variant="warning" className="border-0">
                        <div className="d-flex align-items-center gap-2">
                          <FaExclamationTriangle />
                          <span>When maintenance mode is enabled, only admins can access the site.</span>
                        </div>
                      </Alert>
                    )}

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSettings('general')}
                        disabled={saving}
                        className="d-flex align-items-center"
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save General Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Booking Settings Tab */}
              <Tab eventKey="booking" title={
                <span className="d-flex align-items-center gap-2">
                  <FaCalendarCheck /> Booking
                </span>
              }>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <FaCalendarCheck className="me-2 text-primary" />
                        Booking Settings
                      </h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleResetToDefaults('booking')}
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Reset
                      </Button>
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Max Seats Per Booking</Form.Label>
                          <Form.Control
                            type="number"
                            name="maxSeatsPerBooking"
                            value={bookingSettings.maxSeatsPerBooking}
                            onChange={handleBookingChange}
                            min="1"
                            max="20"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cancellation Window (hours)</Form.Label>
                          <Form.Control
                            type="number"
                            name="cancellationWindow"
                            value={bookingSettings.cancellationWindow}
                            onChange={handleBookingChange}
                            min="0"
                            max="48"
                          />
                          <Form.Text className="text-muted">
                            How many hours before showtime can bookings be cancelled?
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Refund Percentage</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="refundPercentage"
                              value={bookingSettings.refundPercentage}
                              onChange={handleBookingChange}
                              min="0"
                              max="100"
                            />
                            <InputGroup.Text>%</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Booking Buffer Time (minutes)</Form.Label>
                          <Form.Control
                            type="number"
                            name="bookingBufferTime"
                            value={bookingSettings.bookingBufferTime}
                            onChange={handleBookingChange}
                            min="0"
                            max="120"
                          />
                          <Form.Text className="text-muted">
                            Minimum time required before showtime for booking
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Early Booking Discount (%)</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="earlyBookingDiscount"
                              value={bookingSettings.earlyBookingDiscount}
                              onChange={handleBookingChange}
                              min="0"
                              max="50"
                            />
                            <InputGroup.Text>%</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Minute Booking Fee (%)</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="lastMinuteBookingFee"
                              value={bookingSettings.lastMinuteBookingFee}
                              onChange={handleBookingChange}
                              min="0"
                              max="50"
                            />
                            <InputGroup.Text>%</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaBell className="me-2" />
                      Email Notifications
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Send Booking Confirmation Email"
                          name="bookingConfirmationEmail"
                          checked={bookingSettings.bookingConfirmationEmail}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Send Booking Reminder Email"
                          name="bookingReminderEmail"
                          checked={bookingSettings.bookingReminderEmail}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaSlidersH className="me-2" />
                      Booking Features
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Allow Seat Selection"
                          name="allowSeatSelection"
                          checked={bookingSettings.allowSeatSelection}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Allow Multiple Bookings Per User"
                          name="allowMultipleBookings"
                          checked={bookingSettings.allowMultipleBookings}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Auto-cancel Unpaid Bookings"
                          name="autoCancelUnpaid"
                          checked={bookingSettings.autoCancelUnpaid}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Enable Waitlist"
                          name="enableWaitlist"
                          checked={bookingSettings.enableWaitlist}
                          onChange={handleBookingChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSettings('booking')}
                        disabled={saving}
                        className="d-flex align-items-center"
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Booking Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Payment Settings Tab */}
              <Tab eventKey="payment" title={
                <span className="d-flex align-items-center gap-2">
                  <FaCreditCard /> Payment
                </span>
              }>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <FaCreditCard className="me-2 text-primary" />
                        Payment Settings
                      </h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleResetToDefaults('payment')}
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Reset
                      </Button>
                    </div>

                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Enable Online Payments"
                          name="enablePayments"
                          checked={paymentSettings.enablePayments}
                          onChange={handlePaymentChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Test Mode (Sandbox)"
                          name="testMode"
                          checked={paymentSettings.testMode}
                          onChange={handlePaymentChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <h6 className="mb-3">
                      <FaMobileAlt className="me-2" />
                      Payment Methods
                    </h6>
                    <Row>
                      {['upi', 'card', 'netbanking', 'wallet'].map(method => (
                        <Col md={3} key={method}>
                          <Form.Check
                            type="checkbox"
                            label={method.charAt(0).toUpperCase() + method.slice(1)}
                            checked={paymentSettings.paymentMethods.includes(method)}
                            onChange={() => handlePaymentMethodToggle(method)}
                            className="mb-3"
                          />
                        </Col>
                      ))}
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaMoneyBillWave className="me-2" />
                      Fees & Limits
                    </h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tax Percentage</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="taxPercentage"
                              value={paymentSettings.taxPercentage}
                              onChange={handlePaymentChange}
                              min="0"
                              max="50"
                              step="0.1"
                            />
                            <InputGroup.Text>%</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Convenience Fee</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="convenienceFee"
                              value={paymentSettings.convenienceFee}
                              onChange={handlePaymentChange}
                              min="0"
                              max="20"
                              step="0.1"
                            />
                            <InputGroup.Text>%</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Minimum Booking Amount</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>{generalSettings.currencySymbol}</InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="minBookingAmount"
                              value={paymentSettings.minBookingAmount}
                              onChange={handlePaymentChange}
                              min="0"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Maximum Booking Amount</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>{generalSettings.currencySymbol}</InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="maxBookingAmount"
                              value={paymentSettings.maxBookingAmount}
                              onChange={handlePaymentChange}
                              min="0"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaServer className="me-2" />
                      Payment Gateway
                    </h6>
                    <Row className="mb-3">
                      <Col md={12}>
                        <div className="btn-group w-100" role="group">
                          <Button
                            variant={paymentSettings.paymentGateway === 'razorpay' ? 'primary' : 'outline-primary'}
                            onClick={() => handlePaymentGatewayChange('razorpay')}
                          >
                            Razorpay
                          </Button>
                          <Button
                            variant={paymentSettings.paymentGateway === 'stripe' ? 'primary' : 'outline-primary'}
                            onClick={() => handlePaymentGatewayChange('stripe')}
                          >
                            Stripe
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {paymentSettings.paymentGateway === 'razorpay' && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Key ID</Form.Label>
                            <Form.Control
                              type="text"
                              name="razorpayKeyId"
                              value={paymentSettings.razorpayKeyId}
                              onChange={handlePaymentChange}
                              placeholder="rzp_test_xxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Key Secret</Form.Label>
                            <Form.Control
                              type="password"
                              name="razorpayKeySecret"
                              value={paymentSettings.razorpayKeySecret}
                              onChange={handlePaymentChange}
                              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    {paymentSettings.paymentGateway === 'stripe' && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Publishable Key</Form.Label>
                            <Form.Control
                              type="text"
                              name="stripeKeyId"
                              value={paymentSettings.stripeKeyId}
                              onChange={handlePaymentChange}
                              placeholder="pk_test_xxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Secret Key</Form.Label>
                            <Form.Control
                              type="password"
                              name="stripeKeySecret"
                              value={paymentSettings.stripeKeySecret}
                              onChange={handlePaymentChange}
                              placeholder="sk_test_xxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSettings('payment')}
                        disabled={saving}
                        className="d-flex align-items-center"
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Payment Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Email Settings Tab */}
              <Tab eventKey="email" title={
                <span className="d-flex align-items-center gap-2">
                  <FaEnvelope /> Email
                </span>
              }>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <FaEnvelope className="me-2 text-primary" />
                        Email Settings
                      </h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleResetToDefaults('email')}
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Reset
                      </Button>
                    </div>

                    <Alert variant="info" className="border-0">
                      <div className="d-flex align-items-center gap-2">
                        <FaInfoCircle />
                        <span>These settings are for outgoing emails (booking confirmations, reminders, etc.)</span>
                      </div>
                    </Alert>

                    <h6 className="mt-4 mb-3">
                      <FaServer className="me-2" />
                      Email Provider
                    </h6>
                    <Row className="mb-4">
                      <Col md={12}>
                        <div className="btn-group w-100" role="group">
                          <Button
                            variant={emailSettings.emailProvider === 'smtp' ? 'primary' : 'outline-primary'}
                            onClick={() => handleEmailProviderChange('smtp')}
                          >
                            SMTP
                          </Button>
                          <Button
                            variant={emailSettings.emailProvider === 'sendgrid' ? 'primary' : 'outline-primary'}
                            onClick={() => handleEmailProviderChange('sendgrid')}
                          >
                            SendGrid
                          </Button>
                          <Button
                            variant={emailSettings.emailProvider === 'mailgun' ? 'primary' : 'outline-primary'}
                            onClick={() => handleEmailProviderChange('mailgun')}
                          >
                            Mailgun
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {emailSettings.emailProvider === 'smtp' && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>SMTP Host</Form.Label>
                              <Form.Control
                                type="text"
                                name="smtpHost"
                                value={emailSettings.smtpHost}
                                onChange={handleEmailChange}
                                placeholder="smtp.gmail.com"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>SMTP Port</Form.Label>
                              <Form.Control
                                type="number"
                                name="smtpPort"
                                value={emailSettings.smtpPort}
                                onChange={handleEmailChange}
                                placeholder="587"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>SMTP Username</Form.Label>
                              <Form.Control
                                type="text"
                                name="smtpUsername"
                                value={emailSettings.smtpUsername}
                                onChange={handleEmailChange}
                                placeholder="your-email@gmail.com"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>SMTP Password</Form.Label>
                              <Form.Control
                                type="password"
                                name="smtpPassword"
                                value={emailSettings.smtpPassword}
                                onChange={handleEmailChange}
                                placeholder="Your email password or app password"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}

                    {emailSettings.emailProvider === 'sendgrid' && (
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>SendGrid API Key</Form.Label>
                            <Form.Control
                              type="password"
                              name="sendgridApiKey"
                              value={emailSettings.sendgridApiKey}
                              onChange={handleEmailChange}
                              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    {emailSettings.emailProvider === 'mailgun' && (
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mailgun API Key</Form.Label>
                            <Form.Control
                              type="password"
                              name="mailgunApiKey"
                              value={emailSettings.mailgunApiKey}
                              onChange={handleEmailChange}
                              placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>From Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="fromEmail"
                            value={emailSettings.fromEmail}
                            onChange={handleEmailChange}
                            placeholder="noreply@yourdomain.com"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>From Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="fromName"
                            value={emailSettings.fromName}
                            onChange={handleEmailChange}
                            placeholder="Movie Tickets"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {emailSettings.emailProvider === 'smtp' && (
                      <Row>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label="Enable SSL"
                            name="enableSSL"
                            checked={emailSettings.enableSSL}
                            onChange={handleEmailChange}
                            className="mb-3"
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label="Enable TLS"
                            name="enableTLS"
                            checked={emailSettings.enableTLS}
                            onChange={handleEmailChange}
                            className="mb-3"
                          />
                        </Col>
                      </Row>
                    )}

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSettings('email')}
                        disabled={saving}
                        className="d-flex align-items-center"
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Email Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>

              {/* Notification Settings Tab */}
              <Tab eventKey="notification" title={
                <span className="d-flex align-items-center gap-2">
                  <FaBell /> Notifications
                </span>
              }>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <FaBell className="me-2 text-primary" />
                        Notification Settings
                      </h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleResetToDefaults('notification')}
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Reset
                      </Button>
                    </div>

                    <h6 className="mb-3">
                      <FaSlidersH className="me-2" />
                      Notification Channels
                    </h6>
                    <Row>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="Email Notifications"
                          name="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="SMS Notifications"
                          name="smsNotifications"
                          checked={notificationSettings.smsNotifications}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="Push Notifications"
                          name="pushNotifications"
                          checked={notificationSettings.pushNotifications}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaBell className="me-2" />
                      Booking Notifications
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Booking Confirmed"
                          name="bookingConfirmed"
                          checked={notificationSettings.bookingConfirmed}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Booking Cancelled"
                          name="bookingCancelled"
                          checked={notificationSettings.bookingCancelled}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Show Reminder (1 hour before)"
                          name="showReminder"
                          checked={notificationSettings.showReminder}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Payment Success"
                          name="paymentSuccess"
                          checked={notificationSettings.paymentSuccess}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="checkbox"
                          label="Payment Failed"
                          name="paymentFailed"
                          checked={notificationSettings.paymentFailed}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaEnvelope className="me-2" />
                      Marketing Notifications
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Newsletter Subscribers"
                          name="newsletterSubscribers"
                          checked={notificationSettings.newsletterSubscribers}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          label="Marketing Emails"
                          name="marketingEmails"
                          checked={notificationSettings.marketingEmails}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3">
                      <FaShieldAlt className="me-2" />
                      System Notifications
                    </h6>
                    <Row>
                      <Col md={12}>
                        <Form.Check
                          type="checkbox"
                          label="System Alerts (Admin only)"
                          name="systemAlerts"
                          checked={notificationSettings.systemAlerts}
                          onChange={handleNotificationChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>

                    <Alert variant="info" className="border-0">
                      <div className="d-flex align-items-center gap-2">
                        <FaInfoCircle />
                        <span>System alerts include: New user registrations, high booking volumes, payment gateway issues</span>
                      </div>
                    </Alert>

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSettings('notification')}
                        disabled={saving}
                        className="d-flex align-items-center"
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Notification Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
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

      {/* Add custom styles */}
      <style jsx>{`
        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .btn-group .btn {
          flex: 1;
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

export default Settings;