import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Button, Form, Card, Offcanvas, Modal } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styled, { createGlobalStyle } from 'styled-components';

// Zapytania i mutacje GraphQL
const GET_CARRIER_ORDERS = gql`
  query GetCarrierOrders($owner_id: Int!) {
    getCarrierOrders(owner_id: $owner_id) {
      order_id
      order_code
      status
      size
      created_at
      deleted_by_carrier
      user {
        first_name
        last_name
        phone_number
      }
      start_stop
      end_stop
      departure_time
      arrival_time
      driver {
        first_name
        last_name
        driver_id
      }
      status_history {
        status
        changed_at
      }
    }
  }
`;

const GET_CARRIER_DRIVERS = gql`
  query GetCarrierDrivers($owner_id: Int!) {
    getCarrierDrivers(owner_id: $owner_id) {
      driver_id
      first_name
      last_name
    }
  }
`;

const ASSIGN_DRIVER_TO_ORDER = gql`
  mutation AssignDriverToOrder($order_id: ID!, $driver_id: ID!) {
    assignDriverToOrder(order_id: $order_id, driver_id: $driver_id) {
      order_id
      driver {
        first_name
        last_name
      }
    }
  }
`;

const REMOVE_ORDER_FROM_CARRIER_HISTORY = gql`
  mutation RemoveOrderFromCarrierHistory($order_id: Int!, $carrier_id: Int!) {
    removeOrderFromCarrierHistory(order_id: $order_id, carrier_id: $carrier_id)
  }
`;

const ADD_SHIPMENT_PROBLEM = gql`
  mutation AddShipmentProblem($order_id: Int!, $user_id: Int!, $description: String!) {
    addShipmentProblem(order_id: $order_id, user_id: $user_id, description: $description) {
      problem_id
      status
    }
  }
`;

// Globalne style dla tabeli
const GlobalStyles = createGlobalStyle`
  td {
    vertical-align: middle !important;
    text-align: center !important;
  }
`;

// Komponenty stylowane
const OrdersCardStyled = styled(Card)`
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const HistoryButton = styled(Button)`
  margin-top: 10px;
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 5px;
  justify-content: center;
`;

const ActionButton = styled(Button)`
  width: 110px;
  height: 40px;
`;

const AssignButton = styled(ActionButton)`
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

const ChangeDriverButton = styled(ActionButton)`
  background-color: #007bff;
  border: none;
  color: #ffffff;
  &:hover {
    background-color: #0056b3;
  }
  white-space: nowrap;
  font-size: 0.75rem;
  padding: 5px 5px;
`;

const DeleteButton = styled(ActionButton)`
  background-color: #dc3545;
  border: none;
  &:hover {
    background-color: #c82333;
  }
`;

const ReportProblemButton = styled(ActionButton)`
  background-color: #ffc107;
  border: none;
  &:hover {
    background-color: #e0a800;
  }
`;

const CenteredTableCell = styled.td`
  vertical-align: middle !important;
  text-align: center !important;
`;

const OffcanvasStyled = styled(Offcanvas)`
  width: 500px !important;
`;

const Orders = () => {
  const owner_id = parseInt(localStorage.getItem('user_id'));

  const { data: orderData, loading: orderLoading, error: orderError, refetch: refetchOrders } = useQuery(GET_CARRIER_ORDERS, { variables: { owner_id } });
  const { data: driverData, loading: driverLoading, error: driverError, refetch: refetchDrivers } = useQuery(GET_CARRIER_DRIVERS, { variables: { owner_id } });

  const [assignDriverToOrder] = useMutation(ASSIGN_DRIVER_TO_ORDER, {
    refetchQueries: [{ query: GET_CARRIER_ORDERS, variables: { owner_id } }, { query: GET_CARRIER_DRIVERS, variables: { owner_id } }],
  });

  const [removeOrderFromCarrierHistory] = useMutation(REMOVE_ORDER_FROM_CARRIER_HISTORY, {
    refetchQueries: [{ query: GET_CARRIER_ORDERS, variables: { owner_id } }],
  });

  const [addShipmentProblem] = useMutation(ADD_SHIPMENT_PROBLEM, {
    refetchQueries: [{ query: GET_CARRIER_ORDERS, variables: { owner_id } }],
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");

  if (orderLoading || driverLoading) return <p>Loading...</p>;
  if (orderError) return <p>Error loading orders: {orderError.message}</p>;
  if (driverError) return <p>Error loading drivers: {driverError.message}</p>;

  const handleAssignDriver = async () => {
    try {
      await assignDriverToOrder({ variables: { order_id: editingOrderId, driver_id: selectedDriver } });
      alert('Kierowca przypisany');
      setEditingOrderId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDriverChange = (event) => {
    setSelectedDriver(event.target.value);
  };

  const handleEditDriver = (order) => {
    if (order.status !== 'Interwencja') {
      setEditingOrderId(order.order_id);
      setSelectedDriver(order.driver ? order.driver.driver_id : '');
    } else {
      alert('Nie można zmienić kierowcy, gdy status przesyłki to "Interwencja".');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setSelectedDriver('');
  };

  const handleDeleteOrder = async (order_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę przesyłkę z historii?')) {
      try {
        await removeOrderFromCarrierHistory({
          variables: {
            order_id: parseInt(order_id, 10),
            carrier_id: owner_id
          }
        });
        alert('Przesyłka została usunięta z historii.');
      } catch (error) {
        console.error('Error deleting shipment from history:', error);
      }
    }
  };

  const handleAddProblem = async () => {
    if (selectedOrder) {
      try {
        await addShipmentProblem({
          variables: {
            order_id: parseInt(selectedOrder.order_id, 10),
            user_id: owner_id,
            description: problemDescription
          }
        });
        alert('Problem został zgłoszony.');
        handleCloseModal();
      } catch (error) {
        console.error('Error zgłaszania problemu:', error);
      }
    }
  };

  const handleShowModal = (order) => {
    if (order.status !== 'Interwencja') {
      setSelectedOrder(order);
      setShowModal(true);
    } else {
      alert('Nie można zgłosić problemu, gdy status przesyłki to "Interwencja".');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProblemDescription("");
  };

  const handleDetailsClick = (order_id) => {
    const isRowCurrentlyExpanded = expandedRows.includes(order_id);
    const newExpandedRows = isRowCurrentlyExpanded
      ? expandedRows.filter(id => id !== order_id)
      : [...expandedRows, order_id];
    setExpandedRows(newExpandedRows);
  };

  const handleToggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);

  return (
    <OrdersCardStyled>
      <GlobalStyles />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Zamówienia</h2>
        <HistoryButton variant="primary" onClick={handleToggleOffcanvas}>
          Historia
        </HistoryButton>
      </div>

      <OffcanvasStyled show={showOffcanvas} onHide={handleToggleOffcanvas} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Historia Przesyłek</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Nr Przesyłki</th>
                <th>Status</th>
                <th>Akcje</th>
                <th>Szczegóły</th>
              </tr>
            </thead>
            <tbody>
              {orderData.getCarrierOrders
                .filter(order => order.status === 'Dostarczona' && order.deleted_by_carrier !== 1)
                .map((order) => (
                  <React.Fragment key={order.order_id}>
                    <tr>
                      <CenteredTableCell>{order.order_code}</CenteredTableCell>
                      <CenteredTableCell>{order.status}</CenteredTableCell>
                      <CenteredTableCell>
                        <ButtonGroup>
                          <DeleteButton onClick={() => handleDeleteOrder(order.order_id)}>
                            Usuń
                          </DeleteButton>
                        </ButtonGroup>
                      </CenteredTableCell>
                      <CenteredTableCell>
                        <Button variant="link" onClick={() => handleDetailsClick(order.order_id)}>
                          {expandedRows.includes(order.order_id) ? <FaChevronUp /> : <FaChevronDown />}
                        </Button>
                      </CenteredTableCell>
                    </tr>
                    {expandedRows.includes(order.order_id) && (
                      <tr>
                        <td colSpan="4">
                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Data zmiany</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.status_history.map((status, index) => (
                                <tr key={index}>
                                  <td>{status.status}</td>
                                  <td>{new Date(status.changed_at).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </Table>
        </Offcanvas.Body>
      </OffcanvasStyled>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Zgłoś Problem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Opis problemu:</Form.Label>
            <Form.Control as="textarea" rows={3} value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Anuluj
          </Button>
          <Button variant="primary" onClick={handleAddProblem}>
            Zgłoś
          </Button>
        </Modal.Footer>
      </Modal>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nr Przesyłki</th>
            <th>Status</th>
            <th>Rozmiar</th>
            <th>Nadawca</th>
            <th>Telefon kontaktowy</th>
            <th>Data utworzenia</th>
            <th>Start</th>
            <th>Cel</th>
            <th>Kierowca</th>
            <th>Akcje</th>
            <th>Rozwiń</th>
          </tr>
        </thead>
        <tbody>
          {orderData.getCarrierOrders
            .filter(order => order.status !== 'Dostarczona' && order.deleted_by_carrier !== 1)
            .slice()
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((order) => (
              <React.Fragment key={order.order_id}>
                <tr>
                  <td>{order.order_code}</td>
                  <td>{order.status}</td>
                  <td>{order.size}</td>
                  <td>{`${order.user.first_name} ${order.user.last_name}`}</td>
                  <td>{order.user.phone_number || 'Brak numeru'}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{`${order.start_stop} ${new Date(order.departure_time).toLocaleTimeString()}`}</td>
                  <td>{`${order.end_stop} ${new Date(order.arrival_time).toLocaleTimeString()}`}</td>
                  <td>
                    {editingOrderId === order.order_id ? (
                      <Form.Control as="select" value={selectedDriver} onChange={handleDriverChange}>
                        <option value="">Wybierz...</option>
                        {driverData.getCarrierDrivers.map((driver) => (
                          <option key={driver.driver_id} value={driver.driver_id}>
                            {`${driver.first_name} ${driver.last_name}`}
                          </option>
                        ))}
                      </Form.Control>
                    ) : (
                      order.driver ? `${order.driver.first_name} ${order.driver.last_name}` : 'Nie przypisano'
                    )}
                  </td>
                  <td>
                    {editingOrderId === order.order_id ? (
                      <ButtonGroup>
                        <AssignButton onClick={handleAssignDriver}>
                          Zapisz
                        </AssignButton>
                        <CancelButton onClick={handleCancelEdit}>
                          Anuluj
                        </CancelButton>
                      </ButtonGroup>
                    ) : (
                      <ButtonGroup>
                        <ChangeDriverButton onClick={() => handleEditDriver(order)} disabled={order.status === 'Interwencja'}>
                          {order.driver ? 'Zmień Kierowcę' : 'Przypisz Kierowcę'}
                        </ChangeDriverButton>
                        <ReportProblemButton onClick={() => handleShowModal(order)} disabled={order.status === 'Interwencja'}>
                          Zgłoś
                        </ReportProblemButton>
                      </ButtonGroup>
                    )}
                  </td>
                  <CenteredTableCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleDetailsClick(order.order_id)}
                  >
                    {expandedRows.includes(order.order_id) ? <FaChevronUp /> : <FaChevronDown />}
                  </CenteredTableCell>
                </tr>
                {expandedRows.includes(order.order_id) && (
                  <tr className="expandable-row">
                    <td colSpan="10">
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Data zmiany</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.status_history.map((status, index) => (
                            <tr key={index}>
                              <td>{status.status}</td>
                              <td>{new Date(status.changed_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
        </tbody>
      </Table>
    </OrdersCardStyled>
  );
};

export default Orders;
