## ADDED Requirements

### Requirement: Deck and dealing
The engine SHALL model a standard 52-card deck (4 suits × 13 ranks) and deal 13 cards to each of the 4 seats using a seeded shuffle so a given seed reproduces the same deal.

#### Scenario: Full deal
- **WHEN** a new round is dealt
- **THEN** each of the 4 seats receives exactly 13 distinct cards and all 52 cards are distributed with none left over

#### Scenario: Deterministic deal from seed
- **WHEN** the same seed is used to deal two rounds
- **THEN** both rounds produce identical hands per seat

### Requirement: Cyclic passing phase
The engine SHALL rotate the passing direction by round index as `[left, right, across, hold][roundIndex % 4]`. In `hold` rounds no cards are passed. Passing SHALL be simultaneous: all four 3-card selections are collected before any card is revealed or transferred.

#### Scenario: Pass left
- **WHEN** the round index maps to `left` and every seat has selected 3 cards
- **THEN** each seat's 3 selected cards move to the seat on its left and each seat ends with 13 cards

#### Scenario: Hold round
- **WHEN** the round index maps to `hold`
- **THEN** no passing selection is requested and play begins immediately with the dealt hands

#### Scenario: Simultaneous reveal
- **WHEN** fewer than all 4 seats have submitted their 3-card selection
- **THEN** no seat receives its incoming cards and no seat can see another seat's selection

### Requirement: Trick play legality
The engine SHALL enforce Hearts play conventions: the holder of the 2♣ leads the first trick with the 2♣; players MUST follow the led suit if able; hearts cannot be led until a heart has been played (hearts broken); and no penalty card (any Heart or the Queen♠) may be discarded on the first trick unless the player has no legal alternative.

#### Scenario: First lead is 2 of clubs
- **WHEN** the first trick of a round begins
- **THEN** the only legal opening move is the 2♣ played by its holder

#### Scenario: Must follow suit
- **WHEN** a player holds at least one card of the led suit
- **THEN** the engine rejects any move that is not of the led suit

#### Scenario: Hearts not broken
- **WHEN** a player is on lead, no heart has yet been played, and the player holds a non-heart card
- **THEN** the engine rejects leading a heart

#### Scenario: No penalty on first trick
- **WHEN** it is the first trick and a player cannot follow clubs
- **THEN** the engine rejects discarding a Heart or the Queen♠ if any non-penalty card is available

#### Scenario: Trick winner leads next
- **WHEN** all four players have played to a trick
- **THEN** the highest card of the led suit wins the trick and its player leads the next trick

### Requirement: Round scoring
The engine SHALL score each completed round as: Queen♠ = +50 to its taker; each Heart = its face value (2..10 = pip, J=11, Q=12, K=13, A=14) to its taker; Jack♦ = -20 to its taker; all other cards = 0. The total positive penalty available in a round SHALL equal 154.

#### Scenario: Standard penalty tally
- **WHEN** a round ends without a shoot
- **THEN** each seat's round score equals the sum of the face values of Hearts it took, plus 50 if it took the Queen♠, minus 20 if it took the Jack♦

#### Scenario: Face value of court hearts
- **WHEN** a seat takes the Jack, Queen, King, and Ace of Hearts and no other penalty cards
- **THEN** that seat scores 11 + 12 + 13 + 14 = 50 for the round

### Requirement: Shoot the star
The engine SHALL detect when a single seat has taken all 154 positive points (all 13 Hearts and the Queen♠) in a round. When that occurs, the shooting seat scores 0 for those points and each of the other three seats scores +154. The Jack♦ -20 SHALL be applied independently to whoever took it, regardless of the shoot.

#### Scenario: Successful shoot
- **WHEN** one seat has taken all 13 Hearts and the Queen♠ in a round
- **THEN** that seat scores 0 from those cards and each other seat scores +154

#### Scenario: Jack of diamonds unaffected by shoot
- **WHEN** a shoot occurs and one seat took the Jack♦
- **THEN** that seat's -20 is applied to its round total independently of the shoot redistribution

#### Scenario: No shoot when points are split
- **WHEN** the 154 positive points are taken by more than one seat
- **THEN** no redistribution occurs and standard scoring applies

### Requirement: Game length and winner
The engine SHALL run a configurable number of rounds (4, 8, or 12) and end the game after the final round. The seat with the lowest cumulative score SHALL be the winner.

#### Scenario: Game ends after configured rounds
- **WHEN** the configured number of rounds has been scored
- **THEN** the engine reports the game as over and no further rounds start

#### Scenario: Lowest score wins
- **WHEN** the game ends
- **THEN** the seat with the lowest cumulative total is declared the winner
