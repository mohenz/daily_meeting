import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
    DEFECT_MANAGE_SUPABASE_PUBLISHABLE_KEY,
    DEFECT_MANAGE_SUPABASE_URL
} from "../config/linked-apps-config.js";
import { normalizeEmail } from "../core/utils.js";

const defectManageSupabase = createClient(
    DEFECT_MANAGE_SUPABASE_URL,
    DEFECT_MANAGE_SUPABASE_PUBLISHABLE_KEY
);

const DEFECT_MANAGE_USER_COLUMNS = "user_id, email, password, name, department, role, status, needs_password_reset, created_at, updated_at";

export async function fetchDefectManageUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }

    const result = await defectManageSupabase
        .from("users")
        .select(DEFECT_MANAGE_USER_COLUMNS)
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (result.error && result.error.code !== "PGRST116") {
        throw new Error(result.error.message);
    }

    return result.data || null;
}

export function isDefectManageUserActive(user) {
    return user?.status === "사용";
}

export function mapDefectManageUserToRoleName(user) {
    const department = String(user?.department || "").trim();
    const role = String(user?.role || "").trim();

    if (department && role) {
        return `${department} / ${role}`;
    }

    return department || role || null;
}
