import { PlayerEntryForm } from "@/components/ui/player";
import { Brain } from "lucide-react";

export default function App() {
  document.title = "Sequence";
  return (
    <main className="relative min-h-screen w-full bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 selection:bg-zinc-800 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950" />

      <div className="absolute top-0 left-0 right-0 h-125 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-16">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative group cursor-default">
            <div className="absolute -inset-4 bg-zinc-800/20 rounded-full blur-xl group-hover:bg-zinc-700/30 transition-all duration-500" />
            <div className="relative w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800/80 shadow-2xl shadow-zinc-950 transform group-hover:scale-105 transition-all duration-500">
              <Brain className="w-10 h-10 text-zinc-100" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-br from-white to-zinc-500">
              Sequence
            </h1>
            <p className="text-zinc-400 text-lg sm:text-xl font-medium tracking-tight max-w-sm mx-auto">
              Deduce the sequence. <br className="hidden sm:block" /> Outsmart
              your opponent.
            </p>
          </div>
        </div>

        <PlayerEntryForm />
      </div>
    </main>
  );
}
