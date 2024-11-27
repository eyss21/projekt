from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User  # Upewnij się, że masz odpowiedni import User
from app.database import get_db  # Zakładam, że masz już konfigurację bazy danych w pliku database.py
import pytest

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://delivery_user:password@localhost/test"  # Użyj odpowiedniego URL do swojej bazy

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_database():
    # Tworzenie tabel
    Base.metadata.create_all(bind=engine)
    
    # Użytkownik testowy
    db = TestingSessionLocal()
    user_customer = User(
        email="customer@example.com",
        password="securepassword",
        user_type="customer",
        phone_number="123456789",
        first_name="John",
        last_name="Doe"
    )
    user_carrier = User(
        email="carrier@example.com",
        password="securepassword",
        user_type="carrier",
        phone_number="987654321",
        company_name="Carrier Co.",
        postal_code="12345",
        city="Cityville",
        street="Carrier Street"
    )
    
    db.add(user_customer)
    db.add(user_carrier)
    db.commit()
    db.close()

    yield

    # Usuwanie tabel po zakończeniu testów (jeśli chcesz zachować dane, można to pominąć)
    Base.metadata.drop_all(bind=engine)

def test_some_database_logic(setup_database):
    db = TestingSessionLocal()
    
    # Test: sprawdzenie, czy użytkownicy zostali dodani do bazy
    customers = db.query(User).filter(User.user_type == "customer").all()
    carriers = db.query(User).filter(User.user_type == "carrier").all()

    assert len(customers) == 1
    assert customers[0].email == "customer@example.com"
    
    assert len(carriers) == 1
    assert carriers[0].email == "carrier@example.com"

    db.close()
