import { Actor, CollisionType, Color, Rectangle, Vector } from "excalibur";

export class SpikeWall extends Actor {
  private static readonly WIDTH = 21;
  public damage: number = 3;

  constructor(x: number, y: number, direction: "vertical" | "horizontal", size: number = 100) {
    super({
      name: 'spikeWall',
      pos: new Vector(direction === "horizontal" ? x + size / 2 : x + SpikeWall.WIDTH / 2, direction === "horizontal" ? y + SpikeWall.WIDTH / 2 : y + size / 2),
      collisionType: CollisionType.Passive,
      width: direction === "horizontal" ? size : SpikeWall.WIDTH,
      height: direction === "horizontal" ? SpikeWall.WIDTH : size,
      color: Color.Black,
    })
    const graphics = new Rectangle({
      width: direction === "horizontal" ? size : SpikeWall.WIDTH,
      height: direction === "horizontal" ? SpikeWall.WIDTH : size,
      color: Color.Black
    });
    this.graphics.use(graphics);
  }

}