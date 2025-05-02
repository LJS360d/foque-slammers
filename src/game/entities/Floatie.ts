import {
  Actor,
  Circle,
  CircleCollider,
  type Collider,
  type CollisionContact,
  CollisionGroup,
  CollisionType,
  Color,
  type Engine,
  Font,
  FontUnit,
  GraphicsGroup,
  Line,
  type PointerEvent,
  Ray,
  type Side,
  Sprite,
  Text,
  Vector,
} from "excalibur";
import Play from "../scenes/SlamGame";
import { peerStore } from "../../store/peer.store";

export interface FloatieOptions {
  id: number;
  owner: string; // game code
  x: number;
  y: number;
  hp: number;
  attack: number;
  effect?: FloatieEffect;
}

interface FloatieEffect {
  name: string;
  duration: number;
}

export class Floatie extends Actor {
  public owner: string;
  public hp: number;
  public maxHp: number;
  private _attack: number;
  public baseAttack: number;

  public isCharging = false;
  private startChargePosition: Vector = Vector.Zero;
  private currentChargePosition: Vector = Vector.Zero;
  private chargeAmount = 0;
  private chargeDirection: Vector = Vector.Zero;

  private dragLine: Actor | null = null;
  private trajectoryLine: Actor | null = null;

  private initialPos: Vector = Vector.Zero;
  private labelGraphic: Text;
  private effect?: FloatieEffect;
  private hasActiveEffect = false;

  public static readonly RADIUS = 50;
  private static readonly PLAYER_COLOR = Color.Blue;
  private static readonly OPPONENT_COLOR = Color.Red;
  private static readonly TEXT_COLOR = Color.White;
  private static readonly FONT = new Font({
    family: "sans-serif",
    size: 10,
    unit: FontUnit.Px,
    bold: true,
  });

  constructor({ id, owner, x, y, hp, attack, effect }: FloatieOptions) {
    super({
      name: `${Floatie.name}-${id}`,
      pos: new Vector(x, y),
      collider: new CircleCollider({ radius: Floatie.RADIUS }),
      collisionType: CollisionType.Active,
    });
    this.initialPos = new Vector(x, y);
    this.owner = owner;
    this.hp = hp;
    this.maxHp = hp;
    this._attack = attack;
    this.baseAttack = attack;
    this.effect = effect;
    const isOwner = this.owner === peerStore.peer.id;
    const floatieSprite = new Sprite({
      image: isOwner
        ? Play.Resources.FloatieBlue
        : Play.Resources.FloatieRed,
      width: 256,
      height: 256,
      flipHorizontal: !isOwner,
      destSize: {
        width: Floatie.RADIUS * 2.5,
        height: Floatie.RADIUS * 2.5,
      }
    });

    this.labelGraphic = new Text({
      text: this.labelText,
      font: Floatie.FONT,
      color: Floatie.TEXT_COLOR,
    });
    const group = new GraphicsGroup({
      members: [
        {
          graphic: floatieSprite,
          offset: Vector.Zero,
        },
        {
          graphic: this.labelGraphic,
          offset: new Vector(0, Floatie.RADIUS * 2),
        },
      ],
    });
    this.graphics.use(group);
  }

  private get labelText(): string {
    return `HP: ${this.hp}/${this.maxHp} ATK: ${this.attack}`;
  }


  public set attack(atk: number) {
    this._attack = atk;
    this.updateLabel();
  }

  public get attack(): number {
    return this.baseAttack;
  }

  update(engine: Engine, delta: number) {
    super.update(engine, delta);
    // Apply damping to the velocity
    this.vel = this.vel.scale(0.94);
    if (this.angularVelocity > 0) {
      this.angularVelocity -= 0.2
    } else {
      this.angularVelocity = 0;
    }
    // stop the actor if the velocity becomes very small
    if (this.vel.magnitude < 10) {
      this.vel = Vector.Zero;
    }

  }

  onInitialize(engine: Engine): void {
    this.on("pointerdown", this.onPointerDown);
    this.pointer.useColliderShape = true;
  }

  onCollisionStart(
    self: Collider,
    other: Collider,
    side: Side,
    contact: CollisionContact,
  ): void {
    if (other.owner instanceof Floatie) {
      if (this.vel.magnitude > 0.01) {
        if (other.owner.owner !== this.owner) {
          other.owner.applyDamage(this.attack);
        } else if (this.effect) {
          other.owner.applyEffect(this.effect);
        }
      }
    }
  }

  public onPointerDown = (event: PointerEvent) => {
    this.isCharging = true;
    this.startChargePosition = this.pos.clone();
    this.startCharge(this.startChargePosition);
    this.scene?.input.pointers.primary.on("move", this.onPointerMove);
    this.scene?.input.pointers.primary.on("up", this.onPointerUp);
  };

  public onPointerMove = (event: PointerEvent) => {
    if (!this.isCharging) return;
    this.currentChargePosition = event.worldPos.clone();
    this.chargeAmount =
      this.currentChargePosition.sub(this.startChargePosition).magnitude * 0.5;
    this.chargeDirection = this.currentChargePosition
      .sub(this.startChargePosition)
      .normalize();
    this.updateDragVisualization();
    this.updateTrajectoryProjection();
  };

  // TODO make it work
  updateTrajectoryProjection() {
    if (this.isCharging) {
      if (!this.trajectoryLine) {
        this.trajectoryLine = new Actor({
          pos: Vector.Zero, // Position will be updated
        });
        const graphics = new GraphicsGroup({
          members: [
            {
              graphic: new Line({
                start: this.pos,
                end: this.currentChargePosition,
                color: Color.LightGray,
                thickness: 2,
              }),
              offset: Vector.Zero,
            },
          ],
        });
        this.trajectoryLine.graphics.use(graphics);
        this.scene?.add(this.trajectoryLine);
      }

      const launchVelocity = this.currentChargePosition
        .sub(this.startChargePosition)
        .scale(-20);
      const launchDirection = launchVelocity.normalize();
      const ray = new Ray(this.pos.clone(), launchDirection);
      const collisionResults =
        this.scene?.physics.rayCast(ray, {
          searchAllColliders: true,
          collisionGroup: CollisionGroup.All,
          collisionMask: CollisionGroup.All.mask,
          maxDistance: Number.POSITIVE_INFINITY,
        }) ?? [];
      // remove first result as it is the collission with self
      collisionResults.shift();

      const graphics = this.trajectoryLine.graphics.current as GraphicsGroup;
      graphics.members = [
        new Line({
          start: this.startChargePosition,
          end: this.pos,
          color: Color.Red,
          thickness: 2,
        }),
      ];

      for (let i = 0; i < collisionResults.length - 1; i++) {
        const start = collisionResults[i].point;
        const end = collisionResults[i + 1].point;
        graphics.members.push(
          new Line({
            start,
            end,
            color: Color.LightGray,
            thickness: 2,
          }),
        );
      }
    } else {
      this.scene?.remove(this.trajectoryLine!);
      this.trajectoryLine = null;
    }
  }

  public updateDragVisualization() {
    if (this.isCharging) {
      if (!this.dragLine) {
        this.dragLine = new Actor({
          pos: Vector.Zero, // Position will be updated
        });
        this.dragLine.graphics.use(
          new Line({
            start: this.pos,
            end: this.currentChargePosition,
            color: Color.White,
            thickness: 3,
          }),
        );
        this.scene?.add(this.dragLine);
      } else {
        // Update the line
        (this.dragLine.graphics.current as any).end =
          this.currentChargePosition;
      }
    } else {
      this.scene?.remove(this.dragLine!);
      this.dragLine = null;
    }
  }

  public onPointerUp = (event: PointerEvent) => {
    if (!this.isCharging) return;
    this.isCharging = false;
    const launchVelocity = this.releaseCharge(event.worldPos);
    this.vel = launchVelocity;
    this.updateDragVisualization();
    this.updateTrajectoryProjection();
    this.scene?.input.pointers.primary.off("move", this.onPointerMove);
    this.scene?.input.pointers.primary.off("up", this.onPointerUp);
  };

  public startCharge(startPosition: Vector): void {
    this.isCharging = true;
    this.startChargePosition = startPosition;
    this.chargeAmount = 0;
    this.chargeDirection = Vector.Zero;
  }

  public releaseCharge(endPosition: Vector): Vector {
    this.isCharging = false;
    this.chargeDirection = endPosition.sub(this.startChargePosition);
    return this.chargeDirection.scale(-10);
  }

  public applyDamage(damageAmount: number): void {
    this.hp -= damageAmount;
    this.updateLabel();
    if (this.hp <= 0) {
      this.hp = 0;
      // TODO death animation
      this.reset(this.initialPos);
    } else {
      // TODO Hit animation

    }
  }

  public applyEffect(effect: FloatieEffect): void {
    this.hasActiveEffect = true;

    switch (effect.name) {
      case "mega":
        this.attack += 10;
        this.updateLabel();
        // TODO effect animation
        break;
      case "heal":
        this.hp = Math.min(this.hp + 10, this.maxHp);
        this.updateLabel();
        // TODO effect animation
        break;
      default:
        break;
    }
  }

  public reset(initialPosition: Vector): void {
    this.hp = this.maxHp;
    this.angularVelocity = 0;
    this.rotation = 0;
    this.vel = Vector.Zero;
    this.acc = Vector.Zero;
    this.pos = initialPosition;
    this.updateLabel();
  }

  public updateLabel() {
    this.labelGraphic.text = this.labelText;
  }
}
