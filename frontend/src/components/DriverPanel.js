import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Layout from './Layout';
import DriverOrders from './DriverOrders';
import AcceptShipment from './AcceptShipment';
import DeliverShipment from './DeliverShipment';
import { useQuery, gql } from '@apollo/client';
import styled from 'styled-components';

// GraphQL Query
const GET_DRIVER_PROFILE = gql`
  query GetDriverProfile($driver_id: Int!) {
    getDriverProfile(driver_id: $driver_id) {
      first_name
      last_name
    }
  }
`;

// Styled Components
const PanelContainer = styled(Container)`
  margin-top: 20px;
`;

const DriverPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('orders'); // Ustawienie domyślnej zakładki na 'orders'
  const driver_id = parseInt(localStorage.getItem('user_id')); // Zakładamy, że driver_id jest przechowywane w localStorage

  const { data, loading, error } = useQuery(GET_DRIVER_PROFILE, {
    variables: { driver_id },
  });

  if (loading) return <p>Ładowanie danych...</p>;
  if (error) return <p>Błąd ładowania danych kierowcy: {error.message}</p>;

  const driverName = data ? `${data.getDriverProfile.first_name} ${data.getDriverProfile.last_name}` : 'Kierowca';

  return (
    <Layout
      onLogout={onLogout}
      panelTitle={`Witaj ${driverName}!`}
      menuItems={[
        { label: 'Zlecenia', action: () => setActiveTab('orders') },
        { label: 'Przyjmij Przesyłkę', action: () => setActiveTab('accept') },
        { label: 'Wydaj Przesyłkę', action: () => setActiveTab('deliver') },
      ]}
    >
      <PanelContainer>
        {activeTab === 'orders' && <DriverOrders driver_id={driver_id} />}
        {activeTab === 'accept' && <AcceptShipment />}
        {activeTab === 'deliver' && <DeliverShipment />}
      </PanelContainer>
    </Layout>
  );
};

export default DriverPanel;
