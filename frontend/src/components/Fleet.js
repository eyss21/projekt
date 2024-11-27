import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Button, Form, Card } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_USER_VEHICLES = gql`
  query GetUserVehicles($owner_id: Int!) {
    getUserVehicles(owner_id: $owner_id) {
      vehicle_id
      model
      capacity
      registration_number
    }
  }
`;

const ADD_VEHICLE = gql`
  mutation AddVehicle($model: String!, $capacity: Int!, $registration_number: String!, $owner_id: Int!) {
    addVehicle(model: $model, capacity: $capacity, registration_number: $registration_number, owner_id: $owner_id) {
      vehicle_id
      model
      capacity
      registration_number
    }
  }
`;

const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle($vehicle_id: Int!, $model: String!, $capacity: Int!, $registration_number: String!) {
    updateVehicle(vehicle_id: $vehicle_id, model: $model, capacity: $capacity, registration_number: $registration_number) {
      vehicle_id
      model
      capacity
      registration_number
    }
  }
`;

const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($vehicle_id: Int!) {
    deleteVehicle(vehicle_id: $vehicle_id)
  }
`;

// Styled Components
const TableCardStyled = styled(Card)`
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

const AddVehicleButton = styled(Button)`
  width: 200px; /* Original width for the "Add Vehicle" button */
  height: 50px; /* Original height for consistency */
  background-color: #28a745;
  &:hover {
    background-color: #218838;
  }
`;

const Fleet = () => {
  const [owner_id] = useState(parseInt(localStorage.getItem('user_id')));
  const { data, loading, error, refetch } = useQuery(GET_USER_VEHICLES, { variables: { owner_id } });

  const [editVehicle, setEditVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({ model: '', capacity: '', registration_number: '' });
  const [addingVehicle, setAddingVehicle] = useState(false);

  const [addVehicle] = useMutation(ADD_VEHICLE, {
    refetchQueries: [{ query: GET_USER_VEHICLES, variables: { owner_id } }], // Dodano refetchQueries do addVehicle
    onCompleted: () => {
      setAddingVehicle(false);
      setNewVehicle({ model: '', capacity: '', registration_number: '' });
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const [updateVehicle] = useMutation(UPDATE_VEHICLE, {
    refetchQueries: [{ query: GET_USER_VEHICLES, variables: { owner_id } }], // Dodano refetchQueries do updateVehicle
    onCompleted: () => {
      setEditVehicle(null);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const [deleteVehicle] = useMutation(DELETE_VEHICLE, {
    refetchQueries: [{ query: GET_USER_VEHICLES, variables: { owner_id } }], // Dodano refetchQueries do deleteVehicle
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd podczas usuwania pojazdu.');
    },
  });

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    
    if (editVehicle) {
      // Update existing vehicle
      try {
        await updateVehicle({
          variables: {
            vehicle_id: parseInt(editVehicle.vehicle_id, 10),
            model: editVehicle.model,
            capacity: parseInt(editVehicle.capacity, 10),
            registration_number: editVehicle.registration_number
          }
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      // Add new vehicle
      try {
        await addVehicle({
          variables: { 
            model: newVehicle.model, 
            capacity: parseInt(newVehicle.capacity, 10), 
            registration_number: newVehicle.registration_number, 
            owner_id 
          }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditVehicleChange = (field, value) => {
    setEditVehicle({ ...editVehicle, [field]: value });
  };

  const handleNewVehicleChange = (field, value) => {
    setNewVehicle({ ...newVehicle, [field]: value });
  };

  const handleDeleteVehicle = async (vehicle_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten pojazd?')) {
      try {
        await deleteVehicle({ variables: { vehicle_id: parseInt(vehicle_id, 10) } });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading vehicles: {error.message}</p>;

  return (
    <TableCardStyled>
      <h2>Flota</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Model pojazdu</th>
            <th>Pojemność</th>
            <th>Nr rejestracyjny pojazdu</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {data.getUserVehicles.map((vehicle) => (
            <tr key={vehicle.vehicle_id}>
              {editVehicle && editVehicle.vehicle_id === vehicle.vehicle_id ? (
                <>
                  <td>
                    <FormControlStyled
                      type="text"
                      value={editVehicle.model}
                      onChange={(e) => handleEditVehicleChange('model', e.target.value)}
                    />
                  </td>
                  <td>
                    <FormControlStyled
                      type="number"
                      value={editVehicle.capacity}
                      onChange={(e) => handleEditVehicleChange('capacity', e.target.value)}
                    />
                  </td>
                  <td>
                    <FormControlStyled
                      type="text"
                      value={editVehicle.registration_number}
                      onChange={(e) => handleEditVehicleChange('registration_number', e.target.value)}
                    />
                  </td>
                  <td>
                    <ButtonGroup>
                      <SaveButton onClick={handleSaveVehicle}>
                        Zapisz
                      </SaveButton>
                      <CancelButton variant="secondary" onClick={() => setEditVehicle(null)}>
                        Anuluj
                      </CancelButton>
                    </ButtonGroup>
                  </td>
                </>
              ) : (
                <>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.capacity}</td>
                  <td>{vehicle.registration_number}</td>
                  <td>
                    <ButtonGroup>
                      <EditButton onClick={() => setEditVehicle(vehicle)}>Edytuj</EditButton>
                      <DeleteButton onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}>Usuń</DeleteButton>
                    </ButtonGroup>
                  </td>
                </>
              )}
            </tr>
          ))}

          {addingVehicle ? (
            <tr>
              <td>
                <FormControlStyled
                  type="text"
                  placeholder="Enter vehicle model"
                  value={newVehicle.model}
                  onChange={(e) => handleNewVehicleChange('model', e.target.value)}
                />
              </td>
              <td>
                <FormControlStyled
                  type="number"
                  placeholder="Enter capacity"
                  value={newVehicle.capacity}
                  onChange={(e) => handleNewVehicleChange('capacity', e.target.value)}
                />
              </td>
              <td>
                <FormControlStyled
                  type="text"
                  placeholder="Enter registration number"
                  value={newVehicle.registration_number}
                  onChange={(e) => handleNewVehicleChange('registration_number', e.target.value)}
                />
              </td>
              <td>
                <ButtonGroup>
                  <SaveButton onClick={handleSaveVehicle}>
                    Zapisz
                  </SaveButton>
                  <CancelButton variant="secondary" onClick={() => setAddingVehicle(false)}>
                    Anuluj
                  </CancelButton>
                </ButtonGroup>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                <AddVehicleButton onClick={() => setAddingVehicle(true)}>
                  Dodaj nowy pojazd
                </AddVehicleButton>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </TableCardStyled>
  );
};

export default Fleet;
