import Sidebar from './SideBar';
import Topbar from './TopBar';

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
