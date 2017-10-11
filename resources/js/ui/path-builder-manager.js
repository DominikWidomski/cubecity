class PathBuilderManager {
  constructor() {
    this.nodes = [];
    this.state = 'idle';
  }

  start() {
    this.state = 'listening';
    console.log(`Path: ${this.state}`);
  }

  node(node) {
    if (this.state !== 'listening') {
      return;
    }

    this.nodes.push(node);
    console.log(`Path: node ${node}, length: ${this.nodes.length}`);

    if(this.nodes.length === 2) { 
      this.finish();
    }
  }

  cancel() {
    this.nodes = [];
    this.state = 'idle';
    console.log(`Path: ${this.state} (cancelled)`);
  }

  finish() {
    this.state = 'idle';
    console.log(`Path: ${this.state} (finished)`);

    this.emit('finish', this.nodes);
    this.nodes = [];
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

export default PathBuilderManager;