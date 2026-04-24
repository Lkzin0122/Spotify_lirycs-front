import React from 'react';
import { useEffect, useState } from "react";
import '../pages/App.css'

const BACKEND_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BACKEND_URL}/current`;

function connectSpotify() {
  window.location.href = `${BACKEND_URL}/login`;
}

const OFFSET = 0.3;

function App() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session");

    if (session) {
      localStorage.setItem("spotify_session", session);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const [track, setTrack] = useState(null);
  const [currentLine, setCurrentLine] = useState("");
  const [baseProgress, setBaseProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  useEffect(() => {
    async function fetchTrack() {
      try {
        const session = localStorage.getItem("spotify_session");

        const res = await fetch(API_URL, {
          headers: {
            "x-session-id": session || "",
          },
        });

        const data = await res.json();

        setTrack((oldTrack) => {
          const musicaMudou =
            oldTrack?.nome !== data?.nome ||
            oldTrack?.artista !== data?.artista;

          if (musicaMudou) {
            setCurrentLine("");
          }

          return data;
        });

        setBaseProgress(data.progresso || 0);
        setLastSyncTime(Date.now());
      } catch (error) {
        console.error("Erro ao buscar música:", error);

        setTrack({
          is_playing: false,
          message: "Conecte sua conta do Spotify."
        });
      }
    }

    fetchTrack();

    const fetchInterval = setInterval(fetchTrack, 3000);

    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const lyricInterval = setInterval(() => {
      if (!track?.is_playing || !track.letra?.length) {
        setCurrentLine("");
        return;
      }

      const elapsed = (Date.now() - lastSyncTime) / 1000;
      const currentProgress = baseProgress + elapsed + OFFSET;

      const linhaAtual = track.letra
        .filter((linha) => linha.tempo <= currentProgress)
        .at(-1);

      setCurrentLine(linhaAtual?.texto || "");
    }, 100);

    return () => clearInterval(lyricInterval);
  }, [track, baseProgress, lastSyncTime]);

  if (!track) {
    return (
      <div className="container">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!track || track.error || !track.is_playing) {
    return (
      <div className="container">
        <div className="card">
          <h1>Spotify Lyrics</h1>
          <p>{track?.message || "Conecte sua conta do Spotify."}</p>

          <button onClick={connectSpotify}>
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <p className="label">Now Playing</p>

        <h1>{track.nome}</h1>
        <h2>{track.artista}</h2>

        <div className="lyricsBox">
          <p className="currentLyric">
            {currentLine || "Letra sincronizada não encontrada"}
          </p>
        </div>

        <p className="progress">
          {Math.floor(baseProgress + (Date.now() - lastSyncTime) / 1000)}s
        </p>
      </div>
    </div>
  );
}

export default App;