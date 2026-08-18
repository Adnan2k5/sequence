import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Room } from "@/types/game.interface";
import { Copy, Check, Loader2, ShieldAlert, ArrowRight, User } from "lucide-react";
import { socketService } from "@/api/socket";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";

// ─── Username prompt overlay (shown when navigating via direct link) ──────────

interface UsernamePromptProps {
  roomCode: string;
  onJoined: () => void;
}

function UsernamePrompt({ roomCode, onJoined }: UsernamePromptProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleRoomJoined = (room: Room) => {
      useRoom.getState().setRoom(room);
      const joinedPlayer = room.players.find(
        (p) => p.socketId === socketService.getId()
      );
      useSession
        .getState()
        .setUsername(joinedPlayer?.username ?? name.trim());
      toast.success(`Joined room ${room.id}!`);
      onJoined();
    };

    const handleRoomFull = (roomId: string) => {
      toast.error(`Room ${roomId} is full.`);
      setIsLoading(false);
    };

    const handleRoomNotFound = (roomId: string) => {
      toast.error(`Room ${roomId} not found. Check the code and try again.`);
      setIsLoading(false);
    };

    const handleRoomError = (msg: string) => {
      toast.error(msg);
      setIsLoading(false);
    };

    socketService.listen("room_joined", handleRoomJoined);
    socketService.listen("room_full", handleRoomFull);
    socketService.listen("room_not_found", handleRoomNotFound);
    socketService.listen("room_error", handleRoomError);

    return () => {
      socketService.off("room_joined");
      socketService.off("room_full");
      socketService.off("room_not_found");
      socketService.off("room_error");
    };
  }, [name, onJoined]);

  const handleJoin = () => {
    const username = name.trim();
    if (!username || !roomCode) return;
    setIsLoading(true);
    socketService.joinRoom(roomCode, username);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-400">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_40%,rgba(99,102,241,0.06),transparent)]" />

      <div className="relative w-full max-w-sm px-4">
        <div className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-zinc-800/60 bg-zinc-950/60">
            <User className="h-7 w-7 text-zinc-400" />
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black tracking-tight text-zinc-100">
              Join Room
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter your alias to join{" "}
              <span className="font-mono font-bold text-zinc-400">
                {roomCode}
              </span>
            </p>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Your alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={20}
              autoComplete="off"
              className="h-14 rounded-2xl border-zinc-800/80 bg-zinc-950/60 text-center text-base font-semibold placeholder:font-normal placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 transition-all"
            />

            <Button
              className="h-14 w-full rounded-2xl text-base font-bold"
              disabled={!name.trim() || isLoading}
              onClick={handleJoin}
            >
              {isLoading ? (
                <>
                  Joining…
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Enter Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Room Page ────────────────────────────────────────────────────────────────

export default function RoomPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [secret, setSecret] = useState("");

  // --- Identity (username-based so it survives socket reconnection on refresh) ---
  const myUsername = useSession((state) => state.username);
  const setMySecret = useSession((state) => state.setMySecret);

  // --- Room state ---
  const room = useRoom((state) => state.room);
  const setRoom = useRoom((state) => state.setRoom);

  // --- Derive room code from URL query param first, fall back to store ---
  const searchParams = new URLSearchParams(window.location.search);
  const roomCode = searchParams.get("code") || room?.id || "";

  // --- Show username prompt for direct-link joins (no username in session) ---
  // Once they join, this flips to false and normal room UI appears
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(
    () => !myUsername && Boolean(roomCode)
  );

  // If username becomes available (e.g., persisted from storage), hide the prompt
  useEffect(() => {
    if (myUsername) setShowUsernamePrompt(false);
  }, [myUsername]);

  // --- Derive identity via username (socket ID is ephemeral across refreshes) ---
  const me = room?.players.find((p) => p.username === myUsername);
  const opponent = room?.players.find((p) => p.username !== myUsername);

  const ownerPlayer = room?.players.find((p) => p.socketId === room.ownerId);
  const isOwner = ownerPlayer?.username === myUsername;

  const opponentReady = opponent?.ready ?? false;
  const opponentPresent = Boolean(opponent);
  const isReady = me?.ready ?? false;

  // --- Rejoin socket room and fetch fresh state on every mount ---
  useEffect(() => {
    // Don't try to get the room until we have a username (direct-link users
    // will join via the UsernamePrompt which handles room_joined itself)
    if (!roomCode || showUsernamePrompt) return;

    const handleRoomData = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    socketService.listen("room_data", handleRoomData);
    socketService.getRoom(roomCode);

    return () => {
      socketService.off("room_data");
    };
  }, [roomCode, setRoom, showUsernamePrompt]);

  // --- Listen for room_updated — navigate directly inside handler ---
  useEffect(() => {
    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
      const code =
        new URLSearchParams(window.location.search).get("code") ||
        updatedRoom.id;
      const allReady =
        updatedRoom.players.length === 2 &&
        updatedRoom.players.every((p) => p.ready);
      if (allReady && code) {
        navigate(`/game?code=${code}`, { replace: true });
      }
    };

    socketService.listen("room_updated", handleRoomUpdated);

    return () => {
      socketService.off("room_updated");
    };
  }, [setRoom, navigate]);

  // --- Handle room not found ---
  useEffect(() => {
    const handleNotFound = () => {
      toast.error("Room not found. It may have expired.");
      useRoom.getState().clearRoom();
      navigate("/");
    };

    socketService.listen("room_not_found", handleNotFound);

    return () => {
      socketService.off("room_not_found");
    };
  }, [navigate]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success("Room code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy room code");
    }
  }, [roomCode]);

  const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(val)) {
      setSecret(val);
    }
  };

  const handleReady = () => {
    setMySecret(secret);
    socketService.submitSecret(secret, roomCode);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Username prompt overlay for direct-link joins */}
      {showUsernamePrompt && (
        <UsernamePrompt
          roomCode={roomCode}
          onJoined={() => setShowUsernamePrompt(false)}
        />
      )}

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[500px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Page content */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          {/* Room card */}
          <div className="relative min-h-[620px] overflow-hidden rounded-[2.5rem] border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-2xl sm:min-h-[660px] sm:p-8">
            <div className="flex min-h-[560px] flex-col justify-between">
              {/* Header */}
              <div className="space-y-6">
                {/* Room information */}
                {isOwner ? (
                  <div className="flex w-full flex-col items-center space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Share Room Code
                    </span>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="group flex w-full items-center justify-between rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950/60 px-5 py-4 transition-all hover:bg-zinc-900 active:scale-[0.98] sm:px-6"
                    >
                      <span className="min-w-0 flex-1 truncate text-left font-mono text-2xl font-bold tracking-[0.25em] text-zinc-100 sm:text-3xl">
                        {roomCode}
                      </span>

                      <div className="ml-4 shrink-0 rounded-full bg-zinc-800/50 p-2.5 transition-colors group-hover:bg-zinc-700/50">
                        {copied ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-3 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950/50">
                      <ShieldAlert className="h-7 w-7 text-zinc-600" />
                    </div>

                    <h2 className="text-xl font-bold tracking-tight">
                      Connected to Host
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Room Code:{" "}
                      <span className="font-mono text-zinc-400">
                        {roomCode}
                      </span>
                    </p>
                  </div>
                )}

                {/* Opponent status */}
                <div className="flex w-full items-center justify-center">
                  <div className="flex items-center gap-3 rounded-full border border-zinc-800/40 bg-zinc-950/40 px-5 py-3 text-sm font-medium">
                    <div
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        opponentPresent
                          ? opponentReady
                            ? "bg-green-400"
                            : "animate-pulse bg-amber-400"
                          : "bg-zinc-600"
                      }`}
                    />

                    <span
                      className={
                        opponentPresent ? "text-zinc-300" : "text-zinc-500"
                      }
                    >
                      {!opponentPresent
                        ? "Waiting for opponent..."
                        : !opponentReady
                          ? isOwner
                            ? "Opponent typing secret..."
                            : "Host is setting up..."
                          : "Opponent is ready"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Secret section */}
              <div className="w-full space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <label
                      htmlFor="secret"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      Your Secret Sequence
                    </label>

                    <span className="font-mono text-xs text-zinc-500">
                      {secret.length}/5
                    </span>
                  </div>

                  <Input
                    id="secret"
                    type="text"
                    maxLength={5}
                    value={secret}
                    onChange={handleSecretChange}
                    disabled={isReady}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-20 rounded-3xl border-zinc-800/80 bg-zinc-950/60 text-center font-mono text-3xl tracking-[0.35em] transition-all placeholder:text-2xl placeholder:tracking-normal placeholder:text-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 sm:text-4xl"
                    placeholder="•••••"
                  />
                </div>

                <Button
                  className="h-14 w-full rounded-2xl text-base font-semibold"
                  disabled={secret.length !== 5 || isReady}
                  onClick={handleReady}
                >
                  {isReady ? "Ready" : "Ready to Play"}

                  {isReady ? (
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="ml-2 h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}