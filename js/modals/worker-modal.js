import { escapeHtml } from "../core/utils.js";

export function createWorkerModal({ worker, onSubmit, onComplete }) {
    return {
        eyebrow: "Worker Profile",
        title: worker ? "작업자 수정" : "작업자 등록",
        copy: "관리자는 작업자명, 이메일, 역할, 관리자 여부, 상태, 정렬순위와 초기 비밀번호를 관리합니다.",
        render() {
            return `
                <div class="form-grid">
                    <label class="field-block">
                        <span><i class="fa-solid fa-user"></i> 작업자명</span>
                        <input name="name" type="text" value="${escapeHtml(worker?.name || "")}" required>
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-envelope"></i> 이메일</span>
                        <input name="email" type="email" value="${escapeHtml(worker?.email || "")}" required placeholder="name@example.com">
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-briefcase"></i> 역할명</span>
                        <input name="role_name" type="text" value="${escapeHtml(worker?.role_name || "")}" placeholder="예: PM, QA, Backend">
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-toggle-on"></i> 상태</span>
                        <select name="status">
                            <option value="active" ${worker?.status !== "inactive" ? "selected" : ""}>활성</option>
                            <option value="inactive" ${worker?.status === "inactive" ? "selected" : ""}>비활성</option>
                        </select>
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-sort"></i> 정렬순위</span>
                        <input name="sort_order" type="number" min="0" value="${escapeHtml(String(worker?.sort_order ?? 100))}" required>
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-key"></i> ${worker ? "새 비밀번호" : "초기 비밀번호"}</span>
                        <input name="password" type="password" minlength="6" placeholder="${worker ? "입력 시 비밀번호 재설정" : "6자 이상 입력"}">
                    </label>
                    <label class="field-block">
                        <span><i class="fa-solid fa-key"></i> 비밀번호 확인</span>
                        <input name="password_confirm" type="password" minlength="6" placeholder="비밀번호를 다시 입력하세요">
                    </label>
                    <label class="checkbox-field full">
                        <input name="is_admin" type="checkbox" ${worker?.is_admin ? "checked" : ""}>
                        <span><i class="fa-solid fa-shield-halved"></i> 관리자로 지정</span>
                    </label>
                </div>
                <p class="form-error" data-role="modal-error"></p>
                <div class="modal-actions">
                    <button class="ghost-button" type="button" data-action="close-modal">취소</button>
                    <button class="modal-submit" data-role="modal-submit" type="submit">${worker ? "수정" : "등록"}</button>
                </div>
            `;
        },
        onSubmit(form, formData) {
            return onSubmit({
                id: worker?.id || "",
                name: formData.get("name")?.toString().trim() || "",
                email: formData.get("email")?.toString().trim() || "",
                role_name: formData.get("role_name")?.toString().trim() || "",
                status: formData.get("status")?.toString() || "active",
                sort_order: formData.get("sort_order")?.toString() || "100",
                is_admin: form.elements.namedItem("is_admin")?.checked || false,
                password: formData.get("password")?.toString() || "",
                password_confirm: formData.get("password_confirm")?.toString() || ""
            });
        },
        onComplete
    };
}
