import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import styled from 'styled-components';

const LOGIN_DRIVER = gql`
  mutation LoginDriver($id: String!, $pin: String!) {
    loginDriver(id: $id, pin: $pin) {
      message
      user_id
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
  height: 50px;
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

const DriverLogin = ({ onLoginSuccess, onBack }) => {
  const [id, setId] = useState('');
  const [pin, setPin] = useState('');
  const [loginDriver, { data, loading, error }] = useMutation(LOGIN_DRIVER);
  const [loginError, setLoginError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginDriver({ variables: { id, pin } });
      if (response.data.loginDriver.message === "User logged in") {
        localStorage.setItem('token', response.data.loginDriver.token);
        localStorage.setItem('driver_id_code', id);
        localStorage.setItem('user_id', response.data.loginDriver.user_id);
        setLoginError(false);
        onLoginSuccess();
      } else {
        setLoginError(true);
      }
    } catch (err) {
      console.error(err);
      setLoginError(true);
    }
  };

  return (
    <Container className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <TopBarContainer>
        <TopBarText onClick={onBack}>Powrót na stronę główną</TopBarText>
      </TopBarContainer>
      <CardStyled className="mt-5">
        <h2 className="text-center">Logowanie Kierowcy</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicId">
            <Form.Label>ID</Form.Label>
            <Form.Control
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Wprowadź ID"
              required
            />
          </Form.Group>

          <Form.Group controlId="formBasicPin">
            <Form.Label>PIN</Form.Label>
            <Form.Control
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Wprowadź 6-cyfrowy PIN"
              required
              maxLength="6"
              pattern="\d{6}"
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
            Zaloguj się
          </Button>
          {loginError && <Alert variant="danger" className="mt-3">Błąd logowania! Nieprawidłowe ID lub PIN.</Alert>}
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

export default DriverLogin;
