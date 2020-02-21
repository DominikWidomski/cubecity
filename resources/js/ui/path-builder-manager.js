class PathBuilderManager {
  constructor({ maxLength }) {
    this.nodes = [];
    this.state = 'idle';
    this.maxLength = maxLength;
  }

  // TODO: rename -> startPath
  start() {
    this.state = 'listening';
    console.log(`Path: ${this.state}`);
  }

  // TODO: rename -> addNode
  node(node) {
    if (this.state !== 'listening') {
      console.log("Path: not listening.");
      return;
    }

    this.nodes.push(node);
    console.log(`Path: node ${node}, length: ${this.nodes.length}`);

    if(this.nodes.length === this.maxLength) { 
      console.log(`Path: reached maxLength (finished)`);
      this.finish();
    }
  }

  // TODO: rename -> cancelPath
  cancel() {
    this.nodes = [];
    this.state = 'idle';
    console.log(`Path: ${this.state} (cancelled)`);
  }

  // TODO: rename -> endPath
  finish() {
    this.state = 'idle';
    console.log(`Path: ${this.state} (finished)`);

    this.emit('finish', this.nodes);
    this.nodes = [];
  }


  // TODO: share!
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

export default PathBuilderManager;