import { renderAuthWorkspace, renderSessionPanel } from "./auth-view.js";
import { renderDateList } from "./sidebar-view.js";
import { renderWorkspaceBody, renderWorkspaceHeader } from "./workspace-view.js";
import { getDateGroups } from "../state/app-state.js";

export function renderAppView(elements, state) {
    const dateGroups = getDateGroups();

    renderSessionPanel(elements.sessionPanel, state);
    renderDateList(elements.dateList, elements.datePanelCopy, state, dateGroups);
    renderWorkspaceHeader(elements.workspaceHeader, state, dateGroups);

    if (!state.currentWorker) {
        renderAuthWorkspace(elements.workspaceBody, state);
        return;
    }

    renderWorkspaceBody(elements.workspaceBody, state);
}
