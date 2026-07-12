import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

function Students() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

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
      "Delete this student and all payment history?",
    );

    if (!confirmDelete) return;

    const { error: paymentError } = await supabase
      .from("payments")
      .delete()
      .eq("student_id", student.student_id);

    if (paymentError) {
      console.error(paymentError);
      return;
    }

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    if (studentError) {
      console.error(studentError);
      return;
    }

    fetchStudents();
  };

  const filteredStudents = students.filter(
    (student) =>
      (student.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.student_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.class || "").toLowerCase().includes(search.toLowerCase()),
  );

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
          onChange={(e) => setSearch(e.target.value)}
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
              filteredStudents.map((student) => (
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
                  <td>
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
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

export default Students;
