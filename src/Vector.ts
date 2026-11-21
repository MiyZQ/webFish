export interface IVector {
  x: number;
  y: number;

  add(v: IVector): this;
  prod(scalar: number): this;
}

export class Vector implements IVector {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public add(v: IVector): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public prod(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}
