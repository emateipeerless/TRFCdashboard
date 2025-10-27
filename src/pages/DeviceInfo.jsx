import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  latestbydevice,
  getFirmwareLatest,
  postDeviceReset,
  postDeviceOTA,
} from '../api';
import Loader from '../components/Loader';

export default function DeviceInfo() {
  const { deviceId } = useParams();
  const [data, setData] = useState(null);
  const [fw, setFw] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const abortRef = useRef();

  const load = async () => {
    setErr('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const [item, latest] = await Promise.all([
        latestbydevice(deviceId, controller.signal),
        getFirmwareLatest('golf-pump', controller.signal),
      ]);
      setData(item);
      setFw(latest);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setErr(e.message || 'Error');
      }
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [deviceId]);

  const currentVer = data?.fw_version ?? '-';
  const cloudVer = fw?.version ?? '-';
  const needsUpdate = isVersionNewer(cloudVer, currentVer);

  async function doReset() {
    if (!confirm(`Reset device ${deviceId}?`)) return;
    setBusy(true);
    try {
      const res = await postDeviceReset(deviceId);
      alert(res.simulated ? 'Reset simulated (API pending).' : 'Reset command sent.');
    } catch (e) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doOTA() {
    if (!cloudVer || cloudVer === '-') return;
    if (!confirm(`OTA ${deviceId} to ${cloudVer}?`)) return;
    setBusy(true);
    try {
      const res = await postDeviceOTA(deviceId, cloudVer);
      alert(res.simulated
        ? `OTA simulated to ${cloudVer} (API pending).`
        : `OTA started to ${cloudVer}.`);
    } catch (e) {
      alert(`OTA failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card2">
      <div className="row2">
        <h2>Device {deviceId} — Info & Maintenance</h2>
        <div className="grow" />
        <Tabs deviceId={deviceId} active="info" />
      </div>

      {err && <div className="error2">Error: {err}</div>}
      {!data ? (
        <Loader />
      ) : (
        <>
          <section className="details-panel">
            <div className="details-title">Identity</div>
            <div className="details-grid">
              <Detail label="Device ID" value={data.device_id} />
              <Detail label="Site" value={data.site_id} />
              <Detail label="Model" value={data.model ?? 'golf-pump'} />
              <Detail label="FW (device)" value={currentVer} />
              <Detail label="Last Report" value={data.ts} />
              <Detail label="Received" value={data.received_at} />
              <Detail label="RSSI (dBm)" value={data.rssi_dbm} />
            </div>
          </section>

          <section className="details-panel" style={{ marginTop: 12 }}>
            <div className="details-title">Firmware</div>
            <div className="fw-row">
              <div className="fw-box">
                <div className="fw-label">Current on device</div>
                <div className="fw-value">{currentVer}</div>
              </div>
              <div className="fw-box">
                <div className="fw-label">Latest in cloud</div>
                <div className={`fw-value ${needsUpdate ? 'warn' : 'ok'}`}>{cloudVer}</div>
                {fw?.notes && (
                  <div className="muted" style={{ fontSize: 11 }}>{fw.notes}</div>
                )}
              </div>
              <div className="fw-actions">
                <button disabled={!needsUpdate || busy} onClick={doOTA}>
                  {needsUpdate ? `Update to ${cloudVer}` : 'Up to date'}
                </button>
              </div>
            </div>
          </section>

          <section className="details-panel" style={{ marginTop: 12 }}>
            <div className="details-title">Maintenance</div>
            <div className="maint-row">
              <button className="danger" disabled={busy} onClick={doReset}>
                Reset Device
              </button>
              <span className="muted">
                Sends a reboot request (simulated until API is implemented).
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? '-'}</div>
    </div>
  );
}

function isVersionNewer(a, b) {
  const pa = (a || '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = (b || '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}

function Tabs({ deviceId, active }) {
  return (
    <div className="tabs">
      <Link className={`tab ${active === 'overview' ? 'active' : ''}`} to={`/device/${encodeURIComponent(deviceId)}`}>
        Overview
      </Link>
      <Link className={`tab ${active === 'info' ? 'active' : ''}`} to={`/device/${encodeURIComponent(deviceId)}/info`}>
        Info & Maintenance
      </Link>
    </div>
  );
}