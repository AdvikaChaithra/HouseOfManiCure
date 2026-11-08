import React, { createContext, useState, useContext } from 'react';
import { loginUser, signupUser, logoutUser, getCurrentUser } from '../api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // The saved session is read synchronously, so no loading screen is needed.
  // Login/signup deliberately do not set a global loading flag: App used to
  // unmount the whole router while the request ran, which wiped the Login
  // page's error message on a wrong password.
  const [user, setUser] = useState(() => getCurrentUser());

  const login = async (phone, password) => {
    const userData = await loginUser(phone, password);
    setUser(userData);
    return userData;
  };

  const signup = async (data) => {
    const userData = await signupUser(data);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
