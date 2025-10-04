// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaFileAlt,
  FaChartPie,
  FaSignOutAlt,
  FaHistory,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [userStats, setUserStats] = useState({
    active_count: 0,
    reports_sent: 0,
    last_time: "",
  });

  const [recentActivity, setRecentActivity] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const { label, seconds: s } of intervals) {
      const count = Math.floor(seconds / s);
      if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${backendUrl}/user_info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserStats({
          active_count: data.active_count,
          reports_sent: data.reports_sent,
          last_time: data.last_time,
        });
      })
      .catch((err) => console.error("Failed to fetch user info:", err));

    fetch(`${backendUrl}/user_activity`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentActivity(data))
      .catch((err) => console.error("Failed to fetch user activity:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between bg-gray-800 sticky top-0 z-50 shadow-md space-y-3 sm:space-y-0">
  {/* Title centered on small, left-aligned on large */}
  <h1 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left">
    <Link to="/dashboard" className="hover:underline text-white">
      Proactive AI
    </Link>
  </h1>

  {/* Logout Button */}
  <button
    onClick={handleLogout}
    className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold shadow-lg hover:scale-105 transition"
  >
    <FaSignOutAlt className="mr-2" /> Logout
  </button>
</header>


      {/* Hero Section */}
      <section className="text-center py-10 px-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold"
        >
          🚀 Proactive AI Dashboard
        </motion.h2>
        <p className="text-gray-400 mt-3 text-lg">
          Track tasks, reports & stay in control
        </p>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 mb-12 max-w-7xl mx-auto">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center"
        >
          <FaClipboardList className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold">Active Tasks</h2>
          <p className="text-3xl font-bold">{userStats.active_count}/3</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center"
        >
          <FaChartPie className="text-3xl text-purple-400 mb-2" />
          <h2 className="text-lg font-semibold">Reports Sent</h2>
          <p className="text-3xl font-bold">{userStats.reports_sent}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center"
        >
          <FaFileAlt className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold">Last Report</h2>
          <p className="text-md">{userStats.last_time || "—"}</p>
        </motion.div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 mb-12 max-w-5xl mx-auto">
        <Link
          to="/tasks"
          className="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition rounded-2xl p-8 shadow-lg text-center flex flex-col items-center"
        >
          <FaClipboardList className="text-4xl mb-3" />
          <h3 className="text-2xl font-bold">Go to Tasks</h3>
          <p className="text-gray-200 mt-2">Manage your AI tasks</p>
        </Link>

        <Link
          to="/docs"
          className="bg-purple-600 hover:bg-purple-700 hover:scale-105 transition rounded-2xl p-8 shadow-lg text-center flex flex-col items-center"
        >
          <FaFileAlt className="text-4xl mb-3" />
          <h3 className="text-2xl font-bold">Docs</h3>
          <p className="text-gray-200 mt-2">Read project documentation</p>
        </Link>
      </section>

      {/* Recent Activity */}
      <section className="bg-gray-800 rounded-2xl p-6 shadow-lg mx-6 mb-12 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold flex items-center mb-4">
          <FaHistory className="mr-2 text-purple-400" /> Recent Activity
        </h2>
        <ul className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-gray-300 hover:text-white transition"
              >
                <span>{item.action}</span>
                <span className="text-gray-500 text-sm">{timeAgo(item.time)}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No recent activity.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
