import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Notes from './pages/Notes';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AIScanner from './pages/AIScanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="notes" element={<Notes />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="scan" element={<AIScanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
