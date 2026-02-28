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
    spectralRolloff: number;
    rms: number;
    fadeOutRate: number;
};

export type KeyPlaybackLayer = {
    sampleFile: string;
    playbackRate: number;
    volume: number;
    gain: number;
};

export type KeyPlayback = {
    layers: KeyPlaybackLayer[];
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
    let spectralRolloff = 0;
    let rms = 0;
    let fadeOutRate = 0;
    for (const role of GRID_ROLES) {
        const w = weights[role];
        const p = analyzedByRole[role];
        if (!p || w <= 0) continue;
        pitchHz += w * p.pitchHz;
        spectralCentroid += w * p.spectralCentroid;
        spectralRolloff += w * p.spectralRolloff;
        rms += w * p.rms;
        fadeOutRate += w * p.fadeOutRate;
    }
    return { pitchHz, spectralCentroid, spectralRolloff, rms, fadeOutRate };
}

/** Number of nearest samples to blend for synthesized keys (2–3 sounds more like an average). */
const BLEND_TOP_N = 3;

/** Minimum weight to include a sample in the blend. */
const BLEND_MIN_WEIGHT = 0.05;

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
                layers: [
                    {
                        sampleFile: `${packPath}/${sampleFile}`,
                        playbackRate: basePlaybackRate,
                        volume: 1,
                        gain: 1,
                    },
                ],
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
                    layers: [
                        {
                            sampleFile: `${packPath}/${sampleFile}`,
                            playbackRate: basePlaybackRate,
                            volume: 1,
                            gain: 1,
                        },
                    ],
                });
            }
            continue;
        }

        const weights = inverseDistanceWeights(kp, samplePositions);
        if (!weights) continue;

        const target = weightedAverageProps(weights, analyzedByRole);

        // Timbre-aware weight: boost samples whose spectral centroid and fade are closer to target.
        const blendScores: { role: SamplePointRole; score: number }[] = [];
        for (const r of GRID_ROLES) {
            const posW = weights[r];
            if (posW < BLEND_MIN_WEIGHT) continue;
            const p = analyzedByRole[r];
            if (!p || !packSamples[r]) continue;
            const centroidNorm = 1 / (1 + Math.abs(target.spectralCentroid - p.spectralCentroid) / 2000);
            const rolloffNorm = 1 / (1 + Math.abs(target.spectralRolloff - p.spectralRolloff) / 3000);
            const fadeNorm = 1 / (1 + Math.abs(target.fadeOutRate - p.fadeOutRate));
            const timbreW = (centroidNorm + rolloffNorm + fadeNorm) / 3;
            blendScores.push({ role: r, score: posW * (0.7 + 0.3 * timbreW) });
        }
        blendScores.sort((a, b) => b.score - a.score);
        const top = blendScores.slice(0, BLEND_TOP_N);
        const scoreSum = top.reduce((s, t) => s + t.score, 0);
        if (scoreSum <= 0) continue;

        const layers: KeyPlaybackLayer[] = [];
        let weightedPitch = 0;
        let weightedRms = 0;
        for (const { role: r, score } of top) {
            const gain = score / scoreSum;
            const base = analyzedByRole[r];
            const sampleFile = packSamples[r];
            if (!base || !sampleFile) continue;
            weightedPitch += gain * base.pitchHz;
            weightedRms += gain * base.rms;
            layers.push({
                sampleFile: `${packPath}/${sampleFile}`,
                playbackRate: basePlaybackRate,
                volume: 1,
                gain,
            });
        }
        if (layers.length === 0) continue;

        const pitchRatio = target.pitchHz / weightedPitch;
        const playbackRate = basePlaybackRate * Math.max(0.5, Math.min(1.5, pitchRatio));
        const rmsRatio = target.rms / weightedRms;
        const volume = Math.max(0.5, Math.min(1.2, rmsRatio));

        for (const layer of layers) {
            layer.playbackRate = playbackRate;
            layer.volume = volume;
        }

        cache.set(kp.keyValue, { layers });
    }
    return cache;
}
