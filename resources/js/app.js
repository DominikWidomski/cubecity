import Agent from './components/agent';
import PathBuilderManager from './ui/path-builder-manager';

const BLOCK_SIZE = 50;
const WORLD_X = 500;
const WORLD_Y = 500;
const STRUCTURES = ['BLOCK', 'ROAD'];
let SELECTED_STRUCTURE = 'ROAD';

const GAME = window.GAME = {
  running: true,
  agents: new Set(),
};

const helpText = `Functions:
  h - HELP, show this help text
  b - BUILD, also switches which structure to build.
  a - generate an AI AGENT, picks its own randomised path
  p - start creating a PATH for an AI agent
  Escape - cancel PATH building
`;

const unindentText = text => {
  return text.replace(/\n\s+/g, '\n');
};

// @TODO: Was trying to create some sort of observable Set easily using Proxy
// to observe the amount of agents visible etc.
// Issues with context or something when trying to proxy a Set.
// Maybe need custom observable???
// 
// const GAMEAgentsProxyHandler = {
//   // set(target, key, val) {
//   // },

//   apply(target, thisArg, argumentsList) {
//     console.log(target, thisArg, argumentsList);
//   }
// }

// GAME.agents = new Proxy(GAME.agents, GAMEAgentsProxyHandler);

const blockConfig = {
  roadTopColor: '#6f666f',
  blockTopColor: '#AAAAAA',
};

function newBox(type = 'BLOCK') {
  const blockClasses = {
    BUILDING: 'building'
  }

  const node = document.createElement('div');
  node.innerHTML = getBoxHTML(type, blockClasses[type]);

  return node.firstChild;
}

/**
 * Get the HTML of a box
 *
 * @param {string} type
 * @param {string} classList
 *
 * @return {string}
 */
function getBoxHTML(type, classList = '') {
  return `<div class="box ${classList.join ? classList.join(' ') : classList}">
    <div class="side"></div>
    <div class="side r"></div>
    <div class="side l"></div>
    <div class="side f"></div>
    <div class="side b"></div>
    <div class="side t" ${type === 'ROAD' ? `style="background-color: ${blockConfig.roadTopColor}"` : ''}></div>
  </div>`;

  // return `<div class="box">
  //   <div class="side"></div>
  //   <div class="side r">
  //     <canvas width="100" height="100" data-texture="ground"></canvas>
  //   </div>
  //   <div class="side l">
  //     <canvas width="100" height="100" data-texture="ground"></canvas>
  //   </div>
  //   <div class="side f">
  //     <canvas width="100" height="100" data-texture="water"></canvas>
  //   </div>
  //   <div class="side b">
  //     <canvas width="100" height="100" data-texture="ground"></canvas>
  //   </div>
  //   <div class="side t">
  //     <canvas width="100" height="100" data-texture="grass"></canvas>
  //   </div>
  // </div>`;
}

(function() {
  // https://css-tricks.com/controlling-css-animations-transitions-javascript/
  function getCssKeyframes(name) {
    // gather all stylesheets into an array
    var ss = document.styleSheets;

    // loop through the stylesheets
    for (var i = 0; i < ss.length; ++i) {
      // loop through all the rules
      if (!ss[i].cssRules) break;
      for (var j = 0; j < ss[i].cssRules.length; ++j) {
        // find the -webkit-keyframe rule whose name matches our passed over parameter and return that rule
        if (
          ss[i].cssRules[j].type == window.CSSRule.WEBKIT_KEYFRAMES_RULE &&
          ss[i].cssRules[j].name == name
        )
          return ss[i].cssRules[j];
      }
    }

    // rule not found
    return null;
  }

  // remove old keyframes and add new ones
  function change(anim, diffX) {
    // find our -webkit-keyframe rule
    var keyframes = getCssKeyframes(anim);
    if (!keyframes) return;
    //sometimes this returns null so we gotta be able to reset it?
    // Why does it return null????!

    var regexp = /rotateX\((\d+)deg\)/gi;
    var currX = regexp.exec(keyframes.findRule("0%").cssText);
    if (!currX) return;
    var newValX = parseFloat(currX[1]) + diffX;
    if (newValX < 0) {
      newValX = newValX + 360;
    } else if (newValX > 360) {
      newValX %= 360;
    }

    console.log(newValX);

    // remove the existing 0% and 100% rules
    keyframes.deleteRule("0%");
    keyframes.deleteRule("100%");

    // create new 0% and 100% rules
    keyframes.appendRule(
      "0% { transform: perspective(500px) translateY(50px) rotateX(" +
        newValX +
        "deg) rotateZ(0deg); }"
    );
    keyframes.appendRule(
      "100% { transform: perspective(500px) translateY(50px) rotateX(" +
        newValX +
        "deg) rotateZ(360deg); }"
    );

    // assign the animation to our element (which will cause the animation to run)
    document.querySelector('.plane').style.webkitAnimationName = anim;
  }

  var b = document.body;
  var lastY = null;
  var lastX = null;
  var dragging = false;
  b.addEventListener('mousedown', function(e) {
    dragging = true;
    lastY = e.y;
    lastX = e.x;
  });
  b.addEventListener('mousemove', function(e) {
    if (!dragging) {
      return;
    }

    if (lastY === null) {
      lastY = e.y;
    }
    if (lastX === null) {
      lastX = e.x;
    }

    var diffY = lastY - e.y;
    lastY = e.y;

    const diffX = lastX - e.x;
    lastX = e.x;

    // change('spin', diffY);
    rotatePlane(diffX, diffY);
  });
  b.addEventListener('mouseup', function(e) {
    dragging = false;
  });

  const pathInterface = new PathBuilderManager({ maxLength: 2 });
  pathInterface.on('finish', nodes => {
    runPath.apply(undefined, nodes.map(n => `${n.x},${n.y}`));
  });

  b.addEventListener('keypress', e => {
    if (e.key === 'h') {
      console.log(helpText);
    }
    
    if (e.key === 'b') {
      let currIndex = STRUCTURES.indexOf(SELECTED_STRUCTURE);
      SELECTED_STRUCTURE = STRUCTURES[(++currIndex) % STRUCTURES.length];
      console.log(`Changed structure: ${SELECTED_STRUCTURE}`);
    }

    if (e.key === 'a') {
      const agent = generateAgent();
      console.log(`Agent created at [${agent.x}, ${agent.y}]`);
    }

    if (e.key === 'p') {
      pathInterface.start();
    }
  });

  b.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      pathInterface.cancel();
    }
  });

  function rotatePlane(rotationZ = 0, rotationX = 0) {
    if (rotationZ === 0 && rotationX === 0) {
      return;
    }

    const plane = document.querySelector('.plane');
    const styles = window.getComputedStyle(plane);
    const planeRotZ = parseFloat(styles.getPropertyValue('--plane-rot-z'));
    const planeRotX = parseFloat(styles.getPropertyValue('--plane-rot-x'));
    const unit = 'deg';

    plane.style.setProperty('--plane-rot-z', planeRotZ + rotationZ + unit);
    plane.style.setProperty('--plane-rot-x', planeRotX + rotationX + unit);
  }

  /**
   * Handle click events on blocks
   *
   * Allows adding blocks
   *
   * @param {DOMEvent} e
   */
  document.addEventListener('click', e => {
    if (!e.target.closest('.side')) {
      return;
    }

    const { roadTopColor, blockTopColor } = blockConfig;

    const target = e.target;
    const side = target.closest(".side");
    const parent = target.closest(".box");

    console.log(pathInterface.state);

    if (pathInterface.state === 'listening') {
      const node = getBlockByElement(parent);
      console.log(node);
      if (node.type === 'ROAD') {
        pathInterface.node(node);
        return;
      }
    }

    if (e.shiftKey) {
      if (SELECTED_STRUCTURE === 'BLOCK') {
        parent.remove();
      } else if (SELECTED_STRUCTURE === 'ROAD') {
        getBlockByElement(parent).type = 'GROUND';
        parent.querySelector('.t').style['background-color'] = blockTopColor;
      }

      return;
    }

    if (SELECTED_STRUCTURE === 'BLOCK') {
     const styles = window.getComputedStyle(parent);

     const pos = {
       top: parseFloat(parent.style.top),
       left: parseFloat(parent.style.left),
       z: parseFloat(styles.getPropertyValue("--z-pos"))
     };

     if (side.classList.contains("r")) {
       pos.left += BLOCK_SIZE;
     } else if (side.classList.contains("l")) {
       pos.left -= BLOCK_SIZE;
     } else if (side.classList.contains("f")) {
       pos.top += BLOCK_SIZE;
     } else if (side.classList.contains("b")) {
       pos.top -= BLOCK_SIZE;
     } else if (side.classList.contains("t")) {
       pos.z += BLOCK_SIZE;
     } else {
       pos.z -= BLOCK_SIZE;
     }

     // target.classList.add("triggered");

     // setTimeout(() => {
     //   target.classList.remove("triggered");
     // }, 500);

     var box = newBox();
     box.classList.add('building');
     const x = pos.left;
     const y = pos.top;
     const z = pos.z;

     box.style.left = x + "px";
     box.style.top = y + "px";
     box.style.setProperty("--z-pos", z + "px");
     box.dataset.level = parseInt(parent.dataset.level) + (side.classList.contains("t") ? 1 : 0) || 0;
     
     if (side.classList.contains("t")) {
       parent.querySelectorAll('.l canvas, .r canvas, .b canvas').forEach(canvas => {
         canvas.dataset.texture = 'groundDeep';
       });
     }

     addBlock({
      el: box,
      type: 'GROUND',
     }, x, y, z);
     
     paintTextures(box);
     paintTextures(parent);

     document.querySelector(".plane").appendChild(box);
     getAnimatable(box); 

    } else if (SELECTED_STRUCTURE === 'ROAD') {
      // Place road
      getBlockByElement(parent).type = 'ROAD';
      // @TODO: somehow keep that to block re-rendering
      parent.querySelector('.t').style['background-color'] = roadTopColor;
    }
  });
})();

function drawPixelToData(canvas, data, x, y, r, g, b, a = 255) {
  var index = (x + y * canvas.width) * 4;

  data.data[index + 0] = r;
  data.data[index + 1] = g;
  data.data[index + 2] = b;
  data.data[index + 3] = a;
}

const contexts = new WeakMap();

function drawTexture(canvas, texture, offset = 0) {
  let ctx;
  if(contexts.has(canvas)) {
    ctx = contexts.get(canvas);
  } else {
    ctx = canvas.getContext("2d");
    ctx.scale(25, 25);

    contexts.set(canvas, ctx);
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < texture.length; ++y) {
    for (let x = 0; x < texture[(y + offset) % texture.length].length; ++x) {
      ctx.fillStyle = texture[(y + offset) % texture.length][x];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

const g1 = '#646F4B';
const g2 = '#839D9A';
const b1 = '#46351D';
const br2 = '#2B2011';
const s1 = '#BFD2BF';
const b2 = '#3E9FEF';
const b3 = '#0553AD';
const b4 = '#09B8C1';
const b5 = '#62B6CB';

const textures = {
  grass: [
    [g1, g2, g1, g2],
    [g2, g1, g2, g1],
    [g1, g2, g1, g2],
    [g2, g1, g2, g1],
  ],
  ground: [
    [g1, g2, g1, g2],
    [s1, b1, g1, b1],
    [b1, b1, s1, b1],
    [b1, s1, b1, b1],
  ],
  groundDeep: [
    [b1, b1, b1, s1],
    [s1, br2, b1, b1],
    [b1, b1, s1, b1],
    [b1, s1, br2, b1],
  ],
  water: [
    [b2, b3, b2, b3],
    [b2, b3, b3, b3],
    [b3, b2, b3, b4],
    [b3, b2, b3, b3],
  ]
};

function paintTextures(context = document) {
  context.querySelectorAll("canvas").forEach(canvas => {
    drawTexture(canvas, textures[canvas.dataset.texture]);
  });
}

const animatedCanvases = [];
const animatedTextures = ['water'];

function getAnimatable(context = document) {
  Array.prototype.push.apply(animatedCanvases, Array.from(context.querySelectorAll("canvas")).filter(canvas => {
    return animatedTextures.includes(canvas.dataset.texture);
  }));
}

let lastTime = performance.now();
function draw(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  const offset = 4 - ((time * 4 / 1000) | 0) % 4;
  
  animatedCanvases.forEach(canvas => {
    drawTexture(canvas, textures[canvas.dataset.texture], offset);
  });
  
  if(!window.paused) {
    requestAnimationFrame(draw);
  }
}

paintTextures();
getAnimatable();
requestAnimationFrame(draw);

const scene = [];
const sceneRefs = new WeakMap();

async function generateWorld(roadMap = []) {
  const blockMapping = [
    'BLOCK',
    'ROAD',
    'BUILDING'
  ];
  const worldPlane = document.querySelector(".plane");

  async function setStyleAsync(element, prop, value) {
    return new Promise((resolve, reject) => {
      element.style[prop] = value;

      element.addEventListener("transitionend", function(event) {
        if (event.srcElement === element && event.propertyName === prop) {
          resolve();
        }
      });
    });
  }

  async function wait(duration = 0) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  await wait(300);
  await setStyleAsync(worldPlane, 'width', `${WORLD_X}px`);
  await wait(300);
  await setStyleAsync(worldPlane, 'height', `${WORLD_Y}px`);
  await wait(300);

  for (let y = 0; y < WORLD_Y; y += BLOCK_SIZE) {
    for (let x = 0; x < WORLD_X; x += BLOCK_SIZE) {
      const [_x, _y] = [x / BLOCK_SIZE, y / BLOCK_SIZE];
      const width = WORLD_X / BLOCK_SIZE;
      const type = blockMapping[roadMap[_y * width + _x]] || 'BLOCK';
      const blockStack = [type];

      if (type === 'BUILDING') {
        blockStack.unshift('BLOCK');
      }

      for (var i = 0; i < blockStack.length; ++i) {
        const box = newBox(blockStack[i]);
        
        box.style.left = x + 'px';
        box.style.top = y + 'px';
        box.style.setProperty('--z-pos', `${20 + i * BLOCK_SIZE}px`);
        box.style.setProperty('--height', `${(Math.random() * 20 + 20 | 0) * -1}px`);
        box.dataset.level = i;
        
        box.querySelector('.t').innerText = `${_x}.${_y}`;

        addBlock({
          el: box,
          type
        }, _x, _y, i);

        worldPlane.appendChild(box);
      }
    }
  }
}

/**
 * Retrieve struct describing the roads on map
 * Returns object with keys as coordinates of road blocks.
 *
 * @TODO: Cache the roadmap and invalidate when road added / removed
 *
 * @return {object}
 */
function getRoadMap() {
  const roadBlocks = scene.map(xArr => {
    // Return ROAD blocks
    return xArr.filter(block => {
      return block.type === 'ROAD';
    });

  // Filter out empty arrays
  }).filter(xArr => xArr.length);

  const roadMap = {};
  // const roadMap = new Map();

  for (const row of roadBlocks) {
    for (const block of row) {
      roadMap[`${block.x},${block.y}`] = block;
      // roadMap.set(`${block.x},${block.y}`, block);
    }
  }

  return roadMap;

  // This was kinda with 3D in mind... skip that for now.
  // We'll keep roads 2D
  // return scene.filter(xArr => {
  //   return xArr.filter(yArr => {
  //     // console.log(yArr);
  //     return yArr.filter(block => {
  //       return block.type === 'ROAD';
  //     }).length;
  //   }).length;
  // });
}

const neighbours = [
  {x: 1, y: 0},
  {x: 0, y: 1},
  {x: -1, y: 0},
  {x: 0, y: -1},
];

/**
 * Return any first found neighbouring road block
 *
 * @param {object} block
 * @return {object}
 */
function getRoadNeighbour(block) {
  const roadMap = getRoadMap();

  for (const {x, y} of neighbours) {
    const neighbour = roadMap[`${block.x + x},${block.y + y}`];

    if (neighbour) {
      return neighbour;
    }
  }

  return undefined;
}

/**
 * Get all adjacent blocks
 *
 * @param {object} block
 *
 * @return {array}
 */
function getRoadNeighbours(block) {
  const roadMap = getRoadMap();

  return neighbours.map(({x, y}) => {
    return roadMap[`${block.x + x},${block.y + y}`];
  }).filter(a => a);
}


function renderJobDebug(job) {
  for (let i = 0; i < job.length; ++i) {
    let color = 'teal';

    if (i === 0 || i === job.length - 1) {
      color = 'red';
    }

    const node = job[i];
    let debugEl = node.el.querySelector('.node-debug');

    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.className = 'node-debug';
      node.el.querySelector('.t').appendChild(debugEl);
    }

    debugEl.innerText = i;
    debugEl.style.background = color;
  }
}

function clearAllJobDebug() {
  document.querySelectorAll('.node-debug').forEach(el => {
    el.innerText = '';
    el.style.background = 'none';
  });
}

/**
 * Find road path from A to B
 *
 * @param {Node} start Start node
 * @param {Node} end   Target node
 *
 * @return {Array|NodePath}
 */
function findPath(start, end) {
  // console.log('Looking from ${a.x}, ${a.y} to ${b.x}, ${b.y}');

  let checks = 0;

  // All ROAD nodes
  const roadMap = getRoadMap();
  const a = roadMap[start];
  const b = roadMap[end];

  // console.log('Got Road map of ${roadMap.length} nodes');

  // Check if valid nodes
  if (!(a && b)) {
    console.error('Error: invalid nodes');
    return;
  }

  // Closed set - Nodes already visited
  let visited = [];
  // Open set - Start with the start node
  let openSet = [a];

  /**
   * Simple euclidean distance between nodes
   * assuming all grid locations are 1 unit away
   * not including special conditions
   * @TODO: rename distanceCost, don't sqrt distance, treat it purely as H cost
   */
  function distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  function findCheapestNodes(set) {
    let cost = Infinity;
    const nodes = [];

    for (let i = 0; i < set.length; ++i) {
      const node = set[i];

      if (node.distance === cost) {
        nodes.push(node);
      } else if (node.distance < cost) {
        nodes.length = 0;
        cost = node.distance;
        nodes.push(node);
      }
    }

    return nodes;
  }

  function searchFromNodeAStar(node) {
    if (checks++ > 100) {
      console.error('TOO DEEP MAN!');
      return;
    }

    console.group(node, 'SEARCHING NODE');
    visited.push(node);
    openSet.splice(openSet.indexOf(node), 1);

    // This is the target node
    if (node === b) {
      console.log(`%cNODE IS TARGET!!! RETURN!`, 'background: salmon;');
      return node;
    }

    let path = [node];

    const neighbours = getRoadNeighbours(node)
      .filter(n => !visited.includes(n))
      .filter(n => !openSet.includes(n));

    // @TODO: .map()?
    for ( let [key, node] of Object.entries(neighbours)) {
      node.distance = distance(node, b);
    }

    openSet = openSet.concat(neighbours);

    console.log(`GOT ${neighbours.length} NEIGHBOURS`);

    // find cheapest nodes in open set
    let cheapest = findCheapestNodes(openSet);
    // pick one at random if more than one found
    cheapest = cheapest.length === 1 ? cheapest[0] : cheapest[Math.random() * cheapest.length | 0];

    // Could not have found cheapest node
    if (cheapest) { 
      const subPath = searchFromNodeAStar(cheapest);
      console.log(`SUBPATH RETURNED FROM ${cheapest.x},${cheapest.y}, ${subPath}`);

      if (subPath.concat) {
        path = path.concat(subPath);
      } else {
        path.push(subPath);
      }
      // if (subPath.includes && subPath.includes(node)) {
      //   path = path.concat(subPath);
      // } else {
      // }
    }

    console.groupEnd(node);
    return path;
  }

  function searchFromNodeNaive(node) {
    if (checks++ > 100) {
      console.log('TOO DEEP MAN!');
      return;
    }

    visited.push(node);
    console.group(node, 'SEARCHING NODE');

    // If is target
    if (node.x === b.x && node.y === b.y) {
      console.log(`%cNODE IS TARGET!!! RETURN!`, 'background: salmon;');
      return node;
    }

    let path = [node];

    const neighbours = getRoadNeighbours(node).filter(n => !visited.includes(n));
    console.log(`GOT ${neighbours.length} NEIGHBOURS`);

    for (let neighbourNode of neighbours) {
      const subPath = searchFromNodeNaive(neighbourNode);
      console.log(`SUBPATH RETURNED FROM ${neighbourNode.x},${neighbourNode.y}, ${subPath}`);

      if (subPath.includes) {
        path = path.concat(subPath);
      } else {
        path.push(subPath);
      }
    }

    console.groupEnd(node);
    return path;
  }

  // const final = searchFromNodeNaive(a);
  const final = searchFromNodeAStar(a);
  console.log('PATH: ', final);
  return final;
}

window.findPath = findPath;
window.getRoadMap = getRoadMap;
window.getRoadNeighbour = getRoadNeighbour;

/**
 * Finds a path between two nodes
 * dispatches a job and generates an agent for it
 * 
 * Also renders job debug.
 * 
 * @param from Node
 * @param to Node
 */
window.runPath = function(from, to) {
  const job = findPath(from, to);

  clearAllJobDebug();
  // TODO: does this even register as a job?
  // Can an agent cancel it when it's finished
  // So then we can clear the debug?
  renderJobDebug(job);

  // @TODO: Should just be nodes
  generateAgent(job.map(n => `${n.x},${n.y}`));
}

function getBlockByElement(el) {
  return sceneRefs.get(el);
}

const roadMap = [
   ,  ,  ,  ,  ,  ,  ,  ,  ,  ,
   ,  ,  ,  ,  ,  ,  ,  ,  ,  ,
   , 2, 1, 1, 1, 1, 1, 1, 1,  ,
   , 2, 1, 2, 2, 1, 2, 2, 1,  ,
   , 2, 1, 1, 1, 1, 1, 2, 1,  ,
   ,  ,  ,  , 1, 2, 1, 1, 1,  ,
   ,  ,  ,  ,  ,  ,  , 1,  ,  ,
   ,  ,  ,  ,  ,  ,  , 1,  ,  ,
   ,  ,  ,  ,  ,  ,  ,  ,  ,  ,
   ,  ,  ,  ,  ,  ,  ,  ,  ,  ,
];

generateWorld(roadMap);

// block - position, textures for each side
function addBlock(block, x, y, z) {
  block = Object.assign({}, block, {
    x, y, z
  });

  // Reference to block from DOMElement
  sceneRefs.set(block.el, block);

  // Again, had 3D in mind... not for now
  // scene[y] = scene[y] || [];
  // scene[y][x] = scene[y][x] || [];
  // scene[y][x][z] = block;

  scene[y] = scene[y] || [];
  scene[y][x] = block
}

function getBlock(x, y, z) {
  console.log('Retrieving block @', arguments);

  if(scene[y] && scene[y][x]) {
    return scene[y][x];
  }

  // Again, had 3D in mind, not for now...
  // if(scene[y] && scene[y][x] && scene[y][x][z]) {
  //   return scene[y][x][z];
  // }
  
  return undefined;
}

function getNeighbours(x, y, z) {
  return [
    getBlock(x+1, y, z),
    getBlock(x-1, y, z),
    getBlock(x, y+1, z),
    getBlock(x, y-1, z),
    getBlock(x, y, z+1),
    getBlock(x, y, z-1),
  ].filter(b => b !== undefined);
}

const jobs = [];
const agentPathTargetTracker = new WeakMap();
const agentPathTrackedLength = 2;

/**
 * Generate an agent and add it to the world
 * Optionally also give it a job
 *
 * @param {Array} [jobPath]
 */
function generateAgent(jobPath) {
  const roadMap = getRoadMap();
  let block;

  if (jobPath) {
    block = roadMap[jobPath.shift()];
  } else {
    const keys = Object.keys(roadMap);
    const key = keys[Math.random() * keys.length | 0];
    block = roadMap[key];
  }

  if (!block) {
    return;
  }

  const agent = new Agent(block.x * BLOCK_SIZE, block.y * BLOCK_SIZE, document.querySelector('.plane'));
  
  // if (block) {
    agentPathTargetTracker.set(agent, [block]);
    agent.jobPath = jobPath;
    agent.goal = {
      x: block.x * BLOCK_SIZE | 0,
      y: block.y * BLOCK_SIZE | 0,
    };
  // } else {
  //   agent.goal = {
  //     x: Math.random() * WORLD_X | 0,
  //     y: Math.random() * WORLD_Y | 0,
  //   }
  // }

  GAME.agents.add(agent);
  agent.init();

  return agent;
}
window.agentPathTargetTracker = agentPathTargetTracker;

//////////////////////////////////////////////////////////
//\\\\\\\\\\\\\\\\\\\\\\\\        \\\\\\\\\\\\\\\\\\\\\\\\
//////////////////////////  GAME  ////////////////////////
//\\\\\\\\\\\\\\\\\\\\\\\\        \\\\\\\\\\\\\\\\\\\\\\\\
//////////////////////////////////////////////////////////

function updateGameWorld() {
  for (const agent of GAME.agents) {
    agent.update();

    if (agent.isFinished) {
      agent.isFinished = false;

      if (agentPathTargetTracker.has(agent)) {
        const path = agentPathTargetTracker.get(agent);
        const currentTarget = path[0];
        let newTarget;

        if (agent.jobPath === undefined) {
          console.log("NO PATH", agent.jobPath);
          const neighbours = getRoadNeighbours(currentTarget).filter(n => !path.includes(n));

          if (neighbours.length > 0) {
            newTarget = neighbours[Math.random() * neighbours.length | 0];
          }
        } else if (agent.jobPath) {
          newTarget = getRoadMap()[agent.jobPath.shift()];
          console.log("HAS PATH", agent.jobPath.length, newTarget);
        }

        if (newTarget) {
          path.unshift(newTarget);
          path.length = agentPathTrackedLength;

          agent.goal = {
            x: newTarget.x * BLOCK_SIZE | 0,
            y: newTarget.y * BLOCK_SIZE | 0,
          };

          continue;   
        } else {
          agent.destroy();
          GAME.agents.delete(agent);
        }
      }

      const roadMap = getRoadMap();
      const keys = Object.keys(roadMap);
      const key = keys[Math.random() * keys.length | 0];
      const block = roadMap[key];

      if (block) {
        agentPathTargetTracker.set(agent, block);
        agent.goal = {
          x: block.x * BLOCK_SIZE | 0,
          y: block.y * BLOCK_SIZE | 0,
        };
      } else {
        agent.goal = {
          x: Math.random() * WORLD_X | 0,
          y: Math.random() * WORLD_Y | 0,
        }
      }
    }
  }

  if (GAME.running) {
    requestAnimationFrame(updateGameWorld);
  }
}

requestAnimationFrame(updateGameWorld);