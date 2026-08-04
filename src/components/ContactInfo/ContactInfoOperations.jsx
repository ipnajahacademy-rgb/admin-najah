import React, { useEffect, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";

export default function ContactInfoOperations() {
  const [contactInfo, setContactInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH ----------------

  const fetchContactInfo = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/contact-info`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setContactInfo(data.data);
        setEmail(data.data?.email || "");
        setPhone(data.data?.phone || "");
      } else {
        setError(data.message || "Failed to load contact info");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  // ---------------- SAVE (PUT - upsert) ----------------

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaveMessage("");

    if (!email.trim() && !phone.trim()) {
      setError("Provide at least an email or phone");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/contact-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setContactInfo(data.data);
        setSaveMessage("Contact info saved");
      } else {
        setError(data.message || "Failed to save contact info");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- DELETE ----------------

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    setSaveMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/contact-info`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setContactInfo(null);
        setEmail("");
        setPhone("");
        setSaveMessage("Contact info removed");
      } else {
        setError(data.message || "Failed to delete contact info");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 max-w-lg">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Contact Info</h2>
        <p className="text-sm text-gray-500">
          Public support email and phone number shown to users. Not tied to
          individual FAQs.
        </p>
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

      {isLoading ? (
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="support@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 890"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="flex gap-3 mt-2">
            {contactInfo && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
            >
              {isSaving ? "Saving..." : contactInfo ? "Update" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
