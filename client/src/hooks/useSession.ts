import { create } from "zustand/react";

export interface session {
  socketId: string;
  username: string;
  setSocketId: (socketId: string) => void;
  setUsername: (username: string) => void;
}

export const useSession = create<session>((set) => ({
  socketId: "",
  username: "",
  setSocketId: (socketId: string) => set({ socketId }),
  setUsername: (username: string) => set({ username }),
}));
