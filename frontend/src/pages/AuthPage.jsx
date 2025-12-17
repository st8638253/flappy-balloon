import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/game");
    } catch (err) {
      setError(err.message || "Error");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === "login" ? "Login" : "Register"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <button
          className="link-btn"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "No account? Register"
            : "Have an account? Login"}
        </button>
      </div>
    </div>
  );
}
