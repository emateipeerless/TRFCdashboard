import { useEffect, useRef, useState } from 'react';
import { listDevicesBySite } from '../api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import { useSites } from '../SitesContext';

export default function Sites() {
  const [siteId, setSiteId] = useState('');
  const [items, setItems] = useState([]);
  const [nextKey, setNextKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const abortRef = useRef();

  
const search = async (reset = true, siteOverride) => {
    const effectiveSiteId = (siteOverride ?? siteId ?? '').trim();
    if (!effectiveSiteId) return;

    setLoading(true);
    setErr('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
        const res = await listDevicesBySite(
            effectiveSiteId,
            reset ? null : nextKey,
            50,
            controller.signal
        );
        setItems(reset ? (res.items || []) : items.concat(res.items || []));
        setNextKey(res.nextKey || null);
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error(e);
            setErr(e.response?.data?.error || e.message);
        }
    } finally {
        setLoading(false);
    }
};


  useEffect(() => {
    if(!sitesLoading && sites.length>0 && !siteId){
      const first = sites[0].site_id;
      setSiteId(first);
      search(true,first);
    }
    //eslist-disable-next-line react-hooks/exhaustive-deps
  }, [sitesLoading, sites]);

  return (
    <div className="card2">
      <div className="row2">
        <h2>Sites</h2>
        <div className="grow" />
        
<div className="controls">
  {sitesError && (
    <div className="error2">
      Error loading sites: {sitesError}
    </div>
  )}

  <select
    value={siteId}
    onChange={(e) => {
      const newId = e.target.value;
      setSiteId(newId);
      search(true, newId);
    }}
    disabled={sitesLoading || sites.length === 0}
  >
    <option value="" disabled>
      {sitesLoading ? 'Loading sites…' : 'Select site'}
    </option>
    {sites.map((s) => (
      <option key={s.site_id} value={s.site_id}>
        {s.name ?? s.site_id}
      </option>
    ))}
  </select>

  <button
    onClick={() => search(true)}
    disabled={loading || !siteId}
  >
    Refresh
  </button>
</div>

      </div>
    </div>
  );
}

function fmt(n) {
  return (n === undefined || n === null) ? '-' : Number(n).toFixed(1);
}