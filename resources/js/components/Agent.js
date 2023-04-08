function generateAgentElement(x, y) {
  const wrapper = document.createElement('div');
  // @TODO: Change to transform
  wrapper.innerHTML = `<div class="agent" style="left: ${x}px; top: ${y}px;"></div>`;
  return wrapper.firstChild;
}

function generateAgentGoalElement(x, y) {
  const wrapper = document.createElement('div');
  // @TODO: Change to transform
  wrapper.innerHTML = `<div class="agent" style="background: yellow; left: ${x}px; top: ${y}px;"></div>`;
  return wrapper.firstChild;
}

class Agent {
  constructor(x, y, contextPlane) {
    this.x = x;
    this.y = y;

    this._goal = {
      x: 0,
      y: 0
    };

    this.contextPlane = contextPlane;
    this.element = generateAgentElement(this.x, this.y);
    this.goalElement = generateAgentGoalElement(this._goal.x, this._goal.y);

    this.isAttached = false;
    this.isFinished = false;
  }

  init() {
    if(!this.isAttached) {
      this.contextPlane.appendChild(this.element);
      this.contextPlane.appendChild(this.goalElement);

      this.isAttached = true;
    }
  }

  set goal(value) {
    this._goal = value;
    // TODO: How would be manage that thing in a reasonable way?
    this.goalElement.style.left = value.x + 'px';
    this.goalElement.style.top = value.y + 'px';
  }

  get goal() {
    return this._goal;
  }

  update() {
    // TODO: some util
    const distanceToGoal = Math.sqrt(Math.pow(this._goal.x - this.x, 2) + Math.pow(this._goal.y - this.y, 2));

    if (distanceToGoal < 1) {
      this.isFinished = true;
      return;
    }

    const vel = {
      x: this._goal.x - this.x,
      y: this._goal.y - this.y,
    };

    const velMag = Math.sqrt(Math.pow(vel.x, 2) + Math.pow(vel.y, 2));
    const unitVector = {
      x: vel.x / velMag,
      y: vel.y / velMag,
    }

    // acceleration - maybe not for now

    // velocity
    this.x += unitVector.x || 0;
    this.y += unitVector.y || 0;

    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
  }

  destroy() {
    this.element.remove();
    this.goalElement.remove();
    this.emit('destroy');
  }

  // Event emitting

  on(eventType, handler) {
    this.eventHandlers = this.eventHandlers || [];
    this.eventHandlers[eventType] = this.eventHandlers[eventType] || [];

    this.eventHandlers[eventType].push(handler);
  }

  emit(eventType, ...args) {
    for (let handler of this.eventHandlers[eventType]) {
      handler.call(this, ...args);
    }
  }
}

export default Agent;