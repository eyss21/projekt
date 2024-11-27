import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import styled from 'styled-components';

const ACCEPT_SHIPMENT = gql`
  mutation AcceptShipment($order_code: String!, $pickup_code: String!) {
    acceptShipment(order_code: $order_code, pickup_code: $pickup_code) {
      status
    }
  }
`;

const GET_DRIVER_ORDERS = gql`
  query GetDriverOrders($driver_id: Int!) {
    getDriverOrders(driver_id: $driver_id) {
      order_id
      order_code
      status
    }
  }
`;

// Styled component for consistent card styling
const CardStyled = styled(Card)`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const AcceptShipment = () => {
  const [orderCode, setOrderCode] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [pickupCodeError, setPickupCodeError] = useState('');
  const driver_id = parseInt(localStorage.getItem('user_id'));

  const { data, loading, error } = useQuery(GET_DRIVER_ORDERS, {
    variables: { driver_id },
  });

  const [acceptShipment, { data: acceptData, loading: acceptLoading, error: acceptError }] = useMutation(ACCEPT_SHIPMENT, {
    refetchQueries: [{ query: GET_DRIVER_ORDERS, variables: { driver_id } }],
  });

  const handlePickupCodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setPickupCode(value);
      setPickupCodeError('');
    } else {
      setPickupCodeError('Kod nadania musi składać się z 4 cyfr.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pickupCode.length !== 4) {
      setPickupCodeError('Kod nadania musi składać się z 4 cyfr.');
      return;
    }
    acceptShipment({ variables: { order_code: orderCode, pickup_code: pickupCode } });
  };

  return (
    <Container className="mt-1">
      <CardStyled>
        <h2 className="mb-4">Przyjmij Przesyłkę</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formOrderCode">
            <Form.Label>Kod Zamówienia</Form.Label>
            <Form.Control
              as="select"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              required
            >
              <option value="">Wybierz zamówienie</option>
              {data && data.getDriverOrders
                .filter(order => order.status === 'Przypisano kierowcę')
                .map(order => (
                  <option key={order.order_id} value={order.order_code}>
                    {order.order_code}
                  </option>
                ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formPickupCode" className="mt-3">
            <Form.Label>Kod Nadania</Form.Label>
            <Form.Control
              type="text"
              value={pickupCode}
              onChange={handlePickupCodeChange}
              placeholder="Wprowadź kod nadania"
              required
            />
            {pickupCodeError && <Alert variant="danger" className="mt-2">{pickupCodeError}</Alert>}
          </Form.Group>
          <Button variant="primary" type="submit" disabled={acceptLoading || pickupCode.length !== 4} className="mt-3">
            Przyjmij Przesyłkę
          </Button>
          {acceptError && <Alert variant="danger" className="mt-3">Błąd: {acceptError.message}</Alert>}
          {acceptData && acceptData.acceptShipment.status !== "Przyjęta od klienta" && (
            <Alert variant="danger" className="mt-3">{acceptData.acceptShipment.status}</Alert>
          )}
          {acceptData && acceptData.acceptShipment.status === "Przyjęta od klienta" && (
            <Alert variant="success" className="mt-3">Status: {acceptData.acceptShipment.status}</Alert>
          )}
        </Form>
        {loading && <p>Ładowanie zamówień...</p>}
        {error && <Alert variant="danger" className="mt-3">Błąd: {error.message}</Alert>}
      </CardStyled>
    </Container>
  );
};

export default AcceptShipment;
