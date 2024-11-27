import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert } from 'react-bootstrap';
import client from '../ApolloClient';
import styled from 'styled-components';

// GraphQL Queries
const GET_ALL_STOPS = gql`
  query GetAllStops {
    getAllStops
  }
`;

const GET_AVAILABLE_STOPS = gql`
  query GetAvailableStops($startStop: String!) {
    getAvailableStops(startStop: $startStop) {
      stop
      order_number
    }
  }
`;

const GET_AVAILABLE_COURSES = gql`
  query GetAvailableCourses($startStop: String!, $endStop: String!, $size: String!, $todayDelivery: Boolean!) {
    getAvailableCourses(startStop: $startStop, endStop: $endStop, size: $size, todayDelivery: $todayDelivery) {
      schedule_id
      relation_id
      vehicle_id
      company_name
      start_stop
      end_stop
      departure_time
      arrival_time
      total_price
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($user_id: Int!, $relation_id: Int!, $size: String!, $start_stop: String!, $end_stop: String!, $price: Float!, $today_delivery: Boolean!) {
    createOrder(user_id: $user_id, relation_id: $relation_id, size: $size, start_stop: $start_stop, end_stop: $end_stop, price: $price, today_delivery: $today_delivery) {
      order_id
      status
      order_code
    }
  }
`;

// Styled components
const FormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const FormGroupStyled = styled(Form.Group)`
  margin-top: 10px;
`;

const ButtonContainer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
`;

const InfoText = styled.p`
  margin-top: 10px;
  font-size: 16px;
  color: gray;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px; 
  input {
    width: 24px;  /* Zmniejszamy checkbox */
    height: 24px;
    margin-right: 10px;  /* Odsunięcie tekstu od checkboxa */
  }
  label {
    font-size: 18px; /* Dopasowujemy rozmiar tekstu */
  }
`;

const AlertMessage = styled(Alert)`
  margin-top: 15px;
`;

const ShipmentForm = ({ user_id, onShipmentCreated }) => {
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [size, setSize] = useState('');
  const [availableStops, setAvailableStops] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [todayDelivery, setTodayDelivery] = useState(true);
  const [noCoursesFound, setNoCoursesFound] = useState(false);
  const [formIncomplete, setFormIncomplete] = useState(false);

  const { data: allStopsData, refetch: refetchAllStops } = useQuery(GET_ALL_STOPS);
  const { data: availableStopsData, refetch: refetchAvailableStops } = useQuery(GET_AVAILABLE_STOPS, {
    variables: { startStop },
    skip: !startStop,
  });

  const [createOrder, { loading: createLoading, error: createError }] = useMutation(CREATE_ORDER, {
    refetchQueries: [
      { query: GET_ALL_STOPS },
      { query: GET_AVAILABLE_STOPS, variables: { startStop } },
      { query: GET_AVAILABLE_COURSES, variables: { startStop, endStop, size, todayDelivery } },
    ],
    onCompleted: () => {
      refetchAllStops();
      refetchAvailableStops();
      setStartStop('');
      setEndStop('');
      setSize('');
      setSelectedCourse('');
      setTodayDelivery(true);
      onShipmentCreated();
    }
  });

  useEffect(() => {
    if (availableStopsData && availableStopsData.getAvailableStops) {
      const sortedStops = [...availableStopsData.getAvailableStops]
        .sort((a, b) => a.order_number - b.order_number)
        .map((stopData) => stopData.stop);
      setAvailableStops(sortedStops);
    }
  }, [availableStopsData]);

  const handleStartStopChange = (e) => {
    const value = e.target.value;
    setStartStop(value);
    if (value.length > 0 && allStopsData) {
      const filtered = allStopsData.getAllStops.filter((stop) =>
        stop.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStops(filtered);
    } else {
      setFilteredStops([]);
    }
  };

  const handleStopChange = (e, isStart) => {
    const selectedStop = e.target.value;
    if (isStart) {
      setStartStop(selectedStop);
    } else {
      setEndStop(selectedStop);
    }
  };

  const handleGetAvailableCourses = async () => {
    if (!startStop || !endStop || !size) {
      setFormIncomplete(true);
      setNoCoursesFound(false);
      return;
    }
  
    setCoursesLoading(true);
    setCoursesError(null);
    setNoCoursesFound(false);
    setFormIncomplete(false);
    setAvailableCourses([]);
    
    try {
      const { data } = await client.query({
        query: GET_AVAILABLE_COURSES,
        variables: { startStop, endStop, size, todayDelivery },
      });
      
      if (data.getAvailableCourses.length === 0) {
        setNoCoursesFound(true);
      } else {
        const validCourses = data.getAvailableCourses.filter(course => course.total_price > 0);
        
        if (validCourses.length === 0) {
          alert('Brak dostępnych kursów z poprawną ceną.');
          setNoCoursesFound(true);
        } else {
          setAvailableCourses(validCourses);
        }
      }
    } catch (error) {
      setCoursesError(error);
    } finally {
      setCoursesLoading(false);
    }
  };
  
  const calculateFinalPrice = (basePrice) => {
    // Upewnij się, że basePrice jest liczbą
    let finalPrice = parseFloat(basePrice);
  
    if (isNaN(finalPrice) || finalPrice <= 0) {
      console.error('Invalid base price:', basePrice);
      return null; // Zwróć null, jeśli basePrice jest nieprawidłowa
    }
  
    // Zwiększ cenę w zależności od rozmiaru przesyłki
    if (size === 'M') {
      finalPrice *= 2;
    } else if (size === 'L') {
      finalPrice *= 3;
    }
  
    return finalPrice.toFixed(2); // Zwróć cenę jako string z dwoma miejscami po przecinku
  };  

  const handleCourseChange = (e) => {
    const selectedCourseId = e.target.value; 
    const selectedCourseData = availableCourses.find(course => course.schedule_id === selectedCourseId);
  
    if (selectedCourseData) {
      setSelectedCourse(selectedCourseData); // Zapisz pełny obiekt kursu
  
      console.log('Selected course data:', selectedCourseData);  // Debuguj wybrany kurs
  
      // Sprawdź, czy total_price jest poprawną liczbą
      if (isNaN(selectedCourseData.total_price) || selectedCourseData.total_price <= 0) {
        alert('Wybrany kurs ma nieprawidłową cenę.');
        setTotalPrice(null);
      } else {
        const finalPrice = calculateFinalPrice(selectedCourseData.total_price);
        console.log('Final price:', finalPrice);  // Debuguj ostateczną cenę
        setTotalPrice(finalPrice);
      }
    } else {
      console.error(`No course found for selected ID: ${selectedCourseId}`);
    }
  };
  
  const handleSizeChange = (e) => {
    setSize(e.target.value);
  
    if (selectedCourse) {
      const selectedCourseData = selectedCourse;  // Teraz selectedCourse zawiera cały obiekt
  
      if (selectedCourseData) {
        // Sprawdź, czy total_price jest liczbą
        if (isNaN(selectedCourseData.total_price) || selectedCourseData.total_price <= 0) {
          console.error('Invalid total price:', selectedCourseData.total_price);
          alert('Cena kursu jest nieprawidłowa. Wybierz inny kurs.');
          setTotalPrice(null);
          return;
        }
  
        // Oblicz ostateczną cenę, jeśli total_price jest poprawny
        const finalPrice = calculateFinalPrice(selectedCourseData.total_price);
        console.log('Updated final price on size change:', finalPrice);  // Logowanie ceny po zmianie rozmiaru
        setTotalPrice(finalPrice);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert('Wybierz kurs przed nadaniem przesyłki!');
      return;
    }
  
    console.log('Selected course:', selectedCourse); // Debugowanie wybranego kursu
    const relationId = selectedCourse.relation_id;  // Pobieramy relation_id z wybranego kursu
  
    if (!relationId) {
      console.error('Nie udało się znaleźć relation_id dla wybranego kursu.');
      alert('Nie udało się znaleźć relacji dla wybranego kursu.');
      return;
    }
  
    console.log('Relation ID:', relationId);  // Debugowanie relation_id
  
    try {
      await createOrder({
        variables: {
          user_id,
          relation_id: relationId,  // Przekazujemy relation_id zamiast schedule_id
          size,
          start_stop: startStop,
          end_stop: endStop,
          price: parseFloat(totalPrice),
          today_delivery: todayDelivery,
        },
      });
      alert('Shipment created successfully!');
    } catch (err) {
      if (err.message.includes('Insufficient balance')) {
        alert('Brak środków na koncie!');
      } else {
        console.error(err);
        alert('Wystąpił błąd podczas tworzenia przesyłki');
      }
    }
  };  

  return (
    <FormContainer>
      <Title>Nadaj przesyłkę!</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroupStyled controlId="formStartStop">
          <Form.Label>Punkt nadania</Form.Label>
          <Form.Control
            type="text"
            value={startStop}
            onChange={handleStartStopChange}
            placeholder="Wprowadź punkt nadania"
            required
          />
          {filteredStops.length > 0 && (
            <div className="autocomplete-dropdown">
              {filteredStops.map((stop) => (
                <div
                  key={stop}
                  onClick={() => {
                    setStartStop(stop);
                    setFilteredStops([]);
                  }}
                  className="autocomplete-item"
                >
                  {stop}
                </div>
              ))}
            </div>
          )}
        </FormGroupStyled>
        <FormGroupStyled controlId="formEndStop">
          <Form.Label>Punkt docelowy</Form.Label>
          <Form.Control
            as="select"
            value={endStop}
            onChange={(e) => handleStopChange(e, false)}
            required
          >
            <option value="">Wybierz punkt docelowy</option>
            {availableStops.map((stop) => (
              <option key={stop} value={stop}>
                {stop}
              </option>
            ))}
          </Form.Control>
        </FormGroupStyled>
        <FormGroupStyled controlId="formSize">
          <Form.Label>Rozmiar przesyłki</Form.Label>
          <Form.Control
            as="select"
            value={size}
            onChange={handleSizeChange} 
            required
          >
            <option value="">Wybierz rozmiar przesyłki</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
          </Form.Control>
        </FormGroupStyled>
        <FormGroupStyled controlId="formTodayDelivery">
        <CheckboxContainer>
          <Form.Check
            type="checkbox"
            label="Przesyłka nadana dzisiaj?"
            checked={todayDelivery}
            onChange={() => setTodayDelivery(!todayDelivery)}
          />
        </CheckboxContainer>
        </FormGroupStyled>
        {todayDelivery === false && <InfoText>Uwaga! Twoje zamówienie zostanie zrealizowane w dniu jutrzejszym.</InfoText>}
        <ButtonContainer>
          <Button variant="secondary" onClick={handleGetAvailableCourses} disabled={coursesLoading}>
            Pobierz dostępne kursy
          </Button>
          <Button variant="primary" type="submit" disabled={createLoading}>
            Nadaj przesyłkę
          </Button>
        </ButtonContainer>
        {coursesLoading && <p>Ładowanie dostępnych kursów...</p>}
        {availableCourses.length > 0 && (
          <FormGroupStyled controlId="formAvailableCourses">
            <Form.Label>Dostępne kursy</Form.Label>
            <Form.Control
              as="select"
              value={selectedCourse.schedule_id || ''}
              onChange={handleCourseChange}
              required
            >
              <option value="">Wybierz kurs</option>
              {availableCourses.map((course) => {
                const finalPrice = calculateFinalPrice(course.total_price);
                return (
                  <option key={course.schedule_id} value={course.schedule_id}>
                    {course.departure_time} - {course.arrival_time} (firma: {course.company_name}) - Cena: {finalPrice} PLN
                  </option>
                );
              })}
            </Form.Control>
          </FormGroupStyled>
        )}
        {formIncomplete && <AlertMessage variant="warning">Proszę uzupełnić wszystkie pola formularza!</AlertMessage>}
        {coursesError && <AlertMessage variant="danger">Błąd podczas pobierania kursów! {coursesError.message}</AlertMessage>}
        {noCoursesFound && <AlertMessage variant="warning">Brak dostępnych kursów na ten dzień.</AlertMessage>}
      </Form>
    </FormContainer>
  );
};

export default ShipmentForm;
