import { useEffect, useState } from "react";
import TagChips from "../components/TagChips";
import CompanyMap from "../components/CompanyMap";
import { Tags } from "../components/Items";
import { getCompanies } from "../api";

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("All");
    const [error, setError] = useState("");

    useEffect(() => {
        getCompanies()
            .then((data) => {
                setCompanies(data);
                if (data.length) setSelected(data[0].id);
            })
            .catch(() => setError("Couldn't load companies. Make sure the server is running."));
    }, []);

    const current = companies.find((c) => c.id === selected);
    const connections = current
        ? companies.filter((c) => c.id !== current.id && c.tags.some((t) => current.tags.includes(t)))
        : [];

    const selectAndScroll = (id) => {
        setSelected(id);
        document.querySelector(".map")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    return (
        <>
            <h2>Company map</h2>
            <p className="sub">Each dot is a company. Lines connect companies working in the same area. Click a dot to see its profile.</p>
            <TagChips active={filter} onChange={setFilter} />

            {error && <p className="empty">{error}</p>}

            <div className="mapwrap">
                <div>
                    <CompanyMap companies={companies} selected={selected} filter={filter} onSelect={setSelected} />
                    <div className="legend">Pulses travel between connected companies. Pick a field above to highlight it.</div>
                </div>

                {current && (
                    <div className="card">
                        <h3>{current.name}</h3>
                        <p className="loc">{current.location}</p>
                        <p>{current.description}</p>
                        <div className="meta" style={{ marginBottom: 16 }}><Tags tags={current.tags} /></div>
                        <div className="meta" style={{ marginBottom: 16 }}>
                            Connected to {connections.length} companies: {connections.map((c) => c.name).join(", ")}
                        </div>
                        <a className="btn" href={current.website} target="_blank" rel="noreferrer">Visit website</a>
                    </div>
                )}
            </div>

            <div className="grid">
                {companies.map((c) => (
                    <button key={c.id} className="co" onClick={() => selectAndScroll(c.id)}>
                        <strong>{c.name}</strong>
                        <span>{c.tags.join(", ")}</span>
                    </button>
                ))}
            </div>
        </>
    );
}