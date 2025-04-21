import { Engine, Scene, Vector } from "excalibur";
import { Arena } from "../entities/Arena";
import { Node } from "../entities/Node";

export default class Play extends Scene {
  private playerNodes: Node[] = [];
  private opponentNodes: Node[] = [];
  private allNodes: Node[] = [];

  private readonly boardX = 20;
  private readonly boardY = 20;
  private readonly boardWidth = window.innerWidth - this.boardX * 2;
  private readonly boardHeight = window.innerHeight- this.boardY * 2;
  private initialNodePositions: Map<Node, Vector> = new Map();

  onInitialize(engine: Engine) {
    const arena = new Arena(this.boardX, this.boardY, this.boardWidth, this.boardHeight);
    this.add(arena);

    arena.playerPositions.forEach((pos, i) => {
      const node = new Node({
        id: i + 1,
        owner: 'player',
        x: pos.x,
        y: pos.y,
        hp: 100,
        attack: 20,
        effect: {
          name: 'mega',
          duration: 1
        }
      });
      this.playerNodes.push(node);
    });
    arena.opponentPositions.forEach((pos, i) => {
      const node = new Node({
        id: i + 1,
        owner: 'opponent',
        x: pos.x,
        y: pos.y,
        hp: 100,
        attack: 20,
        effect: {
          name: 'heal',
          duration: 0
        }
      });
      this.opponentNodes.push(node);
    });

    this.allNodes = [...this.playerNodes, ...this.opponentNodes];
    this.allNodes.forEach(node => {
      engine.add(node);
      this.initialNodePositions.set(node, node.pos.clone());
    });

  }

}
