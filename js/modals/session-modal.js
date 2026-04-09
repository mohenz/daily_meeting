import { escapeHtml } from "../core/utils.js";

export function createEmergencyModal({ date, nextSeq, onSubmit, onComplete }) {
    return {
        eyebrow: "Emergency Meeting",
        title: "긴급 미팅 추가",
        copy: `${date} 날짜에 Emergency ${nextSeq} 세션을 생성합니다.`,
        render() {
            return `
                <div class="form-grid">
                    <label class="field-block full">
                        <span>미팅명</span>
                        <input name="title" type="text" value="Emergency ${escapeHtml(String(nextSeq))}">
                    </label>
                    <label class="field-block full">
                        <span>설명</span>
                        <textarea name="description" placeholder="긴급 미팅 생성 사유를 입력하세요."></textarea>
                    </label>
                </div>
                <p class="form-error" data-role="modal-error"></p>
                <div class="modal-actions">
                    <button class="ghost-button" type="button" data-action="close-modal">취소</button>
                    <button class="modal-submit" data-role="modal-submit" type="submit">생성</button>
                </div>
            `;
        },
        onSubmit(_form, formData) {
            return onSubmit({
                meetingDate: date,
                emergencySeq: nextSeq,
                title: formData.get("title")?.toString().trim() || `Emergency ${nextSeq}`,
                description: formData.get("description")?.toString().trim() || ""
            });
        },
        onComplete
    };
}
