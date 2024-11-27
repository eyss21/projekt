import React, { useState } from 'react';
import { Card, Row, Col, Container } from 'react-bootstrap';
import styled from 'styled-components';

const CardStyled = styled(Card)`
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  transition: transform 0.3s, background-color 0.3s, color 0.3s;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  &:hover {
    transform: scale(1.05);
    background-color: #e9ecef;
    color: #007bff;
  }
`;

const AdminLoginContainer = styled.div`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  text-align: right;
  width: 100%;
  border-radius: 0 0 10px 10px;
  font-family: 'Arial', sans-serif;
  height: 50px; // Adjust height as needed
`;

const AdminLoginText = styled.span`
  font-weight: bold;
  transition: transform 0.3s, color 0.3s;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    color: #000;
    transform: scale(1.05);
  }
`;

const Description = styled.p`
  font-size: 1rem;
  color: #555;
  margin-top: 10px;
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
  position: relative;
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

const Home = ({ onRoleSelect }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleAdminLogin = () => {
    onRoleSelect('admin');
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column justify-content-between">
      <AdminLoginContainer>
        <AdminLoginText onClick={handleAdminLogin}>Logowanie Administratora</AdminLoginText>
      </AdminLoginContainer>
      <Row className="flex-grow-1 d-flex align-items-center justify-content-center">
        <Col md={3} className="p-3 d-flex align-items-center justify-content-center">
          <CardStyled onClick={() => onRoleSelect('carrier')}>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <Card.Title className="m-0" style={{ fontSize: '1.5rem' }}>Przewoźnik</Card.Title>
              <Description>
                Zaloguj się do panelu przewoźnika. Dodaj swoją flotę, rozkłady jazdy i realizuj zamówienia klientów.
              </Description>
            </Card.Body>
          </CardStyled>
        </Col>
        <Col md={3} className="p-3 d-flex align-items-center justify-content-center">
          <CardStyled onClick={() => onRoleSelect('customer')}>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <Card.Title className="m-0" style={{ fontSize: '1.5rem' }}>Klient</Card.Title>
              <Description>
                Zaloguj się do panelu klienta i zleć wysyłkę lub śledź swoją przesyłkę.
              </Description>
            </Card.Body>
          </CardStyled>
        </Col>
        <Col md={3} className="p-3 d-flex align-items-center justify-content-center">
          <CardStyled onClick={() => onRoleSelect('driver')}>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <Card.Title className="m-0" style={{ fontSize: '1.5rem' }}>Kierowca</Card.Title>
              <Description>
                Zaloguj się do panelu kierowcy i wydaj klientowi paczkę.
              </Description>
            </Card.Body>
          </CardStyled>
        </Col>
      </Row>
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

export default Home;
