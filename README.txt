Super relevant article from stripe front end team: https://stripe.com/blog/connect-front-end-experience
Perhaps some relevant animation techniques: https://medium.com/@bdc/gain-motion-superpowers-with-requestanimationframe-ecc6d5b0d9a4


A Pen created at CodePen.io. You can find this one at http://codepen.io/dwidomski/pen/RaoPNq.

---

## Todo:

- [ ] Building panel (building and road blocks)
- [x] Simple path finding
- [x] Simple AI agents
- [ ] Camera controls

### UI Events

https://stackoverflow.com/questions/4574016/game-objects-talking-to-each-other/4580241#4580241

... how do I keep state of whatever is happening in the UI... ?
Like, if I'm in building mode, I want the building manager to pick up all the events.
If i'm drawing a path, i want the pathing manager to pick up all events.
Do I just setup like a global state manager that can then 'attach' and 'detach' other managers which will in turn
assign their own event listeners?
Those can also have their own children I suppose and assign their own managers if need be.

## Path finding:

1. Grid based A*

http://web.mit.edu/eranki/www/tutorials/search/

### Issues:

- I'd like a unit tests and testing environment builder, specific examples, easy configuration, expected paths, etc.
- returning only the shortest path, no extra nodes, could randomly select possible nodes
- handling no path found state, maybe also figuring out easily if path can be reached at all?

2. Node based Dijkstra's

Would require me to convert the grid into nodes connected by edges of distance.

## Blocks:

- Road
- Block

## Controls:

- 'b' - rotate block types
- 'a' - Add a single randomply placed SimpleAgent

## Audio

Menu music - screensavers theme (have it on SSD)



## Fuck it, let's make it a multiplayer thing. TURF WARS!!!

// @NOTE: don't necessarily commit this
// https://gamedev.stackexchange.com/questions/23138/how-to-organize-a-game-engine-in-c-is-my-use-of-inheritance-a-good-idea

Simple. Multiplayer. Players take over buildings. That's it.
So how do players generate cash? Then each building generates some income? Start with that. Too passive, or too simple.
Each building means soldiers. Each building takes a certain number of soldiers to take over?
Players can send soldiers to take over buildings and colour them their color.
Bonus money for sectors.

Map is generated based on grid and sectors to start with.

Do I want a random element? I do, but it can't feel unfair. Player still has to be able to win the game
based on their skill.