import { DefaultLoader, Engine, ImageSource, Scene, Vector } from "excalibur";
import { peerStore } from "../../store/peer.store";
import { Arena } from "../entities/Arena";
import { Floatie } from "../entities/Floatie";
import { game } from "../main";
import { TurnManager } from "./TurnManager";

const ASSETS_DIR = "/foque-slammers/assets"
export default class Play extends Scene {
  static readonly Resources = {
    CoinFlipSpriteSheet48: new ImageSource(`${ASSETS_DIR}/seal_coin_flip_ss_48.png`),
    FloatieBlue: new ImageSource(`${ASSETS_DIR}/floatie-blue-256.png`),
    FloatieRed: new ImageSource(`${ASSETS_DIR}/floatie-red-256.png`),
  } as const;

  private playerNodes: Floatie[] = [];
  private opponentNodes: Floatie[] = [];
  private allNodes: Floatie[] = [];

  private readonly boardX = 125;
  private readonly boardY = 125;
  private readonly boardWidth = game.drawWidth - this.boardX * 2;
  private readonly boardHeight = game.drawHeight - this.boardY * 2;
  private initialNodePositions: Map<Floatie, Vector> = new Map();

  private turnManager: TurnManager;

  constructor() {
    super();
    const opponent = peerStore.connection?.peer ?? "";
    if (!opponent) {
      console.warn("player 2 initialized as empty due to connection not being established");
    }
    this.turnManager = new TurnManager({
      players: [peerStore.peer.id, opponent],
      randomInitialHolder: true,
    });
  }

  onPreLoad(loader: DefaultLoader): void {
    loader.addResources(Object.values(Play.Resources));
  }

  async onInitialize(engine: Engine) {
    super.onInitialize(engine);
    const arena = new Arena(this.boardX, this.boardY, this.boardWidth, this.boardHeight);
    this.add(arena);

    arena.playerPositions.forEach((pos, i) => {
      const node = new Floatie({
        id: i + 1,
        owner: peerStore.peer.id,
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
      const node = new Floatie({
        id: i + 4,
        owner: peerStore.connection?.peer ?? "",
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

    /* 
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
        }, 5000); */


    peerStore.connection?.on("data", (data) => this.gamePeerDataHandler(data as any));
  }

  private gamePeerDataHandler({ msg, ...data }: { msg: string;[x: string]: any }) {
    switch (msg) {
      case "game:floatie-position": {
        const node = this.allNodes.find(node => node.id === data.id);
        if (node) {
          node.pos = new Vector(data.pos.x, data.pos.y);
        }
        break;
      }

      default:
        break;
    }
  }
}

