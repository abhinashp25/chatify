import { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import ChatPage    from './pages/ChatPage';
import LoginPage   from './pages/LoginPage';
import SignUpPage  from './pages/SignupPage';
import { useAuthStore } from "./store/useAuthStore";
import { useSettingsStore } from "./store/useSettingsStore";
import PageLoader  from './components/PageLoader';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { applyStoredTheme } = useSettingsStore();
  useEffect(() => { checkAuth(); applyStoredTheme(); }, [checkAuth]);
  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="app-bg min-h-screen min-h-[100dvh]">
      <Routes>
        <Route path="/"       element={authUser ? <ChatPage />  : <Navigate to="/login" />} />
        <Route path="/login"  element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2c34', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <SpeedInsights />
    </div>
  );
}
export default App;
