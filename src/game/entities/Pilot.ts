import type { TurnManager } from "../scenes/TurnManager";

export interface PilotOptions {
  turnManager: TurnManager;
  hp: number;
  attack: number;
  effect?: PilotEffect;
  flipHorizontal?: boolean;
}

interface PilotEffect {
  name: string;
  duration: number;
}

export class Pilot {
  public hp: number;
  public maxHp: number;
  private _attack: number;
  public baseAttack: number;

  public isCharging = false;

  private effect?: PilotEffect;
  private hasActiveEffect = false;

  constructor({ hp, attack, effect, flipHorizontal }: PilotOptions) {
    this.hp = hp;
    this.maxHp = hp;
    this._attack = attack;
    this.baseAttack = attack;
    this.effect = effect;

  }

  public set attack(atk: number) {
    this._attack = atk;
  }

  public get attack(): number {
    return this.baseAttack;
  }


}
