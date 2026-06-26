import { create } from "zustand";
import type { Player, RoomState } from "@mgp/shared";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type RoomStore = {
  connection: ConnectionStatus;
  room: RoomState | null;
  me: Player | null;
  setConnection: (status: ConnectionStatus) => void;
  setRoom: (room: RoomState) => void;
  setMe: (player: Player) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  connection: "disconnected",
  room: null,
  me: null,
  setConnection: (connection) => set({ connection }),
  setRoom: (room) => set({ room }),
  setMe: (me) => set({ me }),
}));
