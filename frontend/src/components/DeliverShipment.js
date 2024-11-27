import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import styled from 'styled-components';

const DELIVER_SHIPMENT = gql`
  mutation DeliverShipment($order_code: String!, $delivery_code: String!) {
    deliverShipment(order_code: $order_code, delivery_code: $delivery_code) {
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

const DeliverShipment = () => {
  const [orderCode, setOrderCode] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [deliveryCodeError, setDeliveryCodeError] = useState('');
  const driver_id = parseInt(localStorage.getItem('user_id'));

  const { data, loading, error } = useQuery(GET_DRIVER_ORDERS, {
    variables: { driver_id },
  });

  const [deliverShipment, { data: deliverData, loading: deliverLoading, error: deliverError }] = useMutation(DELIVER_SHIPMENT, {
    refetchQueries: [{ query: GET_DRIVER_ORDERS, variables: { driver_id } }],
  });

  const handleDeliveryCodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
      setDeliveryCode(value);
      setDeliveryCodeError('');
    } else {
      setDeliveryCodeError('Kod odbioru musi składać się z 4 cyfr.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deliveryCode.length !== 4) {
      setDeliveryCodeError('Kod odbioru musi składać się z 4 cyfr.');
      return;
    }
    deliverShipment({ variables: { order_code: orderCode, delivery_code: deliveryCode } });
  };

  return (
    <Container className="mt-1"> {/* Zmiana z mt-2 na mt-1 */}
      <CardStyled>
        <h2 className="mb-4">Wydaj Przesyłkę</h2>
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
                .filter(order => order.status === 'Przyjęta od klienta')
                .map(order => (
                  <option key={order.order_id} value={order.order_code}>
                    {order.order_code}
                  </option>
                ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formDeliveryCode" className="mt-3">
            <Form.Label>Kod Odbioru</Form.Label>
            <Form.Control
              type="text"
              value={deliveryCode}
              onChange={handleDeliveryCodeChange}
              placeholder="Wprowadź kod odbioru"
              required
            />
            {deliveryCodeError && <Alert variant="danger" className="mt-2">{deliveryCodeError}</Alert>}
          </Form.Group>
          <Button variant="primary" type="submit" disabled={deliverLoading || deliveryCode.length !== 4} className="mt-3">
            Wydaj Przesyłkę
          </Button>
          {deliverError && <Alert variant="danger" className="mt-3">Błąd: {deliverError.message}</Alert>}
          {deliverData && deliverData.deliverShipment.status !== "Dostarczona" && (
            <Alert variant="danger" className="mt-3">{deliverData.deliverShipment.status}</Alert>
          )}
          {deliverData && deliverData.deliverShipment.status === "Dostarczona" && (
            <Alert variant="success" className="mt-3">Status: {deliverData.deliverShipment.status}</Alert>
          )}
        </Form>
        {loading && <p>Ładowanie zamówień...</p>}
        {error && <Alert variant="danger" className="mt-3">Błąd: {error.message}</Alert>}
      </CardStyled>
    </Container>
  );
};

export default DeliverShipment;
