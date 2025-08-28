import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './components/Login';
import Cadastro from './components/Cadastro';
import ForgotPassword from './components/ForgotPassword';
import Home from './components/Home';
import Dash from './components/Dash';
import GerenciarUsuarios from './components/GerenciarUsuarios';
import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  console.log('ProtectedRoute: Estado do usuário:', user);
  if (!user) {
    console.log('Usuário não autenticado, redirecionando para /');
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dash" element={<ProtectedRoute>
            <ErrorBoundary>
              <Dash />
            </ErrorBoundary>
          </ProtectedRoute>} />
          <Route path="/gerenciar-usuarios" element={<ProtectedRoute><GerenciarUsuarios /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

