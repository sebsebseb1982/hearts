## ADDED Requirements

### Requirement: Authoritative state with per-client redaction
The server SHALL be the sole authority for game state. On every state change it SHALL send each connected client a redacted view containing only that client's own hand plus public information (current trick, trick history summary, scores, whose turn, phase). A client SHALL never receive another seat's hand or the undealt/hidden state.

#### Scenario: Own hand only
- **WHEN** the server broadcasts state after a change
- **THEN** each client's payload contains its own hand and public data, and contains no other seat's cards

#### Scenario: Tampered client cannot see hidden cards
- **WHEN** a client inspects any received payload
- **THEN** no field exposes another seat's hand or cards not yet public

### Requirement: Move intents and validation
Clients SHALL communicate by sending intents (`passCards`, `playCard`). The server SHALL validate every intent against the engine's legality rules and reject illegal or out-of-turn intents without mutating state.

#### Scenario: Legal play accepted
- **WHEN** a client sends a `playCard` intent that the engine deems legal for that seat and turn
- **THEN** the server applies it and broadcasts updated redacted views

#### Scenario: Illegal play rejected
- **WHEN** a client sends a `playCard` intent that violates a rule (wrong turn, off-suit while able to follow, etc.)
- **THEN** the server rejects it, leaves state unchanged, and informs the sender of the rejection

#### Scenario: Pass selection
- **WHEN** a client sends a `passCards` intent of exactly 3 cards from its hand during a passing phase
- **THEN** the server records the selection and reveals/transfers only once all seats have submitted

### Requirement: Room-scoped messaging
The server SHALL scope all game and lobby broadcasts to the room's members so messages for one room are never delivered to another room.

#### Scenario: Broadcast stays in room
- **WHEN** the server broadcasts a state or lobby update for a room
- **THEN** only sockets joined to that room receive it

### Requirement: Connection lifecycle events
The system SHALL emit lobby/state updates on join, leave, disconnect, reconnect, and bot-takeover so all room members see an accurate roster and turn state.

#### Scenario: Disconnect notifies room
- **WHEN** a player disconnects
- **THEN** the room members are notified and the seat is marked disconnected (pending bot takeover)

#### Scenario: Reconnect resyncs
- **WHEN** a player reconnects and reclaims its seat
- **THEN** the server sends that client the full current redacted view so its UI resumes accurately
