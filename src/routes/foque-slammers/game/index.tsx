import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createEffect } from "solid-js";
import { excaliburMain } from "../../../game/main";
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

  excaliburMain();
  return null;
}
