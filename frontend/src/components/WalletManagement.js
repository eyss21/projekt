import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Form, Card, Button, Alert } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_ALL_USERS_WALLETS = gql`
  query GetAllUsers {
    getAllUsers {
      user_id
      first_name
      last_name
      email
      phone_number
      user_type
      wallet {
        balance
      }
    }
  }
`;

const UPDATE_WALLET_BALANCE = gql`
  mutation UpdateUserFunds($user_id: ID!, $new_balance: Float!) {
    updateUserFunds(user_id: $user_id, new_balance: $new_balance) {
      wallet_id
      balance
    }
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ActionButton = styled(Button)`
  width: 100px;
  height: 40px;
`;

const SaveButton = styled(ActionButton)`
  background-color: #28a745;
  border: none;
  &:hover {
    background-color: #218838;
  }
`;

const CancelButton = styled(ActionButton)`
  background-color: #6c757d;
  border: none;
  &:hover {
    background-color: #5a6268;
  }
`;

const EditButton = styled(ActionButton)`
  background-color: #ffc107;
  border: none;
  &:hover {
    background-color: #e0a800;
  }
`;

const WalletManagement = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_USERS_WALLETS);
  const [updateWalletBalance] = useMutation(UPDATE_WALLET_BALANCE, {
    refetchQueries: [{ query: GET_ALL_USERS_WALLETS }],
    onCompleted: () => {
      alert('Stan portfela został zaktualizowany');
    },
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd przy aktualizacji portfela');
    }
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (selectedUser) {
      setBalance(selectedUser.wallet?.balance || 0);
    }
  }, [selectedUser]);

  const handleUpdateBalance = async () => {
    try {
      await updateWalletBalance({
        variables: {
          user_id: selectedUser.user_id,
          new_balance: balance, 
        },
      });
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <Alert variant="danger">Error loading users: {error.message}</Alert>;

  return (
    <TableCardStyled>
      <h2>Zarządzanie środkami użytkowników</h2>
      <div style={{ overflowX: 'auto' }}>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Typ Użytkownika</th>
              <th>Nr Telefonu</th>
              <th>Saldo Portfela</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {data.getAllUsers.map((user) => (
              <tr key={user.user_id}>
                <td>{user.email}</td>
                <td>{user.user_type}</td>
                <td>{user.phone_number || 'Brak'}</td>
                {selectedUser && selectedUser.user_id === user.user_id ? (
                  <>
                    <td>
                      <Form.Control
                        type="number"
                        value={balance}
                        onChange={(e) => setBalance(parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <ButtonGroup>
                        <SaveButton onClick={handleUpdateBalance}>Zapisz</SaveButton>
                        <CancelButton onClick={handleCancel}>Anuluj</CancelButton>
                      </ButtonGroup>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{user.wallet?.balance.toFixed(2) || '0.00'}</td>
                    <td>
                      <ButtonGroup>
                        <EditButton onClick={() => setSelectedUser(user)}>Edytuj</EditButton>
                      </ButtonGroup>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </TableCardStyled>
  );
};

export default WalletManagement;
