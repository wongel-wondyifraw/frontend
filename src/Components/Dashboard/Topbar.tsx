'use client';

import TopbarGreeting from './TopbarGreeting';
import TopbarSearch from './TopbarSearch';
import TopbarActions from './TopbarActions';
import './TopBar.css';

export default function Topbar() {
  return (
    <div className="topbar-container">
      <TopbarGreeting />
      <div className="topbar-actions">
        <TopbarSearch />
        <TopbarActions />
      </div>
    </div>
  );
}
