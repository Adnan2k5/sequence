/** Tile-level evaluation result for a single character */
export type TileState = "correct" | "present" | "absent" | "pending";

/** A single guess with its per-character evaluation */
export interface GuessEntry {
  id: string;
  guess: string;
  /** Per-character evaluation; empty array = pending (awaiting peer feedback) */
  tiles: TileState[];
  timestamp: number;
}

/** Wire format sent over send_message / receive_message */
export interface GameMessage {
  type: "GUESS" | "GUESS_FEEDBACK" | "GAME_OVER";
  guess: string;
  /** Per-character evaluation string, e.g. "correct,present,absent,absent,correct" */
  tiles?: string;
  sender: string;
  winner?: string;
}

/** Legacy shape kept for compatibility with existing server types */
export interface Guess {
  value: string;
  correctLetters: string[];
  correctPositions: string[];
  timestamp: number;
}

export interface Room {
  id: string;
  ownerId: string;
  status: "WAITING" | "READY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  players: Player[];
  winner?: string;
  createdAt: number;
}

export interface Player {
  socketId: string;
  username: string;
  ready: boolean;
  connected: boolean;
  secret?: string;
  guesses?: GuessEntry[];
}
