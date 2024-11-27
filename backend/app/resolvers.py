from datetime import datetime, timedelta
from ariadne import QueryType, MutationType
from app.models import User, Vehicle, Schedule, Order, Wallet, Driver, Relation, ShipmentProblem, OrderStatusHistory, PriceList
from app.database import SessionLocal
import logging, random
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

query = QueryType()
mutation = MutationType()

def generate_driver_id_code(db):
    while True:
        code = str(random.randint(100000000, 999999999))
        if not db.query(Driver).filter(Driver.driver_id_code == code).first():
            return code

def generate_unique_order_code(db):
    while True:
        code = ''.join([str(random.randint(0, 9)) for _ in range(14)])
        if not db.query(Order).filter(Order.order_code == code).first():
            return code
        
def generate_random_code():
    return str(random.randint(1000, 9999))

# Funkcja sprawdzająca, czy kurs jest dostępny dzisiaj w odpowiednim przedziale czasowym
def can_send_today(departure_time_str, current_time):
    # Zamieniamy 'departure_time' z formatu '1970-01-01 13:01' na tylko godzinę i minuty
    departure_time = datetime.strptime(departure_time_str, '%Y-%m-%d %H:%M:%S').time()

    # Pobieramy aktualny czas (tylko godzina i minuty)
    current_time_only = current_time.time()

    # Obliczamy różnicę w godzinach i minutach
    time_difference = (datetime.combine(datetime.today(), departure_time) -
                       datetime.combine(datetime.today(), current_time_only)).total_seconds() / 3600.0

    # Sprawdzamy, czy różnica czasu jest większa niż 2 godziny
    return time_difference >= 2


# Rejestracja przewoźnika
@mutation.field("registerCarrier")
def resolve_register_carrier(_, info, email, password, company_name, postal_code, city, street, phoneNumber=None):
    session = SessionLocal()
    existing_user = session.query(User).filter(User.email == email, User.user_type == 'carrier').first()
    if existing_user:
        session.close()
        return {"message": "Email already registered as carrier", "user_id": None, "email": email, "token": ""}
    
    user = User(
        email=email,
        password=password,
        company_name=company_name,
        postal_code=postal_code,
        city=city,
        street=street,
        user_type='carrier',
        phone_number=phoneNumber
    )
    wallet = Wallet(balance=0.0, user=user)
    session.add(user)
    session.add(wallet)
    session.commit()
    user_id = user.user_id
    session.close()
    return {"message": "User registered", "user_id": user_id, "email": email, "token": "some-token-value"}

# Rejestracja klienta
@mutation.field("registerCustomer")
def resolve_register_customer(_, info, firstName, lastName, email, password, phoneNumber=None):
    session = SessionLocal()
    existing_user = session.query(User).filter(User.email == email, User.user_type == 'customer').first()
    if existing_user:
        session.close()
        return {"message": "Email already registered as customer", "user_id": None, "email": email, "token": ""}

    user = User(email=email, password=password, first_name=firstName, last_name=lastName, user_type='customer', phone_number=phoneNumber)
    wallet = Wallet(balance=0.0, user=user)
    session.add(user)
    session.add(wallet)
    session.commit()
    user_id = user.user_id
    session.close()
    return {"message": "User registered", "user_id": user_id, "email": email, "token": "some-token-value"}

# Logowanie przewoźnika
@mutation.field("loginCarrier")
def resolve_login_carrier(_, info, email, password):
    session = SessionLocal()
    user = session.query(User).filter(User.email == email, User.password == password, User.user_type == 'carrier').first()
    session.close()
    if user:
        return {"message": "User logged in", "user_id": user.user_id, "token": "some-token-value", "email": user.email}
    else:
        return {"message": "Invalid credentials", "user_id": None, "token": "", "email": ""}

# Logowanie klienta
@mutation.field("loginCustomer")
def resolve_login_customer(_, info, email, password):
    session = SessionLocal()
    user = session.query(User).filter(User.email == email, User.password == password, User.user_type == 'customer').first()
    session.close()
    if user:
        return {"message": "User logged in", "user_id": user.user_id, "token": "some-token-value", "email": user.email}
    else:
        return {"message": "Invalid credentials", "user_id": None, "token": "", "email": ""}
    
# Logowanie administratora
@mutation.field("loginAdmin")
def resolve_login_admin(_, info, email, password):
    session = SessionLocal()
    user = session.query(User).filter(User.email == email, User.password == password, User.user_type == 'admin').first()
    session.close()
    if user:
        return {"message": "User logged in", "user_id": user.user_id, "token": "some-token-value", "email": user.email}
    else:
        return {"message": "Invalid credentials", "user_id": None, "token": "", "email": ""}

# Usuwanie użytkownika
@mutation.field("deleteUser")
def resolve_delete_user(_, info, email, user_type):
    db = SessionLocal()
    try:
        # Znajdź użytkownika na podstawie emaila i typu użytkownika
        user = db.query(User).filter(User.email == email, User.user_type == user_type).first()

        if not user:
            logger.warning(f"User {email} not found.")
            return "User not found"

        # Obsługa usuwania danych dla przewoźnika (carrier)
        if user.user_type == 'carrier':
            # Znajdź pojazdy przewoźnika
            vehicles = db.query(Vehicle).filter(Vehicle.owner_id == user.user_id).all()
            for vehicle in vehicles:
                # Usuń wszystkie rozkłady jazdy związane z pojazdem
                db.query(Schedule).filter(Schedule.vehicle_id == vehicle.vehicle_id).delete()

                # Usuń wszystkie relacje powiązane z pojazdem
                relations = db.query(Relation).filter(Relation.vehicle_id == vehicle.vehicle_id).all()
                for relation in relations:
                    # Usuń wszystkie rozkłady jazdy związane z relacją
                    db.query(Schedule).filter(Schedule.relation_id == relation.relation_id).delete()

                    # Usuń powiązane cenniki
                    db.query(PriceList).filter(PriceList.relation_id == relation.relation_id).delete()

                    # Usuń zamówienia powiązane z relacją
                    db.query(Order).filter(Order.relation_id == relation.relation_id).delete()

                    # Usuń relację
                    db.delete(relation)

                # Usuń pojazd
                db.delete(vehicle)

            # Usuń kierowców powiązanych z przewoźnikiem
            db.query(Driver).filter(Driver.owner_id == user.user_id).delete()

            # Usuń zamówienia przewoźnika
            db.query(Order).filter(Order.user_id == user.user_id).delete()

            # Usuń portfel przewoźnika
            db.query(Wallet).filter(Wallet.user_id == user.user_id).delete()

        # Obsługa usuwania danych dla klienta (customer)
        elif user.user_type == 'customer':
            # Usuń zamówienia klienta
            db.query(Order).filter(Order.user_id == user.user_id).delete()

            # Usuń portfel klienta
            db.query(Wallet).filter(Wallet.user_id == user.user_id).delete()

        # Usuń problemy związane z przesyłkami (dla wszystkich typów użytkowników)
        db.query(ShipmentProblem).filter(ShipmentProblem.user_id == user.user_id).delete()

        # Usuń użytkownika
        db.delete(user)

        # Zatwierdź zmiany w bazie danych
        db.commit()
        logger.info(f"User {email} deleted.")
        return "User deleted"

    except Exception as e:
        db.rollback()
        logger.error(f"Error occurred while deleting user {email}: {str(e)}")
        return f"Error occurred: {str(e)}"
    
    finally:
        db.close()

# Aktualizacja profilu klienta
@mutation.field("updateCustomerProfile")
def resolve_update_customer_profile(_, info, email, new_email=None, first_name=None, last_name=None, phone_number=None):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email, User.user_type == 'customer').first()
    if user:
        if new_email is not None:
            user.email = new_email
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone_number is not None:
            user.phone_number = phone_number  # Dodane: Aktualizacja numeru telefonu
        db.commit()
        db.refresh(user)
        db.close()
        logger.info(f"Customer {email} updated profile.")
        return user
    db.close()
    logger.warning(f"Customer {email} not found.")
    return None

# Aktualizacja profilu przewoźnika
@mutation.field("updateCarrierProfile")
def resolve_update_carrier_profile(_, info, email, new_email=None, company_name=None, postal_code=None, city=None, street=None, phone_number=None):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email, User.user_type == 'carrier').first()
    if user:
        if new_email is not None:
            user.email = new_email
        if company_name is not None:
            user.company_name = company_name
        if postal_code is not None:
            user.postal_code = postal_code
        if city is not None:
            user.city = city
        if street is not None:
            user.street = street
        if phone_number is not None:
            user.phone_number = phone_number  # Dodane: Aktualizacja numeru telefonu
        db.commit()
        db.refresh(user)
        db.close()
        logger.info(f"Carrier {email} updated profile.")
        return user
    db.close()
    logger.warning(f"Carrier {email} not found.")
    return None

# Aktualizacja hasła
@mutation.field("updatePassword")
def resolve_update_password(_, info, email, oldPassword, newPassword, user_type):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email, User.user_type == user_type).first()
    if user:
        if user.password == oldPassword:
            user.password = newPassword
            db.commit()
            db.close()
            logger.info(f"User {email} updated password.")
            return "Password updated"
        else:
            db.close()
            logger.warning(f"User {email} provided incorrect old password.")
            return "Incorrect old password"
    db.close()
    logger.warning(f"User {email} not found.")
    return "User not found"

# Edycja pojazdu
@mutation.field("updateVehicle")
def resolve_update_vehicle(_, info, vehicle_id, model, capacity, registration_number):
    db = SessionLocal()
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if vehicle:
        vehicle.model = model
        vehicle.capacity = capacity
        vehicle.registration_number = registration_number
        db.commit()
        db.refresh(vehicle)
        db.close()
        logger.info(f"Vehicle {vehicle_id} updated to model {model} with capacity {capacity} and registration number {registration_number}.")
        return vehicle
    db.close()
    logger.warning(f"Vehicle {vehicle_id} not found.")
    return None

# Dodanie nowego pojazdu
@mutation.field("addVehicle")
def resolve_add_vehicle(_, info, model, capacity, registration_number, owner_id):
    # Inicjalizacja sesji z bazą danych
    db = SessionLocal()

    # Tworzenie nowego obiektu Vehicle z danymi wejściowymi
    vehicle = Vehicle(
        model=model,  # Model pojazdu, np. marka lub typ
        capacity=capacity,  # Pojemność pojazdu (np. liczba miejsc na przesyłki)
        registration_number=registration_number,  # Numer rejestracyjny pojazdu
        owner_id=owner_id  # Identyfikator właściciela (przewoźnika)
    )

    # Dodanie nowego pojazdu do sesji (przygotowanie do zapisu w bazie)
    db.add(vehicle)
    
    # Zatwierdzenie (commit) zmian w bazie danych, co zapisuje pojazd
    db.commit()

    # Odświeżenie obiektu vehicle, aby upewnić się, że mamy aktualne dane z bazy
    db.refresh(vehicle)

    # Zamknięcie sesji z bazą danych, aby zwolnić zasoby
    db.close()

    # Logowanie informacji o dodanym pojeździe
    logger.info(f"Vehicle {model} with registration number {registration_number} added for owner {owner_id}.")

    # Zwracanie dodanego pojazdu jako wynik mutacji
    return vehicle

# Dodanie rozkładu jazdy
@mutation.field("addSchedule")
def resolve_add_schedule(_, info, vehicle_id, stop, arrival_time, departure_time, relation_id=None):
    db = SessionLocal()
    try:
        arrival_time_dt = datetime.strptime(arrival_time, '%H:%M').replace(year=1970, month=1, day=1)
        departure_time_dt = datetime.strptime(departure_time, '%H:%M').replace(year=1970, month=1, day=1)

        max_order_number = db.query(func.max(Schedule.order_number)).filter(Schedule.vehicle_id == vehicle_id).scalar()
        if max_order_number is None:
            max_order_number = 0
        new_order_number = max_order_number + 1

        schedule = Schedule(
            vehicle_id=vehicle_id, 
            stop=stop, 
            arrival_time=arrival_time_dt, 
            departure_time=departure_time_dt,
            order_number=new_order_number,
            relation_id=relation_id  # Ustawienie relation_id
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        logger.info(f"Schedule added for vehicle {vehicle_id} at stop {stop}.")
        return schedule
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding schedule: {e}")
        return None
    finally:
        db.close()

# Aktualizacja rozkładu jazdy
@mutation.field("updateSchedule")
def resolve_update_schedule(_, info, schedule_id, stop, arrival_time, departure_time):
    db = SessionLocal()
    schedule = db.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
    if schedule:
        schedule.stop = stop
        schedule.arrival_time = datetime.strptime(arrival_time, '%H:%M').replace(year=1970, month=1, day=1)
        schedule.departure_time = datetime.strptime(departure_time, '%H:%M').replace(year=1970, month=1, day=1)
        db.commit()
        db.refresh(schedule)
        db.close()
        logger.info(f"Schedule {schedule_id} updated.")
        return schedule
    db.close()
    logger.warning(f"Schedule {schedule_id} not found.")
    return None

# Utworzenie zamówienia
@mutation.field("createOrder")
def resolve_create_order(_, info, user_id, relation_id, size, start_stop, end_stop, price, today_delivery):
    # Inicjalizacja połączenia z bazą danych
    db = SessionLocal()

    try:
        # Pobieramy wszystkie przystanki (schedules) powiązane z daną relacją (relation_id)
        # Sortujemy je według kolejności (order_number), aby zachować właściwą sekwencję trasy
        vehicle_schedules = db.query(Schedule).filter(Schedule.relation_id == relation_id).order_by(Schedule.order_number).all()
        start_schedule = None
        end_schedule = None

        # Przeszukiwanie przystanków, aby znaleźć przystanek początkowy i końcowy
        for schedule in vehicle_schedules:
            if schedule.stop == start_stop:  # Znaleziono przystanek początkowy
                start_schedule = schedule
            if schedule.stop == end_stop:  # Znaleziono przystanek końcowy
                end_schedule = schedule

        # Jeśli nie znaleziono przystanków, wyrzuć błąd
        if not start_schedule or not end_schedule:
            raise ValueError(f"Błędny przystanek początkowy lub końcowy: start_stop={start_stop}, end_stop={end_stop}")

        # Obliczenie daty i godziny nadania przesyłki na podstawie today_delivery
        if today_delivery:
            # Jeśli przesyłka ma być nadana dziś, ustaw odpowiednią godzinę nadania i odbioru
            departure_time = datetime.combine(datetime.today(), start_schedule.departure_time.time())
            arrival_time = datetime.combine(datetime.today(), end_schedule.arrival_time.time())
        else:
            # Jeśli nadanie ma nastąpić jutro, ustaw datę na kolejny dzień
            departure_time = datetime.combine(datetime.today() + timedelta(days=1), start_schedule.departure_time.time())
            arrival_time = datetime.combine(datetime.today() + timedelta(days=1), end_schedule.arrival_time.time())

        # Sprawdzamy, czy użytkownik ma wystarczające środki w portfelu
        user_wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if user_wallet.balance < price:
            # Jeśli saldo w portfelu jest mniejsze niż cena przesyłki, wyrzuć błąd
            raise ValueError("Brak wystarczających środków na koncie")

        # Tworzymy nowe zamówienie (order) z przypisaną relacją, przystankami i czasem dostawy
        new_order = Order(
            user_id=user_id,  # Identyfikator użytkownika tworzącego zamówienie
            relation_id=relation_id,  # Relacja, na której opiera się przesyłka
            size=size,  # Rozmiar przesyłki (np. S, M, L)
            start_stop=start_stop,  # Przystanek początkowy
            end_stop=end_stop,  # Przystanek końcowy
            departure_time=departure_time,  # Czas nadania przesyłki
            arrival_time=arrival_time,  # Czas odbioru przesyłki
            price=price,  # Cena przesyłki
            order_code=generate_unique_order_code(db),  # Generujemy unikalny kod zamówienia
            pickup_code='0000',  # Kod odbioru (do aktualizacji później)
            delivery_code='0000',  # Kod dostarczenia (do aktualizacji później)
            status='Nadana'  # Status zamówienia na początek to "Nadana"
        )

        # Zapisujemy nowe zamówienie i jego historię statusów
        db.add(new_order)
        db.flush()  # Flushing zapisuje dane do bazy, ale nie kończy sesji transakcji

        # Dodajemy wpis do historii statusów zamówienia (status na początku to "Nadana")
        status_history_entry = OrderStatusHistory(
            order_id=new_order.order_id,  # Powiązane zamówienie
            status='Nadana',  # Status początkowy
            changed_at=datetime.now()  # Czas, kiedy status został zmieniony
        )
        db.add(status_history_entry)

        # Aktualizacja stanu portfela użytkownika po pomyślnym utworzeniu zamówienia
        user_wallet.balance -= price
        db.commit()  # Zatwierdzamy wszystkie zmiany w bazie danych

        # Odświeżamy dane zamówienia, aby upewnić się, że wszystkie informacje są aktualne
        db.refresh(new_order)

        # Zwracamy utworzone zamówienie jako wynik mutacji
        return new_order

    except Exception as e:
        # Jeśli wystąpił jakikolwiek błąd, wycofujemy wszystkie zmiany w bazie danych
        db.rollback()
        raise e

    finally:
        # Zamykamy sesję z bazą danych, aby uwolnić zasoby
        db.close()

# Aktualizacja środków portfela
@mutation.field("updateUserFunds")
def resolve_update_user_funds(_, info, user_id, new_balance):
    db = SessionLocal()
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if wallet:
        wallet.balance = new_balance  # Nadpisujemy nową wartością
        db.commit()
        db.refresh(wallet)
        db.close()
        logger.info(f"Zaktualizowano saldo portfela {wallet.wallet_id}. Nowe saldo: {wallet.balance}")
        return wallet
    db.close()
    logger.warning(f"Portfel użytkownika {user_id} nie został znaleziony.")
    return None

# Pobranie profilu użytkownika
@query.field("getUserProfile")
def resolve_get_user_profile(_, info, email, user_type):
    db = SessionLocal()
    user = db.query(User).options(joinedload(User.wallet)).filter(User.email == email, User.user_type == user_type).first()
    db.close()
    if user:
        return user
    return None

# Pobranie pojazdów użytkownika
@query.field("getUserVehicles")
def resolve_get_user_vehicles(_, info, owner_id):
    db = SessionLocal()
    vehicles = db.query(Vehicle).filter(Vehicle.owner_id == owner_id).all()
    db.close()
    return vehicles

# Pobranie rozkładu jazdy pojazdu
@query.field("getVehicleSchedules")
def resolve_get_vehicle_schedules(_, info, vehicle_id, relation_id=None):
    db = SessionLocal()
    query = db.query(Schedule).filter(Schedule.vehicle_id == vehicle_id)
    
    if relation_id is not None:
        query = query.filter(Schedule.relation_id == relation_id)
    else:
        query = query.filter(Schedule.relation_id == None)  # Dodane: filtruj tylko nieprzypisane przystanki
    
    schedules = query.all()
    db.close()
    return schedules

# Pobranie zamówień użytkownika
@query.field("getUserOrders")
def resolve_get_user_orders(_, info, user_id):
    db = SessionLocal()
    try:
        # Ładujemy zamówienia razem z relacjami do pojazdu przez relation
        orders = db.query(Order).options(
            joinedload(Order.status_history),
            joinedload(Order.driver),       
            joinedload(Order.relation).joinedload(Relation.vehicle) 
        ).filter(Order.user_id == user_id, Order.deleted_by_user == False).all()
        return orders
    finally:
        db.close()

# Pobranie zamówień przewoźnika
@query.field("getCarrierOrders")
def resolve_get_carrier_orders(_, info, owner_id):
    db = SessionLocal()
    
    try:
        # Subquery for vehicle_id
        vehicles_subquery = select(Vehicle.vehicle_id).filter(Vehicle.owner_id == owner_id).subquery()
        
        # Subquery for relation_id (instead of schedule_id)
        relations_subquery = select(Relation.relation_id).filter(
            Relation.vehicle_id.in_(select(vehicles_subquery.c.vehicle_id))
        ).subquery()
        
        # Fetch orders with the new relation_id subquery and loading options
        orders = db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.relation).joinedload(Relation.vehicle),  # Load relation and associated vehicle
            joinedload(Order.driver).joinedload(Driver.owner),
            joinedload(Order.status_history)
        ).filter(
            Order.relation_id.in_(select(relations_subquery.c.relation_id)),  # Use relation_id instead of schedule_id
            Order.deleted_by_carrier.is_(False)
        ).all()
        
        # Processing results
        orders_data = []
        for order in orders:
            order_data = {
                "order_id": order.order_id,
                "order_code": order.order_code,
                "user": order.user,
                "start_stop": order.start_stop,
                "end_stop": order.end_stop,
                "departure_time": order.departure_time,
                "arrival_time": order.arrival_time,
                "status": order.status,
                "size": order.size,
                "created_at": order.created_at,
                "relation": order.relation,  # Now relation instead of schedule
                "driver": order.driver,
                "status_history": order.status_history,
                "deleted_by_carrier": order.deleted_by_carrier
            }
            orders_data.append(order_data)
    
    finally:
        db.close()
    
    return orders_data

# Pobranie statystyk przewoźnika
@query.field("getCarrierStats")
def resolve_get_carrier_stats(_, info, owner_id):
    db = SessionLocal()
    
    # Zliczanie wykonanych zleceń (status: 'Dostarczona')
    completed_orders = db.query(func.count(Order.order_id)).filter(
        Order.status == 'Dostarczona',
        Order.relation.has(Relation.vehicle.has(Vehicle.owner_id == owner_id))
    ).scalar()
    
    # Zliczanie nowych zleceń (status: 'Nadana')
    new_orders = db.query(func.count(Order.order_id)).filter(
        Order.status == 'Nadana',
        Order.relation.has(Relation.vehicle.has(Vehicle.owner_id == owner_id))
    ).scalar()

    db.close()
    
    return {
        "completedOrders": completed_orders or 0,
        "totalEarnings": 0.0,
        "newOrders": new_orders or 0  # Zwracamy liczbę nowych zleceń
    }


# Pobranie wszystkich przystanków
@query.field("getAllStops")
def resolve_get_all_stops(_, info):
    db = SessionLocal()
    stops = db.query(Schedule.stop).distinct().all()
    db.close()
    return [stop[0] for stop in stops]

# Pobranie dostępnych przystanków na podstawie początkowego przystanku
@query.field("getAvailableStops")
def resolve_get_available_stops(_, info, startStop):
    db = SessionLocal()

    # Znajdujemy wszystkie rozkłady (schedules) z przystankiem początkowym
    schedules = db.query(Schedule).filter(Schedule.stop == startStop).all()

    available_stops = set()  # Używamy zbioru, aby uniknąć duplikatów

    # Przechodzimy przez każdy z rozkładów
    for schedule in schedules:
        relation_id = schedule.relation_id  # Pobieramy relację

        if relation_id is None:
            continue  # Jeśli brak przypisanej relacji, przechodzimy do następnego rozkładu

        # Pobieramy wszystkie przystanki tego samego pojazdu w tej samej relacji
        vehicle_schedules = (
            db.query(Schedule)
            .filter(Schedule.vehicle_id == schedule.vehicle_id)
            .filter(Schedule.relation_id == relation_id)  # Filtrowanie przystanków w tej samej relacji
            .filter(Schedule.order_number > schedule.order_number)  # Filtrujemy tylko te, które są później
            .order_by(Schedule.order_number)
            .all()
        )

        # Dodajemy te przystanki do zbioru (unikamy duplikatów)
        for vs in vehicle_schedules:
            available_stops.add((vs.stop, vs.order_number))  # Dodajemy tuple do zbioru

    db.close()

    # Zamieniamy zbiór z powrotem na listę i sortujemy po order_number
    available_stops = sorted(list(available_stops), key=lambda x: x[1])

    # Konwersja do formatu z przystankiem i order_number
    return [{"stop": stop, "order_number": order_number} for stop, order_number in available_stops]

# Pobranie dostępnych kursów na podstawie początkowego i końcowego przystanku oraz rozmiaru przesyłki
@query.field("getAvailableCourses")
def resolve_get_available_courses(_, info, startStop, endStop, size, todayDelivery):
    db = SessionLocal()
    try:
        # Pobieramy wszystkie rozkłady, które zawierają przystanek startowy
        start_schedules = db.query(Schedule).filter(Schedule.stop == startStop).all()

        available_courses = []
        now = datetime.now()

        for schedule in start_schedules:
            # Pobieramy relację (trasę), do której należy kurs
            relation = schedule.relation
            if not relation:
                continue  # Jeśli brak relacji, przejdź do następnego

            # Sprawdzamy, czy w tej samej trasie istnieje przystanek końcowy
            vehicle_schedules = (
                db.query(Schedule)
                .filter(Schedule.vehicle_id == schedule.vehicle_id, Schedule.relation_id == relation.relation_id)
                .order_by(Schedule.order_number)
                .all()
            )

            # Szukamy przystanku końcowego w tej samej relacji
            stop_found = False
            for vs in vehicle_schedules:
                if vs.stop == startStop:
                    stop_found = True  # Znalazłem przystanek startowy, teraz szukam końcowego
                if stop_found and vs.stop == endStop:  # Znalazłem przystanek końcowy

                    # Ustal datę, dla której sprawdzamy kurs (dzisiaj lub jutro)
                    departure_date = now.date() if todayDelivery else (now + timedelta(days=1)).date()

                    # Sprawdzamy, czy różnica czasu między obecnym czasem a czasem odjazdu jest większa niż 2 godziny
                    if todayDelivery and not can_send_today(schedule.departure_time.strftime('%Y-%m-%d %H:%M:%S'), now):
                        continue

                    # Obliczanie sumy zajętej pojemności na dany dzień i relację
                    orders_for_relation = db.query(Order).filter(
                        Order.relation_id == relation.relation_id,
                        func.date(Order.departure_time) == departure_date,  # Filtrujemy zamówienia na konkretną datę
                        Order.status.in_(['Nadana', 'Przypisano kierowcę', 'Przyjęta od klienta'])
                    ).all()

                    total_capacity_used = 0
                    for order in orders_for_relation:
                        if order.size == 'S':
                            total_capacity_used += 1
                        elif order.size == 'M':
                            total_capacity_used += 2
                        elif order.size == 'L':
                            total_capacity_used += 3

                    # Sprawdzenie, ile miejsc jest jeszcze dostępnych
                    vehicle = schedule.vehicle
                    required_capacity = 1 if size == 'S' else 2 if size == 'M' else 3

                    # Logi do debugowania
                    print(f"Sprawdzam kurs: {schedule.schedule_id}, Pojazd: {vehicle.vehicle_id}, Całkowita zajęta pojemność: {total_capacity_used}, Wymagana pojemność: {required_capacity}, Pojemność pojazdu: {vehicle.capacity}")

                    if total_capacity_used + required_capacity > vehicle.capacity:
                        print(f"Pojazd jest pełny: total_capacity_used={total_capacity_used}, required_capacity={required_capacity}, vehicle_capacity={vehicle.capacity}")
                        continue  # Pojazd nie ma wystarczającej pojemności

                    # Obliczanie ceny kursu na podstawie przystanków
                    price_list = db.query(PriceList).filter(PriceList.relation_id == relation.relation_id).first()
                    if price_list:
                        stops_count = abs(vs.order_number - schedule.order_number)
                        total_price = price_list.base_price + (stops_count * price_list.price_per_stop)
                    else:
                        total_price = 0

                    # Pobieramy informacje o pojeździe i właścicielu
                    owner = vehicle.owner

                    available_courses.append({
                        "schedule_id": vs.schedule_id,
                        "relation_id": relation.relation_id,  # Dodaj relation_id do zwracanego kursu
                        "vehicle_id": vs.vehicle_id,
                        "company_name": owner.company_name,
                        "start_stop": startStop,
                        "end_stop": endStop,
                        "departure_time": schedule.departure_time.strftime('%H:%M'),
                        "arrival_time": vs.arrival_time.strftime('%H:%M'),
                        "total_price": total_price
                    })
                    break
        return available_courses
    finally:
        db.close()

# Pobranie wszystkich użytkowników
@query.field("getAllUsers")
def resolve_get_all_users(_, info):
    session = SessionLocal()
    try:
        users = session.query(User).options(joinedload(User.wallet)).all()
        return users
    finally:
        session.close()

# Aktualizacja użytkownika
@mutation.field("updateUser")
def resolve_update_user(_, info, user_id, email, user_type, company_name=None, postal_code=None, city=None, street=None, first_name=None, last_name=None, phone_number=None):
    session = SessionLocal()
    user = session.query(User).filter(User.user_id == user_id).first()
    if user:
        user.email = email
        user.company_name = company_name
        user.postal_code = postal_code
        user.city = city
        user.street = street
        user.first_name = first_name
        user.last_name = last_name
        user.user_type = user_type
        user.phone_number = phone_number
        session.commit()
        session.refresh(user)
        session.close()
        return user
    session.close()
    return None

@mutation.field("createDriver")
def resolve_create_driver(_, info, first_name, last_name, pin_code, owner_id):
    db = SessionLocal()
    driver_id_code = generate_driver_id_code(db)
    driver = Driver(
        first_name=first_name,
        last_name=last_name,
        driver_id_code=driver_id_code,
        pin_code=pin_code,
        owner_id=owner_id
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    db.close()
    return driver

@mutation.field("deleteDriver")
def resolve_delete_driver(_, info, driver_id):
    db = SessionLocal()
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if driver:
        db.delete(driver)
        db.commit()
        db.close()
        return "Driver deleted"
    db.close()
    return "Driver not found"

@query.field("getCarrierDrivers")
def resolve_get_carrier_drivers(_, info, owner_id):
    db = SessionLocal()
    drivers = db.query(Driver).filter(Driver.owner_id == owner_id).all()
    db.close()
    return drivers

@mutation.field("loginDriver")
def resolve_login_driver(_, info, id, pin):
    db = SessionLocal()
    driver = db.query(Driver).filter(Driver.driver_id_code == id, Driver.pin_code == pin).first()
    db.close()
    if driver:
        return {"message": "User logged in", "user_id": driver.driver_id, "token": "some-token-value"}
    else:
        return {"message": "Invalid credentials", "user_id": None, "token": ""}
    
@mutation.field("changeDriverPin")
def resolve_change_driver_pin(_, info, driver_id, new_pin_code):
    db = SessionLocal()
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if driver:
        driver.pin_code = new_pin_code
        db.commit()
        db.refresh(driver)
        db.close()
        return {"message": "PIN changed successfully"}
    db.close()
    return {"message": "Driver not found"}

# Przypisanie kierowcy do zamówienia
@mutation.field("assignDriverToOrder")
def resolve_assign_driver_to_order(_, info, order_id, driver_id):
    db = SessionLocal()
    try:
        order = db.query(Order).options(joinedload(Order.driver)).filter(Order.order_id == order_id).first()
        if not order:
            raise Exception("Order not found")

        driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
        if not driver:
            raise Exception("Driver not found")

        order.driver = driver
        order.status = "Przypisano kierowcę"

        # Generowanie 4-cyfrowych kodów nadania i odbioru
        order.pickup_code = generate_random_code()
        order.delivery_code = generate_random_code()

        # Dodanie nowego wpisu w historii statusów zamówienia
        status_history = OrderStatusHistory(order_id=order_id, status=order.status)
        db.add(status_history)

        db.commit()
        db.refresh(order)
        
        return order
    except Exception as e:
        db.rollback()
        raise Exception(f"Error assigning driver to order: {e}")
    finally:
        db.close()

@query.field("trackShipment")
def resolve_track_shipment(_, info, order_code):
    db = SessionLocal()  # Otwórz sesję
    try:
        # Użyj joinedload, aby załadować status_history wraz z Order
        order = db.query(Order).options(joinedload(Order.status_history)).filter(Order.order_code == order_code).first()
        
        if not order:
            raise Exception("Order not found")
        
        return order
    finally:
        db.close()

@query.field("getDriverProfile")
def resolve_get_driver_profile(_, info, driver_id):
    db = SessionLocal()
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    db.close()
    if driver:
        return driver
    raise Exception("Driver not found")

# Query to get orders for a driver
@query.field("getDriverOrders")
def resolve_get_driver_orders(_, info, driver_id):
    session = SessionLocal()
    try:
        # Używamy .in_() do filtrowania zamówień z określonymi statusami
        orders = session.query(Order).filter(
            Order.driver_id == driver_id,
            Order.status.in_(['Przypisano kierowcę', 'Przyjęta od klienta'])
        ).all()
        return orders
    finally:
        session.close()

# Mutation to accept a shipment
@mutation.field("acceptShipment")
def resolve_accept_shipment(_, info, order_code, pickup_code):
    session = SessionLocal()
    try:
        order = session.query(Order).filter(Order.order_code == order_code).first()

        if not order:
            return {"status": "Order not found"}

        if order.pickup_code != pickup_code:
            return {"status": "Błędny kod"}

        if order.status != "Przypisano kierowcę":
            return {"status": "Order is not ready for pickup"}

        # Aktualizacja statusu zamówienia
        order.status = "Przyjęta od klienta"
        
        # Tworzenie nowego wpisu w historii statusów zamówienia
        status_history = OrderStatusHistory(order_id=order.order_id, status=order.status)
        session.add(status_history)

        session.commit()

        session.refresh(order)  # Upewnij się, że instancja Order jest nadal związana z sesją przed zakończeniem

        return {"status": order.status}
    finally:
        session.close()

# Mutation to deliver a shipment
@mutation.field("deliverShipment")
def resolve_deliver_shipment(_, info, order_code, delivery_code):
    session = SessionLocal()
    try:
        order = session.query(Order).filter(Order.order_code == order_code).first()
        
        if not order:
            return {"status": "Order not found"}

        if order.delivery_code != delivery_code:
            return {"status": "Błędny kod"}

        if order.status != "Przyjęta od klienta":
            return {"status": "Order is not ready for delivery"}

        # Aktualizacja statusu zamówienia
        order.status = "Dostarczona"
        
        # Tworzenie nowego wpisu w historii statusów zamówienia
        status_history = OrderStatusHistory(order_id=order.order_id, status=order.status)
        session.add(status_history)

        # Przekazanie środków przewoźnikowi
        carrier_wallet = order.relation.vehicle.owner.wallet
        carrier_wallet.balance += order.price  # Przekazanie zapisanej kwoty

        session.commit()

        return {"status": order.status}
    except Exception as e:
        session.rollback()
        return {"status": f"Error: {str(e)}"}
    finally:
        session.close()

@query.field("getAllOrders")
def resolve_get_all_orders(_, info):
    session = SessionLocal()
    try:
        orders = session.query(Order).options(
            joinedload(Order.user),  # Załaduj relację user
            joinedload(Order.driver).joinedload(Driver.owner),  # Załaduj relację driver i jego owner w jednym zapytaniu
            joinedload(Order.relation).joinedload(Relation.vehicle).joinedload(Vehicle.owner)  # Dodaj to, aby załadować schedule, vehicle i jego owner
        ).all()
        return orders
    finally:
        session.close()

@mutation.field("deleteVehicle")
def resolve_delete_vehicle(_, info, vehicle_id):
    session = SessionLocal()
    try:
        # Sprawdź, czy pojazd jest przypisany do rozkładu jazdy
        schedules = session.query(Schedule).filter(Schedule.vehicle_id == vehicle_id).all()
        if schedules:
            return "Cannot delete vehicle with schedules associated"
        
        # Jeśli nie jest przypisany, usuń pojazd
        vehicle = session.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
        if vehicle:
            session.delete(vehicle)
            session.commit()
            return "Vehicle deleted successfully"
        else:
            return "Vehicle not found"
    except Exception as e:
        session.rollback()
        return str(e)
    finally:
        session.close()

@mutation.field("deleteSchedule")
def resolve_delete_schedule(_, info, schedule_id):
    session = SessionLocal()
    try:
        # Sprawdź, czy przystanek istnieje
        schedule = session.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
        if schedule:
            session.delete(schedule)
            session.commit()
            return "Schedule deleted successfully"
        else:
            return "Schedule not found"
    except Exception as e:
        session.rollback()
        return str(e)
    finally:
        session.close()

@mutation.field("deleteAllSchedules")
def resolve_delete_all_schedules(_, info, relation_id):
    session = SessionLocal()
    try:
        # Pobierz wszystkie przystanki dla relacji
        schedules = session.query(Schedule).filter(Schedule.relation_id == relation_id).all()

        if schedules:
            for schedule in schedules:
                session.delete(schedule)
            session.commit()
            return True  # Operacja zakończona sukcesem
        else:
            return False  # Brak przystanków do usunięcia
    except Exception as e:
        session.rollback()
        print(f"Error occurred: {str(e)}")
        return False  # Błąd operacji
    finally:
        session.close()

@mutation.field("updateScheduleOrder")
def resolve_update_schedule_order(_, info, schedule_id, new_order_number):
    session = SessionLocal()
    try:
        schedule = session.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
        if schedule:
            schedule.order_number = new_order_number
            session.commit()
            session.refresh(schedule)
            return schedule
        else:
            return None
    except Exception as e:
        session.rollback()
        return str(e)
    finally:
        session.close()

# Resolver dla `getVehicleRelations`
@query.field("getVehicleRelations")
def resolve_get_vehicle_relations(_, info, vehicle_id):
    db = SessionLocal()
    relations = db.query(Relation).filter(Relation.vehicle_id == vehicle_id).all()
    db.close()
    return relations

# Resolver dla `createRelation`
@mutation.field("createRelation")
def resolve_create_relation(_, info, vehicle_id, relation_name):
    db = SessionLocal()
    try:
        relation = Relation(relation_name=relation_name, vehicle_id=vehicle_id)
        db.add(relation)
        db.commit()
        db.refresh(relation)
        logger.info(f"Relation '{relation_name}' created for vehicle {vehicle_id}.")
        return relation
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating relation: {e}")
        return None
    finally:
        db.close()

@mutation.field("deleteRelation")
def resolve_delete_relation(_, info, vehicle_id, relation_id):
    db = SessionLocal()
    try:
        # Znajdź relację na podstawie `relation_id` i `vehicle_id`
        relation = db.query(Relation).filter(Relation.relation_id == relation_id, Relation.vehicle_id == vehicle_id).first()
        if relation:
            # Usunięcie przystanków powiązanych z relacją
            schedules = db.query(Schedule).filter(Schedule.relation_id == relation_id).all()
            for schedule in schedules:
                schedule.relation_id = None  # Usuń ID relacji z przystanków
           
            # Usuń powiązaną pozycję w tabeli `PriceList`
            pricelist = db.query(PriceList).filter(PriceList.relation_id == relation_id).first()
            if pricelist:
                db.delete(pricelist)

            # Usuń relację
            db.delete(relation)
            db.commit()
            return "Relacja usunięta wraz z cenami"
        else:
            return "Relacja nie została znaleziona"
    except Exception as e:
        db.rollback()
        return str(e)
    finally:
        db.close()

@mutation.field("assignScheduleToRelation")
def resolve_assign_schedule_to_relation(_, info, schedule_id, relation_id):
    session = SessionLocal()
    try:
        schedule = session.query(Schedule).filter(Schedule.schedule_id == schedule_id).first()
        if schedule:
            schedule.relation_id = relation_id
            session.commit()
            session.refresh(schedule)
            return schedule
        else:
            raise Exception("Schedule not found")
    except Exception as e:
        session.rollback()
        return str(e)
    finally:
        session.close()

@mutation.field("addShipmentProblem")
def resolve_add_shipment_problem(_, info, order_id, user_id, description):
    db = SessionLocal()
    try:
        # Dodaj problem przesyłki
        problem = ShipmentProblem(order_id=order_id, user_id=user_id, description=description, status='Interwencja')
        db.add(problem)

        # Zaktualizuj status zamówienia na 'Interwencja'
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if order:
            order.status = 'Interwencja'

            # Dodanie nowego wpisu do tabeli historii statusów
            status_history = OrderStatusHistory(order_id=order_id, status='Interwencja')
            db.add(status_history)
        else:
            raise Exception("Order not found")

        db.commit()  # Zapisz wszystkie zmiany
        db.refresh(problem)
        return problem
    except Exception as e:
        db.rollback()
        raise Exception(f"Error adding shipment problem: {e}")
    finally:
        db.close()

@mutation.field("deleteShipmentProblem")
def resolve_delete_shipment_problem(_, info, problem_id):
    db = SessionLocal()
    try:
        # Znajdź problem przesyłki na podstawie problem_id
        problem = db.query(ShipmentProblem).filter(ShipmentProblem.problem_id == problem_id).first()
        if problem:
            # Usuń problem przesyłki
            db.delete(problem)
            db.commit()
            return "Problem przesyłki został usunięty"
        else:
            return "Problem przesyłki nie został znaleziony"
    except Exception as e:
        db.rollback()
        return f"Błąd podczas usuwania problemu przesyłki: {str(e)}"
    finally:
        db.close()

@mutation.field("deleteShipmentHistory")
def resolve_delete_shipment_history(_, info, order_id):
    db = SessionLocal()
    try:
        # Usuń wpisy problemów przesyłek powiązane z zamówieniem
        db.query(ShipmentProblem).filter(ShipmentProblem.order_id == order_id).delete()

        # Usuń wpisy historii statusu powiązane z zamówieniem
        db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order_id).delete()

        # Znajdź i usuń zamówienie
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if order:
            db.delete(order)
            db.commit()
            return "Order removed from history"
        else:
            raise Exception("Order not found")
    except Exception as e:
        db.rollback()
        raise Exception(f"Error deleting shipment history: {e}")
    finally:
        db.close()

@query.field("getUserShipmentProblems")
def resolve_get_user_shipment_problems(_, info, user_id):
    db = SessionLocal()
    try:
        problems = db.query(ShipmentProblem).filter(ShipmentProblem.user_id == user_id).all()
        return problems
    finally:
        db.close()

@mutation.field("addOrderStatusHistory")
def resolve_add_order_status_history(_, info, order_id, status):
    db = SessionLocal()
    try:
        # Znajdź zamówienie po order_id, aby upewnić się, że istnieje
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            raise Exception("Order not found")

        # Dodaj nowy wpis do historii statusów zamówienia
        status_history = OrderStatusHistory(order_id=order_id, status=status, changed_at=datetime.utcnow())
        db.add(status_history)
        db.commit()

        # Odświeżenie obiektu status_history, aby uzyskać najnowsze dane
        db.refresh(status_history)
        return status_history
    except Exception as e:
        db.rollback()
        raise Exception(f"Error adding order status history: {e}")
    finally:
        db.close()

@mutation.field("removeOrderFromUserHistory")
def resolve_remove_order_from_user_history(_, info, order_id, user_id):
    db = SessionLocal()
    try:
        # Logika do usunięcia przesyłki z historii użytkownika
        order = db.query(Order).filter(Order.order_id == order_id, Order.user_id == user_id).first()
        if order:
            # Dodajemy pole "deleted_by_user" do modelu Order w bazie danych, aby oznaczyć usunięcie przez użytkownika
            order.deleted_by_user = True
            db.commit()
            return "Order removed from user history"
        else:
            return "Order not found for this user"
    except Exception as e:
        db.rollback()
        raise Exception(f"Error removing order from user history: {e}")
    finally:
        db.close()

@mutation.field("removeOrderFromCarrierHistory")
def resolve_remove_order_from_carrier_history(_, info, order_id, carrier_id):
    db = SessionLocal()
    try:
        # Logika do usunięcia przesyłki z historii przewoźnika
        order = db.query(Order).join(Relation).join(Vehicle).filter(Order.order_id == order_id, Vehicle.owner_id == carrier_id).first()
        if order:
            # Dodajemy pole "deleted_by_carrier" do modelu Order w bazie danych, aby oznaczyć usunięcie przez przewoźnika
            order.deleted_by_carrier = True
            db.commit()
            return "Order removed from carrier history"
        else:
            return "Order not found for this carrier"
    except Exception as e:
        db.rollback()
        raise Exception(f"Error removing order from carrier history: {e}")
    finally:
        db.close()

@mutation.field("updateOrderDetails")
def resolve_update_order_details(_, info, order_id, pickup_code, delivery_code, deleted_by_user, deleted_by_carrier, status=None):
    session = SessionLocal()
    try:
        order = session.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            raise Exception("Order not found")

        # Aktualizacja szczegółów zamówienia
        order.pickup_code = pickup_code
        order.delivery_code = delivery_code
        order.deleted_by_user = deleted_by_user
        order.deleted_by_carrier = deleted_by_carrier

        # Aktualizacja statusu zamówienia, jeśli podano
        if status:
            order.status = status
            # Tworzenie nowego wpisu w historii statusów zamówienia
            status_history = OrderStatusHistory(order_id=order_id, status=status)
            session.add(status_history)

        session.commit()
        session.refresh(order)
        return order
    except Exception as e:
        session.rollback()
        raise Exception(f"Error updating order details: {e}")
    finally:
        session.close()

@query.field("getInterventionOrders")
def resolve_get_intervention_orders(_, info):
    db = SessionLocal()
    try:
        # Pobierz zamówienia, które mają problemy i status 'Interwencja'
        intervention_orders = db.query(Order).options(
            joinedload(Order.problems),
            joinedload(Order.user),          # Załaduj dane użytkownika (klienta)
            joinedload(Order.relation).joinedload(Relation.vehicle).joinedload(Vehicle.owner)  # Załaduj dane przewoźnika
        ).join(ShipmentProblem).filter(
            ShipmentProblem.status == 'Interwencja'
        ).all()

        # Przygotowanie wyników
        results = []
        for order in intervention_orders:
            problem = order.problems[0]  # Przyjmujemy, że jest jeden problem na zamówienie
            customer = order.user
            carrier = order.relation.vehicle.owner
            results.append({
                "order": order,
                "problem": problem,
                "customer": customer,
                "carrier": carrier
            })
        return results
    except Exception as e:
        raise Exception(f"Error fetching intervention orders: {e}")
    finally:
        db.close()

@mutation.field("createOrUpdatePriceList")
def resolve_create_or_update_price_list(_, info, relation_id, base_price, price_per_stop):
    db = SessionLocal()
    price_list = db.query(PriceList).filter(PriceList.relation_id == relation_id).first()

    if not price_list:
        price_list = PriceList(relation_id=relation_id, base_price=base_price, price_per_stop=price_per_stop)
        db.add(price_list)
    else:
        price_list.base_price = base_price
        price_list.price_per_stop = price_per_stop

    db.commit()
    db.refresh(price_list)
    db.close()
    return price_list

@query.field("getPriceList")
def resolve_get_price_list(_, info, relation_id):
    db = SessionLocal()
    pricelist = db.query(PriceList).filter(PriceList.relation_id == relation_id).first()  # Użyj poprawnej nazwy klasy PriceList
    db.close()
    if pricelist:
        return {
            "base_price": pricelist.base_price,
            "price_per_stop": pricelist.price_per_stop
        }
    return None

@query.field("getUserRelations")
def resolve_get_user_relations(_, info, owner_id):
    db = SessionLocal()
    try:
        # Pobierz relacje powiązane z pojazdami danego właściciela (owner_id)
        relations = db.query(Relation).join(Vehicle).filter(Vehicle.owner_id == owner_id).all()
        return relations
    finally:
        db.close()
