import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { formatCurrency } from "../utils/validation";
import {
  MdPeople,
  MdSchool,
  MdCurrencyRupee,
  MdReceiptLong,
  MdPersonAdd,
  MdAddCard,
  MdAnalytics,
} from "react-icons/md";


function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCollected: 0,
    totalOutstanding: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  async function fetchDashboardMetrics() {
    try {
      setLoading(false);
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("id", { ascending: false });
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("id");
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      const totalStuds = studentsData ? studentsData.length : 0;
      const totalTechs = teachersData ? teachersData.length : 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = paymentsData
        ? paymentsData
            .filter((p) => {
              if (!p.payment_date) return false;
              const d = new Date(p.payment_date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        : 0;

      const monthlyDues = paymentsData
        ? paymentsData
            .filter((p) => {
              if (!p.payment_date) return false;
              const d = new Date(p.payment_date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + Number(p.dues || 0), 0)
        : 0;

      setStats({
        totalStudents: totalStuds,
        totalTeachers: totalTechs,
        totalCollected: monthlyRevenue,
        totalOutstanding: monthlyDues,
      });
      setRecentStudents(studentsData ? studentsData.slice(0, 5) : []);
      setRecentPayments(paymentsData ? paymentsData.slice(0, 5) : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(true);
    }
  }

  if (!loading) {
    return (
      <div className="loading-container">
        <h2 className="loading-text">Loading Hang tight...</h2>
      </div>
    );
  }

  return (
    <>
      <div className="page-header dash-header">
        <div>
          <h1 className="page-title">
            Synapse IMS <span className="version-badge">v0.1.1</span>
          </h1>
          <p className="page-subtitle">
            Automated Working System — Real-time oversight, automated revenue,
            and registry auditing.
          </p>
        </div>
      </div>

      <div className="cards" style={{ marginBottom: "30px" }}>
        <div className="card card-stat">
          <div className="card-stat-header">
            <h3>Total Enrolled</h3>
            <MdPeople className="stat-icon icon-indigo" />
          </div>
          <p>{stats.totalStudents} <span className="card-stat-label">Students</span></p>
        </div>
        <div className="card card-stat">
          <div className="card-stat-header">
            <h3>Active Faculty</h3>
            <MdSchool className="stat-icon icon-purple" />
          </div>
          <p>{stats.totalTeachers} <span className="card-stat-label">Teachers</span></p>
        </div>
        <div className="card card-stat">
          <div className="card-stat-header">
            <h3>Monthly Revenue</h3>
            <MdCurrencyRupee className="stat-icon icon-green" />
          </div>
          <p className="stat-value-green">₹{formatCurrency(stats.totalCollected)}</p>
        </div>
        <div className="card card-stat">
          <div className="card-stat-header">
            <h3>Pending Balances</h3>
            <MdReceiptLong className="stat-icon icon-red" />
          </div>
          <p className="stat-value-red">₹{formatCurrency(stats.totalOutstanding)}</p>
        </div>
      </div>

      <h3 className="section-title">Shortcuts</h3>
      <div className="shortcuts-grid">
        <button className="theme-btn shortcut-btn" onClick={() => navigate("/admission")}>
          <MdPersonAdd /> Start New Admission
        </button>
        <button className="theme-btn shortcut-btn" onClick={() => navigate("/fees")}>
          <MdAddCard /> Receive Fee Payment
        </button>
        <button className="theme-btn shortcut-btn" onClick={() => navigate("/reports")}>
          <MdAnalytics /> Generate Bill / Invoice
        </button>
      </div>

      <div className="recent-grid">
        <div>
          <h4 className="recent-section-header">
            <span>Recently Enrolled Candidates</span>
            <span className="view-link" onClick={() => navigate("/students")}>
              View Students List →
            </span>
          </h4>
          <div className="table-container">
            <div className="overflow-x-auto"><table>
              <thead>
                <tr>
                  <th>Code ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">No recent entries found.</td>
                  </tr>
                ) : (
                  recentStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <td className="cell-id">{student.student_id}</td>
                      <td>{student.name}</td>
                      <td>{student.class}</td>
                      <td>
                        <span className={student.fee_status === "Paid" ? "status-paid" : "status-due"}>
                          {student.fee_status || "Due"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table></div>
          </div>
        </div>

        <div>
          <h4 className="recent-section-header">
            <span>Recent Payment Receipts</span>
            <span className="view-link" onClick={() => navigate("/fees")}>
              View Ledger →
            </span>
          </h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Payer Name</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">No recent payments.</td>
                  </tr>
                ) : (
                  recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="cell-muted">{payment.receipt_no}</td>
                      <td className="cell-name">{payment.student_name}</td>
                      <td>{payment.payment_date}</td>
                      <td className="cell-amount">₹{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
