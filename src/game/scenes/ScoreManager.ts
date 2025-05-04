import { createSignal } from "solid-js";
import { Floatie } from "../entities/Floatie";

export const [scoresSignal, setScoresSignal] = createSignal<Map<string, Map<number, number>>>(new Map());

export class ScoreManager {

  // peer id -> [floatie id -> score]
  public scoresMap: Map<string, Map<number, number>>;
  public winThreshold = 5;

  constructor(playerIds: string[]) {
    this.scoresMap = new Map(playerIds.map(playerId => [playerId, new Map()]));
  }

  public addScore(playerId: string, floatie: Floatie | number, score: number = 1): void {
    const floatieId = floatie instanceof Floatie ? floatie.id : floatie;
    const floatiesMap = this.scoresMap.get(playerId);
    if (!floatiesMap) {
      this.scoresMap.set(playerId, new Map([[floatieId, score]]));
      return;
    }
    floatiesMap.set(floatieId, (floatiesMap.get(floatieId) ?? 0) + score);

    setScoresSignal(this.scoresMap);
  }

  public getFloatieScore(playerId: string, floatie: Floatie | number): number {
    const floatieId = floatie instanceof Floatie ? floatie.id : floatie;
    const floatiesMap = this.scoresMap.get(playerId);
    return floatiesMap?.get(floatieId) ?? 0;
  }

  public getPlayerScore(playerId: string): number {
    const floatiesMap = this.scoresMap.get(playerId);
    return Array.from(floatiesMap?.values() ?? []).reduce((acc, score) => acc + score, 0);
  }

  public getWinner(): string | null {
    const players = Array.from(this.scoresMap.keys());
    const playerScores = new Map<string, number>();
    for (const playerId of players) {
      playerScores.set(playerId, this.getPlayerScore(playerId));
    }
    for (const [playerId, score] of playerScores.entries()) {
      if (score >= this.winThreshold) {
        return playerId;
      }
    }
    return null;
  }


}