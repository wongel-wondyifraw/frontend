import React from 'react';
import './TransactionList.css';
import { Wallet, ShoppingBag, Globe, Repeat } from 'lucide-react'; // Placeholder icons

const transactions = [
    { id: 1, name: 'Drone Wallet', date: 'May 28, 2024 08:38 PM', amount: -45.50, type: 'debit', icon: <Wallet color="white" size={20} />, bg: '#7F56D9' },
    { id: 2, name: 'Shopsy', date: 'June 10, 2024 11:38 AM', amount: 145.50, type: 'credit', icon: <ShoppingBag color="white" size={20} />, bg: '#7F56D9' }, // Using purple for consistency or specific colors
    { id: 3, name: 'Godwin OTT', date: 'June 13, 2024 12:23 PM', amount: -55.00, type: 'debit', icon: <Globe color="white" size={20} />, bg: '#7F56D9' },
    { id: 4, name: 'PreExchange', date: 'June 20, 2024 11:38 AM', amount: -550.00, type: 'debit', icon: <Repeat color="white" size={20} />, bg: '#7F56D9' },
];

const TransactionList = () => {
    return (
        <div className="transaction-list-container">
            <div className="section-header">
                <h3>Transaction</h3>
                <button className="view-all-btn">View All</button>
            </div>

            <div className="transaction-list">
                {transactions.map(tx => (
                    <div key={tx.id} className="transaction-item">
                        <div className="tx-icon-wrapper" style={{ backgroundColor: tx.bg }}>
                            {tx.icon}
                        </div>
                        <div className="tx-details">
                            <h4>{tx.name}</h4>
                            <p>{tx.date}</p>
                        </div>
                        <div className={`tx-amount ${tx.type}`}>
                            {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionList;
