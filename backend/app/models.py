from sqlalchemy import Boolean, Column, Integer, String, DateTime, func, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import sqlalchemy as sa

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)
    phone_number = Column(String(15), nullable=True)
    company_name = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    street = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    user_type = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    vehicles = relationship("Vehicle", order_by="Vehicle.vehicle_id", back_populates="owner")
    drivers = relationship("Driver", order_by="Driver.driver_id", back_populates="owner")
    orders = relationship("Order", order_by="Order.order_id", back_populates="user")
    shipment_problems = relationship("ShipmentProblem", order_by="ShipmentProblem.problem_id", back_populates="user")

class Wallet(Base):
    __tablename__ = 'wallets'
    wallet_id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False, default=0.0)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    user = relationship("User", back_populates="wallet")

class Vehicle(Base):
    __tablename__ = 'vehicles'
    vehicle_id = Column(Integer, primary_key=True, index=True)
    model = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    registration_number = Column(String(20), nullable=False)
    owner_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    owner = relationship("User", back_populates="vehicles")
    schedules = relationship("Schedule", order_by="Schedule.schedule_id", back_populates="vehicle")
    relations = relationship("Relation", order_by="Relation.relation_id", back_populates="vehicle")

class Relation(Base):
    __tablename__ = 'relations'
    relation_id = Column(Integer, primary_key=True, index=True)
    relation_name = Column(String(100), nullable=False)
    vehicle_id = Column(Integer, ForeignKey('vehicles.vehicle_id'), nullable=False)

    vehicle = relationship("Vehicle", back_populates="relations")
    schedules = relationship("Schedule", order_by="Schedule.schedule_id", back_populates="relation")
    price_list = relationship("PriceList", back_populates="relation", uselist=False)
    orders = relationship("Order", back_populates="relation")

class Schedule(Base):
    __tablename__ = 'schedules'
    schedule_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.vehicle_id'), nullable=False)
    stop = Column(String(100), nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    order_number = Column(Integer, nullable=False, default=1)
    relation_id = Column(Integer, ForeignKey('relations.relation_id'), nullable=True)
    vehicle = relationship("Vehicle", back_populates="schedules")
    relation = relationship("Relation", back_populates="schedules")

class Order(Base):
    __tablename__ = 'orders'
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    relation_id = Column(Integer, ForeignKey('relations.relation_id'), nullable=False)
    driver_id = Column(Integer, ForeignKey('drivers.driver_id'), nullable=True)
    status = Column(String(20), nullable=False, default='Paid')
    size = Column(String(10), nullable=False)
    start_stop = Column(String(100), nullable=False)
    end_stop = Column(String(100), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    order_code = Column(String(14), nullable=False)
    pickup_code = Column(String(4), nullable=False, default="0000")
    delivery_code = Column(String(4), nullable=False, default="0000")
    deleted_by_user = Column(Boolean, default=False)
    deleted_by_carrier = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="orders")
    relation = relationship("Relation", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    problems = relationship("ShipmentProblem", order_by="ShipmentProblem.problem_id", back_populates="order")
    status_history = relationship("OrderStatusHistory", order_by="OrderStatusHistory.change_id", back_populates="order", lazy="joined")

class Driver(Base):
    __tablename__ = 'drivers'
    driver_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    driver_id_code = Column(String(9), nullable=False, unique=True)
    pin_code = Column(String(6), nullable=False)
    owner_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    owner = relationship("User", back_populates="drivers")
    orders = relationship("Order", order_by="Order.order_id", back_populates="driver")

class ShipmentProblem(Base):
    __tablename__ = 'shipment_problems'
    problem_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.order_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default='Interwencja')
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="problems")
    user = relationship("User", back_populates="shipment_problems")

class OrderStatusHistory(Base):
    __tablename__ = 'order_status_history'
    change_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.order_id'), nullable=False)
    status = Column(String(20), nullable=False)
    changed_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="status_history", lazy="joined")

class PriceList(Base):
    __tablename__ = 'price_list'
    relation_id = Column(Integer, ForeignKey('relations.relation_id'), primary_key=True)
    base_price = Column(Float, nullable=False)
    price_per_stop = Column(Float, nullable=False)

    relation = relationship("Relation", back_populates="price_list")

# Relacje między tabelami
User.drivers = relationship("Driver", order_by=Driver.driver_id, back_populates="owner")
User.vehicles = relationship("Vehicle", order_by=Vehicle.vehicle_id, back_populates="owner")
User.orders = relationship("Order", order_by=Order.order_id, back_populates="user")
User.shipment_problems = relationship("ShipmentProblem", order_by=ShipmentProblem.problem_id, back_populates="user")
Vehicle.schedules = relationship("Schedule", order_by=Schedule.schedule_id, back_populates="vehicle")
Vehicle.relations = relationship("Relation", order_by=Relation.relation_id, back_populates="vehicle")
Relation.schedules = relationship("Schedule", order_by=Schedule.schedule_id, back_populates="relation")
Relation.orders = relationship("Order", order_by=Order.order_id, back_populates="relation")
Order.driver = relationship("Driver", back_populates="orders")
Order.problems = relationship("ShipmentProblem", order_by=ShipmentProblem.problem_id, back_populates="order")
Order.status_history = relationship("OrderStatusHistory", order_by=OrderStatusHistory.change_id, back_populates="order")
Order.relation = relationship("Relation", back_populates="orders")
Driver.orders = relationship("Order", order_by=Order.order_id, back_populates="driver")
Relation.price_list = relationship("PriceList", uselist=False, back_populates="relation")