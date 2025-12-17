import React, { useEffect, useState } from "react";
import { apiLeaderboard, apiGetPlayer } from "../api";
import { useNavigate } from "react-router-dom";

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const stats = await apiLeaderboard();
        const enriched = await Promise.all(
          stats.map(async (s) => {
            const player = await apiGetPlayer(s.player_id);
            return {
              id: s.player_id,
              username: player.username,
              best_score: s.best_score,
              total_games: s.total_games,
              avg_score: Number(s.avg_score || 0).toFixed(1),
            };
          })
        );
        setRows(enriched);
      } catch (e) {
        setError(e.message || "Error");
      }
    })();
  }, []);

  return (
    <div className="leaderboard-page">
      <h2>Top players</h2>

      <button
        className="button"
        style={{ marginBottom: "20px" }}
        onClick={() => navigate("/game")}
      >
        Back to Game
      </button>

      {error && <div className="error">{error}</div>}

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Best score</th>
            <th>Games</th>
            <th>Avg score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>{p.username}</td>
              <td>{p.best_score}</td>
              <td>{p.total_games}</td>
              <td>{p.avg_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
