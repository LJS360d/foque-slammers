import { Actor, Animation, CollisionType, Color, DefaultLoader, Engine, ImageSource, Scene, SpriteSheet, Vector } from "excalibur";
import { Arena } from "../entities/Arena";
import { Node } from "../entities/Node";
import { game } from "../main";

export default class Play extends Scene {
  static readonly Resources = {
    CoinFlipSpriteSheet48: new ImageSource("src/assets/seal_coin_flip_ss_48.png"),
  } as const;;

  private playerNodes: Node[] = [];
  private opponentNodes: Node[] = [];
  private allNodes: Node[] = [];

  private readonly boardX = 125;
  private readonly boardY = 125;
  private readonly boardWidth = game.drawWidth - this.boardX * 2;
  private readonly boardHeight = game.drawHeight - this.boardY * 2;
  private initialNodePositions: Map<Node, Vector> = new Map();

  onPreLoad(loader: DefaultLoader): void {
    loader.addResources(Object.values(Play.Resources));
  }

  async onInitialize(engine: Engine) {
    super.onInitialize(engine);
    const arena = new Arena(this.boardX, this.boardY, this.boardWidth, this.boardHeight);
    this.add(arena);

    arena.playerPositions.forEach((pos, i) => {
      const node = new Node({
        id: i + 1,
        owner: 'player',
        x: pos.x,
        y: pos.y,
        hp: 100,
        attack: 20,
        effect: {
          name: 'mega',
          duration: 1
        }
      });
      this.playerNodes.push(node);
    });
    arena.opponentPositions.forEach((pos, i) => {
      const node = new Node({
        id: i + 1,
        owner: 'opponent',
        x: pos.x,
        y: pos.y,
        hp: 100,
        attack: 20,
        effect: {
          name: 'heal',
          duration: 0
        }
      });
      this.opponentNodes.push(node);
    });

    this.allNodes = [...this.playerNodes, ...this.opponentNodes];
    this.allNodes.forEach(node => {
      engine.add(node);
      this.initialNodePositions.set(node, node.pos.clone());
    });


    const backdrop = new Actor({
      x: 0,
      y: 0,
      width: game.canvasWidth,
      height: game.canvasHeight,
      color: Color.fromRGB(0, 0, 0, 0.3), // Dark semi-transparent overlay
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision // Ensure it doesn't interfere with clicks
    });

    // Coin sprite sheet (assuming you have a sprite sheet with coin flip frames)
    const coinSheet = SpriteSheet.fromImageSource({
      image: Play.Resources.CoinFlipSpriteSheet48,
      grid: {
        rows: 1,
        columns: 48,
        spriteWidth: 128,
        spriteHeight: 128,
      }
    });
    const coinAnim = Animation.fromSpriteSheetCoordinates({
      spriteSheet: coinSheet,
      durationPerFrame: 5,
      frameCoordinates: Array.from({ length: 48 }, (_, i) => i).map(i => ({
        x: i,
        y: 0,
        width: 128,
        height: 128,
      })),
    })

    const coinFlipActor = new Actor({
      x: this.boardX + this.boardWidth / 2 - 64,
      y: this.boardY + this.boardHeight / 2 - 64,
      width: 128,
      height: 128,
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    coinFlipActor.graphics.use(coinAnim);
    const heads = Math.random() * 2 > 1;
    coinAnim.goToFrame(heads ? 23 : 0);
    this.add(backdrop);
    this.add(coinFlipActor);
    setTimeout(() => {
      coinAnim.goToFrame(heads ? 0 : 23);
      coinAnim.pause();
    }, 2000);

    setTimeout(() => {
      this.remove(coinFlipActor);
      this.remove(backdrop);
    }, 5000);
  }

}
