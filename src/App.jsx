import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Sites from './pages/SiteDevices';
import Device from './pages/DeviceLatest';
import DeviceInfo from './pages/DeviceInfo';
import PrototypePage from './pages/PrototypePage';
import { SitesProvider } from './SitesContext';
import DeviceS from './pages/DeviceStyles';
import DeviceTrendsPage from './pages/DeviceTrends';

export default function App() {
  return (
    <Authenticator>
      <BrowserRouter>
      <SitesProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/prototype" replace />} />
            <Route path="sites/:deviceId" element={<Device />} />
            <Route path="/device/:deviceId" element={<Device />} />
            <Route path="/device/:deviceId/info" element={<DeviceInfo />} />
            <Route path="/prototype" element={<PrototypePage />} />
            <Route path="/styles/:deviceId" element={<DeviceS/>}/>
            <Route path='/trends/:deviceId' element={<DeviceTrendsPage/>} />
            <Route path="*" element={<Navigate to="/prototype" replace />} />
            <Route path="/sites" element={<Sites/>}/>
          </Routes>
        </AppLayout>
        </SitesProvider>
      </BrowserRouter>
    </Authenticator>
  );
}
