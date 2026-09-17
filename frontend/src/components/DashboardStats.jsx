import React from 'react';
import { PillIcon, ShieldCheckIcon, AlertIcon, ClockIcon } from '../icons';

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Sellable In-Date Stock',
      value: `${stats.total_sellable_units.toLocaleString()} units`,
      subtitle: `Across ${stats.total_medicines} medicines`,
      icon: ShieldCheckIcon,
      textColor: 'text-emerald-400',
    },
    {
      title: 'Expiring Soon (<=30d)',
      value: `${stats.expiring_soon_batches_count} batches`,
      subtitle: 'FEFO priority queue',
      icon: ClockIcon,
      textColor: 'text-amber-400',
    },
    {
      title: 'Expired Stock',
      value: `${stats.total_expired_units.toLocaleString()} units`,
      subtitle: `${stats.expired_batches_count} batches isolated`,
      icon: AlertIcon,
      textColor: 'text-rose-400',
    },
    {
      title: 'Inventory Value',
      value: `₹${stats.inventory_value_inr.toLocaleString()}`,
      subtitle: `${stats.total_dispensed_today} units dispensed today`,
      icon: PillIcon,
      textColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-panel p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className={`text-lg font-bold ${card.textColor} tracking-tight mt-0.5`}>
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">{card.subtitle}</p>
            </div>
            <div className={`p-2 rounded-lg bg-slate-900 ${card.textColor} border border-white/5`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
