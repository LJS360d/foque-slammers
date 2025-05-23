import { createSignal } from "solid-js";
import { peerStore } from "../../store/peer.store";

export interface TurnManagerOptions {
  players: string[];
  initialHolder?: number;
  randomInitialHolder?: boolean;
}

export const [turnsSignal, setTurnSignal] = createSignal(0);

export class TurnManager {
  public turns = 0;
  public players: string[];
  private turnHolder: typeof this.players[number];
  private turnHolderIndex: number;


  constructor({ players, randomInitialHolder = false, initialHolder = 0 }: TurnManagerOptions) {
    this.players = players;
    this.turnHolderIndex = randomInitialHolder ? this.getRandomPlayerIndex() : initialHolder;
    this.turnHolder = this.players[this.turnHolderIndex];
  }

  public getRandomPlayerIndex(): number {
    return Math.floor(Math.random() * this.players.length);
  }

  public set currentPlayer(player: string) {
    this.turnHolder = player;
    this.turnHolderIndex = this.players.indexOf(player);
  }

  public get currentPlayer(): string {
    return this.turnHolder;
  }

  public get currentPlayerIndex(): number {
    return this.turnHolderIndex;
  }

  public get nextPlayer(): string {
    return this.players[this.nextPlayerIndex];
  }

  public get nextPlayerIndex(): number {
    return (this.turnHolderIndex + 1) % this.players.length;
  }

  public advanceTurn(): void {
    this.turnHolder = this.nextPlayer;
    this.turnHolderIndex = this.nextPlayerIndex;
    this.turns++;
    setTurnSignal(this.turns);
  }

  public get isMyTurn(): boolean {
    return this.turnHolder === peerStore.peer.id;
  }

}