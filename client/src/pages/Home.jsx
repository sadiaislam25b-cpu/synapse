import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ParticleBrain from "../components/ParticleBrain";
import { NewsItem, PaperItem } from "../components/Items";
import { getNews, getPapers } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const [news, setNews] = useState([]);
    const [papers, setPapers] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isSaved, toggleSaved } = useAuth();

    useEffect(() => {
        Promise.all([getNews(), getPapers()])
            .then(([n, p]) => {
                setNews(n.slice(0, 3));
                setPapers(p.slice(0, 4));
            })
            .catch(() => setError("Couldn't load the latest updates. Make sure the server is running."));
    }, []);

    const handleToggle = async (type, item) => {
        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }

        await toggleSaved(type, item.id);
    };

    return (
        <>
            <section className="hero">
                <div>
                    <h1>Everything happening in neurotech, in one place.</h1>
                    <p>Daily news, new research papers, and the companies building brain-computer interfaces, implants, and wearables.</p>
                    <Link className="btn" to="/news">Read latest news</Link>
                    <Link className="btn ghost" to="/companies">Explore companies</Link>
                </div>
                <ParticleBrain />
            </section>

            {error && <p className="empty">{error}</p>}

            <div className="split">
                <div>
                    <h2>Latest news</h2>
                    <ul className="list">
                        {news.map((item) => (
                            <NewsItem
                                key={item.id}
                                item={item}
                                saved={isSaved("article", item.id)}
                                onToggle={() => handleToggle("article", item)}
                            />
                        ))}
                    </ul>
                    <p><Link to="/news">All news</Link></p>
                </div>
                <div>
                    <h2>New papers</h2>
                    <ul className="list">
                        {papers.map((p) => (
                            <PaperItem
                                key={p.id}
                                item={p}
                                saved={isSaved("paper", p.id)}
                                onToggle={() => handleToggle("paper", p)}
                            />
                        ))}
                    </ul>
                    <p><Link to="/research">All research</Link></p>
                </div>
            </div>
        </>
    );
}
