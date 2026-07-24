import React, { useEffect, useState } from "react";
import axios from "axios";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]); // nested tree (from /categories/tree)
  const [flatCategories, setFlatCategories] = useState([]); // flat list w/ computed level (from /categories)
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Form states
  const [name, setName] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState("");
  const [showAddSubcategory, setShowAddSubcategory] = useState(null); // Which category to add subcategory to

  const BASE_URL = "http://localhost:5002/api";

  const getToken = () => localStorage.getItem("token");
  const authConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  // --- Helpers -------------------------------------------------------

  // Unwrap common API response shapes: { tree: [...] }, { categories: [...] },
  // { data: [...] }, or a bare array
  const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.tree)) return payload.tree;
    if (Array.isArray(payload?.categories)) return payload.categories;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  // GET /api/categories returns a flat list with only { _id, name, parentId }.
  // We derive `level` ourselves by walking each item's parent chain, so the
  // indentation in dropdowns matches the item's real depth in the tree.
  const computeLevels = (flat) => {
    const byId = {};
    flat.forEach((cat) => {
      byId[cat._id] = cat;
    });

    const levelCache = {};
    const getLevel = (cat, visited = new Set()) => {
      if (levelCache[cat._id] !== undefined) return levelCache[cat._id];
      if (!cat.parentId || !byId[cat.parentId] || visited.has(cat._id)) {
        levelCache[cat._id] = 0;
        return 0;
      }
      visited.add(cat._id);
      const level = 1 + getLevel(byId[cat.parentId], visited);
      levelCache[cat._id] = level;
      return level;
    };

    return flat.map((cat) => ({ ...cat, level: getLevel(cat) }));
  };

  // --- Data fetching ---------------------------------------------------

  // Fetch both the nested tree (for the hierarchy view) and the flat list
  // (for parent-select dropdowns), since the API exposes them separately.
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [treeRes, flatRes] = await Promise.all([
        axios.get(`${BASE_URL}/categories/tree`),
        axios.get(`${BASE_URL}/categories`),
      ]);

      setCategories(unwrapList(treeRes.data));
      setFlatCategories(computeLevels(unwrapList(flatRes.data)));
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // Create category (root or subcategory, depending on parentId)
  const handleAdd = async (e, parentId = null) => {
    e.preventDefault();
    if (!name.trim()) return alert("Category name required");

    try {
      await axios.post(
        `${BASE_URL}/categories`,
        {
          name: name.trim(),
          parentId: parentId || selectedParent || null,
        },
        authConfig()
      );

      setName("");
      setSelectedParent("");
      setShowAddSubcategory(null);
      await fetchCategories();

      // Auto-expand parent if subcategory added
      if (parentId) {
        setExpandedIds((prev) => new Set([...prev, parentId]));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add category");
    }
  };

  // Update category (PUT /api/categories/:id) - name and/or parentId
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return alert("Category name required");

    try {
      await axios.put(
        `${BASE_URL}/categories/${editingId}`,
        {
          name: editName.trim(),
          parentId: editParent || null,
        },
        authConfig()
      );

      setEditingId(null);
      setEditName("");
      setEditParent("");
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  // Delete category (DELETE /api/categories/:id)
  const handleDelete = async (id, categoryName) => {
    if (
      !window.confirm(
        `⚠️ Delete "${categoryName}" and ALL its subcategories?\n\nThis action cannot be undone!`
      )
    )
      return;

    try {
      await axios.delete(`${BASE_URL}/categories/${id}`, authConfig());
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Start editing
  const startEdit = (category) => {
    setEditingId(category._id);
    setEditName(category.name);
    setEditParent(category.parentId || "");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditParent("");
  };

  // Show add subcategory form
  const showSubcategoryForm = (categoryId) => {
    setShowAddSubcategory(showAddSubcategory === categoryId ? null : categoryId);
    setName(""); // Reset name
  };

  // Get category options for parent select
  const getParentOptions = (excludeId = null) => {
    return flatCategories
      .filter((cat) => cat._id !== excludeId) // Don't show self
      .map((cat) => ({
        ...cat,
        displayName: "  ".repeat(cat.level) + "└ " + cat.name,
      }));
  };

  // Render category tree with clear visual hierarchy
  const renderCategoryTree = (category, level = 0) => {
    const isExpanded = expandedIds.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    const isEditing = editingId === category._id;
    const showAddForm = showAddSubcategory === category._id;
    const childCount = category.children?.length || 0;

    return (
      <div key={category._id} style={styles.treeItem}>
        {/* Category Card */}
        <div
          style={{
            ...styles.categoryCard,
            marginLeft: level * 28,
            background: isEditing ? "#f0f7ff" : "white",
            borderLeft: level > 0 ? `3px solid ${getLevelColor(level)}` : "none",
          }}
        >
          <div style={styles.categoryLeft}>
            {/* Expand/Collapse with child count */}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category._id)}
                style={styles.expandBtn}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? "▼" : "▶"}
                <span style={styles.childCount}>{childCount}</span>
              </button>
            )}
            {!hasChildren && <span style={styles.leafIcon}>•</span>}

            {/* Category Name with Level Badge */}
            <span style={styles.categoryName}>
              {category.name}
              <span style={styles.levelBadge}>Level {category.level ?? level}</span>
            </span>

            {/* Child count badge */}
            {hasChildren && (
              <span style={styles.childBadge}>{childCount} subcategories</span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              onClick={() => showSubcategoryForm(category._id)}
              style={styles.addSubBtn}
              title="Add subcategory"
            >
              + Add Sub
            </button>
            <button
              onClick={() => startEdit(category)}
              style={styles.editBtn}
              disabled={isEditing}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(category._id, category.name)}
              style={styles.deleteBtn}
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Add Subcategory Form (inline) */}
        {showAddForm && (
          <div style={{ ...styles.addSubCard, marginLeft: level * 28 + 40 }}>
            <div style={styles.addSubHeader}>
              <span>➕ Add Subcategory to "{category.name}"</span>
              <button onClick={() => setShowAddSubcategory(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={(e) => handleAdd(e, category._id)} style={styles.addSubForm}>
              <input
                type="text"
                placeholder="Enter subcategory name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <button type="submit" style={styles.addBtn}>
                Add Subcategory
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubcategory(null)}
                style={styles.cancelSmallBtn}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Edit Form (inline) */}
        {isEditing && (
          <div style={{ ...styles.editCard, marginLeft: level * 28 + 40 }}>
            <div style={styles.editHeader}>✏️ Editing "{category.name}"</div>
            <form onSubmit={handleUpdate} style={styles.editForm}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={styles.input}
                placeholder="Update category name"
              />
              <select
                value={editParent}
                onChange={(e) => setEditParent(e.target.value)}
                style={styles.select}
              >
                <option value="">📁 Root Category</option>
                {getParentOptions(category._id).map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.displayName}
                  </option>
                ))}
              </select>
              <div style={styles.editActions}>
                <button type="submit" style={styles.updateBtn}>
                  💾 Update
                </button>
                <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Children Container */}
        {hasChildren && isExpanded && (
          <div style={styles.childrenContainer}>
            {category.children.map((child) => renderCategoryTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Helper function for level colors
  const getLevelColor = (level) => {
    const colors = ["#4a6cf7", "#38a169", "#d69e2e", "#e53e3e", "#805ad5", "#dd6b20"];
    return colors[level % colors.length];
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header with Instructions */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Category Manager</h2>
          </div>
          <div style={styles.headerStats}>
            <span style={styles.badge}>📁 {flatCategories.length} total</span>
            <span style={styles.badge}>📊 {categories.length} root</span>
          </div>
        </div>

        {/* Add Root Category Form */}
        <div style={styles.addRootSection}>
          <h4 style={styles.sectionTitle}>Add Root Category</h4>
          <form onSubmit={(e) => handleAdd(e, null)} style={styles.form}>
            <input
              type="text"
              placeholder="Enter root category name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.addBtn}>
              ➕ Add Root Category
            </button>
          </form>
        </div>

        {/* Or Add with Parent Dropdown */}
        <div style={styles.addWithParentSection}>
          <h4 style={styles.sectionTitle}>Add Category with Parent</h4>
          <form onSubmit={(e) => handleAdd(e, null)} style={styles.form}>
            <input
              type="text"
              placeholder="Enter category name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              style={styles.select}
            >
              <option value="">📁 Select Parent (Root)</option>
              {getParentOptions().map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.displayName}
                </option>
              ))}
            </select>
            <button type="submit" style={styles.addBtn}>
              ➕ Add Category
            </button>
          </form>
        </div>

        {loading && <p style={styles.loading}>⏳ Loading categories...</p>}

        {/* Legend */}
        <div style={styles.legend}>
          <span>🔵 Level indicators:</span>
          {[0, 1, 2, 3].map((level) => (
            <span
              key={level}
              style={{
                display: "inline-block",
                padding: "2px 10px",
                margin: "0 4px",
                borderLeft: `3px solid ${getLevelColor(level)}`,
                background: "#f7fafc",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              L{level}
            </span>
          ))}
        </div>

        {/* Category Tree */}
        <div style={styles.treeContainer}>
          <div style={styles.treeHeader}>
            <span>📋 Category Hierarchy</span>
            <span style={styles.treeHint}>Click ▶ to expand subcategories</span>
          </div>

          {categories.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📭</div>
              <p>No categories found</p>
              <p style={styles.emptySub}>Start by adding a root category above</p>
            </div>
          ) : (
            categories.map((cat) => renderCategoryTree(cat))
          )}
        </div>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "24px",
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f0f2f5",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a2332",
    margin: 0,
  },
  headerStats: {
    display: "flex",
    gap: "8px",
  },
  badge: {
    fontSize: "13px",
    background: "#e8edf4",
    color: "#2c3e50",
    padding: "6px 16px",
    borderRadius: "20px",
    fontWeight: "600",
  },
  addRootSection: {
    background: "#f8fafc",
    padding: "16px 20px",
    borderRadius: "10px",
    marginBottom: "16px",
    border: "1px solid #e8edf4",
  },
  addWithParentSection: {
    background: "#f8fafc",
    padding: "16px 20px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #e8edf4",
  },
  sectionTitle: {
    fontSize: "14px",
    color: "#2c3e50",
    margin: "0 0 12px 0",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  input: {
    flex: "1",
    minWidth: "150px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "#ffffff",
  },
  select: {
    minWidth: "200px",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
  addBtn: {
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    background: "#4a6cf7",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  treeContainer: {
    marginTop: "16px",
    border: "1px solid #e8edf4",
    borderRadius: "10px",
    overflow: "hidden",
  },
  treeHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e8edf4",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  treeHint: {
    fontWeight: "400",
    color: "#6c7a8d",
    fontSize: "12px",
  },
  treeItem: {
    borderBottom: "1px solid #f0f2f5",
  },
  categoryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    transition: "all 0.15s",
    cursor: "default",
    position: "relative",
  },
  categoryLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    flexWrap: "wrap",
  },
  expandBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    cursor: "pointer",
    color: "#4a6cf7",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  childCount: {
    fontSize: "10px",
    color: "#6c7a8d",
    background: "#e8edf4",
    padding: "1px 6px",
    borderRadius: "10px",
    fontWeight: "600",
  },
  leafIcon: {
    color: "#b0bec5",
    fontSize: "16px",
    padding: "0 6px",
  },
  categoryName: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#1a2332",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  levelBadge: {
    fontSize: "10px",
    background: "#e8edf4",
    color: "#5a6a7a",
    padding: "2px 10px",
    borderRadius: "12px",
    fontWeight: "600",
  },
  childBadge: {
    fontSize: "11px",
    background: "#ebf4ff",
    color: "#4a6cf7",
    padding: "2px 12px",
    borderRadius: "12px",
    fontWeight: "500",
  },
  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  addSubBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #c6f6d5",
    background: "#f0fff4",
    color: "#38a169",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  editBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #bee3f8",
    background: "#ebf8ff",
    color: "#3182ce",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deleteBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #fed7d7",
    background: "#fff5f5",
    color: "#e53e3e",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  childrenContainer: {
    paddingLeft: "0",
  },
  addSubCard: {
    background: "#f0fff4",
    padding: "16px 20px",
    borderTop: "1px solid #c6f6d5",
    borderLeft: "3px solid #38a169",
  },
  addSubHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  closeBtn: {
    padding: "2px 8px",
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
    color: "#a0aec0",
  },
  addSubForm: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  cancelSmallBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#6c7a8d",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  editCard: {
    background: "#ebf8ff",
    padding: "16px 20px",
    borderTop: "1px solid #bee3f8",
    borderLeft: "3px solid #3182ce",
  },
  editHeader: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "12px",
  },
  editForm: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  editActions: {
    display: "flex",
    gap: "8px",
  },
  updateBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#38a169",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cancelBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#6c7a8d",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6c7a8d",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#a0aec0",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  emptySub: {
    fontSize: "13px",
    color: "#cbd5e0",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#2c3e50",
    flexWrap: "wrap",
  },
};

// Hover Effects
if (typeof document !== "undefined" && !document.getElementById("category-manager-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "category-manager-styles";
  styleSheet.textContent = `
    input:focus, select:focus {
      border-color: #4a6cf7 !important;
      box-shadow: 0 0 0 3px rgba(74,108,247,0.1) !important;
    }
    .addBtn:hover { background: #3a5cd5 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74,108,247,0.3); }
    .updateBtn:hover { background: #2f855a !important; transform: translateY(-1px); }
    .cancelBtn:hover { background: #f7fafc !important; }
    .addSubBtn:hover { background: #c6f6d5 !important; border-color: #38a169 !important; }
    .editBtn:hover { background: #bee3f8 !important; border-color: #3182ce !important; }
    .deleteBtn:hover { background: #fed7d7 !important; border-color: #e53e3e !important; }
    .categoryCard:hover { background: #f7fafc; }
    .expandBtn:hover { background: #ebf4ff; }
    .closeBtn:hover { color: #e53e3e !important; }

    @media (max-width: 768px) {
      .page { padding: 12px !important; }
      .container { padding: 16px !important; }
      .form { flex-direction: column; }
      .input, .select, .addBtn { width: 100%; }
      .categoryCard { flex-direction: column !important; align-items: flex-start !important; gap: 8px; }
      .categoryLeft { width: 100%; }
      .actions { width: 100%; justify-content: flex-start; }
      .actions button { flex: 1; text-align: center; font-size: 11px !important; padding: 6px 10px !important; }
      .editForm, .addSubForm { flex-direction: column; }
      .editActions { width: 100%; }
      .updateBtn, .cancelBtn, .cancelSmallBtn { flex: 1; text-align: center; }
      .header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
      .headerStats { width: 100%; }
      .categoryName { font-size: 13px !important; }
      .legend { font-size: 12px !important; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default CategoryManager;
