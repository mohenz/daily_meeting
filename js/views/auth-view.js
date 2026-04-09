import { escapeHtml } from "../core/utils.js";

function renderModeButton(mode, currentMode, label) {
    if (mode === currentMode) {
        return `<button class="action-button compact" type="button" data-action="set-auth-mode" data-mode="${mode}">${label}</button>`;
    }

    return `<button class="ghost-button compact" type="button" data-action="set-auth-mode" data-mode="${mode}">${label}</button>`;
}

export function renderSessionPanel(container, state) {
    const { currentWorker, authMessage, authMode, session } = state;

    if (!currentWorker) {
        container.innerHTML = `
            <div class="panel-header">
                <h2>${authMode === "signup" ? "회원가입" : "로그인"}</h2>
            </div>
            <p class="panel-copy">이메일과 비밀번호로 로그인하거나, 새 계정을 생성해 바로 사용할 수 있습니다.</p>
            <div class="badge-row" style="margin-bottom: 12px;">
                ${renderModeButton("login", authMode, "로그인")}
                ${renderModeButton("signup", authMode, "회원가입")}
            </div>
            <form id="authForm" class="inline-form">
                ${authMode === "signup" ? `
                    <label class="field-block">
                        <span>이름</span>
                        <input name="name" type="text" required autocomplete="name" placeholder="홍길동">
                    </label>
                ` : ""}
                <label class="field-block">
                    <span>이메일</span>
                    <input name="email" type="email" required autocomplete="email" placeholder="name@example.com">
                </label>
                <label class="field-block">
                    <span>비밀번호</span>
                    <input name="password" type="password" required autocomplete="${authMode === "signup" ? "new-password" : "current-password"}" placeholder="6자 이상 입력">
                </label>
                ${authMode === "signup" ? `
                    <label class="field-block">
                        <span>비밀번호 확인</span>
                        <input name="password_confirm" type="password" required autocomplete="new-password" placeholder="비밀번호를 다시 입력하세요">
                    </label>
                ` : ""}
                <button class="action-button" type="submit">${authMode === "signup" ? "가입 후 시작" : "로그인"}</button>
            </form>
            <p class="helper-text">${escapeHtml(authMessage || (authMode === "signup"
                ? "관리자가 미리 등록한 이메일이면 초기 비밀번호 설정으로 연결됩니다."
                : "등록된 이메일과 비밀번호로 로그인하세요."))}</p>
        `;
        return;
    }

    container.innerHTML = `
        <div class="panel-header">
            <h2>세션</h2>
            <button class="ghost-button compact" type="button" data-action="sign-out">로그아웃</button>
        </div>
        <div class="session-card">
            <div class="info-line"><span>이메일</span><strong>${escapeHtml(currentWorker.email || session?.email || "-")}</strong></div>
            <div class="info-line"><span>권한</span><strong>${currentWorker?.is_admin ? "관리자" : "작업자"}</strong></div>
            <div class="info-line"><span>작업자명</span><strong>${escapeHtml(currentWorker?.name || "미연결")}</strong></div>
            <div class="info-line"><span>로그인 시각</span><strong>${escapeHtml(currentWorker?.last_login_at || session?.loggedAt || "-")}</strong></div>
        </div>
        <button class="action-button secondary compact" type="button" data-action="refresh-data">새로고침</button>
        <p class="helper-text">${escapeHtml(authMessage || "앱 세션이 유지되고 있습니다.")}</p>
    `;
}

export function renderAuthWorkspace(container, state) {
    container.innerHTML = `
        <div style="display: grid; place-items: center; min-height: 60vh;">
            <section class="section-card" style="max-width: 600px;">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">Account Access</p>
                        <h2>${state.authMode === "signup" ? "계정을 만들고 시작합니다." : "로그인 후 바로 시작합니다."}</h2>
                    </div>
                </div>
                <div class="content-stack" style="margin-top: 24px;">
                    <div class="content-block" style="display: flex; gap: 20px; align-items: flex-start; background: var(--bg-surface-alt);">
                        <div class="brand-mark" style="width: 40px; height: 40px; background: var(--brand); color: var(--white); font-size: 16px; flex-shrink: 0;">1</div>
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; font-size: 16px; color: var(--gray-900);">${state.authMode === "signup" ? "회원가입" : "로그인"}</p>
                            <p style="font-size: 14px; color: var(--gray-600);">좌측 패널에서 이메일과 비밀번호를 입력하세요. 회원가입 시 이름도 함께 등록합니다.</p>
                        </div>
                    </div>
                    <div class="content-block" style="display: flex; gap: 20px; align-items: flex-start;">
                        <div class="brand-mark" style="width: 40px; height: 40px; background: var(--gray-100); color: var(--gray-500); font-size: 16px; flex-shrink: 0;">2</div>
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; font-size: 16px; color: var(--gray-900);">날짜 선택</p>
                            <p style="font-size: 14px; color: var(--gray-600);">가입 후 생성된 미팅 날짜를 선택하여 데일리 스크럼 기록을 시작하세요.</p>
                        </div>
                    </div>
                    <div class="content-block" style="display: flex; gap: 20px; align-items: flex-start;">
                        <div class="brand-mark" style="width: 40px; height: 40px; background: var(--gray-100); color: var(--gray-500); font-size: 16px; flex-shrink: 0;">3</div>
                        <div>
                            <p style="font-weight: 700; margin-bottom: 4px; font-size: 16px; color: var(--gray-900);">상태 기록</p>
                            <p style="font-size: 14px; color: var(--gray-600);">진행 업무와 이슈 사항을 기록하고 동료들과 공유하세요.</p>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 32px; padding: 20px; background: var(--brand-soft); border: 1px dashed var(--brand);">
                    <p style="font-size: 13px; color: var(--brand); text-align: center; margin: 0; font-weight: 500;">
                        <i class="fa-solid fa-lock" style="margin-right: 6px;"></i> 현재 단계는 앱 내부 사용자 관리 방식이며, 플랫폼 확장 시 Supabase Auth + RLS를 별도 도입합니다.
                    </p>
                </div>
            </section>
        </div>
    `;
}
