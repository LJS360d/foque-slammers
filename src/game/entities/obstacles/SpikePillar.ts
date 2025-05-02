import { Actor, Circle, CircleCollider, Collider, CollisionContact, CollisionType, Color, Side, Vector } from "excalibur";
import { Node } from "../Node";

export class SpikePillar extends Actor {
  public damage: number = 3;
  public static readonly RADIUS = 40;
  constructor(x: number, y: number, radius = SpikePillar.RADIUS) {
    super({
      name: 'spikePillar',
      pos: new Vector(x, y),
      collisionType: CollisionType.Fixed,
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
    }
  }
}