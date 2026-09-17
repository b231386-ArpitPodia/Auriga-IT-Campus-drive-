import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import QuickSearch from './components/QuickSearch';
import DispenseCounter from './components/DispenseCounter';
import ExpiryAlertCenter from './components/ExpiryAlertCenter';
import InventoryManager from './components/InventoryManager';
import AuditTrail from './components/AuditTrail';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);

  const fetchSystemData = async () => {
    try {
      const [statsRes, medsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/medicines')
      ]);

      if (statsRes.ok && medsRes.ok) {
        const statsData = await statsRes.json();
        const medsData = await medsRes.json();
        setStats(statsData);
        setMedicines(medsData);
      }
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleSelectMedicineForDispense = (medId) => {
    setSelectedMedicineId(medId);
    setActiveTab('dispense');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={fetchSystemData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <DashboardStats stats={stats} />

        {/* Dynamic Tab Views */}
        {activeTab === 'search' && (
          <QuickSearch onSelectMedicineForDispense={handleSelectMedicineForDispense} />
        )}

        {activeTab === 'dispense' && (
          <DispenseCounter
            medicines={medicines}
            selectedMedicineId={selectedMedicineId}
            onDispenseSuccess={fetchSystemData}
          />
        )}

        {activeTab === 'alerts' && (
          <ExpiryAlertCenter onAlertsUpdated={fetchSystemData} />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager medicines={medicines} onBatchAdded={fetchSystemData} />
        )}

        {activeTab === 'logs' && (
          <AuditTrail />
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>PharmaFEFO Engine • Built for Neighbourhood Pharmacies • Placement Drive Production Build</p>
      </footer>
    </div>
  );
}
