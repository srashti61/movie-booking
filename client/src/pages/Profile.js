import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Form, Button, Alert, Row, Col, 
  Badge, ProgressBar, Spinner, Tab, Tabs, ListGroup 
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { userAPI } from '../services/api';
import { updateProfile } from '../features/authSlice';
import './Profile.css';
import { authAPI } from '../services/api';


const Profile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    memberSince: '',
    favoriteGenre: 'Action',
    loyaltyPoints: 1500
  });
  
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    privacy: {
      showActivity: true,
      shareData: false
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || ''
      });
      
      // Load user stats
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const response = await userAPI.getUserStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
const [showPassword, setShowPassword] = useState({
  current: false,
  new: false,
  confirm: false
});

const togglePassword = (field) => {
  setShowPassword(prev => ({
    ...prev,
    [field]: !prev[field]
  }));
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (type, key) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key]
      }
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
 const response = await authAPI.updateProfile(formData);


 dispatch(updateProfile(response.user));

      toast.success('Profile updated successfully!', {
        position: "top-right",
        theme: "colored"
      });
    } catch (error) {
      setError(error.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError(null);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }
    
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!', {
        position: "top-right",
        theme: "colored"
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to change password';
      setError(errorMsg);
      console.error('Password change error:', error.response?.data || error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await userAPI.uploadProfileImage(formData);
  dispatch(updateProfile(response.user));

      
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getMemberSince = () => {
    return user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Recently';
  };

  const loyaltyLevel = stats.loyaltyPoints > 2000 ? 'Gold' : 
                      stats.loyaltyPoints > 1000 ? 'Silver' : 'Bronze';

  return (
    <div className="profile-page">
      {/* Hero Section */}
      <section className="profile-hero-section py-4 py-md-5 mb-4 mb-md-5">
        <Container className="px-3 px-md-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
              <div className="text-center text-md-start">
                <h1 className="display-5 display-md-4 fw-bold mb-2 font-family-sans-serif">
                  My Profile
                </h1>
                <p className="text-muted mb-0">
                  Manage your account, preferences, and settings
                </p>
              </div>
              
              <Badge 
                bg={loyaltyLevel === 'Gold' ? 'warning' : 
                    loyaltyLevel === 'Silver' ? 'secondary' : 'dark'} 
                className="loyalty-badge mt-3 mt-md-0 px-3 py-2 fs-6"
              >
                <i className="fas fa-crown me-2"></i>
                {loyaltyLevel} Member
              </Badge>
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="px-3 px-md-4">
        <Row className="g-4 g-md-5">
          {/* Left Column - Profile Card & Stats */}
          <Col lg={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Profile Card */}
              <Card className="profile-card border-0 shadow-lg mb-4">
                <Card.Body className="p-4 text-center">
                  {/* Profile Image */}
                  <div className="profile-image-container position-relative mb-3">
                    <div className="profile-image-wrapper">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="profile-image rounded-circle"
                        />
                      ) : (
                        <div className="profile-initials rounded-circle">
                          <span className="display-4 fw-bold text-white">
                            {getInitials(user?.name)}
                          </span>
                        </div>
                      )}
                      
                      <label htmlFor="profile-upload" className="profile-upload-btn">
                        <i className="fas fa-camera"></i>
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="d-none"
                        />
                      </label>
                      
                      {uploading && (
                        <div className="uploading-overlay rounded-circle d-flex align-items-center justify-content-center">
                          <Spinner animation="border" variant="light" size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <h3 className="font-family-sans-serif mb-2">{user?.name}</h3>
                  <p className="text-muted mb-3">{user?.email}</p>
                  
                  <div className="user-meta d-flex justify-content-center gap-3 mb-4">
                    <div className="text-center">
                      <div className="meta-value fw-bold">{stats.totalBookings}</div>
                      <div className="meta-label text-muted">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="meta-value fw-bold">₹{stats.totalSpent}</div>
                      <div className="meta-label text-muted">Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="meta-value fw-bold">{stats.loyaltyPoints}</div>
                      <div className="meta-label text-muted">Points</div>
                    </div>
                  </div>
                  
                  {/* Admin Badge */}
                  {user?.isAdmin && (
                    <Badge bg="danger" className="px-3 py-2 mb-3 d-inline-flex align-items-center">
                      <i className="fas fa-shield-alt me-2"></i>
                      Administrator
                    </Badge>
                  )}
                  
                  {/* Member Info */}
                  <div className="member-info text-start bg-light rounded-3 p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Member since</span>
                      <span className="fw-semibold">{getMemberSince()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Loyalty Level</span>
                      <span className="fw-semibold text-warning">{loyaltyLevel}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Loyalty Progress */}
              <Card className="loyalty-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <h5 className="font-family-sans-serif mb-3">
                    <i className="fas fa-trophy me-2 text-warning"></i>
                    Loyalty Progress
                  </h5>
                  
                  <div className="loyalty-progress mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Bronze</span>
                      <span className="text-muted">Silver</span>
                      <span className="text-muted">Gold</span>
                    </div>
                    
                    <ProgressBar className="mb-2">
                      <ProgressBar 
                        variant="warning" 
                        now={Math.min(stats.loyaltyPoints / 3000 * 100, 100)} 
                        key={1}
                      />
                    </ProgressBar>
                    
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">0</small>
                      <small className="text-muted">1000</small>
                      <small className="text-muted">2000</small>
                      <small className="text-muted">3000+</small>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="current-points display-6 fw-bold text-warning mb-1">
                      {stats.loyaltyPoints}
                    </div>
                    <small className="text-muted">points to next level: {3000 - stats.loyaltyPoints}</small>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Right Column - Tabs */}
          <Col lg={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="profile-tabs-card border-0 shadow-lg">
                <Card.Body className="p-0">
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="profile-tabs mb-0"
                    variant="pills"
                  >
                    {/* Profile Tab */}
                    <Tab eventKey="profile" title={
                      <span>
                        <i className="fas fa-user me-2"></i>
                        Profile
                      </span>
                    }>
                      <div className="p-4">
                        <h4 className="font-family-sans-serif mb-4">
                          <i className="fas fa-edit me-2 text-danger"></i>
                          Edit Profile
                        </h4>
                        
                        <AnimatePresence mode="wait">
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                            >
                              <Alert variant="danger" className="border-0 shadow-sm mb-4">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {error}
                              </Alert>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <Form onSubmit={handleProfileSubmit}>
                          <Row className="g-3 mb-4">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-user me-2 text-primary"></i>
                                  Full Name
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  placeholder="Enter your full name"
                                  className="form-control-modern"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-phone me-2 text-primary"></i>
                                  Phone Number
                                </Form.Label>
                                <Form.Control
                                  type="tel"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  placeholder="Enter your phone number"
                                  className="form-control-modern"
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Row className="g-3 mb-4">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-venus-mars me-2 text-primary"></i>
                                  Gender
                                </Form.Label>
                                <Form.Select
                                  name="gender"
                                  value={formData.gender}
                                  onChange={handleInputChange}
                                  className="form-select-modern"
                                >
                                  <option value="">Select gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                  <option value="prefer-not-to-say">Prefer not to say</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-birthday-cake me-2 text-primary"></i>
                                  Date of Birth
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  name="dateOfBirth"
                                  value={formData.dateOfBirth}
                                  onChange={handleInputChange}
                                  className="form-control-modern"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-envelope me-2 text-primary"></i>
                              Email Address
                            </Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              disabled
                              className="form-control-modern"
                            />
                            <Form.Text className="text-muted mt-2">
                              <i className="fas fa-info-circle me-1"></i>
                              Email address cannot be changed
                            </Form.Text>
                          </Form.Group>
                          
                          <div className="d-flex justify-content-end">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                type="submit"
                                variant="danger"
                                className="px-4 py-2 save-profile-btn"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-save me-2"></i>
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </Form>
                      </div>
                    </Tab>

                    {/* Password Tab */}
                    <Tab eventKey="password" title={
                      <span>
                        <i className="fas fa-lock me-2"></i>
                        Password
                      </span>
                    }>
                      <div className="p-4">
                        <h4 className="font-family-sans-serif mb-4">
                          <i className="fas fa-key me-2 text-danger"></i>
                          Change Password
                        </h4>
                        
                        <Form onSubmit={handlePasswordSubmit}>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              Current Password
                            </Form.Label>
                            <div className="password-input-group">
<Form.Control
  type={showPassword.current ? "text" : "password"}
  name="currentPassword"
  value={passwordData.currentPassword}
  onChange={handlePasswordChange}
  className="form-control-modern"
  required
/>

<i
  className={`fas ${showPassword.current ? "fa-eye-slash" : "fa-eye"} password-toggle`}
  onClick={() => togglePassword("current")}
/>

                            </div>
                          </Form.Group>
                          
                          <Row className="g-3 mb-4">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  New Password
                                </Form.Label>
                                <div className="password-input-group">
                                <Form.Control
  type={showPassword.new ? "text" : "password"}
  name="newPassword"
  value={passwordData.newPassword}
  onChange={handlePasswordChange}
  className="form-control-modern"
  required
/>

<i
  className={`fas ${showPassword.new ? "fa-eye-slash" : "fa-eye"} password-toggle`}
  onClick={() => togglePassword("new")}
/>

                                </div>
                                <Form.Text className="text-muted mt-2">
                                  Minimum 8 characters with letters and numbers
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  Confirm Password
                                </Form.Label>
                                <div className="password-input-group">
                                 <Form.Control
  type={showPassword.confirm ? "text" : "password"}
  name="confirmPassword"
  value={passwordData.confirmPassword}
  onChange={handlePasswordChange}
  className="form-control-modern"
  required
/>

<i
  className={`fas ${showPassword.confirm ? "fa-eye-slash" : "fa-eye"} password-toggle`}
  onClick={() => togglePassword("confirm")}
/>

                                </div>
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <div className="password-strength mb-4">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Password Strength</span>
                              <span className="fw-semibold">Medium</span>
                            </div>
                            <ProgressBar>
                              <ProgressBar variant="success" now={33} key={1} />
                              <ProgressBar variant="warning" now={33} key={2} />
                              <ProgressBar variant="danger" now={34} key={3} />
                            </ProgressBar>
                          </div>
                          
                          <div className="d-flex justify-content-end">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                type="submit"
                                variant="danger"
                                className="px-4 py-2 change-password-btn"
                                disabled={passwordLoading}
                              >
                                {passwordLoading ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-key me-2"></i>
                                    Change Password
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </Form>
                      </div>
                    </Tab>

                    {/* Preferences Tab */}
                    <Tab eventKey="preferences" title={
                      <span>
                        <i className="fas fa-sliders-h me-2"></i>
                        Preferences
                      </span>
                    }>
                      <div className="p-4">
                        <h4 className="font-family-sans-serif mb-4">
                          <i className="fas fa-cog me-2 text-danger"></i>
                          Account Preferences
                        </h4>
                        
                        <div className="preferences-section mb-5">
                          <h5 className="font-family-sans-serif mb-3">
                            <i className="fas fa-bell me-2 text-primary"></i>
                            Notifications
                          </h5>
                          
                          <ListGroup variant="flush" className="preferences-list">
                            {Object.entries(preferences.notifications).map(([key, value]) => (
                              <ListGroup.Item key={key} className="d-flex justify-content-between align-items-center border-0 py-3">
                                <div>
                                  <h6 className="mb-1">
                                    {key === 'email' && <><i className="fas fa-envelope me-2"></i>Email Notifications</>}
                                    {key === 'sms' && <><i className="fas fa-sms me-2"></i>SMS Notifications</>}
                                    {key === 'push' && <><i className="fas fa-mobile-alt me-2"></i>Push Notifications</>}
                                  </h6>
                                  <small className="text-muted">
                                    {key === 'email' && 'Receive updates via email'}
                                    {key === 'sms' && 'Receive text message alerts'}
                                    {key === 'push' && 'Get notifications on your device'}
                                  </small>
                                </div>
                                <Form.Check
                                  type="switch"
                                  checked={value}
                                  onChange={() => handlePreferenceChange('notifications', key)}
                                  className="custom-switch"
                                />
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                        
                        <div className="preferences-section">
                          <h5 className="font-family-sans-serif mb-3">
                            <i className="fas fa-shield-alt me-2 text-primary"></i>
                            Privacy Settings
                          </h5>
                          
                          <ListGroup variant="flush" className="preferences-list">
                            {Object.entries(preferences.privacy).map(([key, value]) => (
                              <ListGroup.Item key={key} className="d-flex justify-content-between align-items-center border-0 py-3">
                                <div>
                                  <h6 className="mb-1">
                                    {key === 'showActivity' && <><i className="fas fa-chart-line me-2"></i>Show Activity</>}
                                    {key === 'shareData' && <><i className="fas fa-share-alt me-2"></i>Share Data</>}
                                  </h6>
                                  <small className="text-muted">
                                    {key === 'showActivity' && 'Display your booking history publicly'}
                                    {key === 'shareData' && 'Share anonymous data for improvements'}
                                  </small>
                                </div>
                                <Form.Check
                                  type="switch"
                                  checked={value}
                                  onChange={() => handlePreferenceChange('privacy', key)}
                                  className="custom-switch"
                                />
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      </div>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;