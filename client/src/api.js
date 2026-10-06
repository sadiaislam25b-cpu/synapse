export const TAGS = ["BCI", "Implants", "EEG", "Wearables", "Medical", "Imaging"];

async function request(path, options = {}) {
    const res = await fetch(`/api${path}`, {
        credentials: "include",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};

    if (!res.ok) {
        throw new Error(payload.error || `Request failed: ${res.status}`);
    }

    return payload;
}

async function get(path) {
    return request(path, { method: "GET" });
}

const withTag = (path, tag) =>
    tag && tag !== "All" ? `${path}?tag=${encodeURIComponent(tag)}` : path;

export const getNews = (tag) => get(withTag("/news", tag));
export const getPapers = (tag) => get(withTag("/papers", tag));
export const getCompanies = () => get("/companies");
export const searchAll = (q) => get(`/search?q=${encodeURIComponent(q)}`);

export const signup = (username, password) =>
    request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });

export const login = (username, password) =>
    request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });

export const logout = () => request("/auth/logout", { method: "POST" });
export const me = () => get("/auth/me");
export const getMySavedItems = () => get("/saves");
export const saveItem = (type, itemId) =>
    request("/saves", {
        method: "POST",
        body: JSON.stringify({ type, item_id: itemId }),
    });
export const unsaveItem = (type, itemId) =>
    request(`/saves/${type}/${itemId}`, { method: "DELETE" });