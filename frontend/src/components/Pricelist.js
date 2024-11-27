import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Table, Button, Form, Card } from 'react-bootstrap';
import styled from 'styled-components';

// GraphQL Queries i Mutacje
const GET_USER_RELATIONS = gql`
  query GetUserRelations($owner_id: Int!) {
    getUserRelations(owner_id: $owner_id) {
      relation_id
      relation_name
    }
  }
`;

const GET_PRICE_LIST = gql`
  query GetPriceList($relation_id: ID!) {
    getPriceList(relation_id: $relation_id) {
      base_price
      price_per_stop
    }
  }
`;

const CREATE_OR_UPDATE_PRICE_LIST = gql`
  mutation CreateOrUpdatePriceList($relation_id: ID!, $base_price: Float!, $price_per_stop: Float!) {
    createOrUpdatePriceList(relation_id: $relation_id, base_price: $base_price, price_per_stop: $price_per_stop) {
      base_price
      price_per_stop
    }
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

const Pricelist = () => {
  const [owner_id] = useState(parseInt(localStorage.getItem('user_id')));
  const { data: relationsData, loading: relationsLoading, error: relationsError, refetch: refetchRelations } = useQuery(GET_USER_RELATIONS, { variables: { owner_id } });

  const [editRelation, setEditRelation] = useState(null);
  const [priceList, setPriceList] = useState({});
  const [initialPriceList, setInitialPriceList] = useState({}); // Store initial price list for reset
  
  const [createOrUpdatePriceList] = useMutation(CREATE_OR_UPDATE_PRICE_LIST, {
    onCompleted: () => {
      refetchRelations(); // Refetch relations after saving the price
      setEditRelation(null);
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const { refetch: refetchPriceList } = useQuery(GET_PRICE_LIST, {
    skip: true, // Skip initial fetch, we will fetch manually for each relation
  });

  useEffect(() => {
    if (relationsData?.getUserRelations) {
      relationsData.getUserRelations.forEach(async (relation) => {
        const prices = await fetchPriceList(relation.relation_id);
        setPriceList((prev) => ({
          ...prev,
          [relation.relation_id]: prices,
        }));
        setInitialPriceList((prev) => ({
          ...prev,
          [relation.relation_id]: prices, // Store the initial price for reset purposes
        }));
      });
    }
  }, [relationsData]);

  // Function to fetch price list data for each relation
  const fetchPriceList = async (relationId) => {
    const { data } = await refetchPriceList({ relation_id: relationId });
    return data?.getPriceList || { base_price: '', price_per_stop: '' };
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    try {
      await createOrUpdatePriceList({
        variables: {
          relation_id: editRelation.relation_id,
          base_price: parseFloat(priceList[editRelation.relation_id]?.base_price || 0),
          price_per_stop: parseFloat(priceList[editRelation.relation_id]?.price_per_stop || 0),
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPriceChange = (field, value) => {
    // Allow user to input the price
    setPriceList((prev) => ({
      ...prev,
      [editRelation.relation_id]: {
        ...prev[editRelation.relation_id],
        [field]: value,
      },
    }));
  };

  const handleBlur = (field) => {
    // Format the price to 2 decimal places only after editing
    setPriceList((prev) => ({
      ...prev,
      [editRelation.relation_id]: {
        ...prev[editRelation.relation_id],
        [field]: parseFloat(prev[editRelation.relation_id][field] || 0).toFixed(2),
      },
    }));
  };

  const handleCancelEdit = () => {
    setPriceList((prev) => ({
      ...prev,
      [editRelation.relation_id]: initialPriceList[editRelation.relation_id] // Reset to initial prices
    }));
    setEditRelation(null);
  };

  if (relationsLoading) return <p>Loading relations...</p>;
  if (relationsError) return <p>Error loading relations: {relationsError.message}</p>;

  return (
    <TableCardStyled>
      <h2>Cennik (PLN)</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Relacja</th>
            <th>Cena bazowa (PLN)</th>
            <th>Cena za przystanek (PLN)</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {relationsData?.getUserRelations.map((relation) => (
            <tr key={relation.relation_id}>
              {editRelation && editRelation.relation_id === relation.relation_id ? (
                <>
                  <td>{relation.relation_name}</td>
                  <td>
                    <FormControlStyled
                      type="number"
                      step="0.01" // Allow decimal inputs
                      value={priceList[relation.relation_id]?.base_price || ''}
                      onChange={(e) => handleEditPriceChange('base_price', e.target.value)}
                      onBlur={() => handleBlur('base_price')} // Format price after editing
                    />
                  </td>
                  <td>
                    <FormControlStyled
                      type="number"
                      step="0.01" // Allow decimal inputs
                      value={priceList[relation.relation_id]?.price_per_stop || ''}
                      onChange={(e) => handleEditPriceChange('price_per_stop', e.target.value)}
                      onBlur={() => handleBlur('price_per_stop')} // Format price after editing
                    />
                  </td>
                  <td>
                    <ButtonGroup>
                      <SaveButton onClick={handleSavePrice}>
                        Zapisz
                      </SaveButton>
                      <CancelButton onClick={handleCancelEdit}>
                        Anuluj
                      </CancelButton>
                    </ButtonGroup>
                  </td>
                </>
              ) : (
                <>
                  <td>{relation.relation_name}</td>
                  <td>{priceList[relation.relation_id]?.base_price || 'Brak ceny'}</td>
                  <td>{priceList[relation.relation_id]?.price_per_stop || 'Brak ceny'}</td>
                  <td>
                    <ButtonGroup>
                      <EditButton
                        onClick={() => {
                          setEditRelation(relation);
                          fetchPriceList(relation.relation_id); // Refetch price list when editing
                        }}
                      >
                        Edytuj
                      </EditButton>
                    </ButtonGroup>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableCardStyled>
  );
};

export default Pricelist;
