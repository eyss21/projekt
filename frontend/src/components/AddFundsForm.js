import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Alert } from 'react-bootstrap';

const ADD_FUNDS = gql`
  mutation AddFunds($user_id: Int!, $amount: Float!) {
    addFunds(user_id: $user_id, amount: $amount) {
      wallet_id
      balance
    }
  }
`;

const AddFundsForm = ({ user_id }) => {
  const [amount, setAmount] = useState('');
  const [addFunds, { data, loading, error }] = useMutation(ADD_FUNDS);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addFunds({ variables: { user_id: parseInt(user_id), amount: parseFloat(amount) } });
      alert('Funds added successfully!');
      setAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formAmount">
        <Form.Label>Amount</Form.Label>
        <Form.Control
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
      </Form.Group>
      <Button variant="primary" type="submit" disabled={loading}>
        Add Funds
      </Button>
      {error && <Alert variant="danger" className="mt-3">Error adding funds! {error.message}</Alert>}
      {data && <Alert variant="success" className="mt-3">New Balance: {data.addFunds.balance} PLN</Alert>}
    </Form>
  );
};

export default AddFundsForm;
