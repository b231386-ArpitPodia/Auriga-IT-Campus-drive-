import React from 'react';
import { PillIcon, ShieldCheckIcon, AlertIcon, ClockIcon, FileTextIcon } from '../icons';

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Sellable In-Date Stock',
      value: `${stats.total_sellable_units.toLocaleString()} units`,
      subtitle: `Across ${stats.total_medicines} medicines`,
      icon: ShieldCheckIcon,
      accent: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-700/5',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Expiring Soon (<=30 Days)',
      value: `${stats.expiring_soon_batches_count} batches`,
      subtitle: 'Priority FEFO queue',
      icon: ClockIcon,
      accent: 'amber',
      gradient: 'from-amber-500/20 to-amber-700/5',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-400',
    },
    {
      title: 'Expired Stock (Quarantine)',
      value: `${stats.total_expired_units.toLocaleString()} units`,
      subtitle: `${stats.expired_batches_count} batches isolated`,
      icon: AlertIcon,
      accent: 'rose',
      gradient: 'from-rose-500/20 to-rose-700/5',
      borderColor: 'border-rose-500/20',
      textColor: 'text-rose-400',
    },
    {
      title: 'Sellable Inventory Value',
      value: `₹${stats.inventory_value_inr.toLocaleString()}`,
      subtitle: `${stats.total_dispensed_today} units dispensed today`,
      icon: PillIcon,
      accent: 'cyan',
      gradient: 'from-cyan-500/20 to-cyan-700/5',
      borderColor: 'border-cyan-500/20',
      textColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 relative overflow-hidden bg-gradient-to-br ${card.gradient} ${card.borderColor}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <h3 className={`text-2xl font-bold ${card.textColor} tracking-tight`}>
                  {card.value}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-slate-900/60 ${card.textColor} border border-white/5`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
