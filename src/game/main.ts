import { Engine, Loader, Resolution, SolverStrategy } from "excalibur";
import Play from "./scenes/SlamGame";

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

  game.add("play", new Play());

  const loader = new Loader();

  game.start(loader).then(() => {
    game.goToScene("play");
    if (Number(import.meta.env.VITE_EXCALIBUR_DEBUG)) {
      game.showDebug(true);
    }
  });
}
