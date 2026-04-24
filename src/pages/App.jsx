import React from 'react';
import { useEffect, useState } from "react";
import '../pages/App.css'

const API_URL = "http://127.0.0.1:8000/current";

const OFFSET = 0.3;

function App() {
  const [track, setTrack] = useState(null);
  const [currentLine, setCurrentLine] = useState("");
  const [baseProgress, setBaseProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  useEffect(() => {
    async function fetchTrack() {
      try {
        const res = await fetch(API_URL);
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

  if (!track.is_playing) {
    return (
      <div className="container">
        <div className="card">
          <h1>Spotify Lyrics</h1>
          <p>Nenhuma música tocando no momento.</p>
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