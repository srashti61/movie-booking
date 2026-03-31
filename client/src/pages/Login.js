import React, { useState } from 'react';

import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { FaGoogle, FaFacebook, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector(state => state.auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await dispatch(loginUser({...formData, rememberMe})).unwrap();
      
      if (result.user) {
        toast.success(`Welcome back, ${result.user.name}!`, {
          position: "top-right",
          theme: "colored"
        });
        
        // Navigate to previous page or home
        const from = location?.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Social login implementation
    toast.info(`${provider} login coming soon!`);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center">
      {/* Background Pattern */}
      <div className="login-background"></div>
      
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center align-items-center">
          <Col lg={10}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Row className="g-4 g-md-5">
                {/* Left Column - Welcome Section */}
                <Col md={6} className="d-none d-md-block">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Card className="border-0 shadow-lg welcome-card h-100">
                      <Card.Body className="p-5 d-flex flex-column justify-content-center">
                        <div className="mb-4">
                          <div className="brand-logo mb-4">
                            <i className="fas fa-film fa-3x text-danger"></i>
                            <h1 className="display-5 fw-bold mt-3 font-family-sans-serif">
                              Film<span className="text-danger">Zone</span>
                            </h1>
                          </div>
                          
                          <h2 className="fw-bold mb-3">Welcome Back!</h2>
                          <p className="text-muted mb-4">
                            Sign in to continue your cinematic journey. Access your bookings, favorites, and personalized recommendations.
                          </p>
                          
                          <div className="features-list">
                            <div className="feature-item d-flex align-items-center mb-3">
                              <div className="feature-icon me-3">
                                <i className="fas fa-ticket-alt text-success"></i>
                              </div>
                              <span>Quick & Easy Booking</span>
                            </div>
                            <div className="feature-item d-flex align-items-center mb-3">
                              <div className="feature-icon me-3">
                                <i className="fas fa-star text-warning"></i>
                              </div>
                              <span>Personalized Recommendations</span>
                            </div>
                            <div className="feature-item d-flex align-items-center mb-3">
                              <div className="feature-icon me-3">
                                <i className="fas fa-shield-alt text-primary"></i>
                              </div>
                              <span>Secure & Encrypted</span>
                            </div>
                            <div className="feature-item d-flex align-items-center">
                              <div className="feature-icon me-3">
                                <i className="fas fa-gift text-danger"></i>
                              </div>
                              <span>Exclusive Member Rewards</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <div className="testimonial bg-light rounded-4 p-4">
                            <p className="fst-italic mb-3">
                              "The best movie booking experience! Super fast and reliable."
                            </p>
                            <div className="d-flex align-items-center">
                              <div className="testimonial-avatar me-3">
                                <div className="avatar-circle">
                                  <span>ZG</span>
                                </div>
                              </div>
                              <div>
                                <h6 className="mb-0">Zoyaa</h6>
                                <small className="text-muted">Gold Member</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>

                {/* Right Column - Login Form */}
                <Col md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <Card className="border-0 shadow-lg login-card">
                      <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4 mb-md-5">
                          <div className="d-flex justify-content-center mb-3">
                            <div className="login-icon-circle">
                              <i className="fas fa-user-lock fa-2x"></i>
                            </div>
                          </div>
                          <h1 className="h2 fw-bold mb-2 font-family-sans-serif">
                            Sign In to Your Account
                          </h1>
                          <p className="text-muted">
                            Enter your credentials to access your account
                          </p>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4"
                            >
                              <Alert 
                                variant="danger" 
                                onClose={() => dispatch(clearError())} 
                                dismissible
                                className="border-0 shadow-sm"
                              >
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-exclamation-circle me-2"></i>
                                  <span>{error}</span>
                                </div>
                              </Alert>
                            </motion.div>
                          )}
                        </AnimatePresence>





                        <Form onSubmit={handleSubmit} noValidate>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-envelope me-2 text-primary"></i>
                              Email Address
                            </Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="Enter your email"
                              className="form-control-modern"
                              required
                              autoComplete="email"
                            />
                            <Form.Control.Feedback type="invalid">
                              Please enter a valid email address
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-lock me-2 text-primary"></i>
                              Password
                            </Form.Label>
                            <div className="password-input-group">
                              <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="form-control-modern"
                                required
                                autoComplete="current-password"
                              />
                              <Button
                                type="button"
                                variant="link"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                            </div>
                            <Form.Control.Feedback type="invalid">
                              Please enter your password
                            </Form.Control.Feedback>
                          </Form.Group>

            

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                             
                              type="submit"
                              className="w-100 login-btn py-3 mb-4"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  Signing In...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-sign-in-alt me-2"></i>
                                  Sign In
                                </>
                              )}
                            </Button>
                          </motion.div>

                          <div className="text-center">
                            <p className="text-muted mb-2">
                              Don't have an account?
                            </p>
                            <Link
                              to="/register"
                              className="register-link d-inline-flex align-items-center"
                            >
                              <i className="fas fa-user-plus me-2"></i>
                              Create New Account
                            </Link>
                          </div>
                        </Form>

                        <div className="mt-4 pt-3 border-top text-center">
                          <small className="text-muted">
                            By signing in, you agree to our{' '}
                            <Link to="/terms" className="text-decoration-none">
                              Terms
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-decoration-none">
                              Privacy Policy
                            </Link>
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              </Row>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;