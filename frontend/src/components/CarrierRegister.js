import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import styled from 'styled-components';

const REGISTER_CARRIER = gql`
  mutation RegisterCarrier($email: String!, $password: String!, $company_name: String!, $postal_code: String!, $city: String!, $street: String!, $phoneNumber: String) {
    registerCarrier(email: $email, password: $password, company_name: $company_name, postal_code: $postal_code, city: $city, street: $street, phoneNumber: $phoneNumber) {
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

const CarrierRegister = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    postal_code: '',
    city: '',
    street: '',
    phoneNumber: '+48 ' // Domyślny prefiks
  });

  const [registerCarrier, { loading, error }] = useMutation(REGISTER_CARRIER, {
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
    return number.replace(/(\d{3})(?=\d)/g, '$1 ');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    const numberWithoutPrefix = value.replace('+48', '');

    if (/^\d{0,9}$/.test(numberWithoutPrefix)) {
      const formattedNumber = formatPhoneNumber(numberWithoutPrefix);
      setFormData({
        ...formData,
        phoneNumber: `+48 ${formattedNumber}`
      });
    }
  };

  const validateForm = () => {
    const { email, password, confirmPassword, company_name, postal_code, city, street, phoneNumber } = formData;
    if (!email || !password || !confirmPassword || !company_name || !postal_code || !city || !street) {
      return 'Wszystkie pola są wymagane';
    }
    if (password !== confirmPassword) {
      return 'Hasła nie pasują do siebie';
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return 'Hasło musi zawierać co najmniej jedną wielką literę, cyfrę i mieć długość co najmniej 8 znaków';
    }
    const phoneRegex = /^\+48\s\d{3}\s\d{3}\s\d{3}$/;
    if (!phoneRegex.test(phoneNumber)) {
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
      await registerCarrier({ variables: { ...formData } });
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
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ marginTop: '70px', marginBottom: '70px' }}>
    <TopBarContainer>
      <TopBarText onClick={onCancel}>Powrót na stronę główną</TopBarText>
    </TopBarContainer>
    <CardStyled>
      <h2 className="text-center">Rejestracja Przewoźnika</h2>
        <Form onSubmit={handleSubmit}>
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

          <Form.Group controlId="formCompanyName">
            <Form.Label>Nazwa Firmy</Form.Label>
            <Form.Control
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Nazwa Firmy"
              required
            />
          </Form.Group>

          <Form.Group controlId="formPostalCode">
            <Form.Label>Kod Pocztowy</Form.Label>
            <Form.Control
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              placeholder="Kod Pocztowy"
              required
            />
          </Form.Group>

          <Form.Group controlId="formCity">
            <Form.Label>Miasto</Form.Label>
            <Form.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Miasto"
              required
            />
          </Form.Group>

          <Form.Group controlId="formStreet">
            <Form.Label>Ulica</Form.Label>
            <Form.Control
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Ulica"
              required
            />
          </Form.Group>

          <Form.Group controlId="formPhone">
            <Form.Label>Numer telefonu</Form.Label>
            <Form.Control
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
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

export default CarrierRegister;