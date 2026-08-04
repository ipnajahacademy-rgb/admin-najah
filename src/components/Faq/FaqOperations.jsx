import React, { useEffect, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

export default function FaqOperations() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Create / Edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // null = create mode
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH FAQS ----------------

  const fetchFaqs = async (search = "") => {
    setIsLoading(true);
    setError("");

    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_BASE}/api/faqs${query}`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        const list = data.data || data.faqs || data || [];
        setFaqs(Array.isArray(list) ? list : []);
      } else {
        setError(data.message || "Failed to load FAQs");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchFaqs(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ---------------- PAGINATION ----------------

  const totalPages = Math.max(1, Math.ceil(faqs.length / ITEMS_PER_PAGE));

  const paginatedFaqs = faqs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- CREATE / EDIT MODAL ----------------

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory("");
    setFormIsPublished(true);
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question || "");
    setFormAnswer(faq.answer || "");
    setFormCategory(faq.category || "");
    setFormIsPublished(faq.isPublished !== false);
    setFormError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setShowFormModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formQuestion.trim() || !formAnswer.trim()) {
      setFormError("Question and answer are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory.trim() || "General",
        isPublished: formIsPublished,
      };

      const url = editingFaq
        ? `${API_BASE}/api/faqs/${editingFaq._id}`
        : `${API_BASE}/api/faqs`;

      const method = editingFaq ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setShowFormModal(false);
        await fetchFaqs(searchTerm);
      } else {
        setFormError(data.message || "Failed to save FAQ");
      }
    } catch (e) {
      setFormError(e.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- DELETE ----------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE}/api/faqs/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setDeleteTarget(null);
        await fetchFaqs(searchTerm);
      } else {
        setError(data.message || "Failed to delete FAQ");
        setDeleteTarget(null);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">FAQ Operations</h1>
          <p className="text-gray-600">Manage your FAQs here.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> Add FAQ
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search question or answer..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* FAQ List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No FAQs found</p>
          <p className="text-sm">Click "Add FAQ" to create your first one.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedFaqs.map((faq) => (
              <div
                key={faq._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-block bg-orange-50 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {faq.category || "General"}
                  </span>
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                      faq.isPublished
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {faq.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <p
                  className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2"
                  title={faq.question}
                >
                  {faq.question}
                </p>
                <p
                  className="text-sm text-gray-500 line-clamp-3 flex-1"
                  title={faq.answer}
                >
                  {faq.answer}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(faq)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(faq)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-1.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-4">
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

      {/* Create / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingFaq ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <button
                onClick={closeFormModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Question
                </label>
                <textarea
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  rows={2}
                  placeholder="e.g. What is your return policy?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Answer
                </label>
                <textarea
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  rows={4}
                  placeholder="Write the answer here..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="General"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    Published
                  </label>
                </div>
              </div>

              {formError && <p className="text-red-600 text-sm">{formError}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingFaq
                    ? "Update FAQ"
                    : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Delete FAQ?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. This FAQ will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}