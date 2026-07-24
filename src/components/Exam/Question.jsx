import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 6;

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH QUESTIONS ----------------

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/exam-questions/admin/all`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setQuestions(Array.isArray(data.data) ? data.data : []);
        setSummary(data.summary || null);
      } else {
        setError(data.message || "Failed to load exam questions");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ---------------- FILTER + PAGINATION ----------------

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;
    const term = search.toLowerCase();

    return questions.filter((q) => {
      return (
        (q.question || "").toLowerCase().includes(term) ||
        (q.type || "").toLowerCase().includes(term) ||
        (q.createdBy?.email || "").toLowerCase().includes(term) ||
        (q.explanation || "").toLowerCase().includes(term)
      );
    });
  }, [questions, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  );

  const paginatedQuestions = filteredQuestions.slice(
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

  const typeStyles = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "mcq") return "bg-blue-50 text-blue-600";
    if (t === "truefalse" || t === "true/false")
      return "bg-purple-50 text-purple-600";
    if (t === "shortanswer") return "bg-orange-50 text-orange-600";
    if (t === "longanswer") return "bg-pink-50 text-pink-600";
    return "bg-gray-100 text-gray-500";
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Questions</h1>
          <p className="text-gray-600">View the full question bank.</p>
        </div>
        <button
          onClick={fetchQuestions}
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

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total" value={summary.total} color="#3498db" icon="📚" />
          <StatCard label="Active" value={summary.active} color="#2ecc71" icon="🟢" />
          <StatCard label="Inactive" value={summary.inactive} color="#95a5a6" icon="⚪" />
          <StatCard label="MCQ" value={summary.mcq} color="#9b59b6" icon="🔘" />
          <StatCard label="True/False" value={summary.trueFalse} color="#f39c12" icon="✔️" />
          <StatCard
            label="Short/Long Answer"
            value={(summary.shortAnswer || 0) + (summary.longAnswer || 0)}
            color="#e67e22"
            icon="✍️"
          />
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by question, type, explanation, or creator email..."
        className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No questions found</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {paginatedQuestions.map((q, i) => {
              const isExpanded = expandedId === q._id;

              return (
                <div
                  key={q._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div
                    onClick={() => toggleExpand(q._id)}
                    className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-gray-400 text-xs font-medium mt-1">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {q.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeStyles(
                              q.type
                            )}`}
                          >
                            {q.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            Marks: <b>{q.marks}</b>
                          </span>
                          <span className="text-xs text-gray-500">
                            Negative: <b>{q.negativeMarks}</b>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              q.isActive
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {q.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {q.exam ? `Exam: ${q.exam}` : "Unassigned to exam"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 flex flex-col gap-4">
                      {/* Question Image */}
                      {q.questionImage?.url && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            Question Image
                          </p>
                          <img
                            src={q.questionImage.url}
                            alt="question"
                            className="max-h-48 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {/* Options */}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            Options
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt._id}
                                className={`px-3 py-2 rounded-lg text-sm border flex items-center justify-between gap-2 ${
                                  opt.isCorrect
                                    ? "bg-green-50 border-green-200 text-green-700 font-medium"
                                    : "bg-white border-gray-200 text-gray-600"
                                }`}
                              >
                                <span>{opt.text || "—"}</span>
                                {opt.isCorrect && <span>✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer (for non-MCQ types) */}
                      {q.correctAnswer && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                            Correct Answer
                          </p>
                          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            {q.correctAnswer}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                            Explanation
                          </p>
                          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Explanation Image */}
                      {q.explanationImage?.url && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            Explanation Image
                          </p>
                          <img
                            src={q.explanationImage.url}
                            alt="explanation"
                            className="max-h-48 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 pt-2 border-t border-gray-200">
                        <span>ID: {q._id}</span>
                        <span>Created by: {q.createdBy?.email || "—"}</span>
                        <span>Created: {formatDateTime(q.createdAt)}</span>
                        <span>Updated: {formatDateTime(q.updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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