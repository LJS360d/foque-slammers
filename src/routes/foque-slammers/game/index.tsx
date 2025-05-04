import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createEffect, onCleanup, onMount } from "solid-js";
import { disposeGame, excaliburMain } from "../../../game/main";
import { peerStore } from "../../../store/peer.store";
import { turnsSignal } from "../../../game/scenes/TurnManager";
import { scoresSignal } from "../../../game/scenes/ScoreManager";

export const Route = createFileRoute("/foque-slammers/game/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  createEffect(() => {
    if (!peerStore.connection) {
      if (Number(import.meta.env.VITE_ENABLE_SINGLEPLAYER)) {
        console.warn(`prevented navigation to index route due to dev mode, connection in peer store is ${peerStore.connection}`);
        return;
      }
      navigate({
        to: "/foque-slammers"
      });
      return;
    }
  })

  onMount(() => {
    console.log("mounting game engine");
    excaliburMain("game");
  });

  onCleanup(() => {
    console.log("cleaning up game engine");
    disposeGame();
  });

  const playerScore = (playerId: string) => {
    const scoresMap = scoresSignal().get(playerId);
    return Array.from(scoresMap?.values() ?? []).reduce((acc, score) => acc + score, 0);
  }

  const hostId = peerStore.isHost ? peerStore.peer.id : peerStore.connection?.peer ?? "unknown";
  const guestId = peerStore.isHost ? peerStore.connection?.peer ?? "unknown" : peerStore.peer.id;

  return <main class="relative h-full w-full">
    <header class="absolute top-0 w-full h-16 ">
      <div class="relative flex justify-center items-center w-full h-full">
        <div
          class="absolute top-0 left-0 w-full h-full bg-blue-600  "
          style={{ "clip-path": 'polygon(0 0, 100% 0, 50% 140%)' }}
        />
        <div class="z-10 flex gap-8 justify-center-safe items-center w-full">
          <div class="flex flex-col items-center">
            <span>
              {hostId} {peerStore.isHost ? `(You)` : ``}
            </span>
            <span>
              score: {playerScore(hostId)}
            </span>
          </div>
          <div class="rounded-full bg-white flex flex-col items-center px-3">
            <legend class="text-xs text-gray-500">turn</legend>
            <span class="text-2xl text-black font-extrabold">{turnsSignal()}</span>
          </div>
          <div class="flex flex-col items-center">
            <span>
              {guestId} {peerStore.isHost ? `` : `(You) `}
            </span>
            <span>
              score: {playerScore(guestId)}
            </span>
          </div>
        </div>
      </div>
    </header>
    <canvas id="game" class="w-full h-full" />
  </main>;
}
