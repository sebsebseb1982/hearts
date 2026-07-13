## ADDED Requirements

### Requirement: Bots play only legal moves from a redacted view
A bot SHALL decide its move from the same redacted view a human in that seat would receive, and SHALL only ever produce moves the engine deems legal. A bot SHALL NOT access hidden state or other seats' hands.

#### Scenario: Bot move is always legal
- **WHEN** it is a bot seat's turn
- **THEN** the bot produces a move that passes the engine's legality checks

#### Scenario: Bot has no hidden information
- **WHEN** a bot chooses a move
- **THEN** it uses only its own hand and public state, identical to what a human in that seat would see

### Requirement: Heuristic strategy
Bots SHALL apply a basic heuristic strategy: follow suit legally; prefer to shed high cards when it cannot win safely; avoid taking the Queen♠ and high Hearts when possible; try to take or retain the Jack♦; and respect first-trick and hearts-broken constraints.

#### Scenario: Avoid the Queen of Spades
- **WHEN** a bot can follow the led suit and one legal option risks taking the Queen♠ while another does not
- **THEN** the bot prefers the option that avoids taking the Queen♠

#### Scenario: Value the Jack of Diamonds
- **WHEN** a bot can win a trick containing the Jack♦ without incurring worse penalties
- **THEN** the bot prefers to take that trick

### Requirement: Seat filling and takeover
Bots SHALL fill empty seats when a game starts and SHALL take over human seats that remain disconnected beyond the grace period, relinquishing the seat when the human reconnects.

#### Scenario: Bot fills empty seat at start
- **WHEN** a game starts with an empty seat
- **THEN** a bot occupies that seat and plays its turns for the whole game unless a rule allows a human to take it

#### Scenario: Bot covers a disconnected human
- **WHEN** a human seat is disconnected past the grace period during play
- **THEN** a bot plays that seat's turns until the human reconnects and reclaims the seat
