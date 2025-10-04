// src/Components/Docs/Docs.jsx
import React from "react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">📚 Project Documentation</h1>

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="text-3xl font-semibold mb-3 border-b-2 border-blue-500 pb-2">Introduction</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          This page contains project documentation, including APIs, features, and usage instructions.
        </p>
      </section>

      {/* Getting Started */}
      <section className="mb-10">
        <h2 className="text-3xl font-semibold mb-3 border-b-2 border-blue-500 pb-2">Getting Started</h2>
        <p className="text-gray-300 mb-4 text-lg">Here’s how to start using the project:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 text-lg">
          <li><span className="font-medium">Clone the repo</span></li>
          <li>
            <span className="font-medium">Install dependencies:</span>{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-white">npm install</code>
          </li>
          <li>
            <span className="font-medium">Run the app:</span>{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-white">npm start</code>
          </li>
        </ul>
      </section>

      {/* API Endpoints */}
      <section className="mb-10">
        <h2 className="text-3xl font-semibold mb-3 border-b-2 border-blue-500 pb-2">API Endpoints</h2>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-4">
          <p className="font-bold text-lg mb-2 text-blue-300">GET /api/user_info</p>
          <p className="text-gray-300">Fetches the user information such as active tasks and reports sent.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-4">
          <p className="font-bold text-lg mb-2 text-blue-300">GET /api/tasks</p>
          <p className="text-gray-300">Fetches all tasks assigned to the user.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <p className="font-bold text-lg mb-2 text-blue-300">POST /api/tasks</p>
          <p className="text-gray-300">Creates a new task for the user.</p>
        </div>
      </section>

      {/* Future Updates */}
      <section>
        <h2 className="text-3xl font-semibold mb-3 border-b-2 border-blue-500 pb-2">Future Updates</h2>
        <p className="text-gray-300 text-lg">
          More documentation sections will be added soon, including detailed API references, authentication guides, and feature overviews.
        </p>
      </section>
    </div>
  );
}
