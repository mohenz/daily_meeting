import { supabase } from "./supabase-client.js";
import { mapDefectManageUserToRoleName } from "./defect-manage-user-service.js";
import { normalizeEmail, toNumber } from "../core/utils.js";

function ensureSuccess(result, fallbackMessage) {
    if (result.error) {
        throw new Error(result.error.message || fallbackMessage);
    }

    return result.data;
}

export async function fetchNextWorkerSortOrder() {
    const result = await supabase
        .from("worker_profiles")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message || "다음 작업자 순위를 계산하지 못했습니다.");
    }

    return Number(result.data?.sort_order ?? -1) + 1;
}

export async function fetchCurrentWorkerProfile(workerId) {
    if (!workerId) {
        return null;
    }

    const result = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("id", workerId)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message);
    }

    return result.data || null;
}

async function fetchWorkerProfileByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }

    const result = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message);
    }

    return result.data || null;
}

export async function fetchAppData({ includePrivateWorkerFields = false } = {}) {
    const workerColumns = includePrivateWorkerFields
        ? "id, name, email, role_name, is_admin, status, sort_order, password_updated_at, last_login_at, created_at, updated_at"
        : "id, name, role_name, is_admin, status, sort_order";

    const [workersResult, sessionsResult, notesResult] = await Promise.all([
        supabase.from("worker_profiles").select(workerColumns).order("sort_order", { ascending: true }).order("name", { ascending: true }),
        supabase.from("meeting_sessions").select("*").order("meeting_date", { ascending: false }).order("meeting_type", { ascending: true }).order("emergency_seq", { ascending: true }),
        supabase.from("meeting_notes").select("*").is("deleted_at", null).order("updated_at", { ascending: false })
    ]);

    return {
        workers: ensureSuccess(workersResult, "작업자 목록을 불러오지 못했습니다."),
        sessions: ensureSuccess(sessionsResult, "미팅 세션을 불러오지 못했습니다."),
        notes: ensureSuccess(notesResult, "미팅 메모를 불러오지 못했습니다.")
    };
}

export async function ensureDefaultDailyMeetings(meetingDate, actorWorkerId) {
    const payload = [
        {
            meeting_date: meetingDate,
            meeting_type: "Daily Scrum",
            emergency_seq: 0,
            title: "Daily Scrum",
            created_by_worker_id: actorWorkerId
        },
        {
            meeting_date: meetingDate,
            meeting_type: "Daily Wrap-Up",
            emergency_seq: 0,
            title: "Daily Wrap-Up",
            created_by_worker_id: actorWorkerId
        }
    ];

    const result = await supabase
        .from("meeting_sessions")
        .upsert(payload, {
            onConflict: "meeting_date,meeting_type,emergency_seq"
        })
        .select();

    return ensureSuccess(result, "기본 미팅 세션을 생성하지 못했습니다.");
}

export async function createEmergencyMeeting({ meetingDate, title, description, emergencySeq, actorWorkerId }) {
    const result = await supabase
        .from("meeting_sessions")
        .insert({
            meeting_date: meetingDate,
            meeting_type: "Emergency",
            emergency_seq: toNumber(emergencySeq, 1),
            title: title || `Emergency ${emergencySeq}`,
            description: description || "",
            created_by_worker_id: actorWorkerId
        })
        .select()
        .single();

    return ensureSuccess(result, "긴급 미팅을 생성하지 못했습니다.");
}

export async function saveMeetingNote(payload) {
    const normalized = {
        meeting_session_id: payload.meeting_session_id,
        worker_id: payload.worker_id,
        completed_work: payload.completed_work,
        in_progress_work: payload.in_progress_work,
        planned_work: payload.planned_work,
        issues: payload.issues,
        deleted_at: null
    };

    if (payload.id) {
        const result = await supabase
            .from("meeting_notes")
            .update(normalized)
            .eq("id", payload.id)
            .select()
            .single();

        return ensureSuccess(result, "미팅 메모를 수정하지 못했습니다.");
    }

    const result = await supabase
        .from("meeting_notes")
        .insert(normalized)
        .select()
        .single();

    return ensureSuccess(result, "미팅 메모를 등록하지 못했습니다.");
}

export async function softDeleteMeetingNote(noteId) {
    const result = await supabase
        .from("meeting_notes")
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq("id", noteId)
        .select()
        .single();

    return ensureSuccess(result, "미팅 메모를 삭제하지 못했습니다.");
}

export async function saveWorkerProfile(payload) {
    const normalized = {
        name: payload.name,
        email: normalizeEmail(payload.email),
        role_name: payload.role_name,
        is_admin: payload.is_admin,
        status: payload.status
    };

    if (payload.id) {
        normalized.sort_order = toNumber(payload.sort_order, 100);
    } else {
        const hasExplicitSortOrder = String(payload.sort_order ?? "").trim() !== "";
        normalized.sort_order = hasExplicitSortOrder
            ? toNumber(payload.sort_order, 100)
            : await fetchNextWorkerSortOrder();
    }

    if (payload.password_hash) {
        normalized.password_hash = payload.password_hash;
        normalized.password_updated_at = new Date().toISOString();
    }

    if (payload.id) {
        const result = await supabase
            .from("worker_profiles")
            .update(normalized)
            .eq("id", payload.id)
            .select()
            .single();

        return ensureSuccess(result, "작업자 정보를 수정하지 못했습니다.");
    }

    const result = await supabase
        .from("worker_profiles")
        .insert(normalized)
        .select()
        .single();

    return ensureSuccess(result, "작업자를 등록하지 못했습니다.");
}

export async function upsertWorkerProfileFromDefectManageUser(user) {
    const normalizedEmail = normalizeEmail(user?.email);
    if (!normalizedEmail) {
        throw new Error("등록된 계정을 찾지 못했습니다.");
    }

    const existingWorker = await fetchWorkerProfileByEmail(normalizedEmail);
    const now = new Date().toISOString();
    const nextSortOrder = existingWorker ? existingWorker.sort_order : await fetchNextWorkerSortOrder();
    const passwordHash = String(user?.password || "").trim();
    const normalized = {
        name: String(user?.name || "").trim() || normalizedEmail,
        email: normalizedEmail,
        role_name: mapDefectManageUserToRoleName(user),
        is_admin: user?.role === "관리자",
        status: user?.status === "사용" ? "active" : "inactive",
        sort_order: nextSortOrder
    };

    if (passwordHash && passwordHash !== existingWorker?.password_hash) {
        normalized.password_hash = passwordHash;
        normalized.password_updated_at = now;
    }

    if (existingWorker) {
        const result = await supabase
            .from("worker_profiles")
            .update(normalized)
            .eq("id", existingWorker.id)
            .select()
            .single();

        return ensureSuccess(result, "Defect Manage 사용자 정보를 동기화하지 못했습니다.");
    }

    const result = await supabase
        .from("worker_profiles")
        .insert({
            ...normalized,
            password_hash: passwordHash || null,
            password_updated_at: passwordHash ? now : null
        })
        .select()
        .single();

    return ensureSuccess(result, "Defect Manage 사용자 정보를 등록하지 못했습니다.");
}
