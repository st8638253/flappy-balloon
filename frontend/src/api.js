const API_URL = "http://localhost:8000";

async function request(path, options = {}, { expectJson = true, allow401 = false } = {}) {
  const res = await fetch(API_URL + path, {
    credentials: "include",
    ...options,
  });

  if (allow401 && res.status === 401) return null;
  if (!res.ok) {
    let msg = "Error";
    try {
      const data = await res.json();
      msg = data.detail || JSON.stringify(data);
    } catch (_) {}
    throw new Error(msg);
  }

  if (!expectJson) return null;
  return res.json();
}

export async function apiMe() {
  return request("/me", { method: "GET" }, { allow401: true });
}

export async function apiLogin(username, password) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  return request(
    "/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    { expectJson: true }
  );
}

export async function apiRegister(username, password) {
  return request(
    "/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    { expectJson: true }
  );
}

export async function apiLogout() {
  return request(
    "/logout",
    {
      method: "POST",
    },
    { expectJson: true }
  );
}

export async function apiCreateGame({ score, avg_mic_level, max_mic_level, duration_seconds }) {
  return request(
    "/games",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score,
        avg_mic_level,
        max_mic_level,
        duration_seconds,
      }),
    },
    { expectJson: true }
  );
}

export async function apiMyStats() {
  return request("/stats/me", { method: "GET" });
}

export async function apiLeaderboard() {
  return request("/leaderboard", { method: "GET" });
}

export async function apiGetPlayer(playerId) {
  return request(`/players/${playerId}`, { method: "GET" });
}

export async function apiDeleteAccount(id) {
  const res = await fetch(`http://localhost:8000/players/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "Error";
    try {
      const data = await res.json();
      msg = data.detail || JSON.stringify(data);
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
