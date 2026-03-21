import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AppPage from './pages/AppPage';
import InvitePage from './pages/InvitePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Home />} />
        <Route path="/home" element={<AppPage />} />
        <Route path="/invite/:serverId" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
