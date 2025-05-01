import { createFileRoute } from "@tanstack/solid-router";
import { peerStore } from "../../../store/peer.store";

export const Route = createFileRoute("/foque-slammers/game/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>{peerStore.connection?.connectionId}</div>;
}
