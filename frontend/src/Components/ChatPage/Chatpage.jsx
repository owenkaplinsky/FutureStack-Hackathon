import React, { useState, useEffect } from "react";
import { FaTrash, FaTasks, FaCog } from "react-icons/fa";
// import axios from "axios"; // ✅ Uncomment when API is ready
// import { useNavigate } from "react-router-dom"; // ✅ Uncomment when API is ready

export default function ChatsPage() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [minSources, setMinSources] = useState(4);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editSources, setEditSources] = useState(4);

  // const navigate = useNavigate(); // ✅ Uncomment when API routing is ready
  // const backendUrl = "https://your-backend-url/api"; // ✅ Replace with real backend URL when ready

  useEffect(() => {
    // 🔹 Local placeholder data (API disabled)
    const initialTasks = [
      { id: 1, title: "Data Analysis", text: "Analyze sales trends", sources: 5, ai_response: "Example response" },
      { id: 2, title: "Marketing Research", text: "Research competitors", sources: 6, ai_response: "Another example" }
    ];
    setTasks(initialTasks);

    // 🔹 API call — uncomment when backend is ready
    /*
    axios.get(`${backendUrl}/get_queries`)
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
    */
  }, []);

  const addTask = () => {
    if (!newTitle.trim() || !newTask.trim()) return;

    // 🔹 Local version (API disabled)
    const task = {
      id: Date.now(),
      title: newTitle,
      text: newTask,
      sources: minSources,
      ai_response: ""
    };
    setTasks([...tasks, task]);

    // 🔹 API call — uncomment when backend is ready
    /*
    axios.post(`${backendUrl}/create_query`, { title: newTitle, text: newTask, sources: minSources })
      .then(res => setTasks([...tasks, res.data]))
      .catch(err => console.error(err));
    */

    setNewTitle("");
    setNewTask("");
    setMinSources(4);
  };

  const deleteTask = (id) => {
    // 🔹 Local version (API disabled)
    setTasks(tasks.filter(task => task.id !== id));

    // 🔹 API call — uncomment when backend is ready
    /*
    axios.delete(`${backendUrl}/delete_query/${id}`)
      .then(() => setTasks(tasks.filter(task => task.id !== id)))
      .catch(err => console.error(err));
    */
  };

  const startEdit = (task) => {
    setEditTaskId(task.id);
    setEditTitle(task.title);
    setEditText(task.text);
    setEditSources(task.sources);
  };

  const saveEdit = (id) => {
    // 🔹 Local version (API disabled)
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, title: editTitle, text: editText, sources: editSources }
        : task
    ));
    setEditTaskId(null);

    // 🔹 API call — uncomment when backend is ready
    /*
    axios.put(`${backendUrl}/update_query/${id}`, {
      title: editTitle,
      text: editText,
      sources: editSources
    })
      .then(res => {
        setTasks(tasks.map(task => task.id === id ? res.data : task));
        setEditTaskId(null);
      })
      .catch(err => console.error(err));
    */
  };

  const goToReport = (id) => {
    // 🔹 Routing — uncomment when backend and routes are ready
    // navigate(`/report/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="py-6 text-center bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg">
        <h1 className="text-4xl font-bold text-white flex justify-center items-center">
          <FaTasks className="mr-2 animate-pulse" /> AI Task Manager
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 mt-8">
        {/* Create Task */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-xl w-full mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-white">➕ Create New AI Task</h2>
          <input type="text" placeholder="Task Title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="w-full border border-gray-600 p-3 rounded-lg mb-4 bg-gray-900 text-white" />
          <input type="text" placeholder="Describe your AI task..." value={newTask} onChange={e => setNewTask(e.target.value)}
            className="w-full border border-gray-600 p-3 rounded-lg mb-4 bg-gray-900 text-white" />
          <label className="block mb-1 text-white">Minimum sources: {minSources}</label>
          <input type="range" min="4" max="8" value={minSources} onChange={e => setMinSources(Number(e.target.value))}
            className="w-full accent-white mb-4" />
          <button onClick={addTask} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200">Add Task</button>
        </div>

        {/* Tasks */}
        <div className="max-w-7xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tasks.length === 0 ? (
            <p className="text-center text-white text-lg col-span-full">No AI tasks yet. Create one above!</p>
          ) : tasks.map(task => (
            <div key={task.id} className="flex flex-col p-5 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-2xl hover:shadow-3xl">
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-white flex items-center"><FaTasks className="mr-2" /> {task.title}</p>
                <button onClick={() => startEdit(task)} className="text-gray-300 hover:text-white"><FaCog /></button>
              </div>
              <p className="text-gray-300 mt-2">{task.text}</p>
              <p className="text-gray-400">Min sources: {task.sources}</p>
              {/* <button onClick={() => goToReport(task.id)} className="mt-3 bg-blue-600 text-white px-3 py-2 rounded-lg">View Report</button> */}

              {editTaskId === task.id && (
                <div className="bg-gray-900 p-4 mt-4 rounded-lg">
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full border border-gray-600 p-2 rounded-lg mb-2 bg-gray-800 text-white" />
                  <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                    className="w-full border border-gray-600 p-2 rounded-lg mb-2 bg-gray-800 text-white" />
                  <label className="block text-white mb-1">Minimum sources</label>
                  <input type="range" min="4" max="8" value={editSources} onChange={e => setEditSources(Number(e.target.value))}
                    className="w-full accent-white" />
                  <button onClick={() => saveEdit(task.id)} className="mt-2 bg-white text-black px-4 py-2 rounded-lg font-semibold">Save</button>
                </div>
              )}

              <button onClick={() => deleteTask(task.id)} className="mt-5 bg-red-600 text-white px-3 py-2 rounded-full flex items-center hover:bg-red-700">
                <FaTrash className="mr-2" /> Delete
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-4 text-center text-gray-400 bg-gray-800">AI Task Manager © 2025</footer>
    </div>
  );
}
