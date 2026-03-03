import React, { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import './SendMoney.css';

const friends = [
    { id: 1, name: 'Alex', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=50&q=80' },
    { id: 2, name: 'John', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=50&q=80' },
    { id: 3, name: 'Kate', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=50&q=80' },
];

const SendMoney = () => {
    const [amount, setAmount] = useState('5636.00');

    return (
        <div className="send-money-container">
            <div className="section-header">
                <h3>Send Money</h3>
                <button className="dots-btn">•••</button>
            </div>

            <div className="friends-row">
                <button className="add-friend-btn">
                    <Plus size={20} color="white" />
                </button>
                {friends.map(friend => (
                    <div key={friend.id} className="friend-avatar-wrapper">
                        <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
                    </div>
                ))}
            </div>

            <label className="amount-label">Amount</label>
            <div className="amount-input-wrapper">
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="amount-input"
                />
                <span className="currency-tag">USD</span>
                <button className="send-btn">
                    <Send size={18} color="white" />
                </button>
            </div>
        </div>
    );
};

export default SendMoney;
