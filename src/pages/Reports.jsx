import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import {
  MdSearch,
  MdArrowDropDown,
  MdPrint,
  MdAssessment,
} from "react-icons/md";

function Reports() {
  const [studentsList, setStudentsList] = useState([]);
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [demandClassFilter, setDemandClassFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // Default ko empty rakha hai taaki auto-select na ho
  const [paidTillMonth, setPaidTillMonth] = useState("");
  const [generatedPaymentId, setGeneratedPaymentId] = useState("");
  const [latestPaymentNote, setLatestPaymentNote] = useState("");
  const [invoiceOtherFee, setInvoiceOtherFee] = useState("");
  const [invoiceOtherFeeNote, setInvoiceOtherFeeNote] = useState("");
  const [demandOtherFee, setDemandOtherFee] = useState("");
  const [demandOtherFeeNote, setDemandOtherFeeNote] = useState("");
  const [demandForMonth, setDemandForMonth] = useState("");
  const tableCellStyle = {
    padding: "10px 18px",
    border: "1.5px solid #000",
    fontSize: "15px",
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchStudentsDirectory();
  }, []);

  async function fetchStudentsDirectory() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          "student_id, roll_no, name, class, total_fee, other_fee, discount_fee, total_paid, father_name, phone, admission_date",
        );
      if (error) throw error;
      setStudentsList(data || []);
    } catch (err) {
      console.error("Error loading student references:", err);
    }
  }

  const studentClassOptions = [
    ...new Set(studentsList.map((s) => s.class).filter(Boolean)),
  ].sort();

  const filteredStudentSearchOptions = studentsList.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearchInput.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(studentSearchInput.toLowerCase()) ||
      s.class?.toLowerCase().includes(studentSearchInput.toLowerCase()),
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearchInput(`${student.name} (${student.student_id})`);
    setShowDropdown(false);
    setPaidTillMonth("");
    setInvoiceOtherFee(student.other_fee || "");
    setInvoiceOtherFeeNote("");

    // Unique Payment ID Generator
    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const newPaymentId = `SWC-${currentYear}-${randomDigits}`;
    setGeneratedPaymentId(newPaymentId);

    fetchLatestPaymentNote(student.student_id);
  };

  const fetchLatestPaymentNote = async (studentId) => {
    if (!studentId) { setLatestPaymentNote(""); setInvoiceOtherFeeNote(""); return; }
    try {
      const { data } = await supabase
        .from("payments")
        .select("note")
        .eq("student_id", studentId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      const note = data?.note || "";
      setLatestPaymentNote(note);
      setInvoiceOtherFeeNote(note);
    } catch { setLatestPaymentNote(""); setInvoiceOtherFeeNote(""); }
  };

  const handlePrintReceipt = () => {
    const printContents = document.getElementById(
      "printable-receipt-canvas",
    ).innerHTML;

    let printFrame = document.getElementById("mobile-print-frame");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "mobile-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    const doc = frameDoc.document || frameDoc;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Payment Slip</title>
          <style>
            @page { size: A4; margin: 15mm 20mm; }
            body { font-family: Arial, sans-serif; color: #000000; background: #ffffff; padding: 0; margin: 0; font-size: 15px; }
            table { width: 100%; max-width: 640px; margin: 16px auto; border-collapse: collapse; }
            th { background: #ffffff !important; color: #000000 !important; padding: 10px 18px; text-align: left; font-weight: normal; width: 45%; border: 1.5px solid #000000 !important; }
            td { padding: 10px 18px; text-align: left; font-weight: bold; border: 1.5px solid #000000 !important; }
            .assistance-bar { background-color: #a4bdf2 !important; text-align: center; padding: 10px; font-weight: normal; font-size: 15px; border: 1.5px solid #7395e3; max-width: 604px; margin: 20px auto; }
            .footer-signatures { display: flex; justify-content: space-between; max-width: 640px; margin: 50px auto 10px auto; padding: 0 5px; }
            .sig-block { font-size: 13px; color: #000000; width: 120px; text-align: center; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <div>${printContents}</div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 300); };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const handlePrintDemandBill = () => {
    const classStudents = studentsList.filter(
      (s) => s.class === demandClassFilter,
    );

    if (classStudents.length === 0) {
      alert("No students found in the selected class.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const billHtml = classStudents
      .map((student, idx) => {
        const sTotalFee = Number(student.total_fee || 0);
        const sOtherFee = Number(demandOtherFee || 0);
        const sCumOtherFee = Number(student.other_fee || 0);
        const sDiscountFee = Number(student.discount_fee || 0);
        const sTotalPaid = Number(student.total_paid || 0);
        const sNote = demandOtherFeeNote || "";
        let sMonths = 1;
        if (student.admission_date) {
          const sStart = new Date(student.admission_date);
          const sNow = new Date();
          sMonths = Math.max(
            1,
            (sNow.getFullYear() - sStart.getFullYear()) * 12 +
              (sNow.getMonth() - sStart.getMonth()),
          );
        }
        const sExpectedSoFar = sMonths * sTotalFee + sCumOtherFee - sDiscountFee;
        const sBackDues = Math.max(0, sExpectedSoFar - sTotalPaid);
        const sMonthlyFee = sTotalFee;
        const sTotalPayable = sMonthlyFee + sOtherFee + sBackDues;
        const sNetPayable = sMonthlyFee + sOtherFee;

        const concatNo = `DEM-${currentYear}-${String(idx + 1).padStart(4, "0")}`;

        const otherFeeLabel = sNote
          ? `Other Fee (${sNote})`
          : "Other Fee";

        return `
          <div style="page-break-after:${idx < classStudents.length - 1 ? "always" : "avoid"};display:flex;flex-direction:column;min-height:90vh;justify-content:space-between;">
            <div>
              <div style="text-align:center;">
                <img src="/logo.png" alt="Logo" style="width:90px;height:90px;object-fit:contain;display:block;margin:0 auto;" />
                <h2 style="margin:2px 0;font-size:26px;font-weight:800;">SUCCESS WITH CLASS</h2>
                <p style="margin:0;font-size:14px;color:#333;">Patut, Bikram, Patna</p>
              </div>
              <div style="text-align:center;font-size:20px;font-weight:bold;border-bottom:2px solid #000;padding-bottom:6px;margin:8px 0 12px;">
                DEMAND BILL
              </div>
              <div style="text-align:right;font-size:13px;margin-bottom:8px;font-weight:bold;">
                No: ${concatNo}
              </div>
              <table style="width:100%;max-width:580px;margin:0 auto;border-collapse:collapse;">
                <tbody>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;width:42%;font-size:15px;">Admission No.</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">${student.roll_no || "—"}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Class</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">${student.class || "—"}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Student Name</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">${student.name || "—"}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Father's Name</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">${student.father_name || "—"}</td></tr>
                  ${demandForMonth ? `<tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">For Month</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">${demandForMonth}</td></tr>` : ""}
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Monthly Fee</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">₹ ${sMonthlyFee.toFixed(2)}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">${otherFeeLabel}</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">₹ ${sOtherFee.toFixed(2)}</td></tr>
                  <tr style="font-weight:bold;"><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">Net Payable Fee</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">₹ ${sNetPayable.toFixed(2)}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Back Dues</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">₹ ${sBackDues.toFixed(2)}</td></tr>
                  <tr><th style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:normal;font-size:15px;">Total Fee Payable</th><td style="padding:9px 16px;border:1.5px solid #000;text-align:left;font-weight:bold;font-size:15px;">₹ ${sTotalPayable.toFixed(2)}</td></tr>
                </tbody>
              </table>
              <div style="background-color:#a4bdf2;text-align:center;padding:8px;font-size:15px;border:1.5px solid #7395e3;max-width:544px;margin:14px auto 0;">
                For any assistance call us :- 7277543702 (Office Hrs.)
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    let printFrame = document.getElementById("demand-print-frame");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "demand-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    const doc = frameDoc.document || frameDoc;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Demand Bill - ${demandClassFilter}</title>
          <style>
            @page { size: A4; margin: 12mm 15mm; }
            body { font-family: Arial, sans-serif; color: #000000; background: #ffffff; padding: 0; margin: 0; font-size: 15px; }
            table { width: 100%; max-width: 580px; margin: 0 auto; border-collapse: collapse; }
            th { background: #ffffff !important; color: #000000 !important; padding: 9px 16px; text-align: left; font-weight: normal; width: 42%; border: 1.5px solid #000000 !important; }
            td { padding: 9px 16px; text-align: left; font-weight: bold; border: 1.5px solid #000000 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          ${billHtml}
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 300); };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  // Calculations (monthly fee basis with carry-forward)
  const monthlyFee = Number(selectedStudent?.total_fee || 0);
  const otherFee = Number(invoiceOtherFee || selectedStudent?.other_fee || 0);
  const discountFee = Number(selectedStudent?.discount_fee || 0);
  const totalPaid = Number(selectedStudent?.total_paid || 0);

  let monthsSinceAdmission = 1;
  if (selectedStudent?.admission_date) {
    const start = new Date(selectedStudent.admission_date);
    const now = new Date();
    monthsSinceAdmission =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (monthsSinceAdmission < 1) monthsSinceAdmission = 1;
  }

  const totalExpectedSoFar =
    monthsSinceAdmission * monthlyFee + otherFee - discountFee;
  const backDues = Math.max(0, totalExpectedSoFar - totalPaid);
  const totalDueNow = backDues;

  const currentFormattedDate = new Date().toLocaleDateString("en-IN");

  return (
    <>
      {/* CSS For Immersive Hover States */}
      <style>{`
        .immersive-item {
          transition: all 0.2s ease-in-out;
        }
        .immersive-item:hover {
          background-color: rgba(99, 102, 241, 0.15) !important;
          color: #fff !important;
          padding-left: 20px !important;
        }
        .billing-card {
          position: relative;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)) !important;
          border: 1px solid rgba(129, 140, 248, 0.12) !important;
          backdrop-filter: blur(12px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .billing-card:hover {
          border-color: rgba(129, 140, 248, 0.35) !important;
          box-shadow: 0 8px 40px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(129, 140, 248, 0.1);
          transform: translateY(-2px);
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeSlideDown 0.25s ease-out;
        }
        .autocomplete-dropdown {
          scrollbar-width: thin;
          scrollbar-color: rgba(129, 140, 248, 0.3) transparent;
        }
        .autocomplete-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        .autocomplete-dropdown::-webkit-scrollbar-thumb {
          background: rgba(129, 140, 248, 0.3);
          border-radius: 4px;
        }
        .glow-btn {
          position: relative;
          overflow: hidden;
        }
        .glow-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .glow-btn:hover::after {
          opacity: 1;
        }
      `}</style>

      {/* WEB DASHBOARD WORKSPACE */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}
      >
        <div className="page-header" style={{ marginBottom: "30px" }}>
          <h1
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <MdAssessment style={{ color: "#818cf8" }} /> Student Billing &
            Reports
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {/*  SECTION 1: INVOICE BILL (INDIVIDUAL)  */}
          <div
            className="card billing-card"
            style={{
              position: "relative",
              flex: "1 1 400px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#818cf8",
                }}
              ></div>
              <label
                style={{
                  color: "#e5e7eb",
                  fontWeight: "700",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Invoice Bill — Individual
              </label>
            </div>

            <strong
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Search Student (Name, ID or Class)
            </strong>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                marginBottom: "18px",
              }}
            >
              <MdSearch
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--muted)",
                  fontSize: "22px",
                }}
              />
              <input
                type="text"
                placeholder="Type name, ID or class..."
                value={studentSearchInput}
                onChange={(e) => {
                  setStudentSearchInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowDropdown(false);
                  }, 250);
                }}
                style={{
                  width: "100%",
                  padding: "14px 40px 14px 45px",
                  fontSize: "15px",
                  borderRadius: "10px",
                }}
              />
              <MdArrowDropDown
                style={{
                  position: "absolute",
                  right: "14px",
                  color: "var(--muted)",
                  fontSize: "24px",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* AUTOCOMPLETE DROPDOWN */}
            {showDropdown && (
              <div
                className="autocomplete-dropdown fade-in"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "linear-gradient(145deg, #1f2937, #111827)",
                  border: "1px solid rgba(129, 140, 248, 0.25)",
                  borderRadius: "16px",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow:
                    "0 12px 30px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0,0,0,0.3)",
                  padding: "6px",
                }}
              >
                {filteredStudentSearchOptions.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      color: "var(--muted)",
                      textAlign: "center",
                      fontSize: "14px",
                    }}
                  >
                    No students matched
                  </div>
                ) : (
                  filteredStudentSearchOptions.map((student) => (
                    <div
                      key={student.student_id}
                      onClick={() => handleSelectStudent(student)}
                      className="immersive-item"
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderRadius: "10px",
                        color: "#e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "2px",
                      }}
                    >
                      <span style={{ fontWeight: "500" }}>{student.name}</span>
                      <span
                        style={{
                          color: "#818cf8",
                          fontSize: "13px",
                          background: "rgba(129, 140, 248, 0.1)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {student.student_id}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SELECTED STUDENT INFO + PRINT CONTROLS */}
            {selectedStudent && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(17, 24, 39, 0.9))",
                  border: "1px solid rgba(129, 140, 248, 0.15)",
                  borderRadius: "14px",
                  padding: "20px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
                      {selectedStudent.name}
                    </h3>
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        color: "var(--muted)",
                        fontSize: "12px",
                      }}
                    >
                      ID: {selectedStudent.student_id} |{" "}
                      <span style={{ color: "#fcd34d" }}>
                        {generatedPaymentId}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearchInput("");
                      setPaidTillMonth("");
                      setLatestPaymentNote("");
                      setInvoiceOtherFee("");
                      setInvoiceOtherFeeNote("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "20px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      lineHeight: 1,
                    }}
                    title="Clear selection"
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#818cf8",
                    }}
                  ></div>
                  <label
                    style={{
                      color: "#94a3b8",
                      fontWeight: "600",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Fee Paid Till Month Of:
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ position: "relative", width: "220px" }}>
                    <select
                      value={paidTillMonth}
                      onChange={(e) => setPaidTillMonth(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 36px 10px 12px",
                        background: "#1e293b",
                        color: paidTillMonth ? "#f8fafc" : "#94a3b8",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                        appearance: "none",
                        outline: "none",
                      }}
                    >
                      <option value="" disabled>
                        Select Month
                      </option>
                      {monthNames.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <MdArrowDropDown
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#818cf8",
                        fontSize: "20px",
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  <button
                    onClick={handlePrintReceipt}
                    className="glow-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <MdPrint style={{ fontSize: "16px" }} /> Print Invoice Bill
                  </button>
                </div>

                <div style={{ marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#94a3b8",
                    }}
                  >
                    Other Fee (₹)
                  </strong>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={invoiceOtherFee}
                    onChange={(e) => setInvoiceOtherFee(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      marginBottom: "10px",
                      boxSizing: "border-box",
                    }}
                  />

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      color: "#94a3b8",
                    }}
                  >
                    What is this Other Fee for?
                  </strong>
                  <input
                    type="text"
                    placeholder='e.g. Books, Supplies, Uniform...'
                    value={invoiceOtherFeeNote}
                    onChange={(e) => setInvoiceOtherFeeNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}
          </div>


          {/* ===== SECTION 2: DEMAND BILL (CLASS WISE) ===== */}
          <div
            className="card billing-card demand-card"
            style={{
              flex: "1 1 400px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#fbbf24",
                }}
              ></div>
              <label
                style={{
                  color: "#e5e7eb",
                  fontWeight: "700",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Demand Bill — Class Wise
              </label>
            </div>

            <strong
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Select Class
            </strong>
            <select
              value={demandClassFilter}
              onChange={(e) => setDemandClassFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
                marginBottom: "16px",
              }}
            >
              <option value="">Select a class</option>
              {studentClassOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <strong
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Other Fee (₹)
            </strong>
            <input
              type="number"
              placeholder="e.g. 500"
              value={demandOtherFee}
              onChange={(e) => setDemandOtherFee(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />

            <strong
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              What is this Other Fee for?
            </strong>
            <input
              type="text"
              placeholder='e.g. Books, Supplies, Uniform...'
              value={demandOtherFeeNote}
              onChange={(e) => setDemandOtherFeeNote(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            <strong
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              For Month
            </strong>
            <input
              type="text"
              placeholder="e.g. June 2026"
              value={demandForMonth}
              onChange={(e) => setDemandForMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={handlePrintDemandBill}
              disabled={!demandClassFilter}
              className="glow-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 22px",
                background: demandClassFilter
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "rgba(255,255,255,0.05)",
                color: demandClassFilter ? "#ffffff" : "#64748b",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: demandClassFilter ? "pointer" : "not-allowed",
                boxShadow: demandClassFilter
                  ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                  : "none",
                whiteSpace: "nowrap",
              }}
            >
              <MdPrint style={{ fontSize: "18px" }} /> Generate Demand Bill
            </button>
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT CANVAS LAYOUT */}
      <div style={{ display: "none" }}>
        <div
          id="printable-receipt-canvas"
          style={{
            width: "100%",
            maxWidth: "800px",
            padding: "20px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            <img
              src="/logo.png"
              alt="Institute Logo"
              style={{
                width: "110px",
                height: "110px",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />

            <h2
              style={{
                margin: "5px 0",
                fontSize: "30px",
                fontWeight: "800",
              }}
            >
              SUCCESS WITH CLASS
            </h2>

            <p
              style={{
                margin: "0",
                fontSize: "16px",
                color: "#333",
              }}
            >
              Patut, Bikram, Patna
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "20px",
              fontWeight: "bold",
              borderBottom: "2.5px solid #000",
              paddingBottom: "6px",
              marginBottom: "14px",
            }}
          >
            PAYMENT SLIP
          </div>
          <table
            style={{
              width: "100%",
              maxWidth: "640px",
              margin: "0 auto",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                    width: "42%",
                  }}
                >
                  Payment ID
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {generatedPaymentId || "—"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Admission No.
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {selectedStudent?.roll_no || "—"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Class
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {selectedStudent?.class || "—"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Student Name
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {selectedStudent?.name || "—"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Father's Name
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {selectedStudent?.father_name || "—"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Payment Date
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {currentFormattedDate}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Paid Till
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  {paidTillMonth || "Not Selected"}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Monthly Fee
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  ₹ {monthlyFee.toFixed(2)}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Other Fee{invoiceOtherFeeNote ? ` (${invoiceOtherFeeNote})` : ""}
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  ₹ {otherFee.toFixed(2)}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  Net Payable Fee
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  ₹ {(monthlyFee + otherFee).toFixed(2)}
                </td>
              </tr>

              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Total Paid (Cumulative)
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  ₹ {totalPaid.toFixed(2)}
                </td>
              </tr>
              <tr>
                <th
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  Remainig Amount / Dues
                </th>
                <td
                  style={{
                    ...tableCellStyle,
                    padding: "10px 18px",
                    fontSize: "15px",
                  }}
                >
                  ₹ {backDues.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="assistance-bar">
            For any assistance call us :- 7277543702 (Office Hrs.)
          </div>

          <div className="footer-signatures">
            <div
              className="sig-block"
              style={{
                marginTop: "50px",
                borderTop: "1.5px dashed #000",
                paddingTop: "15px",
              }}
            >
              Signature
            </div>
            <div
              className="sig-block"
              style={{
                marginTop: "50px",
                borderTop: "1.5px dashed #000",
                paddingTop: "15px",
              }}
            >
              Stamp
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Reports;
