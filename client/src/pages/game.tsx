import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socketService } from "@/api/socket";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";
import type { GameMessage, GuessEntry, Room, TileState } from "@/types/game.interface";
import { Send, Trophy, Swords, ArrowLeft } from "lucide-react";


function evaluateGuess(guess: string, secret: string): TileState[] {
  const result: TileState[] = Array(5).fill("absent");
  const secretArr = secret.toUpperCase().split("");
  const guessArr = guess.toUpperCase().split("");

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === secretArr[i]) {
      result[i] = "correct";
      secretArr[i] = "\0";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = secretArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = "present";
      secretArr[idx] = "\0";
    }
  }

  return result;
}

function tilesToString(tiles: TileState[]): string {
  return tiles.join(",");
}

function stringToTiles(s: string): TileState[] {
  return s.split(",") as TileState[];
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}


interface TileRowProps {
  guess: string;
  tiles: TileState[];
}

function TileRow({ guess, tiles }: TileRowProps) {
  const chars = guess.toUpperCase().padEnd(5, " ").split("");
  return (
    <div className="flex gap-1.5">
      {chars.map((ch, i) => {
        const state = tiles[i] ?? "absent";
        const colorClass =
          state === "correct"
            ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
            : state === "present"
              ? "bg-yellow-400/30 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
              : state === "pending"
                ? "bg-zinc-800/60 border-zinc-700 text-zinc-400 animate-pulse"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-600";

        return (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-bold tracking-widest transition-all duration-300 ${colorClass}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {ch === " " ? "" : ch}
          </div>
        );
      })}
    </div>
  );
}

interface GuessPanelProps {
  title: string;
  subtitle: string;
  guesses: GuessEntry[];
  accentColor: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

function GuessPanel({
  title,
  subtitle,
  guesses,
  accentColor,
  scrollRef,
}: GuessPanelProps) {
  return (
    <div className="flex flex-1 flex-col rounded-[1.75rem] border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm">
      <div className="border-b border-zinc-800/60 px-5 py-4">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accentColor}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate font-mono text-sm font-semibold text-zinc-300">
          {subtitle}
        </p>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth"
        style={{ maxHeight: "calc(100vh - 260px)" }}
      >
        {guesses.length === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-700">
              No guesses yet
            </p>
          </div>
        ) : (
          guesses.map((entry) => (
            <div key={entry.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TileRow guess={entry.guess} tiles={entry.tiles} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface GameOverProps {
  winnerName: string;
  myUsername: string;
  mySecret: string;
  opponentUsername: string;
  roomCode: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

function GameOverOverlay({
  winnerName,
  myUsername,
  mySecret,
  opponentUsername,
  roomCode,
  onPlayAgain,
  onExit,
}: GameOverProps) {
  const didWin = winnerName === myUsername;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-sm rounded-[2rem] border border-zinc-800/80 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-2xl text-center">
        <div
          className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] ${didWin
            ? "bg-amber-500/10 border border-amber-500/30"
            : "bg-zinc-800/60 border border-zinc-700/50"
            }`}
        >
          <Trophy
            className={`h-9 w-9 ${didWin ? "text-amber-400" : "text-zinc-600"}`}
          />
        </div>

        <h2
          className={`text-3xl font-black tracking-tighter ${didWin ? "text-amber-300" : "text-zinc-400"
            }`}
        >
          {didWin ? "You Win!" : "You Lose"}
        </h2>

        <p className="mt-1 text-sm font-medium text-zinc-500">
          {didWin
            ? `${opponentUsername} couldn't crack your sequence.`
            : `${winnerName} decoded your secret.`}
        </p>

        {/* Secret reveal */}
        {mySecret && (
          <div className="mt-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Your Secret Was
            </p>
            <div className="flex items-center justify-center gap-2">
              {mySecret.split("").map((ch, i) => (
                <div
                  key={i}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/60 font-mono text-lg font-bold text-zinc-200"
                >
                  {ch}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-2">
          {/* Play Again — back to room with same code for a fresh round */}
          {roomCode && (
            <button
              onClick={onPlayAgain}
              className="w-full rounded-2xl bg-zinc-100 py-3.5 text-base font-bold text-zinc-950 transition-all hover:bg-white hover:scale-[1.02] active:scale-95"
            >
              Play Again
            </button>
          )}
          {/* Exit to home */}
          <button
            onClick={onExit}
            className="w-full rounded-2xl border border-zinc-800/80 bg-transparent py-3 text-sm font-semibold text-zinc-500 transition-all hover:border-zinc-700 hover:text-zinc-300"
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  const navigate = useNavigate();

  const myUsername = useSession((state) => state.username);
  const mySecret = useSession((state) => state.mySecret);

  const room = useRoom((state) => state.room);
  const setRoom = useRoom((state) => state.setRoom);

  const searchParams = new URLSearchParams(window.location.search);
  const roomCode = searchParams.get("code") || room?.id || "";

  const opponent = room?.players.find((p) => p.username !== myUsername);
  const opponentUsername = opponent?.username ?? "Opponent";
  const [myGuesses, setMyGuesses] = useState<GuessEntry[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<GuessEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);

  const myScrollRef = useRef<HTMLDivElement>(null);
  const opponentScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollMyBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (myScrollRef.current) {
        myScrollRef.current.scrollTop = myScrollRef.current.scrollHeight;
      }
    });
  }, []);

  const scrollOpponentBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (opponentScrollRef.current) {
        opponentScrollRef.current.scrollTop =
          opponentScrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    if (!roomCode) {
      navigate("/", { replace: true });
      return;
    }

    const handleRoomData = (updatedRoom: Room) => {
      setRoom(updatedRoom);
      const active =
        updatedRoom.players.length === 2 &&
        updatedRoom.players.every((p) => p.ready);
      if (!active) {
        navigate(`/room?code=${roomCode}`, { replace: true });
      }
    };

    const handleNotFound = () => {
      useRoom.getState().clearRoom();
      navigate("/", { replace: true });
    };

    socketService.listen("room_data", handleRoomData);
    socketService.listen("room_not_found", handleNotFound);
    socketService.getRoom(roomCode);

    return () => {
      socketService.off("room_data");
      socketService.off("room_not_found");
    };
  }, [roomCode, navigate, setRoom]);
  useEffect(() => {
    const handleMessage = (raw: string) => {
      let msg: GameMessage;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === "GUESS") {
        if (msg.sender === myUsername) {
          return;
        }
        const tiles = mySecret
          ? evaluateGuess(msg.guess, mySecret)
          : Array(5).fill("absent") as TileState[];

        const entry: GuessEntry = {
          id: makeId(),
          guess: msg.guess,
          tiles,
          timestamp: Date.now(),
        };

        setOpponentGuesses((prev) => [...prev, entry]);
        scrollOpponentBottom();
        if (mySecret) {
          const feedback: GameMessage = {
            type: "GUESS_FEEDBACK",
            guess: msg.guess,
            tiles: tilesToString(tiles),
            sender: myUsername,
          };
          socketService.sendGameMessage(feedback, roomCode);
          if (tiles.every((t) => t === "correct")) {
            const gameOverMsg: GameMessage = {
              type: "GAME_OVER",
              guess: msg.guess,
              sender: myUsername,
              winner: msg.sender,
            };
            socketService.sendGameMessage(gameOverMsg, roomCode);
            setGameOver(msg.sender);
            setIsInputDisabled(true);
          }
        }
      } else if (msg.type === "GUESS_FEEDBACK") {

        setMyGuesses((prev) =>
          prev.map((entry) =>
            entry.guess === msg.guess && entry.tiles.includes("pending")
              ? { ...entry, tiles: msg.tiles ? stringToTiles(msg.tiles) : entry.tiles }
              : entry
          )
        );
      } else if (msg.type === "GAME_OVER") {
        setGameOver(msg.winner ?? msg.sender);
        setIsInputDisabled(true);
      }
    };

    socketService.listen("receive_message", handleMessage);

    return () => {
      socketService.off("receive_message");
    };
  }, [myUsername, mySecret, roomCode, scrollOpponentBottom]);
  const handleSubmit = useCallback(() => {
    const guess = inputValue.trim().toUpperCase();
    if (guess.length !== 5 || isInputDisabled || gameOver) return;
    const entry: GuessEntry = {
      id: makeId(),
      guess,
      tiles: Array(5).fill("pending"),
      timestamp: Date.now(),
    };
    setMyGuesses((prev) => [...prev, entry]);
    scrollMyBottom();
    setInputValue("");

    const msg: GameMessage = {
      type: "GUESS",
      guess,
      sender: myUsername,
    };
    socketService.sendGameMessage(msg, roomCode);
  }, [inputValue, isInputDisabled, gameOver, myUsername, roomCode, scrollMyBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (val.length <= 5) setInputValue(val);
  };
  const handlePlayAgain = () => {
    socketService.playAgain(roomCode);
    useSession.getState().setMySecret("");
    navigate(`/room?code=${roomCode}`, { replace: true });
  };

  // Exit: full reset, go home
  const handleExit = () => {
    useRoom.getState().clearRoom();
    useSession.getState().setMySecret("");
    navigate("/", { replace: true });
  };

  if (!myUsername) {
    navigate("/", { replace: true });
    return null;
  }

  const myMoveCount = myGuesses.length;
  const opponentMoveCount = opponentGuesses.length;

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,119,198,0.06),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* ── Top Bar ── */}
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(`/room?code=${roomCode}`)}
          className="flex items-center gap-1.5 rounded-full border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Room
        </button>

        {/* VS badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-zinc-300 sm:text-sm">
              {myUsername}
            </p>
            <p className="font-mono text-[10px] text-zinc-600 sm:text-xs">
              {myMoveCount} guesses
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-800/50">
            <Swords className="h-3.5 w-3.5 text-zinc-500" />
          </div>

          <div className="text-left">
            <p className="font-mono text-xs font-bold text-zinc-300 sm:text-sm">
              {opponentUsername}
            </p>
            <p className="font-mono text-[10px] text-zinc-600 sm:text-xs">
              {opponentMoveCount} guesses
            </p>
          </div>
        </div>

        {/* Room code */}
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-400">
            {roomCode}
          </span>
        </div>
      </header>

      {/* ── Main arena ── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden px-3 pt-4 pb-4 gap-3 sm:flex-row sm:px-4 sm:gap-4">
        {/* ── LEFT: My guesses ── */}
        <div className="flex flex-1 flex-col min-h-0">
          <GuessPanel
            title="Your Guesses"
            subtitle={myUsername}
            guesses={myGuesses}
            accentColor="text-indigo-400"
            scrollRef={myScrollRef}
          />

          {/* Input bar */}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled || Boolean(gameOver)}
                maxLength={5}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type your guess…"
                className="h-12 w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-4 text-center font-mono text-base font-bold tracking-[0.3em] text-zinc-100 uppercase placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-zinc-600 outline-none transition-all focus:border-zinc-600 focus:bg-zinc-900/90 disabled:opacity-40"
              />
              {/* Character counter */}
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-700">
                {inputValue.length}/5
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={inputValue.length !== 5 || isInputDisabled || Boolean(gameOver)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Divider (desktop) */}
        <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-3 sm:py-4">
          <div className="h-full w-px bg-zinc-800/60" />
          <span className="shrink-0 rounded-full border border-zinc-800/60 bg-zinc-900/50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-700">
            vs
          </span>
          <div className="h-full w-px bg-zinc-800/60" />
        </div>

        {/* Mobile divider */}
        <div className="flex items-center gap-3 sm:hidden">
          <div className="flex-1 h-px bg-zinc-800/60" />
          <span className="shrink-0 rounded-full border border-zinc-800/60 bg-zinc-900/50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-700">
            vs
          </span>
          <div className="flex-1 h-px bg-zinc-800/60" />
        </div>

        {/* ── RIGHT: Opponent guesses ── */}
        <div className="flex flex-1 flex-col min-h-0">
          <GuessPanel
            title="Opponent's Guesses"
            subtitle={opponentUsername}
            guesses={opponentGuesses}
            accentColor="text-rose-400"
            scrollRef={opponentScrollRef}
          />

          {/* Opponent typing indicator */}
          <div className="mt-3 flex h-12 items-center justify-center rounded-2xl border border-zinc-800/40 bg-zinc-900/20">
            <span className="text-xs font-medium text-zinc-700">
              Opponent's moves appear here in real-time
            </span>
          </div>
        </div>
      </div>

      {/* ── Game Over Overlay ── */}
      {gameOver && (
        <GameOverOverlay
          winnerName={gameOver}
          myUsername={myUsername}
          mySecret={mySecret}
          opponentUsername={opponentUsername}
          roomCode={roomCode}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </main>
  );
}
