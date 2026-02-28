/**
 * Analyze audio buffer to extract pitch, spectral centroid, RMS, and fade-out rate.
 * Used by the 9-point SFX system to compute per-sample properties for weighted interpolation.
 */

import Meyda from 'meyda';
import { AMDF } from 'pitchfinder';

const MEYDA_BUFFER_SIZE = 2048;

export type AnalyzedProps = {
    pitchHz: number;
    spectralCentroid: number;
    spectralRolloff: number;
    rms: number;
    fadeOutRate: number;
};

/**
 * Compute RMS of a Float32Array segment.
 */
function rms(samples: Float32Array, start: number, length: number): number {
    let sum = 0;
    const end = Math.min(start + length, samples.length);
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    return end > start ? Math.sqrt(sum / (end - start)) : 0;
}

/**
 * Estimate fade-out rate: ratio of RMS in last 25% vs first 25% of the buffer.
 * Lower ratio = faster fade. Return as a factor in [0.1, 2] for use in gain curves.
 */
function fadeOutRate(samples: Float32Array): number {
    const len = samples.length;
    if (len < 100) return 1;
    const quarter = Math.floor(len / 4);
    const rmsFirst = rms(samples, 0, quarter);
    const rmsLast = rms(samples, len - quarter, quarter);
    if (rmsFirst <= 0) return 1;
    const ratio = rmsLast / rmsFirst;
    return Math.max(0.1, Math.min(2, ratio));
}

/**
 * Analyze an AudioBuffer and return pitch (Hz), spectral centroid (Hz), RMS, and fade-out rate.
 * Runs once per sample; call on page load and cache results.
 */
export function analyzeAudioBuffer(buffer: AudioBuffer): AnalyzedProps {
    const channel = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const length = channel.length;

    // Pitch: use pitchfinder with buffer's sample rate
    const pitchDetector = AMDF({ sampleRate, minFrequency: 80, maxFrequency: 800 });
    const pitchHz =
        pitchDetector(channel) ??
        pitchDetector(channel.slice(0, Math.min(length, Math.floor(sampleRate * 0.5)))) ??
        200;
    const clampedPitch = Math.max(80, Math.min(2000, pitchHz));

    // Meyda: needs power-of-2 buffer; use first MEYDA_BUFFER_SIZE samples or pad
    const meydaSignal = new Float32Array(MEYDA_BUFFER_SIZE);
    const copyLen = Math.min(length, MEYDA_BUFFER_SIZE);
    meydaSignal.set(channel.subarray(0, copyLen));
    Meyda.bufferSize = MEYDA_BUFFER_SIZE;
    Meyda.sampleRate = sampleRate;
    const features = Meyda.extract(['rms', 'spectralCentroid', 'spectralRolloff'], meydaSignal) as {
        rms?: number;
        spectralCentroid?: number;
        spectralRolloff?: number;
    } | null;
    const rmsVal = features?.rms ?? rms(channel, 0, length);
    const spectralCentroid =
        typeof features?.spectralCentroid === 'number' && Number.isFinite(features.spectralCentroid)
            ? features.spectralCentroid
            : 1000;
    const spectralRolloff =
        typeof features?.spectralRolloff === 'number' && Number.isFinite(features.spectralRolloff)
            ? features.spectralRolloff
            : 4000;

    const fade = fadeOutRate(channel);

    return {
        pitchHz: clampedPitch,
        spectralCentroid: Math.max(100, Math.min(10000, spectralCentroid)),
        spectralRolloff: Math.max(200, Math.min(15000, spectralRolloff)),
        rms: Math.max(1e-6, rmsVal),
        fadeOutRate: fade,
    };
}
