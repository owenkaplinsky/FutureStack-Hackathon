import './App.css';
import { Routes, Route } from 'react-router-dom';
import ChatPage from './Components/ChatPage/Chatpage';
import LandingPage from './Components/LandingPage/LandingPage';
import SignUpPage from './Components/SignUpPage/SignUpPage';
import LoginPage from './Components/LoginPage/LoginPage';
import { ProtectedRoute } from './Components/ProtectedRoute/ProtectedRoute';
import Dashboard from './Components/Dashboard/Dasboard';
function App() {
  return (
    <div>
     <Dashboard />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes> 
    </div>
  );
}

export default App;
