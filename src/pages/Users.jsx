// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const API = "http://localhost:5002/api/users";

// const getInitials = (name) =>
//   name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [editId, setEditId] = useState(null);
//   const [search, setSearch] = useState("");
//   const [form, setForm] = useState({ fullName: "", email: "", password: "" });

//   useEffect(() => { fetchUsers(); }, []);

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get(`${API}/all`);
//       setUsers(res.data.users);
//     } catch { alert("Error fetching users"); }
//   };

//   const deleteUser = async (id) => {
//     if (!window.confirm("Delete user?")) return;
//     try {
//       await axios.delete(`${API}/${id}`);
//       fetchUsers();
//     } catch { alert("Delete failed"); }
//   };

//   const startEdit = (user) => {
//     setEditId(user._id);
//     setForm({ fullName: user.fullName, email: user.email, password: "" });
//   };

//   const cancelEdit = () => {
//     setEditId(null);
//     setForm({ fullName: "", email: "", password: "" });
//   };

//   const updateUser = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.put(`${API}/${editId}`, form);
//       cancelEdit();
//       fetchUsers();
//     } catch { alert("Update failed"); }
//   };

//   const filteredUsers = users.filter((u) =>
//     u.fullName.toLowerCase().includes(search.toLowerCase()) ||
//     u.email.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={s.page}>
//       <div style={s.header}>
//         <div style={s.headerLeft}>
//           <span style={s.title}>Users management</span>
//           <span style={s.badge}>{filteredUsers.length} users</span>
//         </div>
//       </div>

//       <input
//         style={s.search}
//         placeholder="Search by name or email..."
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//       />

//       {editId && (
//         <div style={s.editCard}>
//           <div style={s.editLabel}>Edit user</div>
//           <form onSubmit={updateUser}>
//             <div style={s.editRow}>
//               <input style={s.input} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" />
//               <input style={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
//               <input style={s.input} type="password" placeholder="New password (optional)" onChange={(e) => setForm({ ...form, password: e.target.value })} />
//             </div>
//             <div style={s.editActions}>
//               <button type="submit" style={s.btnSave}>Update</button>
//               <button type="button" style={s.btnCancel} onClick={cancelEdit}>Cancel</button>
//             </div>
//           </form>
//         </div>
//       )}

//       <div style={s.tableWrap}>
//         <table style={s.table}>
//           <thead style={s.thead}>
//             <tr>
//               <th style={s.th}>Name</th>
//               <th style={s.th}>Email</th>
//               <th style={s.th}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredUsers.length === 0 ? (
//               <tr><td colSpan="3" style={s.empty}>No users found</td></tr>
//             ) : (
//               filteredUsers.map((u) => (
//                 <tr key={u._id} style={s.tr}>
//                   <td style={s.td}>
//                     <div style={s.nameCell}>
//                       <div style={s.av}>{getInitials(u.fullName)}</div>
//                       {u.fullName}
//                     </div>
//                   </td>
//                   <td style={s.td}><span style={s.email}>{u.email}</span></td>
//                   <td style={s.td}>
//                     <div style={s.actions}>
//                       <button style={s.btnEdit} onClick={() => startEdit(u)}>Edit</button>
//                       <button style={s.btnDel} onClick={() => deleteUser(u._id)}>Delete</button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const s = {
//   page: { padding: "24px", background: "#ffffff" },
//   header: { display: "flex", alignItems: "center", marginBottom: 20 },
//   headerLeft: { display: "flex", alignItems: "center", gap: 10 },
//   title: { fontSize: 16, fontWeight: 500, color: "#111827" },
//   badge: { fontSize: 11, background: "#E6F1FB", color: "#0C447C", padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
//   search: { width: 260, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, outline: "none", marginBottom: 16, display: "block", background: "#fff", color: "#111827" },
//   editCard: { background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 16 },
//   editLabel: { fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 12 },
//   editRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
//   input: { padding: "8px 11px", borderRadius: 8, border: "0.5px solid #d1d5db", fontSize: 13, outline: "none", flex: 1, minWidth: 150, background: "#fff", color: "#111827" },
//   editActions: { display: "flex", gap: 8 },
//   btnSave: { padding: "7px 16px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "#111827", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 },
//   btnCancel: { padding: "7px 16px", borderRadius: 8, border: "0.5px solid #d1d5db", background: "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer" },
//   tableWrap: { border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
//   table: { width: "100%", borderCollapse: "collapse" },
//   thead: { background: "#f9fafb" },
//   th: { textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" },
//   tr: { borderTop: "0.5px solid #f3f4f6" },
//   td: { padding: "12px 16px", fontSize: 13, color: "#111827", verticalAlign: "middle" },
//   nameCell: { display: "flex", alignItems: "center", gap: 10 },
//   av: { width: 32, height: 32, borderRadius: "50%", background: "#E6F1FB", color: "#0C447C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0 },
//   email: { color: "#9ca3af", fontSize: 12 },
//   actions: { display: "flex", gap: 6 },
//   btnEdit: { padding: "5px 12px", borderRadius: 8, border: "0.5px solid #e5e7eb", background: "transparent", color: "#374151", fontSize: 12, cursor: "pointer" },
//   btnDel: { padding: "5px 12px", borderRadius: 8, border: "0.5px solid #fca5a5", background: "transparent", color: "#dc2626", fontSize: 12, cursor: "pointer" },
//   empty: { textAlign: "center", padding: 32, color: "#d1d5db", fontSize: 13 },
// };

// export default Users;

import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5002/api/users";

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/all`);
      setUsers(res.data.users);
    } catch { alert("Error fetching users"); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchUsers();
    } catch { alert("Delete failed"); }
  };

  const startEdit = (user) => {
    setEditId(user._id);
    setForm({ fullName: user.fullName, email: user.email, password: "" });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ fullName: "", email: "", password: "" });
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/${editId}`, form);
      cancelEdit();
      fetchUsers();
    } catch { alert("Update failed"); }
  };

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.title}>👥 Users Management</span>
            <span style={styles.badge}>{filteredUsers.length} users</span>
          </div>
        </div>

        {/* Search */}
        <input
          style={styles.search}
          placeholder="🔍 Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Edit Card */}
        {editId && (
          <div style={styles.editCard}>
            <div style={styles.editLabel}>✏️ Edit User</div>
            <form onSubmit={updateUser}>
              <div style={styles.editRow}>
                <input 
                  style={styles.input} 
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  placeholder="Full name" 
                />
                <input 
                  style={styles.input} 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="Email" 
                />
                <input 
                  style={styles.input} 
                  type="password" 
                  placeholder="New password (optional)" 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                />
              </div>
              <div style={styles.editActions}>
                <button type="submit" style={styles.btnSave}>Update</button>
                <button type="button" style={styles.btnCancel} onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="3" style={styles.empty}>No users found</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={styles.av}>{getInitials(u.fullName)}</div>
                        {u.fullName}
                      </div>
                    </td>
                    <td style={styles.td}><span style={styles.email}>{u.email}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button style={styles.btnEdit} onClick={() => startEdit(u)}>Edit</button>
                        <button style={styles.btnDel} onClick={() => deleteUser(u._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8f9fa",
    padding: "24px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e9ecef",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
  },
  badge: {
    fontSize: "12px",
    background: "#e9ecef",
    color: "#495057",
    padding: "4px 12px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  search: {
    width: "100%",
    maxWidth: "350px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "14px",
    outline: "none",
    marginBottom: "20px",
    background: "#fff",
    color: "#2d3748",
    transition: "border-color 0.2s",
  },
  editCard: {
    background: "#f8f9fa",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid #e9ecef",
  },
  editLabel: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "15px",
  },
  editRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "15px",
  },
  input: {
    padding: "9px 14px",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    fontSize: "13px",
    outline: "none",
    flex: "1",
    minWidth: "150px",
    background: "#fff",
    color: "#2d3748",
    transition: "border-color 0.2s",
  },
  editActions: {
    display: "flex",
    gap: "10px",
  },
  btnSave: {
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#4a6cf7",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  btnCancel: {
    padding: "8px 20px",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#6c757d",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  tableWrap: {
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e9ecef",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  thead: {
    background: "#f8f9fa",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  tr: {
    borderBottom: "1px solid #e9ecef",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "#2d3748",
    verticalAlign: "middle",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  av: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#4a6cf7",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    flexShrink: 0,
  },
  email: {
    color: "#6c757d",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  btnEdit: {
    padding: "5px 14px",
    borderRadius: "6px",
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#495057",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  btnDel: {
    padding: "5px 14px",
    borderRadius: "6px",
    border: "1px solid #f8d7da",
    background: "#fff",
    color: "#dc3545",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#adb5bd",
    fontSize: "14px",
  },
};

// Add hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  input:focus {
    border-color: #4a6cf7 !important;
    box-shadow: 0 0 0 2px rgba(74,108,247,0.1) !important;
  }

  .btnSave:hover {
    background: #3a5cd5 !important;
  }

  .btnCancel:hover {
    background: #f8f9fa !important;
  }

  .btnEdit:hover {
    border-color: #4a6cf7 !important;
    color: #4a6cf7 !important;
    background: #f8f9fa !important;
  }

  .btnDel:hover {
    background: #f8d7da !important;
    border-color: #f5c6cb !important;
  }

  tr:hover {
    background: #f8f9fa !important;
  }

  @media (max-width: 768px) {
    .container {
      padding: 16px !important;
    }
    .editRow {
      flex-direction: column;
    }
    .input {
      min-width: 100% !important;
    }
    .actions {
      flex-direction: column;
    }
    .btnEdit, .btnDel {
      width: 100%;
      text-align: center;
    }
    .search {
      max-width: 100% !important;
    }
    .header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .page {
      padding: 12px !important;
    }
    .container {
      padding: 12px !important;
    }
    .th, .td {
      padding: 8px 12px !important;
      font-size: 12px !important;
    }
    .av {
      width: 28px !important;
      height: 28px !important;
      font-size: 10px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Users;