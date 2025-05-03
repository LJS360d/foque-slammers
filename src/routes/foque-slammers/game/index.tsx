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
      if (import.meta.env.ENABLE_SINGLEPLAYER) {
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

  return <canvas id="game" class="w-full h-full" />;
}
