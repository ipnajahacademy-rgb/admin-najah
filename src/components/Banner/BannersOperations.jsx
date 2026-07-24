import React, { useEffect, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

export default function BannersOperations() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // Courses (for dropdown)
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // Create / Edit modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null); // null = create mode
  const [formImage, setFormImage] = useState(null);
  const [formCourse, setFormCourse] = useState(""); // stores course _id internally
  const [formPreview, setFormPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH COURSES (for dropdown) ----------------

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const res = await fetch(`${API_BASE}/api/course`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setCourses(Array.isArray(data.data) ? data.data : []);
      }
    } catch (e) {
      console.error("Failed to load courses:", e);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // ---------------- FETCH BANNERS ----------------

  const fetchBanners = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/banners`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        const list = data.data || data.banners || data || [];
        setBanners(Array.isArray(list) ? list : []);
      } else {
        setError(data.message || "Failed to load banners");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchCourses();
  }, []);

  // ---------------- PAGINATION ----------------

  const totalPages = Math.max(1, Math.ceil(banners.length / ITEMS_PER_PAGE));

  const paginatedBanners = banners.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- CREATE / EDIT MODAL ----------------

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormImage(null);
    setFormCourse("");
    setFormPreview("");
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormImage(null);
    setFormCourse(banner.course?._id || banner.course || "");
    setFormPreview(banner.image?.url || banner.image || "");
    setFormError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setShowFormModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      setFormPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formCourse) {
      setFormError("Please select a course");
      return;
    }

    if (!editingBanner && !formImage) {
      setFormError("Please select a banner image");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (formImage) formData.append("image", formImage);
      formData.append("course", formCourse); // course _id sent under the hood

      const url = editingBanner
        ? `${API_BASE}/api/admin/banners/${editingBanner._id}`
        : `${API_BASE}/api/admin/banners`;

      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(), // don't set Content-Type manually for FormData
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setShowFormModal(false);
        await fetchBanners();
      } else {
        setFormError(data.message || "Failed to save banner");
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
      const res = await fetch(
        `${API_BASE}/api/admin/banners/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setDeleteTarget(null);
        await fetchBanners();
      } else {
        setError(data.message || "Failed to delete banner");
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
          <h1 className="text-2xl font-bold text-gray-800">Banners Operations</h1>
          <p className="text-gray-600">Manage your banners here.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Banner
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Banner Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No banners found</p>
          <p className="text-sm">Click "Add Banner" to create your first one.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedBanners.map((banner) => (
              <div
                key={banner._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-gray-100">
                  <img
                    src={banner.image?.url || banner.image || ""}
                    alt="banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/300x150?text=No+Image";
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-1">Course</p>
                  <p
                    className="text-sm font-semibold text-gray-700 truncate"
                    title={banner.course?.title || "No course"}
                  >
                    {banner.course?.title || "No course"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(banner)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editingBanner ? "Edit Banner" : "Add Banner"}
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
                  Banner Image {editingBanner && "(leave empty to keep current)"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-gray-100 file:text-gray-700 file:rounded-l-lg"
                />
                {formPreview && (
                  <img
                    src={formPreview}
                    alt="preview"
                    className="mt-3 h-32 w-full object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Course
                </label>
                <select
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  disabled={isLoadingCourses}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                >
                  <option value="">
                    {isLoadingCourses ? "Loading courses..." : "Select a course"}
                  </option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="text-red-600 text-sm">{formError}</p>
              )}

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
                    : editingBanner
                    ? "Update Banner"
                    : "Create Banner"}
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
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Delete Banner?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. This banner will be permanently removed.
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