export interface SpritesOptions {
  frameCount: number;
  width: number;
  height: number;
  angle0?: number;
  dpr?: number;
}

export class Sprite {
  protected readonly frames: ImageBitmap[];
  readonly drawSize: number;

  constructor(
    frames: ImageBitmap[],
    drawSize: number,
    protected readonly angle0: number,
  ) {
    this.frames = frames;
    this.drawSize = drawSize;
  }

  protected static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`Failed to load SVG: ${url}`));
      img.src = url;
    });
  }

  protected frameIndex(direction: number): number {
    const size = this.frames.length;
    const tau = Math.PI * 2;
    let delta = direction - this.angle0;
    delta = ((delta % tau) + tau) % tau;
    return Math.floor((delta / tau) * size) % size;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: number,
  ): void {
    const index = this.frameIndex(direction);
    const half = this.drawSize / 2;
    ctx.drawImage(
      this.frames[index]!,
      x - half,
      y - half,
      this.drawSize,
      this.drawSize,
    );
  }

  public dispose(): void {
    for (let frame of this.frames) frame.close();
    this.frames.length = 0;
  }

  static async create(
    svgUrl: string,
    options: SpritesOptions,
  ): Promise<Sprite> {
    const {
      frameCount,
      width,
      height,
      angle0 = 0,
      dpr = window.devicePixelRatio || 1,
    } = options;

    if (frameCount <= 0)
      throw new Error(`frameCount must be positive but receive ${frameCount}`);

    const img = await Sprite.loadImage(svgUrl);
    const pw = width * dpr;
    const ph = height * dpr;
    const size = Math.ceil(Math.hypot(pw, ph));

    const bitmaps: ImageBitmap[] = [];

    for (let i = 0; i < frameCount; ++i) {
      const direction = (i / frameCount) * Math.PI * 2 + angle0;
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d")!;
      ctx.translate(size / 2, size / 2);
      ctx.rotate(direction);
      ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
      bitmaps.push(await createImageBitmap(canvas));
    }

    return new Sprite(bitmaps, size / dpr, angle0);
  }
}
