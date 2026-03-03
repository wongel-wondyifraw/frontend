import React from 'react';
import { Calendar, theme } from 'antd';
import './CalendarWidget.css';

const CalendarWidget = () => {
    const { token } = theme.useToken();

    const wrapperStyle = {
        width: '100%',
        border: `none`,
        borderRadius: token.borderRadiusLG,
    };

    return (
        <div className="calendar-widget-card">
            <div style={wrapperStyle}>
                <Calendar fullscreen={false} />
            </div>
        </div>
    );
};

export default CalendarWidget;
