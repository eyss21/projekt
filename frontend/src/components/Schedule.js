import React, { useState, useEffect } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Form, Button, Alert, Container, Offcanvas, Table } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries and Mutations
const GET_ALL_STOPS = gql`
  query GetAllStops {
    getAllStops
  }
`;

const GET_USER_VEHICLES = gql`
  query GetUserVehicles($owner_id: Int!) {
    getUserVehicles(owner_id: $owner_id) {
      vehicle_id
      model
      registration_number
    }
  }
`;

const GET_VEHICLE_RELATIONS = gql`
  query GetVehicleRelations($vehicle_id: Int!) {
    getVehicleRelations(vehicle_id: $vehicle_id) {
      relation_id
      relation_name
    }
  }
`;

const GET_VEHICLE_SCHEDULES = gql`
  query GetVehicleSchedules($vehicle_id: Int!, $relation_id: Int) {
    getVehicleSchedules(vehicle_id: $vehicle_id, relation_id: $relation_id) {
      schedule_id
      stop
      arrival_time
      departure_time
      order_number
      relation_id
    }
  }
`;

const GET_UNASSIGNED_SCHEDULES = gql`
  query GetUnassignedSchedules($vehicle_id: Int!) {
    getVehicleSchedules(vehicle_id: $vehicle_id, relation_id: null) {
      schedule_id
      stop
      arrival_time
      departure_time
    }
  }
`;

const ADD_SCHEDULE = gql`
  mutation AddSchedule($vehicle_id: Int!, $stop: String!, $arrival_time: String!, $departure_time: String!, $relation_id: Int) {
    addSchedule(vehicle_id: $vehicle_id, stop: $stop, arrival_time: $arrival_time, departure_time: $departure_time, relation_id: $relation_id) {
      schedule_id
      stop
      arrival_time
      departure_time
      order_number
    }
  }
`;

const CREATE_RELATION = gql`
  mutation CreateRelation($vehicle_id: Int!, $relation_name: String!) {
    createRelation(vehicle_id: $vehicle_id, relation_name: $relation_name) {
      relation_id
      relation_name
    }
  }
`;

const DELETE_RELATION = gql`
  mutation DeleteRelation($vehicle_id: Int!, $relation_id: Int!) {
    deleteRelation(vehicle_id: $vehicle_id, relation_id: $relation_id)
  }
`;

const DELETE_SCHEDULE = gql`
  mutation DeleteSchedule($schedule_id: Int!) {
    deleteSchedule(schedule_id: $schedule_id)
  }
`;

const DELETE_ALL_SCHEDULES = gql`
  mutation DeleteAllSchedules($relation_id: Int!) {
    deleteAllSchedules(relation_id: $relation_id)
  }
`;

const UPDATE_SCHEDULE_ORDER = gql`
  mutation UpdateScheduleOrder($schedule_id: Int!, $new_order_number: Int!) {
    updateScheduleOrder(schedule_id: $schedule_id, new_order_number: $new_order_number) {
      schedule_id
      order_number
    }
  }
`;

const UPDATE_SCHEDULE = gql`
  mutation UpdateSchedule($schedule_id: Int!, $stop: String!, $arrival_time: String!, $departure_time: String!) {
    updateSchedule(schedule_id: $schedule_id, stop: $stop, arrival_time: $arrival_time, departure_time: $departure_time) {
      schedule_id
      stop
      arrival_time
      departure_time
    }
  }
`;

const ASSIGN_SCHEDULE_TO_RELATION = gql`
  mutation AssignScheduleToRelation($schedule_id: Int!, $relation_id: Int!) {
    assignScheduleToRelation(schedule_id: $schedule_id, relation_id: $relation_id) {
      schedule_id
      relation_id
    }
  }
`;

// Styled Components
const FormCardStyled = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const FormControlStyled = styled(Form.Control)`
  width: 100%;
  margin-bottom: 10px;
  border-radius: 5px;
  height: 38px;
`;

const OrderNumberInput = styled(Form.Control)`
  width: 60px;
  height: 38px;
  text-align: center;
  box-shadow: ${props => (props.hasDuplicate ? '0 0 5px red' : 'none')};
`;

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 10px;
`;

const OffcanvasStyledButton = styled(Button)`
  width: 100%;
  max-width: 400px;
  margin: 20px auto 0 auto;
  display: block;
  color: #ffffff;
`;

const EditButton = styled(Button)`
  background-color: #ffc107;
  border: none;
  color: #ffffff;
  margin-right: 5px;
  padding: 6px 12px;
  &:hover {
    background-color: #e0a800;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  &:hover {
    background-color: #c82333;
  }
`;

const SaveButton = styled(Button)`
  background-color: #28a745;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  &:hover {
    background-color: #218838;
  }
`;

const CancelButton = styled(Button)`
  background-color: #6c757d;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  &:hover {
    background-color: #5a6268;
  }
`;

const ButtonGroupStyled = styled.div`
  display: flex;
  gap: 5px;
`;

const LabelStyled = styled(Form.Label)`
  text-align: left;
  width: 100%;
`;

const StyledSelect = styled(Form.Select)`
  width: 100%;
  margin-bottom: 10px;
  border-radius: 5px;
  height: 38px;
`;

const OffcanvasStyled = styled(Offcanvas)`
  width: 600px !important;
`;

const ChangeOrderButton = styled(Button)`
  background-color: #ffc107;
  color: #ffffff;
  border: none;
  width: 100%;
  max-width: 400px;
  margin: 20px auto 0 auto;
  display: block;
  &:hover {
    background-color: #e0a800;
  }
`;

const FormRowStyled = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const CancelRelationButton = styled(Button)`
  background-color: #6c757d;
  color: #ffffff;
  border: none;
  width: 100%;
  max-width: 400px;
  margin: 10px auto 0 auto;
  display: block;
  &:hover {
    background-color: #5a6268;
  }
`;

const CenteredButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

const Schedule = () => {
  const [vehicle_id, setVehicleId] = useState('');
  const [relation_id, setRelationId] = useState(null);
  const [relationName, setRelationName] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState({});
  const [editRowId, setEditRowId] = useState(null);
  const [editStop, setEditStop] = useState('');
  const [editArrivalTime, setEditArrivalTime] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [creatingRelation, setCreatingRelation] = useState(false);
  const [relationList, setRelationList] = useState([]);
  const [unassignedSchedules, setUnassignedSchedules] = useState([]);
  const [showUnassignedSchedules, setShowUnassignedSchedules] = useState(false);
  const owner_id = parseInt(localStorage.getItem('user_id'));
  const [newStop, setNewStop] = useState('');
  const [newArrivalTime, setNewArrivalTime] = useState('');
  const [newDepartureTime, setNewDepartureTime] = useState('');
  const [addingNewStop, setAddingNewStop] = useState(false);
  const [addingRowId, setAddingRowId] = useState(null);
  const [showRelationSelect, setShowRelationSelect] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState("");
  const [filteredStops, setFilteredStops] = useState([]); // Filtered stops for new stop
  const [filteredEditStops, setFilteredEditStops] = useState([]); // Filtered stops for edit stop

  const { data: allStopsData } = useQuery(GET_ALL_STOPS);
  const { data: vehiclesData, loading: vehiclesLoading, error: vehiclesError } = useQuery(GET_USER_VEHICLES, { variables: { owner_id } });
  const { data: relationsData, refetch: refetchRelations } = useQuery(GET_VEHICLE_RELATIONS, { variables: { vehicle_id: parseInt(vehicle_id) }, skip: !vehicle_id });
  const { data: schedulesData, loading: schedulesLoading, error: schedulesError, refetch } = useQuery(GET_VEHICLE_SCHEDULES, { 
    variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) }, 
    skip: !vehicle_id || !relation_id 
  });  
  const { data: unassignedData, refetch: refetchUnassigned } = useQuery(GET_UNASSIGNED_SCHEDULES, {
    variables: { vehicle_id: parseInt(vehicle_id, 10) },
    skip: !vehicle_id
  });

  const [addSchedule] = useMutation(ADD_SCHEDULE, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }],
    onCompleted: () => {
      resetNewStopForm();
      setAddingNewStop(false);
      setAddingRowId(null);
    }
  });

  const [updateSchedule] = useMutation(UPDATE_SCHEDULE, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }],
    onCompleted: () => {
      setEditRowId(null);
      setEditErrorMessage('');
    }
  });

  const [deleteSchedule] = useMutation(DELETE_SCHEDULE, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }, { query: GET_UNASSIGNED_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10) } }],
  });

  const [deleteAllSchedules] = useMutation(DELETE_ALL_SCHEDULES, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }],
  });

  const [updateScheduleOrder] = useMutation(UPDATE_SCHEDULE_ORDER, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }],
  });

  const [createRelation] = useMutation(CREATE_RELATION, {
    refetchQueries: [{ query: GET_VEHICLE_RELATIONS, variables: { vehicle_id: parseInt(vehicle_id) } }],
    onCompleted: (data) => {
      setRelationId(parseInt(data.createRelation.relation_id, 10));
      setRelationName(data.createRelation.relation_name);
      setCreatingRelation(false);
    }
  });

  const [deleteRelation] = useMutation(DELETE_RELATION, {
    refetchQueries: [{ query: GET_VEHICLE_RELATIONS, variables: { vehicle_id: parseInt(vehicle_id) } }, { query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }],
    onCompleted: () => {
      setRelationList(prevRelations => prevRelations.filter(relation => relation.relation_id !== relation_id));
      setRelationId(null);
      setRelationName('');
    }
  });

  const [assignScheduleToRelation] = useMutation(ASSIGN_SCHEDULE_TO_RELATION, {
    refetchQueries: [{ query: GET_VEHICLE_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10), relation_id: parseInt(relation_id, 10) } }, { query: GET_UNASSIGNED_SCHEDULES, variables: { vehicle_id: parseInt(vehicle_id, 10) } }],
  });

  useEffect(() => {
    if (relationsData) {
      setRelationList(relationsData.getVehicleRelations);
    }
  }, [relationsData]);

  useEffect(() => {
    if (unassignedData) {
      setUnassignedSchedules(unassignedData.getVehicleSchedules);
    }
  }, [unassignedData]);

  const handleVehicleChange = (e) => {
    setVehicleId(parseInt(e.target.value, 10));
    setRelationId(null);
    setRelationName('');
  };

  const handleNewStopChange = (e) => {
    const value = e.target.value;
    setNewStop(value);

    if (value.length > 0 && allStopsData) {
      const filtered = allStopsData.getAllStops.filter((stop) =>
        stop.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStops(filtered);
    } else {
      setFilteredStops([]);
    }
  };

  const handleEditStopChange = (e) => {
    const value = e.target.value;
    setEditStop(value);

    if (value.length > 0 && allStopsData) {
      const filtered = allStopsData.getAllStops.filter((stop) =>
        stop.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEditStops(filtered);
    } else {
      setFilteredEditStops([]);
    }
  };

  const handleSaveNewStop = async () => {
    if (!newStop || !newArrivalTime || !newDepartureTime) {
      alert('Proszę wprowadzić wszystkie dane przystanku.');
      return;
    }

    try {
      await addSchedule({
        variables: {
          vehicle_id: parseInt(vehicle_id, 10),
          stop: newStop,
          arrival_time: newArrivalTime,
          departure_time: newDepartureTime,
          relation_id: parseInt(relation_id, 10),
        },
      });
      resetNewStopForm();
      setAddingNewStop(false);
      setAddingRowId(null);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas dodawania przystanku.');
    }
  };

  const resetNewStopForm = () => {
    setNewStop('');
    setNewArrivalTime('');
    setNewDepartureTime('');
  };

  const handleCancelNewStop = () => {
    resetNewStopForm();
    setAddingNewStop(false);
    setAddingRowId(null);
  };

  const handleCreateRelation = async () => {
    if (relationName === '') {
      alert('Proszę wprowadzić nazwę relacji!');
      return;
    }
    try {
      await createRelation({
        variables: { vehicle_id: parseInt(vehicle_id, 10), relation_name: relationName }
      });
    } catch (err) {
      console.error(err);
      alert('Błąd tworzenia relacji!');
    }
  };

  const handleDeleteRelation = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć tę relację?')) {
      try {
        await deleteRelation({
          variables: { 
            vehicle_id: parseInt(vehicle_id, 10),  
            relation_id: parseInt(relation_id, 10) 
          }
        });
        setRelationList(prevRelations => prevRelations.filter(relation => relation.relation_id !== relation_id));
        setRelationId(null);
        setRelationName('');
        refetch(); 
        refetchRelations(); 
        refetchUnassigned(); 
        alert('Relacja została usunięta.');
      } catch (err) {
        console.error(err);
        alert('Błąd usuwania relacji!');
      }
    }
  };

  const handleAddNewStopRow = () => {
    setAddingNewStop(true);
    setAddingRowId(Date.now());
  };

  const handleEditSchedule = (schedule) => {
    setEditRowId(schedule.schedule_id);
    setEditStop(schedule.stop);
    setEditArrivalTime(schedule.arrival_time ? schedule.arrival_time.substring(0, 5) : '');
    setEditDepartureTime(schedule.departure_time ? schedule.departure_time.substring(0, 5) : '');
  };

  const handleDeleteSchedule = async (schedule_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten przystanek?')) {
      try {
        await deleteSchedule({ variables: { schedule_id: parseInt(schedule_id, 10) } });
        alert('Przystanek został usunięty.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAllSchedules = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć wszystkie przystanki dla tej relacji?')) {
      try {
        await deleteAllSchedules({ variables: { relation_id: parseInt(relation_id, 10) } });
        alert('Wszystkie przystanki dla tej relacji zostały usunięte.');
      } catch (err) {
        console.error(err);
        alert('Błąd podczas usuwania przystanków.');
      }
    }
  };  

  const handleShowRelationSelect = (scheduleId) => {
    setShowRelationSelect(scheduleId);
  };
  
  const handleAssignToSelectedRelation = async () => {
    if (!selectedRelation) {
      alert('Proszę wybrać relację.');
      return;
    }

    try {
      await assignScheduleToRelation({
        variables: {
          schedule_id: parseInt(showRelationSelect, 10),
          relation_id: parseInt(selectedRelation, 10)
        }
      });
      setShowRelationSelect(null); 
      alert('Przystanek został przypisany do relacji.');
    } catch (err) {
      console.error('Błąd w przypisywaniu:', err);
      alert('Błąd przypisywania przystanku do relacji.');
    }
  };  

  const handleEditOrder = () => {
    setIsEditingOrder(true);
    const initialOrderNumbers = {};
    schedulesData.getVehicleSchedules.forEach(schedule => {
      initialOrderNumbers[schedule.schedule_id] = schedule.order_number;
    });
    setOrderNumbers(initialOrderNumbers);
  };

  const handleOrderChange = (e, scheduleId) => {
    const value = e.target.value;
    if (value > 0 && value <= schedulesData.getVehicleSchedules.length) {
      setOrderNumbers(prev => ({ ...prev, [scheduleId]: parseInt(value) }));
    }
  };

  const handleSaveOrder = async () => {
    try {
      const uniqueOrderNumbers = new Set(Object.values(orderNumbers));
      if (uniqueOrderNumbers.size !== schedulesData.getVehicleSchedules.length) {
        alert('Każda liczba musi być unikalna.');
        return;
      }

      await Promise.all(
        schedulesData.getVehicleSchedules.map(schedule => {
          if (schedule.order_number !== orderNumbers[schedule.schedule_id]) {
            return updateScheduleOrder({
              variables: {
                schedule_id: parseInt(schedule.schedule_id, 10),
                new_order_number: parseInt(orderNumbers[schedule.schedule_id], 10),
              },
            });
          }
          return null;
        })
      );

      setIsEditingOrder(false);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleSaveScheduleEdit = async (schedule_id) => {
    if (!editArrivalTime || !editDepartureTime) {
      alert('Proszę wprowadzić zarówno godzinę przyjazdu, jak i odjazdu.');
      return;
    }

    try {
      await updateSchedule({
        variables: {
          schedule_id: parseInt(schedule_id, 10),
          stop: editStop,
          arrival_time: editArrivalTime,
          departure_time: editDepartureTime,
        },
      });
    } catch (err) {
      console.error(err);
      setEditErrorMessage('Błąd edycji przystanku!');
    }
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditStop('');
    setEditArrivalTime('');
    setEditDepartureTime('');
    setEditErrorMessage('');
  };

  const handleScheduleShow = () => setShowSchedule(true);
  const handleScheduleClose = () => setShowSchedule(false);

  const findDuplicates = (arr) => {
    const seen = new Set();
    const duplicates = new Set();
    arr.forEach((item) => {
      if (seen.has(item)) {
        duplicates.add(item);
      }
      seen.add(item);
    });
    return duplicates;
  };

  const handleShowUnassignedSchedules = () => {
    setShowUnassignedSchedules(true);
  };

  return (
    <Container>
      <FormCardStyled>
        <h2>Rozkład jazdy</h2>
        {vehiclesLoading && <p>Loading vehicles...</p>}
        {vehiclesError && <p>Error loading vehicles: {vehiclesError.message}</p>}
        {vehiclesData && (
          <Form.Group controlId="formVehicleSelect">
            <LabelStyled>Wybierz pojazd</LabelStyled>
            <StyledSelect value={vehicle_id} onChange={handleVehicleChange} required>
              <option value="">Wybierz pojazd</option>
              {vehiclesData.getUserVehicles.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.model} - {vehicle.registration_number}
                </option>
              ))}
            </StyledSelect>
          </Form.Group>
        )}
        {vehicle_id && (
          <>
            <FormRowStyled>
              <Button variant="primary" onClick={() => setCreatingRelation(true)}>
                Utwórz nową relację
              </Button>
              <Button variant="primary" onClick={handleShowUnassignedSchedules}>
                Nieprzypisane przystanki
              </Button>
            </FormRowStyled>
            <div style={{ marginTop: '10px' }}> {/* Dodanie odstępu */}
              {relationList.map((relation) => (
                <div key={relation.relation_id} style={{ marginBottom: '5px' }}> {/* Dodanie odstępu */}
                  <Button
                    variant={relation_id === relation.relation_id ? "outline-primary" : "link"}
                    onClick={() => {
                      setRelationId(relation.relation_id);
                      setRelationName(relation.relation_name);
                    }}
                  >
                    {relation.relation_name}
                  </Button>
                </div>
              ))}
            </div>
            {creatingRelation && (
              <Form className="mt-3">
                <Form.Group controlId="formRelationName">
                  <LabelStyled>Nazwa relacji</LabelStyled>
                  <FormControlStyled
                    type="text"
                    value={relationName}
                    onChange={(e) => setRelationName(e.target.value)}
                    placeholder="Wprowadź nazwę relacji"
                    required
                  />
                </Form.Group>
                <StyledButton variant="primary" onClick={handleCreateRelation}>
                  Zapisz
                </StyledButton>
                <StyledButton variant="secondary" onClick={() => setCreatingRelation(false)}>
                  Anuluj
                </StyledButton>
              </Form>
            )}
            {relation_id && (
              <>
                <OffcanvasStyledButton variant="info" style={{ color: '#ffffff' }} onClick={handleScheduleShow}>
                  Aktualny rozkład jazdy
                </OffcanvasStyledButton>
                <OffcanvasStyledButton variant="danger" onClick={handleDeleteRelation} className="mt-2">
                  Usuń relację
                </OffcanvasStyledButton>
                <CancelRelationButton onClick={() => setRelationId(null)}>
                  Anuluj
                </CancelRelationButton>
              </>
            )}
          </>
        )}
      </FormCardStyled>

      <OffcanvasStyled show={showSchedule} onHide={handleScheduleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Rozkład jazdy dla relacji: {relationName}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {schedulesLoading && <p>Loading schedules...</p>}
          {schedulesError && <p>Error loading schedules: {schedulesError.message}</p>}

          {schedulesData && schedulesData.getVehicleSchedules.length === 0 && !addingNewStop && (
            <>
              <p>Brak rozkładu jazdy.</p>
              {!isEditingOrder && (
                <OffcanvasStyledButton variant="success" onClick={handleAddNewStopRow} className="mt-2">
                  Dodaj przystanek
                </OffcanvasStyledButton>
              )}
            </>
          )}

          {schedulesData && (schedulesData.getVehicleSchedules.length > 0 || addingNewStop) && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Lp.</th>
                  <th>Godzina przyjazdu</th>
                  <th>Godzina odjazdu</th>
                  <th>Nazwa przystanku</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {schedulesData.getVehicleSchedules
                  .slice()
                  .sort((a, b) => a.order_number - b.order_number)
                  .map((schedule) => (
                    <tr key={schedule.schedule_id}>
                      <td>
                        {isEditingOrder ? (
                          <OrderNumberInput
                            type="number"
                            value={orderNumbers[schedule.schedule_id] || ''}
                            onChange={(e) => handleOrderChange(e, schedule.schedule_id)}
                            min="1"
                            max={schedulesData.getVehicleSchedules.length}
                            hasDuplicate={findDuplicates(Object.values(orderNumbers)).has(orderNumbers[schedule.schedule_id])}
                          />
                        ) : (
                          schedule.order_number
                        )}
                      </td>
                      {editRowId === schedule.schedule_id ? (
                        <>
                          <td>
                            <Form.Control
                              type="time"
                              value={editArrivalTime}
                              onChange={(e) => setEditArrivalTime(e.target.value)}
                              placeholder="hh:mm"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              value={editDepartureTime}
                              onChange={(e) => setEditDepartureTime(e.target.value)}
                              placeholder="hh:mm"
                            />
                          </td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                value={editStop}
                                onChange={handleEditStopChange}
                              />
                              {filteredEditStops.length > 0 && (
                                <div className="autocomplete-dropdown">
                                  {filteredEditStops.map((stop) => (
                                    <div
                                      key={stop}
                                      onClick={() => {
                                        setEditStop(stop);
                                        setFilteredEditStops([]);
                                      }}
                                      className="autocomplete-item"
                                    >
                                      {stop}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Form.Group>
                          </td>
                          <td>
                            <ButtonGroupStyled>
                              <SaveButton onClick={() => handleSaveScheduleEdit(schedule.schedule_id)}>
                                Zapisz
                              </SaveButton>
                              <CancelButton onClick={handleCancelEdit}>
                                Anuluj
                              </CancelButton>
                            </ButtonGroupStyled>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{new Date(schedule.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{new Date(schedule.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{schedule.stop}</td>
                          <td>
                            <ButtonGroupStyled>
                              <EditButton onClick={() => handleEditSchedule(schedule)}>
                                Edytuj
                              </EditButton>
                              <DeleteButton onClick={() => handleDeleteSchedule(schedule.schedule_id)}>
                                Usuń
                              </DeleteButton>
                            </ButtonGroupStyled>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                
                {addingNewStop && (
                  <tr key={addingRowId}>
                    <td>{schedulesData.getVehicleSchedules.length + 1}</td>
                    <td>
                      <Form.Control
                        type="time"
                        value={newArrivalTime}
                        onChange={(e) => setNewArrivalTime(e.target.value)}
                        placeholder="hh:mm"
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="time"
                        value={newDepartureTime}
                        onChange={(e) => setNewDepartureTime(e.target.value)}
                        placeholder="hh:mm"
                      />
                    </td>
                    <td>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          value={newStop}
                          onChange={handleNewStopChange}
                          placeholder="Nazwa przystanku"
                        />
                        {filteredStops.length > 0 && (
                          <div className="autocomplete-dropdown">
                            {filteredStops.map((stop) => (
                              <div
                                key={stop}
                                onClick={() => {
                                  setNewStop(stop);
                                  setFilteredStops([]);
                                }}
                                className="autocomplete-item"
                              >
                                {stop}
                              </div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </td>
                    <td>
                      <ButtonGroupStyled>
                        <SaveButton onClick={handleSaveNewStop}>
                          Zapisz
                        </SaveButton>
                        <CancelButton onClick={handleCancelNewStop}>
                          Anuluj
                        </CancelButton>
                      </ButtonGroupStyled>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          {(!addingNewStop && !isEditingOrder && schedulesData && schedulesData.getVehicleSchedules.length > 0) && (
            <OffcanvasStyledButton variant="success" onClick={handleAddNewStopRow} className="mt-2">
              Dodaj przystanek
            </OffcanvasStyledButton>
          )}

          {editErrorMessage && (
            <Alert variant="danger" className="mt-3">
              {editErrorMessage}
            </Alert>
          )}

          {schedulesData && schedulesData.getVehicleSchedules.length > 1 && (
            <CenteredButtonContainer>
              {isEditingOrder ? (
                <>
                  <StyledButton variant="success" onClick={handleSaveOrder} style={{ width: '400px' }}>
                    Zapisz kolejność
                  </StyledButton>
                  <StyledButton variant="secondary" onClick={() => setIsEditingOrder(false)} style={{ width: '400px', marginTop: '10px' }}>
                    Anuluj
                  </StyledButton>
                </>
              ) : (
                <>
                  <ChangeOrderButton onClick={handleEditOrder} className="mt-3">
                    Zmień kolejność
                  </ChangeOrderButton>
                  <OffcanvasStyledButton variant="danger" onClick={handleDeleteAllSchedules} className="mt-2">
                    Usuń wszystkie przystanki
                  </OffcanvasStyledButton>
                </>
              )}
            </CenteredButtonContainer>
          )}
        </Offcanvas.Body>
      </OffcanvasStyled>

      {/* Modal or Offcanvas for unassigned schedules */}
      {showUnassignedSchedules && (
        <OffcanvasStyled show={showUnassignedSchedules} onHide={() => setShowUnassignedSchedules(false)} placement="end">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Nieprzypisane przystanki</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {unassignedSchedules.length === 0 ? (
              <p>Brak nieprzypisanych przystanków.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Stop</th>
                    <th>Arrival Time</th>
                    <th>Departure Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedSchedules.map((schedule) => (
                    <tr key={schedule.schedule_id}>
                      <td>{schedule.stop}</td>
                      <td>{new Date(schedule.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{new Date(schedule.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        {showRelationSelect === schedule.schedule_id ? (
                          <>
                            <Form.Select value={selectedRelation} onChange={(e) => setSelectedRelation(e.target.value)}>
                              <option value="">Wybierz relację</option>
                              {relationList.map(relation => (
                                <option key={relation.relation_id} value={relation.relation_id}>
                                  {relation.relation_name}
                                </option>
                              ))}
                            </Form.Select>
                            <ButtonGroupStyled>
                              <SaveButton onClick={handleAssignToSelectedRelation}>
                                Przypisz
                              </SaveButton>
                              <CancelButton onClick={() => setShowRelationSelect(null)}>
                                Anuluj
                              </CancelButton>
                            </ButtonGroupStyled>
                          </>
                        ) : (
                          <ButtonGroupStyled>
                            <Button variant="primary" onClick={() => handleShowRelationSelect(schedule.schedule_id)}>
                              Przypisz do relacji
                            </Button>
                            <DeleteButton onClick={() => handleDeleteSchedule(schedule.schedule_id)}>
                              Usuń
                            </DeleteButton>
                          </ButtonGroupStyled>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Offcanvas.Body>
        </OffcanvasStyled>
      )}
    </Container>
  );
};

export default Schedule;
