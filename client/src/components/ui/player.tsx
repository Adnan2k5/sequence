import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad2, Plus, ArrowRight, X } from "lucide-react";
import { socketService } from "@/api/socket";
import { toast } from "sonner";

export function PlayerEntryForm() {
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  const redirectToRoom = (roomCode: string) => {
    const url = `/room?code=${roomCode}`;
    // window.location.href = url;
  };

  const handleCreate = (e: any) => {
    e.preventDefault();
    console.log(socketService.socket.id);
    socketService.createRoom();
    socketService.listen("room_created", (newRoomId: string) => {
      setRoomCode(newRoomId);
      setIsJoining(true);
    });
  };

  const handleJoin = (e: any) => {
    e.preventDefault();
    socketService.joinRoom(roomCode, name);
    socketService.listen("room_full", (roomCode: string) => {
      toast.error(`Room ${roomCode} is full. Please try another room.`);
    });
    socketService.listen("user_joined", (message: string) => {
      toast.success(message);
    });
    redirectToRoom(roomCode);
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 relative">
        <Input
          type="text"
          placeholder="Enter your alias"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-16 rounded-3xl bg-zinc-900/50 border-zinc-800/80 text-lg font-medium px-6 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 placeholder:text-zinc-600 transition-all"
        />
      </div>

      <div className="relative">
        {!isJoining ? (
          <div className="absolute inset-0 flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95 duration-300">
            <Button
              variant="outline"
              className="h-16 rounded-full flex-1 border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-zinc-100 text-base font-semibold tracking-tight transition-all"
              onClick={() => setIsJoining(true)}
              disabled={!name.trim()}
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Join Room
            </Button>
            <Button
              className="h-16 rounded-full flex-1 bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-95 text-base font-semibold tracking-tight transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:shadow-none"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Room
            </Button>
          </div>
        ) : (
          <div className="absolute inset-0 space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Input
              type="text"
              placeholder="6-DIGIT CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="h-16 rounded-3xl bg-zinc-900/50 border-zinc-800/80 text-center text-xl font-bold tracking-[0.3em] uppercase focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 placeholder:tracking-normal placeholder:font-medium placeholder:text-zinc-600 transition-all"
              maxLength={6}
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="h-14 w-14 rounded-full shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
                onClick={() => setIsJoining(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              <Button
                className="h-14 rounded-full flex-1 bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-95 text-base font-semibold tracking-tight transition-all disabled:opacity-50"
                onClick={handleJoin}
                disabled={roomCode.length < 6}
              >
                Enter Match
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
