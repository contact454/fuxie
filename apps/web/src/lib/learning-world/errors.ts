/* MIT License, see THIRD_PARTY_NOTICES (only headers in adapted files;
   this file is pure original code). */

export class LearningWorldError extends Error {
    constructor(
        public readonly code: LearningWorldErrorCode,
        message: string,
    ) {
        super(message)
        this.name = 'LearningWorldError'
    }
}

export type LearningWorldErrorCode =
    | 'INVALID_GRID_CONFIG'      // tile size out of [1, 1024] or non-integer
    | 'INVALID_GRID_INPUT'       // NaN/Infinity/non-numeric arg to iso-grid
    | 'INVALID_CAMERA_CONFIG'    // bad zoom bounds at construction
    | 'INVALID_CAMERA_INPUT'     // bad input to setZoom / setPan / transforms
    | 'INVALID_CONTEXT'          // null/undefined/non-conformant WorldCanvasContext
    | 'INVALID_OBJECT'           // bad WorldObject fields
    | 'OUT_OF_BOUNDS'            // coordinate outside grid
    | 'OCCUPANCY_COLLISION'      // add would overlap another object
    | 'OBJECT_NOT_REGISTERED'    // remove() called on unknown object
