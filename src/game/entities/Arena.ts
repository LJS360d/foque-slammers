import { Actor, CollisionType, Color, Vector } from 'excalibur';

export class Arena extends Actor {
  private static readonly WALL_THICKNESS = 500;
  private static readonly WALL_COLOR = Color.DarkGray;
  private halfWidth: number
  private halfHeight: number;

  constructor(x: number, y: number, width: number, height: number) {
    super({ name: 'board' });

    const topWall = new Actor({
      name: 'topWall',
      pos: new Vector(x + width / 2, y - Arena.WALL_THICKNESS / 2),
      width: width,
      height: Arena.WALL_THICKNESS,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    this.addChild(topWall);

    const bottomWall = new Actor({
      name: 'bottomWall',
      pos: new Vector(x + width / 2, y + height + Arena.WALL_THICKNESS / 2),
      width: width,
      height: Arena.WALL_THICKNESS,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    this.addChild(bottomWall);

    const leftWall = new Actor({
      name: 'leftWall',
      pos: new Vector(x - Arena.WALL_THICKNESS / 2, y + height / 2),
      width: Arena.WALL_THICKNESS,
      height: height + Arena.WALL_THICKNESS * 2,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    this.addChild(leftWall);

    const rightWall = new Actor({
      name: 'rightWall',
      pos: new Vector(x + width + Arena.WALL_THICKNESS / 2, y + height / 2),
      width: Arena.WALL_THICKNESS,
      height: height + Arena.WALL_THICKNESS * 2,
      collisionType: CollisionType.Fixed,
      color: Arena.WALL_COLOR
    });
    this.addChild(rightWall);
    this.halfHeight = height / 2;
    this.halfWidth = width / 2;
  }

  public get playerPositions(): Vector[] {
    // calc 3 points on the left side, first in top left, then middle left, then bottom left
    const positions: Vector[] = [];
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.25), this.halfHeight - (this.halfHeight / 2))
    );
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.75), this.halfHeight)
    );
    positions.push(
      new Vector(this.halfWidth - (this.halfWidth / 1.25), this.halfHeight + (this.halfHeight / 2))
    );
    return positions;
  }

  public get opponentPositions(): Vector[] {
    // calc 3 points on the right side, first in top right, then middle right, then bottom right
    const positions: Vector[] = [];
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.25), this.halfHeight - (this.halfHeight / 2))
    );
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.75), this.halfHeight)
    );
    positions.push(
      new Vector(this.halfWidth + (this.halfWidth / 1.25), this.halfHeight + (this.halfHeight / 2))
    );
    return positions;
  }
}