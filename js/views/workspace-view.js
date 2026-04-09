import { formatDateLabel, formatTimestamp, meetingDisplayName, workerStatusLabel } from "../core/formatters.js";
import { escapeHtml } from "../core/utils.js";
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

    const selectedDate = state.selectedDate || new Date().toISOString().slice(0, 10);

    return `
        <div class="badge-row">
            <span class="tiny-badge">${state.currentWorker.is_admin ? "관리자" : "작업자"}</span>
            <span class="tiny-badge">기준일 ${formatDateLabel(selectedDate)}</span>
            <button class="ghost-button compact" type="button" data-action="refresh-data">새로고침</button>
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
                    <p class="eyebrow">Daily Meeting Memo</p>
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
                <p class="eyebrow">Daily Meeting Memo</p>
                <div class="workspace-title-row">
                    <h2>${formatDateLabel(state.selectedDate || new Date().toISOString().slice(0, 10))}</h2>
                    <span class="status-badge">${escapeHtml(state.currentWorker.name)}</span>
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
        <section class="section-card">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Workers</p>
                    <h2>작업자 리스트</h2>
                </div>
            </div>
            <div class="worker-table">
                <div class="worker-table-head">
                    <span>순위</span>
                    <span>작업자</span>
                    <span style="text-align: center;">Scrum</span>
                    <span style="text-align: center;">Wrap</span>
                    <span style="text-align: center;">Emergency</span>
                </div>
                ${rows.length ? rows.map(({ worker, scrumDone, wrapDone, emergencyCount }) => `
                    <button class="worker-row ${worker.id === state.selectedWorkerId ? "is-active" : ""}" type="button" data-action="select-worker" data-worker-id="${escapeHtml(worker.id)}">
                        <span class="mono-value" style="width: 20px;">${worker.sort_order}</span>
                        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                            <div class="brand-mark" style="width: 32px; height: 32px; font-size: 14px; background: ${worker.id === state.selectedWorkerId ? "var(--white)" : "var(--gray-100)"}; color: ${worker.id === state.selectedWorkerId ? "var(--brand)" : "var(--gray-500)"};">
                                ${escapeHtml(worker.name.charAt(0))}
                            </div>
                            <strong style="font-size: 15px;">${escapeHtml(worker.name)}</strong>
                        </div>
                        <div style="width: 60px; text-align: center;">
                            ${scrumDone ? `<i class="fa-solid fa-circle-check" style="color: var(--brand);"></i>` : `<i class="fa-solid fa-circle" style="color: var(--gray-200);"></i>`}
                        </div>
                        <div style="width: 60px; text-align: center;">
                            ${wrapDone ? `<i class="fa-solid fa-circle-check" style="color: var(--brand);"></i>` : `<i class="fa-solid fa-circle" style="color: var(--gray-200);"></i>`}
                        </div>
                        <div style="width: 60px; text-align: center;">
                            <span class="tiny-badge" style="background: ${emergencyCount > 0 ? "var(--warn)" : "var(--gray-100)"}; color: ${emergencyCount > 0 ? "var(--white)" : "var(--gray-500)"}; border: none;">${emergencyCount}</span>
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
                    <p>좌측 리스트에서 작업자를 선택하여 상세 내용을 확인하세요.</p>
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
                        <article class="session-card">
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
            <section class="section-card">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">Empty Date</p>
                        <h2>선택한 날짜에 미팅 세션이 없습니다.</h2>
                    </div>
                </div>
                <p class="section-note">관리자는 기본 미팅 생성 버튼으로 시작미팅/종료미팅 세션을 만들 수 있습니다.</p>
                ${state.currentWorker.is_admin ? `<button class="action-button" type="button" data-action="create-default-sessions" data-date="${escapeHtml(state.selectedDate || new Date().toISOString().slice(0, 10))}">기본 미팅 생성</button>` : ""}
            </section>
            ${renderAdminWorkerSection(state)}
        `;
        return;
    }

    container.innerHTML = `
        <div class="workspace-grid wide">
            ${errorBlock}
            ${renderWorkerList(state)}
            ${renderSessionCards(state)}
            ${renderAdminWorkerSection(state)}
        </div>
    `;
}
