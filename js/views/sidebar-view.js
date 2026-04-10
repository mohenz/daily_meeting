import { formatDateLabel, formatTimestamp } from "../core/formatters.js";
import { escapeHtml, todayKey } from "../core/utils.js";

export function renderDateList(container, copyElement, state, dateGroups) {
    if (!state.currentWorker) {
        copyElement.textContent = "로그인 후 날짜 목록을 확인할 수 있습니다.";
        container.innerHTML = `<div class="empty-card"><p>로그인하거나 회원가입하면 데이터가 로드됩니다.</p></div>`;
        return;
    }

    if (!dateGroups.length) {
        copyElement.textContent = "생성된 미팅 날짜가 없습니다.";
        container.innerHTML = `
            <div class="empty-card">
                <p>아직 생성된 미팅 날짜가 없습니다.</p>
                ${state.currentWorker.is_admin ? `<button class="action-button compact" type="button" data-action="create-default-sessions" data-date="${escapeHtml(todayKey())}">오늘 기본 미팅 생성</button>` : ""}
            </div>
        `;
        return;
    }

    copyElement.textContent = "날짜를 클릭하면 해당 일자의 상세 현황을 확인합니다.";
    container.innerHTML = dateGroups.map((group) => `
        <button class="date-card ${group.date === state.selectedDate ? "is-active" : ""}" type="button" data-action="select-date" data-date="${escapeHtml(group.date)}">
            <div class="date-card-head">
                <strong class="date-card-title">${formatDateLabel(group.date)}</strong>
                <span class="date-card-meta">${formatTimestamp(group.lastUpdatedAt)}</span>
            </div>
            <div class="date-card-stats" style="display: flex; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-sun" style="font-size: 10px; color: ${group.scrumCount > 0 ? "var(--brand)" : "var(--gray-700)"};"></i>
                    <span style="${group.scrumCount > 0 ? "color: var(--gray-300);" : "color: var(--gray-700);"}">${group.scrumCount}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-moon" style="font-size: 10px; color: ${group.wrapUpCount > 0 ? "var(--info)" : "var(--gray-700)"};"></i>
                    <span style="${group.wrapUpCount > 0 ? "color: var(--gray-300);" : "color: var(--gray-700);"}">${group.wrapUpCount}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-bolt" style="font-size: 10px; color: ${group.emergencyCount > 0 ? "var(--warn)" : "var(--gray-700)"};"></i>
                    <span style="${group.emergencyCount > 0 ? "color: var(--gray-300);" : "color: var(--gray-700);"}">${group.emergencyCount}</span>
                </div>
            </div>
        </button>
    `).join("");
}
