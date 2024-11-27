import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Form, Card, Button } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      user_id
      email
      company_name
      postal_code
      city
      street
      first_name
      last_name
      user_type
      phone_number
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser(
    $user_id: ID!
    $email: String!
    $user_type: String!
    $company_name: String
    $postal_code: String
    $city: String
    $street: String
    $first_name: String
    $last_name: String
    $phone_number: String
  ) {
    updateUser(
      user_id: $user_id
      email: $email
      user_type: $user_type
      company_name: $company_name
      postal_code: $postal_code
      city: $city
      street: $street
      first_name: $first_name
      last_name: $last_name
      phone_number: $phone_number
    ) {
      user_id
      email
      company_name
      postal_code
      city
      street
      first_name
      last_name
      user_type
      phone_number
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($email: String!, $user_type: String!) {
    deleteUser(email: $email, user_type: $user_type)
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

const FormControlStyled = styled(Form.Control)`
  width: 100%;
  margin-bottom: 10px;
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

const DeleteButton = styled(ActionButton)`
  background-color: #dc3545;
  border: none;
  &:hover {
    background-color: #c82333;
  }
`;

const ActionColumn = styled.td`
  position: sticky;
  right: 0;
  background-color: #f8f9fa;
  width: 180px; /* Stała szerokość kolumny z przyciskami */
`;

const ActionHeader = styled.th`
  position: sticky;
  right: 0;
  background-color: #f8f9fa;
  z-index: 1;
  width: 180px; /* Stała szerokość nagłówka kolumny z przyciskami */
`;

const TableColumn = styled.td`
  width: 150px; /* Stała szerokość dla każdej komórki */
`;

const TableHeader = styled.th`
  width: 150px; /* Stała szerokość dla każdego nagłówka */
`;

const UserManagement = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_USERS);

  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }], // Dodano refetchQueries
    onCompleted: () => {
      alert('User updated successfully');
      setSelectedUser(null);
    },
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd przy aktualizacji użytkownika');
    }
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }], // Dodano refetchQueries
    onCompleted: () => {
      alert('Użytkownik został usunięty');
      refetch();
    },
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd przy usuwaniu użytkownika');
    }
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    postal_code: '',
    city: '',
    street: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: ''
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email,
        company_name: selectedUser.company_name || '',
        postal_code: selectedUser.postal_code || '',
        city: selectedUser.city || '',
        street: selectedUser.street || '',
        first_name: selectedUser.first_name || '',
        last_name: selectedUser.last_name || '',
        phone_number: selectedUser.phone_number || '',
        user_type: selectedUser.user_type
      });
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'phone_number') {
      handlePhoneChange(e);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUpdate = async () => {
    try {
      await updateUser({
        variables: {
          user_id: selectedUser.user_id,
          ...formData,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
  };

  const handleDelete = async (user_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        await deleteUser({
          variables: {
            email: data.getAllUsers.find(user => user.user_id === user_id).email,
            user_type: data.getAllUsers.find(user => user.user_id === user_id).user_type
          },
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatPhoneNumber = (number) => {
    // Usuwa prefiks +48, aby obsługiwać tylko cyfry podane przez użytkownika
    const cleanedNumber = number.replace(/[^0-9]/g, '').slice(2);
    // Dodaje spacje po każdej grupie 3 cyfr
    return cleanedNumber.replace(/(\d{3})(?=\d)/g, '$1 ');
  };
  
  // Funkcja do obsługi zmiany numeru telefonu
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\s/g, ''); // Usuń wszystkie spacje
  
    // Upewnij się, że prefiks "+48" jest zawsze obecny
    if (!value.startsWith('+48')) {
      value = '+48' + value.replace(/^(\+)?48/, ''); // Dodaj +48 jeśli nie jest obecne
    }
  
    // Usuwamy prefiks "+48", aby obsługiwać tylko cyfry podane przez użytkownika
    let numberWithoutPrefix = value.slice(3);
  
    // Sprawdzamy, czy liczba cyfr jest równa lub mniejsza od 9
    if (/^\d{0,9}$/.test(numberWithoutPrefix)) {
      numberWithoutPrefix = numberWithoutPrefix.replace(/(\d{3})(?=\d)/g, '$1 '); // Formatowanie numeru
      setFormData({
        ...formData,
        phone_number: `+48 ${numberWithoutPrefix}`  // Dodajemy +48 na początku i sformatowany numer
      });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <TableCardStyled>
      <h2>Zarządzanie Użytkownikami</h2>
      <div style={{ overflowX: 'auto' }}>
        <Table striped bordered hover>
          <thead>
            <tr>
              <TableHeader>Email</TableHeader>
              <TableHeader>Nazwa Firmy</TableHeader>
              <TableHeader>Kod Pocztowy</TableHeader>
              <TableHeader>Miasto</TableHeader>
              <TableHeader>Ulica</TableHeader>
              <TableHeader>Imię</TableHeader>
              <TableHeader>Nazwisko</TableHeader>
              <TableHeader>Numer Telefonu</TableHeader>
              <TableHeader>Typ Użytkownika</TableHeader>
              <ActionHeader>Akcje</ActionHeader>
            </tr>
          </thead>
          <tbody>
            {data.getAllUsers.map((user) => (
              <tr key={user.user_id}>
                {selectedUser && selectedUser.user_id === user.user_id ? (
                  <>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Wprowadź email"
                        required
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Wprowadź nazwę firmy"
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        placeholder="Wprowadź kod pocztowy"
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Wprowadź miasto"
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Wprowadź ulicę"
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Wprowadź imię"
                      />
                    </TableColumn>
                    <TableColumn>
                      <FormControlStyled
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Wprowadź nazwisko"
                      />
                    </TableColumn>
                    <TableColumn>
                    <FormControlStyled
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+48 123 456 789"
                      />
                    </TableColumn>
                    <TableColumn>
                      <Form.Control
                        as="select"
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="customer">customer</option>
                        <option value="carrier">carrier</option>
                        <option value="admin">admin</option>
                      </Form.Control>
                    </TableColumn>
                    <ActionColumn>
                      <ButtonGroup>
                        <SaveButton onClick={handleUpdate}>Zapisz</SaveButton>
                        <CancelButton onClick={handleCancel}>Anuluj</CancelButton>
                      </ButtonGroup>
                    </ActionColumn>
                  </>
                ) : (
                  <>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.email}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.company_name}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.postal_code}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.city}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.street}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.first_name}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.last_name}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.phone_number}</div>
                    </TableColumn>
                    <TableColumn>
                      <div style={{ width: '150px' }}>{user.user_type}</div>
                    </TableColumn>
                    <ActionColumn>
                      <ButtonGroup>
                        <EditButton onClick={() => setSelectedUser(user)}>Edytuj</EditButton>
                        <DeleteButton onClick={() => handleDelete(user.user_id)}>Usuń</DeleteButton>
                      </ButtonGroup>
                    </ActionColumn>
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

export default UserManagement;