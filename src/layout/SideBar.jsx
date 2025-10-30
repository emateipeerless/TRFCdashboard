import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>Turf</span>Connect
      </div>
      <nav className="nav">
        <NavLink to="/sites" className="nav-link">Sites</NavLink>
        <NavLink to="/device/TRFC-1" className="nav-link">TRFC-1</NavLink>
        <NavLink to="/device/TRFC2" className="nav-link">TRFC2</NavLink>
        <NavLink to="/device/TRFC3" className="nav-link">TRFC3</NavLink>
      </nav>
      <div className="sidebar-foot">Peerless Pump v0.1</div>
    </aside>
  );}
