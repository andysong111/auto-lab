# Terra Provider Canary Chamber

An original commissioning-practice game about guiding a small canary sensor through a sealed environmental chamber. Three relay halos must each receive three nearby pulse readings. Once all relays are sealed, the chamber verifies its output and certifies the run. A ten-second safety sweep always creates a clear, repeatable terminal result for fixture practice.

## Controls

- **Arrow keys** or **WASD**: move the canary sensor.
- **Space**: pulse the relay currently within the canary's halo range.
- **Touch**: tap the board to place a touch guide, then drag to steer the canary. Touching is counted as a board interaction; pulse with the on-screen/keyboard action supplied by the host.

## Deterministic behavior

The simulation is DOM-free and deterministic for a supplied seed. It advances in fixed 1/60-second steps, stores only a bounded short pulse trail, and does not use time, random, network, accounts, or persistence APIs. A run terminates on certification or at the fixed safety-sweep limit (660 simulation ticks).

## Play and replay

Open the game page in a browser, select **Start chamber**, and move into each relay halo before pulsing it three times. Use **Pause** when needed. After a terminal result, select **Restart** for a fresh run with the same deterministic rules.
