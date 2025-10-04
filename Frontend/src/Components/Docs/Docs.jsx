import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFileAlt, FaSignOutAlt } from "react-icons/fa";

export default function Docs() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-white">
      <header className="py-6 px-4 bg-gray-800 shadow-lg relative flex items-center justify-center">
        <h1 className="text-3xl font-bold text-white text-center">
          <Link to="/dashboard" className="hover:underline text-white">
            Proactive AI
          </Link>
        </h1>

        <div className="absolute right-4">
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white shadow-lg hover:scale-105 transition"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-6 py-10 max-w-4xl mx-auto leading-relaxed">
        <h2 className="text-4xl font-extrabold text-blue-400 mb-6">
          Welcome to the Proactive AI Docs
        </h2>
        <p className="text-gray-300 mb-6">
          This documentation will help you understand how to get the most out of the Proactive AI - 
          from creating effective tasks to understanding how automated reports are generated.  
          For the full project source code, visit the{" "}
          <a
            href="https://github.com/owenkaplinsky/FutureStack-Hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            GitHub repository
          </a>.
        </p>

        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-400 mb-3">Creating a Task</h3>
          <p className="text-gray-300 mb-4">
            To create a new task, navigate to the{" "}
            <Link to="/tasks" className="text-blue-400 underline">
              Tasks
            </Link>{" "}
            page. Provide a clear, descriptive title and a detailed explanation of what 
            you want the AI to track. This description is the foundation of your automated reports, 
            so writing it well is key to getting meaningful results.
          </p>

          <p className="text-gray-300 mb-4">
            You’ll also choose two parameters:
          </p>
          <ul className="list-disc list-inside text-gray-400 mb-4">
            <li><strong>Minimum Sources</strong> - How many independent sources should be found before a report is generated.</li>
            <li><strong>Frequency</strong> - How often you want to receive updates once a report has been sent.</li>
          </ul>
          <p className="text-gray-300">
            These options help control how often reports arrive and how much new data is collected before each one.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-400 mb-3">Writing a Good Description</h3>
          <p className="text-gray-300 mb-4">
            The task description determines what kind of information the backend will try to find.  
            The key is balance: it shouldn’t be too general or too niche.
          </p>
          <p className="text-gray-300 mb-4">
            A <strong>too general</strong> description (e.g., “Tell me about technology news”) will match far too many results, 
            producing repetitive or irrelevant reports. The system thrives when your request has focus and intent.
          </p>
          <p className="text-gray-300 mb-4">
            On the other hand, a <strong>too specific</strong> description (e.g., “Find updates on AI tools developed by a 
            single research lab in Prague”) may yield nothing - because it’s too narrow for the model to find 
            enough sources or recent activity.
          </p>
          <p className="text-gray-300 mb-4">
            The ideal approach is to describe <strong>a topic area with clear boundaries</strong> but leave enough room 
            for the model to explore. For example:
          </p>
          <ul className="list-disc list-inside text-gray-400 mb-4">
            <li>
              ✅ <em>Good:</em> “Track announcements of upcoming science fiction movies and their release dates.”
            </li>
            <li>
              ❌ <em>Too Broad:</em> “Track movie news.”
            </li>
            <li>
              ❌ <em>Too Narrow:</em> “Track new movies with X actor and X director.”
            </li>
          </ul>
          <p className="text-gray-300">
            The AI performs best when it has enough context to work with but still a defined scope. 
            Aim for precision, not restriction.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-400 mb-3">Reports & Notifications</h3>
          <p className="text-gray-300">
            Reports are automatically generated and sent to your email once your criteria are met.  
            Each report includes a concise summary and direct links to the original sources.  
            You can configure the delay between reports and the number of sources required using the sliders 
            on the task creation form.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-blue-400 mb-3">Activity Tracking</h3>
          <p className="text-gray-300">
            Your account automatically logs significant events, such as task creation, updates, and reports sent.  
            You can view these under the <Link to="/dashboard" className="text-blue-400 underline">Dashboard</Link> page 
            in the “Recent Activity” section.
          </p>
        </section>
      </main>
    </div>
  );
}