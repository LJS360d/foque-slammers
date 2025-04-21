import { Actor, Vector, CollisionType, Color, Circle, Collider, CollisionContact, Side, CircleCollider } from "excalibur";
import { Node } from "../Node";
import { reflectVector } from "../../../utils/vector";

export class SpikePillar extends Actor {
  public damage: number = 3;
  constructor(x: number, y: number, radius = 40) {
    super({
      name: 'spikePillar',
      pos: new Vector(x, y),
      collisionType: CollisionType.Passive,
      color: Color.Black,
      collider: new CircleCollider({
        radius: radius
      })
    });

    // graphics
    const circleGraphics = new Circle({
      radius: radius,
    });

    this.graphics.use(circleGraphics);
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Node) {
      other.owner.applyDamage(this.damage)
      other.owner.vel = reflectVector(other.owner.vel, contact.normal).scale(0.94);
    }
  }
}