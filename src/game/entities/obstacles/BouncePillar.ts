import { Actor, Circle, Collider, CollisionContact, CollisionType, Color, PolygonCollider, Side, Vector } from "excalibur";
import { Floatie } from "../Floatie";

/* function pointyTopHexagonPoints(w: number) {
  return [
    { x: w, y: 0 },
    { x: w + w * 0.5, y: w / 4 },
    { x: w + w * 0.5, y: w * (3 / 4) },
    { x: w, y: w },
    { x: w * 0.5, y: w * (3 / 4) },
    { x: w * 0.5, y: w / 4 },
  ];
} */
function flatTopHexagonPoints(width: number) {
  return [
    { x: width / 4, y: 0 },
    { x: width * (3 / 4), y: 0 },
    { x: width, y: width * 0.5 },
    { x: width * (3 / 4), y: width },
    { x: width / 4, y: width },
    { x: 0, y: width * 0.5 },
  ];
}


export class BouncePillar extends Actor {
  public damage: number = 1;
  public static readonly RADIUS = 40;
  constructor(x: number, y: number, radius = BouncePillar.RADIUS) {
    super({
      name: 'bouncePillar',
      pos: new Vector(x, y),
      collisionType: CollisionType.Fixed,
      color: Color.Yellow,
      collider: new PolygonCollider({
        // hexagon
        offset: new Vector(-radius, -radius),
        points: flatTopHexagonPoints(radius * 2).map(p => new Vector(p.x, p.y)),
      })
    });

    // graphics
    const circleGraphics = new Circle({
      radius: radius,
      color: Color.Yellow,
    });

    this.graphics.use(circleGraphics);
  }

  onCollisionStart(_self: Collider, other: Collider, _side: Side, _contact: CollisionContact): void {
    if (other.owner instanceof Floatie) {
      other.owner.attack += this.damage;
      other.owner.vel = other.owner.vel.scale(1.5);
    }
  }
}