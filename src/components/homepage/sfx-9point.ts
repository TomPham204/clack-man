/**
 * 9-point sample system: sample keys [~, 7, +, a, h, ', z, b, ?] plus spacebar.
 * For unsampled keys: analyze each sample (pitch, spectral centroid, RMS, fade-out),
 * then target properties = weighted average by distance to sample points.
 * Play the nearest sample adjusted (playbackRate, volume) to match target.
 */

export type LayoutKey = {
    keyValue: string;
    keyLength: number;
    keyType: string;
};

export type KeyPosition = { keyValue: string; x: number; y: number };

export type SamplePointRole = 'nw' | 'nc' | 'ne' | 'w' | 'c' | 'e' | 'sw' | 'sc' | 'se' | 'space' | 'lshift' | 'rshift' | 'enter';

export type AnalyzedProps = {
    pitchHz: number;
    spectralCentroid: number;
    rms: number;
    fadeOutRate: number;
};

export type KeyPlayback = {
    sampleFile: string;
    playbackRate: number;
    volume: number;
};

/** 9 sample point keys: ~ (`), 7, + (=), a, h, ' (quote), z, b, ? (/). Maps keyValue -> role. n=nc, s=sc. */
export const SAMPLE_KEY_TO_ROLE: Record<string, SamplePointRole> = {
    '`': 'nw',
    '7': 'nc',
    '=': 'ne',
    a: 'w',
    h: 'c',
    "'": 'e',
    z: 'sw',
    b: 'sc',
    '/': 'se',
};

export const GRID_ROLES: SamplePointRole[] = ['nw', 'nc', 'ne', 'w', 'c', 'e', 'sw', 'sc', 'se'];

/**
 * Build key positions (center x, y in key units) from layout.
 */
export function buildKeyPositions(layout: LayoutKey[][]): KeyPosition[] {
    const positions: KeyPosition[] = [];
    for (let row = 0; row < layout.length; row++) {
        let x = 0;
        for (const k of layout[row]) {
            positions.push({
                keyValue: k.keyValue,
                x: x + k.keyLength / 2,
                y: row + 0.5,
            });
            x += k.keyLength;
        }
    }
    return positions;
}

/**
 * Get positions of the 9 sample keys from the layout.
 */
export function getSampleKeyPositions(
    keyPositions: KeyPosition[]
): Partial<Record<SamplePointRole, { x: number; y: number }>> {
    const out: Partial<Record<SamplePointRole, { x: number; y: number }>> = {};
    for (const kp of keyPositions) {
        const role = SAMPLE_KEY_TO_ROLE[kp.keyValue];
        if (role && role !== 'space') out[role] = { x: kp.x, y: kp.y };
    }
    return out;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Inverse-distance weights to available sample key positions. Normalized so they sum to 1.
 * Returns null if no sample positions are in the layout.
 */
function inverseDistanceWeights(
    keyPos: { x: number; y: number },
    samplePositions: Partial<Record<SamplePointRole, { x: number; y: number }>>,
    eps: number = 0.1
): Record<SamplePointRole, number> | null {
    const weights: Partial<Record<SamplePointRole, number>> = {};
    let sum = 0;
    for (const role of GRID_ROLES) {
        const pos = samplePositions[role];
        if (!pos) continue;
        const d = dist(keyPos, pos);
        const w = 1 / (d + eps);
        weights[role] = w;
        sum += w;
    }
    if (sum <= 0) return null;
    const out: Record<SamplePointRole, number> = {} as Record<SamplePointRole, number>;
    for (const role of GRID_ROLES) {
        out[role] = (weights[role] ?? 0) / sum;
    }
    return out;
}

/**
 * Weighted average of analyzed properties: (A*x% + Z*y% + ~*z% + ...) / 1.
 */
function weightedAverageProps(
    weights: Record<SamplePointRole, number>,
    analyzedByRole: Record<SamplePointRole, AnalyzedProps>
): AnalyzedProps {
    let pitchHz = 0;
    let spectralCentroid = 0;
    let rms = 0;
    let fadeOutRate = 0;
    for (const role of GRID_ROLES) {
        const w = weights[role];
        const p = analyzedByRole[role];
        if (!p || w <= 0) continue;
        pitchHz += w * p.pitchHz;
        spectralCentroid += w * p.spectralCentroid;
        rms += w * p.rms;
        fadeOutRate += w * p.fadeOutRate;
    }
    return { pitchHz, spectralCentroid, rms, fadeOutRate };
}

/**
 * Precompute per-key playback from analyzed sample properties.
 * Target properties = weighted average by distance; play nearest sample adjusted to match.
 * Cached on page load so no computation at keydown.
 */
export function buildKeyPlaybackCache(
    layout: LayoutKey[][],
    packSamples: Record<string, string>,
    packPath: string,
    analyzedByRole: Record<SamplePointRole, AnalyzedProps>
): Map<string, KeyPlayback> {
    const keyPositions = buildKeyPositions(layout);
    const samplePositions = getSampleKeyPositions(keyPositions);
    const cache = new Map<string, KeyPlayback>();

    const basePlaybackRate = 1.25;

    const longModRoles: { cacheKey: string; role: 'space' | 'lshift' | 'rshift' | 'enter' }[] = [
        { cacheKey: ' ', role: 'space' },
        { cacheKey: 'ShiftLeft', role: 'lshift' },
        { cacheKey: 'ShiftRight', role: 'rshift' },
        { cacheKey: 'Enter', role: 'enter' },
    ];
    for (const { cacheKey, role } of longModRoles) {
        const sampleFile = packSamples[role];
        if (sampleFile) {
            cache.set(cacheKey, {
                sampleFile: `${packPath}/${sampleFile}`,
                playbackRate: basePlaybackRate,
                volume: 1,
            });
        }
    }

    for (const kp of keyPositions) {
        if (kp.keyValue === ' ' || kp.keyValue === 'Shift' || kp.keyValue === 'Enter') {
            continue;
        }

        const role = SAMPLE_KEY_TO_ROLE[kp.keyValue];
        if (role && role !== 'space') {
            const sampleFile = packSamples[role];
            if (sampleFile) {
                cache.set(kp.keyValue, {
                    sampleFile: `${packPath}/${sampleFile}`,
                    playbackRate: basePlaybackRate,
                    volume: 1,
                });
            }
            continue;
        }

        const weights = inverseDistanceWeights(kp, samplePositions);
        if (!weights) continue;

        const target = weightedAverageProps(weights, analyzedByRole);
        let bestRole: SamplePointRole = 'c';
        let bestW = 0;
        for (const r of GRID_ROLES) {
            if (weights[r] > bestW) {
                bestW = weights[r];
                bestRole = r;
            }
        }
        if (bestW <= 0) continue;

        const base = analyzedByRole[bestRole];
        if (!base) continue;

        const sampleFile = packSamples[bestRole];
        if (!sampleFile) continue;

        const pitchRatio = target.pitchHz / base.pitchHz;
        const playbackRate = basePlaybackRate * Math.max(0.5, Math.min(1.5, pitchRatio));
        const rmsRatio = target.rms / base.rms;
        const volume = Math.max(0.5, Math.min(1, rmsRatio));

        cache.set(kp.keyValue, {
            sampleFile: `${packPath}/${sampleFile}`,
            playbackRate,
            volume,
        });
    }
    return cache;
}
