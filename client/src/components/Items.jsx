const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const shorten = (text, max = 280) =>
    text && text.length > max ? text.slice(0, max).trim() + "…" : text;

export function Tags({ tags = [] }) {
    return tags.map((t, i) => (
        <span key={t} className={`tag${i % 2 ? " e" : ""}`}>{t}</span>
    ));
}

export function NewsItem({ item, saved = false, onToggle }) {
    return (
        <li className="item">
            {item.image_url && <img src={item.image_url} alt="" />}
            <div className="item-copy">
                <div className="item-header">
                    <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
                    {onToggle && (
                        <button
                            type="button"
                            className={`save-btn${saved ? " saved" : ""}`}
                            onClick={onToggle}
                            aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
                            title={saved ? "Saved" : "Save"}
                        >
                            {saved ? "♥" : "♡"}
                        </button>
                    )}
                </div>
                {item.summary && <p>{item.summary}</p>}
                <div className="meta">
                    <span>{item.source}</span>
                    <span>{formatDate(item.published_at)}</span>
                    <Tags tags={item.tags} />
                </div>
            </div>
        </li>
    );
}

export function PaperItem({ item, saved = false, onToggle }) {
    return (
        <li className="item">
            <div className="item-copy">
                <div className="item-header">
                    <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
                    {onToggle && (
                        <button
                            type="button"
                            className={`save-btn${saved ? " saved" : ""}`}
                            onClick={onToggle}
                            aria-label={saved ? `Unsave ${item.title}` : `Save ${item.title}`}
                            title={saved ? "Saved" : "Save"}
                        >
                            {saved ? "♥" : "♡"}
                        </button>
                    )}
                </div>
                {item.abstract && <p>{shorten(item.abstract)}</p>}
                <div className="meta">
                    <span>{shorten(item.authors, 80)}</span>
                    <span>{item.source}, {formatDate(item.published_at)}</span>
                    <Tags tags={item.tags} />
                </div>
            </div>
        </li>
    );
}

export function CompanyItem({ item }) {
    return (
        <li className="item">
            <div>
                <h3><a href={item.website} target="_blank" rel="noreferrer">{item.name}</a></h3>
                <p>{item.description}</p>
                <div className="meta">
                    <span>{item.location}</span>
                    <Tags tags={item.tags} />
                </div>
            </div>
        </li>
    );
}