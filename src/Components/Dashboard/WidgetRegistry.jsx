import StatCard from './Widgets/StatCard/StatCard';
import UpcomingPrograms from './Widgets/UpcomingPrograms/UpcomingPrograms';
import TodoList from './Widgets/TodoList/TodoList';
import QuickActions from './Widgets/QuickActions/QuickActions';
import CalendarWidget from './Widgets/CalendarWidget/CalendarWidget';
import OverviewWidget from './Widgets/OverviewWidget/OverviewWidget';
import AttendanceWidget from './Widgets/AttendanceWidget/AttendanceWidget';
import AnnouncementsWidget from './Widgets/AnnouncementsWidget/AnnouncementsWidget';
import TimeWidget from './Widgets/TimeWidget/TimeWidget';
import DataAccessWidget from './Widgets/DataAccessWidget/DataAccessWidget';
import { Person, Church, VolunteerActivism } from '@mui/icons-material';


const StatCardWrapper = ({ settings }) => {
    let IconComponent;
    switch (settings.icon) {
        case 'person': IconComponent = <Person fontSize="large" />; break;
        case 'church': IconComponent = <Church fontSize="large" />; break;
        case 'volunteer': IconComponent = <VolunteerActivism fontSize="large" />; break;
        default: IconComponent = <Person fontSize="large" />;
    }

    return (
        <StatCard
            title={settings.title}
            amount={settings.amount}
            trend={settings.trend}
            trendLabel="From last week" // Default or fro settings
            trendDirection={settings.trend.includes('-') ? 'down' : 'up'} // Simple logic
            color={settings.color}
            icon={IconComponent}
        />
    );
};

export const WidgetRegistry = {
    stats: StatCardWrapper,
    programs: UpcomingPrograms,
    todo: TodoList,
    quickActions: QuickActions,

    calendar: CalendarWidget,
    memberOverview: OverviewWidget, // Transformed to generic
    ministers: OverviewWidget,
    ministries: OverviewWidget,
    attendance: AttendanceWidget,
    announcements: AnnouncementsWidget,
    time: TimeWidget,
    dataAccess: DataAccessWidget,
};
