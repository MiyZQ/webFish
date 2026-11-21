import { type SpritesOptions, Sprite } from "./Sprite.js";

interface Structure {
  readonly pos: { readonly x: number; readonly y: number };
  readonly direction: number;
}

interface CanvasOptions<T extends Structure> {
  onTick?: (dt: number, stage: FishCanvas<T>) => void;
}

export class FishCanvas<T extends Structure> {
  width: number = 0;
  height: number = 0;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private readonly svgUrl: string;
  private readonly spritesOptions: SpritesOptions;
  private sprite: Sprite;
  private dpr: number;

  private rafId: number = 0;
  private lastTs: number = 0;
  private running: boolean = false;

  private entities: readonly T[] = [];

  private readonly onResizeBound: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    svgUrl: string,
    spritesOptions: SpritesOptions,
    sprite: Sprite,
    private readonly options: CanvasOptions<T>,
  ) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Failed to retrieve Canvas 2D context");

    this.canvas = canvas;
    this.ctx = ctx;
    this.svgUrl = svgUrl;
    this.spritesOptions = spritesOptions;
    this.sprite = sprite;
    this.dpr = window.devicePixelRatio || 1;

    this.onResizeBound = () => this.resize();
  }

  static async create<T extends Structure>(
    canvas: HTMLCanvasElement,
    svgUrl: string,
    spritesOptions: SpritesOptions,
    options: CanvasOptions<T> = {},
  ): Promise<FishCanvas<T>> {
    const sprite = await Sprite.create(svgUrl, spritesOptions);
    const stage = new FishCanvas(
      canvas,
      svgUrl,
      spritesOptions,
      sprite,
      options,
    );
    stage.resize();
    window.addEventListener("resize", stage.onResizeBound);
    return stage;
  }

  public setEntities(entities: readonly T[]): void {
    this.entities = entities;
  }

  protected render(): void {
    const { ctx, sprite, entities } = this;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let e of entities) {
      sprite.draw(ctx, e.pos.x, e.pos.y, e.direction);
    }
  }

  protected resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    this.width = w;
    this.height = h;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (dpr != this.dpr) {
      this.dpr = dpr;
      this.rebuildSprite();
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.onResizeBound);
    this.sprite.dispose();
  }

  private rebuildSprite(): void {
    const old = this.sprite;

    Sprite.create(this.svgUrl, {
      ...this.spritesOptions,
      dpr: this.dpr,
    })
      .then((next) => {
        this.sprite = next;
        old.dispose();
      })
      .catch((err) => {
        console.warn("Failed to rebuild sprite, use the old frame", err);
      });
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();

    const loop = (now: number): void => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTs) / 1000, 0.05);
      this.lastTs = now;

      this.options.onTick?.(dt, this);
      this.render();

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}
