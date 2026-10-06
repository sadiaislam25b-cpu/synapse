import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");

        try {
            await signup(username.trim(), password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "Sign up failed.");
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="auth-panel">
            <h2>Sign up</h2>
            <p className="sub">Create your Synapse account.</p>

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
                        minLength={6}
                        required
                    />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="btn" type="submit" disabled={pending}>
                    {pending ? "Creating account..." : "Create account"}
                </button>
            </form>

            <p className="auth-link">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}
