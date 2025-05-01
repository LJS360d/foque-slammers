import { Actor, Vector, CollisionType, Color, CircleCollider, Circle, Collider, CollisionContact, Side } from "excalibur";
import { Node } from "../Node";

export class BouncePillar extends Actor {
  public damage: number = 1;
  constructor(x: number, y: number, radius = 40) {
    super({
      name: 'bouncePillar',
      pos: new Vector(x, y),
      collisionType: CollisionType.Passive,
      color: Color.Yellow,
      collider: new CircleCollider({
        radius: radius
      })
    });

    // graphics
    const circleGraphics = new Circle({
      radius: radius,
      color: Color.Yellow,
    });

    this.graphics.use(circleGraphics);
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
      if (other.owner instanceof Node) {
        other.owner.attack += this.damage;
        other.owner.vel = other.owner.vel.scale(-1.2);
      }
  }
}