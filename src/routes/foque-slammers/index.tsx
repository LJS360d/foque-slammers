import bg from "@/assets/bg.avif";
import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import type { DataConnection } from "peerjs";
import { AiFillCopy } from "solid-icons/ai";
import { BiSolidHide, BiSolidShow } from "solid-icons/bi";
import { For, createEffect, createSignal } from "solid-js";
import {
	type GameInvitation,
	managePeerDataConnection,
	peerStore,
	setPeerStore,
} from "../../store/peer.store";
import { copyToClipboard } from "../../utils/native";
import { createStore } from "solid-js/store";

export const Route = createFileRoute("/foque-slammers/")({
	component: App,
});

function App() {
	return (
		<main
			class="h-screen flex p-10 pl-20 space-x-8 bg-cover"
			style={{ "background-image": `url(${bg})` }}
		>
			<section class="flex bg-base-200 flex-col w-3/4 gap-4 max-h-screen overflow-auto">
				<GameCodeSection />
				<QuickGameInviteSection />
			</section>
			<section class="flex bg-base-200 flex-col w-2/4 items-center max-h-screen overflow-auto">
				<GameInvitationsSection />
			</section>
			<section class="flex flex-col w-full space-y-8">
				<div class="bg-base-300 flex flex-col w-full h-full justify-center items-center">
					Coming soon...
				</div>
				<div class="bg-base-300 flex flex-col w-full h-1/2 justify-center items-center">
					Coming soon...
				</div>
				<div class="bg-base-300 flex flex-col w-full justify-center items-center h-1/4">
					<h2>Coming soon...</h2>
				</div>
			</section>
		</main>
	);
}

function GameCodeSection() {
	const [flags, setFlags] = createStore({
		showPeerId: true,
		peerIdHovered: false,
		peerIdCopied: false,
	});

	const peerIdText = () => {
		if (flags.showPeerId) {
			return peerStore.peer?.id ?? "Loading...";
		}
		return peerStore.peer ? `${"?".repeat(9)}` : "Loading...";
	};

	return (
		<div class="stats rounded-none bg-base-100 border-base-300 border">
			<div class="stat">
				<div class="stat-title">Your game code</div>
				<div class="stat-value">
					{peerIdText()}
					<div class="tooltip tooltip-bottom" data-tip="Copy">
						<button
							type="button"
							disabled={!peerStore.peer}
							class="relative btn btn-ghost px-0 ml-2 mb-2"
							on:click={() => {
								copyToClipboard(peerStore.peer?.id ?? "");
								setFlags("peerIdCopied", true);
								setTimeout(() => setFlags("peerIdCopied", false), 1500);
							}}
						>
							<AiFillCopy size={32} />
						</button>
						{flags.peerIdCopied && (
							<>
								<div class="tooltip-arrow" />
								<div class="tooltip-content">Copied!</div>
							</>
						)}
					</div>
				</div>
				<div class="stat-actions">
					<button
						type="button"
						tabIndex={-1}
						class="btn btn-xs btn-primary"
						on:click={() =>
							setFlags({ ...flags, showPeerId: !flags.showPeerId })
						}
					>
						{flags.showPeerId ? (
							<>
								<BiSolidHide />
								Hide
							</>
						) : (
							<>
								<BiSolidShow />
								Show
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

function QuickGameInviteSection() {
	const [gameCode, setGameCode] = createSignal("");
	const [validationError, setValidationError] = createSignal("");
	const [result, setResult] = createSignal("");

	const handleSubmit = async (event: SubmitEvent) => {
		// prevents default form submission through action
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const enteredGameCode = formData.get("gameCode") as string;
		if (!enteredGameCode.trim()) {
			setValidationError("Please enter a game code.");
			return;
		}

		if (enteredGameCode.length !== 9) {
			setValidationError("Game code must be 9 characters long.");
			return;
		}

		if (enteredGameCode === peerStore.peer.id) {
			setValidationError("You can't invite yourself.");
			return;
		}
		// clears any previous validation errors
		setValidationError("");
		const connection = peerStore.peer.connect(enteredGameCode, {
			reliable: true,
		});
		connection.on("open", async () => {
			managePeerDataConnection(connection);
			setPeerStore("connection", connection);
			const invitation: GameInvitation = {
				from: peerStore.peer.id,
				to: enteredGameCode,
				connectionId: connection.connectionId,
			};
			await connection.send({
				msg: "invitation",
				...invitation,
			});
			const newInvites = new Set(peerStore.invites);
			newInvites.add(invitation);
			setPeerStore("invites", newInvites);
			setResult("Invite sent!");
		});
	};

	const handleInputChange = (event: Event) => {
		setGameCode((event.target as HTMLInputElement).value);
		// clears any validation errors as the user types/pastes
		if (validationError()) {
			setValidationError("");
		}
	};

	return (
		<div class="stats rounded-none bg-base-100 border-base-300 border">
			<div class="stat pb-6 ">
				<h1 class="stat-value">Quick Game Invite</h1>
				<form on:submit={handleSubmit} class="join mt-2">
					<input
						type="text"
						placeholder="Enter another player's game code"
						class="input input-bordered w-full"
						name="gameCode"
						maxlength={9}
						value={gameCode()}
						onInput={handleInputChange}
					/>
					<button
						type="submit"
						class="btn btn-primary"
						disabled={validationError() !== ""}
					>
						Invite
					</button>
				</form>
				{validationError() && (
					<div class="text-error mt-1">{validationError()}</div>
				)}
				{result() && <div class="text-success mt-1">{result()}</div>}
			</div>
		</div>
	);
}

// ###############################

function GameInvitationsSection() {
	const navigate = useNavigate();

	const handleInvitaionAction = async (
		invitation: GameInvitation,
		accept: boolean,
	) => {
		const connection = peerStore.peer.getConnection(
			invitation.from,
			invitation.connectionId,
		) as DataConnection;
		if (!connection.open) {
			window.alert(
				"Seems like your browser is not supporting WebRTC, check your WebRTC settings or try another browser.",
			);
			return;
		}
		await connection.send({
			msg: accept ? "accept" : "decline",
			connectionId: invitation.connectionId,
		});
		const newInvites = peerStore.invites;
		newInvites.delete(invitation);
		setPeerStore("invites", newInvites);
		if (accept) {
			navigate({
				to: "/foque-slammers/game",
			});
		}
	};

	createEffect(() => {
		const currentConnection = peerStore.connection;

		if (currentConnection) {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			currentConnection.on("data", (data: any) => {
				if (!("msg" in data)) {
					return;
				}
				if (data.msg === "accept") {
					navigate({
						to: "/foque-slammers/game",
					});
					return;
				}
				if (data.msg === "decline") {
					for (const invite of peerStore.invites) {
						if (invite.connectionId === data.connectionId) {
							const newSet = new Set(peerStore.invites);
							newSet.delete(invite);
							setPeerStore("invites", newSet);
							return;
						}
					}
				}
			});
			// It's crucial to clean up the listener when the connection changes
			return () => {
				currentConnection.off("data", undefined);
			};
		}
	});

	return (
		<ul class="list w-full space-y-4">
			<For
				each={Array.from(peerStore.invites)}
				fallback={
					<li class="list-item p-2 self-center bg-base-100 w-full text-center">
						No invitations
					</li>
				}
			>
				{(invitation) => (
					<li class="list-item bg-base-100 p-4 rounded-none">
						<div class="text-xl text-center outline py-2">
							<b>{invitation.from}</b> vs <b>{invitation.to}</b>
						</div>
						<section
							id="chat"
							class="h-80 outline flex flex-col items-center justify-center"
						>
							[Chat] Coming soon...
						</section>

						{invitation.from !== peerStore.peer.id ? (
							<div class="flex justify-center text-lg">
								<button
									type="button"
									class="btn btn-outline w-1/2 rounded-none"
									on:click={() => handleInvitaionAction(invitation, false)}
								>
									Decline
								</button>
								<button
									type="button"
									class="btn btn-outline btn-primary w-1/2 rounded-none"
									on:click={() => handleInvitaionAction(invitation, true)}
								>
									Accept
								</button>
							</div>
						) : (
							<div class="flex justify-center gap-2 text-lg">
								Awaiting opponent
								<span class="loading loading-dots loading-xs self-end" />
							</div>
						)}
					</li>
				)}
			</For>
		</ul>
	);
}
