import React from 'react';
import './ScheduledPayments.css';

const payments = [
    { id: 1, name: 'Discord', price: '$35.25/m', logo: 'https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png' },
    { id: 2, name: 'Notepad', price: '$15.65/m', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Notepad_icon.svg/1024px-Notepad_icon.svg.png' },
    { id: 3, name: 'Netflix', price: '$90.75/m', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1200px-Netflix_2015_logo.svg.png' },
];

const ScheduledPayments = () => {
    return (
        <div className="scheduled-payments-container">
            <div className="section-header">
                <h3>Schedule Payments</h3>
                <button className="dots-btn">•••</button>
            </div>

            <div className="payments-list">
                {payments.map(payment => (
                    <div key={payment.id} className="payment-item">
                        <div className="payment-info">
                            <span className="payment-name">{payment.name}</span>
                            <span className="payment-price">{payment.price}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduledPayments;
