import './App.css';
import { Routes, Route } from 'react-router-dom';
import ChatPage from './Components/ChatPage/Chatpage';
import LandingPage from './Components/LandingPage/LandingPage';
import SignUpPage from './Components/SignUpPage/SignUpPage';
import LoginPage from './Components/LoginPage/LoginPage';
import { ProtectedRoute } from './Components/ProtectedRoute/ProtectedRoute';
import Dashboard from './Components/Dashboard/Dashboard';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

       // Protected routes — requires login 
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

        //Catch-all route for 404
     <Route path="*" element={<h1 className="text-center mt-20 text-white">404 - Page Not Found</h1>} />
      </Routes>
     
    </div>
  );
}

export default App;
