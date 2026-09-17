from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class BatchBase(BaseModel):
    batch_number: str
    quantity_in_stock: int
    mrp_per_unit_inr: float
    gst_percent: float = 12.0
    manufacturing_date: str
    expiry_date: str
    supplier_state_code: Optional[str] = "DL"

class BatchCreate(BatchBase):
    medicine_id: int

class BatchOut(BatchBase):
    id: int
    medicine_id: int
    stock_status: str
    days_to_expiry: int

    class Config:
        from_attributes = True

class MedicineBase(BaseModel):
    medicine_name: str
    generic_salt: str
    category: str
    unit_type: str
    manufacturer: str
    prescription_required_schedule_h: bool = False
    storage_condition: Optional[str] = "Store in a cool dry place"
    reorder_threshold: int = 50

class MedicineCreate(MedicineBase):
    pass

class MedicineOut(MedicineBase):
    id: int
    sellable_stock: int
    total_stock_all_batches: int
    reorder_threshold: int
    batches: List[BatchOut] = []

    class Config:
        from_attributes = True

class DispenseRequest(BaseModel):
    medicine_id: int
    requested_quantity: int = Field(..., gt=0)

class DispenseAllocationItem(BaseModel):
    batch_id: int
    batch_number: str
    expiry_date: str
    quantity_taken: int
    unit_price: float
    subtotal: float

class DispenseResponse(BaseModel):
    transaction_id: str
    medicine_name: str
    requested_quantity: int
    dispensed_quantity: int
    total_amount: float
    allocations: List[DispenseAllocationItem]
    dispensed_at: str

class DispenseLogOut(BaseModel):
    id: int
    transaction_id: str
    medicine_id: int
    medicine_name: str
    batch_id: int
    batch_number: str
    quantity_dispensed: int
    unit_price: float
    total_price: float
    batch_expiry_date: str
    dispensed_at: datetime

    class Config:
        from_attributes = True

class StockSearchQuery(BaseModel):
    query: str

class StockSearchResponse(BaseModel):
    query: str
    in_date_available: bool
    total_sellable_units: int
    matching_medicines_count: int
    results: List[MedicineOut]

class DashboardStats(BaseModel):
    total_medicines: int
    total_sellable_units: int
    total_expired_units: int
    inventory_value_inr: float
    expiring_soon_batches_count: int
    expired_batches_count: int
    total_dispensed_today: int
    pending_notifications_count: int
    current_system_date: str

# Level 1 — T2 Clock Schemas
class ClockRequest(BaseModel):
    date: Optional[str] = None         # Target YYYY-MM-DD
    advance_days: Optional[int] = None # Number of days to advance from current date

class ClockResponse(BaseModel):
    current_date: str
    flagged_expiring_soon: int
    quarantined_expired: int
    details: Dict[str, Any]

# Level 2 — T4 Messy Import Schemas
class MessyImportReport(BaseModel):
    imported: int
    deduped: int
    rejected: int
    details: Dict[str, Any]

# Level 3 — T1 Outbox Schemas
class NotificationOutboxOut(BaseModel):
    id: int
    medicine_id: int
    medicine_name: str
    current_stock: int
    threshold: int
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
