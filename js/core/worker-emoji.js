const WORKER_EMOJI_STORAGE_KEY = "daily_meeting_worker_emoji_map";

const WORKER_EMOJI_OPTIONS = [
    "😀", "😎", "🤖", "🦊", "🐼", "🐯", "🐻", "🐶",
    "🐱", "🐰", "🐸", "🐵", "🦄", "🐧", "🐙", "🦁",
    "🐷", "🐨", "🐬", "🦋", "🌟", "🔥", "⚡", "🍀"
];

const DEFAULT_WORKER_EMOJI = "😀";

function readWorkerEmojiMap() {
    try {
        const raw = window.localStorage.getItem(WORKER_EMOJI_STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
        return {};
    }
}

function writeWorkerEmojiMap(map) {
    window.localStorage.setItem(WORKER_EMOJI_STORAGE_KEY, JSON.stringify(map));
}

function isSupportedWorkerEmoji(value) {
    return WORKER_EMOJI_OPTIONS.includes(value);
}

export function getWorkerEmojiOptions() {
    return [...WORKER_EMOJI_OPTIONS];
}

export function getRandomWorkerEmoji() {
    if (window.crypto?.getRandomValues) {
        const buffer = new Uint32Array(1);
        window.crypto.getRandomValues(buffer);
        return WORKER_EMOJI_OPTIONS[buffer[0] % WORKER_EMOJI_OPTIONS.length];
    }

    return WORKER_EMOJI_OPTIONS[Math.floor(Math.random() * WORKER_EMOJI_OPTIONS.length)];
}

export function setWorkerEmoji(workerId, emoji) {
    if (!workerId) {
        return DEFAULT_WORKER_EMOJI;
    }

    const map = readWorkerEmojiMap();
    const normalized = isSupportedWorkerEmoji(emoji) ? emoji : DEFAULT_WORKER_EMOJI;
    map[workerId] = normalized;
    writeWorkerEmojiMap(map);
    return normalized;
}

export function getWorkerEmoji(worker) {
    if (isSupportedWorkerEmoji(worker?.avatar_emoji)) {
        return worker.avatar_emoji;
    }

    if (!worker?.id) {
        return DEFAULT_WORKER_EMOJI;
    }

    const map = readWorkerEmojiMap();
    if (isSupportedWorkerEmoji(map[worker.id])) {
        return map[worker.id];
    }

    const randomEmoji = getRandomWorkerEmoji();
    map[worker.id] = randomEmoji;
    writeWorkerEmojiMap(map);
    return randomEmoji;
}

export function initializeWorkerEmojis(workers = []) {
    if (!Array.isArray(workers) || !workers.length) {
        return;
    }

    const map = readWorkerEmojiMap();
    let updated = false;

    workers.forEach((worker) => {
        if (!worker?.id) {
            return;
        }

        if (isSupportedWorkerEmoji(worker.avatar_emoji)) {
            map[worker.id] = worker.avatar_emoji;
            updated = true;
            return;
        }

        if (!isSupportedWorkerEmoji(map[worker.id])) {
            map[worker.id] = getRandomWorkerEmoji();
            updated = true;
        }
    });

    if (updated) {
        writeWorkerEmojiMap(map);
    }
}
