export const Config = {
  perceptionRadius: 90, // can see other fish within this distance
  turnRadius: 100, // when to keep away from boundary
  separationWeight: 1.6, // keep away from other fish
  alignmentWeight: 2.6, // stay aligned with other fish
  cohesionWeight: 0.02, // get together with other fish
  boundaryAvWeight: 100.0, // keep away from boundary
  fishWidth: 20,
  fishHeight: 20,
  fishVelocity: 4,
} as const;
