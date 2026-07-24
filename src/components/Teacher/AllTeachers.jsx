import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Blocked"];

export default function AllTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Documents modal
  const [docTarget, setDocTarget] = useState(null);

  // Status update (approve / reject / block)
  const [updatingId, setUpdatingId] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { teacherId, teacherName, status }

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH TEACHERS ----------------

  const fetchTeachers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/teacher/admin/all`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setTeachers(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load teachers");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ---------------- STATUS UPDATE (approve / reject / block) ----------------
  // The action control is always visible so status can be changed again
  // later (e.g. blocking a teacher that was previously approved). Every
  // change goes through a Yes/No confirmation before hitting the API.

  const updateTeacherStatus = async (teacherId, status) => {
    setUpdatingId(teacherId);
    setStatusError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/teacher/${teacherId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setTeachers((prev) =>
          prev.map((t) =>
            t._id === teacherId ? { ...t, status } : t
          )
        );
      } else {
        setStatusError(data.message || "Failed to update teacher status");
      }
    } catch (e) {
      setStatusError(e.message || "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  const requestStatusChange = (teacher, status) => {
    setConfirmAction({
      teacherId: teacher._id,
      teacherName: teacher.fullName,
      status,
    });
  };

  const cancelStatusChange = () => setConfirmAction(null);

  const confirmStatusChange = () => {
    if (!confirmAction) return;
    updateTeacherStatus(confirmAction.teacherId, confirmAction.status);
    setConfirmAction(null);
  };

  // ---------------- FILTER + PAGINATION ----------------

  const filteredTeachers = useMemo(() => {
    let list = teachers;

    if (statusFilter) {
      list = list.filter(
        (t) => (t.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((t) => {
        return (
          (t.fullName || "").toLowerCase().includes(term) ||
          (t.email || "").toLowerCase().includes(term) ||
          (t.mobile || "").toLowerCase().includes(term) ||
          (t.teacherId || "").toLowerCase().includes(term) ||
          (t.subject || "").toLowerCase().includes(term) ||
          (t.status || "").toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [teachers, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE)
  );

  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- STATS ----------------

  const stats = useMemo(() => {
    const total = teachers.length;
    const approved = teachers.filter(
      (t) => (t.status || "").toLowerCase() === "approved"
    ).length;
    const pending = teachers.filter(
      (t) => (t.status || "").toLowerCase() === "pending"
    ).length;
    const rejected = teachers.filter(
      (t) => (t.status || "").toLowerCase() === "rejected"
    ).length;
    const blocked = teachers.filter(
      (t) => (t.status || "").toLowerCase() === "blocked"
    ).length;

    return { total, approved, pending, rejected, blocked };
  }, [teachers]);

  // ---------------- HELPERS ----------------

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusStyles = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "bg-green-50 text-green-600";
    if (s === "pending") return "bg-orange-50 text-orange-600";
    if (s === "rejected") return "bg-red-50 text-red-600";
    if (s === "blocked") return "bg-gray-200 text-gray-700";
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Profiles</h1>
          <p className="text-gray-600">View all registered teachers.</p>
        </div>
        <button
          onClick={fetchTeachers}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {statusError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {statusError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="#3498db" icon="👨‍🏫" />
        <StatCard label="Approved" value={stats.approved} color="#2ecc71" icon="✅" />
        <StatCard label="Pending" value={stats.pending} color="#f39c12" icon="⏳" />
        <StatCard label="Rejected" value={stats.rejected} color="#e74c3c" icon="❌" />
        <StatCard label="Blocked" value={stats.blocked} color="#6b7280" icon="🚫" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, mobile, teacher ID, subject, or status..."
          className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No teachers found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Full Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Teacher ID</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">DOB</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Joining Date</th>
                  <th className="px-4 py-3 font-semibold">Last Login</th>
                  <th className="px-4 py-3 font-semibold">Documents</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeachers.map((t, i) => {
                  const isUpdating = updatingId === t._id;

                  return (
                    <tr
                      key={t._id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        {t.profileImage ? (
                          <img
                            src={t.profileImage}
                            alt={t.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold">
                            {(t.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {t.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.mobile || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.teacherId || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.subject || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.language || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(t.dob)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles(
                            t.status
                          )}`}
                        >
                          {t.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.isActive
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(t.joiningDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(t.lastLogin)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setDocTarget(t)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Documents
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value=""
                          disabled={isUpdating}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) requestStatusChange(t, value);
                          }}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {isUpdating ? "Updating..." : "Take action"}
                          </option>
                          <option value="approved">Approve</option>
                          <option value="rejected">Reject</option>
                          <option value="blocked">Block</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : "border border-gray-300 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Documents Modal */}
      {docTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {docTarget.fullName}'s Documents
                </h2>
                <p className="text-xs text-gray-400">{docTarget.teacherId}</p>
              </div>
              <button
                onClick={() => setDocTarget(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocumentCard
                label="Profile Image"
                url={docTarget.profileImage}
              />
              <DocumentCard
                label="Degree Certificate"
                url={docTarget.degreeCertificate}
              />
              <DocumentCard
                label="10th Certificate"
                url={docTarget.tenthCertificate}
              />
              <DocumentCard
                label="12th Certificate"
                url={docTarget.twelfthCertificate}
              />
            </div>

            {Array.isArray(docTarget.otherDocuments) &&
              docTarget.otherDocuments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Other Documents
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {docTarget.otherDocuments.map((doc, idx) => (
                      <DocumentCard
                        key={idx}
                        label={doc.title || `Document ${idx + 1}`}
                        url={doc.url || doc}
                      />
                    ))}
                  </div>
                </div>
              )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setDocTarget(null)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Status Change Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Confirm {actionLabel(confirmAction.status)}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to mark{" "}
              <span className="font-semibold text-gray-800">
                {confirmAction.teacherName}
              </span>{" "}
              as <span className="font-semibold">{confirmAction.status}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelStatusChange}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm"
              >
                No
              </button>
              <button
                onClick={confirmStatusChange}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium text-sm"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentCard({ label, url }) {
  const hasFile = url && url.trim() !== "";
  const isPdf = hasFile && url.toLowerCase().endsWith(".pdf");
  const isImage =
    hasFile && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.toLowerCase());

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
      </div>

      {!hasFile ? (
        <div className="h-32 flex items-center justify-center text-gray-300 text-xs">
          Not uploaded
        </div>
      ) : isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={label}
            className="h-32 w-full object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-2 p-3">
          <span className="text-3xl">{isPdf ? "📄" : "📎"}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs font-medium"
          >
            Open File
          </a>
        </div>
      )}
    </div>
  );
}

function actionLabel(status) {
  const s = (status || "").toLowerCase();
  if (s === "approved") return "Approval";
  if (s === "rejected") return "Rejection";
  if (s === "blocked") return "Block";
  return "Action";
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 text-center"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <span className="text-2xl block mb-1">{icon}</span>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}
