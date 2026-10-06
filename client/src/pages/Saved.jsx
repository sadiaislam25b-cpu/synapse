import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMySavedItems } from "../api";
import { NewsItem, PaperItem } from "../components/Items";
import { useAuth } from "../context/AuthContext";

export default function Saved() {
    const { user, isSaved, toggleSaved } = useAuth();
    const [savedItems, setSavedItems] = useState({ articles: [], papers: [] });
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        if (!user) {
            setStatus("logged-out");
            return;
        }

        setStatus("loading");
        getMySavedItems()
            .then((data) => {
                setSavedItems({ articles: data.articles || [], papers: data.papers || [] });
                setStatus("ready");
            })
            .catch(() => setStatus("error"));
    }, [user]);

    const combined = useMemo(
        () => [
            ...savedItems.articles.map((item) => ({ ...item, type: "article" })),
            ...savedItems.papers.map((item) => ({ ...item, type: "paper" })),
        ],
        [savedItems]
    );

    if (!user) {
        return (
            <div className="auth-panel">
                <h2>Saved</h2>
                <p className="empty">Log in to keep articles and papers you want to revisit.</p>
                <Link className="btn" to="/login">Log in</Link>
            </div>
        );
    }

    if (status === "loading") {
        return <p className="empty">Loading saved items…</p>;
    }

    if (status === "error") {
        return <p className="empty">We couldn’t load your saved items right now.</p>;
    }

    return (
        <>
            <h2>Saved</h2>
            <p className="sub">Everything you’ve bookmarked from the newsfeed and research desk.</p>

            {combined.length === 0 ? (
                <p className="empty">You haven’t saved any items yet. Tap the heart on a story or paper to save it here.</p>
            ) : (
                <ul className="list">
                    {combined.map((item) =>
                        item.type === "article" ? (
                            <NewsItem
                                key={`article-${item.id}`}
                                item={item}
                                saved={isSaved("article", item.id)}
                                onToggle={() => toggleSaved("article", item.id)}
                            />
                        ) : (
                            <PaperItem
                                key={`paper-${item.id}`}
                                item={item}
                                saved={isSaved("paper", item.id)}
                                onToggle={() => toggleSaved("paper", item.id)}
                            />
                        )
                    )}
                </ul>
            )}
        </>
    );
}
