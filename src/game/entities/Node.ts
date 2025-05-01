import { Actor, Circle, CircleCollider, Collider, CollisionContact, CollisionGroup, CollisionType, Color, Engine, Font, FontUnit, GraphicsGroup, Line, PointerEvent, Ray, Side, Text, Vector } from 'excalibur';
import { reflectVector } from '../../utils/vector';

export interface NodeOptions {
  id: number;
  owner: 'player' | 'opponent';
  x: number;
  y: number;
  hp: number;
  attack: number;
  effect?: Effect;
}

interface Effect {
  name: string;
  duration: number;
}

export class Node extends Actor {
  public owner: 'player' | 'opponent';
  public hp: number;
  public maxHp: number;
  private _attack: number;
  public startColor: Color;
  public isCharging: boolean = false;
  private startChargePosition: Vector = Vector.Zero;
  private currentChargePosition: Vector = Vector.Zero;
  private chargeAmount: number = 0;
  private chargeDirection: Vector = Vector.Zero;
  private circleGraphic: Circle;

  private dragLine: Actor | null = null;
  private trajectoryLine: Actor | null = null;

  private initialPos: Vector = Vector.Zero;
  private labelGraphic: Text;
  private effect?: Effect;
  private hasActiveEffect: boolean = false;

  private static readonly RADIUS = 50;
  private static readonly PLAYER_COLOR = Color.Blue;
  private static readonly OPPONENT_COLOR = Color.Red;
  private static readonly TEXT_COLOR = Color.White;
  private static readonly FONT = new Font({
    family: 'sans-serif',
    size: 10,
    unit: FontUnit.Px,
    bold: true,
  });

  constructor({ id, owner, x, y, hp, attack, effect }: NodeOptions) {
    super({
      name: `${Node.name}-${id}`,
      pos: new Vector(x, y),
      collider: new CircleCollider({ radius: Node.RADIUS }),
      collisionType: CollisionType.Active
    });
    this.initialPos = new Vector(x, y)
    this.owner = owner;
    this.hp = hp;
    this.maxHp = hp;
    this._attack = attack;
    this.effect = effect;

    this.startColor = this.owner === 'player' ? Node.PLAYER_COLOR : Node.OPPONENT_COLOR;
    this.circleGraphic = new Circle({
      radius: Node.RADIUS,
      color: this.startColor
    });
    this.labelGraphic = new Text({
      text: this.labelText,
      font: Node.FONT,
      color: Node.TEXT_COLOR,
    });
    const group = new GraphicsGroup({
      members: [
        {
          graphic: this.circleGraphic,
          offset: Vector.Zero
        },
        {
          graphic: this.labelGraphic,
          offset: new Vector(0, Node.RADIUS * 2)
        }
      ]
    })
    this.graphics.use(group);
  }

  private get labelText(): string {
    return `HP: ${this.hp}/${this.maxHp} ATK: ${this.attack}`;
  }

  public set attack(value: number) {
    this._attack = value;
    this.updateLabel();
  }

  public get attack(): number {
    return this._attack;
  }

  update(engine: Engine, delta: number) {
    super.update(engine, delta);

    // Apply damping to the velocity
    this.vel = this.vel.scale(1.01);

    // Optional: Stop the actor if the velocity becomes very small
    if (this.vel.magnitude < 2) { // Adjust the threshold as needed
      this.vel = Vector.Zero;
    }
  }

  onInitialize(engine: Engine): void {
    this.on('pointerdown', this.onPointerDown);
    this.pointer.useColliderShape = true;
  }

  onCollisionStart(self: Collider, other: Collider, side: Side, contact: CollisionContact): void {
    if (other.owner instanceof Node) {
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
    this.scene?.input.pointers.primary.on('move', this.onPointerMove);
    this.scene?.input.pointers.primary.on('up', this.onPointerUp);
  };

  public onPointerMove = (event: PointerEvent) => {
    if (!this.isCharging) return;
    this.currentChargePosition = event.worldPos.clone();
    this.chargeAmount = this.currentChargePosition.sub(this.startChargePosition).magnitude * 0.5;
    this.chargeDirection = this.currentChargePosition.sub(this.startChargePosition).normalize();
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
                thickness: 2
              }),
              offset: Vector.Zero
            }
          ]
        });
        this.trajectoryLine.graphics.use(graphics);
        this.scene?.add(this.trajectoryLine);
      }

      const launchVelocity = this.currentChargePosition.sub(this.startChargePosition).scale(-20);
      const launchDirection = launchVelocity.normalize();
      const ray = new Ray(this.pos.clone(), launchDirection);
      const collisionResults = this.scene?.physics.rayCast(ray, {
        searchAllColliders: true,
        collisionGroup: CollisionGroup.All,
        collisionMask: CollisionGroup.All.mask,
        maxDistance: Infinity,
      }) ?? [];
      // remove first result as it is the collission with self
      collisionResults.shift()

      const graphics = this.trajectoryLine.graphics.current as GraphicsGroup
      graphics.members = [new Line({
        start: this.startChargePosition,
        end: this.pos,
        color: Color.Red,
        thickness: 2
    })];

      for (let i = 0; i < collisionResults.length - 1; i++) {
        const start = collisionResults[i].point;
        const end = collisionResults[i + 1].point;
        graphics.members.push(new Line({
          start,
          end,
          color: Color.LightGray,
          thickness: 2
        }));
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
        this.dragLine.graphics.use(new Line({
          start: this.pos,
          end: this.currentChargePosition,
          color: Color.White,
          thickness: 3,
        }));
        this.scene?.add(this.dragLine);
      } else {
        // Update the line
        (this.dragLine.graphics.current as any).end = this.currentChargePosition;
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
    this.scene?.input.pointers.primary.off('move', this.onPointerMove);
    this.scene?.input.pointers.primary.off('up', this.onPointerUp);
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
      this.circleGraphic.color = Color.Yellow;
      this.scene?.engine.clock.schedule(() => {
        this.circleGraphic.color = this.startColor;
      }, 100);
    }
  }

  public applyEffect(effect: Effect): void {
    this.hasActiveEffect = true;

    switch (effect.name) {
      case 'mega':
        this.attack += 10;
        this.updateLabel();
        this.circleGraphic.color = Color.Pink;
        this.scene?.engine.clock.schedule(() => {
          this.circleGraphic.color = this.startColor;
        }, 100);
        break;
      case 'heal':
        this.hp = Math.min(this.hp + 10, this.maxHp);
        this.updateLabel();
        this.circleGraphic.color = Color.Green;
        this.scene?.engine.clock.schedule(() => {
          this.circleGraphic.color = this.startColor;
        }, 100);
        break;
      default:
        break;
    }
  }

  public reset(initialPosition: Vector): void {
    this.hp = this.maxHp;
    this.vel = Vector.Zero;
    this.acc = Vector.Zero;
    this.pos = initialPosition;
    this.circleGraphic.color = this.startColor;
    this.updateLabel();
  }

  public updateLabel() {
    this.labelGraphic.text = this.labelText;
  }

}