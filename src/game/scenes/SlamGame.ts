import { Actor, Animation, CollisionType, Color, DefaultLoader, Engine, Font, FontUnit, ImageSource, Scene, SpriteSheet, Text, Vector } from "excalibur";
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

  private hostFloaties: Map<number, Floatie> = new Map();
  private guestFloaties: Map<number, Floatie> = new Map();
  private allFloaties: Map<number, Floatie> = new Map();

  private readonly boardX = 125;
  private readonly boardY = 125;
  private readonly boardWidth = game.drawWidth - this.boardX * 2;
  private readonly boardHeight = game.drawHeight - this.boardY * 2;

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
        turnManager: this.turnManager,
        id: i + 1,
        owner: peerStore.isHost ? peerStore.peer.id : peerStore.connection?.peer ?? "",
        x: pos.x,
        y: pos.y,
        hp: 100,
        attack: 20,
        effect: {
          name: 'mega',
          duration: 1
        }
      });
      this.hostFloaties.set(node.id, node);
      this.add(node);
    });
    arena.opponentPositions.forEach((pos, i) => {
      const node = new Floatie({
        turnManager: this.turnManager,
        id: i + 4,
        owner: peerStore.isHost ? peerStore.connection?.peer ?? "" : peerStore.peer.id,
        x: pos.x,
        y: pos.y,
        flipHorizontal: true,
        hp: 100,
        attack: 20,
        effect: {
          name: 'heal',
          duration: 0
        }
      });
      this.guestFloaties.set(node.id, node);
      this.add(node);
    });

    this.allFloaties = new Map([...this.hostFloaties, ...this.guestFloaties]);

    if (!peerStore.isHost) {
      peerStore.connection?.on("data", (data) => this.guestPeerDataHandler(data as any));
      peerStore.connection?.send({
        msg: "game:ready",
      });
      return;
    }
    peerStore.connection?.on("data", (data) => this.hostPeerDataHandler(data as any));

    const heads = this.turnManager.currentPlayer === peerStore.peer.id;
    this.playCoinFlip(heads);
    await peerStore.connection?.send({
      msg: "game:coin-flip",
      firstToMove: this.turnManager.currentPlayer
    });
  }

  public playOutTurnAndAdvance() {
    /*  let floatiesMoving = true;
     do {
       for (const floatie of this.allFloaties.values()) {
         if (floatie.vel.magnitude > 0.01) {
           floatiesMoving = true;
           break;
         }
         floatiesMoving = false;
       }
     } while (floatiesMoving); */
    this.turnManager.advanceTurn();
    peerStore.connection?.send({
      msg: "game:turn-advance",
    });
  }

  private hostPeerDataHandler({ msg, ...data }: { msg: string;[x: string]: any }) {
    switch (msg) {
      case "game:floatie-release-charge": {
        // { id: string, vel: { x: number, y: number } }
        const floatie = this.allFloaties.get(data.id);
        if (!floatie) {
          console.log(`Could not find floatie with id ${data.id} in ${this.allFloaties.keys()}`);
          break;
        };
        floatie.vel = new Vector(data.vel.x, data.vel.y);
        break;
      }
      case "game:turn-advance": {
        this.turnManager.advanceTurn();
        break;
      }

      default:
        break;
    }
  }

  private guestPeerDataHandler({ msg, ...data }: { msg: string;[x: string]: any }) {
    switch (msg) {
      case "game:floatie-position": {
        const floatie = this.allFloaties.get(data.id);
        if (floatie) {
          floatie.pos = new Vector(data.pos.x, data.pos.y);
        }
        break;
      }
      case "game:floatie-rotation": {
        const floatie = this.allFloaties.get(data.id);
        if (floatie) {
          floatie.rotation = data.rotation;
        }
        break;
      }
      case "game:coin-flip": {
        const heads = data.firstToMove === peerStore.peer.id;
        this.turnManager.currentPlayer = data.firstToMove;
        this.playCoinFlip(heads);
        break;
      }
      case "game:turn-advance": {
        this.turnManager.advanceTurn();
        break;
      }
      case "game:floatie-defeat": {
        const floatie = this.allFloaties.get(data.id);
        if (!floatie) {
          console.log(`Could not find floatie with id ${data.id} in ${this.allFloaties.keys()}`);
          break;
        }
        floatie.playDefeatAnimation();
        break;
      }

      default:
        break;
    }
  }


  private playCoinFlip(heads: boolean) {
    const backdrop = new Actor({
      x: 0,
      y: 0,
      width: game.canvasWidth,
      height: game.canvasHeight,
      color: Color.fromRGB(0, 0, 0, 0.3), // Dark semi-transparent overlay
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
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

    const textActor = new Actor({
      x: backdrop.width / 2 - 128 - 256,
      y: backdrop.height / 2 - 128,
      width: 128,
      height: 128,
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    const textGraphic = new Text({
      text: heads ? "You Start!" : "Opponent Starts!",
      font: new Font({
        family: "sans-serif",
        size: 24,
        unit: FontUnit.Px,
        bold: true,
      }),
      color: Color.White,
    });
    textActor.graphics.use(textGraphic);

    coinAnim.goToFrame(heads ? 23 : 0);
    this.add(backdrop);
    this.add(coinFlipActor);
    setTimeout(() => {
      coinAnim.goToFrame(heads ? 0 : 23);
      coinAnim.pause();
      this.add(textActor);
    }, 2000);

    setTimeout(() => {
      coinFlipActor.kill();
      textActor.kill();
      backdrop.kill();
    }, 4000);

  }
}

