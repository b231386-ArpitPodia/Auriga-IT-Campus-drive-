import React, { useState, useEffect } from 'react';
import { DispenseIcon, ShieldCheckIcon, CheckIcon, AlertIcon, PillIcon, ClockIcon, FileTextIcon, RefreshIcon } from '../icons';

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

  // Compute live FEFO allocation preview
  const computeAllocationPreview = () => {
    if (!currentMedicine || qty <= 0) return { valid: false, allocations: [], totalAmount: 0 };

    const inDateBatches = currentMedicine.batches
      .filter((b) => b.stock_status !== 'EXPIRED' && b.quantity_in_stock > 0)
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

      allocations.append
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Medicine Selection & Dispense Form */}
        <div className="w-full md:w-1/2 space-y-5">
          <div className="glass-panel p-6 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <DispenseIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">FEFO Dispense Counter</h3>
                <p className="text-xs text-slate-400">Oldest non-expired batch is auto-selected first</p>
              </div>
            </div>

            <form onSubmit={handleDispense} className="space-y-4">
              {/* Filter / Search Medicine */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Medicine
                </label>
                <input
                  type="text"
                  placeholder="Type to filter medicine list..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="form-input text-xs mb-2 bg-slate-900/90"
                />

                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setError(null);
                  }}
                  className="form-input text-sm font-semibold bg-slate-900"
                >
                  {filteredMedicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medicine_name} ({m.generic_salt}) — Sellable Stock: {m.sellable_stock} units
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine Card Summary */}
              {currentMedicine && (
                <div className="bg-slate-950/80 rounded-xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Manufacturer</span>
                    <span className="text-xs font-semibold text-white">{currentMedicine.manufacturer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Unit Format</span>
                    <span className="text-xs font-semibold text-white">{currentMedicine.unit_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Schedule H Required</span>
                    <span
                      className={`badge text-[10px] ${
                        currentMedicine.prescription_required_schedule_h ? 'badge-expired' : 'badge-in-stock'
                      }`}
                    >
                      {currentMedicine.prescription_required_schedule_h ? 'Yes (Prescription Req)' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-emerald-400">Total Sellable In-Date Stock</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {currentMedicine.sellable_stock} units
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quantity to Dispense
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={currentMedicine ? currentMedicine.sellable_stock : 9999}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-input text-lg font-bold w-32 text-center"
                  />
                  <div className="flex gap-2">
                    {[10, 20, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQty(preset)}
                        className="btn btn-secondary text-xs px-2.5 py-1.5 rounded-lg"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertIcon className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={dispensing || !preview.valid || !currentMedicine}
                className="w-full btn btn-success py-3.5 text-sm font-bold shadow-lg shadow-emerald-600/30"
              >
                {dispensing ? (
                  'Processing FEFO Dispense...'
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Confirm FEFO Dispense ({qty} Units) — ₹{preview.totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: FEFO Batch Allocation Preview & Active Batch Timeline */}
        <div className="w-full md:w-1/2 space-y-5">
          <div className="glass-panel p-6 border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live FEFO Batch Allocator</h3>
                  <p className="text-xs text-slate-400">First Expired, First Out execution simulation</p>
                </div>
              </div>
              <span className="badge badge-in-stock text-[10px]">Real-Time</span>
            </div>

            {currentMedicine ? (
              <div className="space-y-4">
                {/* Allocations Table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Allocated Batch Queue (Oldest First)
                  </span>

                  {preview.allocations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 text-center text-xs text-slate-400">
                      No stock available for requested quantity.
                    </div>
                  ) : (
                    preview.allocations.map((alloc, i) => (
                      <div
                        key={alloc.batch_id}
                        className="glass-panel p-3.5 bg-slate-950/80 border-indigo-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/40">
                            #{i + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">
                                {alloc.batch_number}
                              </span>
                              <span
                                className={`badge text-[9px] py-0 ${
                                  alloc.days_to_expiry <= 30 ? 'badge-expiring' : 'badge-in-stock'
                                }`}
                              >
                                Exp: {alloc.expiry_date} ({alloc.days_to_expiry}d left)
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Unit Price: ₹{alloc.unit_price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-400">
                            -{alloc.taken} units
                          </div>
                          <div className="text-xs text-slate-400 font-semibold">
                            Subtotal: ₹{alloc.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Excluded Expired Batches Safeguard Banner */}
                {currentMedicine.batches.filter((b) => b.stock_status === 'EXPIRED').length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-rose-300 font-semibold">
                      <AlertIcon className="w-4 h-4 text-rose-400" />
                      <span>
                        {currentMedicine.batches.filter((b) => b.stock_status === 'EXPIRED').length} Expired
                        batch(es) safety-locked & excluded
                      </span>
                    </div>
                    <span className="badge badge-expired text-[9px]">Omitted</span>
                  </div>
                )}

                {/* Total Cost Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Estimated Total Bill</span>
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                    ₹{preview.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Select a medicine to view live FEFO batch queue.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-5 bg-slate-900 border-emerald-500/40 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dispense Receipt</h3>
                  <p className="text-xs font-mono text-slate-400">TXN: {lastReceipt.transaction_id}</p>
                </div>
              </div>
              <button
                onClick={() => setLastReceipt(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Medicine Name:</span>
                <span className="font-bold text-white">{lastReceipt.medicine_name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Dispensed Quantity:</span>
                <span className="font-bold text-emerald-400">{lastReceipt.dispensed_quantity} units</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-400">{new Date(lastReceipt.dispensed_at).toLocaleString()}</span>
              </div>

              {/* Batches Used Breakdown */}
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Batches Dispensed (FEFO Allocation)
                </span>
                {lastReceipt.allocations.map((alloc) => (
                  <div key={alloc.batch_id} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="font-mono text-slate-300 font-semibold">{alloc.batch_number} (Exp: {alloc.expiry_date})</span>
                    <span className="text-emerald-400 font-bold">{alloc.quantity_taken} units @ ₹{alloc.unit_price} = ₹{alloc.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-sm font-bold text-white">Total Amount Paid:</span>
                <span className="text-2xl font-extrabold text-emerald-400">₹{lastReceipt.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => window.print()} className="btn btn-secondary flex-1 text-xs">
                <FileTextIcon className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setLastReceipt(null)} className="btn btn-primary flex-1 text-xs">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
