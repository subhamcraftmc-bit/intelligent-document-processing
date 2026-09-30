import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { Navbar } from './components/Navbar';
import { ConnectionBanner } from './components/ConnectionBanner';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ProductTourModal } from './components/ProductTourModal';
import { CursorLight } from './components/CursorLight';
import { Footer } from './components/Footer';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { DocumentDetail } from './pages/DocumentDetail';
import { ReviewCenter } from './pages/ReviewCenter';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { HelpCenter } from './pages/HelpCenter';
import { PresentationMode } from './pages/PresentationMode';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { DocumentComparison } from './pages/DocumentComparison';
import { BackgroundDepth } from './components/BackgroundDepth';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedLayout: React.FC<{ 
  children: React.ReactNode;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onStartTour: () => void;
}> = ({ children, onOpenCommandPalette, onOpenShortcuts, onStartTour }) => {
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
    <div className="min-h-screen flex flex-col bg-[#07090e] w-full overflow-x-hidden relative">
      <Navbar 
        onOpenCommandPalette={onOpenCommandPalette} 
        onOpenShortcuts={onOpenShortcuts}
        onStartTour={onStartTour}
      />
      <ConnectionBanner />
      <main className="flex-1 pb-10">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export const AppContent: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

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
        setTourOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Background Depth Ambient Blobs (Phase 8) */}
      <BackgroundDepth />

      {/* Ambient Liquid Cursor Glow */}
      <CursorLight />

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Hackathon Pitch Presentation Deck */}
        <Route path="/presentation" element={<PresentationMode />} />

        {/* Protected Application Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
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
              onStartTour={() => setTourOpen(true)}
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
              onStartTour={() => setTourOpen(true)}
            >
              <ReviewCenter />
            </ProtectedLayout>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
            >
              <DocumentComparison />
            </ProtectedLayout>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
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
              onStartTour={() => setTourOpen(true)}
            >
              <Analytics />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
            >
              <Settings />
            </ProtectedLayout>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
            >
              <HelpCenter onStartTour={() => setTourOpen(true)} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedLayout 
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onStartTour={() => setTourOpen(true)}
            >
              <About />
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
              onStartTour={() => setTourOpen(true)}
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
        onStartTour={() => setTourOpen(true)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <ProductTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
