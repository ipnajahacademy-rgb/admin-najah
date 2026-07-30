 
import { useEffect, useState } from "react";

// ==========================================================
// API
// ==========================================================

const NOTIFICATION_API =
    "https://najah-1.onrender.com/api/notifications";

const STUDENTS_API =
    "https://najah-1.onrender.com/api/users/students";

export default function CreateNotification() {

    // ======================================================
    // FORM STATE
    // ======================================================

    const [formData, setFormData] = useState({
        student: "",
        title: "",
        message: "",
        type: "General",
        referenceId: "",
    });

    // ======================================================
    // STUDENTS
    // ======================================================

    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    // ======================================================
    // UI STATE
    // ======================================================

    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState(null);
    const [errorText, setErrorText] = useState("");

    // ======================================================
    // GET ADMIN TOKEN
    // ======================================================

    function getToken() {
        return localStorage.getItem("token");
    }

    // ======================================================
    // LOAD STUDENTS
    // ======================================================

    useEffect(() => {

        async function fetchStudents() {

            try {

                setLoadingStudents(true);

                const token = getToken();

                if (!token) {
                    throw new Error(
                        "Admin authentication token not found."
                    );
                }

                const res = await fetch(STUDENTS_API, {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${ token } `,
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data?.message ||
                        "Failed to load students."
                    );
                }

                setStudents(data.students || []);

            } catch (error) {

                console.error(
                    "Fetch Students Error:",
                    error
                );

                setErrorText(
                    error.message ||
                    "Unable to load students."
                );

            } finally {

                setLoadingStudents(false);
            }
        }

        fetchStudents();

    }, []);

    // ======================================================
    // HANDLE INPUT
    // ======================================================

    function handleChange(e) {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // ======================================================
    // VALIDATION
    // ======================================================

    function validateForm() {

        if (!formData.student) {

            setErrorText(
                "Please select a student."
            );

            return false;
        }

        if (!formData.title.trim()) {

            setErrorText(
                "Notification title is required."
            );

            return false;
        }

        if (!formData.message.trim()) {

            setErrorText(
                "Notification message is required."
            );

            return false;
        }

        return true;
    }

    // ======================================================
    // SELECTED STUDENT
    // ======================================================

    const selectedStudent = students.find(
        (student) =>
            student._id === formData.student
    );

    // ======================================================
    // SUBMIT NOTIFICATION
    // ======================================================

    async function submitNotification() {

        if (!validateForm()) {

            setStatus("error");

            return;
        }

        setSaving(true);
        setStatus(null);
        setErrorText("");

        try {

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Admin authentication token not found."
                );
            }

            // ==================================================
            // REQUEST BODY
            // ==================================================

            const body = {

                receiverType: "Student",

                // Student selected from dropdown
                student: formData.student,

                senderType: "System",

                title: formData.title.trim(),

                message: formData.message.trim(),

                type: formData.type,

                referenceId:
                    formData.referenceId.trim() ||
                    null,
            };

            console.log(
                "Notification Request:",
                body
            );

            // ==================================================
            // API CALL
            // ==================================================

            const res = await fetch(
                NOTIFICATION_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${ token } `,
                    },

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

            // ==================================================
            // SUCCESS
            // ==================================================

            setStatus("success");

            // Clear form
            setFormData({
                student: "",
                title: "",
                message: "",
                type: "General",
                referenceId: "",
            });

        } catch (error) {

            console.error(
                "Create Notification Error:",
                error
            );

            setErrorText(
                error.message ||
                "Something went wrong."
            );

            setStatus("error");

        } finally {

            setSaving(false);
        }
    }

    // ======================================================
    // SAVE CLICK
    // ======================================================

    function handleSaveClick() {

        setStatus(null);
        setErrorText("");

        if (!validateForm()) {

            setStatus("error");
            setShowConfirm(true);

            return;
        }

        setShowConfirm(true);
    }

    // ======================================================
    // CLOSE MODAL
    // ======================================================

    function closeModal() {

        setShowConfirm(false);
        setStatus(null);
        setErrorText("");
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="mb-6">

                <div className="flex items-center justify-between">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Create Notification
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Send a notification to a student.
                        </p>

                    </div>

                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        Admin
                    </span>

                </div>

            </div>

            {/* ==================================================
                STUDENT DROPDOWN
            ================================================== */}

            <div className="mb-4">

                <label
                    htmlFor="student"
                    className="block text-sm font-medium text-gray-800 mb-1.5"
                >
                    Select Student
                </label>

                {loadingStudents ? (

                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">

                        <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />

                        Loading students...

                    </div>

                ) : (

                    <select
                        id="student"
                        name="student"
                        value={formData.student}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    >

                        <option value="">
                            Select a student
                        </option>

                        {students.map((student) => (

                            <option
                                key={student._id}
                                value={student._id}
                            >
                                {student.fullName}
                                {student.email
                                    ? ` - ${ student.email } `
                                    : ""}
                            </option>

                        ))}

                    </select>
                )}

                {/* Selected student details */}

                {selectedStudent && (

                    <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3">

                        <p className="text-sm font-medium text-gray-900">
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

            <div className="mb-4">

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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />

            </div>

            {/* ==================================================
                MESSAGE
            ================================================== */}

            <div className="mb-4">

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
                    placeholder="Your subscription for this course will expire in 10 days. Please renew your subscription."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                />

            </div>

            {/* ==================================================
                TYPE
            ================================================== */}

            <div className="mb-4">

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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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

            {/* ==================================================
                REFERENCE ID
            ================================================== */}

            <div className="mb-6">

                <label
                    htmlFor="referenceId"
                    className="block text-sm font-medium text-gray-800 mb-1.5"
                >
                    Reference ID
                    <span className="text-gray-400 font-normal">
                        {" "}Optional
                    </span>
                </label>

                <input
                    id="referenceId"
                    name="referenceId"
                    type="text"
                    value={formData.referenceId}
                    onChange={handleChange}
                    placeholder="UserCourse / Course ObjectId"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />

            </div>

            {/* ==================================================
                SEND BUTTON
            ================================================== */}

            <div className="pt-2 flex justify-end">

                <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={saving || loadingStudents}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >

                    Send Notification

                </button>

            </div>

            {/* ==================================================
                CONFIRM MODAL
            ================================================== */}

            {showConfirm && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">

                        {/* SUCCESS */}

                        {status === "success" ? (

                            <>

                                <div className="flex items-center gap-2 text-green-600 mb-2">

                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                                        ✓
                                    </span>

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Notification Sent
                                    </h3>

                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Notification successfully sent to the student.
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

                            /* ERROR */

                            <>

                                <div className="flex items-center gap-2 text-red-600 mb-2">

                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
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
                                        onClick={closeModal}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                                    >
                                        Close
                                    </button>

                                    <button
                                        onClick={submitNotification}
                                        disabled={saving}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {saving
                                            ? "Sending..."
                                            : "Try Again"}
                                    </button>

                                </div>

                            </>

                        ) : (

                            /* CONFIRM */

                            <>

                                <div className="flex items-start justify-between mb-2">

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Confirm Notification
                                    </h3>

                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 text-lg"
                                    >
                                        ×
                                    </button>

                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Are you sure you want to send this notification?
                                </p>

                                <div className="rounded-lg bg-gray-50 p-3 mb-4 space-y-3">

                                    <div>

                                        <p className="text-xs text-gray-500">
                                            Student
                                        </p>

                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedStudent?.fullName}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {selectedStudent?.email}
                                        </p>

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

                                        <p className="text-sm font-medium text-gray-900">
                                            {formData.type}
                                        </p>

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
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={submitNotification}
                                        disabled={saving}
                                        className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                    >

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
