import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(location.pathname);

  // Close the mobile menu whenever the route changes
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Each new page starts at the top (links with a #section scroll there instead)
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Logo />

        <button
          className="mobile-menu-btn"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(open => !open)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/shop" className={linkClass}>Shop</NavLink>

          {user ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  <LayoutDashboard size={16} /> Dashboard
                </NavLink>
              )}
              <NavLink to="/cart" className={({ isActive }) => `nav-link nav-cart ${isActive ? 'active' : ''}`} aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag size={19} />
                <span className="mobile-only-label">Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </NavLink>
              <span className="nav-divider" aria-hidden="true" />
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="nav-link"
                title={`Signed in as ${user.name || user.phone}`}>
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <User size={16} /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
