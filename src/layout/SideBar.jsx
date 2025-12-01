import { NavLink } from 'react-router-dom';
import { useSites } from '../SitesContext';

export default function Sidebar() {
  const { sites, loading } = useSites();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>Turf</span>Connect
      </div>
      <nav className="nav">
        {!loading &&
          sites.map((site) => (
            <NavLink
              key={site.site_id}
              to={`/sites/${encodeURIComponent(site.site_id)}`}
              className="nav-link"
            >
              {site.name ?? site.site_id}
            </NavLink>
          ))}

        <NavLink to="/prototype" className="nav-link">
          Vibration Graph
        </NavLink>
        <NavLink to='/styles/TRFC3' className="nav-link">
        Testing Styles
        </NavLink>
      </nav>
      <div className="sidebar-foot">Peerless Pump v0.1</div>
    </aside>
  );
}
