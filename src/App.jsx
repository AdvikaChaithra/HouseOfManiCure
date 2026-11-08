import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';

// Where a logged-in user goes when visiting /login or /signup:
// admins to the dashboard, customers back to the page that sent them to login.
const AfterLoginRedirect = ({ isAdmin }) => {
  const location = useLocation();
  return <Navigate to={isAdmin ? "/admin" : (location.state?.from || "/")} replace />;
};

function App() {
  const { user, isAdmin } = useAuth();

  return (
    <Router>
      <Navbar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" state={{ from: '/cart' }} />} />
          
          <Route path="/login" element={!user ? <Login /> : <AfterLoginRedirect isAdmin={isAdmin} />} />
          <Route path="/signup" element={!user ? <Signup /> : <AfterLoginRedirect isAdmin={isAdmin} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to={user ? "/" : "/login"} />} />

          {/* Unknown URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
