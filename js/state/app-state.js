import { maxDate, todayKey, uniqueBy } from "../core/utils.js";

const SESSION_ORDER = {
    "Daily Scrum": 1,
    "Daily Wrap-Up": 2,
    Emergency: 3
};

const state = {
    session: null,
    currentWorker: null,
    authMode: "login",
    workers: [],
    sessions: [],
    notes: [],
    selectedDate: "",
    selectedWorkerId: "",
    authMessage: "",
    loading: false,
    saving: false,
    error: ""
};

export function getState() {
    return state;
}

export function patchState(partial) {
    Object.assign(state, partial);
}

function noteMapBySessionId(notes) {
    return notes.reduce((accumulator, note) => {
        if (!accumulator.has(note.meeting_session_id)) {
            accumulator.set(note.meeting_session_id, []);
        }

        accumulator.get(note.meeting_session_id).push(note);
        return accumulator;
    }, new Map());
}

export function getDateGroups() {
    const bySessionId = noteMapBySessionId(state.notes);
    const grouped = new Map();

    state.sessions.forEach((session) => {
        if (!grouped.has(session.meeting_date)) {
            grouped.set(session.meeting_date, {
                date: session.meeting_date,
                sessions: [],
                scrumCount: 0,
                wrapUpCount: 0,
                emergencyCount: 0,
                lastUpdatedAt: ""
            });
        }

        const group = grouped.get(session.meeting_date);
        const sessionNotes = bySessionId.get(session.id) || [];
        const uniqueWorkers = uniqueBy(sessionNotes, (item) => item.worker_id).length;

        group.sessions.push(session);
        group.lastUpdatedAt = maxDate([
            group.lastUpdatedAt,
            session.updated_at,
            ...sessionNotes.map((item) => item.updated_at)
        ]);

        if (session.meeting_type === "Daily Scrum") {
            group.scrumCount = uniqueWorkers;
        } else if (session.meeting_type === "Daily Wrap-Up") {
            group.wrapUpCount = uniqueWorkers;
        } else if (session.meeting_type === "Emergency") {
            group.emergencyCount += 1;
        }
    });

    return Array.from(grouped.values()).sort((left, right) => right.date.localeCompare(left.date));
}

export function syncSelections() {
    const dateGroups = getDateGroups();
    const availableDates = dateGroups.map((group) => group.date);

    if (!availableDates.includes(state.selectedDate)) {
        state.selectedDate = availableDates[0] || "";
    }

    const availableWorkers = getVisibleWorkers();
    const availableWorkerIds = availableWorkers.map((worker) => worker.id);

    if (!availableWorkerIds.includes(state.selectedWorkerId)) {
        state.selectedWorkerId = availableWorkerIds[0] || "";
    }

    if (!state.selectedDate && state.currentWorker?.is_admin) {
        state.selectedDate = todayKey();
    }
}

export function getVisibleWorkers() {
    return state.workers
        .filter((worker) => worker.status === "active")
        .sort((left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name, "ko"));
}

export function getAllWorkersSorted() {
    return [...state.workers].sort((left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name, "ko"));
}

export function getSelectedDateSessions() {
    return state.sessions
        .filter((session) => session.meeting_date === state.selectedDate)
        .sort((left, right) => {
            const leftOrder = SESSION_ORDER[left.meeting_type] || 99;
            const rightOrder = SESSION_ORDER[right.meeting_type] || 99;
            if (leftOrder !== rightOrder) {
                return leftOrder - rightOrder;
            }

            return left.emergency_seq - right.emergency_seq;
        });
}

export function getSelectedWorker() {
    return state.workers.find((worker) => worker.id === state.selectedWorkerId) || null;
}

export function getSessionsForDate(date) {
    return state.sessions.filter((session) => session.meeting_date === date);
}

export function getNoteForSessionWorker(sessionId, workerId) {
    return state.notes.find((note) => note.meeting_session_id === sessionId && note.worker_id === workerId) || null;
}

export function getWorkerRowsForSelectedDate() {
    const sessions = getSelectedDateSessions();
    const workers = getVisibleWorkers();

    return workers.map((worker) => {
        const scrumSession = sessions.find((item) => item.meeting_type === "Daily Scrum");
        const wrapSession = sessions.find((item) => item.meeting_type === "Daily Wrap-Up");
        const emergencySessions = sessions.filter((item) => item.meeting_type === "Emergency");

        return {
            worker,
            scrumDone: Boolean(scrumSession && getNoteForSessionWorker(scrumSession.id, worker.id)),
            wrapDone: Boolean(wrapSession && getNoteForSessionWorker(wrapSession.id, worker.id)),
            emergencyCount: emergencySessions.filter((session) => getNoteForSessionWorker(session.id, worker.id)).length
        };
    });
}

export function canEditWorkerNotes(targetWorkerId) {
    return Boolean(state.currentWorker?.is_admin || state.currentWorker?.id === targetWorkerId);
}

export function nextEmergencySequence(date) {
    return getSessionsForDate(date)
        .filter((session) => session.meeting_type === "Emergency")
        .reduce((maximum, session) => Math.max(maximum, session.emergency_seq), 0) + 1;
}

export function resetForSession(session) {
    state.session = session;
    state.currentWorker = null;
    state.workers = [];
    state.sessions = [];
    state.notes = [];
    state.selectedDate = "";
    state.selectedWorkerId = "";
    state.error = "";
}
