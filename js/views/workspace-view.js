import { formatDateLabel, formatTimestamp, meetingDisplayName, workerStatusLabel } from "../core/formatters.js";
import { getWorkerEmoji } from "../core/worker-emoji.js";
import { escapeHtml, todayKey } from "../core/utils.js";
import {
    canEditWorkerNotes,
    getAllWorkersSorted,
    getSelectedDateSessions,
    getSelectedWorker,
    getWorkerRowsForSelectedDate
} from "../state/app-state.js";

function renderHeaderActions(state) {
    if (!state.currentWorker) {
        return "";
    }

    const selectedDate = state.selectedDate || todayKey();

    return `
        <div class="badge-row">
            ${state.currentWorker.is_admin ? `<button class="ghost-button compact" type="button" data-action="create-default-sessions" data-date="${escapeHtml(selectedDate)}">기본 미팅 생성</button>` : ""}
            ${state.currentWorker.is_admin && state.selectedDate ? `<button class="ghost-button compact" type="button" data-action="open-emergency-modal">긴급 미팅 추가</button>` : ""}
            ${state.currentWorker.is_admin ? `<button class="ghost-button compact" type="button" data-action="open-worker-modal">작업자 등록</button>` : ""}
        </div>
    `;
}

export function renderWorkspaceHeader(container, state, dateGroups) {
    if (!state.currentWorker) {
        container.innerHTML = `
            <section class="workspace-topbar">
                <div class="workspace-title">
                    <h2>로그인 필요</h2>
                    <p>이메일과 비밀번호로 로그인하거나 새 계정을 생성해 데일리 미팅 메모를 사용할 수 있습니다.</p>
                </div>
            </section>
        `;
        return;
    }

    const selectedDateGroup = dateGroups.find((group) => group.date === state.selectedDate);

    container.innerHTML = `
        <section class="workspace-topbar">
            <div class="workspace-title">
                <div class="workspace-title-row">
                    <h2>${formatDateLabel(state.selectedDate || todayKey())}</h2>
                </div>
                <p>작업자별로 시작미팅, 종료미팅, 긴급미팅 메모를 등록하고 확인합니다.</p>
            </div>
            <div class="workspace-controls">
                ${renderHeaderActions(state)}
                <div class="badge-row">
                    <span class="accent-badge">등록 날짜 ${dateGroups.length}</span>
                    <span class="accent-badge">Scrum ${selectedDateGroup?.scrumCount || 0}</span>
                    <span class="accent-badge">Wrap-Up ${selectedDateGroup?.wrapUpCount || 0}</span>
                    <span class="accent-badge">Emergency ${selectedDateGroup?.emergencyCount || 0}</span>
                </div>
            </div>
        </section>
    `;
}

function renderWorkerList(state) {
    const rows = getWorkerRowsForSelectedDate();

    return `
        <section class="section-card workers-section">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Workers</p>
                    <h2>작업자 리스트</h2>
                </div>
            </div>
            <div class="worker-card-strip">
                ${rows.length ? rows.map(({ worker, scrumDone, wrapDone, emergencyCount }) => `
                    <button class="worker-panel ${worker.id === state.selectedWorkerId ? "is-active" : ""}" type="button" data-action="select-worker" data-worker-id="${escapeHtml(worker.id)}">
                        <div class="worker-panel-top">
                            <span class="tiny-badge worker-order-badge">순위 ${worker.sort_order}</span>
                            <div class="brand-mark worker-panel-mark" style="background: ${worker.id === state.selectedWorkerId ? "var(--black)" : "var(--gray-100)"}; color: ${worker.id === state.selectedWorkerId ? "var(--white)" : "var(--gray-500)"};">
                                ${escapeHtml(getWorkerEmoji(worker))}
                            </div>
                        </div>
                        <div class="worker-panel-body">
                            <strong class="worker-panel-name">${escapeHtml(worker.name)}</strong>
                            <p class="worker-panel-role">${escapeHtml(worker.role_name || "작업자")}</p>
                        </div>
                        <div class="worker-stat-row">
                            <span class="worker-stat-chip ${scrumDone ? "is-done" : ""}">
                                <span>Scrum</span>
                                <strong>${scrumDone ? "완료" : "미등록"}</strong>
                            </span>
                            <span class="worker-stat-chip ${wrapDone ? "is-done" : ""}">
                                <span>Wrap</span>
                                <strong>${wrapDone ? "완료" : "미등록"}</strong>
                            </span>
                            <span class="worker-stat-chip ${emergencyCount > 0 ? "is-warn" : ""}">
                                <span>Emergency</span>
                                <strong>${emergencyCount}</strong>
                            </span>
                        </div>
                    </button>
                `).join("") : `<div class="empty-card"><p>활성 작업자가 없습니다.</p></div>`}
            </div>
        </section>
    `;
}

function renderNoteContent(text) {
    return text ? escapeHtml(text) : "<span class=\"placeholder-text\">등록된 내용이 없습니다.</span>";
}

function renderSessionCards(state) {
    const worker = getSelectedWorker();
    const sessions = getSelectedDateSessions();

    if (!worker) {
        return `
            <section class="section-card">
                <div class="empty-card">
                    <p>상단 작업자 카드에서 작업자를 선택하여 상세 내용을 확인하세요.</p>
                </div>
            </section>
        `;
    }

    return `
        <section class="section-card">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Worker Detail</p>
                    <h2>${escapeHtml(worker.name)} <span style="font-weight: 400; color: var(--gray-400); font-size: 0.7em; margin-left: 8px;">(${escapeHtml(worker.role_name || "작업자")})</span></h2>
                </div>
                <div class="card-actions">
                    ${state.currentWorker?.is_admin ? `<button class="action-button secondary compact" type="button" data-action="open-worker-modal" data-worker-id="${escapeHtml(worker.id)}">작업자 정보 수정</button>` : ""}
                </div>
            </div>
            <div class="session-grid">
                ${sessions.length ? sessions.map((session) => {
                    const note = state.notes.find((item) => item.meeting_session_id === session.id && item.worker_id === worker.id) || null;
                    const editable = canEditWorkerNotes(worker.id);
                    return `
                        <article
                            class="session-card is-clickable"
                            tabindex="0"
                            role="button"
                            data-action="open-note-preview"
                            data-session-id="${escapeHtml(session.id)}"
                            data-worker-id="${escapeHtml(worker.id)}"
                            aria-label="${escapeHtml(`${meetingDisplayName(session)} 전체 내용 보기`)}"
                        >
                            <div class="card-header" style="margin-bottom: 20px; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <h3 class="card-title">${escapeHtml(meetingDisplayName(session))}</h3>
                                    <p class="meta-inline"><i class="fa-regular fa-clock"></i> ${formatTimestamp(note?.updated_at || session.updated_at)}</p>
                                </div>
                                <div class="card-actions" style="flex-shrink: 0;">
                                    ${editable ? `<button class="action-button compact" type="button" data-action="open-note-modal" data-session-id="${escapeHtml(session.id)}" data-worker-id="${escapeHtml(worker.id)}">${note ? "수정" : "등록"}</button>` : ""}
                                    ${state.currentWorker?.is_admin && note ? `<button class="icon-button" style="border-color: var(--danger); color: var(--danger);" type="button" data-action="delete-note" data-note-id="${escapeHtml(note.id)}"><i class="fa-solid fa-trash-can"></i></button>` : ""}
                                </div>
                            </div>
                            <div class="content-stack" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                                <div class="content-block">
                                    <p class="mono-label">진행완료</p>
                                    <p>${renderNoteContent(note?.completed_work)}</p>
                                </div>
                                <div class="content-block">
                                    <p class="mono-label">진행중</p>
                                    <p>${renderNoteContent(note?.in_progress_work)}</p>
                                </div>
                                <div class="content-block">
                                    <p class="mono-label">예정작업</p>
                                    <p>${renderNoteContent(note?.planned_work)}</p>
                                </div>
                                <div class="content-block" style="border-left: 2px solid ${note?.issues ? "var(--danger)" : "var(--border-subtle)"};">
                                    <p class="mono-label">이슈/리스크</p>
                                    <p>${renderNoteContent(note?.issues)}</p>
                                </div>
                            </div>
                        </article>
                    `;
                }).join("") : `<div class="empty-card"><p>해당 일자에 생성된 미팅 세션이 없습니다.</p></div>`}
            </div>
        </section>
    `;
}

function renderAdminWorkerSection(state) {
    if (!state.currentWorker?.is_admin) {
        return "";
    }

    const workers = getAllWorkersSorted();

    return `
        <section class="section-card">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Admin</p>
                    <h2>작업자 관리</h2>
                </div>
                <button class="action-button secondary compact" type="button" data-action="open-worker-modal">작업자 등록</button>
            </div>
            <div class="admin-worker-table">
                <div class="worker-table-head admin">
                    <span>순위</span>
                    <span>이름</span>
                    <span>이메일</span>
                    <span>역할</span>
                    <span>상태</span>
                    <span>관리자</span>
                    <span>수정</span>
                </div>
                ${workers.map((worker) => `
                    <div class="worker-row admin">
                        <span>${worker.sort_order}</span>
                        <span>${escapeHtml(worker.name)}</span>
                        <span>${escapeHtml(worker.email || "-")}</span>
                        <span>${escapeHtml(worker.role_name || "-")}</span>
                        <span>${workerStatusLabel(worker.status)}</span>
                        <span>${worker.is_admin ? "Y" : "N"}</span>
                        <span><button class="inline-action" type="button" data-action="open-worker-modal" data-worker-id="${escapeHtml(worker.id)}">수정</button></span>
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

export function renderWorkspaceBody(container, state) {
    if (!state.currentWorker) {
        container.innerHTML = "";
        return;
    }

    const errorBlock = state.error ? `
        <section class="section-card error-card">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Error</p>
                    <h2>처리 중 오류가 발생했습니다.</h2>
                </div>
            </div>
            <p class="section-note">${escapeHtml(state.error)}</p>
        </section>
    ` : "";

    if (!getSelectedDateSessions().length) {
        container.innerHTML = `
            ${errorBlock}
            <div class="workspace-stack">
                <section class="section-card">
                    <div class="section-heading">
                        <div>
                            <p class="eyebrow">Empty Date</p>
                            <h2>선택한 날짜에 미팅 세션이 없습니다.</h2>
                        </div>
                    </div>
                    <p class="section-note">관리자는 기본 미팅 생성 버튼으로 시작미팅/종료미팅 세션을 만들 수 있습니다.</p>
                    ${state.currentWorker.is_admin ? `<button class="action-button" type="button" data-action="create-default-sessions" data-date="${escapeHtml(state.selectedDate || todayKey())}">기본 미팅 생성</button>` : ""}
                </section>
                ${renderAdminWorkerSection(state)}
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="workspace-grid wide">
            ${errorBlock}
            ${renderWorkerList(state)}
            <div class="workspace-stack">
                ${renderSessionCards(state)}
                ${renderAdminWorkerSection(state)}
            </div>
        </div>
    `;
}
