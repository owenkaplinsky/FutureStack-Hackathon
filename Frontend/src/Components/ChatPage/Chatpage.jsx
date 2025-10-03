import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaTasks, FaCog } from "react-icons/fa";

export default function ChatPage() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [minSources, setMinSources] = useState(4);
  const [minContact, setMinContact] = useState(0);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editSources, setEditSources] = useState(4);
  const [editContact, setEditContact] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const displayMap = {
    0: "As soon as ready",
    1: "Every 12 hours",
    2: "Every 24 hours",
    3: "Every 2 days",
    4: "Every 3 days",
    5: "Every 4 days",
    6: "Every 5 days",
    7: "Once a week",
  };

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios
      .get(`${backendUrl}/get_queries`, authHeaders)
      .then((res) => setTasks(res.data))
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setErrorMessage("Failed to load tasks.");
      })
      .finally(() => setLoading(false));
  }, [backendUrl, token]);

  const addTask = () => {
    setErrorMessage("");
    if (tasks.length >= 3) {
      setErrorMessage("You can’t add more than 3 tasks");
      return;
    }
    if (!newTitle.trim() || !newTask.trim()) {
      setErrorMessage("Title and Description are required");
      return;
    }
    if (newTask.trim().length < 32) {
      setErrorMessage("Description must be at least 32 characters");
      return;
    }

    setLoading(true);

    axios
      .post(
        `${backendUrl}/create_query`,
        {
          title: newTitle,
          text: newTask,
          sources: minSources,
          contact: minContact,
        },
        authHeaders
      )
      .then((res) => {
        setTasks([...tasks, res.data]);
        setNewTitle("");
        setNewTask("");
        setMinSources(4);
        setMinContact(0);
      })
      .catch((err) => {
        console.error("Error adding task:", err);
        setErrorMessage("Failed to add task.");
      })
      .finally(() => setLoading(false));
  };

  const deleteTask = (id) => {
    setLoading(true);
    axios
      .delete(`${backendUrl}/delete_query/${id}`, authHeaders)
      .then(() => setTasks(tasks.filter((task) => task.id !== id)))
      .catch((err) => {
        console.error("Error deleting task:", err);
        setErrorMessage("Failed to delete task.");
      })
      .finally(() => setLoading(false));
  };

  const startEdit = (task) => {
    setEditTaskId(task.id);
    setEditTitle(task.title);
    setEditText(task.text);
    setEditSources(task.sources ?? 4);
    setEditContact(task.contact ?? 0);
  };

  const cancelEdit = () => {
    setEditTaskId(null);
  };

  const saveEdit = (id) => {
    setLoading(true);
    axios
      .put(
        `${backendUrl}/update_query/${id}`,
        {
          title: editTitle,
          text: editText,
          sources: editSources,
          contact: editContact,
        },
        authHeaders
      )
      .then((res) => {
        setTasks(tasks.map((task) => (task.id === id ? res.data : task)));
        setEditTaskId(null);
      })
      .catch((err) => {
        console.error("Error updating task:", err);
        setErrorMessage("Failed to update task.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="py-6 text-center bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg">
        <h1 className="text-4xl font-bold text-white flex justify-center items-center">
          <FaTasks className="mr-2 animate-pulse" />
          <Link to="/" className="ml-2 hover:underline">
            AI Task Manager
          </Link>
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 mt-8">
        {/* Create Task */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-xl w-full mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            ➕ Create New AI Task
          </h2>

          {errorMessage && (
            <p className="text-red-500 mb-4">{errorMessage}</p>
          )}

          <label className="block mb-1 text-white">Title</label>
          <input
            type="text"
            placeholder="Task Title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-gray-600 p-3 rounded-lg mb-4 bg-gray-900 text-white"
          />

          <label className="block mb-1 text-white flex items-center">
            <span>Description</span>
            <span className="ml-2 relative group">
              <span className="text-sm text-gray-400 cursor-pointer">
                💡
              </span>
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
              >
                Niche topics may take a long time to find anything. Try to balance specificity and generality!<br /><br />
                Example: "Tell me about new movies that are announced, and when they'll come out."
              </div>
            </span>
          </label>
          <textarea
            placeholder="Describe your AI task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full border border-gray-600 p-3 rounded-lg mb-4 bg-gray-900 text-white"
            rows={4}
          />

          <label className="block mb-1 text-white flex items-center">
            <span>Minimum sources: {minSources}</span>
            <span className="ml-2 relative group">
              <span className="text-sm text-gray-400 cursor-pointer">?</span>
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
              >
                Minimum amount of sources collected before user is sent a report.
              </div>
            </span>
          </label>
          <input
            type="range"
            min="4"
            max="8"
            value={minSources}
            onChange={(e) => setMinSources(Number(e.target.value))}
            className="w-full accent-white mb-4"
          />

          <label className="block mb-1 text-white flex items-center">
            <span>How often: {displayMap[minContact]}</span>
            <span className="ml-2 relative group">
              <span className="text-sm text-gray-400 cursor-pointer">?</span>
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
              >
                Controls how long you must wait before receiving the next report.<br /><br />
                For example, "Every 24 hours" means only one report per day, even if enough sources are found earlier.
              </div>
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="7"
            value={minContact}
            onChange={(e) => setMinContact(Number(e.target.value))}
            className="w-full accent-white mb-4"
          />

          <button
            onClick={addTask}
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Add Task"}
          </button>
        </div>

        {/* Tasks */}
        <div className="max-w-7xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tasks.length === 0 ? (
            <p className="text-center text-white text-lg col-span-full">
              No AI tasks yet. Create one above!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col p-5 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg text-white flex items-center">
                    <FaTasks className="mr-2" /> {task.title}
                  </p>
                  <button
                    onClick={() => startEdit(task)}
                    className="text-gray-300 hover:text-white"
                  >
                    <FaCog />
                  </button>
                </div>
                <p className="text-gray-300 mt-2 break-words">{task.text}</p>
                <p className="text-gray-400">Min sources: {task.sources}</p>
                <p className="text-gray-400">
                  Min contact: {displayMap[task.contact]}
                </p>

                {editTaskId === task.id && (
                  <div className="bg-gray-900 p-4 mt-4 rounded-lg">
                    <label className="block mb-1 text-white">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-gray-600 p-2 rounded-lg mb-2 bg-gray-800 text-white"
                    />

                    <label className="block mb-1 text-white flex items-center">
                      <span>Description</span>
                      <span className="ml-2 relative group">
                        <span className="text-sm text-gray-400 cursor-pointer">
                          💡
                        </span>
                        <div
                          role="tooltip"
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
                        >
                          Niche topics may take a long time to find anything. Try to balance specificity and generality!<br /><br />
                          Example: "Tell me about new movies that are announced, and when they'll come out."
                        </div>
                      </span>
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full border border-gray-600 p-2 rounded-lg mb-2 bg-gray-800 text-white"
                      rows={4}
                    />

                    <label className="block mb-1 text-white flex items-center">
                      <span>Minimum sources: {minSources}</span>
                      <span className="ml-2 relative group">
                        <span className="text-sm text-gray-400 cursor-pointer">?</span>
                        <div
                          role="tooltip"
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
                        >
                          Minimum amount of sources collected before user is sent a report.
                        </div>
                      </span>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="8"
                      value={editSources}
                      onChange={(e) =>
                        setEditSources(Number(e.target.value))
                      }
                      className="w-full accent-white mb-4"
                    />

                    <label className="block mb-1 text-white flex items-center">
                      <span>How often: {displayMap[minContact]}</span>
                      <span className="ml-2 relative group">
                        <span className="text-sm text-gray-400 cursor-pointer">?</span>
                        <div
                          role="tooltip"
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-700 text-white text-xs p-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
                        >
                          Controls how long you must wait before receiving the next report.<br /><br />
                          For example, "Every 24 hours" means only one report per day, even if enough sources are found earlier.
                        </div>
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="7"
                      value={editContact}
                      onChange={(e) =>
                        setEditContact(Number(e.target.value))
                      }
                      className="w-full accent-white mb-4"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(task.id)}
                        disabled={loading}
                        className="bg-white text-black px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={loading}
                  className="mt-4 bg-red-600 text-white px-3 py-2 rounded-full flex items-center hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Deleting..." : <><FaTrash className="mr-2" /> Delete</>}
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-gray-400 bg-gray-800">
        AI Task Manager © 2025
      </footer>
    </div>
  );
}
