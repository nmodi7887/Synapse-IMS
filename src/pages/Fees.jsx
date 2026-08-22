import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdAddCard,
  MdReceiptLong,
  MdClose,
  MdArrowDropDown,
} from "react-icons/md";
import { useToast } from "../components/Toast";
import { validateAmount, sanitize, formatCurrency } from "../utils/validation";
import SecureNumberInput from "../components/SecureNumberInput";

function Fees() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Search filter dropdown states inside modal
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudentDues, setSelectedStudentDues] = useState(0);
  const [otherFeeAmount, setOtherFeeAmount] = useState("");
  const [otherFeeNote, setOtherFeeNote] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    student_id: "",
    student_name: "",
    class: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
  });

  const searchRef = useRef(null);

  useEffect(() => {
    fetchPayments();
    fetchStudentsDirectory();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error("Error pulling ledger history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsDirectory() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          "student_id, name, class, total_fee, other_fee, discount_fee, total_paid, admission_date",
        );
      if (error) throw error;
      setStudentsList(data || []);
    } catch (err) {
      console.error("Error loading auto-complete references:", err);
    }
  }
  const handleSelectStudent = (student) => {
    const mFee = Number(student.total_fee || 0);
    const oFee = Number(student.other_fee || 0);
    const dFee = Number(student.discount_fee || 0);
    const tPaid = Number(student.total_paid || 0);

    let months = 1;
    if (student.admission_date) {
      const start = new Date(student.admission_date);
      const now = new Date();
      months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
    }
    const expectedSoFar = months * mFee + oFee - dFee;
    const currentDues = Math.max(0, expectedSoFar - tPaid);

    setFormData((prev) => ({
      ...prev,
      student_id: student.student_id,
      student_name: student.name,
      class: student.class || "",
    }));

    setSelectedStudentDues(currentDues);
    setStudentSearchInput(`${student.name} (${student.student_id})`);
    setShowDropdown(false);
    setOtherFeeAmount("");
    setOtherFeeNote("");
  };

  useEffect(() => {
    const st = location.state;
    if (!st?.openCollect || !st.student) return;
    const timer = setTimeout(() => {
      const match = studentsList.find((s) => s.student_id === st.student.student_id);
      if (!match) return;
      handleSelectStudent(match);
      setShowModal(true);
    }, 0);
    navigate("/fees", { replace: true, state: null });
    return () => clearTimeout(timer);
  }, [studentsList, location.state, navigate]);

  const addPayment = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount) {
      showToast("Please choose a student and enter a transaction amount.", "error");
      return;
    }

    const amountErr = validateAmount(formData.amount);
    if (amountErr) {
      showToast(amountErr, "error");
      return;
    }

    setSubmitting(true);

    try {
      const paymentAmount = Number(formData.amount || 0);
      const newOtherFee = Number(otherFeeAmount || 0);
      const { data: student, error: fetchErr } = await supabase
        .from("students")
        .select("total_fee, other_fee, discount_fee, total_paid, admission_date")
        .eq("student_id", formData.student_id)
        .single();

      if (fetchErr || !student) {
        showToast("Verification failed: Student ID metadata missing.", "error");
        setSubmitting(false);
        return;
      }

      const mFee = Number(student.total_fee || 0);
      const oFee = Number(student.other_fee || 0) + newOtherFee;
      const dFee = Number(student.discount_fee || 0);
      let months = 1;
      if (student.admission_date) {
        const start = new Date(student.admission_date);
        const now = new Date();
        months = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
      }
      const expectedSoFar = months * mFee + oFee - dFee;

      const updatedTotalPaid = Number(student.total_paid || 0) + paymentAmount;
      const calculatedDuesRemaining = Math.max(0, expectedSoFar - updatedTotalPaid);
      const newStatus = calculatedDuesRemaining <= 0 ? "Paid" : "Due";
      const paymentRecord = {
        student_id: formData.student_id,
        student_name: formData.student_name,
        class: formData.class,
        payment_date: formData.payment_date,
        amount: paymentAmount,
        dues: calculatedDuesRemaining,
        receipt_no: `REC-${Date.now().toString().slice(-6)}`,
      };
      if (otherFeeNote) paymentRecord.note = sanitize(otherFeeNote);

      const { error: paymentErr } = await supabase.from("payments").insert([paymentRecord]);

      if (paymentErr) throw paymentErr;
      const { error: studentUpdateErr } = await supabase
        .from("students")
        .update({
          total_paid: updatedTotalPaid,
          fee_status: newStatus,
          other_fee: oFee,
        })
        .eq("student_id", formData.student_id);

      if (studentUpdateErr) throw studentUpdateErr;

      showToast("Transaction saved successfully!", "success");
      setShowModal(false);
      setSubmitting(false);
      
      setFormData({
        student_id: "",
        student_name: "",
        class: "",
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
      });
      setStudentSearchInput("");
      setSelectedStudentDues(0);
      setOtherFeeAmount("");
      setOtherFeeNote("");

      fetchPayments();
      fetchStudentsDirectory();
    } catch (error) {
      console.error(error);
      showToast("Transaction failed: " + error.message, "error");
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receipt_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.class?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalFiltered = filteredPayments.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const filteredStudentSearchOptions = studentsList.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearchInput.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(studentSearchInput.toLowerCase()) ||
      s.class?.toLowerCase().includes(studentSearchInput.toLowerCase()),
  );

  return (
    <>
      
      <div className="page-header page-header-between">
        <div>
          <h1 className="page-title">Fees & Accounts Workspace</h1>
          <p className="page-subtitle">Process and track transaction receipts / bills</p>
        </div>
        <div className="header-actions">
          <button className="glass-btn" onClick={() => navigate("/reports")}>Print Bill</button>
          <button className="collect-btn" onClick={() => setShowModal(true)}>+ Collect Payment</button>
        </div>
      </div>

      {/* FILTER SEARCH FIELD FOR LEDGER TABLE */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search receipts by ID, name, class or code..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto"><table>
          <thead>
            <tr>
              <th>Receipt Code</th>
              <th>Student ID</th>
              <th>Payer Name</th>
              <th>Class</th>
              <th>Payment Date</th>
              <th>Amount Paid</th>
              <th>Other fee for</th>
              <th>Dues</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-cell">Auditing Transaction Records...</td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">No matched receipt lines logged.</td>
              </tr>
            ) : (
              paginatedPayments.map((p) => (
                <tr key={p.id}>
                  <td className="cell-receipt">{p.receipt_no}</td>
                  <td className="cell-muted">{p.student_id}</td>
                  <td style={{ fontWeight: "500" }}>{p.student_name}</td>
                  <td>{p.class || "—"}</td>
                  <td>{p.payment_date}</td>
                  <td className="cell-amount-paid">₹{formatCurrency(p.amount)}</td>
                  <td className="cell-note">{p.note || "—"}</td>
                  <td className={p.dues > 0 ? "cell-dues" : "cell-settled-txt"}>
                    {p.dues > 0 ? `₹${formatCurrency(p.dues)}` : "Settled"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginTop: "16px",
        padding: "12px 0",
      }}>
        <div style={{ color: "#94a3b8", fontSize: "14px" }}>
          Showing {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} students
        </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(129,140,248,0.2)",
                background: currentPage === 1 ? "transparent" : "rgba(129,140,248,0.1)",
                color: currentPage === 1 ? "#475569" : "#e2e8f0",
                cursor: currentPage === 1 ? "default" : "pointer",
                fontSize: "14px",
              }}
            >
              ◀ Previous
            </button>

            <span style={{ color: "#94a3b8", fontSize: "14px", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(129,140,248,0.2)",
                background: currentPage === totalPages ? "transparent" : "rgba(129,140,248,0.1)",
                color: currentPage === totalPages ? "#475569" : "#e2e8f0",
                cursor: currentPage === totalPages ? "default" : "pointer",
                fontSize: "14px",
              }}
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* MODAL BILLING POPUP WINDOW WITH EMBEDDED FILTER DROPDOWN SEARCH */}
      {showModal && (
        <div className="modal-overlay-fees" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-card-inner" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <MdReceiptLong style={{ color: "#818cf8" }} /> Log Fee Payment Invoice
              </h3>
              <MdClose className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form className="modal-form" onSubmit={addPayment}>
              <div className="field-group" ref={searchRef}>
                <strong className="field-label">Search Student Name, ID or Class *</strong>
                <div className="search-field-wrap">
                  <input
                    type="text"
                    placeholder="Type name or code to filter search..."
                    value={studentSearchInput}
                    onChange={(e) => { setStudentSearchInput(e.target.value); if (e.target.value.trim()) setShowDropdown(true); else setShowDropdown(false); }}
                    required
                    className="field-input"
                  />
                  <MdArrowDropDown className="field-dropdown-icon" />
                </div>

                {/* Floating Results Popup Container */}
                {showDropdown && studentSearchInput.length >= 0 && (
                  <div className="dropdown-list">
                    {filteredStudentSearchOptions.length === 0 ? (
                      <div className="dropdown-empty">No students match your query</div>
                    ) : (
                      filteredStudentSearchOptions.map((student) => (
                        <div
                          key={student.student_id}
                          onClick={() => handleSelectStudent(student)}
                          className="dropdown-item"
                        >
                          <span>{student.name}</span>
                          <span className="dropdown-item-id">{student.student_id}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="modal-form-grid">
                <div>
                  <strong className="form-field-label">Assigned Course</strong>
                  <input type="text" value={formData.class || "—"} readOnly className="field-readonly" />
                </div>
                <div>
                  <strong className="form-field-label">Current Dues Owed</strong>
                  <input
                    type="text"
                    value={formData.student_id ? `₹${formatCurrency(selectedStudentDues)}` : "—"}
                    readOnly
                    className={`field-readonly ${selectedStudentDues > 0 ? "field-dues" : "field-settled"}`}
                  />
                </div>
              </div>

              <div>
                <strong className="field-label">Other Fees(₹)</strong>
                <SecureNumberInput placeholder="Books, supplies, etc." value={otherFeeAmount} onChange={(e) => setOtherFeeAmount(e.target.value)} />
              </div>

              <div style={{ display: formData.student_id && Number(otherFeeAmount || 0) > 0 ? "block" : "none" }}>
                <strong className="field-label">What is this Other Fee for?</strong>
                <input type="text" placeholder="e.g. Books, Supplies, Uniform..." value={otherFeeNote} onChange={(e) => setOtherFeeNote(e.target.value)} />
              </div>

              <div>
                <strong className="field-label">Date of Transaction</strong>
                <input type="date" value={formData.payment_date} onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))} required />
              </div>

              <div>
                <strong className="field-label">Payment Amount Collected (₹) *</strong>
                <SecureNumberInput placeholder="Enter collection amount e.g. 5000" value={formData.amount} onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))} required />
              </div>

              <div className="form-actions-end">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={submitting}>{submitting ? "Processing..." : "Authorize Receipt"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Fees;
