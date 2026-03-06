import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import ManageMembers from './pages/Members/ManageMembers';
import MemberDetail from './pages/Members/MemberDetail';
import AddMember from './pages/Members/AddMember';
import ManageMinistries from './pages/Ministries/ManageMinistries';
import MinistryDetail from './pages/Ministries/MinistryDetail';
import AddMinistry from './pages/Ministries/AddMinistry';
import EditMinistry from './pages/Ministries/EditMinistry';
import Settings from './pages/Settings/Settings';
import Help from './pages/Help/Help';
import ScheduleManagement from './pages/Schedule/ScheduleManagement';
import HomeGroups from './pages/Members/HomeGroups';
import HomeGroupDetail from './pages/Members/HomeGroupDetail';
import BibleStudy from './pages/BibleStudy/BibleStudy';
import Subscription from './pages/Subscription/Subscription';
import EditMember from './pages/Members/EditMember';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members/manage" element={<ManageMembers />} />
        <Route path="/members/home-groups" element={<HomeGroups />} />
        <Route path="/members/home-groups/:id" element={<HomeGroupDetail />} />
        <Route path="/members/add" element={<AddMember />} />
        <Route path="/members/details/:id" element={<MemberDetail />} />
        <Route path="/ministries/manage" element={<ManageMinistries />} />
        <Route path="/members/edit/:id" element={<EditMember />} />
        <Route path="/ministries/add" element={<AddMinistry />} />
        <Route path="/ministries/edit/:id" element={<EditMinistry />} />
        <Route path="/ministries/details/:id" element={<MinistryDetail />} />
        <Route path="/bible-study" element={<BibleStudy />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/schedule" element={<ScheduleManagement />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
}

export default App;
