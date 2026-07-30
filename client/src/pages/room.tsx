import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  Copy,
  Check,
  Play,
  Loader2,
  Gamepad2,
  ShieldAlert,
} from "lucide-react";

export default function RoomPage() {
  const [role, setRole] = useState<"owner" | "joiner">("owner");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [secret, setSecret] = useState("");

  const [opponentPresent, setOpponentPresent] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [gameState, setGameState] = useState<"setup" | "playing">("setup");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("code");
    if (roomCode) {
      setCode(roomCode);
    }
    setOpponentPresent(role === "joiner");
    setOpponentReady(false);
    setIsReady(false);
    setSecret("");
    setGameState("setup");
  }, [role]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Room code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (/^([A-Z]+|[0-9]+)?$/.test(val)) {
      setSecret(val);
    }
  };

  const canStart = role === "owner" && opponentReady && secret.length === 5;

  return (
    <main className="relative min-h-screen w-full bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 selection:bg-zinc-800 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950" />
      <div className="absolute top-0 left-0 right-0 h-125 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl font-medium",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto perspective-1000">
        <div
          className={`relative w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${gameState === "playing" ? "h-150 sm:h-175" : "h-130"}`}
        >
          <div
            className={`absolute inset-0 flex flex-col items-center justify-between transition-all duration-500 bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 rounded-[2.5rem] p-8 shadow-2xl ${gameState === "playing" ? "opacity-0 scale-95 pointer-events-none blur-sm" : "opacity-100 scale-100 blur-0"}`}
          >
            {role === "owner" ? (
              <div className="flex flex-col items-center w-full space-y-3">
                <span className="text-zinc-500 font-semibold uppercase tracking-widest text-xs">
                  Share Room Code
                </span>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between bg-zinc-950/50 border border-zinc-800/80 rounded-[2rem] px-6 py-4 cursor-pointer hover:bg-zinc-900 transition-all group active:scale-[0.98]"
                >
                  <span className="text-3xl font-mono font-bold tracking-[0.3em] text-zinc-100">
                    {code}
                  </span>
                  <div className="bg-zinc-800/50 p-2 rounded-full group-hover:bg-zinc-700/50 transition-colors">
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full space-y-2 py-4">
                <ShieldAlert className="w-10 h-10 text-zinc-700 mb-2" />
                <h2 className="text-xl font-bold tracking-tight">
                  Connected to Host
                </h2>
                <p className="text-sm text-zinc-500">
                  Room Code:{" "}
                  <span className="font-mono text-zinc-400">{code}</span>
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 text-sm font-medium bg-zinc-950/30 px-6 py-3 rounded-full border border-zinc-800/30">
              <div
                className={`w-2.5 h-2.5 rounded-full ${opponentPresent ? (opponentReady ? "bg-green-400" : "bg-amber-400 animate-pulse") : "bg-zinc-600"}`}
              />
              <span
                className={opponentPresent ? "text-zinc-300" : "text-zinc-500"}
              >
                {!opponentPresent
                  ? "Waiting for opponent..."
                  : !opponentReady
                    ? role === "owner"
                      ? "Opponent typing secret..."
                      : "Host is setting up..."
                    : "Opponent is ready"}
              </span>
            </div>

            <div className="w-full space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between px-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Your Secret Sequence
                  </label>
                  <span className="text-xs text-zinc-500 font-mono">
                    {secret.length}/5
                  </span>
                </div>
                <Input
                  type="text"
                  maxLength={5}
                  value={secret}
                  onChange={handleSecretChange}
                  disabled={isReady && role === "joiner"}
                  className="h-20 rounded-3xl bg-zinc-950/50 border-zinc-800/80 text-center text-4xl font-mono tracking-[0.5em] focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 transition-all placeholder:text-zinc-800 placeholder:tracking-normal placeholder:text-2xl"
                  placeholder="•••••"
                />
              </div>

              {role === "owner" ? (
                <div className="relative h-14 w-full">
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-sm font-medium text-zinc-500 bg-zinc-950/50 rounded-full border border-zinc-800/50 transition-all duration-300 ${canStart ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
                  >
                    {!opponentPresent
                      ? "Waiting for opponent..."
                      : !opponentReady
                        ? "Opponent choosing secret..."
                        : "Enter 5 characters to start"}
                  </div>
                  <Button
                    className={`absolute inset-0 w-full h-14 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-95 text-base font-semibold shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] transition-all duration-300 ${canStart ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
                    onClick={() => setGameState("playing")}
                  >
                    Start Match
                    <Play className="w-4 h-4 ml-2 fill-current" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-14 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-95 text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:scale-100"
                  disabled={secret.length !== 5 || isReady}
                  onClick={() => {
                    setIsReady(true);
                    toast.success(
                      "Ready! Waiting for host to start the match.",
                    );
                  }}
                >
                  {isReady ? "Waiting for Host..." : "Ready to Play"}
                  {!isReady && <Check className="w-5 h-5 ml-2" />}
                  {isReady && <Loader2 className="w-5 h-5 ml-2 animate-spin" />}
                </Button>
              )}
            </div>
          </div>

          <div
            className={`absolute inset-0 bg-zinc-900 border border-zinc-800/80 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center transition-all duration-700 delay-100 ${gameState === "playing" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-24 pointer-events-none"}`}
          >
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center opacity-50">
              <span className="text-xs font-mono tracking-widest uppercase">
                Room: {code}
              </span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
            </div>

            <Gamepad2 className="w-16 h-16 text-zinc-800 mb-6" />
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
              Game Area
            </h2>
            <p className="text-zinc-500 mt-2 font-medium">Board rendering...</p>
          </div>
        </div>
      </div>

      {/* <button
        onClick={() => setRole(role === "owner" ? "joiner" : "owner")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-zinc-600 hover:text-zinc-300 transition-colors bg-zinc-900/50 px-4 py-2 rounded-full backdrop-blur-sm border border-zinc-800/50"
      >
        View as {role === "owner" ? "Joiner" : "Owner"}
      </button> */}
    </main>
  );
}
