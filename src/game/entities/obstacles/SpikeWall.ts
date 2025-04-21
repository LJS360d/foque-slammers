import { Actor, Collider, CollisionContact, CollisionType, Color, Rectangle, Side, Vector } from "excalibur";
import { reflectVector } from "../../../utils/vector";
import { Node } from "../Node";

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

    onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
      if (other.owner instanceof Node) {
        other.owner.applyDamage(this.damage)
        other.owner.vel = reflectVector(other.owner.vel, contact.normal).scale(0.94);
      }
    }
}