import React, { useState, useEffect } from 'react';
import { DispenseIcon, ShieldCheckIcon, CheckIcon, AlertIcon, PillIcon, FileTextIcon } from '../icons';

export default function DispenseCounter({ medicines, selectedMedicineId, onDispenseSuccess }) {
  const [selectedId, setSelectedId] = useState(selectedMedicineId || '');
  const [qty, setQty] = useState(1);
  const [dispensing, setDispensing] = useState(false);
  const [error, setError] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (selectedMedicineId) {
      setSelectedId(selectedMedicineId);
    } else if (medicines.length > 0 && !selectedId) {
      setSelectedId(medicines[0].id);
    }
  }, [selectedMedicineId, medicines]);

  const currentMedicine = medicines.find((m) => m.id === Number(selectedId));

  const computeAllocationPreview = () => {
    if (!currentMedicine || qty <= 0) return { valid: false, allocations: [], totalAmount: 0 };

    const inDateBatches = currentMedicine.batches
      .filter((b) => b.stock_status !== 'EXPIRED' && b.stock_status !== 'QUARANTINED' && b.quantity_in_stock > 0)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    let needed = qty;
    let totalAmt = 0;
    const allocations = [];

    for (const b of inDateBatches) {
      if (needed <= 0) break;
      const taken = Math.min(b.quantity_in_stock, needed);
      needed -= taken;
      const sub = taken * b.mrp_per_unit_inr;
      totalAmt += sub;

      allocations.push({
        batch_id: b.id,
        batch_number: b.batch_number,
        expiry_date: b.expiry_date,
        days_to_expiry: b.days_to_expiry,
        taken,
        unit_price: b.mrp_per_unit_inr,
        subtotal: sub,
      });
    }

    return {
      valid: needed === 0,
      shortfall: needed,
      allocations,
      totalAmount: totalAmt,
    };
  };

  const preview = computeAllocationPreview();

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!selectedId || qty <= 0) return;

    setDispensing(true);
    setError(null);
    try {
      const res = await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: Number(selectedId),
          requested_quantity: Number(qty),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Dispensing failed');
      }

      setLastReceipt(data);
      onDispenseSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setDispensing(false);
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.medicine_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.generic_salt.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Selection & Quantity */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <DispenseIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">FEFO Dispense Counter</h3>
          </div>

          <form onSubmit={handleDispense} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filter & Select Medicine
              </label>
              <input
                type="text"
                placeholder="Search medicine..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="form-input text-xs mb-1.5"
              />
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setError(null);
                }}
                className="form-input text-xs font-semibold bg-slate-900"
              >
                {filteredMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.medicine_name} ({m.generic_salt}) — In-Date Stock: {m.sellable_stock}
                  </option>
                ))}
              </select>
            </div>

            {currentMedicine && (
              <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Manufacturer:</span>
                  <span className="font-semibold text-white">{currentMedicine.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prescription Schedule H:</span>
                  <span className={`badge text-[8px] ${currentMedicine.prescription_required_schedule_h ? 'badge-expired' : 'badge-in-stock'}`}>
                    {currentMedicine.prescription_required_schedule_h ? 'Prescription Req' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5 font-bold">
                  <span className="text-emerald-400">Sellable In-Date Stock:</span>
                  <span className="text-emerald-400">{currentMedicine.sellable_stock} units</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Quantity to Dispense
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={currentMedicine ? currentMedicine.sellable_stock : 9999}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="form-input text-sm font-bold w-24 text-center"
                />
                <div className="flex gap-1">
                  {[10, 20, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQty(preset)}
                      className="btn btn-secondary text-xs px-2 py-1 rounded"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertIcon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={dispensing || !preview.valid || !currentMedicine}
              className="w-full btn btn-success py-2 text-xs font-bold"
            >
              {dispensing ? (
                'Dispensing...'
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Confirm Dispense ({qty} Units) — ₹{preview.totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Batch Allocation Visualizer */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Live FEFO Batch Allocator</h3>
            </div>
            <span className="badge badge-in-stock text-[8px]">Earliest Expiry First</span>
          </div>

          {currentMedicine ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Batch Queue Allocation
                </span>

                {preview.allocations.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-950 text-center text-xs text-slate-500">
                    No stock available for requested quantity.
                  </div>
                ) : (
                  preview.allocations.map((alloc, i) => (
                    <div key={alloc.batch_id} className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-300">{alloc.batch_number}</span>
                        <span className="text-[10px] text-slate-400 block">Exp: {alloc.expiry_date} ({alloc.days_to_expiry}d left)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">-{alloc.taken} units</span>
                        <span className="text-[10px] text-slate-400 block">₹{alloc.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Total Amount</span>
                <span className="text-base font-extrabold text-emerald-400">₹{preview.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">Select medicine to view FEFO breakdown.</div>
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full p-4 space-y-3 bg-slate-900 border-emerald-500/30 animate-fade-in shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Dispense Receipt</h3>
              <button onClick={() => setLastReceipt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-400">Transaction ID:</span><span className="font-mono font-bold text-indigo-300">{lastReceipt.transaction_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Medicine:</span><span className="font-bold text-white">{lastReceipt.medicine_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Dispensed Quantity:</span><span className="font-bold text-emerald-400">{lastReceipt.dispensed_quantity} units</span></div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Allocated Batches</span>
              {lastReceipt.allocations.map((alloc) => (
                <div key={alloc.batch_id} className="flex justify-between text-[11px] py-0.5">
                  <span className="font-mono text-slate-300">{alloc.batch_number}</span>
                  <span className="text-emerald-400 font-bold">{alloc.quantity_taken} units @ ₹{alloc.unit_price}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
              <span>Total Paid:</span>
              <span className="text-base text-emerald-400">₹{lastReceipt.total_amount.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => window.print()} className="btn btn-secondary flex-1 text-xs py-1.5"><FileTextIcon className="w-3.5 h-3.5" /> Print</button>
              <button onClick={() => setLastReceipt(null)} className="btn btn-primary flex-1 text-xs py-1.5">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
