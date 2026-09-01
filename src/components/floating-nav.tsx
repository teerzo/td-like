"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { FpsCounter } from "@/components/fps-counter";
import { AutoplayConfidenceBadge, AutoplayToggle } from "@/components/game/autoplay-toggle";
import { FreezeMapToggle } from "@/components/game/freeze-map-toggle";
import { useGameSettings } from "@/components/game/game-settings-provider";
import { LevelHud } from "@/components/game/level-hud";
import { usePlayHud, type PlayHudState } from "@/components/game/play-hud-provider";
import { ResourcesHud } from "@/components/game/resources-hud";
import { LoginForm } from "@/components/login-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function PlayStatusChips({ hud }: { hud: PlayHudState }) {
  return (
    <>
      <LevelHud level={hud.level} />
      <ResourcesHud
        gold={hud.gold}
        iron={hud.iron}
        wood={hud.wood}
        stone={hud.stone}
        food={hud.food}
        onAddResource={hud.onAddResource}
      />
    </>
  );
}

export function FloatingNav() {
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();
  const isPlayPage = pathname === "/play";
  const {
    autoplayEnabled,
    setAutoplayEnabled,
    freezeMapExpansion,
    setFreezeMapExpansion,
    autoplayConfidence,
  } = useGameSettings();
  const { hud } = usePlayHud();

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center">
        <div className="pointer-events-auto flex w-full max-w-5xl items-center gap-3 bg-transparent px-3 py-2">
          <div className="flex shrink-0 items-baseline gap-3 px-2">
            <Link href="/">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-3xl">
                td-like
              </h1>
            </Link>
            <FpsCounter />
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
            {isPlayPage && hud ? <PlayStatusChips hud={hud} /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setLoginOpen(true)}
            >
              Log in
            </Button>
            <Link
              href="/signup"
              className={buttonVariants({
                className: "bg-white text-black hover:bg-white/90",
              })}
            >
              Sign up
            </Link>
          </div>
        </div>

        {isPlayPage && hud ? (
          <div className="pointer-events-none flex w-full justify-center px-3 pb-1 md:hidden">
            <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-center gap-2 overflow-x-auto">
              <PlayStatusChips hud={hud} />
            </div>
          </div>
        ) : null}
      </nav>

      {isPlayPage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-4">
          <div className="pointer-events-auto flex items-center gap-2">
            <AutoplayConfidenceBadge confidence={autoplayConfidence} />
            <AutoplayToggle
              enabled={autoplayEnabled}
              onToggle={() => setAutoplayEnabled((current) => !current)}
            />
            <FreezeMapToggle
              enabled={freezeMapExpansion}
              onToggle={() => setFreezeMapExpansion((current) => !current)}
            />
          </div>
        </div>
      ) : null}

      {loginOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>
                Use your email and password to enter the game.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => setLoginOpen(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </>
  );
}
