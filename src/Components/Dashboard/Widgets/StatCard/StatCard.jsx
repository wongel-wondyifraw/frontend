import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './StatCard.css';

const StatCard = ({ title, amount, trend, trendLabel, trendDirection = 'up', color = 'default', icon }) => {
    const isPositive = trendDirection === 'up';

    return (
        <div className={`stat-card ${color}`}>
            <div className="stat-card-content">
                <div className="stat-header">
                    <div className="stat-icon-wrapper">
                        {icon}
                    </div>
                    <h3 className="stat-title">{title}</h3>
                </div>
                <div className="stat-amount">{amount}</div>
                <div className="stat-trend">
                    <span className={`trend-badge ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </span>
                    <span className="trend-label">{trendLabel}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
