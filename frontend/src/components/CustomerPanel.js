import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import ShipmentForm from './ShipmentForm';
import TrackShipment from './TrackShipment';
import CustomerProfile from './CustomerProfile';
import MyShipments from './MyShipments';
import { Container, Alert } from 'react-bootstrap';
import Layout from './Layout';

const DELETE_USER = gql`
  mutation DeleteUser($email: String!, $user_type: String!) {
    deleteUser(email: $email, user_type: $user_type)
  }
`;

const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      user_id
      email
      first_name
      last_name
      user_type
    }
  }
`;

const CustomerPanel = ({ onLogout }) => {
  const [email] = useState(localStorage.getItem('email'));
  const user_id = parseInt(localStorage.getItem('user_id'), 10);
  const [deleteUser, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }],  // Dodanie refetchQueries tutaj
    onCompleted: () => {
      alert("Konto zostało usunięte.");
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      setIsDeleted(true);
      onLogout();
    },
    onError: (error) => {
      console.error(error);
      alert("Nie udało się usunąć konta.");
    },
  });

  const [isDeleted, setIsDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState('shipment');

  const handleDelete = async () => {
    if (window.confirm("Czy na pewno chcesz usunąć swoje konto?")) {
      try {
        await deleteUser({ variables: { email, user_type: 'customer' } });
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
      panelTitle="Panel Klienta"
      menuItems={[
        { label: 'Nadanie Przesyłki', action: () => setActiveTab('shipment') },
        { label: 'Śledzenie Przesyłki', action: () => setActiveTab('track') },
        { label: 'Moje Przesyłki', action: () => setActiveTab('myShipments') },
        { label: 'Mój Profil', action: () => setActiveTab('profile') },
        { label: 'Usuń Konto', action: handleDelete, style: { color: 'red' }, disabled: deleteLoading },
      ]}
    >
      <Container className="mt-3">
        {activeTab === 'shipment' && <ShipmentForm user_id={user_id} onShipmentCreated={() => setActiveTab('myShipments')} />}
        {activeTab === 'track' && <TrackShipment />}
        {activeTab === 'myShipments' && <MyShipments />}
        {activeTab === 'profile' && <CustomerProfile />}
        {deleteError && <Alert variant="danger" className="mt-3">Błąd usuwania konta! {deleteError.message}</Alert>}
      </Container>
    </Layout>
  );
};

export default CustomerPanel;
