import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SessionStore {
  socketId: string;
  username: string;
  /** The player's own secret, stored locally before submit so game page can evaluate opponent guesses */
  mySecret: string;
  setSocketId: (socketId: string) => void;
  setUsername: (username: string) => void;
  setMySecret: (secret: string) => void;
}

export const useSession = create<SessionStore>()(
  persist(
    (set) => ({
      socketId: "",
      username: "",
      mySecret: "",
      setSocketId: (socketId) => set({ socketId }),
      setUsername: (username) => set({ username }),
      setMySecret: (mySecret) => set({ mySecret }),
    }),
    {
      name: "sequence_session",
      // Only persist non-ephemeral fields; socketId changes every reconnect
      partialize: (state) => ({
        username: state.username,
        mySecret: state.mySecret,
      }),
    }
  )
);
