Super relevant article from stripe front end team: https://stripe.com/blog/connect-front-end-experience
Perhaps some relevant animation techniques: https://medium.com/@bdc/gain-motion-superpowers-with-requestanimationframe-ecc6d5b0d9a4


A Pen created at CodePen.io. You can find this one at http://codepen.io/dwidomski/pen/RaoPNq.

---

## Todo:

- [ ] Building panel (building and road blocks)
- [x] Simple path finding
- [x] Simple AI agents
- [ ] Camera controls
- [ ] CSS "engine" (see below)

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


## CSS driven engine

Blocks/Elements can be initialised with static CSS using CSS vars.
We can define them upfront, and then some helper can get them and add some CSS dynamically to the class for that block.

We can create class definitions on the fly in the client, and they can be specific.

Elements can have a render/update method too, they can do more fancy stuff.
But a lot could be done with some CSS vars.

```js

class CSSVar {
  constructor(name, somePropsRegardingConfigCantRemember) {
    // ...
  }

  toString() {
    // Could we have this so that it gets coerced into a string like a CSS var in template literals?
    // Or only do this if we use a tagged template using `var.toCSSVarString()`?
    return `--${this.name}`;
    
    // or we only return the name so it can be stringified nicely (or with a bit extra)
    return this.name;
    return `[CSSVar:${this.name}]`;
  }
}

function main() {
  const bodyDomElement = document.querySelector('body');
  
  // this should generate the CSS definitions, initialise them, add them to the root element  
  const vars = createCSSVar(bodyDomElement, {
    varName: {
      ...configObject
    },
    ... // many css vars
  });
}

const Element {
  get cssClassName() {
    return `element-${this.id}`;
  }
}

const getCSSVariable = () => {
  // retrieves definition of it??? :thinking-face:
  // maybe just import instead
}

const dynamicCSS = () => {};

class Billboard extends Element {
  constructor(node, identifier, config) {
    this.node = node; // DOM Root node for this element
    this.id = identifier; // something to identify the block with
  }
  
  initialise() {
    // this is kinda pointless, as long as you reference things by name they'll work.
    // In CSS things will just be the closest variable... Have a think about that.
    // Idea was to get this almost like from context... but yeh, maybe pointless
    const width = getCSSVariable(bodyDomElement, 'width');
    
    // this would result in the thing being
    dynamicCSS(this.node, {
      width: `${width}` // should result in CSS like: "width: --width"
    };

    // Register event handlers here too?

    // what to do to build this element in CSS
    // Maybe a separate method on the class for that, like on(Element?)Mount
    // so it can return an element that can then be removed from the DOM on removing this Element
  }

  render() {
    // do we "register" a render callback?
    // just something to add to a global requestAnimationFrame?
    // Not sure what the use would be of a render callback, but might be handy to do some actual JS animations or whatever.
  }

  cleanup() {
    // do we need a cleanup?
    // if we "register" a render callback, then yes, we gotta unregister that haha
    // unless can be done with the engine, WeakMap internally against elements, unregister render callbacks...
  }
}
```

## Procedural generation

Can I have things generated procedurally based on a seed. Things like:
- properties of agents
  - how aggressively they drive
  - how fast they like to drive
  - their preferred parking space in a parking log of a shopping center
- their daily schedule
- their name

Plus any manual amendments implemented over that.
Point is to not store a lot of data, but to just look up things based on a seed, consistently be able to recall any bit of information, like, "what is this agent suppose to be doing at this time of day?", "what parking space do they prefer in this parking lot?", all could be looked up wherever, maybe based on a few seeds (or uuid? loads of data in that) and a function that convers that into some usable information.

## Multi block elements

Shopping center should have loads of parking spaces and might take up loads of squares, 4x4, 4x6 etc.

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