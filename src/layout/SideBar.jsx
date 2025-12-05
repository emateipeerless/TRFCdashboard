
// src/layout/SideBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSites } from '../SitesContext';
import logo from '../assets/logo.png'

export default function Sidebar() {
  const { sites, loading } = useSites();

  const linkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link';

  return (
    <aside className="sidebar">
      {/* Brand / logo area */}
      <div className="sidebar-logo-image">
      <img src={logo} alt="TurfConnect LOGO" />
      </div>

      {/* Navigation sections */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {/* Overview section */}
        <div className="nav-section">
          <div className="nav-section-label">Overview</div>
          <ul className="nav-list">
            <li>
              <NavLink to="/sites" className={linkClass}>
                <span className="nav-link-indicator" aria-hidden="true" />
                <span className="nav-link-label">Sites</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Sites section – driven by useSites (per-user visibility) */}
        <div className="nav-section">
          <div className="nav-section-label">Sites</div>
          <ul className="nav-list">
            {loading && (
              <li
                className="nav-link-label muted"
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                Loading sites…
              </li>
            )}

            {!loading &&
              sites?.map((site) => (
                <li key={site.site_id}>
                  <NavLink
                    to={`/trends/${encodeURIComponent(site.site_id)}`}
                    className={linkClass}
                  >
                    <span className="nav-link-indicator" aria-hidden="true" />
                    <span className="nav-link-label">
                      {site.name ?? site.site_id}
                    </span>
                  </NavLink>
                </li>
              ))}
          </ul>
        </div>

        {/* Analysis section */}
        <div className="nav-section">
          <div className="nav-section-label">Analysis</div>
          <ul className="nav-list">
            <li>
              <NavLink to="/prototype" className={linkClass}>
                <span className="nav-link-indicator" aria-hidden="true" />
                <span className="nav-link-label">Vibration Analysis</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="sidebar-env">Production</span>
        <span className="sidebar-version">Peerless Pump v0.1</span>
      </div>
    </aside>
  );
}
