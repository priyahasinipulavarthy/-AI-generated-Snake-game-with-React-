import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120; // ms

const TRACKS = [
  {
    id: 1,
    title: 'Neon Drift v1.2',
    artist: 'AI SynthMind',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    title: 'Cyberpunk Protocol',
    artist: 'NeuralBeat Algo',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    title: 'Digital Horizon',
    artist: 'GPT-Music-Core',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const directionRef = useRef(INITIAL_DIRECTION);
  
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Music Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Game Loop
  useEffect(() => {
    if (isGamePaused || gameOver || !hasStarted) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + directionRef.current.x, y: head.y + directionRef.current.y };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          handleGameOver();
          return prev;
        }

        if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          handleGameOver();
          return prev;
        }

        const newSnake = [newHead, ...prev];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          
          let newFoodFound = false;
          let nx = 0, ny = 0;
          while (!newFoodFound) {
            nx = Math.floor(Math.random() * GRID_SIZE);
            ny = Math.floor(Math.random() * GRID_SIZE);
            if (!newSnake.some(seg => seg.x === nx && seg.y === ny)) {
               newFoodFound = true;
            }
          }
          setFood({ x: nx, y: ny });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const timerId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(timerId);
  }, [isGamePaused, gameOver, hasStarted, food]);

  const handleGameOver = () => {
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    setIsGamePaused(false);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    });
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
         if (!hasStarted) {
             setHasStarted(true);
         } else if (gameOver) {
             resetGame();
         } else {
             setIsGamePaused(p => !p);
         }
         return;
      }

      if (!hasStarted || isGamePaused || gameOver) return;

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isGamePaused, gameOver]);

  // Audio Controls Setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time) || !time) return '00:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error("Audio play error", e);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, isPlaying]);

  const currentTrack = TRACKS[currentTrackIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full h-screen bg-[#080808] text-[#e0e0e0] font-sans flex flex-col p-4 sm:p-8 overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 lg:mb-8 border-b border-white/10 pb-4 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xs font-bold tracking-[0.4em] uppercase text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]">
            Synth-Snake Console
          </h1>
          <p className="font-serif italic text-sm lg:text-lg text-white/60">Vol. 01 — Harmonic Resonance</p>
        </div>
        <div className="flex gap-6 lg:gap-12">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Status</p>
            <p className="font-mono text-lg lg:text-2xl text-[#ff007f] drop-shadow-[0_0_8px_rgba(255,0,127,0.4)]">
              {gameOver ? 'FAILURE' : isGamePaused ? 'PAUSED' : hasStarted ? 'ACTIVE' : 'STANDBY'}
            </p>
          </div>
          <div className="text-right w-20 lg:w-24">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Score</p>
            <p className="font-mono text-xl lg:text-3xl text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              {score.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 lg:gap-8 overflow-hidden">
        
        {/* Sidebar (Left) */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6 lg:overflow-y-auto hidden lg:flex">
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4 font-bold">Audio Library</h2>
            <div className="space-y-2">
              {TRACKS.map((track, i) => {
                const isActive = i === currentTrackIndex;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }} 
                    className={`p-3 rounded-r flex justify-between items-center group transition-all cursor-pointer ${
                      isActive ? 'bg-white/5 border-l-2 border-[#00f3ff]' : 'bg-transparent border-l-2 border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${isActive ? '' : 'text-white/70'}`}>{track.title}</span>
                      <span className="text-[10px] text-white/40 italic">{track.artist}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-[#00f3ff]' : 'text-white/30'}`}>
                      {isActive && isPlaying ? 'LIVE' : '---'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-auto">
            <div className="bg-[#111] border border-white/10 p-4 rounded-lg">
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Top Performance</h3>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis mr-2 shrink-0">1. LOCAL_USER</span>
                <span className="text-sm font-mono text-[#ff007f]">{highScore.toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Main Game Segment (Right) */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="relative flex-1 bg-[#050505] rounded-xl border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
            
            {/* Minimal overlays for aesthetics */}
            <div className="absolute top-4 left-4 flex gap-4 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                <span className="text-[10px] uppercase tracking-tighter">Neural Link Active</span>
              </div>
            </div>

            {/* Scale down the game container for smaller screens */}
            <div className="transform scale-75 sm:scale-100 flex items-center justify-center">
              {/* Game Surface */}
              <div 
                style={{ width: `${GRID_SIZE * 20}px`, height: `${GRID_SIZE * 20}px` }} 
                className="relative z-10"
              >
                {snake.map((segment, index) => (
                  <div 
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute rounded-sm transition-all duration-75 ${
                      index === 0 
                      ? 'bg-[#ff007f] shadow-[0_0_10px_#ff007f] z-10' 
                      : 'bg-[#00f3ff] shadow-[0_0_8px_#00f3ff] opacity-80'
                    }`}
                    style={{
                      width: '20px', height: '20px',
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      transform: 'scale(0.9)'
                    }}
                  />
                ))}
                
                <div 
                    className="absolute bg-yellow-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                    style={{
                      width: '16px', height: '16px',
                      left: `${food.x * 20 + 2}px`,
                      top: `${food.y * 20 + 2}px`
                    }}
                />

                {/* Overlays inside the game surface */}
                {!hasStarted && !gameOver && (
                  <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] bg-black/80 flex flex-col items-center justify-center backdrop-blur-[2px] z-20">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-[0.4em] uppercase text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] text-center leading-loose mb-4">
                      Synth-Snake<br/>Console
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest text-white/50 animate-pulse">Press Space to Start</p>
                    <p className="text-[9px] text-white/30 tracking-[0.3em] uppercase mt-6">Use WASD or Arrows</p>
                  </div>
                )}

                {isGamePaused && hasStarted && !gameOver && (
                  <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-[0.4em] uppercase text-[#ff007f] drop-shadow-[0_0_8px_rgba(255,0,127,0.4)] mb-4 text-center">System Paused</h2>
                    <p className="text-[10px] uppercase tracking-widest text-white/50">Press Space to Resume</p>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md border-[2px] border-[#ff007f]/30 z-20">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-[0.4em] uppercase text-[#ff007f] drop-shadow-[0_0_8px_rgba(255,0,127,0.4)] mb-4 text-center leading-loose">
                      System<br/>Failure
                    </h2>
                    <p className="text-sm font-mono text-white/80 mb-8 border-b border-white/10 pb-2">Score: {score}</p>
                    <button 
                      onClick={resetGame}
                      className="px-6 py-2 border border-white/20 rounded hover:bg-white/10 text-[10px] uppercase tracking-[0.2em] transition-colors"
                    >
                      Reboot Match
                    </button>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Footer Music Player */}
      <div className="mt-6 lg:mt-8 h-auto lg:h-24 bg-[#111] rounded-2xl border border-white/10 p-4 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8 shadow-2xl shrink-0">
        
        {/* Track Display */}
        <div className="flex items-center gap-4 w-full lg:w-1/4 shrink-0">
          <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#00f3ff] to-[#ff007f] rounded flex items-center justify-center text-black font-bold">AI</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{currentTrack.title}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Central Controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full lg:w-auto">
          <div className="flex items-center gap-6 justify-center">
            <button onClick={skipBack} className="opacity-40 hover:opacity-100 transition-opacity">
              <SkipBack size={16} fill="currentColor" />
            </button>
            <button onClick={togglePlay} className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-transform hover:scale-105">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={skipForward} className="opacity-40 hover:opacity-100 transition-opacity">
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full px-2 lg:px-12">
            <span className="text-[9px] font-mono text-white/40">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00f3ff] to-[#ff007f] shadow-[0_0_10px_#00f3ff] transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-[9px] font-mono text-white/40">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-full lg:w-1/4 shrink-0 flex justify-center lg:justify-end items-center gap-4 hidden sm:flex">
          <button onClick={toggleMute} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="w-24 h-1 bg-white/20 rounded-full hidden lg:block overflow-hidden">
            <div className={`h-full bg-white rounded-full transition-all duration-300 ${isMuted ? 'w-0' : 'w-2/3'}`}></div>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={skipForward} 
        preload="auto"
      />
    </div>
  );
}
