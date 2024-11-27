import React, { useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Form, Button, Table, Alert, Modal, Container } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_CARRIER_DRIVERS = gql`
  query GetCarrierDrivers($owner_id: Int!) {
    getCarrierDrivers(owner_id: $owner_id) {
      driver_id
      first_name
      last_name
      driver_id_code
    }
  }
`;

const CREATE_DRIVER = gql`
  mutation CreateDriver($first_name: String!, $last_name: String!, $pin_code: String!, $owner_id: Int!) {
    createDriver(first_name: $first_name, last_name: $last_name, pin_code: $pin_code, owner_id: $owner_id) {
      driver_id
      first_name
      last_name
      driver_id_code
    }
  }
`;

const DELETE_DRIVER = gql`
  mutation DeleteDriver($driver_id: Int!) {
    deleteDriver(driver_id: $driver_id)
  }
`;

const CHANGE_DRIVER_PIN = gql`
  mutation ChangeDriverPin($driver_id: Int!, $new_pin_code: String!) {
    changeDriverPin(driver_id: $driver_id, new_pin_code: $new_pin_code) {
      message
    }
  }
`;

// Styled Components
const TableCardStyled = styled(Container)`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  width: 100px; /* Fixed width to ensure consistency */
  height: 40px; /* Fixed height for all buttons */
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

const AddDriverButton = styled(Button)`
  width: 200px; /* Adjusted width for consistency */
  height: 50px; /* Adjusted height for consistency */
  background-color: #28a745;
  border: none;
  &:hover {
    background-color: #218838;
  }
`;

const Drivers = () => {
  const owner_id = parseInt(localStorage.getItem('user_id'), 10);
  const { data, loading, error, refetch } = useQuery(GET_CARRIER_DRIVERS, { variables: { owner_id } });

  const [createDriver] = useMutation(CREATE_DRIVER, {
    refetchQueries: [{ query: GET_CARRIER_DRIVERS, variables: { owner_id } }],
  });

  const [deleteDriver] = useMutation(DELETE_DRIVER, {
    refetchQueries: [{ query: GET_CARRIER_DRIVERS, variables: { owner_id } }],
  });

  const [changeDriverPin] = useMutation(CHANGE_DRIVER_PIN, {
    refetchQueries: [{ query: GET_CARRIER_DRIVERS, variables: { owner_id } }],
  });

  const [formData, setFormData] = useState({ first_name: '', last_name: '', pin_code: '' });
  const [newDriver, setNewDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [pinChangeMessage, setPinChangeMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    const response = await createDriver({ variables: { ...formData, owner_id } });
    setNewDriver(response.data.createDriver);
    refetch();
    setFormData({ first_name: '', last_name: '', pin_code: '' }); // Clear form after adding driver
  };

  const handleDeleteDriver = async (driver_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego kierowcę?')) {
      await deleteDriver({ variables: { driver_id: parseInt(driver_id, 10) } });
      refetch();
    }
  };

  const handleChangePin = async () => {
    try {
      await changeDriverPin({
        variables: { driver_id: parseInt(currentDriver.driver_id, 10), new_pin_code: newPin }
      });
      alert("PIN został pomyślnie zmieniony!");
      setPinChangeMessage("Pin został pomyślnie zmieniony!");
      setShowModal(false);
      refetch();
    } catch (error) {
      console.error('Błąd podczas zmiany PIN-u:', error);
      alert('Wystąpił błąd podczas zmiany PIN-u. Spróbuj ponownie.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading drivers: {error.message}</p>;

  return (
    <TableCardStyled>
      <h2 className="mt-3">Kierowcy</h2>
      {newDriver && (
        <Alert variant="success" className="mt-3">
          Kierowca został dodany! ID Kierowcy: {newDriver.driver_id_code}
        </Alert>
      )}
      {pinChangeMessage && (
        <Alert variant="success" className="mt-3" onClose={() => setPinChangeMessage('')} dismissible>
          {pinChangeMessage}
        </Alert>
      )}
      <Form onSubmit={handleCreateDriver} className="mt-4 mb-4">
        <Form.Group>
          <Form.Label>Imię</Form.Label>
          <FormControlStyled
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Nazwisko</Form.Label>
          <FormControlStyled
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>PIN (6 cyfr)</Form.Label>
          <FormControlStyled
            type="password"
            name="pin_code"
            value={formData.pin_code}
            onChange={handleInputChange}
            required
            maxLength="6"
            pattern="\d{6}"
          />
        </Form.Group>
        <AddDriverButton type="submit" className="mt-4">Dodaj Kierowcę</AddDriverButton>
      </Form>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Imię</th>
            <th>Nazwisko</th>
            <th>ID Kierowcy</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {data.getCarrierDrivers.map(driver => (
            <tr key={driver.driver_id}>
              <td>{driver.first_name}</td>
              <td>{driver.last_name}</td>
              <td>{driver.driver_id_code}</td>
              <td>
                <ButtonGroup>
                  <DeleteButton onClick={() => handleDeleteDriver(driver.driver_id)}>Usuń</DeleteButton>
                  <EditButton onClick={() => { setCurrentDriver(driver); setShowModal(true); }}>Zmień PIN</EditButton>
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Zmień PIN</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nowy PIN (6 cyfr)</Form.Label>
            <FormControlStyled
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
              maxLength="6"
              pattern="\d{6}"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <CancelButton variant="secondary" onClick={() => setShowModal(false)}>Anuluj</CancelButton>
          <SaveButton variant="primary" onClick={handleChangePin}>Zmień PIN</SaveButton>
        </Modal.Footer>
      </Modal>
    </TableCardStyled>
  );
};

export default Drivers;
