export function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

export function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function uniqueBy(items, selector) {
    const seen = new Set();
    return items.filter((item) => {
        const key = selector(item);
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

export function maxDate(values) {
    return values.reduce((latest, current) => {
        if (!current) {
            return latest;
        }

        if (!latest) {
            return current;
        }

        return new Date(current) > new Date(latest) ? current : latest;
    }, "");
}

export function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

export function normalizeEmail(value = "") {
    return String(value).trim().toLowerCase();
}
