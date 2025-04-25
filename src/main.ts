import { CollisionStartEvent, CollisionType, Engine, Loader, SolverStrategy } from 'excalibur';
import Play from './game/scenes/SlamGame';

// Create the game engine
const game = new Engine({
  physics: {
    solver: SolverStrategy.Realistic,
  },
  width: window.innerWidth,
  height: window.innerHeight,
});

// Add the scene to the game
game.add('play', new Play());

// Create a basic loader (optional for now)
const loader = new Loader();

// Start the game
game.start(loader).then(() => {
  game.goToScene('play');
  game.showDebug(true);
});