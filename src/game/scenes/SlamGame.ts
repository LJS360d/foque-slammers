import { Actor, Animation, CollisionType, Color, DefaultLoader, Engine, Font, FontUnit, ImageSource, Scene, SpriteSheet, Text, Vector } from "excalibur";
import { peerStore } from "../../store/peer.store";
import { Arena } from "../entities/Arena";
import { Floatie } from "../entities/Floatie";
import { game } from "../main";
import type { ScoreManager } from "./ScoreManager";
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

  public playingOutTurn = false;

  constructor(public turnManager: TurnManager, public scoreManager: ScoreManager) {
    super();
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
        scoreManager: this.scoreManager,
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
        scoreManager: this.scoreManager,
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

  update(engine: Engine, delta: number) {
    super.update(engine, delta);
    if (!peerStore.isHost) return;
    if (!this.playingOutTurn) return;

    for (const floatie of this.allFloaties.values()) {
      if (floatie.vel.magnitude > 0.1) {
        return;
      }
    }
    this.playingOutTurn = false;
    this.turnManager.advanceTurn();
    peerStore.connection?.send({
      msg: "game:turn-advance",
    });
  }

  public playOutTurnAndAdvance() {
    this.playingOutTurn = true;
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
        this.playOutTurnAndAdvance();
        break;
      }
      case "game:floatie-aim": {
        const floatie = this.allFloaties.get(data.id);
        if (floatie) {
          floatie.rotation = data.rotation;
        }
        break;
      }

      default:
        break;
    }
  }

  private async guestPeerDataHandler({ msg, ...data }: { msg: string;[x: string]: any }) {
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
      case "game:score-update": {
        const playerId = data.playerId;
        const floatieId = data.floatieId;
        const increment = data.increment;
        this.scoreManager.addScore(playerId, floatieId, increment);
        break;
      }
      case "game:end": {
        const winner = data.winner;
        this.playEndingAnimation(winner);
        break;
      }
      case "rematch:accept": {
        // TODO rematch
        break;
      }
      case "rematch:decline": {
        window.open("/foque-slammers/", "_self");
        break;
      }
      default:
        break;
    }
  }


  private async playCoinFlip(heads: boolean) {
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
      this.remove(backdrop);
      this.remove(coinFlipActor);
      this.remove(textActor);
    }, 4000);

  }

  public async playEndingAnimation(winner: string) {
    const iWon = winner === peerStore.peer.id;
    const backdrop = new Actor({
      x: 0,
      y: 0,
      width: game.canvasWidth,
      height: game.canvasHeight,
      color: Color.fromRGB(0, 0, 0, 0.3), // Dark semi-transparent overlay
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });

    const textActor = new Actor({
      x: backdrop.width / 2 - 128 - 256,
      y: backdrop.height / 2 - 128,
      width: 128,
      height: 128,
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    const textGraphic = new Text({
      text: iWon ? "You Win!" : "You Lose!",
      font: new Font({
        family: "sans-serif",
        size: 24,
        unit: FontUnit.Px,
        bold: true,
      }),
      color: iWon ? Color.Green : Color.Red,
    });
    textActor.graphics.use(textGraphic);

    this.add(backdrop);
    this.add(textActor);

    // todo analytics actors

    const rematchButton = new Actor({
      x: 0,
      y: 0,
      width: game.canvasWidth,
      height: game.canvasHeight,
      color: Color.fromRGB(0, 0, 0, 0.3), // Dark semi-transparent overlay
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    rematchButton.graphics.use(
      new Text({
        text: "Rematch",
        font: new Font({
          family: "sans-serif",
          size: 24,
          unit: FontUnit.Px,
          bold: true,
        }),
        color: Color.White,
      }),
    );
    rematchButton.on("pointerdown", () => {
      this.turnManager.advanceTurn();
      peerStore.connection?.send({
        msg: "rematch:accept",
      });
    });

    const quitButton = new Actor({
      x: 0,
      y: 0,
      width: game.canvasWidth,
      height: game.canvasHeight,
      color: Color.fromRGB(0, 0, 0, 0.3), // Dark semi-transparent overlay
      anchor: Vector.Zero,
      collisionType: CollisionType.PreventCollision,
    });
    quitButton.graphics.use(
      new Text({
        text: "Quit",
        font: new Font({
          family: "sans-serif",
          size: 24,
          unit: FontUnit.Px,
          bold: true,
        }),
        color: Color.White,
      }),
    );
    quitButton.on("pointerdown", () => {
      this.turnManager.advanceTurn();
      peerStore.connection?.send({
        msg: "rematch:decline",
      });
    });

    setTimeout(() => {
      this.add(rematchButton);
      this.add(quitButton);
    }, 1000);


  }
}

