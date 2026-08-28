import { GameCanvas } from "@/components/game/game-canvas";

export default function PlayPage() {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-black">
      <GameCanvas scene="play" />
    </main>
  );
}
