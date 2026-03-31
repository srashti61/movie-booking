import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-flex">

      <div className="footer-flex-row">

        {/* Brand */}
        <div className="footer-flex-col">
          <h4 className="fw-bold text-danger mb-3">🎬FilmZone</h4>
          <p className="footer-text fw-bold">
            Book your movie tickets online with ease. Experience premium cinemas,
            best seats and instant booking.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-flex-col">
          <h5 className="fw-bold mb-3">Quick Links</h5>
          <ul className="footer-links">
            <li><Link to="/movies">Movies</Link></li>
            <li><Link to="/theaters">Theaters</Link></li>
            <li><Link to="/my-bookings">My Bookings</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-flex-col">
          <h5 className="fw-bold mb-3">Contact Us</h5>
          <p className="footer-text fw-bold">
            <i className="fas fa-phone me-2 text-danger"></i> +91 6351044583
          </p>
          <p className="footer-text fw-bold">
            <i className="fas fa-envelope me-2 text-danger"></i> support@filmzone.com
          </p>
          <p className="footer-text fw-bold">
            <i className="fas fa-map-marker-alt me-2 text-danger"></i> Valsad, India
          </p>
        </div>

      </div>

      <div className="footer-bottom-flex">
        <p>
          &copy; {new Date().getFullYear()} <strong>FilmZone</strong>. All rights reserved.
        </p>
      </div>

    </footer>
  );
};

export default Footer;
