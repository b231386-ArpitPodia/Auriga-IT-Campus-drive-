import React, { useState, useEffect } from 'react';
import { SearchIcon, CheckIcon, AlertIcon, PillIcon, ChevronRightIcon, ShieldCheckIcon, ClockIcon } from '../icons';

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
    <div className="space-y-6 animate-fade-in">
      {/* Search Header Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Instant In-Date Stock Verification Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            "Do we have <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">paracetamol</span> in date?"
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Search any medicine brand name or generic salt. The system automatically excludes expired batches and reports true sellable stock in real-time.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto pt-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicine name or salt (e.g. Paracetamol, Dolo, Crocin)..."
                className="form-input pl-12 pr-4 py-3 text-sm bg-slate-900/90"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary px-6 py-3">
              {loading ? 'Searching...' : 'Verify Stock'}
            </button>
          </form>

          {/* Quick Suggestion Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium mr-1">Quick Queries:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setQuery(pill);
                  performSearch(pill);
                }}
                className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                  query.toLowerCase() === pill.toLowerCase()
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800/60 text-slate-300 border-white/5 hover:border-white/20'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answer Verdict Banner */}
      {searchResult && (
        <div className="space-y-4">
          <div
            className={`glass-panel p-5 border ${
              searchResult.in_date_available
                ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/30 border-emerald-500/30'
                : 'bg-gradient-to-r from-rose-950/50 via-slate-900 to-rose-950/30 border-rose-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    searchResult.in_date_available
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {searchResult.in_date_available ? (
                    <CheckIcon className="w-7 h-7" />
                  ) : (
                    <AlertIcon className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Stock Status Verdict
                    </span>
                    <span
                      className={`badge text-[10px] ${
                        searchResult.in_date_available ? 'badge-in-stock' : 'badge-expired'
                      }`}
                    >
                      {searchResult.in_date_available ? 'In Date Available' : 'No In-Date Stock'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    {searchResult.in_date_available
                      ? `YES! ${searchResult.total_sellable_units.toLocaleString()} Sellable Units Available In-Date`
                      : `NO! No In-Date Stock Found for "${searchResult.query}"`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Found {searchResult.matching_medicines_count} matching medicine brand(s). All expired batches have been automatically filtered out.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResult.results.map((med) => (
              <div key={med.id} className="glass-panel p-5 space-y-4 hover:border-indigo-500/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">{med.medicine_name}</h4>
                      {med.prescription_required_schedule_h && (
                        <span className="badge bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px]">
                          Schedule H
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{med.generic_salt}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mfg: {med.manufacturer} • Type: {med.unit_type}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {med.sellable_stock.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      Sellable Units
                    </div>
                  </div>
                </div>

                {/* Active Batches FEFO Breakdown */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-1 border-b border-white/5">
                    <span>Batch Queue (FEFO Order)</span>
                    <span>Status</span>
                  </div>

                  {med.batches.filter(b => b.stock_status !== 'EXPIRED').length === 0 ? (
                    <div className="text-xs text-rose-400 py-1 italic">
                      No active in-date batches available for this medicine.
                    </div>
                  ) : (
                    med.batches
                      .filter((b) => b.stock_status !== 'EXPIRED')
                      .slice(0, 3)
                      .map((batch) => (
                        <div key={batch.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300 font-semibold">{batch.batch_number}</span>
                            <span className="text-[11px] text-slate-400">Exp: {batch.expiry_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{batch.quantity_in_stock} qty</span>
                            <span
                              className={`badge text-[9px] py-0 ${
                                batch.days_to_expiry <= 30 ? 'badge-expiring' : 'badge-in-stock'
                              }`}
                            >
                              {batch.days_to_expiry}d left
                            </span>
                          </div>
                        </div>
                      ))
                  )}

                  {med.batches.filter((b) => b.stock_status === 'EXPIRED').length > 0 && (
                    <div className="text-[11px] text-rose-400 pt-1 border-t border-white/5 flex items-center justify-between">
                      <span>{med.batches.filter((b) => b.stock_status === 'EXPIRED').length} Expired Batch(es) Omitted</span>
                      <span className="badge badge-expired text-[9px]">Filtered Out</span>
                    </div>
                  )}
                </div>

                {/* Direct Dispense Button */}
                <button
                  onClick={() => onSelectMedicineForDispense(med.id)}
                  disabled={med.sellable_stock <= 0}
                  className="w-full btn btn-success py-2.5 text-xs font-bold"
                >
                  <PillIcon className="w-4 h-4" />
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
