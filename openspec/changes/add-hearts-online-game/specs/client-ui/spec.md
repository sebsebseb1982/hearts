## ADDED Requirements

### Requirement: Lobby screen
The client SHALL provide a lobby view to create a room, copy/share its deep-link URL, join via a shared link, set a pseudonym, see the seat roster, and (as host) configure round count and start the game.

#### Scenario: Create and share
- **WHEN** a user creates a room from the lobby
- **THEN** the client displays the `/r/:roomId` URL with a copy/share control

#### Scenario: Join via link
- **WHEN** a user opens a shared `/r/:roomId` link and enters a pseudonym
- **THEN** the client joins that room and shows the current roster

#### Scenario: Host controls
- **WHEN** the current user is the host
- **THEN** the client shows the round-count selector (4/8/12) and a start-game control; non-hosts do not see these controls

### Requirement: Table and hand view
The client SHALL render the player's own hand, the current trick, whose turn it is, the passing phase when active, and running scores. It SHALL only render information present in the redacted view.

#### Scenario: Render own hand
- **WHEN** the client receives a redacted view
- **THEN** it renders only the player's own hand face-up and other seats' cards face-down/hidden

#### Scenario: Highlight legal moves
- **WHEN** it is the player's turn to play
- **THEN** the client visually indicates which cards are legal to play

#### Scenario: Passing phase UI
- **WHEN** the round is a passing round and selection is open
- **THEN** the client lets the player pick exactly 3 cards and submit them, showing the pass direction

#### Scenario: Score display
- **WHEN** a round is scored
- **THEN** the client shows each seat's round score and cumulative total, including any shoot-the-star redistribution

### Requirement: Identity persistence and reconnection
The client SHALL store the pseudonym and per-room `seatToken` in `localStorage` and SHALL automatically attempt to reclaim the seat when reopening the room link.

#### Scenario: Auto-reconnect
- **WHEN** a player reopens a `/r/:roomId` link for which a valid `seatToken` is stored
- **THEN** the client attempts to reclaim that seat without re-entering a pseudonym

#### Scenario: Reflect game end
- **WHEN** the game ends
- **THEN** the client shows final standings and the winner (lowest cumulative score)
