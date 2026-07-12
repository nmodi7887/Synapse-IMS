import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingTeacher, setEditingTeacher] = useState(null);
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(search.toLowerCase()),
  );

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    fetchTeachers();
  }, []);
  const deleteTeacher = async (id) => {
    if (!window.confirm("Delete teacher?")) return;

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    fetchTeachers();
  };

  async function fetchTeachers() {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("id");

    if (error) {
      console.error(error);
      return;
    }

    setTeachers(data);
  }
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);

    setFormData({
      name: teacher.name || "",
      subject: teacher.subject || "",
      phone: teacher.phone || "",
      salary: teacher.salary || "",
    });

    setShowModal(true);
  };

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    phone: "",
    salary: "",
  });

  const addTeacher = async () => {
    const year = new Date().getFullYear();

    const { count } = await supabase.from("teachers").select("*", {
      count: "exact",
      head: true,
    });

    const teacherCode = `TC${year}${String((count || 0) + 1).padStart(3, "0")}`;

    const { error } = await supabase.from("teachers").insert([
      {
        teacher_id: teacherCode,
        name: formData.name,
        subject: formData.subject,
        phone: formData.phone,
        salary: Number(formData.salary),
      },
    ]);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await fetchTeachers();

    setFormData({
      name: "",
      subject: "",
      phone: "",
      salary: "",
    });

    setShowModal(false);
  };

  const updateTeacher = async () => {
    const { error } = await supabase
      .from("teachers")
      .update({
        name: formData.name,
        subject: formData.subject,
        phone: formData.phone,
        salary: parseFloat(formData.salary || 0),
      })
      .eq("id", editingTeacher.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setEditingTeacher(null);
    setShowModal(false);

    fetchTeachers();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">Manage teachers and salaries</p>
        </div>

        <button
          className="btn"
          onClick={() => {
            setEditingTeacher(null);

            setFormData({
              name: "",
              subject: "",
              phone: "",
              salary: "",
            });

            setShowModal(true);
          }}
        >
          + Add Teacher
        </button>
      </div>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search teacher..."
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
              <th>Subject</th>
              <th>Phone</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.teacher_id}</td>
                <td>{teacher.name}</td>
                <td>{teacher.subject}</td>
                <td>{teacher.phone}</td>
                <td>₹{teacher.salary}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(teacher)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteTeacher(teacher.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>

            <input
              placeholder="Teacher Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subject: e.target.value,
                })
              }
            />

            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value,
                })
              }
            />

            <input
              placeholder="Salary"
              value={formData.salary}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salary: e.target.value,
                })
              }
            />

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn"
                onClick={editingTeacher ? updateTeacher : addTeacher}
              >
                {editingTeacher ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Teachers;
