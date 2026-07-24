import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;
const HISTORY_ITEMS_PER_PAGE = 5;

export default function AllAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState(""); // teacher _id, "" = all
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Teacher history modal (paginated)
  const [historyTeacher, setHistoryTeacher] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH ATTENDANCE ----------------

  const fetchAllAttendance = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/teacher/attendancee/admin/all`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setAttendance(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load attendance");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceByTeacher = async (teacherId) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/attendancee/admin/teacher/${teacherId}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setAttendance(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load attendance");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceDetail = async (id) => {
    setDetailLoading(true);
    setDetailError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/attendancee/admin/${id}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setDetailRecord(data.data || null);
      } else {
        setDetailError(data.message || "Failed to load attendance record");
      }
    } catch (e) {
      setDetailError(e.message || "Something went wrong");
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (id) => {
    setDetailRecord({}); // triggers modal open with a loading state
    fetchAttendanceDetail(id);
  };

  const closeDetail = () => {
    setDetailRecord(null);
    setDetailError("");
  };

  const fetchTeacherHistory = async (teacherId) => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/attendancee/admin/teacher/${teacherId}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setHistoryRecords(Array.isArray(data.data) ? data.data : []);
      } else {
        setHistoryError(data.message || "Failed to load attendance history");
      }
    } catch (e) {
      setHistoryError(e.message || "Something went wrong");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = (teacher) => {
    setHistoryTeacher(teacher);
    setHistoryRecords([]);
    setHistoryError("");
    setHistoryPage(1);
    fetchTeacherHistory(teacher._id);
  };

  const closeHistory = () => {
    setHistoryTeacher(null);
    setHistoryRecords([]);
    setHistoryError("");
  };

  const refresh = () => {
    if (teacherFilter) {
      fetchAttendanceByTeacher(teacherFilter);
    } else {
      fetchAllAttendance();
    }
  };

  useEffect(() => {
    fetchAllAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (teacherFilter) {
      fetchAttendanceByTeacher(teacherFilter);
    } else {
      fetchAllAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherFilter]);

  // ---------------- UNIQUE TEACHER LIST (for the filter dropdown) ----------------
  // Built from whatever data is currently loaded; once a teacher filter is
  // active this will just contain that one teacher, so we keep a running
  // cache of teachers we've seen so the dropdown doesn't collapse.
  const [teacherOptions, setTeacherOptions] = useState([]);

  useEffect(() => {
    setTeacherOptions((prev) => {
      const map = new Map(prev.map((t) => [t._id, t]));
      attendance.forEach((a) => {
        if (a.teacher && a.teacher._id) {
          map.set(a.teacher._id, a.teacher);
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || "")
      );
    });
  }, [attendance]);

  // ---------------- FILTER + PAGINATION ----------------

  const filteredAttendance = useMemo(() => {
    let list = attendance;

    if (statusFilter) {
      list = list.filter(
        (a) => (a.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((a) => {
        const t = a.teacher || {};
        return (
          (t.fullName || "").toLowerCase().includes(term) ||
          (t.email || "").toLowerCase().includes(term) ||
          (t.teacherId || "").toLowerCase().includes(term) ||
          (t.subject || "").toLowerCase().includes(term) ||
          (a.status || "").toLowerCase().includes(term) ||
          (a.mode || "").toLowerCase().includes(term) ||
          (a.remark || "").toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [attendance, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttendance.length / ITEMS_PER_PAGE)
  );

  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, teacherFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyRecords.length / HISTORY_ITEMS_PER_PAGE)
  );

  const paginatedHistory = historyRecords.slice(
    (historyPage - 1) * HISTORY_ITEMS_PER_PAGE,
    historyPage * HISTORY_ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
  }, [historyTotalPages, historyPage]);

  // ---------------- STATS ----------------

  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(
      (a) => (a.status || "").toLowerCase() === "present"
    ).length;
    const halfDay = attendance.filter(
      (a) => (a.status || "").toLowerCase() === "half day"
    ).length;
    const absent = attendance.filter(
      (a) => (a.status || "").toLowerCase() === "absent"
    ).length;

    return { total, present, halfDay, absent };
  }, [attendance]);

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

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusStyles = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "present") return "bg-green-50 text-green-600";
    if (s === "half day") return "bg-orange-50 text-orange-600";
    if (s === "absent") return "bg-red-50 text-red-600";
    return "bg-gray-100 text-gray-500";
  };

  const modeStyles = (mode) => {
    const m = (mode || "").toLowerCase();
    if (m === "online") return "bg-blue-50 text-blue-600";
    if (m === "offline") return "bg-purple-50 text-purple-600";
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Attendance</h1>
          <p className="text-gray-600">View all teacher attendance records.</p>
        </div>
        <button
          onClick={refresh}
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
        <StatCard label="Total" value={stats.total} color="#3498db" icon="🗓️" />
        <StatCard label="Present" value={stats.present} color="#2ecc71" icon="✅" />
        <StatCard label="Half Day" value={stats.halfDay} color="#f39c12" icon="⏳" />
        <StatCard label="Absent" value={stats.absent} color="#e74c3c" icon="❌" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, teacher ID, subject, status..."
          className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        >
          <option value="">All Teachers</option>
          {teacherOptions.map((t) => (
            <option key={t._id} value={t._id}>
              {t.fullName} ({t.teacherId})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        >
          <option value="">All Status</option>
          <option value="Present">Present</option>
          <option value="Half Day">Half Day</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No attendance records found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Teacher</th>
                  <th className="px-4 py-3 font-semibold">Teacher ID</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Check In</th>
                  <th className="px-4 py-3 font-semibold">Check Out</th>
                  <th className="px-4 py-3 font-semibold">Working Hrs</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Remark</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttendance.map((a, i) => {
                  const t = a.teacher || {};
                  return (
                    <tr
                      key={a._id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => openHistory(t)}
                          className="font-semibold text-gray-800 hover:text-orange-500 hover:underline text-left"
                          title="View this teacher's full attendance history"
                        >
                          {t.fullName || "—"}
                        </button>
                        <div className="text-xs text-gray-400">{t.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.teacherId || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {t.subject || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(a.attendanceDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatTime(a.checkInTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatTime(a.checkOutTime)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {typeof a.workingHours === "number"
                          ? `${a.workingHours} hrs`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${modeStyles(
                            a.mode
                          )}`}
                        >
                          {a.mode || "—"}
                        </span>
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
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate" title={a.remark}>
                        {a.remark || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetail(a._id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openHistory(t)}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            History
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

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Attendance Details</h2>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : detailError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {detailError}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Teacher
                  </p>
                  <p className="font-semibold text-gray-800">
                    {detailRecord.teacher?.fullName || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{detailRecord.teacher?.email}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                    <span>Mobile: {detailRecord.teacher?.mobile || "—"}</span>
                    <span>Teacher ID: {detailRecord.teacher?.teacherId || "—"}</span>
                    <span>Subject: {detailRecord.teacher?.subject || "—"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Date" value={formatDate(detailRecord.attendanceDate)} />
                  <DetailRow
                    label="Status"
                    valueNode={
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles(
                          detailRecord.status
                        )}`}
                      >
                        {detailRecord.status || "—"}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Mode"
                    valueNode={
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${modeStyles(
                          detailRecord.mode
                        )}`}
                      >
                        {detailRecord.mode || "—"}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Working Hours"
                    value={
                      typeof detailRecord.workingHours === "number"
                        ? `${detailRecord.workingHours} hrs`
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Check In"
                    value={
                      detailRecord.checkInTime
                        ? `${formatDate(detailRecord.checkInTime)} ${formatTime(
                            detailRecord.checkInTime
                          )}`
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Check Out"
                    value={
                      detailRecord.checkOutTime
                        ? `${formatDate(detailRecord.checkOutTime)} ${formatTime(
                            detailRecord.checkOutTime
                          )}`
                        : "—"
                    }
                  />
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Remark
                  </p>
                  <p className="text-sm text-gray-700">
                    {detailRecord.remark || "—"}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={closeDetail}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher History Modal */}
      {historyTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {historyTeacher.fullName}'s Attendance History
                </h2>
                <p className="text-xs text-gray-400">
                  {historyTeacher.teacherId} · {historyTeacher.subject}
                  {!historyLoading && !historyError
                    ? ` · ${historyRecords.length} record${
                        historyRecords.length === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
              </div>
              <button
                onClick={closeHistory}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : historyError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {historyError}
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                <p className="text-sm font-medium">No attendance records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Check In</th>
                        <th className="px-4 py-3 font-semibold">Check Out</th>
                        <th className="px-4 py-3 font-semibold">Working Hrs</th>
                        <th className="px-4 py-3 font-semibold">Mode</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        {/* <th className="px-4 py-3 font-semibold">Details</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((a) => (
                        <tr
                          key={a._id}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatDate(a.attendanceDate)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatTime(a.checkInTime)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatTime(a.checkOutTime)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {typeof a.workingHours === "number"
                              ? `${a.workingHours} hrs`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${modeStyles(
                                a.mode
                              )}`}
                            >
                              {a.mode || "—"}
                            </span>
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
                          {/* <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => openDetail(a._id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              View
                            </button>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* History Pagination */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>

                  {Array.from({ length: historyTotalPages }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setHistoryPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          historyPage === page
                            ? "bg-orange-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                    }
                    disabled={historyPage === historyTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={closeHistory}
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
      {valueNode ? valueNode : <p className="text-sm text-gray-700">{value}</p>}
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
