import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MdClose, MdZoomIn } from "react-icons/md";
import { supabase } from "../services/supabase";
import { formatCurrency } from "../utils/validation";

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showPhoto, setShowPhoto] = useState(false);

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

  /* Photo lightbox: Escape to close and lock background scrolling */
  useEffect(() => {
    if (!showPhoto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowPhoto(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showPhoto]);

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
        <h2 style={{ color: "var(--text-heading)" }}>Loading Student Records...</h2>
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
          <button
            type="button"
            className="student-photo"
            onClick={() => setShowPhoto(true)}
            aria-label={`View photo of ${student.name}`}
          >
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="photo-img" />
            ) : (
              <span className="photo-initials">{initials}</span>
            )}
            <span className="photo-zoom-hint" aria-hidden="true">
              <MdZoomIn size={15} />
            </span>
          </button>

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
              <strong>₹{formatCurrency(monthlyFee)}</strong>
            </div>
            <div className="fee-row">
              <span>Paid</span>
              <strong className="amount-num">₹{formatCurrency(paidFee)}</strong>
            </div>
            <div className="fee-row">
              <span>Due</span>
              <strong className="amount-num">₹{formatCurrency(dueFee)}</strong>
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
              <td>₹{formatCurrency(monthlyFee)}</td>
              <td className="amount-num">₹{formatCurrency(paidFee)}</td>
              <td className="amount-num">₹{formatCurrency(dueFee)}</td>
              <td>
                <span className={`status ${statusClass}`}>{statusText}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Full-size photo lightbox */}
      {showPhoto && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${student.name} photo`}
          onClick={() => setShowPhoto(false)}
        >
          <button
            type="button"
            className="photo-lightbox-close"
            onClick={(event) => {
              event.stopPropagation();
              setShowPhoto(false);
            }}
            aria-label="Close photo"
          >
            <MdClose size={20} />
          </button>

          <figure
            className="photo-lightbox-frame"
            onClick={(event) => event.stopPropagation()}
          >
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.name}
                className="photo-lightbox-img"
              />
            ) : (
              <div className="photo-lightbox-initials">{initials}</div>
            )}

            <figcaption className="photo-lightbox-caption">
              <span className="photo-lightbox-name">{student.name}</span>
              <span className="photo-lightbox-meta">
                {student.class || "—"} • {student.student_id || "—"}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

export default StudentProfile;
