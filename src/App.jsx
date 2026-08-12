import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAdminAuth from './hooks/useAdminAuth.js';
import PasswordGate from './pages/PasswordGate.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomTabs from './components/BottomTabs.jsx';
import Overview from './pages/Overview.jsx';
import Institutions from './pages/Institutions.jsx';
import Users from './pages/Users.jsx';
import Statistics from './pages/Statistics.jsx';
import Content from './pages/Content.jsx';

function Layout() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}

export default function App() {
  const { passed, status, error, tryPassword } = useAdminAuth();

  if (!passed) return <PasswordGate onSubmit={tryPassword} />;

  if (status !== 'ready') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        {status === 'error' ? <p className="text-red-600 text-center">{error}</p> : <LoadingSpinner />}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/users" element={<Users />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/content" element={<Content />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
