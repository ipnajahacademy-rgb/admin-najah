import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://najah-1.onrender.com/api";

const HelpSupport = ({ students = [] }) => {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState("");

    const [loadingStudents] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    const [error, setError] = useState("");

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    // =========================================================
    // AXIOS CONFIG
    // =========================================================

    const getConfig = () => ({
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
    });

    // =========================================================
    // GET STUDENT CONVERSATION
    // GET /api/support/admin/STUDENT_ID
    // =========================================================

    const getStudentConversation = async (student) => {
        try {
            setSelectedStudent(student);
            setMessages([]);
            setReply("");
            setError("");
            setLoadingMessages(true);

            const response = await axios.get(
                `${API_BASE_URL}/support/admin/${student._id}`,
                getConfig()
            );

            if (response.data?.success) {
                setMessages(response.data.data || []);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error(
                "Get support conversation error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load conversation."
            );

            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    // =========================================================
    // REPLY TO STUDENT
    // POST /api/support/admin/SUPPORT_MESSAGE_ID/reply
    // =========================================================

    const handleReply = async () => {
        if (!reply.trim()) return;

        if (!messages.length) {
            setError("No support message found.");
            return;
        }

        try {
            setSendingReply(true);
            setError("");

            const lastMessage = messages[messages.length - 1];

            const supportMessageId = lastMessage._id;

            const response = await axios.post(
                `${API_BASE_URL}/support/admin/${supportMessageId}/reply`,
                {
                    message: reply.trim(),
                },
                getConfig()
            );

            if (response.data?.success) {
                setReply("");

                await getStudentConversation(selectedStudent);
            }
        } catch (error) {
            console.error("Reply error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to send reply."
            );
        } finally {
            setSendingReply(false);
        }
    };

    // =========================================================
    // ENTER TO SEND
    // SHIFT + ENTER = NEW LINE
    // =========================================================

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleReply();
        }
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">

            {/* HEADER */}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                    Help & Support
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Manage student support conversations and reply
                    to their queries.
                </p>
            </div>

            {/* MAIN CONTAINER */}

            <div
                className="
                    flex
                    h-[calc(100vh-150px)]
                    min-h-[600px]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >

                {/* =================================================
                    LEFT - STUDENTS
                ================================================= */}

                <div
                    className="
                        w-full
                        flex-shrink-0
                        border-r
                        border-slate-200
                        bg-white
                        md:w-[330px]
                        lg:w-[360px]
                    "
                >

                    {/* Students Header */}

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            border-b
                            border-slate-200
                            px-5
                            py-4
                        "
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                Students
                            </h2>

                            <p className="text-xs text-slate-400">
                                Support conversations
                            </p>
                        </div>

                        <span
                            className="
                                flex
                                h-8
                                min-w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-indigo-50
                                px-2
                                text-sm
                                font-semibold
                                text-indigo-600
                            "
                        >
                            {students.length}
                        </span>
                    </div>

                    {/* Student List */}

                    <div className="h-[calc(100%-73px)] overflow-y-auto">

                        {loadingStudents ? (

                            <div className="flex h-full items-center justify-center">
                                <div className="text-sm text-slate-500">
                                    Loading students...
                                </div>
                            </div>

                        ) : students.length === 0 ? (

                            <div className="flex h-full flex-col items-center justify-center px-5 text-center">

                                <div
                                    className="
                                        mb-3
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-slate-100
                                        text-2xl
                                    "
                                >
                                    👥
                                </div>

                                <h3 className="font-semibold text-slate-700">
                                    No students found
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    There are no students available.
                                </p>

                            </div>

                        ) : (

                            students.map((student) => {

                                const isSelected =
                                    selectedStudent?._id === student._id;

                                return (
                                    <button
                                        key={student._id}
                                        type="button"
                                        onClick={() =>
                                            getStudentConversation(student)
                                        }
                                        className={`
                                            flex
                                            w-full
                                            items-center
                                            gap-3
                                            border-b
                                            border-slate-100
                                            px-4
                                            py-4
                                            text-left
                                            transition
                                            duration-200
                                            ${isSelected
                                                ? "bg-indigo-50"
                                                : "hover:bg-slate-50"
                                            }
                                        `}
                                    >

                                        {/* Avatar */}

                                        <div className="relative flex-shrink-0">

                                            {student.profileImage ? (

                                                <img
                                                    src={student.profileImage}
                                                    alt={
                                                        student.fullName ||
                                                        "Student"
                                                    }
                                                    className="
                                                        h-12
                                                        w-12
                                                        rounded-full
                                                        object-cover
                                                        ring-2
                                                        ring-white
                                                    "
                                                />

                                            ) : (

                                                <div
                                                    className="
                                                        flex
                                                        h-12
                                                        w-12
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-indigo-100
                                                        text-lg
                                                        font-bold
                                                        text-indigo-600
                                                    "
                                                >
                                                    {student.fullName
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "S"}
                                                </div>

                                            )}

                                        </div>

                                        {/* Student Info */}

                                        <div className="min-w-0 flex-1">

                                            <h3
                                                className={`
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                    ${isSelected
                                                        ? "text-indigo-700"
                                                        : "text-slate-800"
                                                    }
                                                `}
                                            >
                                                {student.fullName}
                                            </h3>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {student.email}
                                            </p>

                                            {student.mobile && (
                                                <p className="mt-1 truncate text-xs text-slate-400">
                                                    {student.mobile}
                                                </p>
                                            )}

                                        </div>

                                    </button>
                                );
                            })

                        )}

                    </div>

                </div>

                {/* =================================================
                    RIGHT - CHAT
                ================================================= */}

                <div className="flex min-w-0 flex-1 flex-col bg-slate-50">

                    {!selectedStudent ? (

                        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">

                            <div
                                className="
                                    mb-5
                                    flex
                                    h-20
                                    w-20
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-indigo-100
                                    text-4xl
                                "
                            >
                                💬
                            </div>

                            <h2 className="text-xl font-bold text-slate-800">
                                Select a Student
                            </h2>

                            <p className="mt-2 max-w-md text-sm text-slate-500">
                                Select a student from the left side to
                                view their support conversation and
                                reply to their queries.
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* CHAT HEADER */}

                            <div
                                className="
                                    flex
                                    items-center
                                    border-b
                                    border-slate-200
                                    bg-white
                                    px-5
                                    py-4
                                "
                            >
                                <div className="flex items-center gap-3">

                                    {selectedStudent.profileImage ? (

                                        <img
                                            src={selectedStudent.profileImage}
                                            alt={selectedStudent.fullName}
                                            className="
                                                h-11
                                                w-11
                                                rounded-full
                                                object-cover
                                            "
                                        />

                                    ) : (

                                        <div
                                            className="
                                                flex
                                                h-11
                                                w-11
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-indigo-100
                                                font-bold
                                                text-indigo-600
                                            "
                                        >
                                            {selectedStudent.fullName
                                                ?.charAt(0)
                                                ?.toUpperCase() || "S"}
                                        </div>

                                    )}

                                    <div>
                                        <h3 className="font-semibold text-slate-800">
                                            {selectedStudent.fullName}
                                        </h3>

                                        <p className="text-xs text-slate-500">
                                            {selectedStudent.email}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* ERROR */}

                            {error && (
                                <div
                                    className="
                                        mx-4
                                        mt-3
                                        rounded-lg
                                        border
                                        border-red-200
                                        bg-red-50
                                        px-4
                                        py-3
                                        text-sm
                                        text-red-600
                                    "
                                >
                                    {error}
                                </div>
                            )}

                            {/* MESSAGES */}

                            <div
                                className="
                                    flex-1
                                    overflow-y-auto
                                    px-4
                                    py-5
                                    md:px-6
                                "
                            >

                                {loadingMessages ? (

                                    <div className="flex h-full items-center justify-center">

                                        <div className="flex items-center gap-3 text-sm text-slate-500">

                                            <div
                                                className="
                                                    h-5
                                                    w-5
                                                    animate-spin
                                                    rounded-full
                                                    border-2
                                                    border-slate-200
                                                    border-t-indigo-600
                                                "
                                            />

                                            Loading conversation...

                                        </div>

                                    </div>

                                ) : messages.length === 0 ? (

                                    <div className="flex h-full flex-col items-center justify-center text-center">

                                        <div
                                            className="
                                                mb-4
                                                flex
                                                h-16
                                                w-16
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-white
                                                text-2xl
                                                shadow-sm
                                            "
                                        >
                                            💬
                                        </div>

                                        <h3 className="font-semibold text-slate-700">
                                            No messages
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-400">
                                            No support conversation found
                                            for this student.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="mx-auto flex max-w-4xl flex-col gap-4">

                                        {messages.map((message) => {

                                            const isAdmin =
                                                message.senderType === "Admin";

                                            return (
                                                <div
                                                    key={message._id}
                                                    className={`
                                                        flex
                                                        ${isAdmin
                                                            ? "justify-end"
                                                            : "justify-start"
                                                        }
                                                    `}
                                                >

                                                    <div
                                                        className={`
                                                            max-w-[80%]
                                                            rounded-2xl
                                                            px-4
                                                            py-3
                                                            shadow-sm
                                                            md:max-w-[65%]
                                                            ${isAdmin
                                                                ? "rounded-br-md bg-indigo-600 text-white"
                                                                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                                                            }
                                                        `}
                                                    >

                                                        <div
                                                            className={`
                                                                mb-1
                                                                text-xs
                                                                font-semibold
                                                                ${isAdmin
                                                                    ? "text-indigo-100"
                                                                    : "text-indigo-600"
                                                                }
                                                            `}
                                                        >
                                                            {isAdmin
                                                                ? "Admin"
                                                                : selectedStudent.fullName}
                                                        </div>

                                                        <div
                                                            className={`
                                                                whitespace-pre-wrap
                                                                break-words
                                                                text-sm
                                                                leading-6
                                                                ${isAdmin
                                                                    ? "text-white"
                                                                    : "text-slate-700"
                                                                }
                                                            `}
                                                        >
                                                            {message.message}
                                                        </div>

                                                        <div
                                                            className={`
                                                                mt-2
                                                                text-[10px]
                                                                ${isAdmin
                                                                    ? "text-indigo-200"
                                                                    : "text-slate-400"
                                                                }
                                                            `}
                                                        >
                                                            {formatDate(
                                                                message.createdAt
                                                            )}
                                                        </div>

                                                    </div>

                                                </div>
                                            );
                                        })}

                                    </div>

                                )}

                            </div>

                            {/* REPLY BOX */}

                            <div
                                className="
                                    border-t
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >

                                <div className="mx-auto flex max-w-4xl items-end gap-3">

                                    <textarea
                                        value={reply}
                                        onChange={(e) =>
                                            setReply(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your reply..."
                                        disabled={sendingReply}
                                        rows={3}
                                        className="
                                            min-h-[80px]
                                            flex-1
                                            resize-none
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-slate-50
                                            px-4
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-indigo-500
                                            focus:bg-white
                                            focus:ring-2
                                            focus:ring-indigo-100
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={handleReply}
                                        disabled={
                                            sendingReply ||
                                            !reply.trim()
                                        }
                                        className="
                                            flex
                                            h-11
                                            min-w-[120px]
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-indigo-600
                                            px-5
                                            text-sm
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-indigo-700
                                            active:scale-[0.98]
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-300
                                        "
                                    >
                                        {sendingReply ? (

                                            <span className="flex items-center gap-2">

                                                <span
                                                    className="
                                                        h-4
                                                        w-4
                                                        animate-spin
                                                        rounded-full
                                                        border-2
                                                        border-white/40
                                                        border-t-white
                                                    "
                                                />

                                                Sending...

                                            </span>

                                        ) : (
                                            "Send Reply"
                                        )}

                                    </button>

                                </div>

                                <p className="mx-auto mt-2 max-w-4xl text-[11px] text-slate-400">
                                    Press Enter to send · Shift + Enter
                                    for a new line
                                </p>

                            </div>

                        </>

                    )}

                </div>

            </div>

        </div>
    );
};

export default HelpSupport;