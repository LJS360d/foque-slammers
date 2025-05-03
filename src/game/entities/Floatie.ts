import {
  Actor,
  Circle,
  CircleCollider,
  type Collider,
  type CollisionContact,
  CollisionType,
  Color,
  type Engine,
  Entity,
  Font,
  FontUnit,
  GraphicsGroup,
  Line,
  type PointerEvent,
  Ray,
  type Side,
  Sprite,
  Text,
  Vector
} from "excalibur";
import { peerStore } from "../../store/peer.store";
import { reflectVector } from "../../utils/vector";
import Play from "../scenes/SlamGame";
import type { TurnManager } from "../scenes/TurnManager";

export interface FloatieOptions {
  turnManager: TurnManager;
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
  private dragKnob: Actor | null = null;
  private trajectoryPoints: Vector[] = [];
  private trajectoryLines: Actor[] = [];

  private initialPos: Vector = Vector.Zero;
  private labelGraphic: Text;
  private effect?: FloatieEffect;
  private hasActiveEffect = false;

  public static readonly RADIUS = 50;
  private static readonly PLAYER_COLOR = Color.Blue;
  private static readonly OPPONENT_COLOR = Color.Red;
  private static readonly TEXT_COLOR = Color.White;
  private static readonly DAMPEN_FACTOR = 0.94;
  private static readonly FONT = new Font({
    family: "sans-serif",
    size: 10,
    unit: FontUnit.Px,
    bold: true,
  });
  private _previousPosition: Vector;
  private _previousRotation: number;

  private turnManager: TurnManager

  constructor({ id, owner, x, y, hp, attack, effect, turnManager }: FloatieOptions) {
    super({
      name: `${Floatie.name}-${id}`,
      pos: new Vector(x, y),
      collider: new CircleCollider({ radius: Floatie.RADIUS }),
      collisionType: CollisionType.Active,
    });
    this.turnManager = turnManager;
    this.initialPos = new Vector(x, y);
    this._previousPosition = this.initialPos.clone();
    this._previousRotation = this.rotation;
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
    this.vel = this.vel.scale(Floatie.DAMPEN_FACTOR);
    if (this.angularVelocity > 0) {
      this.angularVelocity -= 0.2
    } else {
      this.angularVelocity = 0;
    }
    // stop the actor if the velocity becomes very small
    if (this.vel.magnitude < 10) {
      this.vel = Vector.Zero;
    }

    if (!this.pos.equals(this._previousPosition)) {
      this.handlePositionChange();
    }
    if (this.rotation !== this._previousRotation) {
      this.handleRotationChange();
    }
    // Update the previous position for the next frame
    this._previousPosition = this.pos.clone();
    this._previousRotation = Number(this.rotation);
  }

  private handlePositionChange() {
    if (!peerStore.isHost) return;
    peerStore.connection?.send({
      msg: "game:floatie-position",
      id: this.id,
      pos: {
        x: this.pos.x,
        y: this.pos.y,
      }
    });
  }

  private handleRotationChange() {
    if (!peerStore.isHost) return;
    peerStore.connection?.send({
      msg: "game:floatie-rotation",
      id: this.id,
      rotation: this.rotation,
    });
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
    if (this.owner !== peerStore.peer.id) return;
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

  updateTrajectoryProjection() {
    // Clear old trajectory lines and points
    this.trajectoryLines.forEach(line => line.kill());
    this.trajectoryLines = [];
    this.trajectoryPoints = [];

    if (!this.isCharging) return;
    const launchVelocity = this.currentChargePosition.sub(this.startChargePosition).scale(-10);
    let lastCollisionPosition = this.startChargePosition.clone();
    let lastCollisionDirection = launchVelocity.normalize();
    let lastCollider: Entity = this;
    this.trajectoryPoints.push(lastCollisionPosition);

    for (let i = 0; i < 2; i++) {
      const ray = new Ray(lastCollisionPosition, lastCollisionDirection);
      const hits = this.scene?.physics.rayCast(ray, {
        maxDistance: launchVelocity.magnitude / 3.33,
        filter: (hit) => hit.collider.owner !== lastCollider,
      }) || [];
      if (!hits.length) {
        // compute the last position of the trajectory
        lastCollisionPosition = lastCollisionPosition.add(launchVelocity).scale(Floatie.DAMPEN_FACTOR / 1.25);
        this.trajectoryPoints.push(lastCollisionPosition);
        break
      };
      const hit = hits[0];
      lastCollisionPosition = hit.point;
      lastCollider = hit.collider.owner;
      lastCollisionDirection = reflectVector(hit.point, hit.normal).normalize();

      this.trajectoryPoints.push(lastCollisionPosition);
    }


    for (let i = 0; i < this.trajectoryPoints.length - 1; i++) {
      const start = this.trajectoryPoints[i];
      const end = this.trajectoryPoints[i + 1];
      const line = new Actor({
        pos: Vector.Zero,
        collisionType: CollisionType.PreventCollision,
      });
      line.graphics.use(
        new Line({
          start,
          end,
          color: Color.White,
          thickness: 3,
        }),
      );
      this.trajectoryLines.push(line);
      this.scene?.add(line);
    }

  }

  public updateDragVisualization() {
    if (this.isCharging) {
      if (!this.dragLine || !this.dragKnob) {
        this.dragLine = new Actor({
          pos: Vector.Zero, // Position will be updated
        });
        this.dragKnob = new Actor({
          pos: Vector.Zero, // Position will be updated
        });
        this.dragLine.graphics.use(
          new Line({
            start: this.pos.clone(),
            end: this.currentChargePosition,
            color: Color.White,
            thickness: 3,
          }),
        );
        this.dragKnob.graphics.use(
          new Circle({
            radius: this.chargeAmount,
            color: Color.White,
          }),
        );
        this.scene?.add(this.dragLine);
        this.scene?.add(this.dragKnob);
      } else {
        // Update the line
        (this.dragLine.graphics.current as any).end =
          this.currentChargePosition;
        this.dragKnob!.pos = this.currentChargePosition;
        (this.dragKnob.graphics.current as any).radius = this.chargeAmount * 0.5;
      }
    } else {
      this.scene?.remove(this.dragLine!);
      this.scene?.remove(this.dragKnob!);
      this.dragLine = null;
      this.dragKnob = null;
    }
  }

  public onPointerUp = (event: PointerEvent) => {
    if (!this.isCharging) return;
    this.isCharging = false;
    this.updateDragVisualization();
    this.updateTrajectoryProjection();
    this.scene?.input.pointers.primary.off("move", this.onPointerMove);
    this.scene?.input.pointers.primary.off("up", this.onPointerUp);
    const launchVelocity = this.releaseCharge(event.worldPos);
    if (peerStore.isHost) {
      this.vel = launchVelocity;
    } else {
      peerStore.connection?.send({
        msg: "game:floatie-release-charge",
        id: this.id,
        vel: {
          x: launchVelocity.x,
          y: launchVelocity.y,
        }
      });
    }
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
