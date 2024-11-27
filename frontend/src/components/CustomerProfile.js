import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import styled from 'styled-components';

const GET_USER_PROFILE = gql`
  query GetUserProfile($email: String!, $user_type: String!) {
    getUserProfile(email: $email, user_type: $user_type) {
      email
      first_name
      last_name
      phone_number
      wallet {
        balance
      }
    }
  }
`;

const UPDATE_CUSTOMER_PROFILE = gql`
  mutation UpdateCustomerProfile($email: String!, $new_email: String!, $first_name: String!, $last_name: String!, $phone_number: String!) {
    updateCustomerProfile(email: $email, new_email: $new_email, first_name: $first_name, last_name: $last_name, phone_number: $phone_number) {
      email
      first_name
      last_name
      phone_number  # Dodane pole
    }
  }
`;

const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($email: String!, $oldPassword: String!, $newPassword: String!, $user_type: String!) {
    updatePassword(email: $email, oldPassword: $oldPassword, newPassword: $newPassword, user_type: $user_type)
  }
`;

const CardStyled = styled(Card)`
  width: 100%;
  max-width: 500px;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const ContainerStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto;
`;

const CustomerProfile = () => {
  const [email, setEmail] = useState(localStorage.getItem('email'));
  const [newEmail, setNewEmail] = useState(localStorage.getItem('email'));
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const userType = 'customer';
  
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, { variables: { email, user_type: userType } });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [message, setMessage] = useState(null);

  const [updateProfile, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_CUSTOMER_PROFILE, {
    refetchQueries: [{ query: GET_USER_PROFILE, variables: { email: newEmail, user_type: userType } }],
    onCompleted: (data) => {
      if (data.updateCustomerProfile) {
        setEmail(newEmail);
        localStorage.setItem('email', newEmail);
        setMessage({ type: 'success', text: 'Profil został zaktualizowany.' });
        setTimeout(() => {
          setMessage(null);
          setEditProfile(false);
        }, 3000);
      } else {
        setMessage({ type: 'danger', text: 'Błąd aktualizacji profilu!' });
      }
    },
    onError: () => {
      setMessage({ type: 'danger', text: 'Błąd aktualizacji profilu!' });
    }
  });

  const [updatePassword, { loading: pwdLoading, error: pwdError }] = useMutation(UPDATE_PASSWORD);

  useEffect(() => {
    if (data && data.getUserProfile) {
      const { email, first_name, last_name, phone_number } = data.getUserProfile;
      setEmail(email);
      setNewEmail(email);
      setFirstName(first_name || '');
      setLastName(last_name || '');
      setPhoneNumber(phone_number || '+48 ');
    }
  }, [data]);  

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ variables: { email, new_email: newEmail, first_name: firstName, last_name: lastName, phone_number: phoneNumber } });  // Zaktualizuj tutaj
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updatePassword({ variables: { email, oldPassword, newPassword, user_type: userType } });
      if (data.updatePassword === "Password updated") {
        setMessage({ type: 'success', text: 'Hasło zostało zmienione.' });
        setTimeout(() => setChangePassword(false), 3000);
      } else {
        setMessage({ type: 'danger', text: data.updatePassword });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Błąd zmiany hasła!' });
    }
  };

  const formatPhoneNumber = (number) => {
    // Usuń wszystko, co nie jest cyfrą
    let cleanNumber = number.replace(/\D/g, '');
  
    // Dodaj prefiks +48, jeśli go nie ma
    if (!cleanNumber.startsWith('48')) {
      cleanNumber = '48' + cleanNumber;
    }
  
    // Usuń prefiks +48, aby formatować tylko cyfry podane przez użytkownika
    cleanNumber = cleanNumber.replace(/^48/, '');
  
    // Sprawdź, czy długość numeru nie przekracza 9 cyfr
    if (cleanNumber.length > 9) {
      cleanNumber = cleanNumber.slice(0, 9);
    }
  
    // Formatowanie numeru co 3 cyfry
    const formattedNumber = cleanNumber.replace(/(\d{3})(?=\d)/g, '$1 ');
  
    return `+48 ${formattedNumber.trim()}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedPhone);
  };

  return (
    <ContainerStyled>
      {!editProfile && !changePassword && (
        <CardStyled>
          <h2 className="text-center">Mój Profil</h2>
          {error && <Alert variant="danger">Error loading profile: {error.message}</Alert>}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Imię:</strong> {firstName}</p>
              <p><strong>Nazwisko:</strong> {lastName}</p>
              <p><strong>Numer Telefonu:</strong> {phoneNumber}</p>
              {data && data.getUserProfile && (
                <p><strong>Stan Portfela:</strong> {data.getUserProfile.wallet.balance} PLN</p>
              )}
              <Button variant="primary" className="w-100 mt-3" onClick={() => setEditProfile(true)}>Edytuj Profil</Button>
              <Button variant="secondary" className="w-100 mt-3" onClick={() => setChangePassword(true)}>Zmień Hasło</Button>
            </>
          )}
          {message && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
        </CardStyled>
      )}
      {editProfile && (
        <CardStyled>
          <h2 className="text-center">Edytuj Profil</h2>
          <Form onSubmit={handleProfileSubmit}>
            <Form.Group controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                required
              />
            </Form.Group>
  
            <Form.Group controlId="formFirstName">
              <Form.Label>Imię</Form.Label>
              <Form.Control
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Imię"
                required
              />
            </Form.Group>
  
            <Form.Group controlId="formLastName">
              <Form.Label>Nazwisko</Form.Label>
              <Form.Control
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nazwisko"
                required
              />
            </Form.Group>

            <Form.Group controlId="formPhoneNumber">
              <Form.Label>Numer Telefonu</Form.Label>
              <Form.Control
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Numer Telefonu"
                required
              />
            </Form.Group>
  
            <Button variant="primary" type="submit" className="w-100 mt-3" disabled={updateLoading}>
              Zaktualizuj Profil
            </Button>
            {updateError && <Alert variant="danger" className="mt-3">Błąd aktualizacji profilu! {updateError.message}</Alert>}
            {message && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
          </Form>
          <Button variant="secondary" className="w-100 mt-3" onClick={() => setEditProfile(false)}>
            Anuluj
          </Button>
        </CardStyled>
      )}
      {changePassword && (
        <CardStyled>
          <h2 className="text-center">Zmień Hasło</h2>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group controlId="formOldPassword">
              <Form.Label>Stare Hasło</Form.Label>
              <Form.Control
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Stare Hasło"
                required
              />
            </Form.Group>
  
            <Form.Group controlId="formNewPassword">
              <Form.Label>Nowe Hasło</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nowe Hasło"
                required
              />
            </Form.Group>
  
            <Button variant="primary" type="submit" className="w-100 mt-3" disabled={pwdLoading}>
              Zmień Hasło
            </Button>
            {pwdError && <Alert variant="danger" className="mt-3">Błąd zmiany hasła! {pwdError.message}</Alert>}
            {message && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
          </Form>
          <Button variant="secondary" className="w-100 mt-3" onClick={() => setChangePassword(false)}>
            Anuluj
          </Button>
        </CardStyled>
      )}
    </ContainerStyled>
  );  
};

export default CustomerProfile;
