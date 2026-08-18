import { Player } from "./player.interface.ts";
export interface Room {
  id: string;
  ownerId: string;
  players: Player[];
  status: "WAITING" | "READY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  createdAt: number;
  winnerId?: string;
}
