'use client';

import TopbarGreeting from './TopbarGreeting';
import TopbarActions from './TopbarActions';
import './TopBar.css';

export default function Topbar() {
  return (
    <div className="topbar-container">
      <div className="topbar-greeting-wrap">
        <TopbarGreeting />
      </div>
      <div className="topbar-icons-wrap">
        <TopbarActions />
      </div>
    </div>
  );
}
