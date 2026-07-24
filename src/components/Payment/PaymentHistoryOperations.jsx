import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";
const ITEMS_PER_PAGE = 8;

export default function PaymentHistoryOperations() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ---------------- FETCH PAYMENT HISTORY ----------------

  const fetchPayments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/payment/admin/history`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setPayments(Array.isArray(data.data) ? data.data : []);
        setTotalAmount(data.totalAmount || 0);
      } else {
        setError(data.message || "Failed to load payment history");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ---------------- FILTER + PAGINATION ----------------

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const term = search.toLowerCase();

    return payments.filter((p) => {
      return (
        (p.user?.fullName || "").toLowerCase().includes(term) ||
        (p.user?.email || "").toLowerCase().includes(term) ||
        (p.user?.mobile || "").toLowerCase().includes(term) ||
        (p.razorpayOrderId || "").toLowerCase().includes(term) ||
        (p.razorpayPaymentId || "").toLowerCase().includes(term) ||
        (p.subscriptionType || "").toLowerCase().includes(term)
      );
    });
  }, [payments, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  );

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // ---------------- STATS ----------------

  const stats = useMemo(() => {
    const total = payments.length;
    const paid = payments.filter(
      (p) => (p.paymentStatus || "").toLowerCase() === "paid"
    ).length;
    const failed = payments.filter(
      (p) => (p.paymentStatus || "").toLowerCase() === "failed"
    ).length;
    const active = payments.filter((p) => p.isActive).length;

    return { total, paid, failed, active };
  }, [payments]);

  // ---------------- HELPERS ----------------

  const formatDate = (dateString) => {
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

  const statusStyles = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return "bg-green-50 text-green-600";
    if (s === "failed") return "bg-red-50 text-red-600";
    if (s === "pending") return "bg-orange-50 text-orange-600";
    return "bg-gray-100 text-gray-500";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
          <p className="text-gray-600">View all subscription payments.</p>
        </div>
        <button
          onClick={fetchPayments}
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="#3498db" icon="🧾" />
        <StatCard label="Paid" value={stats.paid} color="#2ecc71" icon="✅" />
        <StatCard label="Failed" value={stats.failed} color="#e74c3c" icon="❌" />
        <StatCard label="Active Subs" value={stats.active} color="#f39c12" icon="🔓" />
        <StatCard
          label="Total Revenue"
          value={`₹${totalAmount}`}
          color="#9b59b6"
          icon="💰"
        />
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by user, email, mobile, order ID, or payment ID..."
        className="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
          <p className="text-lg font-medium">No payment records found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">User Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Signature</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Renew Count</th>
                  <th className="px-4 py-3 font-semibold">Created At</th>
                  <th className="px-4 py-3 font-semibold">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((p, i) => (
                  <tr
                    key={p._id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                      {p.user?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {p.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {p.user?.mobile || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.course?.title || p.course || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {p.subscriptionType || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      ₹{p.amount ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.razorpayOrderId || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.razorpayPaymentId || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs break-all min-w-[220px]">
                      {p.razorpaySignature || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles(
                          p.paymentStatus
                        )}`}
                      >
                        {p.paymentStatus || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(p.startDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(p.expiryDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          p.isActive
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {p.renewCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(p.updatedAt)}
                    </td>
                  </tr>
                ))}
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