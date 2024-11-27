from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

def test_create_user():
    response = client.post("/users/", json={
        "email": "john@example.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "user_type": "customer"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "john@example.com"
