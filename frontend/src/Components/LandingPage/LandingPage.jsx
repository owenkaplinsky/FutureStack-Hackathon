import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to Proactive AI</h1>
        <p className="text-xl text-gray-400">Your personal, intelligent agent that works for you 24/7.</p>
      </header>

      <main className="max-w-4xl text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
          <FaRocket className="text-5xl text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-semibold mb-4">What is Proactive AI?</h2>
          <p className="text-lg text-gray-300">
            Proactive AI turns a passive LLM into a dynamic agent that filters the noise from the signal, delivering only what matters to you. It autonomously monitors information online and creates actionable reports, so you can stay informed without being online 24/7.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Key Features</h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>- Breaking news alerts</li>
              <li>- Job posting notifications</li>
              <li>- Updates on games or software</li>
              <li>- Trending topic notifications</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">How It Works</h3>
            <p className="text-gray-300">
              Our AI uses a multi-step filtering process to determine what's relevant to you. Once it gathers enough information, it builds a comprehensive report with citations and sends it directly to your email.
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link to="/login" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <FaSignInAlt className="mr-2" /> Login
          </Link>
          <Link to="/signup" className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            <FaUserPlus className="mr-2" /> Sign Up
          </Link>
        </div>
      </main>

      <footer className="mt-12 text-gray-500">
        <p>Proactive AI &copy; 2025</p>
      </footer>
    </div>
  );
}