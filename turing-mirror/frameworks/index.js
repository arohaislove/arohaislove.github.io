/**
 * Consciousness Testing Frameworks Registry
 *
 * This file serves as the central registry for all consciousness testing frameworks.
 * To add a new framework, simply:
 * 1. Create your framework file (e.g., my-framework.js)
 * 2. Add an export line here
 * 3. That's it! Everything else is automatic.
 *
 * The main app will auto-discover all frameworks exported here.
 */

export { default as iit } from './iit.js';
export { default as globalWorkspace } from './global-workspace.js';
export { default as behavioral } from './behavioral.js';
