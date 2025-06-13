import React from 'react';
import TradeForm from './TradeForm';

//this is the actions panel that houses the trade form.
function ActionsPanel({ onTransactionSuccess }) {
  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Trade Actions</h2>
      <TradeForm onTransactionSuccess={onTransactionSuccess} />
    </div>
  );
}

export default ActionsPanel; 