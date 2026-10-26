import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { BiblePage } from './pages/BiblePage';
import { SearchPage } from './pages/SearchPage';
import { PlanPage } from './pages/PlanPage';
import { SermonsPage } from './pages/SermonsPage';
import { SermonDetailPage } from './pages/SermonDetailPage';
import { HighlightsPage } from './pages/HighlightsPage';
import { NotesPage } from './pages/NotesPage';
import { MePage } from './pages/MePage';
import { AdminPage } from './pages/AdminPage';
import { preloadBibleForOffline } from './lib/bible';
import { useSettingsStore } from './stores/settingsStore';

export const App: React.FC = () => {
  const { script } = useSettingsStore();

  // Preload full Bible into IndexedDB in the background so offline search & reading work seamlessly
  useEffect(() => {
    return preloadBibleForOffline(script);
  }, [script]);

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bible" element={<Navigate to="/bible/gen.1" replace />} />
          <Route path="/bible/:bookChapter" element={<BiblePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/sermons" element={<SermonsPage />} />
          <Route path="/sermons/:id" element={<SermonDetailPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/me/highlights" element={<HighlightsPage />} />
          <Route path="/me/notes" element={<NotesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};

export default App;
