import { type IVector, Vector } from "./Vector.js";
import { Config } from "./Config.js";

export interface IFish {
  id: number;
  width: number;
  height: number;
  velocity: number;
  direction: number;
  pos: IVector;

  calculateDirection(
    fishes: IFish[],
    separationWeight: number,
    alignmentWeight: number,
    cohesionWeight: number,
    boundaryAvWeight: number,
    turnRadius: number,
    screenWidth: number,
    screenHeight: number,
  ): number;

  calculateCloseFishes(fishes: IFish[], perceptionRadius: number): IFish[];

  updateDirection(nextDirection: number, dt?: number): void;

  calculateBoundaryAvDirection(
    turnRadius: number,
    screenWidth: number,
    screenHeight: number,
  ): IVector;

  distance(fish: IFish): number;
}

export class Fish implements IFish {
  public id: number;
  public width: number;
  public height: number;
  public velocity: number;
  public direction: number;
  public pos: IVector;

  constructor(
    id: number,
    width: number,
    height: number,
    velocity: number,
    screenWidth: number,
    screenHeight: number,
  ) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.velocity = velocity;
    this.pos = new Vector(
      screenWidth * Math.random(),
      screenHeight * Math.random(),
    );
    this.direction = 2 * Math.PI * Math.random();
  }

  public static updateGroup(
    fishes: IFish[],
    screenWidth: number,
    screenHeight: number,
    dt: number = 1 / 60,
    perceptionRadius: number = Config.perceptionRadius,
    separationWeight: number = Config.separationWeight,
    alignmentWeight: number = Config.alignmentWeight,
    cohesionWeight: number = Config.cohesionWeight,
    boundaryAvWeight: number = Config.boundaryAvWeight,
    turnRadius: number = Config.turnRadius,
  ): void {
    for (let fish of fishes) {
      let closeFishes: IFish[] = fish.calculateCloseFishes(
        fishes,
        perceptionRadius,
      );
      let direction: number = fish.calculateDirection(
        closeFishes,
        separationWeight,
        alignmentWeight,
        cohesionWeight,
        boundaryAvWeight,
        turnRadius,
        screenWidth,
        screenHeight,
      );
      fish.updateDirection(direction, dt);
    }
  }

  public calculateDirection(
    fishes: IFish[],
    separationWeight: number,
    alignmentWeight: number,
    cohesionWeight: number,
    boundaryAvWeight: number,
    turnRadius: number,
    screenWidth: number,
    screenHeight: number,
  ): number {
    let boundaryAvVector: IVector = this.calculateBoundaryAvDirection(
      turnRadius,
      screenWidth,
      screenHeight,
    );
    let separation: IVector = new Vector(0, 0);
    let alignment: IVector = new Vector(0, 0);
    let cohesion: IVector = new Vector(0, 0);

    let closeCount: number = 0;

    for (let other of fishes) {
      if (other.id == this.id) continue;
      let d: number = Math.max(this.distance(other), 1e-6);
      separation.add(
        new Vector(
          (this.pos.x - other.pos.x) / d,
          (this.pos.y - other.pos.y) / d,
        ),
      );
      alignment.add(
        new Vector(Math.cos(other.direction), Math.sin(other.direction)),
      );
      cohesion.add(new Vector(other.pos.x, other.pos.y));
      closeCount++;
    }

    let resX: number = boundaryAvVector.x * boundaryAvWeight;
    let resY: number = boundaryAvVector.y * boundaryAvWeight;

    if (closeCount) {
      separation.prod(1 / closeCount).prod(separationWeight);
      alignment.prod(1 / closeCount).prod(alignmentWeight);
      cohesion
        .prod(1 / closeCount)
        .add(new Vector(-this.pos.x, -this.pos.y))
        .prod(cohesionWeight);

      resX += separation.x + alignment.x + cohesion.x;
      resY += separation.y + alignment.y + cohesion.y;
    }

    if (resX === 0 && resY === 0) return this.direction;

    return Math.atan2(resY, resX);
  }

  public calculateCloseFishes(
    fishes: IFish[],
    perceptionRadius: number,
  ): IFish[] {
    let closeFishes: IFish[] = [];
    for (let fish of fishes) {
      if (fish.id == this.id) continue;
      if (this.distance(fish) < perceptionRadius) {
        closeFishes.push(fish);
      }
    }
    return closeFishes;
  }

  public updateDirection(nextDirection: number, dt: number = 1 / 60): void {
    let step: number = this.velocity * dt * 60;
    this.pos.x += step * Math.cos(this.direction);
    this.pos.y += step * Math.sin(this.direction);
    this.direction = nextDirection;
  }

  public calculateBoundaryAvDirection(
    turnRadius: number,
    screenWidth: number,
    screenHeight: number,
  ): IVector {
    let boundaryAv: IVector = new Vector(0, 0);

    if (this.pos.x < turnRadius) {
      boundaryAv.add(new Vector(1, 0));
    } else if (this.pos.x > screenWidth - turnRadius) {
      boundaryAv.add(new Vector(-1, 0));
    }

    if (this.pos.y < turnRadius) {
      boundaryAv.add(new Vector(0, 1));
    } else if (this.pos.y > screenHeight - turnRadius) {
      boundaryAv.add(new Vector(0, -1));
    }

    return boundaryAv;
  }

  public distance(fish: IFish): number {
    return Math.sqrt(
      (this.pos.x - fish.pos.x) ** 2 + (this.pos.y - fish.pos.y) ** 2,
    );
  }
}
