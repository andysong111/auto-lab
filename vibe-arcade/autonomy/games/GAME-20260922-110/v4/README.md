# Prism Relay

Prism Relay is an original spatial optical-routing practice game. A warm emitter enters the middle of a four-column prism board. Each prism sends its beam up-right, right, or down-right; route it to the highlighted receiver.

## Controls

- **Arrow keys** or **WASD** select a prism. Held movement repeats after a short delay.
- **Space** rotates the selected prism.
- **Tap or click** a prism to select and rotate it once.
- The supplied **Start Relay**, pause/resume, and **Play Again** controls manage the run.

## Deterministic rules

Each run lasts exactly 2700 fixed ticks (45 seconds). A correct receiver connection must remain lit for 45 ticks to charge a circuit. Three circuits meet the objective, while further circuits improve the practice score. Boards are constructed from the run seed with a valid route, then a bounded number of route prisms are scrambled, so a board is always solvable and never initially farmable without a rotation.

Play Again reproduces the same seeded sequence for mastery. The game has no accounts, online gameplay, analytics, or game-managed persistence.
