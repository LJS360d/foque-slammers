import { Engine, Loader, Resolution, SolverStrategy } from "excalibur";
import Play from "./scenes/SlamGame";
import { peerStore } from "../store/peer.store";
import { TurnManager } from "./scenes/TurnManager";

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

export function excaliburMain(canvasElementId?: string) {
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
  const turnManager = new TurnManager({
    players: [peerStore.peer.id, opponent],
    randomInitialHolder: true,
  })
  game.add("play", new Play(turnManager));
  const loader = new Loader();
  game.start(loader).then(() => {
    if (!peerStore.isHost) {
      game.goToScene("play");
    } else {
      peerStore.connection?.once("data", (data) => {
        if ((data as any).msg === "game:ready") {
          game.goToScene("play");
        }
      });
    }
    if (Number(import.meta.env.VITE_EXCALIBUR_DEBUG)) {
      game.showDebug(true);
    }
  });
}
