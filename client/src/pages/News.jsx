import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TagChips from "../components/TagChips";
import { NewsItem } from "../components/Items";
import { getNews } from "../api";
import { useAuth } from "../context/AuthContext";

export default function News() {
    const [tag, setTag] = useState("All");
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState("loading");
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isSaved, toggleSaved } = useAuth();

    useEffect(() => {
        setStatus("loading");
        getNews(tag)
            .then((data) => { setItems(data); setStatus("ready"); })
            .catch(() => setStatus("error"));
    }, [tag]);

    const handleToggle = async (item) => {
        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }

        await toggleSaved("article", item.id);
    };

    return (
        <>
            <h2>News</h2>
            <p className="sub">Recent neurotech stories, newest first. Filter by what you follow.</p>
            <TagChips active={tag} onChange={setTag} />

            {status === "loading" && <p className="empty">Loading news…</p>}
            {status === "error" && <p className="empty">Couldn't load news. Make sure the server is running.</p>}
            {status === "ready" && items.length === 0 && (
                <p className="empty">No stories tagged {tag} yet. Try another field.</p>
            )}

            <ul className="list">
                {items.map((item) => (
                    <NewsItem
                        key={item.id}
                        item={item}
                        saved={isSaved("article", item.id)}
                        onToggle={() => handleToggle(item)}
                    />
                ))}
            </ul>
        </>
    );
}