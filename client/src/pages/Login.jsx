import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");

        try {
            await login(username.trim(), password);
            const next = location.state?.from?.pathname || "/";
            navigate(next, { replace: true });
        } catch (err) {
            setError(err.message || "Log in failed.");
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="auth-panel">
            <h2>Log in</h2>
            <p className="sub">Welcome back to Synapse.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label className="field">
                    <span>Username</span>
                    <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />
                </label>

                <label className="field">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="btn" type="submit" disabled={pending}>
                    {pending ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p className="auth-link">
                Need an account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}
