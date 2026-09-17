import React, { useState, useEffect } from 'react';
import { FileTextIcon, RefreshIcon, CheckIcon } from '../icons';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dispense/logs?limit=100');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <FileTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Dispensing Audit Trail</h3>
              <p className="text-xs text-slate-400">Complete immutable record of all FEFO stock transactions</p>
            </div>
          </div>

          <button onClick={fetchLogs} className="btn btn-secondary text-xs">
            <RefreshIcon className="w-4 h-4" /> Refresh Audit Logs
          </button>
        </div>
      </div>

      <div className="glass-panel p-5">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No dispensing logs found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Medicine</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Batch Expiry</th>
                  <th className="py-3 px-3">Qty Taken</th>
                  <th className="py-3 px-3">Unit Price</th>
                  <th className="py-3 px-3">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{log.transaction_id}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(log.dispensed_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{log.medicine_name}</td>
                    <td className="py-3 px-3 font-mono text-cyan-300">{log.batch_number}</td>
                    <td className="py-3 px-3 text-slate-300">{log.batch_expiry_date}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">-{log.quantity_dispensed}</td>
                    <td className="py-3 px-3 text-slate-300">₹{log.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-white">₹{log.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
