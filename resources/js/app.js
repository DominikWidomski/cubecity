const BLOCK_SIZE = 50;
const STRUCTURES = ['BLOCK', 'ROAD'];
let SELECTED_STRUCTURE = 'BLOCK';

function newBox() {
  const node = document.createElement('div');
  node.innerHTML = getBoxHTML();

  return node.firstChild;
}

function getBoxHTML() {
  return `<div class="box">
    <div class="side"></div>
    <div class="side r"></div>
    <div class="side l"></div>
    <div class="side f"></div>
    <div class="side b"></div>
    <div class="side t"></div>
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
    document.querySelector(".plane").style.webkitAnimationName = anim;
  }

  var b = document.body;
  var lastY = null;
  var lastX = null;
  var dragging = false;
  b.addEventListener("mousedown", function(e) {
    dragging = true;
    lastY = e.y;
    lastX = e.x;
  });
  b.addEventListener("mousemove", function(e) {
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
  b.addEventListener("mouseup", function(e) {
    dragging = false;
  });

  function rotatePlane(rotationZ = 0, rotationX = 0) {
    if (rotationZ === 0 && rotationX === 0) {
      return;
    }

    const plane = document.querySelector(".plane");
    const styles = window.getComputedStyle(plane);
    const planeRotZ = parseFloat(styles.getPropertyValue("--plane-rot-z"));
    const planeRotX = parseFloat(styles.getPropertyValue("--plane-rot-x"));
    const unit = "deg";

    plane.style.setProperty("--plane-rot-z", planeRotZ + rotationZ + unit);
    plane.style.setProperty("--plane-rot-x", planeRotX + rotationX + unit);
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

    const target = e.target;
    const side = target.closest(".side");
    const parent = target.closest(".box");

    if (e.shiftKey) {
      parent.parentNode.removeChild(parent);
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

     box.style.top = pos.top + "px";
     box.style.left = pos.left + "px";
     box.style.setProperty("--z-pos", pos.z + "px");
     box.dataset.level = parseInt(parent.dataset.level) + (side.classList.contains("t") ? 1 : 0) || 0;
     
     if (side.classList.contains("t")) {
       parent.querySelectorAll('.l canvas, .r canvas, .b canvas').forEach(canvas => {
         canvas.dataset.texture = 'groundDeep';
       });
     }
     
     paintTextures(box);
     paintTextures(parent);

     document.querySelector(".plane").appendChild(box);
     getAnimatable(box); 

    } else if (SELECTED_STRUCTURE === 'ROAD') {
      const block = getBlockByElement(parent);
      block.type = 'ROAD';
      const top = parent.querySelector('.t');
      top.style['background-color'] = '#6f666f';
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

function generateWorld() {
  for (let x = 0; x < 500; x += BLOCK_SIZE) {
    for (let y = 0; y < 500; y += BLOCK_SIZE) {
      const box = newBox();
      
      box.style.top = x + "px";
      box.style.left = y + "px";
      box.style.setProperty("--z-pos", 20 + "px");
      box.dataset.level = 0;
      
      // paintTextures(box);

      addBlock({
        el: box,
        type: 'GROUND',
      }, x / BLOCK_SIZE, y / BLOCK_SIZE, 0);

      document.querySelector(".plane").appendChild(box);
    }
  }
}

function getAgentElement(x, y) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="agent" style="left: ${x}px; top: ${y}px;"></div>`;
  return wrapper.firstChild;
}

class Agent {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.element = getAgentElement(this.x, this.y);

    this.isOnMap = false;
  }

  init() {
    if(!this.isOnMap) {
      document.querySelector('.plane').appendChild(this.element);

      this.isOnMap = true;
    }
  }

  update() {
    this.element.style.left = this.x;
    this.element.style.top = this.y;
  }
}

function generateAgent(x, y) {
  const agent = new Agent(x, y);
  agent.init();
}

/**
 * Retrieve structure describing the roads on map
 *
 * @return {array}
 */
function getRoadsMap() {
  return scene.map(xArr => {

  });

  return scene.filter(xArr => {
    return xArr.filter(yArr => {
      return yArr.filter(block => {
        console.log(block);
        return block.type === 'ROAD';
      });
    });
    // console.log(xArr);
    // return xArr[0][0].y;
  });
}

function getBlockByElement(el) {
  return sceneRefs.get(el);
}

generateWorld();

// block - position, textures for each side
function addBlock(block, x, y, z) {
  block = Object.assign({}, block, {
    x, y, z
  });

  // Reference to block from DOMElement
  sceneRefs.set(block.el, block);

  scene[y] = scene[y] || [];
  scene[y][x] = scene[y][x] || [];
  scene[y][x][z] = block;
}

function getBlock(x, y, z) {
  console.log(arguments);
  if(scene[y] && scene[y][x] && scene[y][x][z]) {
    return scene[y][x][z];
  }
  
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