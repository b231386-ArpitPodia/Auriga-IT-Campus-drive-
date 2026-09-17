import React, { useState } from 'react';
import { PackageIcon, SearchIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, PillIcon, CheckIcon, FileTextIcon, AlertIcon } from '../icons';

export default function InventoryManager({ medicines, onBatchAdded }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedMedId, setExpandedMedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMessyModal, setShowMessyModal] = useState(false);
  const [targetMedId, setTargetMedId] = useState('');

  // Messy Import state
  const sampleMessyJson = JSON.stringify([
    { "medicine_id": 1, "batch_number": "B-MESSY-101", "quantity_in_stock": "10 units", "expiry_date": "25/12/2027", "mrp_per_unit_inr": "150.00" },
    { "medicine_id": 1, "batch_number": "B-MESSY-101", "quantity_in_stock": "20 tablets", "expiry_date": "25/12/2027", "mrp_per_unit_inr": "150.00" },
    { "medicine_id": 1, "batch_number": null, "quantity_in_stock": "50 units", "expiry_date": "2027-12-31" },
    { "medicine_id": 2, "batch_number": "B-MESSY-102", "quantity_in_stock": "100 units", "expiry_date": "invalid-date" }
  ], null, 2);

  const [messyInput, setMessyInput] = useState(sampleMessyJson);
  const [importingMessy, setImportingMessy] = useState(false);
  const [messyReport, setMessyReport] = useState(null);

  // New single batch form state
  const [newBatch, setNewBatch] = useState({
    batch_number: '',
    quantity_in_stock: 100,
    mrp_per_unit_inr: 150.0,
    gst_percent: 12.0,
    manufacturing_date: '2025-01-01',
    expiry_date: '2027-01-01',
    supplier_state_code: 'DL',
  });
  const [adding, setAdding] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(medicines.map((m) => m.category)))];

  const filteredMedicines = medicines.filter((m) => {
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesSearch =
      m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_salt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault();
    if (!targetMedId || !newBatch.batch_number.trim()) return;

    setAdding(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBatch,
          medicine_id: Number(targetMedId),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewBatch({
          batch_number: '',
          quantity_in_stock: 100,
          mrp_per_unit_inr: 150.0,
          gst_percent: 12.0,
          manufacturing_date: '2025-01-01',
          expiry_date: '2027-01-01',
          supplier_state_code: 'DL',
        });
        if (onBatchAdded) onBatchAdded();
      }
    } catch (err) {
      console.error('Failed to add batch:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleMessyImportSubmit = async (e) => {
    e.preventDefault();
    setImportingMessy(true);
    setMessyReport(null);
    try {
      const parsedData = JSON.parse(messyInput);
      const res = await fetch('/api/batches/import-messy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();
      setMessyReport(data);
      if (onBatchAdded) onBatchAdded();
    } catch (err) {
      alert('Invalid JSON input formatting.');
    } finally {
      setImportingMessy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Category Filter Bar */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Stock & Batch Queue Manager</h3>
              <p className="text-xs text-slate-400">Total {medicines.length} registered medicines in catalog</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMessyModal(true)}
              className="btn btn-secondary text-xs font-bold border-indigo-500/30 text-indigo-300"
              title="Import messy batch data (Level 2 — T4)"
            >
              <FileTextIcon className="w-4 h-4 text-indigo-400" /> Import Messy Data
            </button>

            <button
              onClick={() => {
                if (medicines.length > 0) setTargetMedId(medicines[0].id);
                setShowAddModal(true);
              }}
              className="btn btn-primary text-xs font-bold"
            >
              <PlusIcon className="w-4 h-4" /> Add Batch
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog by name, salt, manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input text-xs pl-10 bg-slate-900/90"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input text-xs py-2 bg-slate-900 text-white min-w-[150px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredMedicines.map((med) => {
          const isExpanded = expandedMedId === med.id;
          const activeBatchesCount = med.batches.filter((b) => b.stock_status !== 'EXPIRED').length;
          const expiredBatchesCount = med.batches.filter((b) => b.stock_status === 'EXPIRED').length;

          return (
            <div key={med.id} className="glass-panel overflow-hidden border-white/10 hover:border-indigo-500/30">
              <div
                onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 border border-white/5">
                    <PillIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{med.medicine_name}</h4>
                      <span className="badge text-[10px] bg-slate-800 text-slate-300 border-white/10">
                        {med.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{med.generic_salt}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {med.manufacturer} • Storage: {med.storage_condition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{med.sellable_stock} units</div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      Sellable (In-Date)
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <div className="text-sm font-semibold text-slate-300">
                      {med.batches.length} batch(es)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {activeBatchesCount} Active • {expiredBatchesCount} Expired
                    </div>
                  </div>

                  <button className="p-1 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Batch Queue Details */}
              {isExpanded && (
                <div className="bg-slate-950/90 p-4 border-t border-white/10 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Batch Timeline & FEFO Priority Queue
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetMedId(med.id);
                        setShowAddModal(true);
                      }}
                      className="btn btn-secondary text-[11px] py-1 px-2.5"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Add Batch
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Batch No</th>
                          <th className="py-2.5 px-3">Mfg Date</th>
                          <th className="py-2.5 px-3">Expiry Date</th>
                          <th className="py-2.5 px-3">Days Left</th>
                          <th className="py-2.5 px-3">Stock Qty</th>
                          <th className="py-2.5 px-3">MRP (INR)</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {med.batches.map((batch) => (
                          <tr key={batch.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                              {batch.batch_number}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{batch.manufacturing_date}</td>
                            <td className="py-2.5 px-3 font-semibold text-white">{batch.expiry_date}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-semibold ${
                                  batch.days_to_expiry <= 0
                                    ? 'text-rose-400'
                                    : batch.days_to_expiry <= 30
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {batch.days_to_expiry}d
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">{batch.quantity_in_stock}</td>
                            <td className="py-2.5 px-3">₹{batch.mrp_per_unit_inr.toFixed(2)}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`badge text-[9px] ${
                                  batch.stock_status === 'EXPIRED' || batch.stock_status === 'QUARANTINED'
                                    ? 'badge-expired'
                                    : batch.stock_status === 'EXPIRING_SOON' || batch.stock_status === 'EXPIRING_CRITICAL'
                                    ? 'badge-expiring'
                                    : 'badge-in-stock'
                                }`}
                              >
                                {batch.stock_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Messy Data Importer Modal (Level 2 — T4) */}
      {showMessyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 bg-slate-900 border-indigo-500/40 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Messy Data Batch Importer (Level 2 — T4)</h3>
              </div>
              <button onClick={() => setShowMessyModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sanitizes messy quantity strings ('10 units'), parses dates (`dd/mm/yyyy` or ISO), deduplicates rows, and returns a detailed report <code className="text-indigo-300 font-mono">&#123; imported, deduped, rejected &#125;</code>.
            </p>

            <form onSubmit={handleMessyImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Raw JSON Batch Data
                </label>
                <textarea
                  rows={7}
                  value={messyInput}
                  onChange={(e) => setMessyInput(e.target.value)}
                  className="form-input font-mono text-xs bg-slate-950"
                />
              </div>

              {messyReport && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5 text-xs">
                  <span className="font-bold text-indigo-300 block">Import Execution Report:</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-400 font-bold">Imported: {messyReport.imported}</span>
                    <span className="text-amber-400 font-bold">Deduped: {messyReport.deduped}</span>
                    <span className="text-rose-400 font-bold">Rejected: {messyReport.rejected}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessyModal(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Close
                </button>
                <button type="submit" disabled={importingMessy} className="btn btn-primary flex-1 text-xs font-bold">
                  {importingMessy ? 'Processing...' : 'Run Messy Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 space-y-4 bg-slate-900 border-indigo-500/40 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Add Incoming Stock Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Medicine
                </label>
                <select
                  value={targetMedId}
                  onChange={(e) => setTargetMedId(e.target.value)}
                  className="form-input text-xs bg-slate-950"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medicine_name} ({m.generic_salt})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-MH-2026-99"
                  value={newBatch.batch_number}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBatch.quantity_in_stock}
                    onChange={(e) => setNewBatch({ ...newBatch, quantity_in_stock: parseInt(e.target.value) || 0 })}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    MRP Per Unit (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBatch.mrp_per_unit_inr}
                    onChange={(e) => setNewBatch({ ...newBatch, mrp_per_unit_inr: parseFloat(e.target.value) || 0 })}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Mfg Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.manufacturing_date}
                    onChange={(e) => setNewBatch({ ...newBatch, manufacturing_date: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiry_date}
                    onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="btn btn-primary flex-1 text-xs font-bold">
                  {adding ? 'Saving...' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
