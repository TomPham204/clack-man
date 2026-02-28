'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { tsanganLayout } from './keyboard-layouts/tsangan';
import { buildKeyPlaybackCache, GRID_ROLES, type SamplePointRole } from './sfx-9point';
import { analyzeAudioBuffer } from './audio-analysis';

type SfxPack = { id: string; name: string; samples: Record<string, string> };


export default function TypePad() {
    const layouts = {
        tsangan: tsanganLayout,
    };
    const [layout, setLayout] = useState(layouts.tsangan);
    const [alphaColor, setAlphaColor] = useState('#fcfbf6ff');
    const [modColor, setModColor] = useState('#141414ff');
    const [accentColor, setAccentColor] = useState('#5e26a7ff');
    const [enableAccent, setEnableAccent] = useState(false);
    const [sfxFiles, setSfxFiles] = useState<string[]>([]);
    const [sfxPacks, setSfxPacks] = useState<SfxPack[]>([]);
    const [selectedSfx, setSelectedSfx] = useState<string>('');
    const [packAnalyzedProps, setPackAnalyzedProps] = useState<Record<SamplePointRole, { pitchHz: number; spectralCentroid: number; rms: number; fadeOutRate: number }> | null>(null);
    const [packAnalysisLoading, setPackAnalysisLoading] = useState(false);

    const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/sfx')
            .then((res) => res.json())
            .then((data: { files?: string[]; packs?: SfxPack[] }) => {
                setSfxFiles(data.files ?? []);
                setSfxPacks(data.packs ?? []);
                if (!selectedSfx) {
                    if ((data.packs?.length ?? 0) > 0) setSelectedSfx(`pack:${data.packs![0].id}`);
                    else if ((data.files?.length ?? 0) > 0) setSelectedSfx(`file:${data.files![0]}`);
                }
            })
            .catch(() => {
                setSfxFiles([]);
                setSfxPacks([]);
            });
    }, []);

    const isPack = selectedSfx.startsWith('pack:');
    const packId = isPack ? selectedSfx.slice(5) : '';
    const pack = useMemo(() => sfxPacks.find((p) => p.id === packId) ?? null, [sfxPacks, packId]);

    useEffect(() => {
        if (!pack?.samples) {
            setPackAnalyzedProps(null);
            return;
        }
        let cancelled = false;
        setPackAnalysisLoading(true);
        if (typeof window === 'undefined') {
            setPackAnalysisLoading(false);
            return () => {};
        }
        const ctx = new AudioContext();
        const packPath = `sfx/${encodeURIComponent(pack.id)}`;
        const roles = GRID_ROLES;
        Promise.all(
            roles.map(async (role) => {
                const file = pack.samples[role];
                if (!file) return { role, props: null };
                const url = `/${packPath}/${encodeURIComponent(file)}`;
                const res = await fetch(url);
                if (!res.ok) return { role, props: null };
                const arrayBuffer = await res.arrayBuffer();
                const buffer = await ctx.decodeAudioData(arrayBuffer);
                const props = analyzeAudioBuffer(buffer);
                return { role, props };
            })
        )
            .then((results) => {
                if (cancelled) return;
                const byRole = {} as Record<SamplePointRole, { pitchHz: number; spectralCentroid: number; rms: number; fadeOutRate: number }>;
                let ok = true;
                for (const { role, props } of results) {
                    if (!props) {
                        ok = false;
                        continue;
                    }
                    byRole[role as SamplePointRole] = props;
                }
                if (ok && Object.keys(byRole).length >= 9) setPackAnalyzedProps(byRole);
                else setPackAnalyzedProps(null);
            })
            .catch(() => {
                if (!cancelled) setPackAnalyzedProps(null);
            })
            .finally(() => {
                if (!cancelled) setPackAnalysisLoading(false);
                ctx.close();
            });
        return () => {
            cancelled = true;
        };
    }, [pack?.id, pack?.samples]);

    const keyPlaybackCache = useMemo(() => {
        if (!pack?.samples || !packAnalyzedProps) return null;
        return buildKeyPlaybackCache(layout, pack.samples, `sfx/${pack.id}`, packAnalyzedProps);
    }, [layout, pack, packAnalyzedProps]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const cache = keyPlaybackCache;
        const usePack = isPack && cache;
        const singleFile = !isPack && selectedSfx.startsWith('file:') ? selectedSfx.slice(5) : '';

        function handleDown(e: KeyboardEvent) {
            e.preventDefault();
            e.stopPropagation();
            const refKey = e.code === 'ShiftLeft' ? 'ShiftLeft' : e.code === 'ShiftRight' ? 'ShiftRight' : e.key;
            const ref = keyRefs.current[refKey];
            if (ref) ref.classList.add('pressed');
            if (!selectedSfx) return;
            if (usePack && cache) {
                    const cacheKey = e.code === 'ShiftLeft' ? 'ShiftLeft' : e.code === 'ShiftRight' ? 'ShiftRight' : e.key;
                    const playback = cache.get(cacheKey);
                if (playback) {
                    const audio = new Audio(`/${playback.sampleFile}`);
                    audio.playbackRate = playback.playbackRate;
                    audio.volume = playback.volume;
                    audioRef.current = audio;
                    audio.play().catch(() => {});
                }
            } else if (singleFile) {
                const audio = new Audio(`/sfx/${singleFile}`);
                audio.playbackRate = 1.25;
                audioRef.current = audio;
                audio.play().catch(() => {});
            }
        }
        function handleUp(e: KeyboardEvent) {
            e.preventDefault();
            e.stopPropagation();
            const refKey = e.code === 'ShiftLeft' ? 'ShiftLeft' : e.code === 'ShiftRight' ? 'ShiftRight' : e.key;
            const ref = keyRefs.current[refKey];
            if (ref) ref.classList.remove('pressed');
        }
        el.addEventListener('keydown', handleDown);
        el.addEventListener('keyup', handleUp);
        return () => {
            el.removeEventListener('keydown', handleDown);
            el.removeEventListener('keyup', handleUp);
        };
    }, [selectedSfx, isPack, keyPlaybackCache]);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="application"
            aria-label="Typepad keyboard"
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('[data-sfx-controls]')) {
                    containerRef.current?.focus();
                }
            }}
            className='flex flex-col gap-2 w-full rounded-lg shadow-lg drop-shadow-lg p-5 outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset'
        >
            {(sfxFiles.length > 0 || sfxPacks.length > 0) && (
                <div data-sfx-controls className='flex items-center gap-2 mb-1'>
                    <label htmlFor='sfx-select' className='text-sm font-medium text-neutral-600'>
                        Typing sound
                    </label>
                    <select
                        id='sfx-select'
                        value={selectedSfx}
                        onChange={(e) => setSelectedSfx(e.target.value)}
                        className='rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500'
                    >
                        <option value=''>None</option>
                        {sfxFiles.map((file) => (
                            <option key={`file:${file}`} value={`file:${file}`}>
                                {file.includes('/') ? file.split('/')[0] : file.replace(/\.[^.]+$/, '')}
                            </option>
                        ))}
                        {sfxPacks.length > 0 && sfxFiles.length > 0 && <option disabled>──</option>}
                        {sfxPacks.map((p) => (
                            <option key={`pack:${p.id}`} value={`pack:${p.id}`}>
                                {p.name} (9-point)
                            </option>
                        ))}
                    </select>
                    {packAnalysisLoading && (
                        <span className='text-xs text-neutral-500'>Analyzing samples…</span>
                    )}
                </div>
            )}
            {layout.map((r, i) => (
                <Keyrow
                    key={i}
                    rowData={r}
                    colors={{ alphaColor, modColor, accentColor }}
                    enableAccent={enableAccent}
                    keyRefs={keyRefs}
                />
            ))}
        </div>
    );
}

type KeyrowProps = {
    rowData: {
        keyLabel: string[];
        keyValue: string;
        keyCode?: string;
        keyLength: number;
        keyType: string;
        keyAccentAvailable: boolean;
    }[];
    colors: { accentColor: string; modColor: string; alphaColor: string };
    enableAccent?: boolean;
    keyRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
};

function Keyrow({ rowData, colors, enableAccent = false, keyRefs }: KeyrowProps) {
    return (
        <div className='flex items-center w-full gap-2 justify-between'>
            {rowData.map((k, i) => {
                const bg = enableAccent
                    ? colors.accentColor
                    : k.keyType == 'mod'
                        ? colors.modColor
                        : colors.alphaColor;
                const legend = getContrastColor(bg);
                return (
                    <div
                        key={i}
                        ref={(el) => {
                            keyRefs.current[k.keyCode ?? k.keyValue] = el;
                        }}
                        style={{
                            width: `${80 * k.keyLength}px`,
                            height: '80px',
                            backgroundColor: bg,
                            color: legend,
                            alignItems: k.keyType == 'alpha' ? 'flex-start' : 'center',
                        }}
                        className={'capitalize text-md rounded-md shadow-sm drop-shadow-sm flex flex-col cursor-pointer brightness-100 hover:opacity-[0.9] active:opacity-[0.8] active:translate-y-[2px] active:scale-[0.98] transition-all ease-in-out duration-150 p-2.5 gap-0.5' + (k.keyType == 'alpha' ? ' justify-start items-start' : ' justify-center !items-start')}
                        onClick={(e) => e.preventDefault()}
                    >
                        {k.keyLabel.map((label, j) => (
                            <span key={j} className='text-lg font-medium'>{label}</span>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}


function getContrastColor(hex: string): string {
    // Remove leading #
    hex = hex.replace(/^#/, '');

    // Convert shorthand hex (#abc) → full form (#aabbcc)
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((ch) => ch + ch)
            .join('');
    }

    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [R, G, B] = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

