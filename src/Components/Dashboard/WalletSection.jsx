import React from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, Lock, MoreHorizontal } from 'lucide-react';
import './WalletSection.css';

const WalletSection = () => {
    return (
        <div className="wallet-section">
            <div className="card-visual">
                <div className="card-logo">VISA</div>
                <div className="card-chip"></div>
                <div className="card-number">
                    <span>6277</span>
                    <span>7654</span>
                    <span>2527</span>
                    <span>4778</span>
                </div>
                <div className="card-footer">
                    <div className="card-holder">
                        <span className="label">Card holder name</span>
                        <span className="value">JOHN C.</span>
                    </div>
                    <div className="card-expiry">
                        <span className="label">Expiry date</span>
                        <span className="value">02/30</span>
                    </div>
                    <div className="card-contactless">)))</div>
                </div>
            </div>

            <div className="wallet-actions">
                <div className="action-btn-wrapper">
                    <button className="action-btn">
                        <Plus size={20} />
                    </button>
                    <span>Top-Up</span>
                </div>
                <div className="action-btn-wrapper">
                    <button className="action-btn">
                        <ArrowDownLeft size={20} />
                    </button>
                    <span>Request</span>
                </div>
                <div className="action-btn-wrapper">
                    <button className="action-btn">
                        <ArrowUpRight size={20} />
                    </button>
                    <span>Transfer</span>
                </div>
            </div>

            <div className="daily-limit">
                <div className="limit-header">
                    <h3>Daily Limit</h3>
                    <button className="edit-btn">Edit Now</button>
                </div>
                <div className="limit-amount">
                    <span className="current">$135,00</span>
                    <span className="max">/$180</span>
                    <span className="percentage">36%</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: '36%' }}></div>
                </div>
            </div>
        </div>
    );
};

export default WalletSection;
