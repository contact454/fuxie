import { describe, it, expect } from 'vitest'

import {
    AudioButton,
    BottomNav,
    FrostedPanel,
    IsoPlate,
    OptionTile,
    PrimaryCta,
    ProgressRing,
    RewardBurst,
    ScenePanel,
    StreakPill,
    TopBar,
    WorldNode,
} from '@fuxie/ui/components'

/**
 * Package-boundary smoke: consumers resolve primitives from @fuxie/ui/components.
 * Detailed behavior regressions live in packages/ui/src/components/*.test.tsx.
 *
 * Intentionally avoids importing `react` / JSX here — this file sits at the
 * monorepo root outside app/package dependency roots, while vitest still
 * resolves the workspace package export map used at runtime.
 */
describe('Fuxie UI package boundary (@fuxie/ui/components)', () => {
    it('exposes the public primitive export surface', () => {
        // forwardRef component is an object with render; plain components are functions
        expect(typeof PrimaryCta).toBe('object')
        expect(PrimaryCta).toHaveProperty('displayName', 'PrimaryCta')
        expect(typeof IsoPlate).toBe('function')
        expect(typeof ScenePanel).toBe('function')
        expect(typeof WorldNode).toBe('function')
        expect(typeof OptionTile).toBe('function')
        expect(typeof RewardBurst).toBe('function')
        expect(typeof ProgressRing).toBe('function')
        expect(typeof AudioButton).toBe('function')
        expect(typeof StreakPill).toBe('function')
        expect(typeof TopBar).toBe('function')
        expect(typeof BottomNav).toBe('function')
        expect(typeof FrostedPanel).toBe('function')
    })
})
