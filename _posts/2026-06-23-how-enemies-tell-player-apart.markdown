---
layout: post
title:  "How Enemies Tell the Player Apart from Other Enemies"
date:   2026-06-23
categories: ruby game-development
tags: [roguelike ruby game-development ECS AI architecture faction-system]
---

A question that comes up often when people start writing a roguelike: *how does a monster know that the player is the player, and not just another monster?* And once you start asking that, the next questions follow quickly. Can two monsters fight each other? Can I have an allied NPC that walks beside the player and helps in combat? Can a summoned companion tell friend from foe?

The answer depends on the architecture you reach for. Two patterns tend to emerge — and they trade off simplicity against the kind of emergent gameplay you can build on top.

The examples below are in Ruby, in an Entity-Component-System style. The patterns translate to any language and any engine.

## Approach 1: direct player reference and entity tags

The simplest approach treats the player as a singular, named entity that AI systems hold a direct reference to. Monster AI looks up "the player" by reference. Combat and collision distinguish entities by simple tags — `:player`, `:monster`, `:item`, `:stairs`.

```ruby
def initialize(world, player:, logger: nil)
  super(world)
  @player = player
  @monsters = []
end

def player_collision?
  player_pos = @player.get_component(:position)
  monster_at(player_pos.row, player_pos.column) != nil
end
```

Combat and collision logic checks tags rather than examining relationship data:

```ruby
if @attacker.has_tag?(:player) && @target.has_tag?(:monster)
  combat_system.process_turn_based_combat(@attacker, @target)
else
  combat_system.process_attack(@attacker, @target)
end
```

### Trade-offs

**Strengths**

- Simple and direct. Player lookup is O(1).
- Easy to debug. Data flow is explicit.
- Sufficient for traditional roguelikes where the player is the only target of interest.

**Limitations**

- Player-centric architecture. AI systems explicitly depend on the player entity, which limits portability of AI logic.
- Allied NPCs and companions require special cases.
- Monster infighting is awkward. Two monsters cannot fight each other without ad-hoc per-pair logic.
- AI is harder to test in isolation, since it expects a player to exist.

## Approach 2: a faction component system

A more general approach models alliance and hostility as data attached to each entity, via a `FactionComponent`. Each entity belongs to a faction; each faction declares a set of factions it considers hostile.

```ruby
class FactionComponent < Component
  attr_accessor :faction_id
  attr_reader :hostile_to

  def initialize(faction_id:, hostile_to: [])
    @faction_id = faction_id
    @hostile_to = Set.new(hostile_to)
  end

  def hostile_to?(other_faction_id)
    @hostile_to.include?(other_faction_id)
  end

  def ally_of?(other_faction_id)
    @faction_id == other_faction_id
  end
end
```

AI then queries for hostile entities by faction instead of explicitly looking for the player:

```ruby
def find_hostile_targets_in_range(entity, range)
  entity_pos = entity.get_component(:position)
  entity_faction = entity.get_component(:faction)

  @world.query_entities([:position, :faction]).select do |other|
    next if other.id == entity.id

    other_pos = other.get_component(:position)
    other_faction = other.get_component(:faction)
    distance = (entity_pos.row - other_pos.row).abs +
               (entity_pos.column - other_pos.column).abs

    distance <= range && entity_faction.hostile_to?(other_faction.faction_id)
  end
end

def find_nearest_hostile(entity)
  targets = find_hostile_targets_in_range(entity, Float::INFINITY)
  return nil if targets.empty?

  entity_pos = entity.get_component(:position)
  targets.min_by do |target|
    target_pos = target.get_component(:position)
    (entity_pos.row - target_pos.row).abs + (entity_pos.column - target_pos.column).abs
  end
end
```

Entities are initialised with appropriate factions on creation:

```ruby
# Player
player.add_component(FactionComponent.new(
  faction_id: :hero_faction,
  hostile_to: [:monster_faction, :undead_faction, :demon_faction]
))

# Goblin
goblin.add_component(FactionComponent.new(
  faction_id: :monster_faction,
  hostile_to: [:hero_faction, :npc_faction]
))

# Town guard, allied with the player
guard.add_component(FactionComponent.new(
  faction_id: :npc_faction,
  hostile_to: [:monster_faction, :undead_faction, :demon_faction]
))

# Zombie, hostile to everything living
zombie.add_component(FactionComponent.new(
  faction_id: :undead_faction,
  hostile_to: [:hero_faction, :npc_faction, :monster_faction]
))
```

### Trade-offs

**Strengths**

- Player-agnostic architecture. The player is just another actor with a faction.
- Allied NPCs and companions are trivial — assign them the same faction as the player.
- Monster infighting falls out for free.
- Dynamic relationships are possible at runtime: diplomacy, betrayal, disguise potions, temporary alliances.
- AI is testable without a player entity present.

**Costs**

- More indirection. A simple "find the player" becomes a query across the entity store.
- Naïve implementation has worse performance: target selection scans every entity each turn.
- More moving parts. Every entity must be assigned a faction at creation time.

## Performance considerations

The query cost in Approach 2 grows with the number of entities. Three common mitigations:

**Spatial partitioning.** Use a spatial hash or quadtree so AI only inspects nearby entities rather than the full entity list.

```ruby
def find_hostile_targets_in_range(entity, range)
  nearby = @world.spatial_index.query_radius(entity_pos, range)
  nearby.select { |e| entity_faction.hostile_to?(e.get_component(:faction).faction_id) }
end
```

**Per-faction caches.** Compute the hostile-entity list once per faction per turn rather than per AI tick.

**Invalidate on events.** Rebuild caches only when entities spawn, die, or change faction — not every frame.

## Emergent gameplay enabled by factions

A faction system enables scenarios that are awkward or impossible under direct-reference architecture:

- **Three-way battles.** The player walks into a room where goblins and zombies are already fighting. All three groups continue attacking each other.
- **Temporary alliances.** A potion removes a faction from the player's hostile set for *N* turns; monsters ignore the player until the effect wears off.
- **NPC companions.** A summoned ally or rescued guard shares the player's faction; existing AI treats it as a friend without a separate "companion AI" branch.
- **Civil wars.** A subset of goblins splits off into a rebel faction and becomes hostile to the original goblin faction. No further engine changes are needed.
- **Disguises and shapeshifting.** Switching a creature's faction temporarily lets it move through hostile territory unmolested.

## When to choose which

**Direct player reference and tags are appropriate when:**

- The game is a traditional single-player roguelike.
- The player is the only entity AI cares about.
- The codebase is at the prototyping stage and clarity beats extensibility.
- Performance is a tight constraint and the entity count is high.

**A faction system is appropriate when:**

- Allied NPCs, companions, or summoned creatures are planned.
- Monster-versus-monster combat is part of the design.
- Faction relationships need to change at runtime.
- The game is simulation-heavy (*Dwarf Fortress*, *Caves of Qud* style) rather than purely player-versus-dungeon.

## Migration path

Entity tags can be treated as implicit factions in a small codebase, then promoted to an explicit `FactionComponent` later. Each tag becomes a faction id; explicit hostility rules replace the ad-hoc `has_tag?` checks. Most call sites can move from

```ruby
if entity.has_tag?(:monster) && other.has_tag?(:player)
```

to

```ruby
if entity.get_component(:faction).hostile_to?(other.get_component(:faction).faction_id)
```

without restructuring the surrounding systems. This keeps the door open: start with the simpler approach, and refactor only when the game actually needs multi-faction behaviour.

---

*This article is adapted from a discussion about [Vanilla Roguelike](https://github.com/Davidslv/vanilla-roguelike), the open-source codebase behind [Building Your Own Roguelike: A Practical Guide](/books/vanilla-roguelike/).*
