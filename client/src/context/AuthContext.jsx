import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    getMySavedItems,
    login as apiLogin,
    logout as apiLogout,
    me,
    saveItem,
    signup as apiSignup,
    unsaveItem,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState({ articles: new Set(), papers: new Set() });

    const refreshUser = async () => {
        try {
            const data = await me();
            setUser(data.user);
            if (data.user) {
                const savedData = await getMySavedItems();
                setSaved({
                    articles: new Set(savedData.articles.map((item) => item.id)),
                    papers: new Set(savedData.papers.map((item) => item.id)),
                });
            } else {
                setSaved({ articles: new Set(), papers: new Set() });
            }
        } catch {
            setUser(null);
            setSaved({ articles: new Set(), papers: new Set() });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const isSaved = (type, itemId) => {
        if (!itemId) return false;
        const key = type === "article" ? "articles" : "papers";
        return saved[key].has(Number(itemId));
    };

    const refreshSaved = async () => {
        if (!user) {
            setSaved({ articles: new Set(), papers: new Set() });
            return;
        }

        const data = await getMySavedItems();
        setSaved({
            articles: new Set(data.articles.map((item) => item.id)),
            papers: new Set(data.papers.map((item) => item.id)),
        });
    };

    const toggleSaved = async (type, itemId) => {
        if (!user) {
            return false;
        }

        const normalizedType = type === "article" ? "article" : "paper";
        const id = Number(itemId);
        const alreadySaved = isSaved(normalizedType, id);

        if (alreadySaved) {
            await unsaveItem(normalizedType, id);
        } else {
            await saveItem(normalizedType, id);
        }

        await refreshSaved();
        return true;
    };

    const login = async (username, password) => {
        const data = await apiLogin(username, password);
        setUser(data.user);
        await refreshSaved();
        return data.user;
    };

    const signup = async (username, password) => {
        const data = await apiSignup(username, password);
        setUser(data.user);
        await refreshSaved();
        return data.user;
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
        setSaved({ articles: new Set(), papers: new Set() });
    };

    const value = useMemo(
        () => ({ user, loading, login, signup, logout, isSaved, toggleSaved, refreshSaved }),
        [user, loading, saved]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
