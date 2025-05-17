import type { ImageSource } from "excalibur";
import Play from "../scenes/SlamGame";

enum PilotTypesEnum {
  Basic,
  Freezing,
  Heal,
  Mega,
  Spiky,
  Ghost,
  Zombie,
  Angy,
  Homing,
}

export type PilotType = keyof typeof PilotTypesEnum;
interface PilotAttributes {
  hp: number;
  attack: number;
  size?: number;
}

export const PilotTypeAttributesMap = new Map<PilotType, PilotAttributes>([
  ["Basic", { hp: 75, attack: 15 }],
  ["Freezing", { hp: 75, attack: 15 }],
  ["Heal", { hp: 75, attack: 15 }],
  ["Mega", { hp: 75, attack: 15 }],
  ["Spiky", { hp: 75, attack: 15 }],
  ["Ghost", { hp: 75, attack: 15 }],
  ["Zombie", { hp: 75, attack: 15 }],
  ["Angy", { hp: 75, attack: 15 }],
  ["Homing", { hp: 75, attack: 15 }],
]);

export interface PilotOptions {
  type: PilotType;
}

export class Pilot {
  public hp: number;
  public maxHp: number;
  private _attack: number;
  public baseAttack: number;

  public isCharging = false;
  public imageSource: ImageSource;

  public type: PilotType;
  private hasActiveEffect = false;

  constructor({ type }: PilotOptions) {
    this.type = type || "Basic";
    const attr = PilotTypeAttributesMap.get(this.type)!;
    this.hp = attr.hp;
    this.maxHp = attr.hp;
    this._attack = attr.attack;
    this.baseAttack = attr.attack;
    const resourceKey = `Pilot${this.type}` as keyof typeof Play.Resources;
    this.imageSource = Play.Resources[resourceKey] ?? Play.Resources.PilotBasic;

  }

  public set attack(atk: number) {
    this._attack = atk;
  }

  public get attack(): number {
    return this.baseAttack;
  }

}

export function getRandomPilotType(): PilotType {
  const keys = Array.from(PilotTypeAttributesMap.keys()).slice(0, 3);
  return keys[Math.floor(Math.random() * keys.length)];
}