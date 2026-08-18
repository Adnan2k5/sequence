import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Room } from "@/types/game.interface";

export interface RoomStore {
  room: Room | null;
  setRoom: (room: Room | null) => void;
  clearRoom: () => void;
}

export const useRoom = create<RoomStore>()(
  persist(
    (set) => ({
      room: null,
      setRoom: (room) => set({ room }),
      clearRoom: () => set({ room: null }),
    }),
    { name: "sequence_room" }
  )
);
