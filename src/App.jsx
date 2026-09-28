import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAdminAuth from './hooks/useAdminAuth.js';
import Login from './pages/Login.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
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
  const { status } = useAdminAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'signed-out') return <Login />;
  if (status === 'unauthorized') return <Unauthorized />;

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
