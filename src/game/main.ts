import { Engine, Loader, SolverStrategy } from "excalibur";
import Play from "./scenes/SlamGame";

export function excaliburMain() {
  // Create the game engine
  const game = new Engine({
    physics: {
      solver: SolverStrategy.Realistic,
    },
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Add the scene to the game
  game.add("play", new Play());

  // Create a basic loader (optional for now)
  const loader = new Loader();

  // Start the game
  game.start(loader).then(() => {
    game.goToScene("play");
    if (import.meta.env.EXCALIBUR_DEBUG) {
      game.showDebug(true);
    }
  });
}
