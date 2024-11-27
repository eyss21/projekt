import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Form, Button, Alert } from 'react-bootstrap';
import styled from 'styled-components';

// Definicja zapytania GraphQL
const TRACK_SHIPMENT = gql`
  query TrackShipment($order_code: String!) {
    trackShipment(order_code: $order_code) {
      status
      status_history {
        status
        changed_at
      }
    }
  }
`;

// Styled components
const FormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const FormGroupStyled = styled(Form.Group)`
  margin-top: 10px;
`;

const TrackShipment = () => {
  const [orderCode, setOrderCode] = useState('');
  const [fetchData, setFetchData] = useState(false); // Nowy stan do zarządzania wywołaniem zapytania
  const { data, loading, error, refetch } = useQuery(TRACK_SHIPMENT, { 
    variables: { order_code: orderCode },
    skip: !fetchData // Zapytanie jest pomijane, dopóki fetchData jest false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderCode) {
      setFetchData(true); // Ustawienie fetchData na true po kliknięciu przycisku
      refetch({ order_code: orderCode }); // Wywołanie zapytania ręcznie
    }
  };

  return (
    <FormContainer>
      <Title>Sprawdź status!</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroupStyled controlId="formOrderCode">
          <Form.Label>Numer zamówienia</Form.Label>
          <Form.Control
            type="text"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            placeholder="Wprowadź numer zamówienia"
            required
          />
        </FormGroupStyled>
        <Button variant="primary" type="submit" className="mt-3">
          Sprawdź!
        </Button>
      </Form>
      {loading && <p>Loading...</p>}
      {error && <Alert variant="danger" className="mt-3">Error tracking shipment: {error.message}</Alert>}
      {data && (
        <div className="mt-3">
          <p>Status: <b>{data.trackShipment.status}</b></p>
          {data.trackShipment.status_history && (
            <div className="mt-3">
              <h4>Historia statusów</h4>
              <ul>
                {data.trackShipment.status_history.map((history, index) => (
                  <li key={index}>
                    <b>{history.status}</b> - {new Date(history.changed_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </FormContainer>
  );
};

export default TrackShipment;
