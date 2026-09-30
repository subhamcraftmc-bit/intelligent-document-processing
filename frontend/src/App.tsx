import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { ConnectionBanner } from './components/ConnectionBanner';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { DocumentDetail } from './pages/DocumentDetail';
import { ReviewCenter } from './pages/ReviewCenter';
import { Analytics } from './pages/Analytics';
import { NotFound } from './pages/NotFound';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedLayout: React.FC<{ 
  children: React.ReactNode;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}> = ({ children, onOpenCommandPalette, onOpenShortcuts }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] w-full overflow-x-hidden">
      <Navbar 
        onOpenCommandPalette={onOpenCommandPalette} 
        onOpenShortcuts={onOpenShortcuts} 
      />
      <ConnectionBanner />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500 font-mono">
        CineForge Intelligent Document Processing System • Powered by Google Gemini 2.0 Flash Multimodal Vision
      </footer>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Global keyboard shortcut listeners (Cmd+K / Ctrl+K and ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen(true);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <UploadPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <ReviewCenter />
            </ProtectedLayout>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <DocumentDetail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <Analytics />
            </ProtectedLayout>
          }
        />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Error 404 Route */}
        <Route 
          path="*" 
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
            >
              <NotFound />
            </ProtectedLayout>
          } 
        />
      </Routes>

      {/* Global Interactive Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
