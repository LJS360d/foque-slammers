import { createFileRoute, Navigate } from "@tanstack/solid-router";
import { peerStore } from "../../../store/peer.store";
import { excaliburMain } from "../../../game/main";

export const Route = createFileRoute("/foque-slammers/game/")({
	component: RouteComponent,
});

function RouteComponent() {
	if (!peerStore.connection) {
		return <Navigate to="/foque-slammers" />;
	}
	excaliburMain();
	return null;
}
