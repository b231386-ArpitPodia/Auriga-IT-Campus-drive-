import datetime
import re
import uuid
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import Medicine, Batch, DispenseLog, SystemClock, NotificationOutbox

def get_current_system_date(db: Session) -> datetime.date:
    clk = db.query(SystemClock).first()
    if clk and clk.current_date:
        try:
            return datetime.datetime.strptime(clk.current_date.strip(), "%Y-%m-%d").date()
        except Exception:
            pass
    return datetime.date.today()

def set_system_date(db: Session, target_date_str: str) -> datetime.date:
    target_date = parse_any_date(target_date_str)
    if not target_date:
        raise ValueError(f"Invalid date format: {target_date_str}")

    date_formatted = target_date.strftime("%Y-%m-%d")
    clk = db.query(SystemClock).first()
    if not clk:
        clk = SystemClock(current_date=date_formatted)
        db.add(clk)
    else:
        clk.current_date = date_formatted
    db.commit()
    return target_date

def parse_any_date(date_val: Any) -> Optional[datetime.date]:
    if not date_val:
        return None
    
    if isinstance(date_val, datetime.date):
        return date_val
    if isinstance(date_val, datetime.datetime):
        return date_val.date()

    d_str = str(date_val).strip()
    if not d_str or d_str.lower() in ['none', 'null', 'nan']:
        return None

    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y",
        "%Y/%m/%d", "%d.%m.%Y", "%Y-%m-%d %H:%M:%S"
    ]

    for fmt in formats:
        try:
            return datetime.datetime.strptime(d_str, fmt).date()
        except ValueError:
            continue

    return None

def parse_messy_quantity(qty_val: Any) -> Optional[int]:
    if qty_val is None:
        return None
    if isinstance(qty_val, (int, float)):
        return int(qty_val)

    s = str(qty_val).strip()
    match = re.search(r'\d+', s)
    if match:
        return int(match.group())
    return None

def calculate_days_to_expiry_simulated(expiry_date_str: str, sim_date: datetime.date) -> int:
    exp_date = parse_any_date(expiry_date_str)
    if not exp_date:
        return -9999
    return (exp_date - sim_date).days

def compute_batch_status_simulated(days_to_expiry: int, quantity: int) -> str:
    if quantity <= 0:
        return "DEPLETED"
    if days_to_expiry <= 0:
        return "EXPIRED"
    if days_to_expiry <= 7:
        return "EXPIRING_CRITICAL"
    if days_to_expiry <= 30:
        return "EXPIRING_SOON"
    return "IN_STOCK"

def process_daily_clock_job(db: Session, sim_date: datetime.date) -> Dict[str, Any]:
    batches = db.query(Batch).all()
    flagged_expiring_soon = 0
    quarantined_expired = 0
    details = []

    for b in batches:
        exp_date = parse_any_date(b.expiry_date)
        if not exp_date:
            continue

        days_rem = (exp_date - sim_date).days

        if exp_date <= sim_date:
            if b.stock_status != "QUARANTINED":
                quarantined_expired += 1
                details.append({
                    "action": "QUARANTINED",
                    "batch_number": b.batch_number,
                    "previous_stock": b.quantity_in_stock,
                    "expiry_date": b.expiry_date
                })
                b.quantity_in_stock = 0
                b.stock_status = "QUARANTINED"
        elif days_rem <= 7:
            if b.quantity_in_stock > 0:
                flagged_expiring_soon += 1
                b.stock_status = "EXPIRING_CRITICAL"
                details.append({
                    "action": "FLAGGED_CRITICAL",
                    "batch_number": b.batch_number,
                    "days_remaining": days_rem,
                    "expiry_date": b.expiry_date
                })
        elif days_rem <= 30:
            if b.quantity_in_stock > 0:
                b.stock_status = "EXPIRING_SOON"
        elif b.quantity_in_stock > 0:
            b.stock_status = "IN_STOCK"

    db.commit()

    return {
        "current_date": sim_date.strftime("%Y-%m-%d"),
        "flagged_expiring_soon": flagged_expiring_soon,
        "quarantined_expired": quarantined_expired,
        "details": {
            "total_batches_scanned": len(batches),
            "events": details
        }
    }

def get_sellable_stock_for_medicine(db: Session, medicine_id: int) -> Tuple[int, List[Batch]]:
    sim_date = get_current_system_date(db)

    batches = db.query(Batch).filter(
        Batch.medicine_id == medicine_id,
        Batch.quantity_in_stock > 0
    ).all()

    sellable_batches = []
    total_sellable = 0

    for batch in batches:
        exp_date = parse_any_date(batch.expiry_date)
        if exp_date and exp_date > sim_date:
            sellable_batches.append(batch)
            total_sellable += batch.quantity_in_stock

    sellable_batches.sort(key=lambda b: parse_any_date(b.expiry_date))
    return total_sellable, sellable_batches

def execute_fefo_dispense(db: Session, medicine_id: int, requested_qty: int) -> Dict[str, Any]:
    if requested_qty <= 0:
        raise ValueError("Requested quantity must be greater than zero.")

    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise ValueError(f"Medicine with ID {medicine_id} not found.")

    total_sellable, sellable_batches = get_sellable_stock_for_medicine(db, medicine_id)

    if total_sellable < requested_qty:
        raise ValueError(
            f"Insufficient sellable stock for {medicine.medicine_name}. "
            f"Requested: {requested_qty}, Sellable Available (In-Date): {total_sellable}."
        )

    transaction_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    remaining_needed = requested_qty
    allocations = []
    total_amount = 0.0
    now = datetime.datetime.utcnow()
    sim_date = get_current_system_date(db)

    for batch in sellable_batches:
        if remaining_needed <= 0:
            break

        qty_from_batch = min(batch.quantity_in_stock, remaining_needed)
        batch.quantity_in_stock -= qty_from_batch
        remaining_needed -= qty_from_batch

        subtotal = round(qty_from_batch * batch.mrp_per_unit_inr, 2)
        total_amount += subtotal

        days_rem = calculate_days_to_expiry_simulated(batch.expiry_date, sim_date)
        batch.stock_status = compute_batch_status_simulated(days_rem, batch.quantity_in_stock)

        log_entry = DispenseLog(
            transaction_id=transaction_id,
            medicine_id=medicine.id,
            medicine_name=medicine.medicine_name,
            batch_id=batch.id,
            batch_number=batch.batch_number,
            quantity_dispensed=qty_from_batch,
            unit_price=batch.mrp_per_unit_inr,
            total_price=subtotal,
            batch_expiry_date=batch.expiry_date,
            dispensed_at=now
        )
        db.add(log_entry)

        allocations.append({
            "batch_id": batch.id,
            "batch_number": batch.batch_number,
            "expiry_date": batch.expiry_date,
            "quantity_taken": qty_from_batch,
            "unit_price": batch.mrp_per_unit_inr,
            "subtotal": subtotal
        })

    remaining_sellable_stock = total_sellable - requested_qty
    threshold = medicine.reorder_threshold or 50

    if remaining_sellable_stock < threshold:
        outbox_entry = NotificationOutbox(
            medicine_id=medicine.id,
            medicine_name=medicine.medicine_name,
            current_stock=remaining_sellable_stock,
            threshold=threshold,
            message=f"RE-ORDER ALERT: In-date sellable stock for {medicine.medicine_name} is {remaining_sellable_stock} units (below threshold of {threshold} units).",
            status="PENDING",
            created_at=now
        )
        db.add(outbox_entry)

    db.commit()

    return {
        "transaction_id": transaction_id,
        "medicine_name": medicine.medicine_name,
        "requested_quantity": requested_qty,
        "dispensed_quantity": requested_qty,
        "total_amount": round(total_amount, 2),
        "allocations": allocations,
        "dispensed_at": now.isoformat()
    }

def process_messy_batch_import(db: Session, raw_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    imported_count = 0
    deduped_count = 0
    rejected_count = 0

    import_details = []
    created_in_batch = {} # (medicine_id, batch_number_upper) -> Batch object

    sim_date = get_current_system_date(db)

    for idx, item in enumerate(raw_items):
        row_id = idx + 1
        
        med_id = item.get('medicine_id')
        med_name = str(item.get('medicine_name', '')).strip() if item.get('medicine_name') else ""
        
        medicine_obj = None
        if med_id:
            try:
                medicine_obj = db.query(Medicine).filter(Medicine.id == int(med_id)).first()
            except Exception:
                pass
        
        if not medicine_obj and med_name:
            medicine_obj = db.query(Medicine).filter(Medicine.medicine_name.ilike(med_name)).first()

        if not medicine_obj:
            rejected_count += 1
            import_details.append({"row": row_id, "status": "REJECTED", "reason": "Medicine not found or null."})
            continue

        batch_no = str(item.get('batch_number', '')).strip()
        if not batch_no or batch_no.lower() in ['none', 'null', 'nan']:
            rejected_count += 1
            import_details.append({"row": row_id, "status": "REJECTED", "reason": "Missing or null batch number."})
            continue

        raw_qty = item.get('quantity_in_stock') or item.get('quantity')
        clean_qty = parse_messy_quantity(raw_qty)
        if clean_qty is None or clean_qty < 0:
            rejected_count += 1
            import_details.append({"row": row_id, "status": "REJECTED", "reason": f"Invalid quantity string: {raw_qty}"})
            continue

        raw_exp = item.get('expiry_date')
        parsed_exp = parse_any_date(raw_exp)
        if not parsed_exp:
            rejected_count += 1
            import_details.append({"row": row_id, "status": "REJECTED", "reason": f"Unparseable date: {raw_exp}"})
            continue

        exp_iso = parsed_exp.strftime("%Y-%m-%d")

        raw_mrp = item.get('mrp_per_unit_inr') or item.get('mrp') or 100.0
        try:
            mrp = float(re.sub(r'[^\d.]', '', str(raw_mrp))) if str(raw_mrp).strip() else 100.0
        except Exception:
            mrp = 100.0

        raw_mfd = item.get('manufacturing_date') or item.get('mfd') or '2025-01-01'
        parsed_mfd = parse_any_date(raw_mfd)
        mfd_iso = parsed_mfd.strftime("%Y-%m-%d") if parsed_mfd else '2025-01-01'

        dedup_key = (medicine_obj.id, batch_no.upper())

        existing_batch = db.query(Batch).filter(
            Batch.medicine_id == medicine_obj.id,
            Batch.batch_number == batch_no
        ).first()

        if existing_batch:
            deduped_count += 1
            existing_batch.quantity_in_stock += clean_qty
            import_details.append({
                "row": row_id,
                "status": "DEDUPED",
                "batch_number": batch_no,
                "reason": "Merged into existing database batch."
            })
            continue

        if dedup_key in created_in_batch:
            deduped_count += 1
            created_in_batch[dedup_key].quantity_in_stock += clean_qty
            import_details.append({
                "row": row_id,
                "status": "DEDUPED",
                "batch_number": batch_no,
                "reason": "Merged into duplicate batch in current import."
            })
            continue

        days_rem = (parsed_exp - sim_date).days
        status_tag = compute_batch_status_simulated(days_rem, clean_qty)

        new_b = Batch(
            medicine_id=medicine_obj.id,
            batch_number=batch_no,
            quantity_in_stock=clean_qty,
            mrp_per_unit_inr=mrp,
            gst_percent=12.0,
            manufacturing_date=mfd_iso,
            expiry_date=exp_iso,
            stock_status=status_tag,
            supplier_state_code="DL"
        )
        db.add(new_b)
        created_in_batch[dedup_key] = new_b
        imported_count += 1
        import_details.append({
            "row": row_id,
            "status": "IMPORTED",
            "batch_number": batch_no,
            "quantity": clean_qty,
            "expiry_date": exp_iso
        })

    db.commit()

    return {
        "imported": imported_count,
        "deduped": deduped_count,
        "rejected": rejected_count,
        "details": {
            "total_rows_processed": len(raw_items),
            "log": import_details
        }
    }
