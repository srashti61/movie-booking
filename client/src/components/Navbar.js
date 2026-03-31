import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Button,
  Badge
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import './NavigationBar.css';

const NavigationBar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);

  const closeMenu = () => {
    if (window.innerWidth < 992) {
      setExpanded(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setExpanded(false);
    navigate('/login');
  };

  return (
    <BootstrapNavbar
      expand="lg"
      expanded={expanded}
      onToggle={(val) => setExpanded(val)}
      className="navbar-modern sticky-top"
    >
      <Container fluid className="px-5">

        
        <BootstrapNavbar.Brand
          as={Link}
          to="/"
          className="navbar-brand-modern"
          onClick={closeMenu}
        >
          🎬 <span className="text-danger">FilmZone</span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">

          <Nav className="mx-auto navbar-links">
            <Nav.Link as={Link} to="/" onClick={closeMenu}>
              Home
            </Nav.Link>

            <Nav.Link as={Link} to="/movies" onClick={closeMenu}>
              Movies
            </Nav.Link>

            <Nav.Link as={Link} to="/theaters" onClick={closeMenu}>
              Theaters
            </Nav.Link>

            {isAuthenticated && (
              <Nav.Link as={Link} to="/my-bookings" onClick={closeMenu}>
                My Bookings
              </Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center">
            {isAuthenticated ? (
              <NavDropdown
                align="end"
                className="user-dropdown"
                title={
                  <span className="user-name">
                    <i className="fas fa-user me-1"></i>
                    {user?.name || 'User'}
                    {user?.isAdmin && (
                      <Badge bg="danger" className="ms-2">
                        Admin
                      </Badge>
                    )}
                  </span>
                }
                id="user-dropdown"
              >
                <NavDropdown.Item
                  as={Link}
                  to="/profile"
                  onClick={closeMenu}
                >
                  <i className="fas fa-user-circle me-2"></i>
                  Profile
                </NavDropdown.Item>

                {user?.isAdmin && (
                  <NavDropdown.Item
                    as={Link}
                    to="/admin"
                    onClick={closeMenu}
                  >
                    <i className="fas fa-cog me-2"></i>
                    Admin Dashboard
                  </NavDropdown.Item>
                )}

                <NavDropdown.Divider />

                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  onClick={closeMenu}
                  className="btn-outline-modern me-3"
                  style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                >
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Button>

                <Button
                  as={Link}
                  to="/register"
                  onClick={closeMenu}
                  className="btn-primary-modern"
                  style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}
                >
                  <i className="fas fa-user-plus me-1 "></i>
                  Register
                </Button>
              </>
            )}
          </Nav>

        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default NavigationBar;
