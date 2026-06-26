import { GomokuRoom } from "../../../../features/games/gomoku-room";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <GomokuRoom roomId={roomId} />;
}
