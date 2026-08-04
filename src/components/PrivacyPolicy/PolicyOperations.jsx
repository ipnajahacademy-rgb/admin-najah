import React, { useEffect, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";

const POLICY_TABS = [
  { type: "terms-and-conditions", label: "Terms & Conditions" },
  { type: "privacy-policy", label: "Privacy Policy" },
  { type: "refund-policy", label: "Refund Policy" },
];

export default function PolicyOperations() {
  const [activeType, setActiveType] = useState(POLICY_TABS[0].type);
  const [policies, setPolicies] = useState({}); // { [type]: { title, content, isPublished, updatedAt } }
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH ALL POLICIES ----------------

  const fetchPolicies = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/policies`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        const list = data.data || [];
        const map = {};
        list.forEach((p) => {
          map[p.type] = p;
        });
        setPolicies(map);
      } else {
        setError(data.message || "Failed to load policies");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Load the active tab's data into the form whenever it changes
  useEffect(() => {
    const existing = policies[activeType];
    const fallbackTitle =
      POLICY_TABS.find((t) => t.type === activeType)?.label || "";

    setTitle(existing?.title || fallbackTitle);
    setContent(existing?.content || "");
    setIsPublished(existing?.isPublished !== false);
    setSaveMessage("");
  }, [activeType, policies]);

  // ---------------- SAVE ----------------

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaveMessage("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/policies/${activeType}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isPublished,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setPolicies((prev) => ({ ...prev, [activeType]: data.data }));
        setSaveMessage("Saved successfully");
      } else {
        setError(data.message || "Failed to save policy");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const activeTab = POLICY_TABS.find((t) => t.type === activeType);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lastUpdated = policies[activeType]?.updatedAt
    ? new Date(policies[activeType].updatedAt).toLocaleString()
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Policy Pages</h1>
        <p className="text-gray-600">
          Manage Terms & Conditions, Privacy Policy, and Refund Policy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {POLICY_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveType(tab.type)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeType === tab.type
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {policies[tab.type] && (
              <span
                className={`ml-2 inline-block w-1.5 h-1.5 rounded-full align-middle ${
                  policies[tab.type].isPublished ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {saveMessage}
        </div>
      )}

      {/* Editor */}
      {isLoading ? (
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800">{activeTab.label}</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Last updated: {lastUpdated}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={activeTab.label}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-600">
                Content
              </label>
              <span className="text-xs text-gray-400">{wordCount} words</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              placeholder={`Write the ${activeTab.label.toLowerCase()} content here...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Supports plain text or HTML, depending on how your public site renders it.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            Published (visible on the public site)
          </label>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                const existing = policies[activeType];
                setTitle(existing?.title || activeTab.label);
                setContent(existing?.content || "");
                setIsPublished(existing?.isPublished !== false);
                setSaveMessage("");
                setError("");
              }}
              disabled={isSaving}
              className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
