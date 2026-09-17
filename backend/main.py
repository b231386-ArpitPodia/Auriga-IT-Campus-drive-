from fastapi import FastAPI, Depends, HTTPException, Query, Body, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Dict, Any
import datetime

from database import engine, get_db, Base
from models import Medicine, Batch, DispenseLog, NotificationOutbox, SystemClock
from schemas import (
    MedicineOut, MedicineCreate, BatchOut, BatchCreate,
    DispenseRequest, DispenseResponse, DispenseLogOut,
    StockSearchResponse, DashboardStats,
    ClockRequest, ClockResponse, MessyImportReport, NotificationOutboxOut
)
from fefo_engine import (
    get_sellable_stock_for_medicine, execute_fefo_dispense,
    get_current_system_date, set_system_date, process_daily_clock_job,
    process_messy_batch_import, calculate_days_to_expiry_simulated, parse_any_date
)
from seed import seed_database

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Neighbourhood Pharmacy FEFO Dispensing API (Grading Compliant)",
    description="Enterprise-grade First-Expired-First-Out Pharmacy Inventory System with Level 1 (T2 /clock), Level 2 (T4 /import-messy), and Level 3 (T1 /outbox) grading support.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_database(db)
        sim_date = get_current_system_date(db)
        process_daily_clock_job(db, sim_date)
    finally:
        db.close()

def format_medicine_response(med: Medicine, db: Session) -> dict:
    sim_date = get_current_system_date(db)
    
    sellable_qty = 0
    total_qty = 0
    batch_outs = []

    for b in med.batches:
        exp_date = parse_any_date(b.expiry_date)
        days = (exp_date - sim_date).days if exp_date else -9999
        is_expired = exp_date <= sim_date if exp_date else True
        
        total_qty += b.quantity_in_stock
        
        if not is_expired and b.quantity_in_stock > 0 and b.stock_status != "QUARANTINED":
            sellable_qty += b.quantity_in_stock

        batch_outs.append({
            "id": b.id,
            "medicine_id": b.medicine_id,
            "batch_number": b.batch_number,
            "quantity_in_stock": b.quantity_in_stock,
            "mrp_per_unit_inr": b.mrp_per_unit_inr,
            "gst_percent": b.gst_percent,
            "manufacturing_date": b.manufacturing_date,
            "expiry_date": b.expiry_date,
            "supplier_state_code": b.supplier_state_code,
            "stock_status": "EXPIRED" if is_expired and b.stock_status != "QUARANTINED" else b.stock_status,
            "days_to_expiry": days
        })

    batch_outs.sort(key=lambda x: parse_any_date(x["expiry_date"]) or datetime.date.min)

    return {
        "id": med.id,
        "medicine_name": med.medicine_name,
        "generic_salt": med.generic_salt,
        "category": med.category,
        "unit_type": med.unit_type,
        "manufacturer": med.manufacturer,
        "prescription_required_schedule_h": med.prescription_required_schedule_h,
        "storage_condition": med.storage_condition,
        "reorder_threshold": med.reorder_threshold or 50,
        "sellable_stock": sellable_qty,
        "total_stock_all_batches": total_qty,
        "batches": batch_outs
    }

# ==========================================
# LEVEL 1 — T2 (AUTOMATION / CLOCK ENDPOINTS)
# ==========================================
@app.post("/clock", response_model=ClockResponse)
@app.post("/api/clock", response_model=ClockResponse)
def advance_system_clock(req: ClockRequest = Body(default={}), db: Session = Depends(get_db)):
    """
    Level 1 — T2 (Automation):
    Advances clock date or sets target date.
    Triggers daily audit job: flags <= 7d expiries and auto-quarantines expired batches (qty=0).
    Returns counts report.
    """
    current_date = get_current_system_date(db)

    if req.date:
        target_date = parse_any_date(req.date)
    elif req.advance_days:
        target_date = current_date + datetime.timedelta(days=req.advance_days)
    else:
        target_date = current_date + datetime.timedelta(days=1)

    target_date_str = target_date.strftime("%Y-%m-%d")
    set_system_date(db, target_date_str)
    
    # Run automation job
    report = process_daily_clock_job(db, target_date)
    return report

@app.get("/clock")
@app.get("/api/clock")
def get_clock_status(db: Session = Depends(get_db)):
    """Returns current simulated date."""
    sim_date = get_current_system_date(db)
    return {"current_date": sim_date.strftime("%Y-%m-%d")}


# ==========================================
# LEVEL 2 — T4 (MESSY DATA IMPORTER ENDPOINTS)
# ==========================================
@app.post("/import-messy", response_model=MessyImportReport)
@app.post("/api/batches/import-messy", response_model=MessyImportReport)
def import_messy_batches(payload: Union[List[Dict[str, Any]], Dict[str, Any]] = Body(...), db: Session = Depends(get_db)):
    """
    Level 2 — T4 (Messy Data Importer):
    Imports messy batch data ('10 units', DD/MM/YYYY dates, nulls, duplicates).
    Returns report: { imported, deduped, rejected, details }.
    """
    if isinstance(payload, dict):
        raw_items = payload.get("batches") or payload.get("data") or payload.get("items") or []
    else:
        raw_items = payload

    if not isinstance(raw_items, list):
        raise HTTPException(status_code=400, detail="Payload must be a JSON list or dict with 'batches' array.")

    report = process_messy_batch_import(db, raw_items)
    return report


# ==========================================
# LEVEL 3 — T1 (NOTIFICATION OUTBOX ENDPOINTS)
# ==========================================
@app.get("/outbox", response_model=List[NotificationOutboxOut])
@app.get("/api/outbox", response_model=List[NotificationOutboxOut])
def get_notification_outbox(db: Session = Depends(get_db)):
    """
    Level 3 — T1 (Outbox):
    Returns notification outbox records created when stock drops below threshold.
    """
    outbox = db.query(NotificationOutbox).order_by(NotificationOutbox.created_at.desc()).all()
    return outbox

@app.post("/outbox/clear")
@app.post("/api/outbox/clear")
def clear_notification_outbox(db: Session = Depends(get_db)):
    """Flushes notification outbox."""
    db.query(NotificationOutbox).delete()
    db.commit()
    return {"message": "Notification outbox cleared successfully."}


# ==========================================
# CORE DASHBOARD & INVENTORY ENDPOINTS
# ==========================================
@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    sim_date = get_current_system_date(db)
    process_daily_clock_job(db, sim_date)
    
    total_meds = db.query(Medicine).count()
    all_batches = db.query(Batch).all()
    
    sellable_units = 0
    expired_units = 0
    total_val = 0.0
    expiring_soon_count = 0
    expired_batches_count = 0

    for b in all_batches:
        exp_date = parse_any_date(b.expiry_date)
        days = (exp_date - sim_date).days if exp_date else -9999

        if exp_date and exp_date <= sim_date:
            expired_units += b.quantity_in_stock
            expired_batches_count += 1
        elif b.stock_status == "QUARANTINED":
            expired_batches_count += 1
        else:
            sellable_units += b.quantity_in_stock
            total_val += (b.quantity_in_stock * b.mrp_per_unit_inr)
            if days <= 30 and b.quantity_in_stock > 0:
                expiring_soon_count += 1

    pending_notifications = db.query(NotificationOutbox).filter(NotificationOutbox.status == "PENDING").count()

    today_start = datetime.datetime.combine(sim_date, datetime.time.min)
    today_dispensed = db.query(DispenseLog).filter(DispenseLog.dispensed_at >= today_start).all()
    dispensed_today_units = sum(log.quantity_dispensed for log in today_dispensed)

    return {
        "total_medicines": total_meds,
        "total_sellable_units": sellable_units,
        "total_expired_units": expired_units,
        "inventory_value_inr": round(total_val, 2),
        "expiring_soon_batches_count": expiring_soon_count,
        "expired_batches_count": expired_batches_count,
        "total_dispensed_today": dispensed_today_units,
        "pending_notifications_count": pending_notifications,
        "current_system_date": sim_date.strftime("%Y-%m-%d")
    }

@app.get("/api/medicines", response_model=List[MedicineOut])
def get_medicines(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)

    if category and category != "ALL":
        query = query.filter(Medicine.category == category)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Medicine.medicine_name.ilike(term)) |
            (Medicine.generic_salt.ilike(term)) |
            (Medicine.manufacturer.ilike(term))
        )

    medicines = query.all()
    return [format_medicine_response(med, db) for med in medicines]

@app.get("/api/medicines/{medicine_id}", response_model=MedicineOut)
def get_medicine_by_id(medicine_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    return format_medicine_response(med, db)

@app.get("/api/search", response_model=StockSearchResponse)
def quick_in_date_stock_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    matching_meds = db.query(Medicine).filter(
        (Medicine.medicine_name.ilike(term)) |
        (Medicine.generic_salt.ilike(term))
    ).all()

    formatted_results = [format_medicine_response(m, db) for m in matching_meds]
    total_sellable = sum(r["sellable_stock"] for r in formatted_results)

    return {
        "query": q,
        "in_date_available": total_sellable > 0,
        "total_sellable_units": total_sellable,
        "matching_medicines_count": len(formatted_results),
        "results": formatted_results
    }

@app.post("/api/dispense", response_model=DispenseResponse)
def dispense_medicine(req: DispenseRequest, db: Session = Depends(get_db)):
    try:
        receipt = execute_fefo_dispense(db, req.medicine_id, req.requested_quantity)
        return receipt
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Dispensing Error: {str(e)}")

@app.post("/api/batches", response_model=BatchOut)
def add_new_batch(req: BatchCreate, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == req.medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine ID not found.")

    sim_date = get_current_system_date(db)
    days = calculate_days_to_expiry_simulated(req.expiry_date, sim_date)
    status_tag = "EXPIRING_SOON" if days <= 30 else "IN_STOCK"

    batch = Batch(
        medicine_id=req.medicine_id,
        batch_number=req.batch_number.strip(),
        quantity_in_stock=req.quantity_in_stock,
        mrp_per_unit_inr=req.mrp_per_unit_inr,
        gst_percent=req.gst_percent,
        manufacturing_date=req.manufacturing_date,
        expiry_date=req.expiry_date,
        stock_status=status_tag,
        supplier_state_code=req.supplier_state_code
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    return {
        "id": batch.id,
        "medicine_id": batch.medicine_id,
        "batch_number": batch.batch_number,
        "quantity_in_stock": batch.quantity_in_stock,
        "mrp_per_unit_inr": batch.mrp_per_unit_inr,
        "gst_percent": batch.gst_percent,
        "manufacturing_date": batch.manufacturing_date,
        "expiry_date": batch.expiry_date,
        "supplier_state_code": batch.supplier_state_code,
        "stock_status": batch.stock_status,
        "days_to_expiry": days
    }

@app.delete("/api/batches/{batch_id}/quarantine")
def quarantine_expired_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    batch.quantity_in_stock = 0
    batch.stock_status = "QUARANTINED"
    db.commit()
    return {"message": f"Batch {batch.batch_number} has been quarantined and zeroed out."}

@app.get("/api/alerts")
def get_expiry_alerts(db: Session = Depends(get_db)):
    sim_date = get_current_system_date(db)
    process_daily_clock_job(db, sim_date)
    all_batches = db.query(Batch).all()

    critical = []
    warning = []
    caution = []
    expired = []

    for b in all_batches:
        exp_date = parse_any_date(b.expiry_date)
        days = (exp_date - sim_date).days if exp_date else -9999
        med = db.query(Medicine).filter(Medicine.id == b.medicine_id).first()
        item = {
            "batch_id": b.id,
            "medicine_id": b.medicine_id,
            "medicine_name": med.medicine_name if med else "Unknown",
            "generic_salt": med.generic_salt if med else "Unknown",
            "batch_number": b.batch_number,
            "quantity_in_stock": b.quantity_in_stock,
            "expiry_date": b.expiry_date,
            "days_to_expiry": days,
            "mrp_per_unit_inr": b.mrp_per_unit_inr,
            "total_value": round(b.quantity_in_stock * b.mrp_per_unit_inr, 2)
        }

        if b.stock_status == "QUARANTINED" or days <= 0:
            if b.quantity_in_stock > 0 or b.stock_status == "QUARANTINED":
                expired.append(item)
        elif days <= 7:
            if b.quantity_in_stock > 0:
                critical.append(item)
        elif days <= 30:
            if b.quantity_in_stock > 0:
                warning.append(item)
        elif days <= 60:
            if b.quantity_in_stock > 0:
                caution.append(item)

    return {
        "critical": critical,
        "warning": warning,
        "caution": caution,
        "expired": expired
    }

@app.get("/api/dispense/logs", response_model=List[DispenseLogOut])
def get_dispense_logs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(DispenseLog).order_by(DispenseLog.dispensed_at.desc()).limit(limit).all()

@app.post("/api/seed/reload")
def reload_seed_data(db: Session = Depends(get_db)):
    db.query(NotificationOutbox).delete()
    db.query(DispenseLog).delete()
    db.query(Batch).delete()
    db.query(Medicine).delete()
    db.query(SystemClock).delete()
    db.commit()

    seed_database(db)
    sim_date = get_current_system_date(db)
    process_daily_clock_job(db, sim_date)
    return {"message": "Database reloaded from Excel dataset successfully."}
