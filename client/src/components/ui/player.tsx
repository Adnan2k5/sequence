import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad2, Plus, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

import { socketService } from "@/api/socket";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";

import type { Room } from "@/types/game.interface";

export function PlayerEntryForm() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleRoomCreated = (room: Room) => {
      useRoom.getState().setRoom(room);
      useSession.getState().setUsername(room.players[0].username);

      toast.success(`Room ${room.id} created successfully!`);

      navigate(`/room?code=${room.id}`);
    };

    const handleRoomJoined = (room: Room) => {
      useRoom.getState().setRoom(room);
      useSession.getState().setUsername(
        room.players.find(
          (player) => player.socketId === socketService.getId(),
        )?.username ?? "",
      );

      toast.success(`Joined room ${room.id} successfully!`);

      navigate(`/room?code=${room.id}`);
    };

    const handleRoomFull = (roomId: string) => {
      toast.error(`Room ${roomId} is full. Please try another room.`);
    };

    const handleRoomNotFound = (roomId: string) => {
      toast.error(
        `Room ${roomId} not found. Please check the code and try again.`,
      );
    };

    socketService.listen("room_created", handleRoomCreated);
    socketService.listen("room_joined", handleRoomJoined);
    socketService.listen("room_full", handleRoomFull);
    socketService.listen("room_not_found", handleRoomNotFound);

    return () => {
      socketService.off("room_created");
      socketService.off("room_joined");
      socketService.off("room_full");
      socketService.off("room_not_found");
    };
  }, [navigate]);

  const handleCreate = () => {
    const username = name.trim();

    if (!username) return;

    socketService.createRoom(username);
  };

  const handleJoin = () => {
    const username = name.trim();
    const code = roomCode.trim().toUpperCase();

    if (!username || code.length !== 6) return;

    socketService.joinRoom(code, username);
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
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
              onChange={(e) =>
                setRoomCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, ""),
                )
              }
              maxLength={6}
              className="h-16 rounded-3xl bg-zinc-900/50 border-zinc-800/80 text-center text-xl font-bold tracking-[0.3em] uppercase focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 placeholder:tracking-normal placeholder:font-medium placeholder:text-zinc-600 transition-all"
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="h-14 w-14 rounded-full shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
                onClick={() => {
                  setIsJoining(false);
                  setRoomCode("");
                }}
              >
                <X className="w-6 h-6" />
              </Button>

              <Button
                className="h-14 rounded-full flex-1 bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-95 text-base font-semibold tracking-tight transition-all disabled:opacity-50"
                onClick={handleJoin}
                disabled={
                  !name.trim() ||
                  roomCode.length !== 6
                }
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