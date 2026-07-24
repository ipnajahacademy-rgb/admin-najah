import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

export default function ExamAttemptOperations() {
  const [attempts, setAttempts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH ATTEMPTS ----------------

  const fetchAttempts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/exam-attempts/admin/all`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setAttempts(Array.isArray(data.data) ? data.data : []);
        setStatistics(data.statistics || null);
      } else {
        setError(data.message || "Failed to load exam attempts");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  // ---------------- FILTER + PAGINATION ----------------

  const filteredAttempts = useMemo(() => {
    if (!search.trim()) return attempts;
    const term = search.toLowerCase();

    return attempts.filter((a) => {
      return (
        (a.user?.fullName || "").toLowerCase().includes(term) ||
        (a.user?.email || "").toLowerCase().includes(term) ||
        (a.user?.mobile || "").toLowerCase().includes(term) ||
        (a.status || "").toLowerCase().includes(term) ||
        (a.exam?.title || "").toLowerCase().includes(term)
      );
    });
  }, [attempts, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttempts.length / ITEMS_PER_PAGE)
  );

  const paginatedAttempts = filteredAttempts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- HELPERS ----------------

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

  const formatTimeTaken = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const statusStyles = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "submitted") return "bg-blue-50 text-blue-600";
    if (s === "started") return "bg-orange-50 text-orange-600";
    if (s === "expired" || s === "timeout") return "bg-red-50 text-red-600";
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Attempts</h1>
          <p className="text-gray-600">View all student exam attempts.</p>
        </div>
        <button
          onClick={fetchAttempts}
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

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Total Attempts" value={statistics.totalAttempts} color="#3498db" icon="📊" />
          <StatCard label="Started" value={statistics.started} color="#f39c12" icon="⏳" />
          <StatCard label="Submitted" value={statistics.submitted} color="#2ecc71" icon="📤" />
          <StatCard label="Passed" value={statistics.passed} color="#27ae60" icon="✅" />
          <StatCard label="Failed" value={statistics.failed} color="#e74c3c" icon="❌" />
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by student name, email, mobile, or status..."
        className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No exam attempts found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Exam</th>
                  <th className="px-4 py-3 font-semibold">Attempt #</th>
                  <th className="px-4 py-3 font-semibold">Total Qs</th>
                  <th className="px-4 py-3 font-semibold">Attempted</th>
                  <th className="px-4 py-3 font-semibold">Skipped</th>
                  <th className="px-4 py-3 font-semibold">Correct</th>
                  <th className="px-4 py-3 font-semibold">Wrong</th>
                  <th className="px-4 py-3 font-semibold">Marks</th>
                  <th className="px-4 py-3 font-semibold">Percentage</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Time Taken</th>
                  <th className="px-4 py-3 font-semibold">Started At</th>
                  <th className="px-4 py-3 font-semibold">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttempts.map((a, i) => (
                  <tr
                    key={a._id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                      {a.user?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.user?.mobile || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.exam?.title || a.exam || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.attemptNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.totalQuestions ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.attemptedQuestions ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.skippedQuestions ?? 0}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">
                      {a.correctAnswers ?? 0}
                    </td>
                    <td className="px-4 py-3 text-red-500 font-medium whitespace-nowrap">
                      {a.wrongAnswers ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      {a.obtainedMarks ?? 0} / {a.totalMarks ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a.percentage ?? 0}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.status === "Submitted" ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.passed
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {a.passed ? "Passed" : "Failed"}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles(
                          a.status
                        )}`}
                      >
                        {a.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatTimeTaken(a.timeTaken)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(a.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(a.submittedAt)}
                    </td>
                  </tr>
                ))}
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