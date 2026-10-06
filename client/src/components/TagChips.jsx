import { TAGS } from "../api";

export default function TagChips({ active, onChange }) {
    return (
        <div className="chips">
            {["All", ...TAGS].map((tag) => (
                <button
                    key={tag}
                    className={`chip${tag === active ? " on" : ""}`}
                    onClick={() => onChange(tag)}
                >
                    {tag}
                </button>
            ))}
        </div>
    );
}
