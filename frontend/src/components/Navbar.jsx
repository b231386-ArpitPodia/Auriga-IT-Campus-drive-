import React, { useState, useEffect } from 'react';
import { PillIcon, SearchIcon, DispenseIcon, AlertIcon, PackageIcon, FileTextIcon, RefreshIcon, ClockIcon } from '../icons';

export default function Navbar({ activeTab, setActiveTab, onRefresh }) {
  const [clockDate, setClockDate] = useState('');
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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            💊
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight">PharmaFEFO</h1>
              <span className="badge badge-in-stock text-[9px] py-0">v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">FEFO Stock & Dispensing</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClockModal(true)}
            className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg font-medium hover:bg-amber-500/20"
            title="Clock & Automation Simulator"
          >
            <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sim:</span> {clockDate || 'Today'}
          </button>

          <button
            onClick={() => {
              fetchOutbox();
              setShowOutboxModal(true);
            }}
            className="relative p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-white/10 hover:bg-slate-700"
            title="Notification Outbox"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            {outbox.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                {outbox.length}
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary text-xs py-1 px-2 rounded-lg"
            title="Refresh Data"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clock Simulation Modal */}
      {showClockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full p-4 space-y-3 bg-slate-900 border-amber-500/30 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">System Clock Simulator</h3>
              </div>
              <button onClick={() => setShowClockModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Advance system date to test automated 7-day warning flags and expired batch auto-quarantine.
            </p>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 flex justify-between text-xs">
              <span className="text-slate-400">Current Simulated Date:</span>
              <span className="font-bold text-amber-400">{clockDate}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleAdvanceClock(1)} disabled={clockLoading} className="btn btn-secondary text-xs py-1.5">
                +1 Day
              </button>
              <button onClick={() => handleAdvanceClock(7)} disabled={clockLoading} className="btn btn-secondary text-xs py-1.5">
                +7 Days
              </button>
              <button onClick={() => handleAdvanceClock(30)} disabled={clockLoading} className="btn btn-secondary text-xs py-1.5">
                +30 Days
              </button>
            </div>

            {clockResult && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <span className="font-bold text-amber-400 block">Automation Report:</span>
                <p className="text-slate-300">• Flagged Expiring Soon (≤7d): <strong>{clockResult.flagged_expiring_soon}</strong></p>
                <p className="text-slate-300">• Auto-Quarantined Expired: <strong className="text-rose-400">{clockResult.quarantined_expired}</strong></p>
              </div>
            )}

            <button onClick={() => setShowClockModal(false)} className="w-full btn btn-primary text-xs py-1.5">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Outbox Drawer Modal */}
      {showOutboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-4 space-y-3 bg-slate-900 border-cyan-500/30 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <FileTextIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Re-Order Notification Outbox</h3>
              </div>
              <button onClick={() => setShowOutboxModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {outbox.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No pending outbox alerts.</div>
              ) : (
                outbox.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/20 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-cyan-400">{item.medicine_name}</span>
                      <span className="badge text-[8px] bg-cyan-500/20 text-cyan-300">{item.status}</span>
                    </div>
                    <p className="text-slate-300">{item.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleClearOutbox} className="btn btn-danger text-xs flex-1 py-1.5">
                Clear
              </button>
              <button onClick={() => setShowOutboxModal(false)} className="btn btn-secondary text-xs flex-1 py-1.5">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
