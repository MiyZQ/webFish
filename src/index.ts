import { Config } from "./Config.js";
import { type IFish, Fish } from "./Fish.js";
import { FishCanvas } from "./render/Canvas.js";

async function main(): Promise<void> {
  const canvas = document.getElementById("stage") as HTMLCanvasElement;

  const stage = await FishCanvas.create<IFish>(
    canvas,
    "../assets/fish-symbol.svg",
    {
      frameCount: 72,
      width: 20,
      height: 20,
      angle0: 0,
    },
    {
      onTick: (dt, s) => {
        Fish.updateGroup(
          fishes,
          s.width,
          s.height,
          dt,
          Config.perceptionRadius,
          Config.separationWeight,
          Config.alignmentWeight,
          Config.cohesionWeight,
          Config.boundaryAvWeight,
          Config.turnRadius,
        );
      },
    },
  );

  const fishes: IFish[] = Array.from(
    { length: 200 },
    (_, i) =>
      new Fish(
        i,
        Config.fishWidth,
        Config.fishHeight,
        Config.fishVelocity,
        stage.width,
        stage.height,
      ),
  );

  stage.setEntities(fishes);
  stage.start();

  // Dev handle: tweak tuning live from the console instead of rebuilding.
  Object.assign(globalThis, { webFish: { Config, fishes, stage } });

  window.addEventListener("pagehide", () => stage.dispose(), { once: true });
}

main().catch((err) => {
  console.error(err);
  const box = document.getElementById("error")!;
  box.style.display = "grid";
  box.textContent = `Failed to start: \n${err instanceof Error ? err.message : String(err)}`;
});
