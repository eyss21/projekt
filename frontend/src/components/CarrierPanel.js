import React, { useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Button, Alert, Container, Card, Table } from 'react-bootstrap';
import styled from 'styled-components';
import Fleet from './Fleet';
import Schedule from './Schedule';
import Orders from './Orders';
import CarrierProfile from './CarrierProfile';
import Layout from './Layout';
import Drivers from './Drivers';
import Pricelist from './Pricelist';

// GraphQL Queries and Mutations
const GET_CARRIER_STATS = gql`
  query GetCarrierStats($owner_id: Int!) {
    getCarrierStats(owner_id: $owner_id) {
      completedOrders
      totalEarnings
      newOrders
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($email: String!, $user_type: String!) {
    deleteUser(email: $email, user_type: $user_type)
  }
`;

// Styled Components
const PanelCardStyled = styled(Card)`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const CarrierPanel = ({ onLogout }) => {
  const [email] = useState(localStorage.getItem('email'));
  const owner_id = parseInt(localStorage.getItem('user_id'));
  
  const { data, loading: statsLoading, error: statsError } = useQuery(GET_CARRIER_STATS, { variables: { owner_id } });
  
  const [deleteUser, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_CARRIER_STATS, variables: { owner_id } }],
    onCompleted: () => {
      alert("Konto zostało usunięte.");
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      setIsDeleted(true);
      onLogout();
    },
    onError: (err) => {
      console.error(err);
      alert("Nie udało się usunąć konta.");
    }
  });

  const [isDeleted, setIsDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleDelete = async () => {
    if (window.confirm("Czy na pewno chcesz usunąć swoje konto?")) {
      try {
        await deleteUser({ variables: { email, user_type: 'carrier' } });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isDeleted) {
    return <Alert variant="success">Twoje konto zostało pomyślnie usunięte.</Alert>;
  }

  return (
    <Layout
      onLogout={onLogout}
      panelTitle="Panel Przewoźnika"
      menuItems={[
        { label: 'Panel ogólny', action: () => setActiveTab('dashboard') },
        { label: 'Flota', action: () => setActiveTab('fleet') },
        { label: 'Rozkład jazdy', action: () => setActiveTab('schedule') },
        { label: 'Zamówienia', action: () => setActiveTab('orders') },
        { label: 'Kierowcy', action: () => setActiveTab('drivers') },
        { label: 'Cennik', action: () => setActiveTab('pricelist') },
        { label: 'Mój Profil', action: () => setActiveTab('profile') },
        { label: 'Usuń Konto', action: handleDelete, style: { color: 'red' }, disabled: deleteLoading },
      ]}
    >
      <Container className="mt-3">
        {activeTab === 'dashboard' && (
          <>
            {statsLoading && <p>Ładowanie statystyk...</p>}
            {statsError && <p>Błąd: {statsError.message}</p>}
            {data && (
              <PanelCardStyled>
                <h3>Panel ogólny</h3>
                <Table striped bordered hover className="mt-3">
                  <thead>
                    <tr>
                      <th>Nowe zlecenia</th>
                      <th>Wykonane zlecenia</th>
                      <th>Zysk w PLN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{data.getCarrierStats.newOrders}</td>
                      <td>{data.getCarrierStats.completedOrders}</td>
                      <td>{data.getCarrierStats.totalEarnings.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </PanelCardStyled>
            )}
          </>
        )}
        {activeTab === 'fleet' && <Fleet />}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'drivers' && <Drivers />}
        {activeTab === 'pricelist' && <Pricelist owner_id={owner_id} />}
        {activeTab === 'profile' && <CarrierProfile />}
        {deleteError && <Alert variant="danger" className="mt-3">Błąd usuwania konta! {deleteError.message}</Alert>}
      </Container>
    </Layout>
  );
};

export default CarrierPanel;
