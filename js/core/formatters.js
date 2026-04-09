const MEETING_LABELS = {
    "Daily Scrum": "시작미팅",
    "Daily Wrap-Up": "종료미팅",
    Emergency: "긴급미팅"
};

export function formatDateLabel(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function formatTimestamp(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return `${formatDateLabel(value)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function meetingTypeLabel(value) {
    return MEETING_LABELS[value] || value;
}

export function meetingDisplayName(session) {
    if (!session) {
        return "-";
    }

    if (session.meeting_type === "Emergency") {
        return `${meetingTypeLabel(session.meeting_type)} ${session.emergency_seq}`;
    }

    return meetingTypeLabel(session.meeting_type);
}

export function workerStatusLabel(status) {
    return status === "inactive" ? "비활성" : "활성";
}
