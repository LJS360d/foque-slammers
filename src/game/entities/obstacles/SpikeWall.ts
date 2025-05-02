import { Actor, Collider, CollisionContact, CollisionType, Color, Rectangle, Side, Vector } from "excalibur";
import { Node } from "../Node";

export class SpikeWall extends Actor {
  public static readonly WIDTH = 21;
  public damage: number = 3;

  constructor(x: number, y: number, direction: "vertical" | "horizontal", size: number = 100) {
    super({
      name: 'spikeWall',
      pos: new Vector(direction === "horizontal" ? x + size / 2 : x + SpikeWall.WIDTH / 2, direction === "horizontal" ? y + SpikeWall.WIDTH / 2 : y + size / 2),
      collisionType: CollisionType.Fixed,
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

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Node) {
      other.owner.applyDamage(this.damage)
    }
  }

}