import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signup(formData);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div className="auth-head">
          <span className="eyebrow">Join us</span>
          <h1>Create an account</h1>
          <p>Save your details for faster ordering.</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="su-name">Full name</label>
            <input id="su-name" type="text" name="name" autoComplete="name" className="form-input"
              value={formData.name} onChange={handleChange} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="su-phone">Phone number</label>
            <input id="su-phone" type="tel" name="phone" autoComplete="tel" inputMode="numeric" maxLength={10} className="form-input"
              value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="su-address">Delivery address</label>
            <textarea id="su-address" name="address" autoComplete="street-address" className="form-input" rows="3"
              value={formData.address} onChange={handleChange} placeholder="House no., street, area, city" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="su-password">Password</label>
            <input id="su-password" type="password" name="password" autoComplete="new-password" minLength={6} className="form-input"
              value={formData.password} onChange={handleChange} placeholder="At least 6 characters" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
