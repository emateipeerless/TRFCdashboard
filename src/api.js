import { fetchAuthSession } from 'aws-amplify/auth';

const BASE = 'https://lyle5fozf7.execute-api.us-east-1.amazonaws.com';

async function authFetch(path, signal) {
  const { tokens } = await fetchAuthSession();
  const jwt = tokens?.idToken?.toString(); // User Pool JWT for your JWT authorizer

  const r = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${jwt}` },
    signal
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status}: ${text || r.statusText}`);
  }

  return r.json();
}

export async function latestbydevice(deviceId, signal) {
  return authFetch(`/devices/${encodeURIComponent(deviceId)}/latest`, signal);
}

export async function listDevicesBySite(siteId, nextKey = null, limit = 50, signal) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (nextKey) qs.set('nextKey', nextKey);
  return authFetch(`/sites/${encodeURIComponent(siteId)}/devices?${qs.toString()}`, signal);
}


// --- Firmware: get latest available from cloud (stub-friendly) ---
export async function getFirmwareLatest(model = 'golf-pump', signal) {
  try {
    // planned endpoint (implement later in API): GET /firmware/latest?model=...
    return await authFetch(`/firmware/latest?model=${encodeURIComponent(model)}`, signal);
  } catch (e) {
    // return a harmless placeholder if not implemented yet
    return { version: '0.3.2', notes: 'stubbed (API not implemented yet)' };
  }
}

// --- Maintenance actions (stubs) ---
export async function postDeviceReset(deviceId) {
  // planned endpoint: POST /devices/{deviceId}/actions/reset
  try {
    const { tokens } = await fetchAuthSession();
    const jwt = tokens?.idToken?.toString();
    const r = await fetch(`${BASE}/devices/${encodeURIComponent(deviceId)}/actions/reset`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'manual-ui' }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    // simulate success for now
    return { accepted: true, simulated: true };
  }
}

export async function postDeviceOTA(deviceId, version) {
  // planned endpoint: POST /devices/{deviceId}/actions/ota
  try {
    const { tokens } = await fetchAuthSession();
    const jwt = tokens?.idToken?.toString();
    const r = await fetch(`${BASE}/devices/${encodeURIComponent(deviceId)}/actions/ota`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    // simulate immediate acceptance
    return {
      accepted: true,
      targetVersion: version,
      simulated: true,
    };
  }
}