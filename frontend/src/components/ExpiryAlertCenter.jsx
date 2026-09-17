import React, { useState, useEffect } from 'react';
import { AlertIcon, ClockIcon, TrashIcon, CheckIcon, ShieldCheckIcon, RefreshIcon } from '../icons';

export default function ExpiryAlertCenter({ onAlertsUpdated }) {
  const [alerts, setAlerts] = useState({ critical: [], warning: [], caution: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('critical');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch expiry alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleQuarantine = async (batchId) => {
    if (!window.confirm('Are you sure you want to quarantine this batch? Quantity will be zeroed out and removed from sellable stock.')) return;

    try {
      const res = await fetch(`/api/batches/${batchId}/quarantine`, { method: 'DELETE' });
      if (res.ok) {
        fetchAlerts();
        if (onAlertsUpdated) onAlertsUpdated();
      }
    } catch (err) {
      console.error('Quarantine error:', err);
    }
  };

  const tabs = [
    { id: 'critical', label: 'Critical (<=7 Days)', count: alerts.critical.length, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { id: 'warning', label: 'Warning (8-30 Days)', count: alerts.warning.length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'caution', label: 'Caution (31-60 Days)', count: alerts.caution.length, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    { id: 'expired', label: 'Expired (Quarantine)', count: alerts.expired.length, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  ];

  const currentList = alerts[activeTab] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Expiry Alert Center</h2>
                <span className="badge badge-expiring text-[10px]">Heads-Up Monitor</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive monitoring of batch expiration dates to prevent inventory loss and guarantee safety.
              </p>
            </div>
          </div>

          <button onClick={fetchAlerts} className="btn btn-secondary text-xs">
            <RefreshIcon className="w-4 h-4" /> Refresh Alerts
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-white/20 shadow-lg'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-xs">
            Scanning inventory batches for upcoming expiries...
          </div>
        ) : currentList.length === 0 ? (
          <div className="glass-panel p-8 text-center space-y-2">
            <ShieldCheckIcon className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">No Batches in this Expiry Category</h4>
            <p className="text-xs text-slate-400">All batches in this range are clear or healthy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentList.map((item) => (
              <div
                key={item.batch_id}
                className={`glass-panel p-5 space-y-3 relative overflow-hidden ${
                  activeTab === 'critical'
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : activeTab === 'warning'
                    ? 'border-amber-500/30 bg-amber-950/10'
                    : activeTab === 'expired'
                    ? 'border-purple-500/30 bg-purple-950/10'
                    : 'border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{item.medicine_name}</h4>
                    <p className="text-xs text-slate-400">{item.generic_salt}</p>
                    <p className="font-mono text-xs text-indigo-300 mt-1">Batch: {item.batch_number}</p>
                  </div>

                  <span
                    className={`badge text-[10px] ${
                      item.days_to_expiry <= 0
                        ? 'badge-expired'
                        : item.days_to_expiry <= 7
                        ? 'badge-expired'
                        : 'badge-expiring'
                    }`}
                  >
                    {item.days_to_expiry <= 0 ? 'EXPIRED' : `${item.days_to_expiry} days left`}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expiry Date:</span>
                    <span className="font-bold text-white">{item.expiry_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stock Quantity:</span>
                    <span className="font-bold text-amber-400">{item.quantity_in_stock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stock Value at MRP:</span>
                    <span className="font-bold text-white">₹{item.total_value.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quarantine Button for Expired / Critical */}
                {(activeTab === 'expired' || activeTab === 'critical') && (
                  <button
                    onClick={() => handleQuarantine(item.batch_id)}
                    className="w-full btn btn-danger text-xs py-2 font-semibold"
                  >
                    <TrashIcon className="w-4 h-4" /> Quarantine & Zero Out Batch
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
