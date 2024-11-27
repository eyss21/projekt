import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import styled from 'styled-components';

const REGISTER_CUSTOMER = gql`
  mutation RegisterCustomer($firstName: String!, $lastName: String!, $email: String!, $password: String!, $phoneNumber: String) {
    registerCustomer(firstName: $firstName, lastName: $lastName, email: $email, password: $password, phoneNumber: $phoneNumber) {
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

const CustomerRegister = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '+48'
  });
  const [registerCustomer, { loading, error }] = useMutation(REGISTER_CUSTOMER, {
    refetchQueries: ['GET_ALL_USERS']
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatPhoneNumber = (number) => {
    return number.replace(/(\d{3})(?=\d)/g, '$1 '); // Dodaje spację po każdej grupie 3 cyfr
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // Usuń wszystkie istniejące spacje
    const numberWithoutPrefix = value.replace('+48', ''); // Usuń prefiks +48, aby obsługiwać tylko cyfry podane przez użytkownika
  
    // Sprawdzamy, czy liczba cyfr jest równa lub mniejsza od 9
    if (/^\d{0,9}$/.test(numberWithoutPrefix)) {
      const formattedNumber = formatPhoneNumber(numberWithoutPrefix); // Formatowanie numeru
      setFormData({
        ...formData,
        phoneNumber: `+48 ${formattedNumber}`  // Poprawione na phoneNumber
      });
    }
  };

  const validateForm = () => {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = formData; // Poprawione na phoneNumber
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return 'Wszystkie pola są wymagane';
    }
    if (password !== confirmPassword) {
      return 'Hasła nie pasują do siebie';
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return 'Hasło musi zawierać co najmniej jedną wielką literę, cyfrę i mieć długość co najmniej 8 znaków';
    }
  
    const phoneRegex = /^\+48\s\d{3}\s\d{3}\s\d{3}$/; // Format: +48 123 456 789
    if (!phoneRegex.test(phoneNumber)) { // Poprawione na phoneNumber
      return 'Wprowadź poprawny numer telefonu w formacie +48 123 456 789';
    }
  
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMessage = validateForm();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
    try {
      await registerCustomer({ variables: { ...formData } });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (success) {
    return (
      <Container className="vh-100 d-flex flex-column justify-content-center align-items-center">
        <TopBarContainer>
          <TopBarText onClick={onCancel}>Powrót na stronę główną</TopBarText>
        </TopBarContainer>
        <CardStyled className="mt-5">
          <Alert variant="success">Konto zostało założone pomyślnie!</Alert>
          <Button variant="primary" className="w-100 mt-3" onClick={onCancel}>
            Zaloguj się
          </Button>
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
  }

  return (
    <Container className="vh-100 d-flex flex-column justify-content-center align-items-center" style={{ marginBottom: '70px' }}>
      <TopBarContainer>
        <TopBarText onClick={onCancel}>Powrót na stronę główną</TopBarText>
      </TopBarContainer>
      <CardStyled className="mt-5">
        <h2 className="text-center">Rejestracja Klienta</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formFirstName">
            <Form.Label>Imię</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Wprowadź imię"
              required
            />
          </Form.Group>

          <Form.Group controlId="formLastName">
            <Form.Label>Nazwisko</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Wprowadź nazwisko"
              required
            />
          </Form.Group>

          <Form.Group controlId="formBasicEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
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

          <Form.Group controlId="formConfirmPassword">
            <Form.Label>Potwierdź Hasło</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Potwierdź Hasło"
              required
            />
          </Form.Group>

          <Form.Group controlId="formPhone">
            <Form.Label>Numer telefonu</Form.Label>
            <Form.Control
              type="tel"
              name="phoneNumber" // Upewnij się, że nazwa pola jest poprawna
              value={formData.phoneNumber} // Użyj poprawnej nazwy zmiennej
              onChange={handlePhoneChange}
              placeholder="Wprowadź numer telefonu"
            />
          </Form.Group>


          <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
            Zarejestruj się
          </Button>
          {error && <Alert variant="danger" className="mt-3">Błąd rejestracji! {error.message}</Alert>}
        </Form>
        <Button variant="link" onClick={onCancel} className="w-100 mt-2">
          Anuluj
        </Button>
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

export default CustomerRegister;
