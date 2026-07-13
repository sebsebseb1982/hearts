## ADDED Requirements

### Requirement: Room creation with deep link
The system SHALL let a user create a room and receive a room identifier and a shareable deep-link URL of the form `/r/:roomId`. The creator becomes the host.

#### Scenario: Create a room
- **WHEN** a user requests to create a room
- **THEN** the system returns a unique `roomId` and a URL `/r/:roomId`, and assigns the creator the host role and a seat

#### Scenario: Open a shared link
- **WHEN** a user opens `/r/:roomId` for an existing room
- **THEN** the system presents the join flow for that specific room

#### Scenario: Unknown room
- **WHEN** a user opens `/r/:roomId` for a room that does not exist
- **THEN** the system indicates the room was not found and offers to create a new room

### Requirement: Seat assignment and game configuration
A room SHALL have exactly 4 seats. Joining humans occupy free seats. The host SHALL configure the game length (4, 8, or 12 rounds) before starting.

#### Scenario: Join takes a free seat
- **WHEN** a human joins a room with at least one free seat
- **THEN** the human is assigned a free seat and all room members are notified of the updated seating

#### Scenario: Room is full
- **WHEN** a human tries to join a room whose 4 seats are all occupied by humans
- **THEN** the join is rejected with a room-full indication

#### Scenario: Host sets round count
- **WHEN** the host selects a round count of 4, 8, or 12 before starting
- **THEN** that configuration is stored for the game

### Requirement: Start with bots filling empty seats
The host SHALL be able to start the game before all 4 seats are taken by humans; every seat not occupied by a human at start SHALL be filled by a bot.

#### Scenario: Start under four humans
- **WHEN** the host starts a game with fewer than 4 human players
- **THEN** each empty seat is filled by a bot and the game begins with 4 active seats

### Requirement: Reconnection by seat token
On joining, a player SHALL receive a `seatToken` bound to its seat. A player presenting a valid `{ roomId, seatToken }` SHALL reclaim its seat and current game view.

#### Scenario: Reconnect to held seat
- **WHEN** a player reconnects with a valid `seatToken` for a seat that is being held for it
- **THEN** the player reclaims that seat and receives the current authoritative view

#### Scenario: Bot takeover after grace period
- **WHEN** a human seat has been disconnected beyond the grace period
- **THEN** a bot takes over that seat so play continues, and the seat is reclaimable by the human on return

#### Scenario: Invalid token
- **WHEN** a player presents a `seatToken` that does not match any seat in the room
- **THEN** the reclaim is rejected and the player is offered any free seat instead
