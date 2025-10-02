import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_API_URL;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      await axios.post(
        `${backendUrl}/create_user`,
        { email, password },
        { headers: { AUTH_KEY: process.env.REACT_APP_AUTH_KEY } }
      );
      alert("Account created successfully! Please log in.");
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-white text-center">Create an Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-white mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-600 p-3 rounded-lg bg-gray-900 text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-600 p-3 rounded-lg bg-gray-900 text-white"
              required
            />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
            Sign Up
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
        </p>
      </div>
    </div>
  );
}