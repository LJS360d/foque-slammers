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
  // Create the game engine
  game = new Engine<"play">({
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

  // Create a basic loader (optional for now)
  const loader = new Loader();

  // Start the game
  game.start(loader).then(() => {
    game.goToScene("play");
    if (Number(import.meta.env.VITE_EXCALIBUR_DEBUG)) {
      game.showDebug(true);
    }
  });
}
