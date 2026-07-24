import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BASE_URL = "http://localhost:5002/api";
const getToken = () => localStorage.getItem("token");
const authConfig = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// Unwrap common API response shapes: { tree: [...] }, { categories: [...] },
// { data: [...] }, or a bare array
const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tree)) return payload.tree;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

/* ─── ICONS ── */
const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="5" cy="3" r="1.2" fill="currentColor" />
    <circle cx="5" cy="8" r="1.2" fill="currentColor" />
    <circle cx="5" cy="13" r="1.2" fill="currentColor" />
    <circle cx="11" cy="3" r="1.2" fill="currentColor" />
    <circle cx="11" cy="8" r="1.2" fill="currentColor" />
    <circle cx="11" cy="13" r="1.2" fill="currentColor" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </svg>
);

/* ─── MULTI-COURSE DROPDOWN ── */
const MultiCourseDropdown = ({ courses, selectedIds, onChange, placeholder = "Select Courses" }) => {
  const [open, setOpen] = useState(false);

  const toggleCourse = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedTitles = courses
    .filter((c) => selectedIds.includes(c._id))
    .map((c) => c.title);

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          height: "40px",
          padding: "0 12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          background: "#fff",
          fontSize: "14px",
          color: "#1f2937",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "border-color 0.2s",
          textAlign: "left",
        }}
      >
        {selectedTitles.length === 0 ? (
          <span style={{ color: "#9ca3af", flex: 1 }}>{placeholder}</span>
        ) : (
          <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedTitles.length === 1 ? selectedTitles[0] : `${selectedTitles.length} courses selected`}
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            zIndex: 100,
            maxHeight: "200px",
            overflowY: "auto",
          }}>
            {courses.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af" }}>No courses available</div>
            ) : (
              courses.map((c) => {
                const checked = selectedIds.includes(c._id);
                return (
                  <label
                    key={c._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      background: checked ? "#eff6ff" : "transparent",
                    }}
                    onClick={() => toggleCourse(c._id)}
                  >
                    <span style={{
                      width: "18px",
                      height: "18px",
                      border: "1.5px solid #d1d5db",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: checked ? "#3b82f6" : "#fff",
                      color: checked ? "#fff" : "transparent",
                      transition: "all 0.15s",
                    }}>
                      {checked && <CheckIcon />}
                    </span>
                    <span style={{ flex: 1, fontSize: "13px", color: "#1f2937" }}>{c.title}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── SECTION CARD ── */
const SectionCard = ({
  section,
  index,
  total,
  editId,
  editValue,
  editCourseIds,
  editCategoryId,
  editIsActive,
  setEditValue,
  setEditCourseIds,
  setEditCategoryId,
  setEditIsActive,
  courses,
  categories,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onMove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditing = editId === section._id;
  const coursesArray = section.courses || (section.course ? [section.course] : []);
  const categoryName =
    typeof section.category === "object" ? section.category?.name : null;

  return (
    <div ref={setNodeRef} style={style} className="sec-card">
      <button className="drag-handle" {...attributes} {...listeners} tabIndex={-1}>
        <GripIcon />
      </button>

      <span className="order-badge">{index + 1}</span>

      {isEditing ? (
        <div className="edit-area">
          <div className="edit-fields">
            <input
              className="edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
              placeholder="Section title..."
            />
            <select
              className="sm-select"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <MultiCourseDropdown
              courses={courses}
              selectedIds={editCourseIds}
              onChange={setEditCourseIds}
              placeholder="Select Courses"
            />
            <label className="active-toggle">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>
          <div className="edit-actions">
            <button className="icon-btn success" onClick={onSaveEdit}>
              <CheckIcon />
            </button>
            <button className="icon-btn" onClick={onCancelEdit}>
              <XIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className="card-body">
          <span className="sec-title">
            {section.title}
            {section.isActive === false && <span className="inactive-badge">Inactive</span>}
          </span>
          <div className="course-badges">
            {categoryName && <span className="sec-course sec-category">🏷️ {categoryName}</span>}
            {coursesArray.length > 0 ? (
              coursesArray.map((c) => (
                <span key={c._id || c} className="sec-course">
                  📚 {c.title || "Unknown"}
                </span>
              ))
            ) : (
              <span className="sec-course no-course">No Course</span>
            )}
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="card-actions">
          <button
            className="icon-btn"
            onClick={() => onMove(section._id, "up")}
            disabled={index === 0}
            title="Move up"
          >
            <ArrowUpIcon />
          </button>
          <button
            className="icon-btn"
            onClick={() => onMove(section._id, "down")}
            disabled={index === total - 1}
            title="Move down"
          >
            <ArrowDownIcon />
          </button>
          <button className="icon-btn" onClick={() => onEdit(section)}>
            <EditIcon />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(section._id)}>
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── TOAST ── */
const Toast = ({ message, type }) =>
  message ? <div className={`toast toast-${type}`}>{message}</div> : null;

/* ─── MAIN COMPONENT ── */
const SectionManager = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [addCourseIds, setAddCourseIds] = useState([]);
  const [addCategoryId, setAddCategoryId] = useState("");
  const [sections, setSections] = useState([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCourseIds, setEditCourseIds] = useState([]);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 2500);
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/course`, authConfig());
      setCourses(res.data.data || []);
    } catch {
      showToast("Failed to load courses", "error");
    }
  }, [showToast]);

  // Category select is required by the sections API (POST/PUT body includes "category")
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/categories`, authConfig());
      setCategories(unwrapList(res.data));
    } catch {
      showToast("Failed to load categories", "error");
    }
  }, [showToast]);

  const fetchSections = useCallback(async (id) => {
    setLoading(true);
    try {
      const url = id ? `${BASE_URL}/sections/${id}` : `${BASE_URL}/sections`;
      const res = await axios.get(url, authConfig());
      setSections(res.data.data || []);
    } catch {
      showToast("Failed to load sections", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchSections();
  }, [fetchCourses, fetchCategories, fetchSections]);

  useEffect(() => {
    fetchSections(courseId);
  }, [courseId, fetchSections]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return showToast("Enter a section title", "error");
    if (!addCategoryId) return showToast("Please select a category", "error");
    if (addCourseIds.length === 0) return showToast("Please select at least one course", "error");
    try {
      await axios.post(
        `${BASE_URL}/sections`,
        { title, category: addCategoryId, courses: addCourseIds },
        authConfig()
      );
      setTitle("");
      setAddCourseIds([]);
      setAddCategoryId("");
      fetchSections(courseId);
      showToast("Section added successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add section", "error");
    }
  };

  const handleEdit = (section) => {
    setEditId(section._id);
    setEditValue(section.title);
    setEditIsActive(section.isActive !== false);
    setEditCategoryId(
      typeof section.category === "object" ? section.category?._id : section.category || ""
    );
    const ids = (section.courses || (section.course ? [section.course] : []))
      .map((c) => (typeof c === "object" ? c._id : c));
    setEditCourseIds(ids);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) return showToast("Title cannot be empty", "error");
    if (editCourseIds.length === 0) return showToast("Select at least one course", "error");
    try {
      await axios.put(
        `${BASE_URL}/sections/${editId}`,
        {
          title: editValue,
          category: editCategoryId || undefined,
          isActive: editIsActive,
          courses: editCourseIds,
        },
        authConfig()
      );
      setEditId(null);
      setEditValue("");
      setEditCourseIds([]);
      setEditCategoryId("");
      fetchSections(courseId);
      showToast("Section updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditValue("");
    setEditCourseIds([]);
    setEditCategoryId("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      await axios.delete(`${BASE_URL}/sections/${id}`, authConfig());
      fetchSections(courseId);
      showToast("Section deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  // Dedicated move-up / move-down endpoint: PUT /sections/:id/move { direction }
  const handleMove = async (id, direction) => {
    const oldIdx = sections.findIndex((s) => s._id === id);
    const newIdx = direction === "up" ? oldIdx - 1 : oldIdx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    // optimistic reorder
    setSections(arrayMove(sections, oldIdx, newIdx));

    try {
      await axios.put(`${BASE_URL}/sections/${id}/move`, { direction }, authConfig());
    } catch {
      showToast("Move failed", "error");
      fetchSections(courseId);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIdx = sections.findIndex((s) => s._id === active.id);
    const newIdx = sections.findIndex((s) => s._id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx);
    setSections(reordered);

    try {
      // API expects only the ordered list of ids — position in the array IS the order
      await axios.put(
        `${BASE_URL}/sections/reorder/all`,
        { sections: reordered.map((s) => ({ _id: s._id })) },
        authConfig()
      );
    } catch {
      showToast("Reorder failed", "error");
      fetchSections(courseId);
    }
  };

  const activeSection = activeId ? sections.find((s) => s._id === activeId) : null;

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .sec-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }
        .sec-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.08);
        }
        .sec-card.is-dragging {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border-color: #3b82f6;
        }

        .drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          margin-top: -2px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: grab;
          border-radius: 6px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .drag-handle:hover {
          color: #4b5563;
          background: #f9fafb;
        }
        .drag-handle:active {
          cursor: grabbing;
        }

        .order-badge {
          min-width: 28px;
          height: 28px;
          margin-top: -1px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .card-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sec-title {
          font-size: 15px;
          font-weight: 500;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .inactive-badge {
          font-size: 10px;
          font-weight: 600;
          color: #b45309;
          background: #fef3c7;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .course-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .sec-course {
          font-size: 11px;
          color: #4b5563;
          background: #f9fafb;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 20px;
          font-weight: 500;
          white-space: nowrap;
        }
        .sec-course.sec-category {
          background: #eef2ff;
          color: #4338ca;
        }
        .sec-course.no-course {
          color: #9ca3af;
          background: #f9fafb;
        }

        .edit-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .edit-fields {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .edit-actions {
          display: flex;
          gap: 6px;
        }
        .edit-input {
          flex: 1;
          min-width: 140px;
          height: 38px;
          padding: 0 12px;
          border: 1.5px solid #3b82f6;
          border-radius: 8px;
          font-size: 14px;
          color: #1f2937;
          outline: none;
          background: #fff;
        }
        .active-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          white-space: nowrap;
        }

        .card-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .icon-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: transparent;
          color: #6b7280;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #1f2937;
        }
        .icon-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .icon-btn:disabled:hover {
          background: transparent;
          border-color: #e5e7eb;
          color: #6b7280;
        }
        .icon-btn.danger:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }
        .icon-btn.success:hover {
          background: #f0fdf4;
          border-color: #86efac;
          color: #16a34a;
        }

        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          animation: slideUp 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .toast-success {
          background: #1f2937;
          color: #fff;
        }
        .toast-error {
          background: #dc2626;
          color: #fff;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .overlay-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #fff;
          border: 2px solid #3b82f6;
          border-radius: 10px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
          cursor: grabbing;
        }

        .sm-wrapper {
          max-width: 800px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .sm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .sm-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .sm-header p {
          font-size: 13px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        .count-pill {
          background: #f3f4f6;
          color: #4b5563;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 14px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .sm-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .add-form-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .add-form-box label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .sm-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .sm-input {
          flex: 1;
          min-width: 160px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #1f2937;
          outline: none;
          background: #fff;
          transition: border-color 0.2s;
        }
        .sm-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .sm-select {
          height: 40px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: #1f2937;
          outline: none;
          cursor: pointer;
          min-width: 160px;
          transition: border-color 0.2s;
        }
        .sm-select:focus {
          border-color: #3b82f6;
        }

        .add-btn {
          height: 40px;
          padding: 0 24px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .add-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .add-btn:active {
          transform: translateY(0);
        }

        .selected-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }
        .selected-pill {
          background: #e5e7eb;
          color: #1f2937;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pill-remove {
          cursor: pointer;
          opacity: 0.6;
          display: flex;
          align-items: center;
        }
        .pill-remove:hover {
          opacity: 1;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #9ca3af;
          font-size: 14px;
          border: 1.5px dashed #d1d5db;
          border-radius: 12px;
          background: #fff;
        }
        .empty-state strong {
          display: block;
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .loading-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skeleton {
          height: 60px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 10px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .section-divider {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        @media (max-width: 768px) {
          .sm-wrapper {
            padding: 16px;
          }
          .sm-form {
            flex-direction: column;
          }
          .sm-input, .sm-select, .multi-dropdown-trigger {
            min-width: 100%;
          }
          .add-btn {
            width: 100%;
            justify-content: center;
          }
          .sec-card {
            flex-wrap: wrap;
            gap: 8px;
          }
          .card-actions {
            margin-left: auto;
          }
          .edit-fields {
            flex-direction: column;
            align-items: stretch;
          }
          .edit-input {
            min-width: 100%;
          }
          .sm-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .sm-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .sec-card {
            padding: 12px;
          }
          .sec-title {
            font-size: 14px;
          }
          .order-badge {
            display: none;
          }
          .icon-btn {
            width: 30px;
            height: 30px;
          }
          .toast {
            bottom: 16px;
            right: 16px;
            left: 16px;
            text-align: center;
          }
        }
      `}</style>

      <div className="sm-wrapper">
        <div className="sm-header">
          <div>
            <h1>📚 Section Manager</h1>
            <p>Drag, or use the arrows, to reorder • Edit to rename • Multiple courses per section</p>
          </div>
          <span className="count-pill">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="sm-controls">
          <span className="filter-label">Filter:</span>
          <select className="sm-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="add-form-box">
          <label>➕ Add New Section</label>
          <form className="sm-form" onSubmit={handleAdd}>
            <input
              className="sm-input"
              type="text"
              placeholder="Section title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="sm-select"
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <MultiCourseDropdown
              courses={courses}
              selectedIds={addCourseIds}
              onChange={setAddCourseIds}
              placeholder="Select Courses"
            />
            <button className="add-btn" type="submit">
              + Add
            </button>
          </form>

          {addCourseIds.length > 0 && (
            <div className="selected-pills">
              {courses
                .filter((c) => addCourseIds.includes(c._id))
                .map((c) => (
                  <span key={c._id} className="selected-pill">
                    📚 {c.title}
                    <span
                      className="pill-remove"
                      onClick={() => setAddCourseIds(addCourseIds.filter((id) => id !== c._id))}
                    >
                      <XIcon />
                    </span>
                  </span>
                ))}
            </div>
          )}
        </div>

        <div className="section-divider">Sections</div>

        {loading ? (
          <div className="loading-row">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
          </div>
        ) : sections.length === 0 ? (
          <div className="empty-state">
            <strong>No sections found</strong>
            {courseId ? "This course has no sections" : "Add a section to get started"}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext
              items={sections.map((s) => s._id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {sections.map((sec, idx) => (
                  <SectionCard
                    key={sec._id}
                    section={sec}
                    index={idx}
                    total={sections.length}
                    editId={editId}
                    editValue={editValue}
                    editCourseIds={editCourseIds}
                    editCategoryId={editCategoryId}
                    editIsActive={editIsActive}
                    setEditValue={setEditValue}
                    setEditCourseIds={setEditCourseIds}
                    setEditCategoryId={setEditCategoryId}
                    setEditIsActive={setEditIsActive}
                    courses={courses}
                    categories={categories}
                    onEdit={handleEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeSection && (
                <div className="overlay-card">
                  <div><GripIcon /></div>
                  <span className="order-badge">
                    {sections.findIndex((s) => s._id === activeSection._id) + 1}
                  </span>
                  <div className="card-body">
                    <span className="sec-title">{activeSection.title}</span>
                    <div className="course-badges">
                      {(activeSection.courses || []).map((c) => (
                        <span key={c._id} className="sec-course">📚 {c.title}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} />
    </>
  );
};

export default SectionManager;
