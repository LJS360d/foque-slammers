import { Actor, CollisionType, Color, Vector } from 'excalibur';
import { Floatie } from './Floatie';
import { BouncePillar } from './obstacles/BouncePillar';
import { SpikePillar } from './obstacles/SpikePillar';
import { SpikeWall } from './obstacles/SpikeWall';

export class Arena extends Actor {
  private static readonly WALL_THICKNESS = 500;
  private static readonly WALL_COLOR = Color.DarkGray;
  private halfWidth: number
  private halfHeight: number;

  constructor(private x: number, private y: number, width: number, height: number) {
    super({ name: 'board', collisionType: CollisionType.Fixed });

    this.halfHeight = (y + height) / 2;
    this.halfWidth = (x + width) / 2;
    this.addObstaclesRandom();

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
  }

  public get playerPositions(): Vector[] {
    return [
      new Vector(this.halfWidth - (this.halfWidth / 1.5) + Floatie.RADIUS, this.halfHeight - (this.halfHeight / 2.5) + Floatie.RADIUS),
      new Vector(this.halfWidth - (this.halfWidth / 1.75) + Floatie.RADIUS, this.halfHeight + Floatie.RADIUS),
      new Vector(this.halfWidth - (this.halfWidth / 1.5) + Floatie.RADIUS, this.halfHeight + (this.halfHeight / 2.5) + Floatie.RADIUS),
    ];
  }

  public get opponentPositions(): Vector[] {
    return [
      new Vector(this.halfWidth + (this.halfWidth / 1.5) + Floatie.RADIUS, this.halfHeight - (this.halfHeight / 2.5) + Floatie.RADIUS),
      new Vector(this.halfWidth + (this.halfWidth / 1.75) + Floatie.RADIUS, this.halfHeight + Floatie.RADIUS),
      new Vector(this.halfWidth + (this.halfWidth / 1.5) + Floatie.RADIUS, this.halfHeight + (this.halfHeight / 2.5) + Floatie.RADIUS),
    ];
  }

  private addObstaclesRandom() {
    const spikeWallSize = 300;
    const spikeWall1 = new SpikeWall(this.x, this.y, "vertical", spikeWallSize);
    this.addChild(spikeWall1);
    const spikeWall2 = new SpikeWall(this.x, this.y, "horizontal", spikeWallSize);
    this.addChild(spikeWall2);
    const bouncePillar1 = new BouncePillar(this.halfWidth + BouncePillar.RADIUS, this.y);
    this.addChild(bouncePillar1);
    const bouncePillar2 = new BouncePillar(this.halfWidth + BouncePillar.RADIUS, this.halfHeight * 2);
    this.addChild(bouncePillar2);
    const spikePillar = new SpikePillar(this.halfWidth + SpikePillar.RADIUS, this.halfHeight + SpikePillar.RADIUS);
    this.addChild(spikePillar);

    const spikeWall3 = new SpikeWall(this.halfWidth * 2 - SpikeWall.WIDTH, this.halfHeight * 2 - spikeWallSize, "vertical", spikeWallSize);
    this.addChild(spikeWall3);
    const spikeWall4 = new SpikeWall(this.halfWidth * 2 - spikeWallSize, this.halfHeight * 2 - SpikeWall.WIDTH, "horizontal", spikeWallSize);
    this.addChild(spikeWall4);
  }
}