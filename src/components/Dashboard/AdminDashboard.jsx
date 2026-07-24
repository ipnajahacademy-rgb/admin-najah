import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5002";

export default function AdminDashboard() {
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Clicked leave (from latestLeaves) shown in a modal
  const [selectedLeave, setSelectedLeave] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchDashboards = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [attendanceRes, leaveRes] = await Promise.all([
        fetch(`${API_BASE}/api/teacher/attendancee/admin/dashboard`, {
          method: "GET",
          headers: authHeaders(),
        }),
        fetch(`${API_BASE}/api/teacher/leave/dashboard`, {
          method: "GET",
          headers: authHeaders(),
        }),
      ]);

      const attendanceData = await attendanceRes.json();
      const leaveData = await leaveRes.json();

      if (attendanceRes.ok && attendanceData.success !== false) {
        setAttendanceStats(attendanceData.dashboard || null);
      } else {
        setError(attendanceData.message || "Failed to load attendance dashboard");
      }

      if (leaveRes.ok && leaveData.success !== false) {
        setLeaveStats(leaveData.dashboard || null);
      } else {
        setError((prev) => prev || leaveData.message || "Failed to load leave dashboard");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

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
    if (s === "cancelled") return "bg-gray-200 text-gray-700";
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Attendance and leave overview.</p>
        </div>
        <button
          onClick={fetchDashboards}
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

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Attendance Dashboard */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Attendance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                label="Total Teachers"
                value={attendanceStats?.totalTeachers}
                color="#3498db"
                icon="👨‍🏫"
              />
              <StatCard
                label="Total Attendance"
                value={attendanceStats?.totalAttendance}
                color="#8e44ad"
                icon="🗓️"
              />
              <StatCard
                label="Present"
                value={attendanceStats?.present}
                color="#2ecc71"
                icon="✅"
              />
              <StatCard
                label="Half Day"
                value={attendanceStats?.halfDay}
                color="#f39c12"
                icon="⏳"
              />
              <StatCard
                label="Absent"
                value={attendanceStats?.absent}
                color="#e74c3c"
                icon="❌"
              />
              <StatCard
                label="Leave"
                value={attendanceStats?.leave}
                color="#6b7280"
                icon="🌴"
              />
            </div>
          </section>

          {/* Leave Dashboard */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Leave
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                label="Total Leaves"
                value={leaveStats?.totalLeaves}
                color="#3498db"
                icon="🗒️"
              />
              <StatCard
                label="Pending"
                value={leaveStats?.pending}
                color="#f39c12"
                icon="⏳"
              />
              <StatCard
                label="Approved"
                value={leaveStats?.approved}
                color="#2ecc71"
                icon="✅"
              />
              <StatCard
                label="Rejected"
                value={leaveStats?.rejected}
                color="#e74c3c"
                icon="❌"
              />
              <StatCard
                label="Cancelled"
                value={leaveStats?.cancelled}
                color="#6b7280"
                icon="🚫"
              />
            </div>
          </section>
          
          {/* Latest Leaves */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Latest Leaves
            </h2>

            {!leaveStats?.latestLeaves || leaveStats.latestLeaves.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                <p className="text-sm font-medium">No recent leave requests</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pb-10">
                {leaveStats.latestLeaves.map((leave) => (
                  <button
                    key={leave._id}
                    onClick={() => setSelectedLeave(leave)}
                    className="text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 hover:border-orange-200 transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {leave.teacher?.fullName || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {leave.teacher?.subject} · {leave.leaveType} ·{" "}
                        {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyles(
                        leave.status
                      )}`}
                    >
                      {leave.status || "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Leave Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Leave Details</h2>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Teacher
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedLeave.teacher?.fullName || "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedLeave.teacher?.subject || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Leave Type" value={selectedLeave.leaveType} />
                <DetailRow
                  label="Status"
                  valueNode={
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles(
                        selectedLeave.status
                      )}`}
                    >
                      {selectedLeave.status || "—"}
                    </span>
                  }
                />
                <DetailRow label="From" value={formatDate(selectedLeave.fromDate)} />
                <DetailRow label="To" value={formatDate(selectedLeave.toDate)} />
                <DetailRow
                  label="Approved At"
                  value={formatDateTime(selectedLeave.approvedAt)}
                />
                <DetailRow
                  label="Attachment"
                  valueNode={
                    selectedLeave.attachment ? (
                      <a
                        href={selectedLeave.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700">—</p>
                    )
                  }
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Reason
                </p>
                <p className="text-sm text-gray-700">
                  {selectedLeave.reason || "—"}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Admin Remark
                </p>
                <p className="text-sm text-gray-700">
                  {selectedLeave.adminRemark || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedLeave(null)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, valueNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      {valueNode ? valueNode : <p className="text-sm text-gray-700">{value || "—"}</p>}
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
      <h3 className="text-2xl font-bold text-gray-800">
        {typeof value === "number" ? value : "—"}
      </h3>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}
