// src/pages/DeviceLatest.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { latestbydevice } from '../api';
import Gauge90 from '../components/Gauge90';
import Loader from '../components/Loader';
import StatusPill from '../components/StatusPill';

const REFRESH_MS = 10000;

export default function DeviceS() {
    const { deviceId } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    const [activeLayout, setActiveLayout] = useState('split'); // 'classic' | 'split' | 'grid'

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!deviceId) return;
            try {
                setErr('');
                if (!data) {
                    setLoading(true);
                }
                const result = await latestbydevice(deviceId);
                if (!cancelled) {
                    setData(result);
                }
            } catch (e) {
                if (!cancelled) {
                    console.error('Failed to load latest device data', e);
                    setErr('Failed to load latest data.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        // initial load
        load();

        // refresh interval
        const t = setInterval(load, REFRESH_MS);
        timerRef.current = t;

        return () => {
            cancelled = true;
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceId]);

    const running = isRunning(data);
    const deviceTs = data?.ts ?? data?.timestamp ?? null;
    const lastSeen = timeAgo(data?.ingested_at ?? data?.ts ?? null);

    return (
        <div className="page device-latest-page">
            {/* HEADER */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        Device{' '}
                        <span className="page-title-id">
                            {deviceId ?? (data && data.deviceId) ?? ''}
                        </span>
                    </h1>
                </div>
                {data && (
                    <div className="page-header-right">
                    </div>
                )}
            </div>

            {/* LAYOUT TABS */}
            <div
                className="layout-tabs"
                style={{ marginTop: 12, marginBottom: 16, display: 'flex', gap: 8 }}
                >
                    <LayoutTabButton
                        id="split"
                        label="Pump vs Environment"
                        active={activeLayout === 'split'}
                        onClick={() => setActiveLayout('split')}
                        />
                        <LayoutTabButton
                            id="grid"
                            label="KPI Grid"
                            active={activeLayout === 'grid'}
                            onClick={() => setActiveLayout('grid')}
                            />
                        </div>

                        {loading && !data && (
                            <div style={{ marginTop: 32 }}>
                                <Loader />
                            </div>
                        )}

                        {err && (
                            <div className="error-banner" style={{ marginTop: 12 }}>
                                {err}
                            </div>
                        )}

                        {!loading && !data && !err && (
                            <div className="muted" style={{ marginTop: 24 }}>
                                No data available for this device yet.
                            </div>
                        )}

                        {data && (
                            <>
                                {activeLayout === 'classic' && (
                                    <DeviceLayoutA
                                        data={data}
                                        running={running}
                                        deviceTs={deviceTs}
                                        lastSeen={lastSeen}
                                        />
                                    )}
                                    {activeLayout === 'split' && (
                                        <DeviceLayoutB
                                            data={data}
                                            running={running}
                                            deviceTs={deviceTs}
                                            lastSeen={lastSeen}
                                            />
                                        )}
                                        {activeLayout === 'grid' && (
                                            <DeviceLayoutC
                                                data={data}
                                                running={running}
                                                deviceTs={deviceTs}
                                                lastSeen={lastSeen}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        }

                        /* ------------------------------
                        * Layout selector button
                        * ------------------------------ */
                        function LayoutTabButton({ label, active, onClick }) {
                            return (
                                <button
                                    type="button"
                                    onClick={onClick}
                                    className={active ? 'layout-tab layout-tab--active' : 'layout-tab'}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 999,
                                        border: active
                                        ? '1px solid rgba(96,165,250,0.9)'
                                        : '1px solid rgba(55,65,81,0.9)',
                                        background: active
                                        ? 'rgba(37,99,235,0.15)'
                                        : 'rgba(15,23,42,0.8)',
                                        color: 'white',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                    >
                                    {label}
                                </button>
                            );
                        }

                        /* ------------------------------
                        * Layout A – Classic dashboard + diagnostics
                        * ------------------------------ */
                        function DeviceLayoutA({ data, running, deviceTs, lastSeen }) {
                            return (
                                <>
                                    <div className="summary2" style={{ marginBottom: 16 }}>
                                        <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
                                        <span className="muted">Device TS: {deviceTs ?? '-'}</span>
                                            <span className="muted">Received: {lastSeen}</span>
                                            </div>

                                            {/* Core pump metrics */}
                                            <div className="g90-grid">
                                                <Gauge90
                                                    label="Pressure"
                                                    value={getNum(data, ['pressure_psi', 'pressure', 'press'])}
                                                    min={0}
                                                    max={150}
                                                    units="psi"
                                                    goodMin={40}
                                                    goodMax={110}
                                                    />
                                                    <Gauge90
                                                        label="Temperature"
                                                        value={getNum(data, ['temp_c', 'temperature_c', 'temperature'])}
                                                        min={0}
                                                        max={70}
                                                        units="°C"
                                                        goodMin={5}
                                                        goodMax={45}
                                                        />
                                                        <Gauge90
                                                            label="Vibration"
                                                            value={getNum(data, ['vibration_rms', 'vibration'])}
                                                            min={0}
                                                            max={4000}
                                                            units="mg RMS"
                                                            goodMin={1000}
                                                            goodMax={3000}
                                                            />
                                                        </div>

                                                        {/* Environment metrics */}
                                                        <div className="g90-grid">
                                                            <Gauge90
                                                                label="Parts per Million"
                                                                value={getNum(data, ['parts_per_million', 'ppm'])}
                                                                min={0}
                                                                max={2000}
                                                                units="ppm"
                                                                goodMin={200}
                                                                goodMax={1200}
                                                                />
                                                                <Gauge90
                                                                    label="Soil Moisture"
                                                                    value={getNum(data, ['soil_moisture_pct', 'soil_moisture'])}
                                                                    min={0}
                                                                    max={100}
                                                                    units="%"
                                                                    goodMin={20}
                                                                    goodMax={60}
                                                                    />
                                                                    <Gauge90
                                                                        label="Soil pH"
                                                                        value={getNum(data, ['soil_ph', 'ph'])}
                                                                        min={3}
                                                                        max={10}
                                                                        units="pH"
                                                                        goodMin={5.8}
                                                                        goodMax={7.2}
                                                                        />
                                                                    </div>

                                                                    {/* Electrical conductivity */}
                                                                    <div className="lastone">
                                                                        <Gauge90
                                                                            label="Electrical Conductivity"
                                                                            value={getNum(data, [
                                                                            'electrical_conductivity_ms_cm',
                                                                            'ec_ms_cm',
                                                                            'soil_ec',
                                                                            ])}
                                                                            min={0}
                                                                            max={10}
                                                                            units="mS/cm"
                                                                            goodMin={0.5}
                                                                            goodMax={3.0}
                                                                            />
                                                                        </div>

                                                                        {/* Static diagnostics */}
                                                                        <VibrationDiagnostics />
                                                                    </>
                                                                );
                                                            }

                                                            /* ------------------------------
                                                            * Layout B – Two-column (Pump vs Environment)
                                                            * ------------------------------ */
                                                            function DeviceLayoutB({ data, running, deviceTs, lastSeen }) {
                                                                const starts24h = data?.starts_24h ?? data?.pump_starts_24h ?? null;
                                                                const stops24h = data?.stops_24h ?? data?.pump_stops_24h ?? null;
                                                                const runtime24h = data?.runtime_s_24h ?? data?.pump_runtime_s_24h ?? null;

                                                                return (
                                                                    <div
                                                                        style={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: '2fr 1.3fr',
                                                                            gap: 24,
                                                                            marginTop: 8,
                                                                        }}
                                                                        >
                                                                        {/* LEFT – Pump Health */}
                                                                        <div
                                                                            style={{
                                                                                background: 'rgba(15,23,42,0.95)',
                                                                                borderRadius: 16,
                                                                                padding: 20,
                                                                                border: '1px solid rgba(31,41,55,1)',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: 16,
                                                                            }}
                                                                            >
                                                                            <div
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 12,
                                                                                    flexWrap: 'wrap',
                                                                                }}
                                                                                >
                                                                                <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
                                                                                <span className="muted">Device TS: {deviceTs ?? '-'}</span>
                                                                                    <span className="muted">Received: {lastSeen}</span>
                                                                                    </div>

                                                                                    <div
                                                                                        style={{
                                                                                            display: 'grid',
                                                                                            gridTemplateColumns: '1fr',
                                                                                            gap: 12,
                                                                                        }}
                                                                                        >
                                                                                        <Gauge90
                                                                                            label="Discharge Pressure"
                                                                                            value={getNum(data, ['pressure_psi', 'pressure'])}
                                                                                            min={0}
                                                                                            max={150}
                                                                                            units="psi"
                                                                                            goodMin={40}
                                                                                            goodMax={110}
                                                                                            size={220}
                                                                                            />
                                                                                            <Gauge90
                                                                                                label="Vibration"
                                                                                                value={getNum(data, ['vibration_rms', 'vibration'])}
                                                                                                min={0}
                                                                                                max={4000}
                                                                                                units="mg RMS"
                                                                                                goodMin={1000}
                                                                                                goodMax={3000}
                                                                                                size={220}
                                                                                                />
                                                                                            </div>

                                                                                            <div
                                                                                                style={{
                                                                                                    display: 'grid',
                                                                                                    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                                                                                                    gap: 12,
                                                                                                    marginTop: 8,
                                                                                                }}
                                                                                                >
                                                                                                <KPI label="Pump Runs (24h)" value={fmtInt(starts24h) ?? '-'} />
                                                                                                <KPI label="Runtime (24h)" value={fmtDuration(runtime24h) ?? '-'} />
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* RIGHT – Environment */}
                                                                                        <div
                                                                                            style={{
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column',
                                                                                                gap: 16,
                                                                                            }}
                                                                                            >
                                                                                            <div
                                                                                                style={{
                                                                                                    background: 'rgba(15,23,42,0.95)',
                                                                                                    borderRadius: 16,
                                                                                                    padding: 20,
                                                                                                    border: '1px solid rgba(31,41,55,1)',
                                                                                                }}
                                                                                                >
                                                                                                <h3
                                                                                                    style={{
                                                                                                        margin: 0,
                                                                                                        marginBottom: 10,
                                                                                                        fontSize: '1rem',
                                                                                                        color: 'white',
                                                                                                    }}
                                                                                                    >
                                                                                                    Environment
                                                                                                </h3>

                                                                                                <div
                                                                                                    style={{
                                                                                                        display: 'grid',
                                                                                                        gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                                                                                                        gap: 12,
                                                                                                    }}
                                                                                                    >
                                                                                                    <Gauge90
                                                                                                        label="Temperature"
                                                                                                        value={getNum(data, ['temp_c', 'temperature_c', 'temperature'])}
                                                                                                        min={0}
                                                                                                        max={70}
                                                                                                        units="°C"
                                                                                                        goodMin={5}
                                                                                                        goodMax={45}
                                                                                                        size={150}
                                                                                                        />
                                                                                                        <Gauge90
                                                                                                            label="Parts per Million"
                                                                                                            value={getNum(data, ['parts_per_million', 'ppm'])}
                                                                                                            min={0}
                                                                                                            max={2000}
                                                                                                            units="ppm"
                                                                                                            goodMin={200}
                                                                                                            goodMax={1200}
                                                                                                            size={150}
                                                                                                            />
                                                                                                            <Gauge90
                                                                                                                label="Soil Moisture"
                                                                                                                value={getNum(data, ['soil_moisture_pct', 'soil_moisture'])}
                                                                                                                min={0}
                                                                                                                max={100}
                                                                                                                units="%"
                                                                                                                goodMin={20}
                                                                                                                goodMax={60}
                                                                                                                size={150}
                                                                                                                />
                                                                                                                <Gauge90
                                                                                                                    label="Soil pH"
                                                                                                                    value={getNum(data, ['soil_ph', 'ph'])}
                                                                                                                    min={3}
                                                                                                                    max={10}
                                                                                                                    units="pH"
                                                                                                                    goodMin={5.8}
                                                                                                                    goodMax={7.2}
                                                                                                                    size={150}
                                                                                                                    />
                                                                                                                </div>

                                                                                                                <div style={{ marginTop: 12 }}>
                                                                                                                    <KPI
                                                                                                                        label="Electrical Conductivity"
                                                                                                                        value={
                                                                                                                            data?.electrical_conductivity_ms_cm != null
                                                                                                                            ? `${Number(
                                                                                                                                data.electrical_conductivity_ms_cm
                                                                                                                            ).toFixed(2)} mS/cm`
                                                                                                                            : '-'
                                                                                                                        }
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                </div>

                                                                                                                {/* Static recent run chart */}
                                                                                                                <div
                                                                                                                    style={{
                                                                                                                        background: 'rgba(15,23,42,0.95)',
                                                                                                                        borderRadius: 16,
                                                                                                                        padding: 16,
                                                                                                                        border: '1px solid rgba(31,41,55,1)',
                                                                                                                    }}
                                                                                                                    >
                                                                                                                    <h4
                                                                                                                        style={{
                                                                                                                            margin: 0,
                                                                                                                            marginBottom: 4,
                                                                                                                            fontSize: '0.9rem',
                                                                                                                            color: 'white',
                                                                                                                        }}
                                                                                                                        >
                                                                                                                        Recent Run Durations (sample)
                                                                                                                    </h4>
                                                                                                                    <MiniBarChart
                                                                                                                        items={[
                                                                                                                        { label: '10:00', value: 420 },
                                                                                                                        { label: '09:15', value: 380 },
                                                                                                                        { label: '07:42', value: 1020 },
                                                                                                                        { label: '06:10', value: 265 },
                                                                                                                        ]}
                                                                                                                        height={140}
                                                                                                                        yLabel="seconds"
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }

                                                                                                    /* ------------------------------
                                                                                                    * Layout C – Compact KPI grid plus graphs on the right
                                                                                                    * ------------------------------ */
                                                                                                    function DeviceLayoutC({ data, running, deviceTs, lastSeen }) {
                                                                                                        const cards = [
                                                                                                        {
                                                                                                            key: 'pressure',
                                                                                                            title: 'Pressure',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['pressure_psi', 'pressure']),
                                                                                                                min: 0,
                                                                                                                max: 150,
                                                                                                                units: 'psi',
                                                                                                                goodMin: 40,
                                                                                                                goodMax: 110,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.pressure_psi != null || data?.pressure != null
                                                                                                            ? `${getNum(data, ['pressure_psi', 'pressure']).toFixed(1)} psi`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'temp',
                                                                                                            title: 'Temperature',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['temp_c', 'temperature_c', 'temperature']),
                                                                                                                min: 0,
                                                                                                                max: 70,
                                                                                                                units: '°C',
                                                                                                                goodMin: 5,
                                                                                                                goodMax: 45,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.temp_c != null ||
                                                                                                            data?.temperature_c != null ||
                                                                                                            data?.temperature != null
                                                                                                            ? `${getNum(
                                                                                                                data,
                                                                                                                ['temp_c', 'temperature_c', 'temperature']
                                                                                                            ).toFixed(1)} °C`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'vibration',
                                                                                                            title: 'Vibration',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['vibration_rms', 'vibration']),
                                                                                                                min: 0,
                                                                                                                max: 4000,
                                                                                                                units: 'mg RMS',
                                                                                                                goodMin: 1000,
                                                                                                                goodMax: 3000,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.vibration_rms != null || data?.vibration != null
                                                                                                            ? `${getNum(
                                                                                                                data,
                                                                                                                ['vibration_rms', 'vibration']
                                                                                                            ).toFixed(0)} mg RMS`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'ppm',
                                                                                                            title: 'Parts per Million',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['parts_per_million', 'ppm']),
                                                                                                                min: 0,
                                                                                                                max: 2000,
                                                                                                                units: 'ppm',
                                                                                                                goodMin: 200,
                                                                                                                goodMax: 1200,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.parts_per_million != null || data?.ppm != null
                                                                                                            ? `${getNum(
                                                                                                                data,
                                                                                                                ['parts_per_million', 'ppm']
                                                                                                            ).toFixed(0)} ppm`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'moisture',
                                                                                                            title: 'Soil Moisture',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['soil_moisture_pct', 'soil_moisture']),
                                                                                                                min: 0,
                                                                                                                max: 100,
                                                                                                                units: '%',
                                                                                                                goodMin: 20,
                                                                                                                goodMax: 60,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.soil_moisture_pct != null || data?.soil_moisture != null
                                                                                                            ? `${getNum(
                                                                                                                data,
                                                                                                                ['soil_moisture_pct', 'soil_moisture']
                                                                                                            ).toFixed(0)} %`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'ph',
                                                                                                            title: 'Soil pH',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, ['soil_ph', 'ph']),
                                                                                                                min: 3,
                                                                                                                max: 10,
                                                                                                                units: 'pH',
                                                                                                                goodMin: 5.8,
                                                                                                                goodMax: 7.2,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.soil_ph != null || data?.ph != null
                                                                                                            ? getNum(data, ['soil_ph', 'ph']).toFixed(1)
                                                                                                            : '-',
                                                                                                        },
                                                                                                        {
                                                                                                            key: 'ec',
                                                                                                            title: 'Electrical Conductivity',
                                                                                                            gaugeProps: {
                                                                                                                value: getNum(data, [
                                                                                                                'electrical_conductivity_ms_cm',
                                                                                                                'ec_ms_cm',
                                                                                                                'soil_ec',
                                                                                                                ]),
                                                                                                                min: 0,
                                                                                                                max: 10,
                                                                                                                units: 'mS/cm',
                                                                                                                goodMin: 0.5,
                                                                                                                goodMax: 3.0,
                                                                                                                size: 140,
                                                                                                            },
                                                                                                            footer:
                                                                                                            data?.electrical_conductivity_ms_cm != null ||
                                                                                                            data?.ec_ms_cm != null ||
                                                                                                            data?.soil_ec != null
                                                                                                            ? `${getNum(
                                                                                                                data,
                                                                                                                [
                                                                                                                'electrical_conductivity_ms_cm',
                                                                                                                'ec_ms_cm',
                                                                                                                'soil_ec',
                                                                                                                ]
                                                                                                            ).toFixed(2)} mS/cm`
                                                                                                            : '-',
                                                                                                        },
                                                                                                        ];

                                                                                                        return (
                                                                                                            <div style={{ marginTop: 8 }}>
                                                                                                                <div
                                                                                                                    className="summary2"
                                                                                                                    style={{
                                                                                                                        marginBottom: 16,
                                                                                                                        display: 'flex',
                                                                                                                        gap: 12,
                                                                                                                        flexWrap: 'wrap',
                                                                                                                    }}
                                                                                                                    >
                                                                                                                    <StatusPill ok={running} text={running ? 'Running' : 'Stopped'} />
                                                                                                                    <span className="muted">Device TS: {deviceTs ?? '-'}</span>
                                                                                                                        <span className="muted">Received: {lastSeen}</span>
                                                                                                                        </div>

                                                                                                                        <div
                                                                                                                            style={{
                                                                                                                                display: 'grid',
                                                                                                                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                                                                                                                gap: 16,
                                                                                                                            }}
                                                                                                                            >
                                                                                                                            {cards.map((card) => (
                                                                                                                                <div
                                                                                                                                    key={card.key}
                                                                                                                                    style={{
                                                                                                                                        background: 'rgba(15,23,42,0.95)',
                                                                                                                                        borderRadius: 16,
                                                                                                                                        padding: 12,
                                                                                                                                        border: '1px solid rgba(31,41,55,1)',
                                                                                                                                        display: 'flex',
                                                                                                                                        flexDirection: 'column',
                                                                                                                                        alignItems: 'center',
                                                                                                                                        gap: 8,
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    <div
                                                                                                                                        style={{
                                                                                                                                            fontSize: '0.9rem',
                                                                                                                                            fontWeight: 600,
                                                                                                                                            color: 'rgba(255,255,255,0.85)',
                                                                                                                                        }}
                                                                                                                                        >
                                                                                                                                        {card.title}
                                                                                                                                    </div>
                                                                                                                                    <Gauge90 label="" {...card.gaugeProps} />
                                                                                                                                    <div
                                                                                                                                        style={{
                                                                                                                                            fontSize: '0.8rem',
                                                                                                                                            color: 'rgba(156,163,175,1)',
                                                                                                                                            marginTop: 4,
                                                                                                                                        }}
                                                                                                                                        >
                                                                                                                                        {card.footer}
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            ))}
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                );
                                                                                                            }

                                                                                                            /* ------------------------------
                                                                                                            * Static Vibration Diagnostics (white text)
                                                                                                            * ------------------------------ */
                                                                                                            function VibrationDiagnostics() {
                                                                                                                const diag = {
                                                                                                                    window: '7d',
                                                                                                                    pump_starts: 12,
                                                                                                                    pump_stops: 12,
                                                                                                                    total_runtime_s: 15420,
                                                                                                                    recent_runs: [
                                                                                                                    { started_at: '10/29 08:12', duration_s: 420 },
                                                                                                                    { started_at: '10/29 07:48', duration_s: 380 },
                                                                                                                    { started_at: '10/29 06:15', duration_s: 1020 },
                                                                                                                    { started_at: '10/29 05:32', duration_s: 265 },
                                                                                                                    ],
                                                                                                                };

                                                                                                                return (
                                                                                                                    <section
                                                                                                                        style={{
                                                                                                                            marginTop: 24,
                                                                                                                            padding: 20,
                                                                                                                            borderRadius: 16,
                                                                                                                            background: 'rgba(15,23,42,0.95)',
                                                                                                                            border: '1px solid rgba(31,41,55,1)',
                                                                                                                            color: 'white',
                                                                                                                        }}
                                                                                                                        >
                                                                                                                        <div
                                                                                                                            style={{
                                                                                                                                display: 'flex',
                                                                                                                                justifyContent: 'space-between',
                                                                                                                                gap: 24,
                                                                                                                                alignItems: 'flex-start',
                                                                                                                                flexWrap: 'wrap',
                                                                                                                            }}
                                                                                                                            >
                                                                                                                            <div style={{ flex: '1 1 220px' }}>
                                                                                                                                <h3
                                                                                                                                    style={{
                                                                                                                                        margin: 0,
                                                                                                                                        marginBottom: 4,
                                                                                                                                        fontSize: '1rem',
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    Vibration Diagnostics
                                                                                                                                </h3>
                                                                                                                                <p
                                                                                                                                    style={{
                                                                                                                                        margin: 0,
                                                                                                                                        marginBottom: 12,
                                                                                                                                        fontSize: '0.85rem',
                                                                                                                                        color: 'rgba(209,213,219,1)',
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    Sample diagnostic view for the last {diag.window}. These values are
                                                                                                                                    static placeholders for now.
                                                                                                                                </p>

                                                                                                                                <div
                                                                                                                                    style={{
                                                                                                                                        display: 'grid',
                                                                                                                                        gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                                                                                                                                        gap: 12,
                                                                                                                                        marginTop: 8,
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    <KPI label="Pump Starts" value={fmtInt(diag.pump_starts)} />
                                                                                                                                    <KPI label="Pump Stops" value={fmtInt(diag.pump_stops)} />
                                                                                                                                    <KPI
                                                                                                                                        label="Total Runtime"
                                                                                                                                        value={fmtDuration(diag.total_runtime_s)}
                                                                                                                                        />
                                                                                                                                    </div>
                                                                                                                                </div>

                                                                                                                                <div style={{ flex: '1 1 260px', minWidth: 260 }}>
                                                                                                                                    <MiniBarChart
                                                                                                                                        items={diag.recent_runs.map((r) => ({
                                                                                                                                            label: r.started_at,
                                                                                                                                            value: r.duration_s,
                                                                                                                                        }))}
                                                                                                                                        height={160}
                                                                                                                                        yLabel="seconds"
                                                                                                                                        />
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            </section>
                                                                                                                        );
                                                                                                                    }

                                                                                                                    /* ------------------------------
                                                                                                                    * Mini bar chart (simple flex-based)
                                                                                                                    * ------------------------------ */
                                                                                                                    function MiniBarChart({ items, height = 140, yLabel }) {
                                                                                                                        const max = Math.max(
                                                                                                                            ...items.map((i) => (typeof i.value === 'number' ? i.value : 0)),
                                                                                                                            1
                                                                                                                        );

                                                                                                                        return (
                                                                                                                            <div>
                                                                                                                                <div
                                                                                                                                    style={{
                                                                                                                                        display: 'flex',
                                                                                                                                        alignItems: 'flex-end',
                                                                                                                                        gap: 8,
                                                                                                                                        height,
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    {items.map((item) => {
                                                                                                                                        const pct = Math.max(0, Math.min(1, item.value / max));
                                                                                                                                        return (
                                                                                                                                            <div
                                                                                                                                                key={item.label}
                                                                                                                                                style={{
                                                                                                                                                    flex: '1 1 0',
                                                                                                                                                    display: 'flex',
                                                                                                                                                    flexDirection: 'column',
                                                                                                                                                    alignItems: 'center',
                                                                                                                                                    gap: 4,
                                                                                                                                                }}
                                                                                                                                                >
                                                                                                                                                <div
                                                                                                                                                    style={{
                                                                                                                                                        width: '100%',
                                                                                                                                                        height: `${pct * 100}%`,
                                                                                                                                                        borderRadius: 6,
                                                                                                                                                        background:
                                                                                                                                                        'linear-gradient(to top, rgba(59,130,246,0.9), rgba(129,140,248,0.9))',
                                                                                                                                                    }}
                                                                                                                                                    />
                                                                                                                                                    <div
                                                                                                                                                        style={{
                                                                                                                                                            fontSize: 10,
                                                                                                                                                            color: 'rgba(209,213,219,1)',
                                                                                                                                                            textAlign: 'center',
                                                                                                                                                            lineHeight: 1.2,
                                                                                                                                                        }}
                                                                                                                                                        >
                                                                                                                                                        {item.label}
                                                                                                                                                    </div>
                                                                                                                                                </div>
                                                                                                                                            );
                                                                                                                                        })}
                                                                                                                                    </div>
                                                                                                                                    {yLabel && (
                                                                                                                                        <div
                                                                                                                                            style={{
                                                                                                                                                marginTop: 6,
                                                                                                                                                fontSize: 10,
                                                                                                                                                color: 'rgba(156,163,175,1)',
                                                                                                                                                textAlign: 'right',
                                                                                                                                            }}
                                                                                                                                            >
                                                                                                                                            {yLabel}
                                                                                                                                        </div>
                                                                                                                                    )}
                                                                                                                                </div>
                                                                                                                            );
                                                                                                                        }

                                                                                                                        /* ------------------------------
                                                                                                                        * Generic KPI pill
                                                                                                                        * ------------------------------ */
                                                                                                                        function KPI({ label, value }) {
                                                                                                                            return (
                                                                                                                                <div
                                                                                                                                    style={{
                                                                                                                                        padding: '8px 10px',
                                                                                                                                        borderRadius: 10,
                                                                                                                                        border: '1px solid rgba(55,65,81,1)',
                                                                                                                                        background: 'rgba(17,24,39,1)',
                                                                                                                                    }}
                                                                                                                                    >
                                                                                                                                    <div
                                                                                                                                        style={{
                                                                                                                                            fontSize: '0.7rem',
                                                                                                                                            textTransform: 'uppercase',
                                                                                                                                            letterSpacing: '0.06em',
                                                                                                                                            color: 'rgba(156,163,175,1)',
                                                                                                                                            marginBottom: 2,
                                                                                                                                        }}
                                                                                                                                        >
                                                                                                                                        {label}
                                                                                                                                    </div>
                                                                                                                                    <div
                                                                                                                                        style={{
                                                                                                                                            fontSize: '0.95rem',
                                                                                                                                            fontWeight: 600,
                                                                                                                                            color: 'white',
                                                                                                                                        }}
                                                                                                                                        >
                                                                                                                                        {value ?? '-'}
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            );
                                                                                                                        }

                                                                                                                        /* ------------------------------
                                                                                                                        * Helpers
                                                                                                                        * ------------------------------ */
                                                                                                                        function getNum(obj, keys) {
                                                                                                                            if (!obj) return 0;
                                                                                                                            for (const k of keys) {
                                                                                                                                if (obj[k] === null || obj[k] === undefined) continue;
                                                                                                                                const n = Number(obj[k]);
                                                                                                                                if (!Number.isNaN(n) && Number.isFinite(n)) {
                                                                                                                                    return n;
                                                                                                                                }
                                                                                                                            }
                                                                                                                            return 0;
                                                                                                                        }

                                                                                                                        function isRunning(data) {
                                                                                                                            if (!data) return false;
                                                                                                                            const candidates = [data.pump_running, data.running, data.isRunning, data.is_running];
                                                                                                                            for (const c of candidates) {
                                                                                                                                if (c === null || c === undefined) continue;
                                                                                                                                if (typeof c === 'boolean') return c;
                                                                                                                                if (typeof c === 'number') return c !== 0;
                                                                                                                                if (typeof c === 'string') {
                                                                                                                                    const s = c.toLowerCase();
                                                                                                                                    if (s === 'true' || s === 'running' || s === 'on' || s === '1') return true;
                                                                                                                                    if (s === 'false' || s === 'stopped' || s === 'off' || s === '0') return false;
                                                                                                                                }
                                                                                                                            }
                                                                                                                            return false;
                                                                                                                        }

                                                                                                                        function timeAgo(ts) {
                                                                                                                            if (!ts) return '-';
                                                                                                                            let date;
                                                                                                                            if (typeof ts === 'number') {
                                                                                                                                // assume seconds if too small
                                                                                                                                if (ts < 1e12) {
                                                                                                                                    date = new Date(ts * 1000);
                                                                                                                                } else {
                                                                                                                                    date = new Date(ts);
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                const parsed = Date.parse(ts);
                                                                                                                                if (!Number.isNaN(parsed)) {
                                                                                                                                    date = new Date(parsed);
                                                                                                                                } else {
                                                                                                                                    return String(ts);
                                                                                                                                }
                                                                                                                            }
                                                                                                                            const now = new Date();
                                                                                                                            const diffMs = now - date;
                                                                                                                            if (diffMs < 0) return 'just now';
                                                                                                                            const sec = Math.floor(diffMs / 1000);
                                                                                                                            const min = Math.floor(sec / 60);
                                                                                                                            const hr = Math.floor(min / 60);
                                                                                                                            const day = Math.floor(hr / 24);

                                                                                                                            if (day > 0) return `${day}d ${hr % 24}h ago`;
                                                                                                                            if (hr > 0) return `${hr}h ${min % 60}m ago`;
                                                                                                                            if (min > 0) return `${min}m ago`;
                                                                                                                            return `${sec}s ago`;
                                                                                                                        }

                                                                                                                        function fmtInt(n) {
                                                                                                                            if (n === null || n === undefined) return null;
                                                                                                                            return Number(n).toLocaleString();
                                                                                                                        }

                                                                                                                        function fmtDuration(seconds) {
                                                                                                                            if (seconds === null || seconds === undefined) return null;
                                                                                                                            const s = Math.max(0, Math.round(seconds));
                                                                                                                            const h = Math.floor(s / 3600);
                                                                                                                            const m = Math.floor((s % 3600) / 60);
                                                                                                                            const sec = s % 60;
                                                                                                                            if (h) return `${h}h ${m}m`;
                                                                                                                            if (m) return `${m}m ${sec}s`;
                                                                                                                            return `${sec}s`;
                                                                                                                        }