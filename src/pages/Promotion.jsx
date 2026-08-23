import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { MdArrowDropDown, MdTrendingUp } from "react-icons/md";
import { useToast } from "../components/Toast";
import { ALL_CLASSES, formatCurrency } from "../utils/validation";
import SecureNumberInput from "../components/SecureNumberInput";

function Promotion() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentsList, setStudentsList] = useState([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [promoteTo, setPromoteTo] = useState("");
  const [newMonthlyFee, setNewMonthlyFee] = useState("");
  const [dueAction, setDueAction] = useState("");
  const [promoting, setPromoting] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .order("id");
        if (error) throw error;
        if (active) setStudentsList(data || []);
      } catch (err) {
        console.error(err);
        if (active) showToast("Failed to load student records.", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [showToast]);

  const refreshStudentsDirectory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("id");
      if (error) throw error;
      setStudentsList(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to refresh student records.", "error");
    }
  }, [showToast]);

  const filteredOptions = studentsList.filter(
    (s) =>
      s.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(query.toLowerCase()) ||
      s.class?.toLowerCase().includes(query.toLowerCase()),
  );

  function getMonthsSinceAdmission(student) {
    let months = 1;
    if (student.admission_date) {
      const start = new Date(student.admission_date);
      const now = new Date();
      months = Math.max(
        1,
        (now.getFullYear() - start.getFullYear()) * 12 +
          (now.getMonth() - start.getMonth()),
      );
    }
    return months;
  }

  function getCurrentOutstanding(student) {
    if (!student) return 0;
    const mFee = Number(student.total_fee || 0);
    const oFee = Number(student.other_fee || 0);
    const dFee = Number(student.discount_fee || 0);
    const tPaid = Number(student.total_paid || 0);
    const expectedSoFar =
      getMonthsSinceAdmission(student) * mFee + oFee - dFee;
    return Math.max(0, expectedSoFar - tPaid);
  }

  function getNextClass(currentClass) {
    const idx = ALL_CLASSES.indexOf(currentClass);
    if (idx === -1 || idx >= ALL_CLASSES.length - 1) return "";
    return ALL_CLASSES[idx + 1];
  }

  const handleSelectStudent = (student) => {
    setSelected(student);
    setQuery(`${student.name} (${student.student_id})`);
    setShowDropdown(false);
    setPromoteTo(getNextClass(student.class));
    setNewMonthlyFee(String(Number(student.total_fee || 0)));
    setDueAction("");
  };

  const handleReset = () => {
    setSelected(null);
    setQuery("");
    setPromoteTo("");
    setNewMonthlyFee("");
    setDueAction("");
  };

  const outstanding = getCurrentOutstanding(selected);
  const hasDues = selected ? outstanding > 0 : false;
  const currentFee = selected ? Number(selected.total_fee || 0) : 0;
  const newFeeNum = Number(newMonthlyFee || 0);
  const feeChanged =
    selected !== null &&
    newMonthlyFee !== "" &&
    !Number.isNaN(newFeeNum) &&
    newFeeNum !== currentFee;

  const summaryAction = !hasDues
    ? "None (No dues)"
    : dueAction === "carry"
      ? "Carry Forward"
      : "—";

  const handleSettleViaCollection = () => {
    if (!selected) return;
    navigate("/fees", {
      state: {
        openCollect: true,
        student: {
          student_id: selected.student_id,
          name: selected.name,
          class: selected.class || "",
        },
      },
    });
  };

  const validateForm = () => {
    if (!selected) {
      showToast("Please select a student first.", "error");
      return false;
    }
    if (!promoteTo) {
      showToast("Please select a destination class.", "error");
      return false;
    }
    if (!ALL_CLASSES.includes(promoteTo)) {
      showToast("Invalid destination class.", "error");
      return false;
    }
    if (promoteTo === selected.class) {
      showToast("Destination class must be different from the current class.", "error");
      return false;
    }
    if (newMonthlyFee === "" || Number.isNaN(newFeeNum)) {
      showToast("Please enter a valid monthly fee.", "error");
      return false;
    }
    if (newFeeNum < 0) {
      showToast("Monthly fee cannot be negative.", "error");
      return false;
    }
    if (hasDues && !dueAction) {
      showToast("Choose Carry Forward or Settle / Clear for the previous due.", "error");
      return false;
    }
    return true;
  };

  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const handleConfirmPromotion = async () => {
    if (!validateForm()) return;

    setPromoting(true);
    try {
      const monthsSoFar = getMonthsSinceAdmission(selected);
      const discountFee = Number(selected.discount_fee || 0);
      const totalPaid = Number(selected.total_paid || 0);

      const willBeDue = hasDues;

      const updates = {
        class: promoteTo,
        total_fee: newFeeNum,
        fee_status: willBeDue ? "Due" : "Paid",
      };

      if (feeChanged) {
        updates.other_fee = round2(
          outstanding + discountFee + totalPaid - monthsSoFar * newFeeNum,
        );
      }

      const { error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", selected.id);

      if (error) throw error;

      showToast(
        `${selected.name} promoted from Class ${selected.class} to Class ${promoteTo} successfully.`,
        "success",
      );
      handleReset();
      refreshStudentsDirectory();
    } catch (err) {
      console.error(err);
      showToast("Promotion failed: " + err.message, "error");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MdTrendingUp style={{ color: "#818cf8", verticalAlign: "-4px", marginRight: "8px" }} />
            Student Promotion
          </h1>
          <p className="page-subtitle">
            Promote students to their next class and manage previous outstanding dues.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <strong className="field-label">Select Student (Name, ID or Class)</strong>
        <div className="field-group" ref={searchRef} style={{ position: "relative", marginTop: "6px" }}>
          <div className="search-field-wrap">
            <input
              type="text"
              placeholder={loading ? "Loading students..." : "Click to view all students, or type to filter by name, ID or class..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="field-input"
              disabled={loading}
            />
            <MdArrowDropDown className="field-dropdown-icon" />
          </div>

          {showDropdown && (
            <div className="dropdown-list promo-dropdown">
              {filteredOptions.length === 0 ? (
                <div className="dropdown-empty">No students match your query</div>
              ) : (
                filteredOptions.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="dropdown-item"
                  >
                    <span className="promo-option-name">{student.name}</span>
                    <span className="promo-option-meta">{student.student_id} · Class {student.class || "—"}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {!selected && (
          <p className="promo-hint"></p>
        )}
      </div>

      {selected && (
        <div className="promo-layout">
          <div className="promo-panel">
            <h3>Current Status</h3>
            <div className="promo-details">
              {[
                ["Student Name", selected.name],
                ["Student ID", selected.student_id],
                ["Current Class", selected.class || "—"],
                ["Current Monthly Fee", `₹${formatCurrency(currentFee)}`],
              ].map(([label, value]) => (
                <div key={label} className="promo-row">
                  <span className="promo-label">{label}</span>
                  <strong className="promo-value">{value}</strong>
                </div>
              ))}
              <div className="promo-row">
                <span className="promo-label">Outstanding Due</span>
                <strong
                  className="promo-value"
                  style={{ color: outstanding > 0 ? "#ff4d4f" : "#34d399" }}
                >
                  ₹{formatCurrency(outstanding)}
                </strong>
              </div>
            </div>
          </div>

          <div className="promo-panel">
            <h3>Promotion Details</h3>
            <div className="promo-details promo-form-gap">
              <div>
                <strong className="field-label">Promote To</strong>
                <div className="promo-select-wrap">
                  <select value={promoteTo} onChange={(e) => setPromoteTo(e.target.value)}>
                    <option value="">-- Select Class --</option>
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <MdArrowDropDown className="promo-select-arrow" />
                </div>
              </div>

              <div>
                <strong className="field-label">New Monthly Fee</strong>
                <SecureNumberInput
                  placeholder="Enter new monthly fee"
                  value={newMonthlyFee}
                  onChange={(e) => setNewMonthlyFee(e.target.value)}
                />
              </div>

              <div>
                <strong className="field-label">Previous Outstanding Due</strong>
                <div
                  className="promo-due-value"
                  style={{ color: outstanding > 0 ? "#fbbf24" : "#34d399" }}
                >
                  ₹{formatCurrency(outstanding)}
                </div>
                {hasDues ? (
                  <>
                    <div className="promo-btn-row">
                      <button
                        type="button"
                        className={`btn ${dueAction === "carry" ? "" : "btn-secondary"}`}
                        onClick={() => setDueAction("carry")}
                        disabled={promoting}
                      >
                        Carry Forward
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleSettleViaCollection}
                        disabled={promoting}
                      >
                        Settle / Clear
                      </button>
                    </div>
                    <p className="promo-note">
                      Settle / Clear opens Fee Collection to receive the outstanding amount as a payment.
                    </p>
                  </>
                ) : (
                  <p className="promo-note">No outstanding amount. The student can be promoted normally.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Confirm Promotion</h3>
          <div className="promo-panel">
            <div className="promo-details">
              <div className="promo-row">
                <span className="promo-label">Student</span>
                <strong className="promo-value">{selected.name}</strong>
              </div>
              <div className="promo-row">
                <span className="promo-label">Class</span>
                <strong className="promo-value">
                  {selected.class || "—"} → {promoteTo || "—"}
                </strong>
              </div>
              <div className="promo-row">
                <span className="promo-label">Monthly Fee</span>
                {feeChanged ? (
                  <strong className="promo-value">
                    <span className="promo-fee-old">₹{formatCurrency(currentFee)}</span>
                    <span className="promo-fee-arrow">→</span>
                    <span className="promo-fee-new">₹{formatCurrency(newFeeNum)}</span>
                  </strong>
                ) : (
                  <strong className="promo-value">₹{formatCurrency(currentFee)}</strong>
                )}
              </div>
              <div className="promo-row">
                <span className="promo-label">Previous Due</span>
                <strong
                  className="promo-value"
                  style={{ color: outstanding > 0 ? "#fbbf24" : "#34d399" }}
                >
                  ₹{formatCurrency(outstanding)}
                </strong>
              </div>
              <div className="promo-row">
                <span className="promo-label">Action</span>
                <strong className="promo-value" style={{ color: "#818cf8" }}>{summaryAction}</strong>
              </div>
              {feeChanged && (
                <p className="promo-explain-note">
                  A rate adjustment is applied automatically so previously accrued fees are not re-charged at the new rate.
                </p>
              )}
            </div>
          </div>

          <div className="promo-actions">
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={promoting}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleConfirmPromotion} disabled={promoting}>
              {promoting ? "Promoting..." : "Confirm Promotion"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Promotion;
