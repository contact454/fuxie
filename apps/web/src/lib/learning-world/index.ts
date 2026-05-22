// Public barrel for the framework-agnostic Learning_World_Core.
// Strictly re-exports symbols added so far. Each new core module appends
// here; nothing here may reference React, Next, or DOM-only types.

export { LearningWorldError } from './errors'
export type { LearningWorldErrorCode } from './errors'

export { isWorldCanvasContext } from './world-canvas-context'
export type { WorldCanvasContext, WorldImageSource } from './world-canvas-context'

export { IsoGrid } from './iso-grid'
export type { IsoGridConfig, ScreenPoint, CellPoint } from './iso-grid'

export type { TerrainEntry, WorldScene } from './world-scene'

export { WorldCamera } from './world-camera'
export type { CameraConfig, WorldPoint } from './world-camera'

export { createWorldObject, sortKey, isInteractive } from './world-object'
export type { Footprint, WorldObject, WorldObjectInput } from './world-object'

export { WorldMap } from './world-map'
export type { WorldMapConfig } from './world-map'

export { paint } from './render'
export type { Viewport, RenderInputs } from './render'

export {
    combineRects,
    computeAutoFitCamera,
} from './camera-fit'
export type {
    AutoFitConfig,
    AutoFitResult,
    SceneBounds,
} from './camera-fit'
