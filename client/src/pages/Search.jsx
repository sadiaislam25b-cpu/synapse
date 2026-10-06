import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { NewsItem, PaperItem, CompanyItem } from "../components/Items";
import { searchAll } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Search() {
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState(params.get("q") || "");
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isSaved, toggleSaved } = useAuth();

    useEffect(() => {
        const q = query.trim();
        if (!q) { setResults(null); return; }

        const timer = setTimeout(() => {
            setParams({ q }, { replace: true });
            searchAll(q)
                .then((data) => { setResults(data); setError(""); })
                .catch(() => setError("Search isn't working right now. Make sure the server is running."));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, setParams]);

    const handleToggle = async (type, item) => {
        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }

        await toggleSaved(type, item.id);
    };

    const total = results ? results.companies.length + results.news.length + results.papers.length : 0;

    return (
        <>
            <h2>Search</h2>
            <p className="sub">Search news, papers, and companies at once.</p>
            <input
                className="search-input"
                type="search"
                placeholder="Try “implant” or “EEG”"
                aria-label="Search everything"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />

            {error && <p className="empty">{error}</p>}
            {!results && !error && <p className="empty">Type to search across news, papers, and companies.</p>}
            {results && total === 0 && <p className="empty">No matches for “{query}”. Try a field like BCI, EEG, or implants.</p>}

            {results?.companies.length > 0 && (
                <>
                    <div className="group">Companies ({results.companies.length})</div>
                    <ul className="list">{results.companies.map((c) => <CompanyItem key={c.id} item={c} />)}</ul>
                </>
            )}
            {results?.news.length > 0 && (
                <>
                    <div className="group">News ({results.news.length})</div>
                    <ul className="list">{results.news.map((n) => (
                        <NewsItem
                            key={n.id}
                            item={n}
                            saved={isSaved("article", n.id)}
                            onToggle={() => handleToggle("article", n)}
                        />
                    ))}</ul>
                </>
            )}
            {results?.papers.length > 0 && (
                <>
                    <div className="group">Papers ({results.papers.length})</div>
                    <ul className="list">{results.papers.map((p) => (
                        <PaperItem
                            key={p.id}
                            item={p}
                            saved={isSaved("paper", p.id)}
                            onToggle={() => handleToggle("paper", p)}
                        />
                    ))}</ul>
                </>
            )}
        </>
    );
}