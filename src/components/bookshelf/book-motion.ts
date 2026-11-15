export type BookPose = {
  x: number;
  y?: number;
  z: number;
  yaw: number;
  scale: number;
};

export type BookFootprint = BookPose & {
  id: string;
  width: number;
  thickness: number;
};

export type MotionBookSize = {
  width: number;
  thickness: number;
};

export type MotionLayout = {
  shelvedZ: number;
  presentedZ: number;
  rotationLaneZ: number;
  presentedScale: number;
  collisionMargin: number;
};

export type BrowseMotionPhase =
  | "retreat-current"
  | "turn-current"
  | "shelve-current"
  | "extract-next"
  | "turn-next"
  | "settle-next";

export const shelvedYaw = Math.PI / 2;
export const presentedYaw = 0;

export const SLOT_SPACING = 1.95;
export const presentedZ = 0.38;
export const shelvedZ = -0.38;
export const presentedScale = 1.04;
export const shelvedScale = 0.88;
const maximumFocusScale = 1.15;
const collisionMargin = 0.035;

export const browsePhaseDuration: Record<BrowseMotionPhase, number> = {
  "retreat-current": 0.11,
  "turn-current": 0.14,
  "shelve-current": 0.13,
  "extract-next": 0.13,
  "turn-next": 0.14,
  "settle-next": 0.11,
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

/**
 * Computes the 3D pose of a book in the showcase gallery carousel based on its continuous offset
 * from the active center point (offset = index - currentScroll).
 */
export function getCarouselPose(offset: number, slotSpacing = SLOT_SPACING): BookPose {
  const absOffset = Math.abs(offset);
  const sign = Math.sign(offset) || 1;

  if (absOffset < 0.0001) {
    return {
      x: 0,
      y: 0.02,
      z: presentedZ,
      yaw: 0,
      scale: presentedScale,
    };
  }

  if (absOffset <= 1.0) {
    const t = absOffset;
    const smoothT = smooth(t);
    return {
      x: offset * slotSpacing,
      y: (1 - smoothT) * 0.02,
      z: lerp(presentedZ, shelvedZ, Math.pow(smoothT, 0.85)),
      yaw: -sign * (smoothT * 0.48), // Inward perspective angling towards viewer
      scale: lerp(presentedScale, shelvedScale, smoothT),
    };
  }

  // Extended stack for books beyond ±1 offset with subtle perspective compression
  const extra = Math.min(absOffset - 1.0, 3.0);
  return {
    x: sign * (slotSpacing + extra * (slotSpacing * 0.80)),
    y: 0,
    z: shelvedZ - extra * 0.25,
    yaw: -sign * Math.min(0.65, 0.48 + extra * 0.08),
    scale: Math.max(0.68, shelvedScale - extra * 0.07),
  };
}

export function createMotionLayout(books: MotionBookSize[]): MotionLayout {
  const maxShelvedHalfDepth = books.reduce(
    (maximum, book) => Math.max(maximum, book.width * 0.5),
    0.7,
  );
  const maxTurnedHalfDepth = books.reduce(
    (maximum, book) => Math.max(maximum, book.thickness * 0.5),
    0.2,
  );
  const rotationLaneZ =
    shelvedZ + maxShelvedHalfDepth + maxTurnedHalfDepth + 0.08;

  return {
    shelvedZ,
    presentedZ,
    rotationLaneZ,
    presentedScale,
    collisionMargin,
  };
}

export function shelvedBookPose(layout: MotionLayout): BookPose {
  return {
    x: 0,
    y: 0,
    z: layout.shelvedZ,
    yaw: shelvedYaw,
    scale: 1,
  };
}

export function presentedBookPose(layout: MotionLayout): BookPose {
  return {
    x: 0,
    y: 0.02,
    z: layout.presentedZ,
    yaw: presentedYaw,
    scale: layout.presentedScale,
  };
}

export function focusedBookPose(
  _layout?: MotionLayout,
  viewScale = 1,
): BookPose {
  return {
    x: 0,
    y: 0.05,
    z: presentedZ + 0.16,
    yaw: 0.08,
    scale: Math.min(maximumFocusScale, presentedScale * viewScale * 1.05),
  };
}

export function browseMotionPose(
  layout: MotionLayout,
  phase: BrowseMotionPhase,
  rawProgress: number,

  direction: 1 | -1,
): BookPose {
  const progress = clamp01(rawProgress);
  const eased = smooth(progress);
  const sideZ = layout.rotationLaneZ;

  switch (phase) {
    case "retreat-current":
      return {
        x: 0,
        z: lerp(layout.presentedZ, sideZ, eased),
        yaw: presentedYaw,
        scale: lerp(layout.presentedScale, 1, eased),
      };
    case "turn-current":
      return {
        x: 0,
        z: sideZ,
        yaw: lerp(presentedYaw, direction * shelvedYaw, eased),
        scale: 1,
      };
    case "shelve-current":
      return {
        x: 0,
        z: lerp(sideZ, layout.shelvedZ, eased),
        yaw: direction * shelvedYaw,
        scale: 1,
      };
    case "extract-next":
      return {
        x: 0,
        z: lerp(layout.shelvedZ, sideZ, eased),
        yaw: -direction * shelvedYaw,
        scale: 1,
      };
    case "turn-next":
      return {
        x: 0,
        z: sideZ,
        yaw: lerp(-direction * shelvedYaw, presentedYaw, eased),
        scale: 1,
      };
    case "settle-next":
      return {
        x: 0,
        z: lerp(sideZ, layout.presentedZ, eased),
        yaw: presentedYaw,
        scale: lerp(1, layout.presentedScale, eased),
      };
  }
}

function boundingBox(book: BookFootprint) {
  const cos = Math.abs(Math.cos(book.yaw));
  const sin = Math.abs(Math.sin(book.yaw));
  const scaledWidth = book.width * book.scale;
  const scaledThickness = book.thickness * book.scale;
  const halfX = (scaledWidth * cos + scaledThickness * sin) * 0.5;
  const halfZ = (scaledWidth * sin + scaledThickness * cos) * 0.5;

  return {
    minX: book.x - halfX,
    maxX: book.x + halfX,
    minZ: book.z - halfZ,
    maxZ: book.z + halfZ,
  };
}

export function bookFootprintsOverlap(
  first: BookFootprint,
  second: BookFootprint,
  margin = 0,
) {
  const a = boundingBox(first);
  const b = boundingBox(second);

  return (
    a.minX - margin < b.maxX + margin &&
    a.maxX + margin > b.minX - margin &&
    a.minZ - margin < b.maxZ + margin &&
    a.maxZ + margin > b.minZ - margin
  );
}
