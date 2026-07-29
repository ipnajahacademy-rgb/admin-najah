import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5002";
const ITEMS_PER_PAGE = 8;

export default function TeacherLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Approve / Reject action modal (needs an admin remark)
  const [actionModal, setActionModal] = useState(null); // { leaveId, teacherName, action: 'approve' | 'reject' }
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH LEAVES ----------------

  const fetchLeaves = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/teacher/leave`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
      } else {
        setError(data.message || "Failed to load leave requests");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ---------------- APPROVE / REJECT ----------------

  const openAction = (leave, action) => {
    setActionModal({
      leaveId: leave._id,
      teacherName: leave.teacher?.fullName || "this teacher",
      action,
    });
    setRemark(action === "reject" ? "" : "");
    setActionError("");
  };

  const closeAction = () => {
    setActionModal(null);
    setRemark("");
    setActionError("");
  };

  const submitAction = async () => {
    if (!actionModal) return;

    setSubmitting(true);
    setActionError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/leave/${actionModal.leaveId}/${actionModal.action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ adminRemark: remark }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success !== false) {
        const newStatus = actionModal.action === "approve" ? "Approved" : "Rejected";
        setLeaves((prev) =>
          prev.map((l) =>
            l._id === actionModal.leaveId
              ? { ...l, status: newStatus, adminRemark: remark }
              : l
          )
        );
        setActionModal(null);
        setRemark("");
      } else {
        setActionError(data.message || "Failed to update leave request");
      }
    } catch (e) {
      setActionError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- FILTER + PAGINATION ----------------

  const filteredLeaves = useMemo(() => {
    let list = leaves;

    if (statusFilter) {
      list = list.filter(
        (l) => (l.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((l) => {
        const t = l.teacher || {};
        return (
          (t.fullName || "").toLowerCase().includes(term) ||
          (t.email || "").toLowerCase().includes(term) ||
          (t.subject || "").toLowerCase().includes(term) ||
          (l.leaveType || "").toLowerCase().includes(term) ||
          (l.reason || "").toLowerCase().includes(term) ||
          (l.status || "").toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [leaves, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE)
  );

  const paginatedLeaves = filteredLeaves.slice(
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
    const total = leaves.length;
    const approved = leaves.filter(
      (l) => (l.status || "").toLowerCase() === "approved"
    ).length;
    const pending = leaves.filter(
      (l) => (l.status || "").toLowerCase() === "pending"
    ).length;
    const rejected = leaves.filter(
      (l) => (l.status || "").toLowerCase() === "rejected"
    ).length;

    return { total, approved, pending, rejected };
  }, [leaves]);

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
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Leaves</h1>
          <p className="text-gray-600">Review and manage teacher leave requests.</p>
        </div>
        <button
          onClick={fetchLeaves}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="#3498db" icon="🗒️" />
        <StatCard label="Approved" value={stats.approved} color="#2ecc71" icon="✅" />
        <StatCard label="Pending" value={stats.pending} color="#f39c12" icon="⏳" />
        <StatCard label="Rejected" value={stats.rejected} color="#e74c3c" icon="❌" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, subject, leave type, reason, or status..."
          className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No leave requests found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Teacher</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Leave Type</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">To</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Attachment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Admin Remark</th>
                  <th className="px-4 py-3 font-semibold">Approved At</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((l, i) => {
                  const t = l.teacher || {};
                  return (
                    <tr
                      key={l._id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">
                          {t.fullName || "—"}
                        </div>
                        <div className="text-xs text-gray-400">{t.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.subject || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {l.leaveType || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(l.fromDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(l.toDate)}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate"
                        title={l.reason}
                      >
                        {l.reason || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {l.attachment ? (
                          <a
                            href={l.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles(
                            l.status
                          )}`}
                        >
                          {l.status || "—"}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate"
                        title={l.adminRemark}
                      >
                        {l.adminRemark || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(l.approvedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAction(l, "approve")}
                            className="bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openAction(l, "reject")}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
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

      {/* Approve / Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {actionModal.action === "approve" ? "Approve" : "Reject"} Leave Request
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {actionModal.action === "approve" ? "Approving" : "Rejecting"} leave
              for{" "}
              <span className="font-semibold text-gray-800">
                {actionModal.teacherName}
              </span>
              .
            </p>

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Admin Remark
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder={
                actionModal.action === "approve"
                  ? "e.g. Approved by Admin"
                  : "e.g. Medical proof not valid"
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mt-3">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeAction}
                disabled={submitting}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={submitting}
                className={`px-5 py-2 rounded-lg font-medium text-sm text-white disabled:opacity-50 ${
                  actionModal.action === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {submitting
                  ? "Submitting..."
                  : actionModal.action === "approve"
                  ? "Approve"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
