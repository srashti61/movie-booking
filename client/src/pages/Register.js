import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../features/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import * as zxcvbn from 'zxcvbn';
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [validation, setValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
    hasLowercase: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // eslint-enable-enext-line no-unused-vars
  const { error } = useSelector(state => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (error) dispatch(clearError());
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }

    // Password validation
    if (name === 'password') {
      const score = zxcvbn(value).score;
      setPasswordScore(score);
      
      setValidation({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordScore < 2) {
      newErrors.password = 'Please choose a stronger password';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    
}
    
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...submitData } = formData;
      const result = await dispatch(registerUser(submitData)).unwrap();
      
      if (result.user) {
        toast.success(`Welcome to FilmZone, ${result.user.name}! 🎬`, {
          position: "top-right",
          theme: "colored",
          autoClose: 3000,
        });
        
        navigate('/');
      }
    } catch (error) {
      toast.error(error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getPasswordStrengthColor = () => {
    switch(passwordScore) {
      case 0: return 'danger';
      case 1: return 'warning';
      case 2: return 'info';
      case 3: return 'primary';
      case 4: return 'success';
      default: return 'secondary';
    }
  };

  const getPasswordStrengthText = () => {
    switch(passwordScore) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="register-page min-vh-100 d-flex align-items-center">
      {/* Background Pattern */}
      <div className="register-background"></div>
      
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Row className="g-4 g-md-5">
                {/* Left Column - Benefits */}
                <Col md={6} className="d-none d-md-block">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Card className="border-0 shadow-lg benefits-card h-100">
                      <Card.Body className="p-5 d-flex flex-column justify-content-center">
                        <div className="mb-4">
                          <div className="brand-logo mb-4">
                            <i className="fas fa-film fa-3x text-danger"></i>
                            <h1 className="display-5 fw-bold mt-3 font-family-sans-serif">
                              Film<span className="text-danger">Zone</span>
                            </h1>
                          </div>
                          
                          <h2 className="fw-bold mb-3">Join FilmZone Today</h2>
                          <p className="text-muted mb-4">
                            Create your free account and unlock a world of cinematic experiences.
                          </p>
                          
                          <div className="benefits-list">
                            <div className="benefit-item d-flex align-items-start mb-4">
                              <div className="benefit-icon me-3">
                                <div className="icon-circle">
                                  <i className="fas fa-percentage text-success"></i>
                                </div>
                              </div>
                              <div>
                                <h5 className="fw-semibold mb-2">Exclusive Offers</h5>
                                <p className="text-muted mb-0">Get special discounts and early access to tickets.</p>
                              </div>
                            </div>
                            
                            <div className="benefit-item d-flex align-items-start mb-4">
                              <div className="benefit-icon me-3">
                                <div className="icon-circle">
                                  <i className="fas fa-star text-warning"></i>
                                </div>
                              </div>
                              <div>
                                <h5 className="fw-semibold mb-2">Personalized Experience</h5>
                                <p className="text-muted mb-0">Movie recommendations based on your taste.</p>
                              </div>
                            </div>
                            
                            <div className="benefit-item d-flex align-items-start mb-4">
                              <div className="benefit-icon me-3">
                                <div className="icon-circle">
                                  <i className="fas fa-bolt text-danger"></i>
                                </div>
                              </div>
                              <div>
                                <h5 className="fw-semibold mb-2">Fast & Easy Booking</h5>
                                <p className="text-muted mb-0">Book tickets in under 60 seconds.</p>
                              </div>
                            </div>
                            
                            <div className="benefit-item d-flex align-items-start">
                              <div className="benefit-icon me-3">
                                <div className="icon-circle">
                                  <i className="fas fa-gift text-primary"></i>
                                </div>
                              </div>
                              <div>
                                <h5 className="fw-semibold mb-2">Loyalty Rewards</h5>
                                <p className="text-muted mb-0">Earn points with every booking for exciting rewards.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <div className="stats-card bg-light rounded-4 p-4">
                            <Row>
                              <Col>
                                <div className="text-center">
                                  <div className="stat-number display-6 fw-bold text-danger">10K+</div>
                                  <small className="text-muted">Happy Users</small>
                                </div>
                              </Col>
                              <Col>
                                <div className="text-center">
                                  <div className="stat-number display-6 fw-bold text-primary">50K+</div>
                                  <small className="text-muted">Tickets Booked</small>
                                </div>
                              </Col>
                              <Col>
                                <div className="text-center">
                                  <div className="stat-number display-6 fw-bold text-success">4.8</div>
                                  <small className="text-muted">Avg Rating</small>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>

                {/* Right Column - Registration Form */}
                <Col md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <Card className="border-0 shadow-lg register-card">
                      <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4 mb-md-5">
                          <div className="d-flex justify-content-center mb-3">
                            <div className="register-icon-circle">
                              <i className="fas fa-user-plus fa-2x"></i>
                            </div>
                          </div>
                          <h1 className="h2 fw-bold mb-2 font-family-sans-serif">
                            Create Your Account
                          </h1>
                          <p className="text-muted">
                            Fill in your details to get started
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
                                  onChange={handleChange}
                                  placeholder="Enter your full name"
                                  className="form-control-modern"
                                  isInvalid={!!errors.name}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {errors.name}
                                </Form.Control.Feedback>
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
                                  onChange={handleChange}
                                  placeholder="Enter 10-digit number"
                                  className="form-control-modern"
                                  isInvalid={!!errors.phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {errors.phone}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-4">
  <Form.Label className="fw-semibold">
    Gender
  </Form.Label>
  <Form.Select
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    isInvalid={!!errors.gender}   
  >
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </Form.Select>

  <Form.Control.Feedback type="invalid">
    {errors.gender}
  </Form.Control.Feedback>
</Form.Group>

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
                              isInvalid={!!errors.email}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.email}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                              We'll never share your email with anyone else.
                            </Form.Text>
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
                                placeholder="Create a strong password"
                                className="form-control-modern"
                                isInvalid={!!errors.password}
                              />
                              <Button
                                type="button"
                                variant="link"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? <FaEye />  : <FaEyeSlash />}
                              </Button>
                            </div>
                            <Form.Control.Feedback type="invalid">
                              {errors.password}
                            </Form.Control.Feedback>
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                              <div className="password-strength mt-3">
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted">Password Strength</span>
                                  <span className={`fw-semibold text-${getPasswordStrengthColor()}`}>
                                    {getPasswordStrengthText()}
                                  </span>
                                </div>
                                <ProgressBar 
                                  now={(passwordScore + 1) * 20} 
                                  variant={getPasswordStrengthColor()}
                                  className="mb-3"
                                />
                                
                                {/* Password Requirements */}
                                <div className="password-requirements">
                                  <div className="row g-2">
                                    {Object.entries(validation).map(([key, isValid]) => (
                                      <Col key={key} xs={6}>
                                        <div className="d-flex align-items-center">
                                          <div className={`requirement-icon me-2 ${isValid ? 'valid' : 'invalid'}`}>
                                            {isValid ? <FaCheck /> : <FaTimes />}
                                          </div>
                                          <small className={isValid ? 'text-success' : 'text-muted'}>
                                            {key === 'minLength' && '8+ characters'}
                                            {key === 'hasNumber' && 'Includes number'}
                                            {key === 'hasSpecial' && 'Special character'}
                                            {key === 'hasUppercase' && 'Uppercase letter'}
                                            {key === 'hasLowercase' && 'Lowercase letter'}
                                          </small>
                                        </div>
                                      </Col>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-lock me-2 text-primary"></i>
                              Confirm Password
                            </Form.Label>
                            <div className="password-input-group">
                              <Form.Control
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                className="form-control-modern"
                                isInvalid={!!errors.confirmPassword}
                              />
                              <Button
                                type="button"
                                variant="link"
                                className="password-toggle"
                                onClick={toggleConfirmPasswordVisibility}
                              >
                                {showConfirmPassword ? <FaEye /> :  <FaEyeSlash />}
                              </Button>
                            </div>
                            <Form.Control.Feedback type="invalid">
                              {errors.confirmPassword}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Check
                              type="checkbox"
                              id="terms"
                              label={
                                <span>
                                  I agree to the{' '}
                                  <Link to="/terms" className="text-decoration-none fw-semibold">
                                    Terms of Service
                                  </Link>{' '}
                                  and{' '}
                                  <Link to="/privacy" className="text-decoration-none fw-semibold">
                                    Privacy Policy
                                  </Link>
                                </span>
                              }
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="form-check-modern"
                              isInvalid={!!errors.terms}
                            />
                            {errors.terms && (
                              <div className="invalid-feedback d-block">
                                {errors.terms}
                              </div>
                            )}
                          </Form.Group>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="danger"
                              type="submit"
                              className="w-100 register-btn py-3 mb-4"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  Creating Account...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-user-plus me-2"></i>
                                  Create Account
                                </>
                              )}
                            </Button>
                          </motion.div>

                          <div className="text-center">
                            <p className="text-muted mb-2">
                              Already have an account?
                            </p>
                            <Link
                              to="/login"
                              className="login-link d-inline-flex align-items-center"
                            >
                              <i className="fas fa-sign-in-alt me-2"></i>
                              Sign In to Your Account
                            </Link>
                          </div>

                          <div className="mt-4 pt-3 border-top text-center">
                            <small className="text-muted">
                              By registering, you agree to our terms and confirm that you have read our{' '}
                              <Link to="/privacy" className="text-decoration-none">
                                Privacy Policy
                              </Link>
                            </small>
                          </div>
                        </Form>
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

export default Register;