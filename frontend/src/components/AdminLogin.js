import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import styled from 'styled-components';

const LOGIN_ADMIN = gql`
  mutation LoginAdmin($email: String!, $password: String!) {
    loginAdmin(email: $email, password: $password) {
      message
      user_id
      email
      token
    }
  }
`;

const CardStyled = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const TopBarContainer = styled.div`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 50px; // Adjust height as needed
`;

const TopBarText = styled.span`
  font-weight: bold;
  transition: transform 0.3s, color 0.3s;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    color: #000;
    transform: scale(1.05);
  }
`;

const FooterContainer = styled.div`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  width: 100%;
  border-radius: 10px 10px 0 0;
  font-family: 'Arial', sans-serif;
  display: flex;
  justify-content: space-between;
  position: fixed;
  bottom: 0;
  left: 0;
`;

const EmailText = styled.span`
  margin-right: 5px;
`;

const EmailLink = styled.a`
  color: #fff;
  text-decoration: none;
  &:hover {
    color: #000;
  }
`;

const AdminLogin = ({ onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginAdmin, { loading, error }] = useMutation(LOGIN_ADMIN);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginAdmin({ variables: { ...formData } });
      if (response.data.loginAdmin.token) {
        localStorage.setItem('token', response.data.loginAdmin.token);
        localStorage.setItem('email', response.data.loginAdmin.email);
        localStorage.setItem('user_id', response.data.loginAdmin.user_id);
        localStorage.setItem('role', 'admin');
        onLoginSuccess();
      } else {
        setErrorMessage(response.data.loginAdmin.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Błąd logowania!');
    }
  };

  return (
    <Container className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <TopBarContainer>
        <TopBarText onClick={onBack}>Powrót na stronę główną</TopBarText>
      </TopBarContainer>
      <CardStyled className="mt-5">
        <h2 className="text-center">Logowanie Administratora</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicEmail">
            <Form.Label>Login</Form.Label>
            <Form.Control
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Wprowadź email"
              required
            />
          </Form.Group>

          <Form.Group controlId="formBasicPassword">
            <Form.Label>Hasło</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Hasło"
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
            Zaloguj się
          </Button>
          {error && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
        </Form>
      </CardStyled>
      <FooterContainer>
        <div>
          <EmailText>email:</EmailText>
          <EmailLink href="mailto:sebastiankomorek0503@gmail.com">sebastiankomorek0503@gmail.com</EmailLink>
        </div>
        <span>Autor: Sebastian Komorek @ 2024</span>
      </FooterContainer>
    </Container>
  );
};

export default AdminLogin;
