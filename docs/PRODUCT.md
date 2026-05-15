# Product Specification - Cadre Sport

## Core Concept
Super Admin (US) conducts sports leagues/tournaments across India. Players find and join leagues in their city. Future: players find other players to play with (Connect feature - coming soon).

---

## User Roles & Creation

### Super Admin
- God role — controls everything
- Creates Tournament Operators (fills email, password, basic info directly — TOs do NOT self-signup)
- Creates leagues with full configuration
- Creates Federations and assigns Federation Admins
- Can do everything a TO can do on any league

### Tournament Operator (TO)
- Created BY Super Admin (not self-signup)
- Can only see/manage leagues assigned to them
- Accepts/rejects player registrations
- Assigns players to teams (if team-based league)
- Enters scores manually for every match
- Cannot create leagues or other TOs

### Federation Admin
- Created BY Super Admin
- View-only access to leagues in their assigned sport + area (city/state)
- Cannot modify anything — just oversight
- Matched by sport AND area (district/state level)

### Team Captain
- Auto-promoted when assigned as captain by TO/Admin
- Same as player but leads a team

### Player
- Self-signup (email, Google, phone)
- Must complete onboarding (name, DOB, gender, fav sports, city)
- Only sees leagues in their city
- Gender filter: men's only leagues hidden from women, women's only hidden from men
- Can register for open leagues matching their gender

---

## League Creation Flow (Super Admin only)

Order of fields:
1. **League Name**
2. **Dates** — start date, end date, registration deadline
3. **Location** — city, state, venue
4. **Federation** — optional, select from created federations (filtered by sport + area)
5. **Sport** — select from available sports
6. **Mode** — Team-based or Individual
7. **Gender Restriction** — Open (all), Men's Only, Women's Only
8. **Number of Divisions** — dynamic division name inputs
9. **Format** — Round Robin, Round Robin 2.0, Tournament (Knockout), Hybrid
10. **Match Config (per sport)** — e.g. Badminton: number of singles matches + number of doubles matches per team tie
11. **Max teams per division** (if team mode)

---

## Sport-Specific Match Config

### Badminton
- Each "tie" between two teams = N singles + M doubles matches
- Example: 3 singles + 2 doubles = 5 matches per tie
- Standings based on who wins more individual matches in each tie
- Each individual match: 21 points, best of 3 sets, deuce rule, cap at 30
- Configurable per league: number of singles, number of doubles

### Football
- Standard scoring: goals
- Win = 3 pts, Draw = 1 pt, Loss = 0 pts
- Each "match" is one game (no sub-matches)

### Future Sports
- Each sport gets its own scoring adapter + match config schema
- Added one by one as onboarded

---

## Tournament Structures

### Round Robin
- Every team plays every other team once
- Auto-generate H2H fixtures ensuring no repeat opponents per round
- After each round, a team plays someone they haven't played before

### Round Robin 2.0 (Double)
- Every team plays every other team twice (home & away)

### Tournament (Knockout)
- Auto-pick bracket size: nearest power of 2 (e.g. 12 teams → 16 bracket, 4 byes)
- **Seeding**: TO can assign rankings to top 4 teams → placed in bracket accordingly (top seeds separated)
- If top 4 all win, they meet in semifinals
- Byes go to highest-seeded teams
- Single elimination to finals

### Hybrid
- Round Robin phase first
- Top N teams advance to Knockout phase
- N configurable by admin

---

## Fixture Generation

### When
- After registration closes (status → REGISTRATION_CLOSED or IN_PROGRESS)
- TO or Admin triggers "Generate Fixtures" per division

### Round Robin Logic
- Circle method for balanced scheduling
- Each round: every team plays exactly once (or has a bye if odd count)
- No team plays the same opponent twice until all others are exhausted
- Match numbering sequential across rounds

### Knockout Logic
- Bracket size = next power of 2 ≥ team count
- Byes assigned to top-seeded teams first
- TO can seed top 4 teams (rank 1-4)
- Seeded teams placed in bracket so they don't meet until semis:
  - Seed 1: top of upper bracket
  - Seed 2: bottom of lower bracket
  - Seed 3 & 4: opposite quarters from 1 & 2
- Remaining teams randomly placed or in registration order

---

## Score Entry

### Who enters: TO (or Super Admin)
### When: After match is played
### How: Manual entry per match
- For badminton team ties: enter result of each sub-match (singles 1, singles 2, doubles 1, etc.)
- For football: enter goals
- System auto-calculates: match winner, tie winner, standings update

### What updates:
- Match status → COMPLETED
- Standings table (points, wins, losses, sport-specific stats)
- Bracket progression (knockout: winner advances to next match)
- Leaderboard rankings recalculated

---

## Visibility Rules

### Players see:
- Only leagues in THEIR city (from onboarding)
- Gender-filtered: men don't see women's only, women don't see men's only
- Open leagues visible to all genders

### TOs see:
- Only leagues assigned to them (no city filter)

### Federation Admins see:
- Leagues matching their federation's sport + area
- View-only access

### Super Admin sees:
- Everything

---

## Future: Connect Feature (Coming Soon)
- Players find other players in their city/sport to play with
- Schema should have room for: player skill level, availability, preferred venues
- Show "Coming Soon" in the app UI
- Do NOT build yet — just leave room in the architecture

---

## Points System (Round Robin / RR 2.0)

Each team tie = N matches (always odd number, no draws possible at tie level).

### Points per tie:
- **Each match won** = 1 point (regardless of tie outcome)
- **Win the tie** (win majority of matches) = points from matches won
- **Win ALL matches in a tie** = matches won + 1 bonus point

### Example: 3 matches per tie (Team A vs Team B)
| Result | A wins | A points | B wins | B points |
|--------|--------|----------|--------|----------|
| A wins 3-0 | 3 | 3 + 1 bonus = **4** | 0 | **0** |
| A wins 2-1 | 2 | **2** | 1 | **1** |
| B wins 2-1 | 1 | **1** | 2 | **2** |
| B wins 3-0 | 0 | **0** | 3 | 3 + 1 bonus = **4** |

### Leaderboard
- Sorted by total points accumulated across all ties
- Updates after EVERY match (not just after tie is complete)
- Tiebreaker: total individual matches won → head-to-head → sets/points ratio

---

## Round-by-Round Match Generation

In RR format, matches are NOT all generated upfront. Instead:
1. Generate Round 1 fixtures (all teams paired)
2. TO enters scores for all Round 1 matches
3. After Round 1 is complete → TO clicks "Generate Next Round" → system generates Round 2 (ensuring no repeat opponents)
4. Continue until all rounds complete

This ensures:
- Leaderboard is always current
- No team plays the same opponent twice until all others exhausted
- TO has control over pace of the league

---

## Additional Rules

### Registration
- TO or Admin can manually close registration early (regardless of deadline date)
- Players can be in multiple leagues simultaneously
- Players CANNOT withdraw themselves — only TO can remove them

### Team Config
- Admin sets min/max players per team when creating league
- Enforced during team creation and player assignment

### Score Editing
- TO can edit/correct scores after submission (for typos)
- Edit recalculates standings automatically
- Score history preserved for audit

### Knockout
- TO manually seeds top 4 before bracket generation
- Remaining teams placed by registration order or random
- No 3rd/4th place playoff — finals only
- In Hybrid: top N from RR advance to knockout, N set by admin. RR standings determine seedings.

### Lineup Assignment (Captain's Responsibility)
- For EVERY match in a tie (singles AND doubles), the Team Captain assigns which players play
- Singles: captain picks which player plays singles 1, singles 2, etc.
- Doubles: captain picks which pair plays doubles 1, doubles 2, etc.
- Captain submits full lineup before the tie begins
- This is a core captain responsibility — without lineup submission, scores cannot be entered

### Age Restrictions
- Not needed yet — may add later

---

## Decisions Log

| Question | Answer | Date |
|----------|--------|------|
| Match config per sport? | Configurable per league (e.g. 3 singles + 2 doubles for badminton) | May 2026 |
| Bracket size auto or manual? | Auto (nearest power of 2), TO can seed top 4 | May 2026 |
| Federation Admin powers? | View-only, scoped by sport + area | May 2026 |
| Connect feature? | Coming soon, leave room in schema | May 2026 |
| Gender options for leagues? | Women's Only, Men's Only, Open | May 2026 |
| TO creation? | Admin creates TOs directly (not self-signup) | May 2026 |
| League creation? | Super Admin only, assigns TO | May 2026 |
| Registration close? | TO/Admin can close manually + auto on deadline | May 2026 |
| Team size limits? | Min/max set during league creation | May 2026 |
| Multiple leagues? | Yes, player can join multiple | May 2026 |
| Tie scoring? | Points per match won + bonus for clean sweep | May 2026 |
| Match generation? | Round by round, not all upfront | May 2026 |
| Player withdrawal? | Only TO can remove, player cannot self-withdraw | May 2026 |
| Score editing? | TO can edit after submission, recalculates standings | May 2026 |
| 3rd place match? | No, finals only | May 2026 |
| Hybrid knockout seeding? | RR standings determine seeds, N set by admin | May 2026 |
| Next round generation? | TO clicks "Generate Next Round" button | May 2026 |
| Doubles partner assignment? | Team Captain assigns specific players per doubles match | May 2026 |
| Same player singles + doubles? | Yes, allowed in same tie | May 2026 |
| Match order in tie? | Flexible, TO/captain decides | May 2026 |
| League completion? | TO manually marks completed, leaderboard published as final | May 2026 |
| Tiebreaker? | Total matches won → H2H → sets/points ratio | May 2026 |
| Players see upcoming schedule? | Yes | May 2026 |
| TOs per league? | Exactly 1 | May 2026 |
| Reassign TO? | Yes, admin can reassign after creation | May 2026 |
| Lineup submission? | Captain assigns ALL players (singles + doubles) before tie | May 2026 |
| Pause state? | No special status, TO just stops entering scores | May 2026 |
| Player profiles? | Private for now, public in Connect feature later | May 2026 |
| Notifications? | WhatsApp API later (registration, approval, upcoming, results) | May 2026 |
| View other teams? | Yes on league page — names only, no contact info | May 2026 |
| Personal results? | Yes, player can view just their own results from a league | May 2026 |
| Change lineup between ties? | Yes, captain can change per tie | May 2026 |
| Lineup before scores? | Mandatory — TO cannot enter scores until lineup submitted | May 2026 |
| Roster lock? | Locked after registration closes. Only Super Admin can modify | May 2026 |
| Score entry timing? | Final result after match, not live/real-time | May 2026 |
| Walkover? | All matches won + bonus point for winning team | May 2026 |
| Score correction? | TO can edit scores once (1 edit allowed) | May 2026 |
| Public access? | Non-signed-in users can view league standings, results, schedule | May 2026 |
| Score edit limit? | 1 initial entry + 1 edit = locked forever. Only backend code change after that | May 2026 |
| Walkover handling? | TO marks which team forfeited. Forfeiting team loses all matches, 0 points. Winning team gets all matches won + bonus | May 2026 |
| Public browse? | City selector at top, shows leagues in that city + upcoming ones | May 2026 |
| Landing page? | All leagues (current + upcoming) + marketing hero section | May 2026 |
| Personal results? | Separate page: /leagues/[slug]/my-results (user-specific) | May 2026 |
| UI style? | Clean, modern, minimal changes from current. No major redesign | May 2026 |
| Age restrictions? | Not yet | May 2026 |
