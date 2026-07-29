import { useEffect, useState } from "react";

// Point this at your backend (see maintenance.routes.js)
const API_URL = "https://najah-1.onrender.com/maintenance";

export default function MaintenanceConfig() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [errorText, setErrorText] = useState("");

  // Load the single existing entry on mount
  useEffect(() => {
    let ignore = false;

    async function fetchConfig() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to load config");
        const data = await res.json();
        if (!ignore) {
          setIsMaintenance(Boolean(data.isMaintenance));
          setMessage(data.message ?? "");
        }
      } catch (err) {
        if (!ignore) {
          setErrorText(err.message || "Could not load maintenance config");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchConfig();
    return () => {
      ignore = true;
    };
  }, []);

  // Actually sends the update - always the SAME entry (upsert on the backend)
  async function submitUpdate() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMaintenance, message }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStatus("success");
    } catch (err) {
      setErrorText(err.message || "Something went wrong");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveClick() {
    setShowConfirm(true);
  }

  function closeModal() {
    setShowConfirm(false);
    setStatus(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <span className="h-5 w-5 mr-2 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        Loading maintenance config...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Maintenance mode</h2>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isMaintenance ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isMaintenance ? "Enabled" : "Disabled"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Turn this on to show a maintenance screen to users. There is only ever one config entry — saving updates it, it never creates a new one.
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-800">Site under maintenance</p>
          <p className="text-xs text-gray-500">Blocks normal access when turned on</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isMaintenance}
          onClick={() => setIsMaintenance((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${
            isMaintenance ? "bg-amber-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isMaintenance ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Message field */}
      <div className="py-4 border-t border-gray-100">
        <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-800 mb-1.5">
          Message shown to users
        </label>
        <textarea
          id="maintenance-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="We are currently undergoing scheduled maintenance..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSaveClick}
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Save changes
        </button>
      </div>

      {/* Confirmation / result popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            {status === "success" ? (
              <>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                    ✓
                  </span>
                  <h3 className="text-base font-semibold text-gray-900">Config updated</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Maintenance mode is now <strong>{isMaintenance ? "enabled" : "disabled"}</strong>.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : status === "error" ? (
              <>
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    !
                  </span>
                  <h3 className="text-base font-semibold text-gray-900">Update failed</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{errorText}</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={submitUpdate}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Try again
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">Confirm update</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  This will {isMaintenance ? "turn maintenance mode ON" : "turn maintenance mode OFF"} for all
                  users. This updates the single existing config entry.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitUpdate}
                    disabled={saving}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving && (
                      <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    )}
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
