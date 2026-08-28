import { GameCanvas } from "@/components/game/game-canvas";
import { HomeMenu } from "@/components/home-menu";

export default function Home() {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-black">
      <GameCanvas scene="home" />
      <HomeMenu />
    </main>
  );
}
