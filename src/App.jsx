import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Sites from './pages/SiteDevices';
import Device from './pages/DeviceLatest';
import DeviceInfo from './pages/DeviceInfo';
import PrototypePage from './pages/PrototypePage';
import TestingGraph from './pages/GraphTest';

export default function App() {
  return (
    <Authenticator>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/sites" replace />} />
            <Route path="/sites" element={<Sites />} />
            <Route path="/device/:deviceId" element={<Device />} />
            <Route path="/device/:deviceId/info" element={<DeviceInfo />} />
            <Route path="/prototype" element={<PrototypePage />} />
            <Route path="*" element={<Navigate to="/sites" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </Authenticator>
  );
}
