/**
 * Boids Flocking Algorithm
 *
 * Based on Craig Reynolds' 1986 paper on flocking behavior.
 * Three simple rules create complex emergent behavior:
 * 1. Separation - avoid crowding neighbors
 * 2. Alignment - steer towards average heading of neighbors
 * 3. Cohesion - steer towards average position of neighbors
 *
 * We add audio reactivity to make them dance to music!
 */

export class Boid {
  constructor(x, y, canvasWidth, canvasHeight) {
    this.position = { x, y };
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    };
    this.acceleration = { x: 0, y: 0 };
    this.maxSpeed = 4;
    this.maxForce = 0.05;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Visual properties
    this.size = 3 + Math.random() * 3;
    this.hue = Math.random() * 60 + 180; // Start in blue range
  }

  /**
   * Main update loop - apply flocking rules
   */
  update(boids, audioData) {
    // Apply flocking behavior
    this.flock(boids);

    // Audio reactivity - speed increases with treble
    const speedMultiplier = 0.5 + (audioData.treble / 100) * 1.5;
    this.maxSpeed = 3 * speedMultiplier;

    // Bass makes them flee from center
    if (audioData.bass > 50) {
      this.fleeFromCenter(audioData.bass / 100);
    }

    // Update velocity
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;

    // Limit speed
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y
    );
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
    }

    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Wrap around edges
    this.edges();

    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;

    // Update color based on frequency
    this.hue = 180 + (audioData.treble / 100) * 60; // Blue to purple
  }

  /**
   * Apply flocking forces
   */
  flock(boids) {
    const separation = this.separate(boids);
    const alignment = this.align(boids);
    const cohesion = this.cohere(boids);

    // Weight the forces
    separation.x *= 1.5;
    separation.y *= 1.5;
    alignment.x *= 1.0;
    alignment.y *= 1.0;
    cohesion.x *= 1.0;
    cohesion.y *= 1.0;

    // Apply forces
    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  /**
   * Separation - steer to avoid crowding
   */
  separate(boids) {
    const desiredSeparation = 25;
    const steer = { x: 0, y: 0 };
    let count = 0;

    for (const other of boids) {
      const d = this.distance(other);
      if (d > 0 && d < desiredSeparation) {
        // Calculate vector pointing away from neighbor
        const diff = {
          x: this.position.x - other.position.x,
          y: this.position.y - other.position.y
        };
        // Weight by distance
        const len = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
        diff.x = (diff.x / len) / d;
        diff.y = (diff.y / len) / d;

        steer.x += diff.x;
        steer.y += diff.y;
        count++;
      }
    }

    if (count > 0) {
      steer.x /= count;
      steer.y /= count;
    }

    return steer;
  }

  /**
   * Alignment - steer towards average heading
   */
  align(boids) {
    const neighborDist = 50;
    const sum = { x: 0, y: 0 };
    let count = 0;

    for (const other of boids) {
      const d = this.distance(other);
      if (d > 0 && d < neighborDist) {
        sum.x += other.velocity.x;
        sum.y += other.velocity.y;
        count++;
      }
    }

    if (count > 0) {
      sum.x /= count;
      sum.y /= count;

      // Normalize and scale
      const len = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
      if (len > 0) {
        sum.x = (sum.x / len) * this.maxSpeed;
        sum.y = (sum.y / len) * this.maxSpeed;

        // Steering = desired - velocity
        const steer = {
          x: sum.x - this.velocity.x,
          y: sum.y - this.velocity.y
        };

        // Limit to max force
        return this.limit(steer, this.maxForce);
      }
    }

    return { x: 0, y: 0 };
  }

  /**
   * Cohesion - steer towards average position
   */
  cohere(boids) {
    const neighborDist = 50;
    const sum = { x: 0, y: 0 };
    let count = 0;

    for (const other of boids) {
      const d = this.distance(other);
      if (d > 0 && d < neighborDist) {
        sum.x += other.position.x;
        sum.y += other.position.y;
        count++;
      }
    }

    if (count > 0) {
      sum.x /= count;
      sum.y /= count;
      return this.seek(sum);
    }

    return { x: 0, y: 0 };
  }

  /**
   * Seek towards a target
   */
  seek(target) {
    const desired = {
      x: target.x - this.position.x,
      y: target.y - this.position.y
    };

    const len = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
    if (len > 0) {
      desired.x = (desired.x / len) * this.maxSpeed;
      desired.y = (desired.y / len) * this.maxSpeed;

      const steer = {
        x: desired.x - this.velocity.x,
        y: desired.y - this.velocity.y
      };

      return this.limit(steer, this.maxForce);
    }

    return { x: 0, y: 0 };
  }

  /**
   * Flee from center when bass hits
   */
  fleeFromCenter(intensity) {
    const center = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight / 2
    };

    const away = {
      x: this.position.x - center.x,
      y: this.position.y - center.y
    };

    const len = Math.sqrt(away.x * away.x + away.y * away.y);
    if (len > 0) {
      away.x = (away.x / len) * intensity * 0.5;
      away.y = (away.y / len) * intensity * 0.5;
      this.applyForce(away);
    }
  }

  /**
   * Apply a force to acceleration
   */
  applyForce(force) {
    this.acceleration.x += force.x;
    this.acceleration.y += force.y;
  }

  /**
   * Limit a vector to a maximum magnitude
   */
  limit(vec, max) {
    const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (len > max) {
      return {
        x: (vec.x / len) * max,
        y: (vec.y / len) * max
      };
    }
    return vec;
  }

  /**
   * Calculate distance to another boid
   */
  distance(other) {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Wrap around edges
   */
  edges() {
    if (this.position.x < 0) this.position.x = this.canvasWidth;
    if (this.position.y < 0) this.position.y = this.canvasHeight;
    if (this.position.x > this.canvasWidth) this.position.x = 0;
    if (this.position.y > this.canvasHeight) this.position.y = 0;
  }

  /**
   * Render the boid as a soft glowing orb (2026 aesthetic)
   */
  render(ctx, alpha = 1) {
    ctx.save();

    // Softer, more ethereal color palette
    const saturation = 70; // Less saturated than before
    const lightness = 65;  // Brighter, more pastel

    // Main glow orb
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha * 0.8})`;

    // Outer glow (larger, very soft)
    const outerGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size * 3
    );
    outerGradient.addColorStop(0, `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`);
    outerGradient.addColorStop(0.5, `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha * 0.1})`);
    outerGradient.addColorStop(1, `hsla(${this.hue}, ${saturation}%, ${lightness}%, 0)`);

    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core orb (solid, bright)
    const coreGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size
    );
    coreGradient.addColorStop(0, `hsla(${this.hue}, ${saturation}%, 95%, ${alpha})`); // Bright center
    coreGradient.addColorStop(0.7, `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha})`);
    coreGradient.addColorStop(1, `hsla(${this.hue}, ${saturation}%, ${lightness - 10}%, ${alpha * 0.5})`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/**
 * Create a flock of boids
 */
export function createFlock(count, canvasWidth, canvasHeight) {
  const boids = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;
    boids.push(new Boid(x, y, canvasWidth, canvasHeight));
  }
  return boids;
}
