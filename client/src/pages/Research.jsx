import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TagChips from "../components/TagChips";
import { PaperItem } from "../components/Items";
import { getPapers } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Research() {
    const [tag, setTag] = useState("All");
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState("loading");
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isSaved, toggleSaved } = useAuth();

    useEffect(() => {
        setStatus("loading");
        getPapers(tag)
            .then((data) => { setItems(data); setStatus("ready"); })
            .catch(() => setStatus("error"));
    }, [tag]);

    const handleToggle = async (item) => {
        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }

        await toggleSaved("paper", item.id);
    };

    return (
        <>
            <h2>Research</h2>
            <p className="sub">New papers from PubMed and arXiv, newest first.</p>
            <TagChips active={tag} onChange={setTag} />

            {status === "loading" && <p className="empty">Loading papers…</p>}
            {status === "error" && <p className="empty">Couldn't load papers. Make sure the server is running.</p>}
            {status === "ready" && items.length === 0 && (
                <p className="empty">No papers tagged {tag} yet. Try another field.</p>
            )}

            <ul className="list">
                {items.map((item) => (
                    <PaperItem
                        key={item.id}
                        item={item}
                        saved={isSaved("paper", item.id)}
                        onToggle={() => handleToggle(item)}
                    />
                ))}
            </ul>
        </>
    );
}