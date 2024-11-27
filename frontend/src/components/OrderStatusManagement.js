import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Form, Card, Button, Alert } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_ALL_ORDERS = gql`
  query GetAllOrders {
  getAllOrders {
    order_id
    order_code
    status
    pickup_code
    delivery_code
    deleted_by_user
    deleted_by_carrier
    user {
      first_name
      last_name
      email
    }
    relation {
      vehicle {
        owner {
          email
        }
      }
    }
  }
}
`;

const UPDATE_ORDER_DETAILS = gql`
  mutation UpdateOrderDetails(
    $order_id: ID!,
    $pickup_code: String!,
    $delivery_code: String!,
    $deleted_by_user: Boolean!,
    $deleted_by_carrier: Boolean!,
    $status: String!
  ) {
    updateOrderDetails(
      order_id: $order_id,
      pickup_code: $pickup_code,
      delivery_code: $delivery_code,
      deleted_by_user: $deleted_by_user,
      deleted_by_carrier: $deleted_by_carrier,
      status: $status
    ) {
      order_id
      order_code
      status
      pickup_code
      delivery_code
      deleted_by_user
      deleted_by_carrier
    }
  }
`;

// Nowa mutacja do usuwania zamówień
const DELETE_ORDER = gql`
  mutation DeleteOrder($order_id: Int!) {
    deleteShipmentHistory(order_id: $order_id)
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
`;

const ActionHeader = styled.th`
  position: sticky;
  right: 0;
  background-color: #f8f9fa;
  z-index: 1;
`;

const StatusColumn = styled.td`
  width: 150px;
`;

const OrderStatusManagement = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_ORDERS);
  const [updateOrderDetails] = useMutation(UPDATE_ORDER_DETAILS, {
    refetchQueries: [{ query: GET_ALL_ORDERS }],
    onCompleted: () => {
      alert('Zamówienie zostało zaktualizowane');
    },
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd przy aktualizacji zamówienia');
    }
  });

  const [deleteOrder] = useMutation(DELETE_ORDER, {
    refetchQueries: [{ query: GET_ALL_ORDERS }],
    onCompleted: () => {
      alert('Zamówienie zostało usunięte');
    },
    onError: (err) => {
      console.error(err);
      alert('Wystąpił błąd przy usuwaniu zamówienia');
    }
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [deletedByUser, setDeletedByUser] = useState(false);
  const [deletedByCarrier, setDeletedByCarrier] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setStatus(selectedOrder.status);
      setPickupCode(selectedOrder.pickup_code);
      setDeliveryCode(selectedOrder.delivery_code);
      setDeletedByUser(selectedOrder.deleted_by_user);
      setDeletedByCarrier(selectedOrder.deleted_by_carrier);
    }
  }, [selectedOrder]);

  const handleChange = (e) => {
    setStatus(e.target.value);
  };

  const handleUpdate = async () => {
    try {
      await updateOrderDetails({
        variables: {
          order_id: selectedOrder.order_id,
          pickup_code: pickupCode,
          delivery_code: deliveryCode,
          deleted_by_user: deletedByUser,
          deleted_by_carrier: deletedByCarrier,
          status: status
        },
      });
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setSelectedOrder(null);
  };

  const handleDelete = async (order_id) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zamówienie?')) {
      try {
        await deleteOrder({
          variables: { order_id: parseInt(order_id, 10) },
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <Alert variant="danger">Error loading orders: {error.message}</Alert>;

  return (
    <TableCardStyled>
      <h2>Zarządzanie szczegółami zamówień</h2>
      <div style={{ overflowX: 'auto' }}>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nr zamówienia</th>
              <th>Imię i nazwisko klienta</th>
              <th>E-mail klienta</th>
              <th>E-mail przewoźnika</th>
              <th>Status</th>
              <th>Kod Nadania</th>
              <th>Kod Odbioru</th>
              <th>Usunięta przez użytkownika</th>
              <th>Usunięta przez przewoźnika</th>
              <ActionHeader>Akcje</ActionHeader>
            </tr>
          </thead>
          <tbody>
            {data.getAllOrders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_code}</td>
                <td>{`${order.user.first_name} ${order.user.last_name}`}</td>
                <td>{order.user.email}</td>
                <td>{order.relation?.vehicle?.owner?.email || 'Brak'}</td>
                {selectedOrder && selectedOrder.order_id === order.order_id ? (
                  <>
                    <StatusColumn>
                      <Form.Control
                        as="select"
                        value={status}
                        onChange={handleChange}
                      >
                        <option value="Nadana">Nadana</option>
                        <option value="Przypisano kierowcę">Przypisano kierowcę</option>
                        <option value="Przyjęta od klienta">Przyjęta od klienta</option>
                        <option value="Dostarczona">Dostarczona</option>
                        <option value="Interwencja">Interwencja</option>
                      </Form.Control>
                    </StatusColumn>
                    <td>
                      <Form.Control
                        type="text"
                        value={pickupCode}
                        onChange={(e) => setPickupCode(e.target.value)}
                        maxLength={4}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        value={deliveryCode}
                        onChange={(e) => setDeliveryCode(e.target.value)}
                        maxLength={4}
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={deletedByUser}
                        onChange={(e) => setDeletedByUser(e.target.checked)}
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={deletedByCarrier}
                        onChange={(e) => setDeletedByCarrier(e.target.checked)}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <StatusColumn>{order.status}</StatusColumn>
                    <td>{order.pickup_code}</td>
                    <td>{order.delivery_code}</td>
                    <td>{order.deleted_by_user ? 'Tak' : 'Nie'}</td>
                    <td>{order.deleted_by_carrier ? 'Tak' : 'Nie'}</td>
                  </>
                )}
                <ActionColumn>
                  <ButtonGroup>
                    {selectedOrder && selectedOrder.order_id === order.order_id ? (
                      <>
                        <SaveButton onClick={handleUpdate}>Zapisz</SaveButton>
                        <CancelButton onClick={handleCancel}>Anuluj</CancelButton>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => setSelectedOrder(order)}>Edytuj</EditButton>
                        <DeleteButton onClick={() => handleDelete(order.order_id)}>Usuń</DeleteButton>
                      </>
                    )}
                  </ButtonGroup>
                </ActionColumn>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </TableCardStyled>
  );
};

export default OrderStatusManagement;
