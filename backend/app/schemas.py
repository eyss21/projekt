from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    company_name: str
    postal_code: str
    city: str
    street: str
