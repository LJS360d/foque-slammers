import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createEffect } from "solid-js";
import { disposeGame, excaliburMain, game } from "../../../game/main";
import { peerStore } from "../../../store/peer.store";

export const Route = createFileRoute("/foque-slammers/game/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  createEffect(() => {
    if (!peerStore.connection) {
      if (import.meta.env.DEV) {
        console.warn(`prevented navigation to index route due to dev mode, connection in peer store is ${peerStore.connection}`);
        return;
      }
      navigate({
        to: "/foque-slammers"
      });
      return;
    }
  })
  createEffect(() => {
    // for dev only, dispose the game when the HMR triggers
    if (import.meta.env.DEV && game) {
      disposeGame();
    }
    if (!game) {
      excaliburMain();
    }
  });
  return <canvas id="game" class="w-full h-full" />;
}
