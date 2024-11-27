import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Card, Button } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Query
const GET_INTERVENTION_ORDERS = gql`
  query GetInterventionOrders {
    getInterventionOrders {
      order {
        order_code
        size
        start_stop
        end_stop
      }
      problem {
        problem_id
        description
        created_at
      }
      customer {
        email
        phone_number
      }
      carrier {
        email
        phone_number
      }
    }
  }
`;

const DELETE_SHIPMENT_PROBLEM = gql`
  mutation DeleteShipmentProblem($problem_id: ID!) {
    deleteShipmentProblem(problem_id: $problem_id)
  }
`;

// Styled Components
const TableCardStyled = styled(Card)`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
`;

const TableColumn = styled.td`
  width: 150px;
  text-align: center;
  vertical-align: middle;
`;

const PhoneNumberColumn = styled.td`
  width: 200px;
  text-align: center;
  vertical-align: middle;
`;

const TableHeader = styled.th`
  width: 150px;
  text-align: center;
  vertical-align: middle;
`;

const PhoneNumberHeader = styled.th`
  width: 200px;
  text-align: center;
  vertical-align: middle;
`;

const ActionButton = styled(Button)`
  width: 100px;
  height: 40px;
  background-color: #dc3545;
  border: none;
  &:hover {
    background-color: #c82333;
  }
`;

const InterventionOrders = () => {
  const { loading, error, data } = useQuery(GET_INTERVENTION_ORDERS);
  const [deleteShipmentProblem] = useMutation(DELETE_SHIPMENT_PROBLEM, {
    refetchQueries: [{ query: GET_INTERVENTION_ORDERS }],
    onError: (err) => {
      console.error("Error deleting shipment problem:", err);
      alert('Wystąpił błąd przy usuwaniu problemu przesyłki');
    },
  });

  const handleDeleteProblem = (problem_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten problem przesyłki?')) {
      deleteShipmentProblem({ variables: { problem_id } });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading intervention orders: {error.message}</p>;

  return (
    <TableCardStyled>
      <h2>Zamówienia ze statusem Interwencja</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <TableHeader>Nr Zamówienia</TableHeader>
            <TableHeader>Rozmiar</TableHeader>
            <TableHeader>Punkt Startowy</TableHeader>
            <TableHeader>Punkt Końcowy</TableHeader>
            <TableHeader>Opis Problemu</TableHeader>
            <TableHeader>Data Zgłoszenia</TableHeader>
            <TableHeader>Email Klienta</TableHeader>
            <PhoneNumberHeader>Telefon Klienta</PhoneNumberHeader>
            <TableHeader>Email Przewoźnika</TableHeader>
            <PhoneNumberHeader>Telefon Przewoźnika</PhoneNumberHeader>
            <TableHeader>Akcje</TableHeader>
          </tr>
        </thead>
        <tbody>
          {data.getInterventionOrders.map((entry, index) => (
            <tr key={index}>
              <TableColumn>{entry.order.order_code}</TableColumn>
              <TableColumn>{entry.order.size}</TableColumn>
              <TableColumn>{entry.order.start_stop}</TableColumn>
              <TableColumn>{entry.order.end_stop}</TableColumn>
              <TableColumn>{entry.problem.description}</TableColumn>
              <TableColumn>{new Date(entry.problem.created_at).toLocaleString()}</TableColumn>
              <TableColumn>{entry.customer.email}</TableColumn>
              <PhoneNumberColumn>{entry.customer.phone_number}</PhoneNumberColumn>
              <TableColumn>{entry.carrier.email}</TableColumn>
              <PhoneNumberColumn>{entry.carrier.phone_number}</PhoneNumberColumn>
              <TableColumn>
                <ActionButton onClick={() => handleDeleteProblem(entry.problem.problem_id)}>Usuń</ActionButton>
              </TableColumn>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableCardStyled>
  );
};

export default InterventionOrders;
