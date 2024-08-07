import { FC } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login/Login';
import Navbar from './components/Navbar/Navbar';
import NotFound from './pages/NotFound/NotFound';
import Preferences from './pages/Preferences/Preferences';
import Dashboard from './pages/Dashboard/Dashboard';

const App: FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/priorities" element={<PrivateRoute><Preferences /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
