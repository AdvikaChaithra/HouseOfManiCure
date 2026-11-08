import React from 'react';
import { Link } from 'react-router-dom';

// "Haus of ManiCure" with a small nail-drop over the "i"
const Logo = () => (
  <Link to="/" className="logo" aria-label="Haus of ManiCure — home">
    Haus of Man
    <span className="logo-i" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="0.42em" height="0.42em" fill="currentColor">
        <path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3.8 6-10.5 6-10.5s6 6.7 6 10.5c0 3.3-2.7 6-6 6z" />
      </svg>
      <span>ı</span>
    </span>
    Cure
  </Link>
);

export default Logo;
