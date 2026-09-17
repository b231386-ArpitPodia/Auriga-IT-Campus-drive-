import os
import zipfile
import xml.etree.ElementTree as ET
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
from models import Medicine, Batch
from fefo_engine import calculate_days_to_expiry, compute_batch_status

DATASET_FILENAME = "indian_medicines_fefo_dataset.xlsx"

def parse_excel_with_openpyxl(file_path):
    import openpyxl
    wb = openpyxl.load_workbook(file_path)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    headers = [str(h).strip() if h else "" for h in rows[0]]
    data_rows = rows[1:]
    
    parsed = []
    for row in data_rows:
        row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}
        parsed.append(row_dict)
    return parsed

def parse_excel_fallback(file_path):
    z = zipfile.ZipFile(file_path)
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for elem in ss_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
            shared_strings.append(elem.text if elem.text else '')

    sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')

    raw_matrix = []
    for r in rows:
        row_vals = []
        for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            t = c.attrib.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val and val.isdigit() and int(val) < len(shared_strings):
                val = shared_strings[int(val)]
            row_vals.append(val)
        raw_matrix.append(row_vals)

    if not raw_matrix:
        return []

    headers = [str(h).strip() for h in raw_matrix[0]]
    parsed = []
    for row in raw_matrix[1:]:
        row_dict = {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
        parsed.append(row_dict)
    return parsed

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if database already has data
    if db.query(Medicine).count() > 0:
        print("[SEED] Database already populated. Skipping seed.")
        return

    # Locate dataset file
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", DATASET_FILENAME),
        os.path.join(os.path.dirname(__file__), DATASET_FILENAME),
        DATASET_FILENAME
    ]
    
    file_path = None
    for p in possible_paths:
        if os.path.exists(p):
            file_path = p
            break

    if not file_path:
        print(f"[SEED] Warning: Dataset file {DATASET_FILENAME} not found. Skipping auto-seed.")
        return

    print(f"[SEED] Seeding database from {file_path}...")

    try:
        data = parse_excel_with_openpyxl(file_path)
    except Exception as e:
        print(f"[SEED] Openpyxl parser failed ({e}), using built-in ZIP parser fallback...")
        data = parse_excel_fallback(file_path)

    medicine_map = {} # (medicine_name, generic_salt) -> Medicine object

    for row in data:
        med_name = str(row.get('medicine_name', '')).strip()
        generic_salt = str(row.get('generic_salt', '')).strip()
        category = str(row.get('category', 'General')).strip()
        unit_type = str(row.get('unit_type', 'Tablet')).strip()
        manufacturer = str(row.get('manufacturer', 'Pharma')).strip()
        schedule_h = str(row.get('prescription_required_schedule_h', '')).strip().lower() in ['yes', 'true', '1']
        storage = str(row.get('storage_condition', 'Store in a cool dry place')).strip()

        if not med_name:
            continue

        key = (med_name, generic_salt)
        if key not in medicine_map:
            med_obj = db.query(Medicine).filter(
                Medicine.medicine_name == med_name,
                Medicine.generic_salt == generic_salt
            ).first()

            if not med_obj:
                med_obj = Medicine(
                    medicine_name=med_name,
                    generic_salt=generic_salt,
                    category=category,
                    unit_type=unit_type,
                    manufacturer=manufacturer,
                    prescription_required_schedule_h=schedule_h,
                    storage_condition=storage
                )
                db.add(med_obj)
                db.flush()
            medicine_map[key] = med_obj
        else:
            med_obj = medicine_map[key]

        # Process Batch
        batch_no = str(row.get('batch_number', f"BATCH-{row.get('batch_id', '0')}")).strip()
        qty = int(float(row.get('quantity_in_stock', 0) or 0))
        mrp = float(row.get('mrp_per_unit_inr', 0.0) or 0.0)
        gst = float(row.get('gst_percent', 12.0) or 12.0)
        mfd = str(row.get('manufacturing_date', '2025-01-01')).strip()
        exp = str(row.get('expiry_date', '2026-12-31')).strip()
        state = str(row.get('supplier_state_code', 'DL')).strip()

        days_to_exp = calculate_days_to_expiry(exp)
        status = compute_batch_status(days_to_exp, qty)

        batch_obj = Batch(
            medicine_id=med_obj.id,
            batch_number=batch_no,
            quantity_in_stock=qty,
            mrp_per_unit_inr=mrp,
            gst_percent=gst,
            manufacturing_date=mfd,
            expiry_date=exp,
            stock_status=status,
            supplier_state_code=state
        )
        db.add(batch_obj)

    db.commit()
    print(f"[SEED] Successfully seeded {db.query(Medicine).count()} medicines and {db.query(Batch).count()} batches!")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
