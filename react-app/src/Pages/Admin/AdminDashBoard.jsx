import React, { useEffect, useState } from "react";
import AppLayout from "../../Components/Layout/AppLayout";
import AdminNavbar from "../../Components/Admin/AdminNavbar.jsx";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import "./AdminDashboard.css";
import { getDashboardStats, getSalesTrend } from "../../Services/AdminApi.js";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalRevenue: 0,
    totalPoints: 0,
  });

  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error loading stats:", err));

    getSalesTrend()
      .then((res) => {
        console.log("Sales trend data:", res.data);
        setSalesData(res.data);
      })
      .catch((err) => console.error("Error loading sales trend:", err));
  }, []);

  // ✅ FIX: map đúng field trả về từ backend
  const chartData = {
    labels: salesData.map((item) =>
      new Date(item.year, item.month - 1).toLocaleString("default", {
        month: "short",
      })
    ),
    datasets: [
      {
        label: "Monthly Revenue (VND)",
        data: salesData.map((item) => item.total),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: "#007bff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { color: "#333", font: { size: 14 } },
      },
    },
    scales: {
      x: {
        ticks: { color: "#555" },
        grid: { color: "#f0f0f0" },
      },
      y: {
        ticks: {
          color: "#555",
          callback: function (value) {
            return value.toLocaleString("en-US");
          },
        },
        grid: { color: "#f0f0f0" },
      },
    },
  };

  return (
    <AppLayout title="Admin Dashboard" sidebar={<AdminNavbar />}>
      <div className="admin-main">
        <h1 className="admin-title">
          <LayoutDashboard size={28} style={{ marginLeft: "8px" }} />
          Admin Dashboard
        </h1>

        {/* Tổng quan thống kê */}
        <div className="admin-cards">
          <div className="admin-card purple">
            <Users size={26} />
            <div>
              <h3>Total Users</h3>
              <p>{stats.totalUsers}</p>
            </div>
          </div>

          <div className="admin-card yellow">
            <BookOpen size={26} />
            <div>
              <h3>Total Exams</h3>
              <p>{stats.totalExams}</p>
            </div>
          </div>

          <div className="admin-card green">
            <DollarSign size={26} />
            <div>
              <h3>Revenue</h3>
              <p>{stats.totalTransactions?.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>

          <div className="admin-card orange">
            <MessageCircle size={26} />
            <div>
              <h3>Total Points</h3>
              <p>{stats.totalAttempts}</p>
            </div>
          </div>
        </div>

        {/* Biểu đồ doanh thu */}
        <section className="admin-table-section">
          <h2>Sales Details</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
