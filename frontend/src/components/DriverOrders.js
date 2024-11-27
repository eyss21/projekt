import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Table, Card } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Query
const GET_DRIVER_ORDERS = gql`
  query GetDriverOrders($driver_id: Int!) {
    getDriverOrders(driver_id: $driver_id) {
      order_id
      status
      start_stop
      end_stop
      departure_time
      arrival_time
      order_code
    }
  }
`;

// Styled Components
const OrdersCardStyled = styled(Card)`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const DriverOrders = ({ driver_id }) => {
  const { data, loading, error } = useQuery(GET_DRIVER_ORDERS, { variables: { driver_id } });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <OrdersCardStyled>
      <h2>Zlecenia Kierowcy</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Kod Zamówienia</th>
            <th>Status</th>
            <th>Punkt Początkowy</th>
            <th>Punkt Docelowy</th>
            <th>Godzina Odjazdu</th>
            <th>Godzina Przyjazdu</th>
          </tr>
        </thead>
        <tbody>
          {data.getDriverOrders.map((order) => (
            <tr key={order.order_id}>
              <td>{order.order_code}</td>
              <td>{order.status}</td>
              <td>{order.start_stop}</td>
              <td>{order.end_stop}</td>
              <td>{new Date(order.departure_time).toLocaleTimeString()}</td>
              <td>{new Date(order.arrival_time).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </OrdersCardStyled>
  );
};

export default DriverOrders;
