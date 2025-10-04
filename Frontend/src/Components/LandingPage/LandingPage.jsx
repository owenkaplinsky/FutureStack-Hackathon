import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="w-full flex items-center justify-between p-6 bg-gray-800 shadow-md">
        {/* Left spacer */}
        <div className="w-1/3"></div>

        {/* Centered Title */}
        <h1 className="text-3xl font-bold text-white text-center w-1/3 flex justify-center items-center">
          Proactive AI
        </h1>

        {/* Right side buttons */}
        <div className="flex space-x-4 w-1/3 justify-end">
          <Link
            to="/login"
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            <FaSignInAlt className="mr-2" /> Login
          </Link>
          <Link
            to="/signup"
            className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            <FaUserPlus className="mr-2" /> Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto text-center px-4 mt-6">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg mb-6">
          <h2 className="text-3xl font-semibold mb-4">What is Proactive AI?</h2>
          <p className="text-lg text-gray-300 mb-6">Proactive AI turns a passive LLM into a dynamic agent that filters the noise from the signal, delivering only what matters to you. It autonomously monitors information online and creates actionable reports, so you can stay informed without being online 24/7.
          </p>

          {/* Embedded YouTube Video */}
          <div className="aspect-w-16 aspect-h-9 mb-6">
            <iframe
              className="w-full h-96 rounded-lg"
              src="https://www.youtube.com/embed/0aE1eG18v_4"
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
}
