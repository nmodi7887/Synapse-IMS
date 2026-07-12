import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

function Students() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const pageSize = 10;
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("id");

    if (error) {
      console.error(error);
      return;
    }
    setStudents(data);
  }

  const deleteStudent = async (student) => {
    const confirmDelete = window.confirm(
      `Delete ${student.name} (${student.student_id}) and all payment history? This cannot be undone.`,
    );

    if (!confirmDelete) return;

    setDeletingId(student.id);

    const { error: paymentError } = await supabase
      .from("payments")
      .delete()
      .eq("student_id", student.student_id);

    if (paymentError) {
      console.error(paymentError);
      showToast("Failed to delete payment history", "error");
      setDeletingId(null);
      return;
    }

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    if (studentError) {
      console.error(studentError);
      showToast("Failed to delete student record", "error");
      setDeletingId(null);
      return;
    }

    showToast(`Student ${student.name} deleted successfully`, "success");
    setDeletingId(null);
    fetchStudents();
  };

  const filteredStudents = students.filter(
    (student) =>
      (student.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.student_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.class || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalFiltered = filteredStudents.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function getPageNumbers() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student records</p>
        </div>

        <button className="btn" onClick={() => navigate("/admission")}>
          + New Admission
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search student by name, ID or class..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="table-container">
        <div className="overflow-x-auto"><table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Guardian</th>
              <th>Class</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">No student records found.</td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td className="cell-id">{student.student_id}</td>
                  <td>{student.name}</td>
                  <td>{student.father_name}</td>
                  <td>{student.class}</td>
                  <td>{student.phone}</td>
                  <td>
                    <span
                      className={
                        student.fee_status === "Paid"
                          ? "status-paid"
                          : "status-due"
                      }
                    >
                      {student.fee_status || "Due"}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      View
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/admission/${student.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteStudent(student)}
                      disabled={deletingId === student.id}
                    >
                      {deletingId === student.id ? "Deleting..." : "Delete"}
                    </button>
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
            Previous
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`e${idx}`} style={{ color: "#64748b", padding: "0 4px" }}>...</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  minWidth: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: currentPage === page ? "1px solid #818cf8" : "1px solid rgba(129,140,248,0.2)",
                  background: currentPage === page ? "rgba(129,140,248,0.2)" : "transparent",
                  color: currentPage === page ? "#818cf8" : "#e2e8f0",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: currentPage === page ? "600" : "400",
                }}
              >
                {page}
              </button>
            )
          )}

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
            Next
          </button>
        </div>

      </div>
    </>
  );
}

export default Students;
