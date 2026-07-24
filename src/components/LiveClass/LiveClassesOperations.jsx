import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

export default function LiveClassesOperations() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH LIVE CLASSES ----------------

  const fetchLiveClasses = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/live-classes`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setClasses(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load live classes");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  // ---------------- FILTER + PAGINATION ----------------

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const term = search.toLowerCase();

    return classes.filter((c) => {
      return (
        (c.title || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term) ||
        (c.teacher?.fullName || "").toLowerCase().includes(term) ||
        (c.teacher?.email || "").toLowerCase().includes(term)
      );
    });
  }, [classes, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClasses.length / ITEMS_PER_PAGE)
  );

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- STATS ----------------

  const stats = useMemo(() => {
    const total = classes.length;
    const upcoming = classes.filter(
      (c) => (c.status || "").toLowerCase() === "upcoming"
    ).length;
    const completed = classes.filter(
      (c) => (c.status || "").toLowerCase() === "completed"
    ).length;
    const live = classes.filter(
      (c) => (c.status || "").toLowerCase() === "live"
    ).length;

    return { total, upcoming, completed, live };
  }, [classes]);

  // ---------------- HELPERS ----------------

  const formatDate = (dateString) => {
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
    if (s === "live") return "bg-red-50 text-red-600";
    if (s === "completed") return "bg-green-50 text-green-600";
    return "bg-orange-50 text-orange-600"; // upcoming / default
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Live Classes</h1>
          <p className="text-gray-600">View all scheduled live classes.</p>
        </div>
        <button
          onClick={fetchLiveClasses}
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
        <StatCard label="Total" value={stats.total} color="#3498db" icon="📚" />
        <StatCard label="Upcoming" value={stats.upcoming} color="#f39c12" icon="⏰" />
        <StatCard label="Live" value={stats.live} color="#e74c3c" icon="🔴" />
        <StatCard label="Completed" value={stats.completed} color="#2ecc71" icon="✅" />
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title, teacher, or description..."
        className="w-full sm:w-80 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* Table / List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No live classes found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Teacher Name</th>
                  <th className="px-4 py-3 font-semibold">Teacher Email</th>
                  <th className="px-4 py-3 font-semibold">Teacher Mobile</th>
                  <th className="px-4 py-3 font-semibold">Class Date</th>
                  <th className="px-4 py-3 font-semibold">Start Time</th>
                  <th className="px-4 py-3 font-semibold">End Time</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Meeting Link</th>
                  <th className="px-4 py-3 font-semibold">Created At</th>
                  <th className="px-4 py-3 font-semibold">Updated At</th>
                </tr>
              </thead>
              <tbody>
                
                {paginatedClasses.map((c, i) => (
                    <>
  <tr
    key={i + 1}
    className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
  >
    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
      {i + 1}
    </td>
    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
      {c.title || "Untitled"}
    </td>
    <td className="px-4 py-3 text-gray-600 min-w-[180px]">
      {c.description || "—"}
    </td>
    <td className="px-4 py-3 text-gray-500">
      {c.course?.title || c.course || "—"}
    </td>
    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
      {c.teacher?.fullName || "—"}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {c.teacher?.email || "—"}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {c.teacher?.mobile || "—"}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {formatDate(c.classDate)}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {c.startTime || "—"}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {c.endTime || "—"}
    </td>
    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
      {c.mode || "—"}
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles(
          c.status
        )}`}
      >
        {c.status || "Upcoming"}
      </span>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          c.isActive
            ? "bg-green-50 text-green-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {c.isActive ? "Active" : "Inactive"}
      </span>
    </td>
    <td className="px-4 py-3 min-w-[200px] break-all">
      {c.meetingLink ? (
        <a
          href={c.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs"
        >
          {c.meetingLink}
        </a>
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
    </td>
    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
      {formatDateTime(c.createdAt)}
    </td>
    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
      {formatDateTime(c.updatedAt)}
    </td>
  </tr>
  </>
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