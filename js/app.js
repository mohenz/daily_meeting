import { elements } from "./core/elements.js";
import { createModalManager } from "./core/modal-manager.js";
import { todayKey } from "./core/utils.js";
import {
    hashPassword,
    loginWithPassword,
    restoreSession,
    signOut,
    signUpWithPassword
} from "./services/auth-service.js";
import {
    createEmergencyMeeting,
    ensureDefaultDailyMeetings,
    fetchAppData,
    fetchCurrentWorkerProfile,
    saveMeetingNote,
    saveWorkerProfile,
    softDeleteMeetingNote
} from "./services/daily-meeting-service.js";
import {
    canEditWorkerNotes,
    getNoteForSessionWorker,
    getSelectedDateSessions,
    getState,
    nextEmergencySequence,
    patchState,
    resetForSession,
    syncSelections
} from "./state/app-state.js";
import { renderAppView } from "./views/index.js";
import { createNoteModal } from "./modals/note-modal.js";
import { createWorkerModal } from "./modals/worker-modal.js";
import { createEmergencyModal } from "./modals/session-modal.js";

const modalManager = createModalManager(elements);

function renderApp() {
    renderAppView(elements, getState());
}

function setError(message) {
    patchState({ error: message, authMessage: message, loading: false });
}

async function loadWorkerContext(session) {
    resetForSession(session);
    patchState({ loading: true, authMessage: "" });
    renderApp();

    if (!session) {
        patchState({
            loading: false,
            authMessage: "이메일과 비밀번호로 로그인하거나 새 계정을 생성해 주세요."
        });
        renderApp();
        return;
    }

    try {
        const currentWorker = await fetchCurrentWorkerProfile(session.workerId);
        if (!currentWorker || currentWorker.status !== "active") {
            await signOut();
            patchState({
                loading: false,
                session: null,
                currentWorker: null,
                authMessage: "로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요."
            });
            renderApp();
            return;
        }

        patchState({
            currentWorker,
            authMessage: "로그인되었습니다."
        });

        await refreshData();
    } catch (error) {
        patchState({
            loading: false,
            authMessage: error.message || "세션 정보를 확인하지 못했습니다."
        });
        renderApp();
    }
}

async function refreshData() {
    try {
        patchState({ loading: true, error: "" });
        const data = await fetchAppData({
            includePrivateWorkerFields: Boolean(getState().currentWorker?.is_admin)
        });
        patchState({
            workers: data.workers,
            sessions: data.sessions,
            notes: data.notes,
            loading: false
        });
        syncSelections();
    } catch (error) {
        patchState({
            loading: false,
            error: error.message || "데이터를 불러오지 못했습니다."
        });
    }

    renderApp();
}

async function handleAuthSubmit(form) {
    const state = getState();
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString() || "";
    const passwordConfirm = formData.get("password_confirm")?.toString() || "";

    try {
        patchState({
            loading: true,
            authMessage: state.authMode === "signup"
                ? "계정을 생성하고 있습니다."
                : "로그인하고 있습니다."
        });
        renderApp();

        const authResult = state.authMode === "signup"
            ? await signUpWithPassword({ name, email, password, passwordConfirm })
            : await loginWithPassword({ email, password });

        await loadWorkerContext(authResult.session);
    } catch (error) {
        patchState({
            loading: false,
            authMessage: error.message || "가입 처리에 실패했습니다."
        });
        renderApp();
    }
}

async function handleCreateDefaultSessions(date) {
    const state = getState();

    if (!state.currentWorker?.is_admin) {
        return;
    }

    try {
        await ensureDefaultDailyMeetings(date || todayKey(), state.currentWorker.id);
        patchState({ selectedDate: date || todayKey() });
        await refreshData();
    } catch (error) {
        patchState({ error: error.message || "기본 미팅 생성에 실패했습니다." });
        renderApp();
    }
}

function openNoteModal(sessionId, workerId) {
    const state = getState();
    const session = getSelectedDateSessions().find((item) => item.id === sessionId);
    const worker = state.workers.find((item) => item.id === workerId);

    if (!session || !worker || !canEditWorkerNotes(worker.id)) {
        return;
    }

    const note = getNoteForSessionWorker(session.id, worker.id);

    modalManager.openModal(createNoteModal({
        worker,
        session,
        note,
        async onSubmit(payload) {
            await saveMeetingNote(payload);
        },
        onComplete: refreshData
    }));
}

function openWorkerModal(workerId = "") {
    const state = getState();
    if (!state.currentWorker?.is_admin) {
        return;
    }

    const worker = state.workers.find((item) => item.id === workerId) || null;

    modalManager.openModal(createWorkerModal({
        worker,
        async onSubmit(payload) {
            const normalizedPayload = { ...payload };
            if (normalizedPayload.password) {
                if (normalizedPayload.password !== normalizedPayload.password_confirm) {
                    throw new Error("비밀번호 확인이 일치하지 않습니다.");
                }

                normalizedPayload.password_hash = await hashPassword(normalizedPayload.password);
            }

            delete normalizedPayload.password;
            delete normalizedPayload.password_confirm;

            await saveWorkerProfile(normalizedPayload);
        },
        onComplete: refreshData
    }));
}

function openEmergencyModal() {
    const state = getState();
    if (!state.currentWorker?.is_admin || !state.selectedDate) {
        return;
    }

    modalManager.openModal(createEmergencyModal({
        date: state.selectedDate,
        nextSeq: nextEmergencySequence(state.selectedDate),
        async onSubmit(payload) {
            await createEmergencyMeeting({
                ...payload,
                actorWorkerId: state.currentWorker.id
            });
        },
        onComplete: refreshData
    }));
}

async function handleDeleteNote(noteId) {
    const state = getState();
    if (!state.currentWorker?.is_admin) {
        return;
    }

    if (!window.confirm("이 미팅 메모를 삭제하시겠습니까?")) {
        return;
    }

    try {
        await softDeleteMeetingNote(noteId);
        await refreshData();
    } catch (error) {
        patchState({ error: error.message || "메모 삭제에 실패했습니다." });
        renderApp();
    }
}

function bindEvents() {
    document.body.addEventListener("click", async (event) => {
        const target = event.target.closest("[data-action]");
        if (!target) {
            return;
        }

        if (target.dataset.action === "close-modal") {
            modalManager.closeModal();
            return;
        }

        if (target.dataset.action === "sign-out") {
            await signOut();
            patchState({ authMode: "login" });
            await loadWorkerContext(null);
            return;
        }

        if (target.dataset.action === "set-auth-mode") {
            patchState({
                authMode: target.dataset.mode === "signup" ? "signup" : "login",
                authMessage: ""
            });
            renderApp();
            return;
        }

        if (target.dataset.action === "refresh-data") {
            await refreshData();
            return;
        }

        if (target.dataset.action === "select-date") {
            patchState({
                selectedDate: target.dataset.date || "",
                selectedWorkerId: getState().selectedWorkerId
            });
            syncSelections();
            renderApp();
            return;
        }

        if (target.dataset.action === "select-worker") {
            patchState({ selectedWorkerId: target.dataset.workerId || "" });
            renderApp();
            return;
        }

        if (target.dataset.action === "create-default-sessions") {
            await handleCreateDefaultSessions(target.dataset.date || todayKey());
            return;
        }

        if (target.dataset.action === "open-note-modal") {
            openNoteModal(target.dataset.sessionId || "", target.dataset.workerId || "");
            return;
        }

        if (target.dataset.action === "open-worker-modal") {
            openWorkerModal(target.dataset.workerId || "");
            return;
        }

        if (target.dataset.action === "open-emergency-modal") {
            openEmergencyModal();
            return;
        }

        if (target.dataset.action === "delete-note") {
            await handleDeleteNote(target.dataset.noteId || "");
        }
    });

    document.body.addEventListener("submit", async (event) => {
        const form = event.target;

        if (form.id === "authForm") {
            event.preventDefault();
            await handleAuthSubmit(form);
            return;
        }

        if (form.id === "modalForm") {
            event.preventDefault();
            await modalManager.handleSubmit();
        }
    });

    elements.modalBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.modalBackdrop) {
            modalManager.closeModal();
        }
    });
}

async function bootstrap() {
    bindEvents();

    const session = await restoreSession();
    await loadWorkerContext(session);
}

bootstrap().catch((error) => {
    setError(error.message || "앱 초기화에 실패했습니다.");
    renderApp();
});
