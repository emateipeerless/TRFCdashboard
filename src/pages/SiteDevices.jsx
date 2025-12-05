
// src/pages/SiteDevices.jsx
import { Link } from 'react-router-dom';
import { useSites } from '../SitesContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export default function Sites() {
  const { sites, loading, error } = useSites();

  const hasSites = Array.isArray(sites) && sites.length > 0;

  return (
    <div className="page sites-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Sites</h1>
          <p className="page-subtitle">
            All devices and sites assigned to your account. Select a row to open
            the latest snapshot or trends for that device.
          </p>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && <Loader text="Loading your sites…" />}

      {error && !loading && (
        <div className="error2">Error loading sites: {String(error)}</div>
      )}

      {!loading && !error && !hasSites && (
        <EmptyState
          title="No sites assigned yet"
          body="You don’t have any sites associated with your account. If you believe this is incorrect, contact your administrator."
        />
      )}

      {!loading && !error && hasSites && (
        <section className="panel">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title">Your devices</h2>
              <p className="panel-subtitle">
                One row per assigned site/device. Actions take you directly into
                the live device views.
              </p>
            </div>
          </div>

          <div className="sites-table-wrapper">
            <table className="sites-table">
              <thead>
                <tr>
                  <th align="left">Site / Device</th>
                  <th align="left">ID</th>
                  <th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => {
                  const id = site.site_id ?? site.id ?? '';
                  const name = site.name ?? id ?? 'Unnamed site';

                  return (
                    <tr key={id || Math.random()}>
                      <td>
                        <div className="sites-name-cell">
                          <span className="sites-name-primary">{name}</span>
                        </div>
                      </td>
                      <td>
                        <code className="sites-id">{id}</code>
                      </td>
                      <td>
                        <div className="sites-actions">
                          <Link
                            to={`/device/${encodeURIComponent(id)}`}
                            className="link2 subtle"
                          >
                            Latest snapshot
                          </Link>
                          <span className="sites-actions-sep">•</span>
                          <Link
                            to={`/trends/${encodeURIComponent(id)}`}
                            className="link2 subtle"
                          >
                            Trends
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
