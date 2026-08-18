import type { Room } from "@/types/game.interface";
import { create } from "zustand";

export interface room {
  room: Room | null;
  setRoom: (room: Room | null) => void;
}

export const useRoom = create<room>((set) => ({
  room: null,
  setRoom: (room: Room | null) => set({ room }),
  clearRoom: () => set({ room: null }),
}));
