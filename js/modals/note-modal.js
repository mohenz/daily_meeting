import { escapeHtml } from "../core/utils.js";
import { meetingDisplayName } from "../core/formatters.js";

export function createNoteModal({ worker, session, note, onSubmit, onComplete }) {
    return {
        eyebrow: "Meeting Note",
        title: `${worker.name} / ${meetingDisplayName(session)}`,
        copy: "진행완료, 진행중, 진행예정, 이슈사항을 기록합니다.",
        render() {
            return `
                <div class="form-grid">
                    <label class="field-block full">
                        <span><i class="fa-solid fa-check-double"></i> 진행완료작업</span>
                        <textarea name="completed_work" placeholder="완료한 작업을 입력하세요.">${escapeHtml(note?.completed_work || "")}</textarea>
                    </label>
                    <label class="field-block full">
                        <span><i class="fa-solid fa-spinner"></i> 진행중인작업</span>
                        <textarea name="in_progress_work" placeholder="진행중인 작업을 입력하세요.">${escapeHtml(note?.in_progress_work || "")}</textarea>
                    </label>
                    <label class="field-block full">
                        <span><i class="fa-solid fa-calendar-plus"></i> 진행예정인작업</span>
                        <textarea name="planned_work" placeholder="다음 작업을 입력하세요.">${escapeHtml(note?.planned_work || "")}</textarea>
                    </label>
                    <label class="field-block full">
                        <span><i class="fa-solid fa-triangle-exclamation"></i> 이슈사항</span>
                        <textarea name="issues" placeholder="이슈사항을 입력하세요.">${escapeHtml(note?.issues || "")}</textarea>
                    </label>
                </div>
                <p class="form-error" data-role="modal-error"></p>
                <div class="modal-actions">
                    <button class="ghost-button" type="button" data-action="close-modal">취소</button>
                    <button class="modal-submit" data-role="modal-submit" type="submit">${note ? "수정" : "등록"}</button>
                </div>
            `;
        },
        onSubmit(_form, formData) {
            return onSubmit({
                id: note?.id || "",
                meeting_session_id: session.id,
                worker_id: worker.id,
                completed_work: formData.get("completed_work")?.toString().trim() || "",
                in_progress_work: formData.get("in_progress_work")?.toString().trim() || "",
                planned_work: formData.get("planned_work")?.toString().trim() || "",
                issues: formData.get("issues")?.toString().trim() || ""
            });
        },
        onComplete
    };
}
