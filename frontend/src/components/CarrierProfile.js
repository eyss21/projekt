import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import styled from 'styled-components';

const GET_USER_PROFILE = gql`
  query GetUserProfile($email: String!, $user_type: String!) {
    getUserProfile(email: $email, user_type: $user_type) {
      email
      company_name
      postal_code
      city
      street
      phone_number
      wallet {
        balance
      }
    }
  }
`;

const UPDATE_CARRIER_PROFILE = gql`
  mutation UpdateCarrierProfile($email: String!, $new_email: String!, $company_name: String!, $postal_code: String!, $city: String!, $street: String!, $phone_number: String) {
    updateCarrierProfile(email: $email, new_email: $new_email, company_name: $company_name, postal_code: $postal_code, city: $city, street: $street, phone_number: $phone_number) {
      email
      company_name
      postal_code
      city
      street
      phone_number
    }
  }
`;


const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($email: String!, $oldPassword: String!, $newPassword: String!, $user_type: String!) {
    updatePassword(email: $email, oldPassword: $oldPassword, newPassword: $newPassword, user_type: $user_type)
  }
`;

const ContainerStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto;
`;

const CardStyled = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: #f8f9fa;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const CarrierProfile = () => {
  const [email, setEmail] = useState(localStorage.getItem('email'));
  const [newEmail, setNewEmail] = useState(localStorage.getItem('email'));
  const userType = 'carrier'; 

  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, { variables: { email, user_type: userType } });

  const [companyName, setCompanyName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [message, setMessage] = useState(null);

  const [updateProfile, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_CARRIER_PROFILE, {
    refetchQueries: [{ query: GET_USER_PROFILE, variables: { email: newEmail, user_type: userType } }],
    onCompleted: (data) => {
      if (data.updateCarrierProfile) {
        // Zaktualizuj stan lokalny
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

  const [updatePassword, { loading: pwdLoading, error: pwdError }] = useMutation(UPDATE_PASSWORD, {
    refetchQueries: [{ query: GET_USER_PROFILE, variables: { email: newEmail, user_type: userType } }],
    onCompleted: (data) => {
      if (data.updatePassword === "Password updated") {
        setMessage({ type: 'success', text: 'Hasło zostało zmienione.' });
        setTimeout(() => setChangePassword(false), 3000); 
      } else {
        setMessage({ type: 'danger', text: data.updatePassword });
      }
    },
    onError: () => {
      setMessage({ type: 'danger', text: 'Błąd zmiany hasła!' });
    }
  });

  useEffect(() => {
    if (data && data.getUserProfile) {
      const { email, company_name, postal_code, city, street, phone_number } = data.getUserProfile;  
      setEmail(email);
      setNewEmail(email);
      setCompanyName(company_name);
      setPostalCode(postal_code);
      setCity(city);
      setStreet(street);
      setPhoneNumber(formatPhoneNumber(phone_number || ''));  
    }
  }, [data]);
  

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ variables: { email, new_email: newEmail, company_name: companyName, postal_code: postalCode, city: city, street: street, phone_number: phoneNumber } });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePassword({ variables: { email, oldPassword, newPassword, user_type: userType } });
    } catch (err) {
      console.error(err);
    }
  };

  const formatPhoneNumber = (number) => {
    let cleanNumber = number.replace(/\D/g, '');
  
    if (!cleanNumber.startsWith('48')) {
      cleanNumber = '48' + cleanNumber;
    }
  
    cleanNumber = cleanNumber.replace(/^48/, '');
  
    if (cleanNumber.length > 9) {
      cleanNumber = cleanNumber.slice(0, 9);
    }
  
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
          {error && <Alert variant="danger">Błąd: {error.message}</Alert>}
          {loading ? (
            <p>Ładowanie...</p>
          ) : (
            <>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Nazwa Firmy:</strong> {companyName}</p>
              <p><strong>Kod Pocztowy:</strong> {postalCode}</p>
              <p><strong>Miasto:</strong> {city}</p>
              <p><strong>Ulica:</strong> {street}</p>
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

            <Form.Group controlId="formCompanyName">
              <Form.Label>Nazwa Firmy</Form.Label>
              <Form.Control
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nazwa Firmy"
                required
              />
            </Form.Group>

            <Form.Group controlId="formPostalCode">
              <Form.Label>Kod Pocztowy</Form.Label>
              <Form.Control
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Kod Pocztowy"
                required
              />
            </Form.Group>

            <Form.Group controlId="formCity">
              <Form.Label>Miasto</Form.Label>
              <Form.Control
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Miasto"
                required
              />
            </Form.Group>

            <Form.Group controlId="formStreet">
              <Form.Label>Ulica</Form.Label>
              <Form.Control
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ulica"
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

export default CarrierProfile;
