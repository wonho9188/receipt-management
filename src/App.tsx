import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReceiptProvider } from './context/ReceiptContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReceiptsPage from './pages/ReceiptsPage';
import CalendarPage from './pages/CalendarPage';

export default function App() {
  return (
    <ReceiptProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ReceiptProvider>
  );
}
