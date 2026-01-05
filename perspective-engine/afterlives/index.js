/**
 * Afterlife Modules Registry
 *
 * This file serves as the central registry for all afterlife perspective modules.
 * To add a new perspective, simply:
 * 1. Create your module file (e.g., my-perspective.js)
 * 2. Add an export line here
 * 3. That's it! Everything else is automatic.
 *
 * The main app will auto-discover all modules exported here.
 */

export { default as buddhism } from './buddhism.js';
export { default as christianity } from './christianity.js';
export { default as islam } from './islam.js';
export { default as hinduism } from './hinduism.js';
export { default as judaism } from './judaism.js';
export { default as philosophical } from './philosophical.js';
