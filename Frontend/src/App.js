import logo from './logo.svg';
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
    </div>
  );
}

export default App;
