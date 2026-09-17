import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class SystemClock(Base):
    __tablename__ = "system_clock"

    id = Column(Integer, primary_key=True, index=True)
    current_date = Column(String, nullable=False) # YYYY-MM-DD

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, index=True, nullable=False)
    generic_salt = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    unit_type = Column(String)  # Tablet, Syrup, Capsule, Injection, etc.
    manufacturer = Column(String)
    prescription_required_schedule_h = Column(Boolean, default=False)
    storage_condition = Column(String, nullable=True)
    reorder_threshold = Column(Integer, default=50) # Level 3 — T1 Low-stock threshold

    batches = relationship("Batch", back_populates="medicine", cascade="all, delete-orphan")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    batch_number = Column(String, index=True, nullable=False)
    quantity_in_stock = Column(Integer, default=0)
    mrp_per_unit_inr = Column(Float, default=0.0)
    gst_percent = Column(Float, default=12.0)
    manufacturing_date = Column(String)  # YYYY-MM-DD
    expiry_date = Column(String, index=True)       # YYYY-MM-DD
    stock_status = Column(String, default="IN_STOCK") # IN_STOCK, EXPIRING_SOON, EXPIRED, DEPLETED, QUARANTINED
    supplier_state_code = Column(String, nullable=True)

    medicine = relationship("Medicine", back_populates="batches")

class DispenseLog(Base):
    __tablename__ = "dispense_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True, nullable=False)
    medicine_id = Column(Integer, nullable=False)
    medicine_name = Column(String, nullable=False)
    batch_id = Column(Integer, nullable=False)
    batch_number = Column(String, nullable=False)
    quantity_dispensed = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    batch_expiry_date = Column(String, nullable=False)
    dispensed_at = Column(DateTime, default=datetime.datetime.utcnow)

class NotificationOutbox(Base):
    __tablename__ = "notification_outbox"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, nullable=False)
    medicine_name = Column(String, nullable=False)
    current_stock = Column(Integer, nullable=False)
    threshold = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, SENT
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
