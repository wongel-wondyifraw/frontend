import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./index.css";
import "./Components/global.css";
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
)
