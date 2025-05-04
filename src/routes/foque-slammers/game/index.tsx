import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createEffect, onCleanup, onMount } from "solid-js";
import { disposeGame, excaliburMain } from "../../../game/main";
import { peerStore } from "../../../store/peer.store";

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

  return <main class="relative h-full w-full">
    <header class="absolute top-0 w-full h-16 ">
      <div class="relative flex justify-center items-center w-full h-full">
        <div
          class="absolute top-0 left-0 w-full h-full bg-blue-500"
          style={{ "clip-path": 'polygon(0 0, 100% 0, 50% 130%)' }}
        />
        <div class="z-10">
          {peerStore.isHost ? <>
            H {peerStore.peer.id}(You)
            {" "}
            vs
            {" "}
            G {peerStore.connection?.peer ?? "Unknown Opponent"}
          </> :
            <>
              H {peerStore.connection?.peer ?? "Unknown Opponent"}
              {" "}
              vs
              {" "}
              G {peerStore.peer.id}(You)
            </>
          }
        </div>
      </div>
    </header>
    <canvas id="game" class="w-full h-full" />
  </main>;
}
