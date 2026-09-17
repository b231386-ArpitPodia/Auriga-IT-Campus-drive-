import React, { useState, useEffect } from 'react';
import { SearchIcon, CheckIcon, AlertIcon, PillIcon, ShieldCheckIcon } from '../icons';

export default function QuickSearch({ onSelectMedicineForDispense }) {
  const [query, setQuery] = useState('Paracetamol');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const quickPills = ['Paracetamol', 'Dolo 650', 'Crocin Advance', 'Calpol 500', 'Azithromycin', 'Pantoprazole', 'Amoxicillin'];

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search Header Panel */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">In-Date Stock Verification Engine</h2>
            </div>
            <p className="text-xs text-slate-400">Ask questions like: "Do we have paracetamol in date?"</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setQuery(pill);
                  performSearch(pill);
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-all ${
                  query.toLowerCase() === pill.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicine brand or generic salt (e.g. Paracetamol)..."
              className="form-input text-xs pl-9 py-2"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary text-xs py-2 px-4">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Answer Verdict Banner */}
      {searchResult && (
        <div className="space-y-3">
          <div
            className={`glass-panel p-3.5 border ${
              searchResult.in_date_available
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  searchResult.in_date_available
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {searchResult.in_date_available ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <AlertIcon className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {searchResult.in_date_available
                      ? `YES! ${searchResult.total_sellable_units.toLocaleString()} Sellable Units Available In-Date`
                      : `NO! No In-Date Stock Found for "${searchResult.query}"`}
                  </h3>
                  <span
                    className={`badge text-[9px] ${
                      searchResult.in_date_available ? 'badge-in-stock' : 'badge-expired'
                    }`}
                  >
                    {searchResult.in_date_available ? 'In Date Available' : 'No Stock'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Found {searchResult.matching_medicines_count} matching medicine(s). All expired batches excluded.
                </p>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResult.results.map((med) => (
              <div key={med.id} className="glass-panel p-3.5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{med.medicine_name}</h4>
                      {med.prescription_required_schedule_h && (
                        <span className="badge bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[8px]">
                          Schedule H
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{med.generic_salt}</p>
                    <p className="text-[10px] text-slate-500">
                      Mfg: {med.manufacturer} • Format: {med.unit_type}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-extrabold text-emerald-400">
                      {med.sellable_stock.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-400 uppercase">
                      Sellable Units
                    </div>
                  </div>
                </div>

                {/* Batch Queue Breakdown */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 pb-1 border-b border-white/5">
                    <span>Batch Queue (FEFO Order)</span>
                    <span>Status</span>
                  </div>

                  {med.batches.filter((b) => b.stock_status !== 'EXPIRED' && b.stock_status !== 'QUARANTINED').length === 0 ? (
                    <div className="text-[11px] text-rose-400 italic">No in-date sellable batches.</div>
                  ) : (
                    med.batches
                      .filter((b) => b.stock_status !== 'EXPIRED' && b.stock_status !== 'QUARANTINED')
                      .slice(0, 3)
                      .map((batch) => (
                        <div key={batch.id} className="flex justify-between text-xs py-0.5">
                          <span className="font-mono text-slate-300 font-semibold">{batch.batch_number} <span className="text-[10px] text-slate-500">(Exp: {batch.expiry_date})</span></span>
                          <span className="font-semibold text-emerald-400">{batch.quantity_in_stock} qty</span>
                        </div>
                      ))
                  )}
                </div>

                <button
                  onClick={() => onSelectMedicineForDispense(med.id)}
                  disabled={med.sellable_stock <= 0}
                  className="w-full btn btn-success py-1.5 text-xs font-bold"
                >
                  <PillIcon className="w-3.5 h-3.5" />
                  Dispense {med.medicine_name} (Oldest First)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
