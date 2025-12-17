import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiCreateGame, apiMyStats, apiDeleteAccount } from "../api";
import { useNavigate } from "react-router-dom";

export default function GamePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTopbar, setShowTopbar] = useState(true);

  async function handleLogout() {
    await logout();
    navigate("/auth");
  }

  async function handleDeleteAccount() {
    if (!user) return;
    const ok = window.confirm("Are you sure you want to delete your account?");
    if (!ok) return;
    try {
      await apiDeleteAccount(user.id);
      await logout();
      navigate("/auth");
    } catch (e) {
      alert(e.message || "Error deleting account");
    }
  }

  function handleGoLeaderboard() {
    navigate("/leaderboard");
  }

  useEffect(() => {
    if (!user) return;

    let move_speed = 3;
    let gravity = 0.5;

    const balloon = document.querySelector(".balloon");
    const img = document.getElementById("balloon-1");
    const backgroundEl = document.querySelector(".background");
    const score_val = document.querySelector(".score_val");
    const message = document.querySelector(".message");
    const score_title = document.querySelector(".score_title");
    const best_score_val = document.querySelector(".best_score_val");
    const heading = document.querySelector(".heading");

    if (
      !balloon ||
      !img ||
      !backgroundEl ||
      !score_val ||
      !message ||
      !score_title ||
      !best_score_val
    ) {
      return;
    }

    let balloon_props = balloon.getBoundingClientRect();
    const background = backgroundEl.getBoundingClientRect();

    let game_state = "Start";

    img.style.display = "none";
    message.classList.add("messageStyle");
    message.style.display = "flex";

    let micStream = null;
    let audioContext = null;
    let analyser = null;
    let data = null;

    let volumeSum = 0;
    let volumeFrames = 0;
    let volumeMax = 0;

    let startTime = null;

    async function requestMicAccess() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const mic = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        data = new Uint8Array(analyser.frequencyBinCount);
        mic.connect(analyser);
      } catch (e) {
        console.warn("Microphone access denied", e);
      }
    }

    requestMicAccess();

    let best_score = 0;

    (async () => {
      try {
        const stats = await apiMyStats();
        if (stats && typeof stats.best_score === "number") {
          best_score = stats.best_score;
          best_score_val.innerHTML = best_score;
        } else {
          best_score_val.innerHTML = "0";
        }
      } catch {
        best_score = 0;
        best_score_val.innerHTML = "0";
      }
    })();

    function updateBestScoreLocal(score) {
      if (score > best_score) {
        best_score = score;
        best_score_val.innerHTML = best_score;
      }
    }

    async function sendGameToBackend(score) {
      const endTime = performance.now();
      const duration_seconds = startTime
        ? Math.round((endTime - startTime) / 1000)
        : 0;

      const avg_mic_level = volumeFrames > 0 ? volumeSum / volumeFrames : 0;
      const max_mic_level = volumeMax;

      try {
        await apiCreateGame({
          score,
          avg_mic_level,
          max_mic_level,
          duration_seconds,
        });

        const stats = await apiMyStats();
        if (stats && typeof stats.best_score === "number") {
          best_score = stats.best_score;
          best_score_val.innerHTML = best_score;
        }
      } catch (e) {
        console.warn("Failed to send game data", e);
      }
    }

    function resetToStartScreen() {
      setShowTopbar(true);

      document.querySelectorAll(".pipe_sprite").forEach((e) => e.remove());

      if (heading) heading.style.display = "block";

      message.style.display = "flex";

      score_title.innerHTML = "";
      score_val.innerHTML = "";

      balloon.style.top = "40vh";
      balloon_props = balloon.getBoundingClientRect();

      game_state = "Start";
    }

    async function handleGameOver() {
      if (game_state === "End") return;
      game_state = "End";
      img.style.display = "none";

      try {
        const sound_die = new Audio("sounds effect/die.mp3");
        sound_die.play();
      } catch {}

      const score = parseInt(score_val.innerHTML || "0", 10);
      updateBestScoreLocal(score);
      await sendGameToBackend(score);

      resetToStartScreen();
    }

    function play() {
      const sound_point = new Audio("sounds effect/point.mp3");

      function move() {
        if (game_state !== "Play") return;

        document.querySelectorAll(".pipe_sprite").forEach((element) => {
          const pipe_sprite_props = element.getBoundingClientRect();
          balloon_props = balloon.getBoundingClientRect();

          if (pipe_sprite_props.right <= 0) {
            element.remove();
          } else {
            const collide =
              balloon_props.left <
                pipe_sprite_props.left + pipe_sprite_props.width &&
              balloon_props.left + balloon_props.width >
                pipe_sprite_props.left &&
              balloon_props.top <
                pipe_sprite_props.top + pipe_sprite_props.height &&
              balloon_props.top + balloon_props.height >
                pipe_sprite_props.top;

            if (collide) {
              handleGameOver();
              return;
            } else {
              if (
                pipe_sprite_props.right < balloon_props.left &&
                pipe_sprite_props.right + move_speed >= balloon_props.left &&
                element.increase_score === "1"
              ) {
                score_val.innerHTML = +score_val.innerHTML + 1;
                try {
                  sound_point.play();
                } catch {}
              }
              element.style.left = pipe_sprite_props.left - move_speed + "px";
            }
          }
        });

        requestAnimationFrame(move);
      }
      requestAnimationFrame(move);

      let balloon_dy = 0;

      function apply_gravity() {
        if (game_state !== "Play") return;

        if (analyser && data) {
          analyser.getByteFrequencyData(data);
          let volume = 0;
          for (let i = 0; i < data.length; i++) volume += data[i];
          volume = volume / data.length;

          volumeSum += volume;
          volumeFrames += 1;
          if (volume > volumeMax) volumeMax = volume;

          if (volume > 75) {
            balloon_dy = -4;
          }
        }

        balloon_dy += gravity;

        if (
          balloon_props.top <= 0 ||
          balloon_props.bottom >= background.bottom
        ) {
          handleGameOver();
          return;
        }

        balloon.style.top = balloon_props.top + balloon_dy + "px";
        balloon_props = balloon.getBoundingClientRect();

        requestAnimationFrame(apply_gravity);
      }
      requestAnimationFrame(apply_gravity);

      let pipe_separation = 0;
      const pipe_gap = 70;

      function create_pipe() {
        if (game_state !== "Play") return;

        if (pipe_separation > 115) {
          pipe_separation = 0;
          const pipe_posi = Math.floor(Math.random() * 43) + 8;

          const pipe_sprite_inv = document.createElement("div");
          pipe_sprite_inv.className = "pipe_sprite";
          pipe_sprite_inv.style.top = pipe_posi - 70 + "vh";
          pipe_sprite_inv.style.left = "100vw";
          document.body.appendChild(pipe_sprite_inv);

          const pipe_sprite = document.createElement("div");
          pipe_sprite.className = "pipe_sprite";
          pipe_sprite.style.top = pipe_posi + pipe_gap + "vh";
          pipe_sprite.style.left = "100vw";
          pipe_sprite.increase_score = "1";
          document.body.appendChild(pipe_sprite);
        }
        pipe_separation++;

        requestAnimationFrame(create_pipe);
      }
      requestAnimationFrame(create_pipe);
    }

    function startGame() {
      document.querySelectorAll(".pipe_sprite").forEach((e) => e.remove());
      img.style.display = "block";
      balloon.style.top = "40vh";
      balloon_props = balloon.getBoundingClientRect();

      volumeSum = 0;
      volumeFrames = 0;
      volumeMax = 0;
      startTime = performance.now();

      setShowTopbar(false);

      message.style.display = "none";

      game_state = "Play";
      score_title.innerHTML = "Score:";
      score_val.innerHTML = "0";
      if (heading) heading.style.display = "none";

      play();
    }

    function keyHandler(e) {
      if (e.key === "Enter" && game_state === "Start") {
        startGame();
      }
    }

    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("keydown", keyHandler);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
      document.querySelectorAll(".pipe_sprite").forEach((e) => e.remove());
      setShowTopbar(true);
    };
  }, [user, navigate]);

  return (
    <div className="game-wrapper">
      <div className="background"></div>

      {showTopbar && (
        <div className="game-topbar">
          <div className="game-user">
            Logged in as:{" "}
            <span className="game-username">{user?.username}</span>
          </div>
          <div className="game-actions">
            <button className="button" onClick={handleGoLeaderboard}>
              Leaderboard
            </button>
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
            <button
              className="button game-delete-btn"
              onClick={handleDeleteAccount}
            >
              Delete account
            </button>
          </div>
        </div>
      )}

      <div className="heading">Flappy balloon</div>

      <img
        src="images/balloon.png"
        alt="balloon-img"
        className="balloon"
        id="balloon-1"
      />

      <div className="message">
        <div className="message-hint">Use your voice to control the balloon</div>
        <button className="message-btn">Press Enter to Start</button>
      </div>

      <div className="score">
        <span className="score_title"></span>
        <span className="score_val"></span>
      </div>

      <div className="best-score">
        <span className="best_score_title">Best Score: </span>
        <span className="best_score_val">0</span>
      </div>
    </div>
  );
}
