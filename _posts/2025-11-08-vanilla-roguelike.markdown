---
layout: post
title:  "Building Vanilla Roguelike: A Journey Through Algorithms, Architecture, and Passion"
date:   2025-11-08 11:15:00
categories: ruby game-development
tags: [roguelike ruby game-development ECS algorithms architecture procedural-generation]
---

What does it take to build a roguelike game from scratch? Not with a game engine, not with external libraries, but with pure Ruby—just you, the language, and a terminal. That's the challenge I set for myself in April 2020, and over the next five years, this passion project would teach me more about algorithms, game programming patterns, and software architecture than any tutorial ever could.

This is the story of [Vanilla Roguelike](https://github.com/Davidslv/vanilla-roguelike): a journey that started with maze generation algorithms, hit a catastrophic breaking point that nearly ended the project, and ultimately led to a complete architectural transformation. It's a story about learning through doing, about the value of good architecture, and about how sometimes the most painful moments in development become the most valuable lessons.

## The Beginning: Algorithms and Exploration (2020)

The journey began on April 9, 2020, with commit `7352e70`—a simple initial commit that would set the foundation for everything to come. At this stage, Vanilla wasn't a game at all; it was an exploration of maze generation algorithms.

I started with the Binary Tree algorithm—simple, elegant, and perfect for learning:

```ruby
module Vanilla
  class BinaryTree
    def self.on(grid)
      grid.each_cell do |cell|
        neighbors = []
        neighbors << cell.north if cell.north
        neighbors << cell.east if cell.east
        neighbor = neighbors.sample

        cell.link(cell: neighbor) if neighbor
      end

      grid
    end
  end
end
```

This was followed by more sophisticated algorithms: Aldous-Broder for completely unbiased mazes, Recursive Backtracker for long corridors, and Recursive Division for boxy, rectangular layouts. Each algorithm taught me something new about graph theory, pathfinding, and procedural generation.

```mermaid
graph TD
    A[Grid Creation] --> B[Choose Algorithm]
    B --> C[Binary Tree]
    B --> D[Aldous-Broder]
    B --> E[Recursive Backtracker]
    B --> F[Recursive Division]
    C --> G[Link Cells]
    D --> G
    E --> G
    F --> G
    G --> H[Generate Maze]
    H --> I[Pathfinding]
    H --> J[Distance Calculations]
    H --> K[Longest Path]
```

The focus was purely on algorithms: pathfinding, distance calculations, finding the longest path between points. The code was clean, focused, and educational. I was learning, and that was enough.

## Early Game Development (2020-2021)

By mid-2020, the project started evolving. I added movement—the player character could navigate the maze. I added terminal rendering to visualize the generated mazes. I implemented seed-based generation for reproducibility, allowing the same maze to be generated consistently.

But it still wasn't really a "game." It was a maze generator with a movable character. The architecture was simple: a grid, some algorithms, basic rendering. There was no game loop, no entities, no systems. Just code that worked.

This simplicity was both a blessing and a curse. It made early development fast and enjoyable, but it also meant that when I wanted to add actual game features—monsters, combat, inventory—I had no foundation to build on.

## The Growing Pains: Architecture Drift (2021-2025)

As features accumulated, problems began to emerge. Without a clear architectural pattern, logic started appearing in the wrong places. The `LevelGenerator` class began handling entity management. The `Game` class became a catch-all for game state, rendering, and input handling. Components became tightly coupled.

```mermaid
graph TD
    A[Game Class] --> B[LevelGenerator]
    A --> C[Entity Management]
    A --> D[Rendering]
    A --> E[Input Handling]
    A --> F[Game State]
    B --> G[Entity Logic]
    B --> H[Maze Generation]
    C --> I[Tight Coupling]
    D --> I
    E --> I
    F --> I
    I --> J[Unpredictable Failures]
    I --> K[Crashes]
    I --> L[Hard to Test]
```

The signs were there: crashes when adding new components, unpredictable behavior when modifying code, infinite recursion in movement logic. Every new feature required touching multiple classes. The codebase was becoming a house of cards.

I knew something had to change, but I didn't know what. Until March 22, 2025, when everything broke.

## The BREAKINGPOINT (March 22-23, 2025)

Commit `6d08051` on March 23, 2025, marked the BREAKINGPOINT. The commit message tells the story:

> BREAKINGPOINT: Game renders but stays in a loop, prevents input
>
> The game now is in a constant loop (the screen is flickering, hence my assumption). We can't move forward until we fix this issue.

I had been removing non-ECS code to streamline the architecture, but the removal broke everything. The game rendered, but the player couldn't move. Stairs didn't transition levels. Monsters didn't spawn. Input was completely blocked. The game was completely non-functional.

```mermaid
graph TD
    A[ECS Migration Started] --> B[Removed Legacy Code]
    B --> C[Game Loop Broken]
    B --> D[Input Blocked]
    B --> E[Movement Disabled]
    B --> F[Level Transitions Broken]
    B --> G[Monster Spawning Failed]
    C --> H[BREAKINGPOINT]
    D --> H
    E --> H
    F --> H
    G --> H
    H --> I[9+ Hours of Debugging]
    I --> J[20+ Commits to Fix]
```

The frustration was real. After years of work, the game was completely broken. But this crisis would become the turning point. I had two choices: give up, or commit to fixing the architecture properly.

I chose the latter.

Over the next 9+ hours, I worked through 20+ commits trying to restore functionality. The commit log from `BREAKPOINT.md` shows the struggle:

```
[2025-03-23 14:43:04] 6d08051 BREAKINGPOINT: Game renders but stays in a loop, prevents input
[2025-03-23 17:04:42] e45a205 Refactor game loop to restore turn-based mechanics
[2025-03-23 21:37:55] f9b9100 WIP: better rendering of the map, still no movement
[2025-03-23 22:21:44] 1fe22c7 WIP: We have movement! But no Level transition
[2025-03-23 22:40:48] f455e33 SUCCESS: Movement + Level Transition
[2025-03-23 23:13:28] ed385f1 fix: logging and stair positioning
```

Each commit was a small victory, a step closer to a working game. But the real lesson wasn't in the fixes—it was in understanding why the architecture had to change.

## The Decision: ECS Migration (March 22, 2025)

The BREAKINGPOINT made it clear: the ad-hoc architecture wasn't sustainable. I needed a proper pattern, and Entity-Component-System (ECS) was the answer.

ECS separates data (components) from behavior (systems), allowing for flexible composition of game objects. It's a pattern used in many modern game engines, and learning it was part of my goal: to understand game programming patterns through practice.

On March 22, 2025, I created the ECS Refactoring Implementation Plan (commit `0a20b74`). The migration would happen in six phases:

1. **Phase 0**: Preparation and initial setup
2. **Phase 1**: Component Purification
3. **Phase 2**: Entity Simplification
4. **Phase 3**: System Implementation
5. **Phase 4**: World and Event Implementation
6. **Phase 5**: Game Integration
7. **Phase 6**: Testing

The new architecture would look like this:

```mermaid
graph TB
    subgraph "Entry Point"
        A[bin/play.rb]
    end

    subgraph "Game Layer"
        B[Vanilla::Game]
        B --> C[Game Loop]
    end

    subgraph "ECS Coordinator"
        D[Vanilla::World]
        D --> E[Entities]
        D --> F[Systems]
        D --> G[Commands Queue]
        D --> H[Events Queue]
    end

    subgraph "Components"
        I[PositionComponent]
        J[HealthComponent]
        K[CombatComponent]
        L[RenderComponent]
    end

    subgraph "Systems"
        M[MovementSystem]
        N[CombatSystem]
        O[RenderSystem]
    end

    A --> B
    B --> D
    E --> I
    E --> J
    E --> K
    E --> L
    D --> M
    D --> N
    D --> O
    M --> E
    N --> E
    O --> E
```

Components became pure data containers:

```ruby
module Vanilla
  module Components
    class PositionComponent < Component
      attr_reader :row, :column

      def initialize(row:, column:)
        super()
        @row = row
        @column = column
      end

      def type
        :position
      end
    end
  end
end
```

Systems became focused logic processors:

```ruby
module Vanilla
  module Systems
    class MovementSystem < System
      def update(_delta_time)
        movable_entities = entities_with(:position, :movement, :input, :render)
        movable_entities.each { |entity| process_entity_movement(entity) }
      end

      def move(entity, direction)
        # Clean, focused movement logic
        position = entity.get_component(:position)
        # ... movement implementation
      end
    end
  end
end
```

The World class became the coordinator, managing entities, systems, events, and commands—but not containing game logic itself.

## Recovery and Stabilization (March 23, 2025)

The 9+ hour debugging marathon wasn't just about fixing bugs—it was about understanding the new architecture. Each fix taught me something about how ECS should work.

Key fixes included:
- Restoring player movement with proper system integration
- Fixing level transitions through event-driven commands
- Re-enabling monster spawning with proper entity management
- Fixing input handling by separating concerns
- Restoring logging for debugging

But not everything was perfect. The rushed fixes introduced some issues:
- Monster positions became inconsistent despite fixed seeds
- Event logging was temporarily disabled
- Some responsibilities became entangled across components

These were acceptable trade-offs at the time. The game worked again, and that was what mattered. The technical debt could be addressed later.

The real victory wasn't just a working game—it was understanding that the architecture change was necessary. The BREAKINGPOINT wasn't a failure; it was a forced learning moment that saved the project.

## Building Features: TDD and Proposals (March-November 2025)

With a solid ECS foundation, feature development became a joy. I adopted a proposal-driven, test-driven development approach.

For the combat system, I created Proposal 001—a document comparing six different combat approaches, from simple turn-based to a classic Rogue-style D20 system. Each proposal included architecture diagrams, TDD plans, and pros/cons. I chose Proposal 1: Simple Turn-Based Combat, and implemented it with comprehensive tests.

```ruby
module Vanilla
  module Systems
    class CombatSystem < System
      def process_attack(attacker, target)
        attacker_combat = attacker.get_component(:combat)
        target_combat = target.get_component(:combat)
        return false unless attacker_combat && target_combat

        # Check if attack hits based on accuracy
        hit = rand < attacker_combat.accuracy

        if hit
          damage = calculate_damage(attacker_combat, target_combat)
          apply_damage(target, damage, attacker)
          check_death(target, attacker)
        end

        hit
      end
    end
  end
end
```

The combat flow integrated seamlessly with the ECS architecture:

```mermaid
sequenceDiagram
    participant Player
    participant CollisionSystem
    participant MessageSystem
    participant CombatSystem
    participant Monster

    Player->>CollisionSystem: Moves into monster
    CollisionSystem->>MessageSystem: Emit :entities_collided
    MessageSystem->>Player: Show "Attack Monster [1]" option
    Player->>CombatSystem: Execute attack
    CombatSystem->>CombatSystem: Calculate damage
    CombatSystem->>Monster: Apply damage
    CombatSystem->>MessageSystem: Emit :combat_damage
    alt Monster dies
        CombatSystem->>CombatSystem: Check death
        CombatSystem->>MessageSystem: Emit :combat_death
    end
```

This approach continued with the loot system (Proposal 003) and inventory system. Each feature was designed first, then implemented with tests, then integrated. The ECS architecture made this process smooth and predictable.

## Current State: Playable but Incomplete

Today, Vanilla Roguelike is a functional, playable game. The player can move through procedurally generated mazes, fight monsters, collect loot, manage inventory, and progress through levels. The codebase has 497 passing tests, a solid ECS architecture, and comprehensive documentation.

Recent statistics from the combat/loot/inventory integration show the scale:
- 48 files changed
- 7,952 insertions
- 45 commits
- 15 new test files

But it's not complete. There are polish details missing, some features are incomplete, and there are known bugs (inventory display issues, frame timing delays). The game works, but it's rough around the edges.

And that's okay. This project was never about shipping a perfect game—it was about learning. Learning algorithms, learning architecture, learning that sometimes you have to break everything to build it back better.

## Conclusion: Lessons from the Journey

The journey of building [Vanilla Roguelike](https://github.com/Davidslv/vanilla-roguelike) taught me that architecture matters. The BREAKINGPOINT wasn't just a crisis—it was a turning point that forced me to learn proper game architecture patterns. The ECS migration, painful as it was, saved the project and made future development possible.

I learned that learning through doing is powerful. Reading about ECS is one thing; implementing it, breaking it, and fixing it teaches you so much more. The algorithms I implemented, the patterns I learned, the mistakes I made—all of it was valuable.

Most importantly, I learned that passion-driven development has value. Building something from scratch, with no external dependencies, forces you to understand every piece. It's slower, it's harder, but it's deeply educational.

The BREAKINGPOINT that nearly ended the project became its salvation. The crisis forced the architecture change that made everything else possible. Sometimes, the most painful moments in development become the most valuable lessons.

[Vanilla Roguelike](https://github.com/Davidslv/vanilla-roguelike) is still a work in progress. There's polish to add, features to complete, bugs to fix. But it's playable, it's built on solid architecture, and it represents five years of learning. That's enough.

For now.
