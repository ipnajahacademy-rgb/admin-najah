import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_URL = 'https://najah-1.onrender.com/api';

// ==================== AUTH HELPERS ====================
const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No token found in localStorage');
    return null;
  }
  return token;
};

const authHeaders = () => {
  const token = getToken();
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

// ==================== AXIOS INSTANCE ====================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔴 401 Unauthorized - Please login again');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== MAIN COMPONENT ====================
const CreateCourse = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    about: '',
    category: '',
    subcategory: '',
    level: '',
    instituteName: '',
    duration: '',
    emi: '',
    admissionDeadline: '',
    rating: '',
    totalRatings: '',
    totalStudents: '',
    isPublished: false,
  });

  const [highlights, setHighlights] = useState([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [steps, setSteps] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [files, setFiles] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [topicFiles, setTopicFiles] = useState({});

  const highlightInputRef = useRef();

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (form.category) {
      const category = categories.find(c => c._id === form.category);
      if (category && category.children) {
        setSubcategories(category.children);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  }, [form.category, categories]);

  // Unwrap common API response shapes so this keeps working regardless of
  // whether the backend wraps the list as { tree }, { categories }, { data },
  // or a bare array.
  const unwrapCategoryList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.tree)) return payload.tree;
    if (Array.isArray(payload?.categories)) return payload.categories;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchCategories = async () => {
    try {
      // /categories/tree returns the NESTED tree (each node has a .children
      // array) which is what the subcategory dropdown depends on below.
      // The flat /categories endpoint doesn't include .children, so the
      // subcategory select never populated when this hit that endpoint.
      const res = await api.get('/categories/tree');
      setCategories(unwrapCategoryList(res.data));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/course');
      setCourses(res.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORM HANDLERS ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setForm(prev => ({
      ...prev,
      category: categoryId,
      subcategory: ''
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = e.target.name;
    setFiles(prev => ({ ...prev, [name]: file }));
    setFileNames(prev => ({ ...prev, [name]: file.name }));
  };

  const handleTopicFileChange = (stepIndex, topicIndex, file) => {
    if (!file) return;
    const key = `${stepIndex}-${topicIndex}`;
    setTopicFiles(prev => ({ ...prev, [key]: file }));

    const updatedSteps = [...steps];
    updatedSteps[stepIndex].topics[topicIndex].videoFile = file;
    setSteps(updatedSteps);
  };

  // ==================== HIGHLIGHTS ====================
  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights(prev => [...prev, newHighlight.trim()]);
    setNewHighlight('');
    highlightInputRef.current?.focus();
  };

  const removeHighlight = (index) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  // ==================== STEPS/MODULES ====================
  const addStep = () => {
    setSteps(prev => [...prev, {
      title: '',
      duration: '',
      isSpecialization: false,
      topics: []
    }]);
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const removeStep = (index) => {
    if (!window.confirm('Remove this module?')) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  // ==================== TOPICS ====================
  const addTopic = (stepIndex) => {
    const updated = [...steps];
    updated[stepIndex].topics.push({
      title: '',
      description: '',
      isPreview: false,
      isLive: false,
      meetDateTime: '',
      meetDuration: '60',
      videoFile: null,
      video: '',
      meetLink: '',
      meetingId: ''
    });
    setSteps(updated);
  };

  const updateTopic = (stepIndex, topicIndex, field, value) => {
    const updated = [...steps];
    updated[stepIndex].topics[topicIndex][field] = value;
    setSteps(updated);
  };

  const removeTopic = (stepIndex, topicIndex) => {
    if (!window.confirm('Remove this topic?')) return;
    const updated = [...steps];
    updated[stepIndex].topics = updated[stepIndex].topics.filter((_, i) => i !== topicIndex);
    setSteps(updated);
  };

  // ==================== FAQS ====================
  const addFaq = () => {
    setFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateFaq = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const removeFaq = (index) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  // ==================== NAVIGATION ====================
  const nextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title) {
      alert('Title is required');
      setActiveTab(0);
      return;
    }
    if (!form.category) {
      alert('Category is required');
      setActiveTab(0);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    Object.keys(form).forEach(key => {
      if (form[key] !== '' && form[key] !== undefined && form[key] !== null) {
        if (key === 'isPublished') {
          formData.append(key, form[key] ? 'true' : 'false');
        } else {
          formData.append(key, form[key]);
        }
      }
    });

    formData.append('highlights', JSON.stringify(highlights));
    formData.append('faqs', JSON.stringify(faqs));

    const processedSteps = steps.map(step => ({
      title: step.title,
      duration: step.duration || '',
      isSpecialization: step.isSpecialization || false,
      topics: step.topics.map(topic => ({
        title: topic.title,
        description: topic.description || '',
        isPreview: topic.isPreview || false,
        isLive: topic.isLive || false,
        meetDateTime: topic.meetDateTime || '',
        meetDuration: topic.meetDuration || '60',
        video: topic.video || '',
        meetLink: topic.meetLink || '',
        meetingId: topic.meetingId || ''
      }))
    }));
    formData.append('steps', JSON.stringify(processedSteps));

    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });

    steps.forEach((step, stepIndex) => {
      step.topics.forEach((topic, topicIndex) => {
        if (topic.videoFile) {
          formData.append('topicVideos', topic.videoFile);
        }
      });
    });

    try {
      const config = {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      };

      let response;
      if (editId) {
        response = await api.put(`/admin/course/${editId}`, formData, config);
      } else {
        response = await api.post('/admin/course', formData, config);
      }

      if (response.data.success) {
        closeModal();
        fetchCourses();
        alert(editId ? '✅ Course updated successfully!' : '✅ Course created successfully!');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      if (error.response?.status === 401) {
        alert('❌ Please login again as admin');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.message || '❌ Failed to save course');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== MODAL CONTROLS ====================
  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditId(course._id);
    setForm({
      title: course.title || '',
      subtitle: course.subtitle || '',
      description: course.description || '',
      about: course.about || '',
      category: course.category?._id || '',
      subcategory: course.subcategory?._id || '',
      level: course.level || '',
      instituteName: course.instituteName || '',
      duration: course.duration || '',
      emi: course.emi || '',
      admissionDeadline: course.admissionDeadline ? course.admissionDeadline.split('T')[0] : '',
      rating: course.rating || '',
      totalRatings: course.totalRatings || '',
      totalStudents: course.totalStudents || '',
      isPublished: course.isPublished || false,
    });
    setHighlights(course.highlights || []);
    setSteps(course.steps || []);
    setFaqs(course.faqs || []);
    setFiles({});
    setFileNames({});
    setTopicFiles({});
    setModalOpen(true);
    setActiveTab(0);
  };

  const resetForm = () => {
    setForm({
      title: '',
      subtitle: '',
      description: '',
      about: '',
      category: '',
      subcategory: '',
      level: '',
      instituteName: '',
      duration: '',
      emi: '',
      admissionDeadline: '',
      rating: '',
      totalRatings: '',
      totalStudents: '',
      isPublished: false,
    });
    setHighlights([]);
    setSteps([]);
    setFaqs([]);
    setFiles({});
    setFileNames({});
    setTopicFiles({});
    setEditId(null);
    setActiveTab(0);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalOpen(false);
    resetForm();
  };

  // ==================== DELETE ====================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? This action cannot be undone!')) return;
    try {
      await api.delete(`/admin/course/${id}`, { headers: authHeaders() });
      fetchCourses();
      alert('✅ Course deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status === 401) {
        alert('❌ Please login again as admin');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('❌ Failed to delete course');
      }
    }
  };

  // ==================== HELPERS ====================
  const filteredCourses = courses.filter(course => {
    const searchMatch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
      course.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
      course.subtitle?.toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  const getCategoryDisplay = (category, level = 0) => {
    if (!category) return '';
    const indent = '  '.repeat(level);
    const icon = level === 0 ? '📁' : '📂';
    return `${indent}${icon} ${category.name}`;
  };

  const tabs = ['📝 Basic Info', '🖼️ Media', '📊 Details', '📚 Syllabus', '❓ FAQs'];

  // ==================== RENDER ====================
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📚 Course Manager</h1>
          <p style={styles.subtitle}>Manage courses with categories, subcategories & videos</p>
        </div>
        <button style={styles.createBtn} onClick={openCreate}>
          <span style={{ fontSize: 20, marginRight: 8 }}>+</span> Create Course
        </button>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{courses.length}</span>
          <span style={styles.statLabel}>Total Courses</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{courses.filter(c => c.isPublished).length}</span>
          <span style={styles.statLabel}>Published</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{courses.filter(c => !c.isPublished).length}</span>
          <span style={styles.statLabel}>Drafts</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{categories.length}</span>
          <span style={styles.statLabel}>Categories</span>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Search courses by title, category, or subtitle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Course List */}
      <div style={styles.courseList}>
        {loading ? (
          <div style={styles.loading}>Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p>No courses found</p>
            <p style={styles.emptySub}>Click "Create Course" to add your first course</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div key={course._id} style={styles.courseCard}>
              <div style={styles.courseInfo}>
                <div style={styles.thumbnail}>
                  {course.thumbnail?.url ? (
                    <img src={course.thumbnail.url} alt={course.title} style={styles.thumbnailImg} />
                  ) : (
                    <span style={styles.thumbnailPlaceholder}>📷</span>
                  )}
                </div>
                <div style={styles.courseDetails}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  {course.subtitle && <p style={styles.courseSubtitle}>{course.subtitle}</p>}
                  <div style={styles.courseMeta}>
                    <span style={styles.metaItem}>
                      📁 {course.category?.name || 'No Category'}
                      {course.subcategory && ` → ${course.subcategory.name}`}
                    </span>
                    <span style={styles.metaItem}>📚 {course.steps?.length || 0} Modules</span>
                    <span style={styles.metaItem}>🎬 {course.steps?.reduce((acc, s) => acc + (s.topics?.length || 0), 0) || 0} Topics</span>
                    <span style={styles.metaItem}>⭐ {course.rating || 0}</span>
                  </div>
                  <div style={styles.tags}>
                    {course.level && <span style={styles.tag}>{course.level}</span>}
                    {course.isPublished ? (
                      <span style={styles.publishedTag}>Published</span>
                    ) : (
                      <span style={styles.draftTag}>Draft</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.courseActions}>
                <button style={styles.editBtn} onClick={() => openEdit(course)}>
                  ✎ Edit
                </button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(course._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && !isSubmitting && closeModal()}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? '✎ Edit Course' : '✦ Create New Course'}</h2>
              <button style={styles.closeBtn} onClick={closeModal} disabled={isSubmitting}>×</button>
            </div>

            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${((activeTab + 1) / tabs.length) * 100}%`
              }} />
            </div>

            <div style={styles.tabs}>
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.tab,
                    ...(activeTab === index ? styles.activeTab : {}),
                    ...(index < activeTab ? styles.completedTab : {})
                  }}
                  onClick={() => setActiveTab(index)}
                >
                  {index < activeTab ? '✓ ' : ''}{tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={styles.modalBody}>
              {/* Tab 0: Basic Info */}
              {activeTab === 0 && (
                <div style={styles.tabContent}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Course Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Full Stack Web Development"
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Subtitle</label>
                    <input
                      type="text"
                      name="subtitle"
                      value={form.subtitle}
                      onChange={handleChange}
                      placeholder="Short tagline for the course"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Category *</label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleCategoryChange}
                        style={styles.select}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {getCategoryDisplay(cat, 0)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subcategory</label>
                      <select
                        name="subcategory"
                        value={form.subcategory}
                        onChange={handleChange}
                        style={styles.select}
                        disabled={!subcategories.length}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map(sub => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      {subcategories.length === 0 && form.category && (
                        <span style={styles.hint}>No subcategories available</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Level</label>
                      <select
                        name="level"
                        value={form.level}
                        onChange={handleChange}
                        style={styles.select}
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Duration</label>
                      <input
                        type="text"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        placeholder="e.g. 6 months"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Detailed course description..."
                      style={styles.textarea}
                      rows="3"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>About / Learning Outcomes</label>
                    <textarea
                      name="about"
                      value={form.about}
                      onChange={handleChange}
                      placeholder="What will students learn?"
                      style={styles.textarea}
                      rows="3"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Highlights</label>
                    <div style={styles.highlightsContainer}>
                      <div style={styles.highlightInput}>
                        <input
                          ref={highlightInputRef}
                          type="text"
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          placeholder="Add a highlight point"
                          style={styles.input}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                        />
                        <button type="button" style={styles.addBtn} onClick={addHighlight}>Add</button>
                      </div>
                      <div style={styles.highlightsList}>
                        {highlights.map((h, i) => (
                          <span key={i} style={styles.highlightTag}>
                            {h}
                            <button type="button" style={styles.removeBtn} onClick={() => removeHighlight(i)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Media */}
              {activeTab === 1 && (
                <div style={styles.tabContent}>
                  <div style={styles.mediaGrid}>
                    <div style={styles.fileGroup}>
                      <label style={styles.label}>Thumbnail</label>
                      <input
                        type="file"
                        name="thumbnail"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                      />
                      {fileNames.thumbnail && <span style={styles.fileName}>✅ {fileNames.thumbnail}</span>}
                    </div>

                    <div style={styles.fileGroup}>
                      <label style={styles.label}>Banner Image</label>
                      <input
                        type="file"
                        name="bannerImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                      />
                      {fileNames.bannerImage && <span style={styles.fileName}>✅ {fileNames.bannerImage}</span>}
                    </div>

                    <div style={styles.fileGroup}>
                      <label style={styles.label}>Course Video</label>
                      <input
                        type="file"
                        name="video"
                        accept="video/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                      />
                      {fileNames.video && <span style={styles.fileName}>✅ {fileNames.video}</span>}
                    </div>

                    <div style={styles.fileGroup}>
                      <label style={styles.label}>Institute Logo</label>
                      <input
                        type="file"
                        name="instituteLogo"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                      />
                      {fileNames.instituteLogo && <span style={styles.fileName}>✅ {fileNames.instituteLogo}</span>}
                    </div>

                    <div style={styles.fileGroup}>
                      <label style={styles.label}>Certificate Sample</label>
                      <input
                        type="file"
                        name="certificateSampleImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                      />
                      {fileNames.certificateSampleImage && <span style={styles.fileName}>✅ {fileNames.certificateSampleImage}</span>}
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Institute Name</label>
                    <input
                      type="text"
                      name="instituteName"
                      value={form.instituteName}
                      onChange={handleChange}
                      placeholder="e.g. IIT Delhi"
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Details */}
              {activeTab === 2 && (
                <div style={styles.tabContent}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>EMI</label>
                      <input
                        type="text"
                        name="emi"
                        value={form.emi}
                        onChange={handleChange}
                        placeholder="e.g. ₹999/month"
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Admission Deadline</label>
                      <input
                        type="date"
                        name="admissionDeadline"
                        value={form.admissionDeadline}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Rating (0-5)</label>
                      <input
                        type="number"
                        name="rating"
                        value={form.rating}
                        onChange={handleChange}
                        placeholder="4.5"
                        step="0.1"
                        min="0"
                        max="5"
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Students</label>
                      <input
                        type="number"
                        name="totalStudents"
                        value={form.totalStudents}
                        onChange={handleChange}
                        placeholder="1000"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Ratings</label>
                      <input
                        type="number"
                        name="totalRatings"
                        value={form.totalRatings}
                        onChange={handleChange}
                        placeholder="500"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                      />
                      Publish Course
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: Syllabus */}
              {activeTab === 3 && (
                <div style={styles.tabContent}>
                  <button type="button" style={styles.addModuleBtn} onClick={addStep}>
                    + Add Module
                  </button>

                  {steps.length === 0 && (
                    <p style={styles.emptyModules}>No modules added yet. Click "Add Module" to start building your syllabus.</p>
                  )}

                  {steps.map((step, stepIndex) => (
                    <div key={stepIndex} style={styles.moduleCard}>
                      <div style={styles.moduleHeader}>
                        <div style={styles.moduleTitle}>
                          <span style={styles.moduleNumber}>Module {stepIndex + 1}</span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                            placeholder="Module title"
                            style={styles.moduleInput}
                          />
                          <input
                            type="text"
                            value={step.duration}
                            onChange={(e) => updateStep(stepIndex, 'duration', e.target.value)}
                            placeholder="Duration"
                            style={styles.moduleDuration}
                          />
                          <label style={styles.specializationLabel}>
                            <input
                              type="checkbox"
                              checked={step.isSpecialization}
                              onChange={(e) => updateStep(stepIndex, 'isSpecialization', e.target.checked)}
                            />
                            Specialization
                          </label>
                        </div>
                        <div style={styles.moduleActions}>
                          <button type="button" style={styles.addTopicBtn} onClick={() => addTopic(stepIndex)}>
                            + Topic
                          </button>
                          <button type="button" style={styles.removeModuleBtn} onClick={() => removeStep(stepIndex)}>
                            Remove
                          </button>
                        </div>
                      </div>

                      <div style={styles.topicsContainer}>
                        {step.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} style={styles.topicCard}>
                            <div style={styles.topicHeader}>
                              <input
                                type="text"
                                value={topic.title}
                                onChange={(e) => updateTopic(stepIndex, topicIndex, 'title', e.target.value)}
                                placeholder="Topic title"
                                style={styles.topicInput}
                              />
                              <div style={styles.topicActions}>
                                <label style={styles.checkboxLabelSmall}>
                                  <input
                                    type="checkbox"
                                    checked={topic.isPreview}
                                    onChange={(e) => updateTopic(stepIndex, topicIndex, 'isPreview', e.target.checked)}
                                  />
                                  Preview
                                </label>
                                <label style={styles.checkboxLabelSmall}>
                                  <input
                                    type="checkbox"
                                    checked={topic.isLive}
                                    onChange={(e) => updateTopic(stepIndex, topicIndex, 'isLive', e.target.checked)}
                                  />
                                  Live Class
                                </label>
                                <button type="button" style={styles.removeTopicBtn} onClick={() => removeTopic(stepIndex, topicIndex)}>
                                  ×
                                </button>
                              </div>
                            </div>

                            <textarea
                              value={topic.description}
                              onChange={(e) => updateTopic(stepIndex, topicIndex, 'description', e.target.value)}
                              placeholder="Topic description"
                              style={styles.topicTextarea}
                              rows="2"
                            />

                            {topic.isLive && (
                              <div style={styles.meetFields}>
                                <input
                                  type="datetime-local"
                                  value={topic.meetDateTime}
                                  onChange={(e) => updateTopic(stepIndex, topicIndex, 'meetDateTime', e.target.value)}
                                  style={styles.meetInput}
                                />
                                <input
                                  type="number"
                                  value={topic.meetDuration}
                                  onChange={(e) => updateTopic(stepIndex, topicIndex, 'meetDuration', e.target.value)}
                                  placeholder="Duration (min)"
                                  style={styles.meetDurationInput}
                                />
                                {topic.meetLink && (
                                  <a href={topic.meetLink} target="_blank" rel="noopener noreferrer" style={styles.meetLink}>
                                    🔗 Google Meet Link Generated
                                  </a>
                                )}
                                {!topic.meetLink && topic.meetDateTime && (
                                  <span style={styles.meetPending}>⏳ Meet link will be generated on save</span>
                                )}
                              </div>
                            )}

                            <div style={styles.topicVideo}>
                              <label style={styles.videoLabel}>
                                🎬 Upload Topic Video
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleTopicFileChange(stepIndex, topicIndex, e.target.files[0])}
                                  style={styles.videoInput}
                                />
                              </label>
                              {topic.video && <span style={styles.videoUploaded}>✅ Video uploaded: {topic.video}</span>}
                              {topic.videoFile && <span style={styles.videoUploaded}>✅ File selected: {topic.videoFile.name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: FAQs */}
              {activeTab === 4 && (
                <div style={styles.tabContent}>
                  <button type="button" style={styles.addFaqBtn} onClick={addFaq}>
                    + Add FAQ
                  </button>

                  {faqs.length === 0 && (
                    <p style={styles.emptyFaqs}>No FAQs added yet.</p>
                  )}

                  {faqs.map((faq, index) => (
                    <div key={index} style={styles.faqCard}>
                      <div style={styles.faqRow}>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaq(index, 'question', e.target.value)}
                          placeholder="Question"
                          style={styles.faqInput}
                        />
                        <input
                          type="text"
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                          placeholder="Answer"
                          style={styles.faqInput}
                        />
                        <button type="button" style={styles.removeFaqBtn} onClick={() => removeFaq(index)}>
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <div style={styles.navButtons}>
                  {activeTab > 0 && (
                    <button type="button" style={styles.prevBtn} onClick={prevTab}>
                      ← Previous
                    </button>
                  )}
                  {activeTab < tabs.length - 1 ? (
                    <button type="button" style={styles.nextBtn} onClick={nextTab}>
                      Next →
                    </button>
                  ) : (
                    <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting ? '⏳ Saving...' : editId ? '💾 Update Course' : '✨ Create Course'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a2332',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c7a8d',
    margin: '4px 0 0',
  },
  createBtn: {
    padding: '12px 28px',
    background: '#4a6cf7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: 12,
    border: '1px solid #e8edf4',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a2332',
    display: 'block',
  },
  statLabel: {
    fontSize: 13,
    color: '#6c7a8d',
    marginTop: 4,
  },
  searchBar: {
    marginBottom: 24,
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e8edf4',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
    background: '#fff',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  courseCard: {
    background: '#fff',
    border: '1px solid #e8edf4',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  courseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  thumbnail: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    background: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    fontSize: 24,
  },
  courseDetails: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a2332',
    margin: 0,
  },
  courseSubtitle: {
    fontSize: 13,
    color: '#6c7a8d',
    margin: '2px 0 6px',
  },
  courseMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    fontSize: 12,
    color: '#6c7a8d',
  },
  tags: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 11,
    padding: '2px 10px',
    borderRadius: 12,
    background: '#f0f2f5',
    color: '#4a5a6a',
  },
  publishedTag: {
    fontSize: 11,
    padding: '2px 10px',
    borderRadius: 12,
    background: '#d4edda',
    color: '#155724',
  },
  draftTag: {
    fontSize: 11,
    padding: '2px 10px',
    borderRadius: 12,
    background: '#f8d7da',
    color: '#721c24',
  },
  courseActions: {
    display: 'flex',
    gap: 8,
  },
  editBtn: {
    padding: '6px 16px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    background: '#fff',
    color: '#4a6cf7',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteBtn: {
    padding: '6px 16px',
    border: '1px solid #fde8e8',
    borderRadius: 6,
    background: '#fff',
    color: '#e53e3e',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#6c7a8d',
  },
  emptyState: {
    textAlign: 'center',
    padding: 60,
    color: '#a0aec0',
  },
  emptyIcon: {
    fontSize: 48,
    display: 'block',
    marginBottom: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#cbd5e0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px',
    overflow: 'auto',
    zIndex: 999,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    maxWidth: 900,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '2px solid #f0f2f5',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a2332',
    margin: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    border: 'none',
    background: '#f0f2f5',
    borderRadius: '50%',
    fontSize: 24,
    cursor: 'pointer',
    color: '#6c7a8d',
    transition: 'all 0.2s',
  },
  progressBar: {
    height: 4,
    background: '#e8edf4',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    background: '#4a6cf7',
    transition: 'width 0.5s ease',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    padding: '0 24px',
    borderBottom: '2px solid #f0f2f5',
    background: '#fafbfc',
    overflowX: 'auto',
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    color: '#6c7a8d',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    marginBottom: -2,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    color: '#4a6cf7',
    borderBottomColor: '#4a6cf7',
  },
  completedTab: {
    color: '#10b981',
  },
  modalBody: {
    padding: '24px',
    overflow: 'auto',
    flex: 1,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1a2332',
  },
  input: {
    padding: '10px 14px',
    border: '2px solid #e8edf4',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
    background: '#fff',
  },
  select: {
    padding: '10px 14px',
    border: '2px solid #e8edf4',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 14px',
    border: '2px solid #e8edf4',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    background: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#a0aec0',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a2332',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  checkboxLabelSmall: {
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    color: '#4a5a6a',
  },
  highlightsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  highlightInput: {
    display: 'flex',
    gap: 8,
  },
  addBtn: {
    padding: '10px 20px',
    background: '#4a6cf7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  highlightsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    background: '#f0f4ff',
    color: '#4a6cf7',
    borderRadius: 12,
    fontSize: 13,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    cursor: 'pointer',
    fontSize: 16,
    padding: '0 2px',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  fileGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fileInput: {
    padding: '10px',
    border: '2px dashed #e8edf4',
    borderRadius: 8,
    cursor: 'pointer',
  },
  fileName: {
    fontSize: 12,
    color: '#10b981',
  },
  addModuleBtn: {
    padding: '12px 24px',
    background: '#4a6cf7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    width: 'fit-content',
  },
  emptyModules: {
    color: '#a0aec0',
    textAlign: 'center',
    padding: 20,
  },
  moduleCard: {
    border: '2px solid #e8edf4',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fafbfc',
  },
  moduleHeader: {
    padding: '16px',
    background: '#fff',
    borderBottom: '1px solid #e8edf4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  moduleNumber: {
    fontSize: 13,
    fontWeight: 700,
    color: '#4a6cf7',
  },
  moduleInput: {
    padding: '6px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 14,
    flex: 1,
    minWidth: 120,
  },
  moduleDuration: {
    padding: '6px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 13,
    width: 80,
  },
  specializationLabel: {
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  moduleActions: {
    display: 'flex',
    gap: 6,
  },
  addTopicBtn: {
    padding: '6px 14px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  removeModuleBtn: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#e53e3e',
    border: '1px solid #fde8e8',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  topicsContainer: {
    padding: '12px 16px',
  },
  topicCard: {
    background: '#fff',
    border: '1px solid #e8edf4',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 8,
  },
  topicHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  topicInput: {
    padding: '6px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 14,
    flex: 1,
    minWidth: 120,
  },
  topicActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  topicTextarea: {
    padding: '8px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 13,
    width: '100%',
    marginTop: 8,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  removeTopicBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 4px',
  },
  meetFields: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  meetInput: {
    padding: '6px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 13,
  },
  meetDurationInput: {
    padding: '6px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 13,
    width: 100,
  },
  meetLink: {
    color: '#10b981',
    fontSize: 13,
    textDecoration: 'none',
    padding: '4px 12px',
    background: '#d4edda',
    borderRadius: 6,
    fontWeight: 600,
  },
  meetPending: {
    fontSize: 12,
    color: '#f59e0b',
  },
  topicVideo: {
    marginTop: 8,
  },
  videoLabel: {
    fontSize: 12,
    color: '#4a6cf7',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  videoInput: {
    display: 'none',
  },
  videoUploaded: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 8,
  },
  addFaqBtn: {
    padding: '10px 20px',
    background: '#4a6cf7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    width: 'fit-content',
  },
  emptyFaqs: {
    color: '#a0aec0',
    textAlign: 'center',
    padding: 20,
  },
  faqCard: {
    background: '#fafbfc',
    border: '1px solid #e8edf4',
    borderRadius: 8,
    padding: '12px 16px',
  },
  faqRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  faqInput: {
    padding: '8px 12px',
    border: '1px solid #e8edf4',
    borderRadius: 6,
    fontSize: 13,
    flex: 1,
    minWidth: 120,
  },
  removeFaqBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 8px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '2px solid #f0f2f5',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButtons: {
    display: 'flex',
    gap: 12,
  },
  cancelBtn: {
    padding: '10px 24px',
    background: 'transparent',
    border: '2px solid #e8edf4',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#6c7a8d',
  },
  prevBtn: {
    padding: '10px 24px',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#1a2332',
  },
  nextBtn: {
    padding: '10px 28px',
    background: '#4a6cf7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitBtn: {
    padding: '10px 28px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default CreateCourse;
