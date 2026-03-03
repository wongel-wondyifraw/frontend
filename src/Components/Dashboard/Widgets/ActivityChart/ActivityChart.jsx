import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import './ActivityChart.css';

const data = [
    { name: 'JAN', expenses: 20000, income: 15000 },
    { name: 'FEB', expenses: 25000, income: 18000 },
    { name: 'MAR', expenses: 22000, income: 16000 },
    { name: 'APR', expenses: 30000, income: 24000 },
    { name: 'MAY', expenses: 35000, income: 28000 },
    { name: 'JUN', expenses: 45000, income: 38000 }, // Peak
    { name: 'JUL', expenses: 32000, income: 25000 },
    { name: 'AUG', expenses: 34000, income: 27000 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{`$${payload[0].value}`}</p>
                <p className="tooltip-month">{label}</p>
            </div>
        );
    }

    return null;
};

const ActivityChart = () => {
    return (
        <div className="activity-chart-container">
            <div className="chart-header">
                <h3>Activity Summary</h3>
                <button className="chart-filter-btn">
                    <Calendar size={14} />
                    Last week
                </button>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#7F56D9" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F2F4F7" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#F2F4F7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                        <CartesianGrid vertical={false} stroke="#EAECF0" strokeDasharray="3 3" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="expenses" stroke="#EAECF0" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                        <Area type="monotone" dataKey="income" stroke="#7F56D9" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityChart;
