import { supabase } from "./supabase-client.js";
import { normalizeEmail } from "../core/utils.js";

const SESSION_STORAGE_KEY = "daily_meeting_current_session";
const ACCOUNT_COLUMNS = "id, name, email, password_hash, role_name, is_admin, status, sort_order, password_updated_at, last_login_at, created_at, updated_at";

function mapAuthError(message) {
    if (message.includes("ACCOUNT_NOT_FOUND")) {
        return "등록된 계정을 찾지 못했습니다.";
    }

    if (message.includes("INACTIVE_ACCOUNT")) {
        return "비활성 계정입니다. 관리자에게 문의해 주세요.";
    }

    if (message.includes("PASSWORD_REQUIRED")) {
        return "비밀번호를 입력해 주세요.";
    }

    if (message.includes("PASSWORD_MIN_LENGTH")) {
        return "비밀번호는 6자 이상 입력해 주세요.";
    }

    if (message.includes("PASSWORD_CONFIRM_MISMATCH")) {
        return "비밀번호 확인이 일치하지 않습니다.";
    }

    if (message.includes("PASSWORD_NOT_SET")) {
        return "아직 비밀번호가 설정되지 않은 계정입니다. 회원가입으로 초기 비밀번호를 설정해 주세요.";
    }

    if (message.includes("INVALID_PASSWORD")) {
        return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }

    if (message.includes("DUPLICATE_EMAIL")) {
        return "이미 사용 중인 이메일입니다. 로그인해 주세요.";
    }

    if (message.includes("NAME_REQUIRED")) {
        return "이름을 입력해 주세요.";
    }

    if (message.includes("EMAIL_REQUIRED")) {
        return "이메일을 입력해 주세요.";
    }

    return message || "인증을 처리하지 못했습니다.";
}

function getBcrypt() {
    const bcrypt = window.dcodeIO?.bcrypt;
    if (!bcrypt) {
        throw new Error("bcryptjs 라이브러리를 로드하지 못했습니다.");
    }

    return bcrypt;
}

function buildSession(worker) {
    return {
        workerId: worker.id,
        email: worker.email,
        name: worker.name,
        isAdmin: Boolean(worker.is_admin),
        loggedAt: new Date().toISOString()
    };
}

function persistSession(worker) {
    const session = buildSession(worker);
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
}

function clearStoredSession() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function fetchWorkerByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error("EMAIL_REQUIRED");
    }

    const result = await supabase
        .from("worker_profiles")
        .select(ACCOUNT_COLUMNS)
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message);
    }

    return result.data || null;
}

async function fetchWorkerById(workerId) {
    if (!workerId) {
        return null;
    }

    const result = await supabase
        .from("worker_profiles")
        .select(ACCOUNT_COLUMNS)
        .eq("id", workerId)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message);
    }

    return result.data || null;
}

async function updateLastLogin(workerId) {
    const loginAt = new Date().toISOString();
    const result = await supabase
        .from("worker_profiles")
        .update({
            last_login_at: loginAt
        })
        .eq("id", workerId)
        .select("id, last_login_at")
        .single();

    if (result.error) {
        throw new Error(result.error.message || "로그인 시각을 저장하지 못했습니다.");
    }

    return result.data.last_login_at;
}

function validatePassword(password) {
    const normalized = String(password || "");
    if (!normalized.trim()) {
        throw new Error("PASSWORD_REQUIRED");
    }

    if (normalized.length < 6) {
        throw new Error("PASSWORD_MIN_LENGTH");
    }
}

export async function hashPassword(password) {
    validatePassword(password);
    const bcrypt = getBcrypt();
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

export async function restoreSession() {
    try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed?.workerId) {
            clearStoredSession();
            return null;
        }

        const worker = await fetchWorkerById(parsed.workerId);
        if (!worker || worker.status !== "active") {
            clearStoredSession();
            return null;
        }

        return persistSession(worker);
    } catch (error) {
        clearStoredSession();
        throw new Error(mapAuthError(error.message || ""));
    }
}

export async function loginWithPassword({ email, password }) {
    try {
        validatePassword(password);
        const worker = await fetchWorkerByEmail(email);

        if (!worker) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }

        if (worker.status !== "active") {
            throw new Error("INACTIVE_ACCOUNT");
        }

        if (!worker.password_hash) {
            throw new Error("PASSWORD_NOT_SET");
        }

        const bcrypt = getBcrypt();
        const isMatch = bcrypt.compareSync(password, worker.password_hash);
        if (!isMatch) {
            throw new Error("INVALID_PASSWORD");
        }

        const lastLoginAt = await updateLastLogin(worker.id);
        const session = persistSession({
            ...worker,
            last_login_at: lastLoginAt
        });

        return {
            session,
            worker: {
                ...worker,
                last_login_at: lastLoginAt
            }
        };
    } catch (error) {
        throw new Error(mapAuthError(error.message || ""));
    }
}

export async function signUpWithPassword({ name, email, password, passwordConfirm = "" }) {
    try {
        const normalizedName = String(name || "").trim();
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedName) {
            throw new Error("NAME_REQUIRED");
        }

        if (!normalizedEmail) {
            throw new Error("EMAIL_REQUIRED");
        }

        validatePassword(password);
        if (password !== passwordConfirm) {
            throw new Error("PASSWORD_CONFIRM_MISMATCH");
        }

        const hashedPassword = await hashPassword(password);
        const now = new Date().toISOString();
        const existingWorker = await fetchWorkerByEmail(normalizedEmail);
        let worker;

        if (existingWorker) {
            if (existingWorker.status !== "active") {
                throw new Error("INACTIVE_ACCOUNT");
            }

            if (existingWorker.password_hash) {
                throw new Error("DUPLICATE_EMAIL");
            }

            const updateResult = await supabase
                .from("worker_profiles")
                .update({
                    name: normalizedName,
                    email: normalizedEmail,
                    password_hash: hashedPassword,
                    password_updated_at: now,
                    last_login_at: now
                })
                .eq("id", existingWorker.id)
                .select(ACCOUNT_COLUMNS)
                .single();

            if (updateResult.error) {
                throw new Error(updateResult.error.message);
            }

            worker = updateResult.data;
        } else {
            const insertResult = await supabase
                .from("worker_profiles")
                .insert({
                    name: normalizedName,
                    email: normalizedEmail,
                    password_hash: hashedPassword,
                    role_name: null,
                    is_admin: false,
                    status: "active",
                    sort_order: 100,
                    password_updated_at: now,
                    last_login_at: now
                })
                .select(ACCOUNT_COLUMNS)
                .single();

            if (insertResult.error) {
                throw new Error(insertResult.error.message);
            }

            worker = insertResult.data;
        }

        const session = persistSession(worker);
        return {
            session,
            worker
        };
    } catch (error) {
        throw new Error(mapAuthError(error.message || ""));
    }
}

export async function signOut() {
    clearStoredSession();
}
