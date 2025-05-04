import { Engine, Loader, Resolution, SolverStrategy } from "excalibur";
import { peerStore } from "../store/peer.store";
import Play from "./scenes/SlamGame";
import { TurnManager } from "./scenes/TurnManager";
import { ScoreManager } from "./scenes/ScoreManager";

export let game: Engine;
export function disposeGame() {
  if (game) {
    game.stop();
    game.dispose();
    game = null as any;
  }
}
const gameHeight = window.innerHeight;
const gameWidth = window.innerWidth;

export async function excaliburMain(canvasElementId?: string) {
  game = new Engine({
    physics: {
      solver: SolverStrategy.Realistic,
    },
    viewport: {
      width: gameWidth,
      height: gameHeight,
    },
    resolution: Resolution.Standard,
    canvasElementId
  });
  const opponent = peerStore.connection?.peer ?? "";
  if (!opponent) {
    console.warn("player 2 initialized as empty due to connection not being established");
  }
  const playerIds = [peerStore.peer.id, opponent];
  const turnManager = new TurnManager({
    players: playerIds,
    randomInitialHolder: true,
  });
  const scoreManager = new ScoreManager(playerIds);
  game.add("play", new Play(turnManager, scoreManager));
  const loader = new Loader();
  await game.start(loader)
  if (Number(import.meta.env.VITE_EXCALIBUR_DEBUG)) {
    game.showDebug(true);
  }

  if (!peerStore.isHost) {
    game.goToScene("play");
    return;
  }
  peerStore.connection?.once("data", (data) => {
    if ((data as any).msg === "game:ready") {
      game.goToScene("play");
    }
  });


}
