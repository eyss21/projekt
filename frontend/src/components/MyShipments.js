import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Alert, Button, Form, Modal, Offcanvas } from 'react-bootstrap';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const GET_USER_ORDERS = gql`
  query GetUserOrders($user_id: Int!) {
    getUserOrders(user_id: $user_id) {
      order_id
      order_code
      status
      size
      created_at
      start_stop
      end_stop
      departure_time
      arrival_time
      pickup_code
      delivery_code
      driver {
        first_name
        last_name
      }
      relation {
        vehicle {
          model
          registration_number
        }
      }
      status_history {
        status
        changed_at
      }
    }
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

const REMOVE_ORDER_FROM_USER_HISTORY = gql`
  mutation RemoveOrderFromUserHistory($order_id: Int!, $user_id: Int!) {
    removeOrderFromUserHistory(order_id: $order_id, user_id: $user_id)
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OffcanvasStyled = styled(Offcanvas)`
  width: 600px !important;
`;

const HistoryButton = styled(Button)`
  margin-left: auto;
`;

const ActionButton = styled(Button)`
  width: 100px;
  height: 40px;
`;

const ReportProblemButton = styled(ActionButton)`
  background-color: #ffc107;
  border: none;
  color: #ffffff;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const CenteredTableCell = styled.td`
  vertical-align: middle !important;
  text-align: center;
`;

const ClickableRow = styled.tr`
  cursor: pointer;
`;

const MyShipments = () => {
  const user_id = parseInt(localStorage.getItem('user_id'));
  const { data, loading, error, refetch } = useQuery(GET_USER_ORDERS, { variables: { user_id } });
  const [addShipmentProblem] = useMutation(ADD_SHIPMENT_PROBLEM, {
    refetchQueries: [{ query: GET_USER_ORDERS, variables: { user_id } }],
  });
  const [removeOrderFromUserHistory] = useMutation(REMOVE_ORDER_FROM_USER_HISTORY, {
    refetchQueries: [{ query: GET_USER_ORDERS, variables: { user_id } }],
  });

  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [problemDescription, setProblemDescription] = useState("");

  const handleToggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);

  const handleShowModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProblemDescription("");
  };

  const handleAddProblem = async () => {
    if (selectedOrder) {
      try {
        await addShipmentProblem({
          variables: {
            order_id: parseInt(selectedOrder.order_id, 10),
            user_id: user_id,
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

  const handleDeleteHistory = async (order_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę przesyłkę z historii?')) {
      try {
        await removeOrderFromUserHistory({ variables: { order_id: parseInt(order_id, 10), user_id } });
        alert('Przesyłka została usunięta z historii.');
      } catch (error) {
        console.error('Error usuwania z historii:', error);
      }
    }
  };

  const handleDetailsClick = (order_id) => {
    const isRowCurrentlyExpanded = expandedRows.includes(order_id);
    const newExpandedRows = isRowCurrentlyExpanded
      ? expandedRows.filter(id => id !== order_id)
      : [...expandedRows, order_id];
    setExpandedRows(newExpandedRows);
  };

  useEffect(() => {
    refetch();
  }, [data, refetch]);

  if (loading) return <p>Loading...</p>;
  if (error) return <Alert variant="danger">Error loading shipments: {error.message}</Alert>;

  return (
    <Container>
      <HeaderContainer>
        <h2>Moje Przesyłki</h2>
        <HistoryButton variant="primary" onClick={handleToggleOffcanvas}>
          Historia
        </HistoryButton>
      </HeaderContainer>

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
              {data.getUserOrders
                .filter(order => order.status === 'Dostarczona')
                .map(order => (
                  <React.Fragment key={order.order_id}>
                    <tr>
                      <CenteredTableCell>{order.order_code}</CenteredTableCell>
                      <CenteredTableCell>{order.status}</CenteredTableCell>
                      <CenteredTableCell>
                        <ButtonGroup>
                          <ReportProblemButton onClick={() => handleShowModal(order)}>
                            Zgłoś
                          </ReportProblemButton>
                          <DeleteButton onClick={() => handleDeleteHistory(order.order_id)}>
                            Usuń
                          </DeleteButton>
                        </ButtonGroup>
                      </CenteredTableCell>
                      <CenteredTableCell
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => handleDetailsClick(order.order_id)}
                      >
                        {expandedRows.includes(order.order_id) ? <FaChevronUp /> : <FaChevronDown />}
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

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nr Przesyłki</th>
            <th>Status</th>
            <th>Rozmiar Paczki</th>
            <th>Punkt Początkowy i Godzina</th>
            <th>Punkt Docelowy i Godzina</th>
            <th>Kod Nadania</th>
            <th>Kod Odbioru</th>
            <th>Kierowca</th>
            <th>Model (Numer Rejestracyjny)</th>
            <th>Szczegóły</th>
          </tr>
        </thead>
        <tbody>
          {data.getUserOrders
            .filter(order => order.status !== 'Dostarczona')
            .map((order) => (
              <React.Fragment key={order.order_id}>
                <tr>
                  <td>{order.order_code}</td>
                  <td>{order.status}</td>
                  <td>{order.size}</td>
                  <td>{`${order.start_stop} ${new Date(order.departure_time).toLocaleTimeString()}`}</td>
                  <td>{`${order.end_stop} ${new Date(order.arrival_time).toLocaleTimeString()}`}</td>
                  <td>{order.pickup_code}</td>
                  <td>{order.delivery_code}</td>
                  <td>{order.driver ? `${order.driver.first_name} ${order.driver.last_name}` : 'Nie przypisano'}</td>
                  <td>{order.relation?.vehicle ? `${order.relation.vehicle.model} (${order.relation.vehicle.registration_number})` : 'Brak danych'}</td>
                  <td
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDetailsClick(order.order_id)}
                  >
                    {expandedRows.includes(order.order_id) ? <FaChevronUp /> : <FaChevronDown />}
                  </td>
                </tr>
                {expandedRows.includes(order.order_id) && (
                  <tr>
                    <td colSpan="9">
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

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Zgłoś Problem z Przesyłką</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="problemDescription">
              <Form.Label>Opis Problemu</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Zamknij
          </Button>
          <Button variant="primary" onClick={handleAddProblem}>
            Zgłoś Problem
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyShipments;
