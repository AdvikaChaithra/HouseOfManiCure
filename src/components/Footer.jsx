import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Logo from './Logo';
import { ADMIN_WHATSAPP } from '../api';
import InstagramIcon from './InstagramIcon';
import { INSTAGRAM_DM_URL, INSTAGRAM_PROFILE_URL, INSTAGRAM_HANDLE } from '../utils/instagram';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Handcrafted press-on nails, made to order in your shape, size and colour.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul className="footer-links">
            <li><Link to="/shop">All designs</Link></li>
            <li><Link to="/cart">Your cart</Link></li>
            <li><Link to="/login">Account</Link></li>
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul className="footer-links">
            <li>
              <a href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} /> Order help on WhatsApp
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={15} /> Message us on Instagram
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                {INSTAGRAM_HANDLE}
              </a>
            </li>
            <li><Link to="/#how-it-works">How ordering works</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Haus of ManiCure</span>
        <span>Made with care, one set at a time.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
