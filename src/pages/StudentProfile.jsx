import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  async function fetchStudent() {
    if (!id || id === "undefined") {
      console.warn("Aborted profile fetch: ID is undefined.");
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching student profile:", error);
      return;
    }
    setStudent(data);
  }

  if (!student) {
    return (
      <div className="loading-container">
        <h2 style={{ color: "var(--muted)" }}>Loading Student Records...</h2>
      </div>
    );
  }

  // --- DYNAMIC DATA CALCULATIONS ---
  const monthlyFee = Number(student.total_fee || 0);
  const otherFee = Number(student.other_fee || 0);
  const discountFee = Number(student.discount_fee || 0);
  const paidFee = Number(student.total_paid || 0);

  // Total balance computation logic
  const totalPayable = monthlyFee + otherFee - discountFee;
  const dueFee = totalPayable - paidFee;

  // Real-time calculation of Current Month Name
  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  // Fallback engine to dynamically switch color tokens
  let statusText = "Unpaid";
  let statusClass = "unpaid";

  if (dueFee <= 0 && totalPayable > 0) {
    statusText = "Paid";
    statusClass = "paid";
  } else if (paidFee > 0 && dueFee > 0) {
    statusText = "Partial";
    statusClass = "partial";
  }

  const initials = student.name
    ? student.name
        .split(" ")
        .map((word) => word)
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "NA";

  return (
    <>
      <div className="page-top" style={{ marginBottom: "20px" }}>
        <button className="back-btn" onClick={() => navigate("/students")}>Back to Directory</button>
      </div>

      <div className="student-dashboard">
        <div className="student-card">
          <div className="student-photo">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="photo-img" />
            ) : (
              <span className="photo-initials">{initials}</span>
            )}
          </div>

          <div className="student-basic">
            <h2 className="student-name">{student.name}</h2>
            <div className="student-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Student ID</span>
                <span className="meta-value">{student.student_id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Admission No.</span>
                <span className="meta-value">{student.roll_no || "--"}</span>
              </div>
              <div className="meta-item meta-full">
                <span className="meta-label">Class</span>
                <span className="meta-value">{student.class || "--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="current-fee-card">
          <h3 className="section-title" style={{ marginTop: 0, marginBottom: "16px" }}>Current Month</h3>
          <div className="fee-info">
            <div className="fee-row">
              <span>Monthly Fee</span>
              <strong>₹{monthlyFee}</strong>
            </div>
            <div className="fee-row">
              <span>Paid</span>
              <strong>₹{paidFee}</strong>
            </div>
            <div className="fee-row">
              <span>Due</span>
              <strong className="due-text" style={{ color: dueFee > 0 ? "#ff4d4f" : "inherit" }}>₹{dueFee}</strong>
            </div>
            <div className="fee-row">
              <span>Status</span>
              <span className={`status-badge ${statusClass}`}>{statusText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ledger-card">
        <div className="ledger-title">Student Details</div>
        <div className="details-grid">
          {[
            { label: "ADMISSION DATE", value: formatDate(student.admission_date) },
            { label: "FATHER NAME", value: student.father_name },
            { label: "MOTHER NAME", value: student.mother_name },
            { label: "GENDER", value: student.gender },
            { label: "DATE OF BIRTH", value: formatDate(student.dob) },
            { label: "CATEGORY", value: student.category },
            { label: "AADHAAR", value: student.aadhaar_no },
            { label: "MOBILE", value: student.phone },
            { label: "FATHER MOBILE", value: student.father_mobile_no },
          ].map((item, index) => (
            <div key={index} className="detail-item">
              <span className="detail-label">{item.label}</span>
              <span className="detail-value">{item.value || "--"}</span>
            </div>
          ))}
          <div className="detail-item detail-address">
            <span className="detail-label">ADDRESS</span>
            <span className="detail-value">{student.address || "--"}</span>
          </div>
        </div>
      </div>

      {/* MONTHLY FEE LEDGER WITH INTEGRATED LIVE BACKEND DATA */}
      <div className="ledger-card">
        <div className="ledger-title">Monthly Fee Ledger</div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Monthly Fee</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>{currentMonthName}</td>
              <td>₹{monthlyFee}</td>
              <td>₹{paidFee}</td>
              <td style={{ color: dueFee > 0 ? "#ff4d4f" : "inherit" }}>₹{dueFee}</td>
              <td>
                <span className={`status ${statusClass}`}>{statusText}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default StudentProfile;
