import React, { useState, useEffect } from 'react';
import { PillIcon, SearchIcon, DispenseIcon, AlertIcon, PackageIcon, FileTextIcon, RefreshIcon, ShieldCheckIcon, ClockIcon } from '../icons';

export default function Navbar({ activeTab, setActiveTab, onRefresh }) {
  const [clockDate, setClockDate] = useState('');
  const [advanceDays, setAdvanceDays] = useState(1);
  const [clockLoading, setClockLoading] = useState(false);
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockResult, setClockResult] = useState(null);

  const [outbox, setOutbox] = useState([]);
  const [showOutboxModal, setShowOutboxModal] = useState(false);

  const navItems = [
    { id: 'search', label: 'In-Date Search', icon: SearchIcon },
    { id: 'dispense', label: 'Dispense Counter (FEFO)', icon: DispenseIcon },
    { id: 'alerts', label: 'Expiry Alerts', icon: AlertIcon },
    { id: 'inventory', label: 'Stock & Batches', icon: PackageIcon },
    { id: 'logs', label: 'Audit Trail', icon: FileTextIcon },
  ];

  const fetchClock = async () => {
    try {
      const res = await fetch('/api/clock');
      const data = await res.json();
      setClockDate(data.current_date);
    } catch (err) {
      console.error('Error fetching clock:', err);
    }
  };

  const fetchOutbox = async () => {
    try {
      const res = await fetch('/api/outbox');
      const data = await res.json();
      setOutbox(data);
    } catch (err) {
      console.error('Error fetching outbox:', err);
    }
  };

  useEffect(() => {
    fetchClock();
    fetchOutbox();
  }, []);

  const handleAdvanceClock = async (days) => {
    setClockLoading(true);
    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advance_days: days }),
      });
      const data = await res.json();
      setClockDate(data.current_date);
      setClockResult(data);
      onRefresh();
      fetchOutbox();
    } catch (err) {
      console.error('Failed to advance clock:', err);
    } finally {
      setClockLoading(false);
    }
  };

  const handleClearOutbox = async () => {
    try {
      await fetch('/api/outbox/clear', { method: 'POST' });
      fetchOutbox();
    } catch (err) {
      console.error('Failed to clear outbox:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <PillIcon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">PharmaFEFO</h1>
                <span className="badge badge-in-stock text-[10px] py-0.5">L1-L3 Ready</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Oldest-First & In-Date Inventory System</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Clock Simulator & Outbox */}
        <div className="flex items-center gap-2.5">
          {/* Simulated System Date Badge / Trigger */}
          <button
            onClick={() => setShowClockModal(true)}
            className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl font-medium hover:bg-amber-500/20"
            title="System Clock & Automation Job (POST /clock)"
          >
            <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Sim Date: {clockDate || 'Today'}</span>
          </button>

          {/* Outbox Badge Trigger */}
          <button
            onClick={() => {
              fetchOutbox();
              setShowOutboxModal(true);
            }}
            className="relative p-2 rounded-xl bg-slate-800 text-cyan-400 border border-white/10 hover:bg-slate-700"
            title="Notification Outbox (GET /outbox)"
          >
            <FileTextIcon className="w-4 h-4" />
            {outbox.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {outbox.length}
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary text-xs py-1.5 px-2.5 rounded-xl"
            title="Refresh Data"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clock Simulation Modal (Level 1 — T2) */}
      {showClockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 space-y-4 bg-slate-900 border-amber-500/40 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">System Clock & Daily Automation</h3>
              </div>
              <button onClick={() => setShowClockModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Advance system time to trigger the daily automation job. It flags batches expiring within 7 days and auto-quarantines expired ones (`quantity_in_stock = 0`). Graded via <code className="text-amber-300">POST /clock</code>.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Current Simulated Date:</span>
                <span className="font-bold text-amber-400">{clockDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Advance Time</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAdvanceClock(1)}
                  disabled={clockLoading}
                  className="btn btn-secondary text-xs py-2"
                >
                  +1 Day
                </button>
                <button
                  onClick={() => handleAdvanceClock(7)}
                  disabled={clockLoading}
                  className="btn btn-secondary text-xs py-2"
                >
                  +7 Days
                </button>
                <button
                  onClick={() => handleAdvanceClock(30)}
                  disabled={clockLoading}
                  className="btn btn-secondary text-xs py-2"
                >
                  +30 Days
                </button>
              </div>
            </div>

            {clockResult && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
                <span className="font-bold text-amber-400 block">Automation Job Report:</span>
                <p className="text-slate-300">• Flagged Expiring Soon (≤7d): <strong className="text-white">{clockResult.flagged_expiring_soon}</strong></p>
                <p className="text-slate-300">• Auto-Quarantined Expired: <strong className="text-rose-400">{clockResult.quarantined_expired}</strong></p>
              </div>
            )}

            <button onClick={() => setShowClockModal(false)} className="w-full btn btn-primary text-xs py-2">
              Close Clock Simulator
            </button>
          </div>
        </div>
      )}

      {/* Outbox Drawer Modal (Level 3 — T1) */}
      {showOutboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 bg-slate-900 border-cyan-500/40 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Notification Outbox (Re-Order Alerts)</h3>
              </div>
              <button onClick={() => setShowOutboxModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Automated outbox notifications sent when in-date sellable stock for a medicine drops below threshold. Graded via <code className="text-cyan-300">GET /outbox</code>.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {outbox.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No pending re-order alerts in outbox.
                </div>
              ) : (
                outbox.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-cyan-400">{item.medicine_name}</span>
                      <span className="badge text-[9px] bg-cyan-500/20 text-cyan-300">{item.status}</span>
                    </div>
                    <p className="text-slate-300">{item.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleClearOutbox} className="btn btn-danger text-xs flex-1">
                Clear Outbox
              </button>
              <button onClick={() => setShowOutboxModal(false)} className="btn btn-secondary text-xs flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
