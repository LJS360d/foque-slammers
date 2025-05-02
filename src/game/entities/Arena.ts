import { Actor, Collider, CollisionContact, CollisionType, Color, PolygonCollider, Side, Vector } from 'excalibur';
import { SpikeWall } from './obstacles/SpikeWall';
import { BouncePillar } from './obstacles/BouncePillar';
import { reflectVector } from '../../utils/vector';
import { Node } from './Node';
import { SpikePillar } from './obstacles/SpikePillar';

export class Arena extends Actor {
  private static readonly WALL_THICKNESS = 500;
  private static readonly WALL_COLOR = Color.DarkGray;
  private halfWidth: number
  private halfHeight: number;

  constructor(private x: number, private y: number, width: number, height: number) {
    super({ name: 'board', collisionType: CollisionType.Fixed });

    const topWall = new Actor({
      name: 'topWall',
      pos: new Vector(x + width / 2, y - Arena.WALL_THICKNESS / 2),
      width: width,
      height: Arena.WALL_THICKNESS,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    topWall.onCollisionStart = this.onCollisionStart.bind(this);
    this.addChild(topWall);

    const bottomWall = new Actor({
      name: 'bottomWall',
      pos: new Vector(x + width / 2, y + height + Arena.WALL_THICKNESS / 2),
      width: width,
      height: Arena.WALL_THICKNESS,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    bottomWall.onCollisionStart = this.onCollisionStart.bind(this);
    this.addChild(bottomWall);

    const leftWall = new Actor({
      name: 'leftWall',
      pos: new Vector(x - Arena.WALL_THICKNESS / 2, y + height / 2),
      width: Arena.WALL_THICKNESS,
      height: height + Arena.WALL_THICKNESS * 2,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    leftWall.onCollisionStart = this.onCollisionStart.bind(this);
    this.addChild(leftWall);

    const rightWall = new Actor({
      name: 'rightWall',
      pos: new Vector(x + width + Arena.WALL_THICKNESS / 2, y + height / 2),
      width: Arena.WALL_THICKNESS,
      height: height + Arena.WALL_THICKNESS * 2,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    rightWall.onCollisionStart = this.onCollisionStart.bind(this);
    this.addChild(rightWall);
    this.halfHeight = (y + height) / 2;
    this.halfWidth = (x + width) / 2;
    this.addObstaclesRandom();
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    /*  if (other.owner instanceof Node) {
       other.owner.vel = reflectVector(other.owner.vel, contact.normal).scale(0.94);
     } */
  }

  public get playerPositions(): Vector[] {
    // calc 3 points on the left side, first in top left, then middle left, then bottom left
    const positions: Vector[] = [];
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.5) + Node.RADIUS, this.halfHeight - (this.halfHeight / 2.5) + Node.RADIUS)
    );
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.75) + Node.RADIUS, this.halfHeight + Node.RADIUS)
    );
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.5) + Node.RADIUS, this.halfHeight + (this.halfHeight / 2.5) + Node.RADIUS)
    );
    return positions;
  }

  public get opponentPositions(): Vector[] {
    // calc 2.5 points on the right side, first in top right, then middle right, then bottom right
    const positions: Vector[] = [];
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.5) + Node.RADIUS, this.halfHeight - (this.halfHeight / 2.5) + Node.RADIUS)
    );
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.75) + Node.RADIUS, this.halfHeight + Node.RADIUS)
    );
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.5) + Node.RADIUS, this.halfHeight + (this.halfHeight / 2.5) + Node.RADIUS)
    );
    return positions;
  }

  private addObstaclesRandom() {
    const spikeWallSize = 300;
    const spikeWall1 = new SpikeWall(this.x, this.y, "vertical", spikeWallSize);
    this.addChild(spikeWall1);
    const spikeWall2 = new SpikeWall(this.x, this.y, "horizontal", spikeWallSize);
    this.addChild(spikeWall2);
    const bouncePillar1 = new BouncePillar(this.halfWidth + BouncePillar.RADIUS, this.y + BouncePillar.RADIUS / 2);
    this.addChild(bouncePillar1);
    const bouncePillar2 = new BouncePillar(this.halfWidth + BouncePillar.RADIUS, this.halfHeight * 2 - BouncePillar.RADIUS / 2);
    this.addChild(bouncePillar2);
    const spikePillar = new SpikePillar(this.halfWidth + SpikePillar.RADIUS, this.halfHeight + SpikePillar.RADIUS);
    this.addChild(spikePillar);

    const spikeWall3 = new SpikeWall(this.halfWidth * 2 - SpikeWall.WIDTH, this.halfHeight * 2 - spikeWallSize, "vertical", spikeWallSize);
    this.addChild(spikeWall3);
    const spikeWall4 = new SpikeWall(this.halfWidth * 2 - spikeWallSize, this.halfHeight * 2 - SpikeWall.WIDTH, "horizontal", spikeWallSize);
    this.addChild(spikeWall4);
  }
}