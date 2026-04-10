import { formatTimestamp, meetingDisplayName } from "../core/formatters.js";
import { escapeHtml } from "../core/utils.js";

function renderPreviewText(value) {
    const normalized = String(value || "").trim();
    if (!normalized) {
        return "<span class=\"placeholder-text\">등록된 내용이 없습니다.</span>";
    }

    return escapeHtml(normalized).replaceAll("\n", "<br>");
}

export function createNotePreviewModal({ worker, session, note, editable }) {
    return {
        eyebrow: "Meeting Detail",
        title: `${worker.name} / ${meetingDisplayName(session)}`,
        copy: `최종 변경 ${formatTimestamp(note?.updated_at || session.updated_at)}`,
        render() {
            return `
                <div class="modal-note-grid">
                    <div class="content-block">
                        <p class="mono-label">진행완료</p>
                        <p class="note-preview-text">${renderPreviewText(note?.completed_work)}</p>
                    </div>
                    <div class="content-block">
                        <p class="mono-label">진행중</p>
                        <p class="note-preview-text">${renderPreviewText(note?.in_progress_work)}</p>
                    </div>
                    <div class="content-block">
                        <p class="mono-label">예정작업</p>
                        <p class="note-preview-text">${renderPreviewText(note?.planned_work)}</p>
                    </div>
                    <div class="content-block">
                        <p class="mono-label">이슈/리스크</p>
                        <p class="note-preview-text">${renderPreviewText(note?.issues)}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="ghost-button" type="button" data-action="close-modal">닫기</button>
                    ${editable ? `<button class="action-button secondary" type="button" data-action="open-note-modal" data-session-id="${escapeHtml(session.id)}" data-worker-id="${escapeHtml(worker.id)}">${note ? "수정" : "등록"}</button>` : ""}
                </div>
            `;
        },
        onSubmit() {
            return Promise.resolve();
        }
    };
}
