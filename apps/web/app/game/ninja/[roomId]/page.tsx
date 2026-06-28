import { NinjaRoom } from "../../../../features/games/ninja-room";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <NinjaRoom roomId={roomId} />;
}
