import React, { useEffect, useState } from "react";

const API_BASE = "https://najah-1.onrender.com";

export default function NotificationsOperations() {
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);

    const [receiverType, setReceiverType] = useState("teacher");
    const [selectedUser, setSelectedUser] = useState("");

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("General");

    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ==========================================
    // TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    const authHeaders = () => ({
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
    });

    // ==========================================
    // FETCH TEACHERS
    // ==========================================

    const fetchTeachers = async () => {
        setIsLoadingTeachers(true);

        try {
            const res = await fetch(
                `${API_BASE}/api/teacher/admin/all`,
                {
                    method: "GET",
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (res.ok && data.success !== false) {
                setTeachers(
                    Array.isArray(data.data)
                        ? data.data
                        : []
                );
            } else {
                setError(
                    data.message || "Failed to load teachers"
                );
            }
        } catch (error) {
            console.error("Fetch Teachers Error:", error);

            setError(
                error.message || "Failed to load teachers"
            );
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    // ==========================================
    // FETCH STUDENTS
    // ==========================================

    const fetchStudents = async () => {
        setIsLoadingStudents(true);

        try {
            const res = await fetch(
                `${API_BASE}/api/users/all`,
                {
                    method: "GET",
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (res.ok && data.success !== false) {
                setStudents(
                    Array.isArray(data.users)
                        ? data.users
                        : Array.isArray(data.data)
                            ? data.data
                            : []
                );
            } else {
                setError(
                    data.message || "Failed to load students"
                );
            }
        } catch (error) {
            console.error("Fetch Students Error:", error);

            setError(
                error.message || "Failed to load students"
            );
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {
        fetchTeachers();
        fetchStudents();
    }, []);

    // ==========================================
    // CHANGE RECEIVER TYPE
    // ==========================================

    const handleReceiverTypeChange = (value) => {
        setReceiverType(value);
        setSelectedUser("");
        setError("");
        setSuccess("");
    };

    // ==========================================
    // GET SELECTED USER
    // ==========================================

    const getSelectedUserData = () => {
        if (!selectedUser) {
            return null;
        }

        if (receiverType === "teacher") {
            return teachers.find(
                (teacher) => teacher._id === selectedUser
            );
        }

        return students.find(
            (student) => student._id === selectedUser
        );
    };

    // ==========================================
    // SEND PUSH NOTIFICATION
    // ==========================================

    const sendPushNotification = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedUser) {
            setError(
                `Please select a ${receiverType === "teacher"
                    ? "teacher"
                    : "student"
                } `
            );
            return;
        }

        if (!title.trim()) {
            setError("Please enter notification title");
            return;
        }

        if (!message.trim()) {
            setError("Please enter notification message");
            return;
        }

        const selectedUserData = getSelectedUserData();

        if (!selectedUserData) {
            setError("Selected user not found");
            return;
        }

        setIsSending(true);

        try {
            const payload = {
                userId: selectedUserData._id,
                userType:
                    receiverType === "teacher"
                        ? "teacher"
                        : "user",
                title: title.trim(),
                message: message.trim(),
                type: notificationType,
            };

            console.log("Sending Push Payload:", payload);

            const res = await fetch(
                `${API_BASE}/api/notifications/send-push`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            console.log(
                "Push Notification Response:",
                data
            );

            if (res.ok && data.success) {
                const pushData = data.data || {};

                setSuccess(
                    `Notification sent successfully to ${selectedUserData.fullName ||
                    selectedUserData.name ||
                    "user"
                    }.Success: ${pushData.successCount ?? 0
                    }, Failed: ${pushData.failedCount ?? 0
                    } `
                );

                setSelectedUser("");
                setTitle("");
                setMessage("");
                setNotificationType("General");
            } else {
                setError(
                    data.message ||
                    "Failed to send notification"
                );
            }
        } catch (error) {
            console.error(
                "Send Push Error:",
                error
            );

            setError(
                error.message ||
                "Something went wrong"
            );
        } finally {
            setIsSending(false);
        }
    };

    // ==========================================
    // SELECTED USER
    // ==========================================

    const selectedUserData = getSelectedUserData();

    // ==========================================
    // CURRENT LIST
    // ==========================================

    const currentUsers =
        receiverType === "teacher"
            ? teachers
            : students;

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="flex flex-col gap-6">

            {/* HEADER */}

            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Push Notifications
                </h1>

                <p className="text-gray-600 mt-1">
                    Send Firebase push notifications to
                    teachers or students.
                </p>
            </div>

            {/* SUCCESS */}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* ERROR */}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* MAIN CARD */}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-3xl">

                <form
                    onSubmit={sendPushNotification}
                    className="flex flex-col gap-5"
                >

                    {/* RECEIVER TYPE */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Send Notification To
                        </label>

                        <div className="grid grid-cols-2 gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    handleReceiverTypeChange("teacher")
                                }
                                className={`border rounded-xl p-4 text-left transition ${receiverType === "teacher"
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-gray-300 hover:bg-gray-50"
                                    } `}
                            >
                                <div className="font-semibold text-gray-800">
                                    👨‍🏫 Teacher
                                </div>

                                <div className="text-xs text-gray-500 mt-1">
                                    Send notification to teacher
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleReceiverTypeChange("student")
                                }
                                className={`border rounded - xl p - 4 text-left transition${receiverType === "student"
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-gray-300 hover:bg-gray-50"
                                    } `}
                            >
                                <div className="font-semibold text-gray-800">
                                    🎓 Student
                                </div>

                                <div className="text-xs text-gray-500 mt-1">
                                    Send notification to student
                                </div>
                            </button>

                        </div>
                    </div>

                    {/* USER DROPDOWN */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select{" "}
                            {receiverType === "teacher"
                                ? "Teacher"
                                : "Student"}
                        </label>

                        <select
                            value={selectedUser}
                            onChange={(e) =>
                                setSelectedUser(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                        >

                            <option value="">
                                {receiverType === "teacher"
                                    ? isLoadingTeachers
                                        ? "Loading teachers..."
                                        : "Select Teacher"
                                    : isLoadingStudents
                                        ? "Loading students..."
                                        : "Select Student"}
                            </option>

                            {currentUsers.map((user) => (
                                <option
                                    key={user._id}
                                    value={user._id}
                                >
                                    {user.fullName ||
                                        user.name ||
                                        "Unnamed User"}
                                    {" - "}
                                    {receiverType === "teacher"
                                        ? user.teacherId ||
                                        user.email
                                        : user.email}
                                </option>
                            ))}

                        </select>
                    </div>

                    {/* SELECTED USER DETAILS */}

                    {selectedUserData && (
                        <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">

                            <div className="flex items-center justify-between mb-3">

                                <h3 className="font-semibold text-gray-800">
                                    Selected{" "}
                                    {receiverType === "teacher"
                                        ? "Teacher"
                                        : "Student"}
                                </h3>

                                <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-500">
                                    {receiverType === "teacher"
                                        ? "teacher"
                                        : "user"}
                                </span>

                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                                <div>
                                    <p className="text-gray-400 text-xs">
                                        Name
                                    </p>

                                    <p className="font-medium text-gray-700">
                                        {selectedUserData.fullName ||
                                            selectedUserData.name ||
                                            "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-xs">
                                        Email
                                    </p>

                                    <p className="font-medium text-gray-700">
                                        {selectedUserData.email || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-xs">
                                        MongoDB ID
                                    </p>

                                    <p className="font-medium text-gray-700 break-all">
                                        {selectedUserData._id}
                                    </p>
                                </div>

                                {receiverType === "teacher" && (
                                    <div>
                                        <p className="text-gray-400 text-xs">
                                            Teacher ID
                                        </p>

                                        <p className="font-medium text-gray-700">
                                            {selectedUserData.teacherId || "-"}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-gray-400 text-xs">
                                        User Type
                                    </p>

                                    <p className="font-medium text-gray-700">
                                        {receiverType === "teacher"
                                            ? "teacher"
                                            : "user"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-xs">
                                        FCM Devices
                                    </p>

                                    <p className="font-medium text-gray-700">
                                        {Array.isArray(
                                            selectedUserData.fcmTokens
                                        )
                                            ? selectedUserData.fcmTokens.length
                                            : 0}
                                    </p>
                                </div>

                            </div>

                        </div>
                    )}

                    {/* TITLE */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notification Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            placeholder="Enter notification title"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                    </div>

                    {/* MESSAGE */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notification Message
                        </label>

                        <textarea
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            placeholder="Enter notification message"
                            rows={5}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                    </div>

                    {/* NOTIFICATION TYPE */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notification Type
                        </label>

                        <select
                            value={notificationType}
                            onChange={(e) =>
                                setNotificationType(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                        >
                            <option value="General">General</option>
                            <option value="Homework">Homework</option>
                            <option value="HomeworkSubmission">
                                Homework Submission
                            </option>
                            <option value="StudentDoubt">
                                Student Doubt
                            </option>
                            <option value="DoubtReply">
                                Doubt Reply
                            </option>
                            <option value="Attendance">Attendance</option>
                            <option value="LiveClass">Live Class</option>
                            <option value="Exam">Exam</option>
                            <option value="Result">Result</option>
                            <option value="Announcement">
                                Announcement
                            </option>
                            <option value="Leave">Leave</option>
                            <option value="SubscriptionExpiry">
                                Subscription Expiry
                            </option>
                            <option value="SubscriptionExpired">
                                Subscription Expired
                            </option>
                        </select>
                    </div>

                    {/* SEND BUTTON */}

                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSending
                            ? "Sending Notification..."
                            : "🔔 Send Push Notification"}
                    </button>

                </form>
            </div>

            {/* INFO */}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-3xl">

                <h3 className="font-semibold text-blue-800 mb-2">
                    How it works
                </h3>

                <div className="text-sm text-blue-700 space-y-1">

                    <p>1. Select Teacher or Student.</p>

                    <p>2. Select the specific user.</p>

                    <p>
                        3. The user's <b>_id</b> is automatically
                        used as <b>userId</b>.
                    </p>

                    <p>
                        4. Teacher sends{" "}
                        <b>userType: "teacher"</b>.
                    </p>

                    <p>
                        5. Student sends{" "}
                        <b>userType: "user"</b>.
                    </p>

                    <p>
                        6. Backend gets that user's{" "}
                        <b>fcmTokens</b> and sends through Firebase.
                    </p>

                </div>
            </div>

        </div>
    );
}
