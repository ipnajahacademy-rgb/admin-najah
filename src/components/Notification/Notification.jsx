import { useEffect, useMemo, useState } from "react";

// ==========================================================
// API
// ==========================================================

const API_BASE_URL = "https://najah-1.onrender.com/api";

const NOTIFICATION_API = `${ API_BASE_URL }/notifications`;
const STUDENTS_API = `${API_BASE_URL}/users/students`;

// ==========================================================
// COMPONENT
// ==========================================================

export default function CreateNotification() {
    // ========================================================
    // FORM
    // ========================================================

    const [formData, setFormData] = useState({
        student: "",
        title: "",
        message: "",
        type: "General",
        referenceId: "",
    });

    // ========================================================
    // STUDENTS
    // ========================================================

    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // ========================================================
    // HISTORY
    // ========================================================

    const [notifications, setNotifications] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");

    const [search, setSearch] = useState("");

    // ========================================================
    // SUBMIT
    // ========================================================

    const [saving, setSaving] = useState(false);

    // ========================================================
    // MODAL
    // ========================================================

    const [showConfirm, setShowConfirm] = useState(false);

    const [status, setStatus] = useState(null);
    // success | error | null

    const [errorText, setErrorText] = useState("");

    // ========================================================
    // GET TOKEN
    // ========================================================

    function getToken() {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Admin authentication token not found.");
        }

        return token;
    }

    // ========================================================
    // COMMON HEADERS
    // ========================================================

    function getHeaders() {
        const token = getToken();

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    // ========================================================
    // LOAD STUDENTS
    // ========================================================

    async function fetchStudents() {
        setStudentsLoading(true);

        try {
            const res = await fetch(STUDENTS_API, {
                method: "GET",
                headers: getHeaders(),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message || "Failed to load students."
                );
            }

            setStudents(data?.students || []);

        } catch (error) {
            console.error("Students API Error:", error);

            setErrorText(
                error.message || "Unable to load students."
            );

        } finally {
            setStudentsLoading(false);
        }
    }

    // ========================================================
    // LOAD NOTIFICATION HISTORY
    // ========================================================

    async function fetchNotificationHistory() {
        setHistoryLoading(true);
        setHistoryError("");

        try {
            const res = await fetch(
                `${NOTIFICATION_API}/history`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load notification history."
                );
            }

            setNotifications(data?.notifications || []);

        } catch (error) {
            console.error(
                "Notification History Error:",
                error
            );

            setHistoryError(
                error.message ||
                "Unable to load notification history."
            );

        } finally {
            setHistoryLoading(false);
        }
    }

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        fetchStudents();
        fetchNotificationHistory();
    }, []);

    // ========================================================
    // HANDLE INPUT
    // ========================================================

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // ========================================================
    // VALIDATION
    // ========================================================

    function validateForm() {
        if (!formData.student.trim()) {
            return "Please select a student.";
        }

        if (!formData.title.trim()) {
            return "Notification title is required.";
        }

        if (!formData.message.trim()) {
            return "Notification message is required.";
        }

        return null;
    }

    // ========================================================
    // SAVE BUTTON
    // ========================================================

    function handleSaveClick() {
        setStatus(null);
        setErrorText("");

        const validationError = validateForm();

        if (validationError) {
            setErrorText(validationError);
            setStatus("error");
            setShowConfirm(true);
            return;
        }

        setShowConfirm(true);
    }

    // ========================================================
    // CREATE NOTIFICATION
    // ========================================================

    async function submitNotification() {
        const validationError = validateForm();

        if (validationError) {
            setErrorText(validationError);
            setStatus("error");
            return;
        }

        setSaving(true);
        setStatus(null);
        setErrorText("");

        try {
            // ----------------------------------------------------
            // REQUEST BODY
            // ----------------------------------------------------

            const body = {
                receiverType: "Student",

                student: formData.student,

                senderType: "Admin",

                title: formData.title.trim(),

                message: formData.message.trim(),

                type: formData.type,

                referenceId:
                    formData.referenceId.trim() || null,
            };

            // ----------------------------------------------------
            // API
            // ----------------------------------------------------

            const res = await fetch(
                NOTIFICATION_API,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(body),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to create notification."
                );
            }

            // ----------------------------------------------------
            // SUCCESS
            // ----------------------------------------------------

            setStatus("success");

            // ----------------------------------------------------
            // RESET FORM
            // ----------------------------------------------------

            setFormData({
                student: "",
                title: "",
                message: "",
                type: "General",
                referenceId: "",
            });

            // ----------------------------------------------------
            // REFRESH HISTORY
            // ----------------------------------------------------

            await fetchNotificationHistory();

        } catch (error) {
            console.error(
                "Create Notification Error:",
                error
            );

            setErrorText(
                error.message ||
                "Something went wrong while creating notification."
            );

            setStatus("error");

        } finally {
            setSaving(false);
        }
    }

    // ========================================================
    // CLOSE MODAL
    // ========================================================

    function closeModal() {
        setShowConfirm(false);
        setStatus(null);
        setErrorText("");
    }

    // ========================================================
    // SEARCH HISTORY
    // ========================================================

    const filteredNotifications = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return notifications;
        }

        return notifications.filter((notification) => {
            const studentName =
                notification?.student?.fullName || "";

            const studentEmail =
                notification?.student?.email || "";

            const teacherName =
                notification?.teacher?.fullName || "";

            return (
                notification?.title
                    ?.toLowerCase()
                    .includes(keyword) ||

                notification?.message
                    ?.toLowerCase()
                    .includes(keyword) ||

                notification?.type
                    ?.toLowerCase()
                    .includes(keyword) ||

                notification?.receiverType
                    ?.toLowerCase()
                    .includes(keyword) ||

                studentName
                    .toLowerCase()
                    .includes(keyword) ||

                studentEmail
                    .toLowerCase()
                    .includes(keyword) ||

                teacherName
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [notifications, search]);

    // ========================================================
    // FORMAT DATE
    // ========================================================

    function formatDate(date) {
        if (!date) return "-";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    }

    // ========================================================
    // TYPE BADGE
    // ========================================================

    function getTypeClass(type) {
        switch (type) {
            case "SubscriptionExpiry":
                return "bg-amber-100 text-amber-700";

            case "SubscriptionExpired":
                return "bg-red-100 text-red-700";

            case "Announcement":
                return "bg-blue-100 text-blue-700";

            case "LiveClass":
                return "bg-purple-100 text-purple-700";

            case "Exam":
                return "bg-indigo-100 text-indigo-700";

            case "Result":
                return "bg-green-100 text-green-700";

            case "Homework":
                return "bg-orange-100 text-orange-700";

            case "StudentDoubt":
            case "DoubtReply":
                return "bg-pink-100 text-pink-700";

            case "Attendance":
                return "bg-cyan-100 text-cyan-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    }

    // ========================================================
    // SELECTED STUDENT
    // ========================================================

    const selectedStudent = students.find(
        (student) =>
            student._id === formData.student
    );

    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            <div className="max-w-7xl mx-auto">

                {/* ==================================================
            PAGE HEADER
        ================================================== */}

                <div className="mb-6">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Notifications
                            </h1>

                            <p className="text-sm text-gray-500 mt-1">
                                Create notifications and manage complete
                                notification history.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                                Admin
                            </span>

                            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                                {notifications.length} Notifications
                            </span>

                        </div>

                    </div>

                </div>

                {/* ==================================================
            CREATE NOTIFICATION CARD
        ================================================== */}

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6 mb-6">

                    <div className="mb-5">

                        <h2 className="text-lg font-semibold text-gray-900">
                            Create Notification
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Send a notification directly to a student.
                        </p>

                    </div>

                    {/* ==================================================
              STUDENT
          ================================================== */}

                    <div className="mb-5">

                        <label
                            htmlFor="student"
                            className="block text-sm font-medium text-gray-800 mb-1.5"
                        >
                            Select Student
                        </label>

                        {studentsLoading ? (

                            <div className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-500">
                                Loading students...
                            </div>

                        ) : (

                            <select
                                id="student"
                                name="student"
                                value={formData.student}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >

                                <option value="">
                                    Select Student
                                </option>

                                {students.map((student) => (

                                    <option
                                        key={student._id}
                                        value={student._id}
                                    >
                                        {student.fullName}
                                        {student.email
                                            ? ` - ${student.email}`
                                            : ""}
                                    </option>

                                ))}

                            </select>

                        )}

                        {selectedStudent && (

                            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3">

                                <p className="text-sm font-medium text-gray-800">
                                    {selectedStudent.fullName}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {selectedStudent.email}
                                </p>

                                <p className="text-xs text-gray-400 mt-1 break-all">
                                    ID: {selectedStudent._id}
                                </p>

                            </div>

                        )}

                    </div>

                    {/* ==================================================
              TITLE
          ================================================== */}

                    <div className="mb-5">

                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-800 mb-1.5"
                        >
                            Notification Title
                        </label>

                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Subscription Expiring Soon"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />

                    </div>

                    {/* ==================================================
              MESSAGE
          ================================================== */}

                    <div className="mb-5">

                        <label
                            htmlFor="message"
                            className="block text-sm font-medium text-gray-800 mb-1.5"
                        >
                            Message
                        </label>

                        <textarea
                            id="message"
                            name="message"
                            rows={4}
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Your subscription will expire soon. Please renew your subscription."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />

                    </div>

                    {/* ==================================================
              TYPE + REFERENCE
          ================================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                        <div>

                            <label
                                htmlFor="type"
                                className="block text-sm font-medium text-gray-800 mb-1.5"
                            >
                                Notification Type
                            </label>

                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >

                                <option value="General">
                                    General
                                </option>

                                <option value="SubscriptionExpiry">
                                    Subscription Expiry
                                </option>

                                <option value="SubscriptionExpired">
                                    Subscription Expired
                                </option>

                                <option value="Announcement">
                                    Announcement
                                </option>

                                <option value="LiveClass">
                                    Live Class
                                </option>

                                <option value="Exam">
                                    Exam
                                </option>

                                <option value="Result">
                                    Result
                                </option>

                                <option value="Homework">
                                    Homework
                                </option>

                                <option value="StudentDoubt">
                                    Student Doubt
                                </option>

                                <option value="DoubtReply">
                                    Doubt Reply
                                </option>

                                <option value="Attendance">
                                    Attendance
                                </option>

                            </select>

                        </div>

                        <div>

                            <label
                                htmlFor="referenceId"
                                className="block text-sm font-medium text-gray-800 mb-1.5"
                            >
                                Reference ID
                                <span className="text-gray-400 font-normal">
                                    {" "}
                                    (Optional)
                                </span>
                            </label>

                            <input
                                id="referenceId"
                                name="referenceId"
                                type="text"
                                value={formData.referenceId}
                                onChange={handleChange}
                                placeholder="UserCourse / Course / Exam ID"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />

                        </div>

                    </div>

                    {/* ==================================================
              SEND BUTTON
          ================================================== */}

                    <div className="flex justify-end">

                        <button
                            type="button"
                            onClick={handleSaveClick}
                            disabled={saving || studentsLoading}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                        >

                            {saving && (
                                <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            )}

                            Send Notification

                        </button>

                    </div>

                </div>

                {/* ==================================================
            HISTORY CARD
        ================================================== */}

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

                    {/* ==================================================
              HISTORY HEADER
          ================================================== */}

                    <div className="p-5 border-b border-gray-200">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Notification History
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Complete notification history.
                                </p>

                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search notifications..."
                                    className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                                />

                                <button
                                    type="button"
                                    onClick={fetchNotificationHistory}
                                    disabled={historyLoading}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {historyLoading
                                        ? "Refreshing..."
                                        : "Refresh"}
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
              HISTORY ERROR
          ================================================== */}

                    {historyError && (

                        <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4">

                            <p className="text-sm font-medium text-red-700">
                                Failed to load notification history
                            </p>

                            <p className="text-sm text-red-600 mt-1">
                                {historyError}
                            </p>

                            <button
                                type="button"
                                onClick={fetchNotificationHistory}
                                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                            >
                                Retry
                            </button>

                        </div>

                    )}

                    {/* ==================================================
              LOADING
          ================================================== */}

                    {historyLoading ? (

                        <div className="flex items-center justify-center py-16 text-gray-500">

                            <span className="h-5 w-5 mr-2 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />

                            Loading notification history...

                        </div>

                    ) : filteredNotifications.length === 0 ? (

                        /* ==================================================
                            EMPTY
                        ================================================== */

                        <div className="text-center py-16">

                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl">
                                🔔
                            </div>

                            <h3 className="text-sm font-semibold text-gray-900">
                                No notifications found
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {search
                                    ? "No notification matches your search."
                                    : "No notification history available."}
                            </p>

                        </div>

                    ) : (

                        /* ==================================================
                            TABLE
                        ================================================== */

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1000px]">

                                <thead className="bg-gray-50 border-b border-gray-200">

                                    <tr>

                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Notification
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Receiver
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Type
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Date
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                    {filteredNotifications.map(
                                        (notification) => {

                                            const receiverName =
                                                notification?.student
                                                    ?.fullName ||
                                                notification?.teacher
                                                    ?.fullName ||
                                                notification?.receiverType ||
                                                "Unknown";

                                            const receiverEmail =
                                                notification?.student
                                                    ?.email ||
                                                notification?.teacher
                                                    ?.email ||
                                                "";

                                            return (

                                                <tr
                                                    key={notification._id}
                                                    className="hover:bg-gray-50 transition"
                                                >

                                                    {/* ================================
                              NOTIFICATION
                          ================================= */}

                                                    <td className="px-5 py-4 max-w-md">

                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {notification.title}
                                                        </p>

                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>

                                                        <p className="text-xs text-gray-400 mt-2 break-all">
                                                            ID: {notification._id}
                                                        </p>

                                                    </td>

                                                    {/* ================================
                              RECEIVER
                          ================================= */}

                                                    <td className="px-5 py-4">

                                                        <p className="text-sm font-medium text-gray-900">
                                                            {receiverName}
                                                        </p>

                                                        {receiverEmail && (

                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {receiverEmail}
                                                            </p>

                                                        )}

                                                        <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                            {notification.receiverType}
                                                        </span>

                                                    </td>

                                                    {/* ================================
                              TYPE
                          ================================= */}

                                                    <td className="px-5 py-4">

                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeClass(
                                                                notification.type
                                                            )}`}
                                                        >
                                                            {notification.type}
                                                        </span>

                                                    </td>

                                                    {/* ================================
                              READ STATUS
                          ================================= */}

                                                    <td className="px-5 py-4">

                                                        {notification.isRead ? (

                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                Read
                                                            </span>

                                                        ) : (

                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                                Unread
                                                            </span>

                                                        )}

                                                    </td>

                                                    {/* ================================
                              DATE
                          ================================= */}

                                                    <td className="px-5 py-4 whitespace-nowrap">

                                                        <p className="text-sm text-gray-700">
                                                            {formatDate(
                                                                notification.createdAt
                                                            )}
                                                        </p>

                                                        {notification.readAt && (

                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Read:{" "}
                                                                {formatDate(
                                                                    notification.readAt
                                                                )}
                                                            </p>

                                                        )}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* ======================================================
          CONFIRMATION MODAL
      ====================================================== */}

            {showConfirm && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">

                        {/* =================================================
                SUCCESS
            ================================================= */}

                        {status === "success" ? (

                            <>

                                <div className="flex items-center gap-2 text-green-600 mb-2">

                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">
                                        ✓
                                    </span>

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Notification Sent
                                    </h3>

                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Notification has been successfully sent.
                                </p>

                                <div className="rounded-lg bg-gray-50 p-3 mb-4">

                                    <p className="text-xs text-gray-500">
                                        Student
                                    </p>

                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedStudent?.fullName ||
                                            "Student"}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-2">
                                        Title
                                    </p>

                                    <p className="text-sm font-medium text-gray-900">
                                        {formData.title ||
                                            "Notification"}
                                    </p>

                                </div>

                                <div className="flex justify-end">

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                    >
                                        Done
                                    </button>

                                </div>

                            </>

                        ) : status === "error" ? (

                            /* =================================================
                                ERROR
                            ================================================= */

                            <>

                                <div className="flex items-center gap-2 text-red-600 mb-2">

                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-bold">
                                        !
                                    </span>

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Notification Failed
                                    </h3>

                                </div>

                                <p className="text-sm text-red-600 mb-4">
                                    {errorText}
                                </p>

                                <div className="flex justify-end gap-2">

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submitNotification}
                                        disabled={saving}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Sending..."
                                            : "Try Again"}
                                    </button>

                                </div>

                            </>

                        ) : (

                            /* =================================================
                                CONFIRM
                            ================================================= */

                            <>

                                <div className="flex items-start justify-between mb-3">

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Confirm Notification
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 text-lg"
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>

                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Are you sure you want to send this
                                    notification?
                                </p>

                                <div className="rounded-lg bg-gray-50 p-3 mb-4 space-y-3">

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Student
                                        </p>

                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedStudent?.fullName ||
                                                "Not selected"}
                                        </p>

                                        {selectedStudent?.email && (

                                            <p className="text-xs text-gray-500">
                                                {selectedStudent.email}
                                            </p>

                                        )}

                                    </div>

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Title
                                        </p>

                                        <p className="text-sm font-medium text-gray-900">
                                            {formData.title}
                                        </p>

                                    </div>

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Type
                                        </p>

                                        <span
                                            className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeClass(
                                                formData.type
                                            )}`}
                                        >
                                            {formData.type}
                                        </span>

                                    </div>

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Message
                                        </p>

                                        <p className="text-sm text-gray-700">
                                            {formData.message}
                                        </p>

                                    </div>

                                </div>

                                <div className="flex justify-end gap-2">

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submitNotification}
                                        disabled={saving}
                                        className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >

                                        {saving && (
                                            <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        )}

                                        {saving
                                            ? "Sending..."
                                            : "Confirm & Send"}

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
