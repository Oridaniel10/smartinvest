import React from 'react';
import { Link } from 'react-router-dom';

const StatItem = ({ label, value, valueColor }) => (
  <div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`font-semibold text-white ${valueColor}`}>{value}</p>
  </div>
);

function HotUserCard({ user, rank }) {
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  const plColor = (value) => (value >= 0 ? 'text-green-400' : 'text-red-400');

  return (
    <Link to={`/users/${user.name}`} className="block transform hover:-translate-y-1 transition-transform duration-300">
      <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-pink-500">#{rank}</div>
          <img src={user.profile_image || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-16 h-16 rounded-full border-2 border-pink-500" />
          <div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-gray-300 font-semibold text-sm" title="All-Time Profit/Loss">
              {formatCurrency(user.overall_pl)}
              <span className={`ml-2 font-mono ${plColor(user.overall_pl_percentage)}`}>
                ({formatPercentage(user.overall_pl_percentage)})
              </span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <StatItem label="Total Equity" value={formatCurrency(user.total_equity)} />
          <StatItem label="Cash Balance" value={formatCurrency(user.balance)} />
          <StatItem label="Unrealized P/L" value={formatCurrency(user.unrealized_pl)} valueColor={plColor(user.unrealized_pl)} />
          <StatItem label="Realized P/L" value={formatCurrency(user.realized_pl)} valueColor={plColor(user.realized_pl)} />
          <StatItem label="Total Deposits" value={formatCurrency(user.net_contributions)} />
          <StatItem label="Total Commissions" value={formatCurrency(user.total_commissions)} />
        </div>
      </div>
    </Link>
  );
}

export default HotUserCard;