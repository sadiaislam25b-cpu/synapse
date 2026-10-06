import { useState } from "react";
import { NavLink, Link, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import News from "./pages/News";
import Research from "./pages/Research";
import Companies from "./pages/Companies";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Saved from "./pages/Saved";

function AppShell() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header>
        <div className="wrap bar">
          <Link className="logo" to="/"><i></i>Synapse</Link>
          <nav>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/news">News</NavLink>
            <NavLink to="/research">Research</NavLink>
            <NavLink to="/companies">Companies</NavLink>
            <NavLink to="/search">Search</NavLink>
            {user && <NavLink to="/saved">Saved</NavLink>}
          </nav>

          <div className="auth-actions">
            {loading ? null : user ? (
              <>
                <span className="username">Hi, {user.username}</span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/signup">Sign up</NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="wrap">
        <form onSubmit={onSearch} className="header-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search the site"
          />
        </form>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/research" element={<Research />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="*" element={<p className="empty">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>

      <footer>
        <div className="wrap">Synapse. News from The Guardian, research from PubMed and arXiv.</div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}