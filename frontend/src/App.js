import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import CarrierPanel from './components/CarrierPanel';
import CustomerPanel from './components/CustomerPanel';
import CustomerLogin from './components/CustomerLogin';
import CustomerRegister from './components/CustomerRegister';
import CarrierLogin from './components/CarrierLogin';
import CarrierRegister from './components/CarrierRegister';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import DriverLogin from './components/DriverLogin';
import DriverPanel from './components/DriverPanel';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

function App() {
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setRole(localStorage.getItem('role'));
    }
  }, []);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    localStorage.setItem('role', selectedRole);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleCancelRegister = () => {
    setShowRegister(false);
  };

  const handleLogout = () => {
    setRole(null);
    setIsLoggedIn(false);
    setShowRegister(false);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
  };

  return (
    <AppContainer>
      <ContentContainer>
        {!role && <Home onRoleSelect={handleRoleSelect} />}
        {role === 'carrier' && !isLoggedIn && !showRegister && (
          <CarrierLogin onLoginSuccess={handleLoginSuccess} onRegister={handleRegister} onBack={() => setRole(null)} />
        )}
        {role === 'carrier' && !isLoggedIn && showRegister && (
          <CarrierRegister onCancel={handleCancelRegister} />
        )}
        {role === 'carrier' && isLoggedIn && <CarrierPanel onLogout={handleLogout} />}
        {role === 'customer' && !isLoggedIn && !showRegister && (
          <CustomerLogin onLoginSuccess={handleLoginSuccess} onRegister={handleRegister} onBack={() => setRole(null)} />
        )}
        {role === 'customer' && !isLoggedIn && showRegister && (
          <CustomerRegister onCancel={handleCancelRegister} />
        )}
        {role === 'customer' && isLoggedIn && <CustomerPanel onLogout={handleLogout} />}
        {role === 'admin' && !isLoggedIn && (
          <AdminLogin onLoginSuccess={handleLoginSuccess} onBack={() => setRole(null)} />
        )}
        {role === 'admin' && isLoggedIn && <AdminPanel onLogout={handleLogout} />}
        {role === 'driver' && !isLoggedIn && (
          <DriverLogin onLoginSuccess={handleLoginSuccess} onBack={() => setRole(null)} />
        )}
        {role === 'driver' && isLoggedIn && <DriverPanel onLogout={handleLogout} />}
      </ContentContainer>
    </AppContainer>
  );
}

export default App;
