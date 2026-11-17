import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Gamepad2, RotateCcw, Volume2, VolumeX, Shuffle } from 'lucide-react';

// Character Pixel Matrix (Level Devil silhouette from reference image 2)
// 8 columns wide x 10 rows tall: 1 = pixel solid, 0 = transparent

// 1. Idle stance (standing grounded)
const PIXEL_CHAR_IDLE = [
  [0, 0, 1, 1, 1, 0, 0, 0], // head top
  [0, 0, 1, 1, 1, 0, 0, 0], // head mid
  [0, 0, 1, 1, 1, 0, 0, 0], // head base
  [0, 1, 1, 1, 1, 1, 0, 0], // torso top
  [0, 1, 1, 1, 1, 1, 0, 0], // torso mid
  [0, 1, 1, 1, 1, 1, 0, 0], // torso base
  [0, 0, 1, 1, 1, 0, 0, 0], // waist
  [0, 0, 1, 1, 1, 0, 0, 0], // hips
  [0, 1, 1, 0, 1, 1, 0, 0], // legs
  [0, 1, 1, 0, 1, 1, 0, 0], // feet
];

// 2. Running Cycle: Stride Forward
const PIXEL_CHAR_RUN_1 = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 0, 0, 1, 1, 0, 0],
  [1, 1, 0, 0, 0, 1, 1, 0],
];

// 3. Running Cycle: Mid crossover pass
const PIXEL_CHAR_RUN_2 = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
];

// 4. Running Cycle: Stride Backward
const PIXEL_CHAR_RUN_3 = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 0, 1, 1],
];

// 5. Jump Ascending (Legs tucked up)
const PIXEL_CHAR_JUMP = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 1, 1, 0, 0],
  [1, 1, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// 6. Jump Fall (Legs extended down)
const PIXEL_CHAR_FALL = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 0, 0],
];

// ============================================================================
// PLAYER KINEMATIC CONSTANTS & EXACT TRAJECTORY SOLVER
// ============================================================================
const PHYSICS = {
  canvasW: 900,
  canvasH: 440,
  playerW: 24,
  playerH: 30,
  gravity: 0.48,
  jumpImpulse: -12.4,
  tapJumpCut: -6.2,
  accel: 1.35,
  friction: 0.83,
  maxSpeed: 5.4,
};

// Exact vertical apex: H = v0^2 / (2g) ≈ 160.16px
const MAX_JUMP_APEX = (PHYSICS.jumpImpulse * PHYSICS.jumpImpulse) / (2 * PHYSICS.gravity);

/**
 * Solves the exact parabolic projectile equation y(t) = v0*t + 0.5*g*t^2
 * and horizontal acceleration envelope to dynamically place the next platform.
 */
function solveKinematicPlatform({
  fromPlat,
  dir,
  targetY,
  rand,
  allowMover = true,
  maxGapCap = 105,
  minWidth = 64,
  maxWidth = 128,
}) {
  const isMover = allowMover && rand() < 0.36;
  const moverAxis = rand() < 0.48 ? 'y' : rand() < 0.82 ? 'x' : 'xy';
  const nextRangeX = isMover && (moverAxis === 'x' || moverAxis === 'xy') ? Math.round(14 + rand() * 14) : 0;
  const nextRangeY = isMover && (moverAxis === 'y' || moverAxis === 'xy') ? Math.round(12 + rand() * 14) : 0;

  // Worst-case takeoff Y (when source platform is at lowest point of its oscillation)
  const worstStartY = fromPlat.y + (fromPlat.rangeY || 0);

  // Max safe upward climb uses 44% of true jump apex (~70px), minus target vertical oscillation
  const maxSafeClimb = Math.floor(MAX_JUMP_APEX * 0.44) - nextRangeY;
  const maxSafeDrop = 135;

  const unclampedDy = targetY - worstStartY;
  const clampedDy = Math.max(-maxSafeClimb, Math.min(maxSafeDrop, unclampedDy));
  const nextY = Math.round(Math.max(118, Math.min(388, worstStartY + clampedDy)));

  // Worst-case vertical delta the player must clear at landing
  const effectiveDy = (nextY - nextRangeY) - worstStartY;

  // Solve quadratic 0.5*g*t^2 + v0*t - effectiveDy = 0 for descending root t_flight
  const discriminant = Math.max(
    12,
    PHYSICS.jumpImpulse * PHYSICS.jumpImpulse + 2 * PHYSICS.gravity * effectiveDy
  );
  const flightFrames = (-PHYSICS.jumpImpulse + Math.sqrt(discriminant)) / PHYSICS.gravity;

  // Effective horizontal velocity based on available run-up runway on source platform
  const runwayPx = Math.max(10, fromPlat.w - PHYSICS.playerW);
  const takeoffSpeedRatio = 0.60 + 0.40 * Math.min(1, runwayPx / 75);
  const avgHorizSpeed = PHYSICS.maxSpeed * takeoffSpeedRatio;

  // Theoretical maximum horizontal reach minus moving platform oscillations
  const theoreticalMaxReach =
    avgHorizSpeed * flightFrames - (fromPlat.rangeX || 0) - nextRangeX - 12;

  // Sample dynamic gap between 32% and 62% of theoretical max reach
  const reachFraction = 0.32 + rand() * 0.30;
  const minGap = 28 + Math.round(rand() * 14);
  const safeMaxGap = Math.max(minGap + 8, Math.min(maxGapCap, theoreticalMaxReach * 0.66));
  const gap = Math.round(Math.max(minGap, Math.min(safeMaxGap, theoreticalMaxReach * reachFraction)));

  const nextW = Math.round(minWidth + rand() * (maxWidth - minWidth));
  const nextX =
    dir === 1
      ? Math.round(fromPlat.x + fromPlat.w + gap)
      : Math.round(fromPlat.x - gap - nextW);

  // Compute true jump apex coordinate between the two platforms for coin/ceiling placement
  const midX =
    dir === 1
      ? Math.round(fromPlat.x + fromPlat.w + gap * 0.5)
      : Math.round(fromPlat.x - gap * 0.5);
  const arcPeakY = Math.round(Math.min(fromPlat.y, nextY) - (32 + rand() * 24));

  return {
    x: nextX,
    y: nextY,
    w: nextW,
    h: isMover ? 16 : rand() < 0.42 ? 440 - nextY : Math.round(18 + rand() * 10),
    isMover,
    axis: moverAxis,
    range: moverAxis === 'x' ? nextRangeX : nextRangeY,
    rangeX: nextRangeX,
    rangeY: nextRangeY,
    speed: Number((1.05 + rand() * 0.55).toFixed(2)),
    offset: Number((rand() * Math.PI * 2).toFixed(2)),
    gap,
    midX,
    arcPeakY,
  };
}

// ============================================================================
// PROCEDURAL LEVEL SYNTHESIZER (ZERO FIXED PRESETS)
// ============================================================================
function generateRandomLevel(seedNum, forcedTopologyIdx) {
  const seed = seedNum !== undefined ? seedNum : Math.floor(Math.random() * 899999) + 100000;

  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 8) / 16777216;
  };
  const randInt = (min, max) => Math.floor(min + rand() * (max - min + 1));

  const platforms = [];
  const movingPlatforms = [];
  const spikes = [];
  const coins = [];

  const registerNode = (node) => {
    if (node.isMover) {
      movingPlatforms.push({
        x: node.x,
        y: node.y,
        w: node.w,
        h: 16,
        axis: node.axis,
        range: Math.max(node.rangeX, node.rangeY),
        rangeX: node.rangeX,
        rangeY: node.rangeY,
        speed: node.speed,
        offset: node.offset,
      });
    } else {
      platforms.push({
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        isCeiling: Boolean(node.isCeiling),
      });
    }
  };

  // 6 distinct topological vector architectures (0..5), guaranteed non-repeating on cycle
  const topologyIdx =
    forcedTopologyIdx !== undefined ? forcedTopologyIdx % 6 : Math.floor(rand() * 6);
  const chamberNum = (seed % 900) + 100;
  let flowName = '';
  let hint = '';
  let spawn = { x: 45, y: 310 };
  let door = { x: 800, y: 280, w: 48, h: 78 };

  if (topologyIdx === 0 || topologyIdx === 1) {
    // ------------------------------------------------------------------------
    // TOPOLOGY 0 & 1: TWO-STORY SWITCHBACK (Eastward or Westward S-Curve Ascent)
    // ------------------------------------------------------------------------
    const startLeft = topologyIdx === 0;
    const dir1 = startLeft ? 1 : -1;
    const dir2 = -dir1;
    flowName = startLeft ? 'SWITCHBACK ASCENT' : 'REVERSE SWITCHBACK';
    hint = 'Traverse the lower deck, scale the shaft, and double back across the upper canopy';

    const startW = randInt(85, 115);
    const startY = randInt(355, 388);
    const startX = startLeft ? randInt(20, 40) : randInt(860 - startW, 880 - startW);

    let curr = { x: startX, y: startY, w: startW, h: 440 - startY, rangeX: 0, rangeY: 0 };
    platforms.push({ x: curr.x, y: curr.y, w: curr.w, h: curr.h });
    spawn = { x: curr.x + Math.round(curr.w * 0.35), y: curr.y - 36 };

    // 1A. Synthesize Lower Deck Chain
    const turnBoundary = startLeft ? randInt(690, 745) : randInt(155, 210);
    let stepIdx = 0;
    while (
      (dir1 === 1 && curr.x + curr.w < turnBoundary - 80) ||
      (dir1 === -1 && curr.x > turnBoundary + 80)
    ) {
      const waveY = 350 + Math.sin(stepIdx * 1.3 + rand() * 2) * 32;
      const next = solveKinematicPlatform({
        fromPlat: curr,
        dir: dir1,
        targetY: waveY,
        rand,
        allowMover: true,
        maxGapCap: 88,
        minWidth: 68,
        maxWidth: 115,
      });

      // Clamp so it doesn't overshoot the shaft wall
      if (dir1 === 1 && next.x + next.w > 865) break;
      if (dir1 === -1 && next.x < 35) break;

      next.h = Math.min(next.h, 24);
      registerNode(next);

      if (rand() < 0.75) {
        coins.push({ id: `c_low_${stepIdx}`, x: next.midX, y: next.arcPeakY, collected: false });
      }
      curr = next;
      stepIdx++;
      if (stepIdx > 7) break;
    }

    // 1B. Vertical Turnaround Shaft (2-step zigzag climb to upper deck)
    const midStepY = Math.max(225, curr.y - randInt(52, 64));
    const shaftW = randInt(68, 88);
    const shaftX =
      dir1 === 1
        ? Math.min(805, Math.max(curr.x + 25, 760))
        : Math.max(20, Math.min(curr.x - 25, 65));
    const shaftStep = {
      x: shaftX,
      y: midStepY,
      w: shaftW,
      h: 18,
      isMover: rand() < 0.4,
      axis: 'y',
      rangeX: 0,
      rangeY: 14,
      speed: 1.25,
      offset: 0,
    };
    registerNode(shaftStep);
    coins.push({
      id: 'c_shaft',
      x: Math.round(shaftStep.x + shaftStep.w * 0.5),
      y: shaftStep.y - 28,
      collected: false,
    });

    // Upper deck entry platform
    const upperStartY = Math.max(155, midStepY - randInt(48, 60));
    const upperStartW = randInt(78, 102);
    const upperStartX =
      dir1 === 1
        ? shaftStep.x - randInt(35, 60) - upperStartW
        : shaftStep.x + shaftStep.w + randInt(35, 60);
    curr = {
      x: Math.max(40, Math.min(770, upperStartX)),
      y: upperStartY,
      w: upperStartW,
      h: 18,
      rangeX: 0,
      rangeY: 0,
    };
    platforms.push({ x: curr.x, y: curr.y, w: curr.w, h: curr.h });

    // 1C. Synthesize Upper Deck Chain heading in dir2
    const goalBoundary = dir2 === -1 ? randInt(140, 210) : randInt(680, 750);
    let upIdx = 0;
    while (
      (dir2 === -1 && curr.x > goalBoundary) ||
      (dir2 === 1 && curr.x + curr.w < goalBoundary)
    ) {
      const upperTargetY = 165 + Math.cos(upIdx * 1.5 + rand() * 2) * 28;
      const next = solveKinematicPlatform({
        fromPlat: curr,
        dir: dir2,
        targetY: upperTargetY,
        rand,
        allowMover: true,
        maxGapCap: 85,
        minWidth: 64,
        maxWidth: 105,
      });
      if (dir2 === -1 && next.x < 110) break;
      if (dir2 === 1 && next.x + next.w > 790) break;

      next.h = 18;
      registerNode(next);
      coins.push({
        id: `c_up_${upIdx}`,
        x: Math.round(next.x + next.w * 0.5),
        y: next.y - 30,
        collected: false,
      });
      curr = next;
      upIdx++;
      if (upIdx > 6) break;
    }

    // Final Portal Sanctuary on Upper Deck
    const goalW = randInt(95, 118);
    const goalY = Math.max(138, Math.min(210, curr.y + randInt(-28, 22)));
    const goalX =
      dir2 === -1
        ? Math.max(20, curr.x - randInt(38, 62) - goalW)
        : Math.min(880 - goalW, curr.x + curr.w + randInt(38, 62));
    platforms.push({ x: goalX, y: goalY, w: goalW, h: 20 });
    door = { x: Math.round(goalX + (goalW - 48) * 0.5), y: goalY - 78, w: 48, h: 78 };

    // Floor hazards along bottom chasm
    spikes.push({ x: 140, y: 428, count: 36 });

  } else if (topologyIdx === 2) {
    // ------------------------------------------------------------------------
    // TOPOLOGY 2: BIFURCATED DIAMOND (Dual-Branching High & Low Routes)
    // ------------------------------------------------------------------------
    flowName = 'BIFURCATED MATRIX';
    hint = 'Branching jump matrix: choose the high acrobatics route or the low hazard route';

    const startW = randInt(90, 118);
    const startY = randInt(265, 315);
    const startPlat = { x: 24, y: startY, w: startW, h: 440 - startY, rangeX: 0, rangeY: 0 };
    platforms.push({ x: startPlat.x, y: startPlat.y, w: startPlat.w, h: startPlat.h });
    spawn = { x: startPlat.x + 32, y: startPlat.y - 36 };

    // High Branch (climbs between y=135..220)
    let currHigh = startPlat;
    for (let i = 0; i < 4; i++) {
      const targetHighY = 150 + randInt(-15, 45);
      const nextH = solveKinematicPlatform({
        fromPlat: currHigh,
        dir: 1,
        targetY: targetHighY,
        rand,
        allowMover: true,
        maxGapCap: 82,
        minWidth: 62,
        maxWidth: 98,
      });
      if (nextH.x + nextH.w > 730) break;
      nextH.h = 16;
      registerNode(nextH);
      coins.push({
        id: `c_hi_${i}`,
        x: Math.round(nextH.x + nextH.w * 0.5),
        y: nextH.y - 28,
        collected: false,
      });
      currHigh = nextH;
    }

    // Low Branch (weaves between y=325..385 with pillar foundations & mini-spikes)
    let currLow = startPlat;
    for (let i = 0; i < 4; i++) {
      const targetLowY = 335 + randInt(-15, 45);
      const nextL = solveKinematicPlatform({
        fromPlat: currLow,
        dir: 1,
        targetY: targetLowY,
        rand,
        allowMover: i % 2 === 1,
        maxGapCap: 88,
        minWidth: 82,
        maxWidth: 125,
      });
      if (nextL.x + nextL.w > 730) break;
      nextL.h = 440 - nextL.y;
      registerNode(nextL);

      // If wide static platform, optionally place a 1-tooth mini-spike in center
      if (!nextL.isMover && nextL.w >= 108 && rand() < 0.5) {
        spikes.push({
          x: Math.round(nextL.x + nextL.w * 0.5 - 9),
          y: nextL.y,
          count: 1,
        });
      }
      if (i % 2 === 0) {
        coins.push({ id: `c_lo_${i}`, x: nextL.midX, y: nextL.arcPeakY, collected: false });
      }
      currLow = nextL;
    }

    // Convergence Sanctuary & Goal
    const rightmostX = Math.max(currHigh.x + currHigh.w, currLow.x + currLow.w);
    const goalX = Math.min(765, Math.max(660, rightmostX + randInt(38, 58)));
    const goalY = Math.round((currHigh.y + currLow.y) * 0.5 + randInt(-20, 20));
    const goalW = randInt(100, 120);

    // If high/low gap to goalY is steep from low branch, add an intermediate kinetic bridge
    if (currLow.y - goalY > 56) {
      movingPlatforms.push({
        x: Math.round((currLow.x + currLow.w + goalX) * 0.5 - 32),
        y: Math.round((currLow.y + goalY) * 0.5),
        w: 64,
        h: 16,
        axis: 'y',
        range: 24,
        rangeX: 0,
        rangeY: 24,
        speed: 1.35,
        offset: 0.5,
      });
    }

    platforms.push({ x: goalX, y: goalY, w: goalW, h: 440 - goalY });
    door = { x: Math.round(goalX + (goalW - 48) * 0.5), y: goalY - 78, w: 48, h: 78 };
    spikes.push({ x: 130, y: 428, count: 38 });

  } else if (topologyIdx === 3 || topologyIdx === 4) {
    // ------------------------------------------------------------------------
    // TOPOLOGY 3 & 4: CANYON PLUNGE & CLIFF ASCENT (V-Shape or Inverted Ridge)
    // ------------------------------------------------------------------------
    const isInvertedRidge = topologyIdx === 4;
    flowName = isInvertedRidge ? 'APEX RIDGE' : 'ABYSSAL GORGE';
    hint = isInvertedRidge
      ? 'Scale the central mountain peak and descend to the far sanctuary'
      : 'Plunge from the high cliff into the subterranean gorge and climb out';

    const startY = isInvertedRidge ? randInt(345, 385) : randInt(135, 185);
    const startW = randInt(88, 112);
    let curr = { x: 22, y: startY, w: startW, h: 440 - startY, rangeX: 0, rangeY: 0 };
    platforms.push({ x: curr.x, y: curr.y, w: curr.w, h: curr.h });
    spawn = { x: curr.x + 30, y: curr.y - 36 };

    let step = 0;
    while (curr.x + curr.w < 700 && step < 8) {
      const progress = (curr.x - 22) / 680; // 0 -> 1
      // V-curve or Inverted-V curve
      const curveFactor = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
      const targetY = isInvertedRidge
        ? Math.round(365 - curveFactor * 215 + (rand() - 0.5) * 35)
        : Math.round(155 + curveFactor * 225 + (rand() - 0.5) * 35);

      const next = solveKinematicPlatform({
        fromPlat: curr,
        dir: 1,
        targetY,
        rand,
        allowMover: true,
        maxGapCap: 92,
        minWidth: 64,
        maxWidth: 112,
      });
      if (next.x + next.w > 760) break;

      registerNode(next);
      coins.push({
        id: `c_v_${step}`,
        x: step % 2 === 0 ? next.midX : Math.round(next.x + next.w * 0.5),
        y: step % 2 === 0 ? next.arcPeakY : next.y - 30,
        collected: false,
      });

      // Add high cave ceiling stalactites when player is deep in the gorge
      if (!isInvertedRidge && next.y > 280 && rand() < 0.65) {
        const ceilH = randInt(35, 85);
        platforms.push({
          x: next.x + 8,
          y: 0,
          w: Math.max(36, next.w - 16),
          h: ceilH,
          isCeiling: true,
        });
      }

      curr = next;
      step++;
    }

    const goalW = randInt(96, 118);
    const goalX = Math.min(775, curr.x + curr.w + randInt(38, 64));
    const goalY = Math.max(145, Math.min(375, curr.y + randInt(-45, 35)));
    platforms.push({ x: goalX, y: goalY, w: goalW, h: 440 - goalY });
    door = { x: Math.round(goalX + (goalW - 48) * 0.5), y: goalY - 78, w: 48, h: 78 };
    spikes.push({ x: 110, y: 428, count: 40 });

  } else {
    // ------------------------------------------------------------------------
    // TOPOLOGY 4: HARMONIC KINEMATIC WAVE (Multi-Frequency Procedural Chain)
    // ------------------------------------------------------------------------
    const goLeft = rand() < 0.35;
    const dir = goLeft ? -1 : 1;
    flowName = goLeft ? 'WESTWARD HARMONIC' : 'KINEMATIC CASCADE';
    hint = 'Every ledge, gap, and kinetic orbit dynamically solved from your jump parabola';

    const freq1 = 0.008 + rand() * 0.009;
    const freq2 = 0.018 + rand() * 0.012;
    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;
    const amp1 = 55 + rand() * 55;
    const amp2 = 25 + rand() * 35;
    const baseAxisY = 255 + (rand() - 0.5) * 60;

    const evalWaveY = (xPos) =>
      baseAxisY + Math.sin(xPos * freq1 + phase1) * amp1 + Math.cos(xPos * freq2 + phase2) * amp2;

    const startW = randInt(86, 114);
    const startX = goLeft ? randInt(765, 875 - startW) : randInt(20, 42);
    const startY = Math.round(Math.max(150, Math.min(380, evalWaveY(startX))));

    let curr = { x: startX, y: startY, w: startW, h: 440 - startY, rangeX: 0, rangeY: 0 };
    platforms.push({ x: curr.x, y: curr.y, w: curr.w, h: curr.h });
    spawn = { x: curr.x + Math.round(curr.w * 0.4), y: curr.y - 36 };

    let idx = 0;
    while (
      (dir === 1 && curr.x + curr.w < 705) ||
      (dir === -1 && curr.x > 195)
    ) {
      const lookaheadX = curr.x + dir * 130;
      const desiredY = evalWaveY(lookaheadX);
      const next = solveKinematicPlatform({
        fromPlat: curr,
        dir,
        targetY: desiredY,
        rand,
        allowMover: true,
        maxGapCap: 96,
        minWidth: 60,
        maxWidth: 118,
      });

      if (dir === 1 && next.x + next.w > 765) break;
      if (dir === -1 && next.x < 135) break;

      registerNode(next);

      // Place crystal either at jump apex or floating above platform
      if (rand() < 0.55) {
        coins.push({ id: `c_w_${idx}`, x: next.midX, y: next.arcPeakY, collected: false });
      } else {
        coins.push({
          id: `c_w_${idx}`,
          x: Math.round(next.x + next.w * 0.5),
          y: next.y - 32,
          collected: false,
        });
      }

      // Optional mid-platform spike tooth on wide static slabs
      if (!next.isMover && next.w >= 106 && rand() < 0.45) {
        spikes.push({
          x: Math.round(next.x + next.w * 0.5 - 9),
          y: next.y,
          count: 1,
        });
      }

      // Optional overhead monolith above low sections (guaranteed jump clearance)
      if (next.arcPeakY > 135 && rand() < 0.35) {
        const overhangY = Math.max(18, next.arcPeakY - 68);
        platforms.push({
          x: next.x + 6,
          y: overhangY,
          w: Math.max(42, next.w - 12),
          h: 22,
          isCeiling: true,
        });
      }

      curr = next;
      idx++;
      if (idx > 8) break;
    }

    const goalW = randInt(96, 118);
    const goalGap = randInt(36, 58);
    const goalX =
      dir === 1
        ? Math.min(880 - goalW, curr.x + curr.w + goalGap)
        : Math.max(20, curr.x - goalGap - goalW);
    const goalY = Math.max(145, Math.min(380, curr.y + randInt(-44, 38)));
    platforms.push({ x: goalX, y: goalY, w: goalW, h: 440 - goalY });
    door = { x: Math.round(goalX + (goalW - 48) * 0.5), y: goalY - 78, w: 48, h: 78 };
    spikes.push({ x: 20, y: 428, count: 48 });
  }

  return {
    id: `proc_${seed}`,
    title: `CHAMBER ${chamberNum} · ${flowName}`,
    hint,
    spawn,
    door,
    coins,
    platforms,
    movingPlatforms,
    spikes,
  };
}

export default function HomePlatformGame() {
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const dpadRef = useRef(null);
  const topologyCycleRef = useRef(Math.floor(Math.random() * 6));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTouchPad, setShowTouchPad] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
    return Boolean(isCoarse || window.innerWidth < 1024);
  });
  const [pressedPad, setPressedPad] = useState({ left: false, right: false, up: false });
  const [_levelSeed, setLevelSeed] = useState(() => Math.floor(Math.random() * 899999) + 100000);
  const [currentLevel, setCurrentLevel] = useState(() =>
    generateRandomLevel(
      Math.floor(Math.random() * 899999) + 100000,
      topologyCycleRef.current
    )
  );
  const [coinsCollected, setCoinsCollected] = useState(0);

  const audioCtxRef = useRef(null);

  const playTone = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.setValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'respawn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'door') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.05);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // AudioContext policy gracefully handled
    }
  }, [soundEnabled]);

  // Game Engine State
  const gameRef = useRef({
    x: 60,
    y: 320,
    vx: 0,
    vy: 0,
    w: 24,
    h: 30,
    onGround: false,
    coyoteTimer: 0, // Allows jumping up to 7 frames after slipping off a ledge
    jumpBufferTimer: 0, // Remembers jump input pressed right before landing
    facing: 1,
    animTimer: 0,
    scaleX: 1,
    scaleY: 1,
    dustParticles: [],
    level: currentLevel,
    coins: JSON.parse(JSON.stringify(currentLevel.coins)),
    keys: { left: false, right: false, up: false },
    time: 0,
    isTransitioning: false,
    standingPlatform: null,
  });

  const resetPlayer = useCallback((customLevel) => {
    const lvl = customLevel || gameRef.current.level;
    const g = gameRef.current;
    g.x = lvl.spawn.x;
    g.y = lvl.spawn.y;
    g.vx = 0;
    g.vy = 0;
    g.onGround = false;
    g.coyoteTimer = 0;
    g.jumpBufferTimer = 0;
    g.scaleX = 1;
    g.scaleY = 1;
    g.dustParticles = [];
    g.coins = JSON.parse(JSON.stringify(lvl.coins));
    g.isTransitioning = false;
    g.standingPlatform = null;
    setCoinsCollected(0);
  }, []);

  const loadNewRandomLevel = useCallback(() => {
    topologyCycleRef.current =
      (topologyCycleRef.current + 1 + Math.floor(Math.random() * 5)) % 6;
    const nextSeed = Math.floor(Math.random() * 899999) + 100000;
    const nextLvl = generateRandomLevel(nextSeed, topologyCycleRef.current);
    setLevelSeed(nextSeed);
    setCurrentLevel(nextLvl);
    gameRef.current.level = nextLvl;
    resetPlayer(nextLvl);
  }, [resetPlayer]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      const g = gameRef.current;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        g.keys.left = true;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        g.keys.right = true;
      } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ') {
        g.keys.up = true;
        g.jumpBufferTimer = 8; // Buffer jump for 8 frames
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        resetPlayer();
      }
    };

    const onKeyUp = (e) => {
      const g = gameRef.current;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        g.keys.left = false;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        g.keys.right = false;
      } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ') {
        g.keys.up = false;
        // Fair variable jump height: releasing early gently limits velocity to -6.2 (never kills the jump completely)
        if (g.vy < -6.2) {
          g.vy = -6.2;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [resetPlayer]);

  // Main Canvas 60FPS Game Loop (auto-pauses when scrolled offscreen or tab hidden to save mobile battery/CPU)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Pre-render static warm Chalk paper & grid lines once instead of 48 stroke calls every frame
    if (!bgCanvasRef.current) {
      const bg = document.createElement('canvas');
      bg.width = canvas.width;
      bg.height = canvas.height;
      const bctx = bg.getContext('2d');
      if (bctx) {
        bctx.fillStyle = '#E3D6BF';
        bctx.fillRect(0, 0, bg.width, bg.height);
        bctx.strokeStyle = 'rgba(170, 186, 174, 0.22)';
        bctx.lineWidth = 1;
        const step = 28;
        for (let x = 0; x < bg.width; x += step) {
          bctx.beginPath();
          bctx.moveTo(x, 0);
          bctx.lineTo(x, bg.height);
          bctx.stroke();
        }
        for (let y = 0; y < bg.height; y += step) {
          bctx.beginPath();
          bctx.moveTo(0, y);
          bctx.lineTo(bg.width, y);
          bctx.stroke();
        }
      }
      bgCanvasRef.current = bg;
    }

    let animId = 0;
    let isVisible = true;
    let rafLoopActive = false;
    resetPlayer(currentLevel);

    const loop = () => {
      if (!isVisible || document.hidden) {
        rafLoopActive = false;
        animId = 0;
        return;
      }
      const g = gameRef.current;
      const curLvl = g.level;
      g.time += 0.03;

      // 1. Calculate Moving Platforms Positions & Dynamic Velocities (dx, dy)
      const activePlatforms = curLvl.platforms.map((p) => ({ ...p, dx: 0, dy: 0, isMoving: false }));

      if (curLvl.movingPlatforms) {
        curLvl.movingPlatforms.forEach((mp, idx) => {
          let px = mp.x;
          let py = mp.y;
          let prevPx = mp.x;
          let prevPy = mp.y;

          const rx = mp.rangeX !== undefined ? mp.rangeX : mp.range;
          const ry = mp.rangeY !== undefined ? mp.rangeY : mp.range;

          if (mp.axis === 'y') {
            py = mp.y + Math.sin(g.time * mp.speed + mp.offset) * ry;
            prevPy = mp.y + Math.sin((g.time - 0.03) * mp.speed + mp.offset) * ry;
          } else if (mp.axis === 'xy') {
            px = mp.x + Math.cos(g.time * mp.speed + mp.offset) * rx;
            prevPx = mp.x + Math.cos((g.time - 0.03) * mp.speed + mp.offset) * rx;
            py = mp.y + Math.sin(g.time * mp.speed + mp.offset) * ry;
            prevPy = mp.y + Math.sin((g.time - 0.03) * mp.speed + mp.offset) * ry;
          } else {
            px = mp.x + Math.sin(g.time * mp.speed + mp.offset) * rx;
            prevPx = mp.x + Math.sin((g.time - 0.03) * mp.speed + mp.offset) * rx;
          }

          const platformObj = {
            id: `mp_${idx}`,
            x: px,
            y: py,
            w: mp.w,
            h: mp.h,
            dx: px - prevPx,
            dy: py - prevPy,
            isMoving: true,
          };

          activePlatforms.push(platformObj);
        });
      }

      // 2. Moving Platform Carrier Physics
      if (g.onGround && g.standingPlatform && g.standingPlatform.isMoving) {
        g.x += g.standingPlatform.dx;
        g.y += g.standingPlatform.dy;
      }

      // 3. Horizontal Physics (Smooth acceleration and responsive turning)
      const accel = PHYSICS.accel;
      const friction = PHYSICS.friction;
      const maxSpeed = PHYSICS.maxSpeed;

      if (g.keys.left) {
        g.vx -= accel;
        g.facing = -1;
      }
      if (g.keys.right) {
        g.vx += accel;
        g.facing = 1;
      }
      g.vx *= friction;
      g.vx = Math.max(-maxSpeed, Math.min(maxSpeed, g.vx));
      g.x += g.vx;

      // Clamp player within horizontal canvas walls
      if (g.x < 4) {
        g.x = 4;
        g.vx = 0;
      } else if (g.x + g.w > PHYSICS.canvasW - 4) {
        g.x = PHYSICS.canvasW - 4 - g.w;
        g.vx = 0;
      }

      // 4. Vertical Physics (Gravity & Jump with Coyote Time & Jump Buffer)
      const gravity = PHYSICS.gravity;
      const jumpImpulse = PHYSICS.jumpImpulse;

      if (g.onGround) {
        g.coyoteTimer = 8; // 8 frames of coyote time after leaving ledge
      } else if (g.coyoteTimer > 0) {
        g.coyoteTimer--;
      }

      if (g.jumpBufferTimer > 0) {
        g.jumpBufferTimer--;
      }

      const wantsToJump = g.keys.up || g.jumpBufferTimer > 0;
      const canJump = g.onGround || g.coyoteTimer > 0;

      if (wantsToJump && canJump) {
        const elevatorBoost = g.standingPlatform && g.standingPlatform.dy < 0 ? g.standingPlatform.dy * 0.9 : 0;
        g.vy = jumpImpulse + elevatorBoost;
        g.onGround = false;
        g.coyoteTimer = 0;
        g.jumpBufferTimer = 0;
        g.standingPlatform = null;

        g.scaleX = 0.72;
        g.scaleY = 1.35;
        for (let i = 0; i < 4; i++) {
          g.dustParticles.push({
            x: g.x + g.w * 0.5 + (Math.random() - 0.5) * 16,
            y: g.y + g.h,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 1.5,
            size: 2.5,
            life: 1.0,
          });
        }
        playTone('jump');
      }

      g.vy += gravity;
      if (g.vy > 12) g.vy = 12;
      g.y += g.vy;

      const wasOnGround = g.onGround;
      g.onGround = false;
      let landedPlatform = null;

      // 5. Platform Collision Detection (AABB with Swept Margin & Ledge Forgiveness)
      activePlatforms.forEach((plat) => {
        if (plat.isCeiling) {
          // Underside ceiling bonk check
          if (
            g.vy < 0 &&
            g.x + g.w > plat.x + 2 &&
            g.x < plat.x + plat.w - 2 &&
            g.y <= plat.y + plat.h &&
            g.y - g.vy >= plat.y + plat.h - 14
          ) {
            g.y = plat.y + plat.h;
            g.vy = 0;
          }
          return;
        }

        // Ledge forgiveness margin: allow landing if player's base touches within 5px of ledge
        if (g.x + g.w >= plat.x - 5 && g.x <= plat.x + plat.w + 5) {
          const landingTolerance = Math.max(15, g.vy + Math.abs(plat.dy) + 5);
          if (
            g.y + g.h >= plat.y &&
            g.y + g.h - g.vy <= plat.y + landingTolerance &&
            g.vy >= 0
          ) {
            if (!wasOnGround && g.vy > 2.5) {
              g.scaleX = 1.32;
              g.scaleY = 0.72;
              for (let i = 0; i < 4; i++) {
                g.dustParticles.push({
                  x: g.x + g.w * 0.5 + (Math.random() - 0.5) * 18,
                  y: plat.y,
                  vx: (Math.random() - 0.5) * 2.8,
                  vy: -Math.random() * 1.2,
                  size: 2.5,
                  life: 0.9,
                });
              }
            }
            g.y = plat.y - g.h;
            g.vy = 0;
            g.onGround = true;
            landedPlatform = plat;
          }
        }
      });

      g.standingPlatform = landedPlatform;

      g.scaleX += (1 - g.scaleX) * 0.18;
      g.scaleY += (1 - g.scaleY) * 0.18;

      for (let i = g.dustParticles.length - 1; i >= 0; i--) {
        const p = g.dustParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.045;
        if (p.life <= 0) {
          g.dustParticles.splice(i, 1);
        }
      }

      // 6. Coin Pickups
      g.coins.forEach((coin) => {
        if (!coin.collected) {
          const dx = (g.x + g.w * 0.5) - coin.x;
          const dy = (g.y + g.h * 0.5) - coin.y;
          if (Math.hypot(dx, dy) < 22) {
            coin.collected = true;
            playTone('coin');
            setCoinsCollected((prev) => prev + 1);
          }
        }
      });

      // 7. Spike Hazards (Fair, instant respawn)
      if (curLvl.spikes) {
        curLvl.spikes.forEach((spike) => {
          const spikeW = spike.count * 18;
          if (
            g.x + g.w > spike.x &&
            g.x < spike.x + spikeW &&
            g.y + g.h >= spike.y - 10 &&
            g.y < spike.y + 16
          ) {
            playTone('respawn');
            resetPlayer();
          }
        });
      }

      // 8. Pit Fall Check
      if (g.y > 480) {
        playTone('respawn');
        resetPlayer();
      }

      // 9. Door / Goal Check
      const door = curLvl.door;
      if (
        g.x + g.w > door.x + 8 &&
        g.x < door.x + door.w - 8 &&
        g.y + g.h >= door.y &&
        g.y <= door.y + door.h &&
        !g.isTransitioning
      ) {
        g.isTransitioning = true;
        playTone('door');
        loadNewRandomLevel();
      }

      // ==========================================
      // RENDER SECTION
      // ==========================================
      if (bgCanvasRef.current) {
        ctx.drawImage(bgCanvasRef.current, 0, 0);
      } else {
        ctx.fillStyle = '#E3D6BF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Platforms
      activePlatforms.forEach((p) => {
        ctx.fillStyle = '#933B5B';
        ctx.fillRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = p.isMoving ? '#B5728A' : '#AABAAE';
        ctx.fillRect(p.x, p.y, p.w, 3);
      });

      // Draw Spikes
      if (curLvl.spikes) {
        curLvl.spikes.forEach((spike) => {
          ctx.fillStyle = '#933B5B';
          const toothW = 18;
          for (let i = 0; i < spike.count; i++) {
            const sx = spike.x + i * toothW;
            const sy = spike.y;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + toothW * 0.5, sy - 14);
            ctx.lineTo(sx + toothW, sy);
            ctx.closePath();
            ctx.fill();
          }
        });
      }

      // Draw Coins
      g.coins.forEach((coin) => {
        if (!coin.collected) {
          const cy = coin.y + Math.sin(g.time * 4) * 3;
          ctx.save();
          ctx.translate(coin.x, cy);
          ctx.fillStyle = '#B5728A';
          ctx.strokeStyle = '#933B5B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 8);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      });

      // Draw Door / Archway
      ctx.save();
      ctx.fillStyle = '#933B5B';
      ctx.beginPath();
      ctx.arc(door.x + door.w * 0.5, door.y + door.w * 0.5, door.w * 0.5, Math.PI, 0);
      ctx.lineTo(door.x + door.w, door.y + door.h);
      ctx.lineTo(door.x, door.y + door.h);
      ctx.closePath();
      ctx.fill();

      const pad = 5;
      ctx.fillStyle = '#E3D6BF';
      ctx.beginPath();
      ctx.arc(door.x + door.w * 0.5, door.y + door.w * 0.5, door.w * 0.5 - pad, Math.PI, 0);
      ctx.lineTo(door.x + door.w - pad, door.y + door.h);
      ctx.lineTo(door.x + pad, door.y + door.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#933B5B';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PORTAL', door.x + door.w * 0.5, door.y + door.h - 8);
      ctx.restore();

      // Draw Dust Particles
      g.dustParticles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = `rgba(147, 59, 91, ${Math.max(0, p.life * 0.7)})`;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        ctx.restore();
      });

      // Draw Character
      const pixelSize = 3;
      const isRunning = Math.abs(g.vx) > 0.3;
      let charMatrix = PIXEL_CHAR_IDLE;

      if (!g.onGround) {
        charMatrix = g.vy < 0 ? PIXEL_CHAR_JUMP : PIXEL_CHAR_FALL;
      } else if (isRunning) {
        g.animTimer += Math.abs(g.vx) * 0.16;
        const frame = Math.floor(g.animTimer) % 4;
        if (frame === 0) charMatrix = PIXEL_CHAR_RUN_1;
        else if (frame === 1) charMatrix = PIXEL_CHAR_RUN_2;
        else if (frame === 2) charMatrix = PIXEL_CHAR_RUN_3;
        else charMatrix = PIXEL_CHAR_RUN_2;
      } else {
        charMatrix = PIXEL_CHAR_IDLE;
      }

      ctx.save();
      ctx.fillStyle = '#933B5B';

      const centerX = g.x + g.w * 0.5;
      const baseY = g.y + g.h;
      ctx.translate(centerX, baseY);
      ctx.scale(g.facing, 1);

      const runningLean = g.onGround && isRunning ? (Math.abs(g.vx) / 5.2) * 0.08 : 0;
      ctx.rotate(runningLean);
      ctx.scale(g.scaleX, g.scaleY);

      const charOriginX = -g.w * 0.5;
      const charOriginY = -g.h;

      for (let r = 0; r < charMatrix.length; r++) {
        for (let c = 0; c < charMatrix[r].length; c++) {
          if (charMatrix[r][c] === 1) {
            ctx.fillRect(charOriginX + c * pixelSize, charOriginY + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (!rafLoopActive && isVisible && !document.hidden) {
        rafLoopActive = true;
        animId = requestAnimationFrame(loop);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) startLoop();
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isVisible = entries.some((entry) => entry.isIntersecting);
              if (isVisible) startLoop();
            },
            { threshold: 0.01 }
          )
        : null;

    observer?.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    startLoop();

    return () => {
      cancelAnimationFrame(animId);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [playTone, resetPlayer, currentLevel, loadNewRandomLevel]);

  // Keep touch pad visible automatically when rotating or resizing to phone/tablet
  useEffect(() => {
    const syncPadVisibility = () => {
      const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
      if (isCoarse || window.innerWidth < 1024) {
        setShowTouchPad(true);
      }
    };
    window.addEventListener('resize', syncPadVisibility);
    return () => window.removeEventListener('resize', syncPadVisibility);
  }, []);

  const setMoveDir = useCallback((dir) => {
    const g = gameRef.current;
    g.keys.left = dir === 'left';
    g.keys.right = dir === 'right';
    setPressedPad((prev) =>
      prev.left === g.keys.left && prev.right === g.keys.right
        ? prev
        : { ...prev, left: g.keys.left, right: g.keys.right }
    );
  }, []);

  const handleDpadPointer = useCallback(
    (e) => {
      if (!dpadRef.current) return;
      const rect = dpadRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const nextDir = relX < rect.width * 0.5 ? 'left' : 'right';
      setMoveDir(nextDir);
    },
    [setMoveDir]
  );

  const handleJumpStart = useCallback((e) => {
    e.preventDefault();
    const g = gameRef.current;
    g.keys.up = true;
    g.jumpBufferTimer = 8;
    setPressedPad((prev) => (prev.up ? prev : { ...prev, up: true }));
  }, []);

  const handleJumpEnd = useCallback(() => {
    const g = gameRef.current;
    g.keys.up = false;
    if (g.vy < -6.2) {
      g.vy = -6.2;
    }
    setPressedPad((prev) => (!prev.up ? prev : { ...prev, up: false }));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center select-none py-1 sm:py-4">
      {/* Editorial Game Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4 mb-2 border-b border-[#AABAAE]/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded bg-[#933B5B] text-[#E3D6BF]">
              {currentLevel.title}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs font-mono text-[#9F9679] leading-snug">
            {currentLevel.hint}
          </p>
        </div>

        {/* Status & Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border border-[#AABAAE]/70 bg-[#F5EFE0] text-[11px] sm:text-xs font-mono text-[#933B5B] flex items-center gap-1.5 sm:gap-2">
            <span>CRYSTALS:</span>
            <span className="font-bold text-[#933B5B]">
              {coinsCollected} / {currentLevel.coins.length}
            </span>
          </div>

          <button
            type="button"
            onClick={loadNewRandomLevel}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border border-[#AABAAE]/70 bg-[#F5EFE0] text-[11px] sm:text-xs font-mono text-[#933B5B] hover:bg-[#933B5B] hover:text-[#E3D6BF] transition-colors cursor-pointer"
            title="Generate New Procedural Chamber"
            aria-label="Randomize Level"
          >
            <Shuffle size={14} />
            <span className="hidden sm:inline">RANDOMIZE</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTouchPad((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border text-[11px] sm:text-xs font-mono transition-colors cursor-pointer ${
              showTouchPad
                ? 'border-[#933B5B] bg-[#933B5B] text-[#E3D6BF]'
                : 'border-[#AABAAE]/70 bg-[#F5EFE0] text-[#933B5B] hover:bg-[#933B5B] hover:text-[#E3D6BF]'
            }`}
            title="Toggle On-Screen Portrait & Tablet Controls"
            aria-pressed={showTouchPad}
            aria-label="Toggle On-Screen Gamepad"
          >
            <Gamepad2 size={14} />
            <span>PAD</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 sm:p-2 rounded-md border border-[#AABAAE]/70 bg-[#F5EFE0] text-[#933B5B] hover:bg-[#933B5B] hover:text-[#E3D6BF] transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Game Audio" : "Enable Game Audio"}
            aria-label="Toggle Game Audio"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={() => resetPlayer()}
            className="p-1.5 sm:p-2 rounded-md border border-[#AABAAE]/70 bg-[#F5EFE0] text-[#933B5B] hover:bg-[#933B5B] hover:text-[#E3D6BF] transition-colors cursor-pointer"
            title="Restart Stage"
            aria-label="Restart Stage"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Screen Frame (Level Devil pixel canvas) */}
      <div className="relative w-full aspect-[900/440] rounded-xl sm:rounded-2xl border-2 border-[#933B5B] bg-[#E3D6BF] overflow-hidden shadow-sm">
        <canvas
          ref={canvasRef}
          width={900}
          height={440}
          className="w-full h-full block"
        />
      </div>

      {/* Portrait & Tablet Friendly Two-Thumb Arcade Deck (Works without switching orientation) */}
      {showTouchPad && (
        <div
          className="w-full flex items-center justify-between gap-3 pt-3 sm:pt-4 px-1 sm:px-2 touch-none select-none"
          role="group"
          aria-label="Touch arcade game controls"
        >
          {/* Slide-friendly Left/Right D-Pad */}
          <div
            ref={dpadRef}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              handleDpadPointer(e);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pressure > 0 || e.pointerType === 'touch') {
                if (pressedPad.left || pressedPad.right) {
                  handleDpadPointer(e);
                }
              }
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              setMoveDir(null);
            }}
            onPointerCancel={() => setMoveDir(null)}
            className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border border-[#933B5B]/30 bg-[#E3D6BF]/90 shadow-xs touch-none"
          >
            <button
              type="button"
              tabIndex={-1}
              className={`w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-16 rounded-xl border font-mono flex items-center justify-center transition-transform touch-none ${
                pressedPad.left
                  ? 'bg-[#933B5B] text-[#E3D6BF] border-[#933B5B] scale-95'
                  : 'bg-[#F5EFE0] text-[#933B5B] border-[#AABAAE]/70'
              }`}
              aria-label="Move Left"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              className={`w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-16 rounded-xl border font-mono flex items-center justify-center transition-transform touch-none ${
                pressedPad.right
                  ? 'bg-[#933B5B] text-[#E3D6BF] border-[#933B5B] scale-95'
                  : 'bg-[#F5EFE0] text-[#933B5B] border-[#AABAAE]/70'
              }`}
              aria-label="Move Right"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          <span className="hidden md:inline font-mono text-[10px] tracking-widest uppercase text-[#9F9679]">
            Slide thumb to steer · Tap to jump
          </span>

          {/* Right Thumb Action Cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                resetPlayer();
              }}
              className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl border border-[#AABAAE]/70 bg-[#F5EFE0] text-[#933B5B] active:bg-[#933B5B] active:text-[#E3D6BF] active:scale-95 flex items-center justify-center transition-transform touch-none"
              aria-label="Quick Restart Stage"
              title="Restart"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                handleJumpStart(e);
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
                handleJumpEnd();
              }}
              onPointerCancel={handleJumpEnd}
              className={`h-14 sm:h-16 px-7 sm:px-10 md:px-12 rounded-2xl border-2 font-mono text-xs sm:text-sm uppercase tracking-wider font-bold flex items-center gap-2 transition-transform touch-none shadow-xs ${
                pressedPad.up
                  ? 'bg-[#742945] text-[#E3D6BF] border-[#742945] scale-95'
                  : 'bg-[#933B5B] text-[#E3D6BF] border-[#933B5B]'
              }`}
              aria-label="Jump"
            >
              <ArrowUp size={20} />
              <span>JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
