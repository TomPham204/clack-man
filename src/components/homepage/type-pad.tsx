'use client';
import { useEffect, useRef, useState } from 'react';
import { tsanganLayout } from './keyboard-layouts/tsangan';

export default function TypePad() {
    const layouts = {
        tsangan: tsanganLayout,
    };
    const [layout, setLayout] = useState(layouts.tsangan);
    const [alphaColor, setAlphaColor] = useState('#fcfbf6ff');
    const [modColor, setModColor] = useState('#141414ff');
    const [accentColor, setAccentColor] = useState('#5e26a7ff');
    const [enableAccent, setEnableAccent] = useState(false);

    // store all key refs here, not per-row
    const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        function handleDown(e: KeyboardEvent) {
            e.preventDefault();
            e.stopPropagation();
            const ref = keyRefs.current[e.key];
            if (ref) ref.classList.add('pressed');
        }
        function handleUp(e: KeyboardEvent) {
            e.preventDefault();
            e.stopPropagation();
            const ref = keyRefs.current[e.key];
            if (ref) ref.classList.remove('pressed');
        }
        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, []);

    return (
        <div className='flex flex-col gap-2 w-full rounded-lg shadow-lg drop-shadow-lg p-5'>
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
        keyLabel: string;
        keyValue: string;
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
                            keyRefs.current[k.keyValue] = el;
                        }}
                        style={{
                            width: `${60 * k.keyLength}px`,
                            height: '60px',
                            backgroundColor: bg,
                            color: legend,
                            alignItems: k.keyType == 'alpha' ? 'flex-start' : 'center',
                        }}
                        className='capitalize text-md rounded-md shadow-sm drop-shadow-sm flex items-center justify-center cursor-pointer brightness-100 hover:opacity-[0.9] active:opacity-[0.8] active:translate-y-[2px] active:scale-[0.98] transition-all ease-in-out duration-150 flex justify-start p-2'
                        onClick={(e) => e.preventDefault()}
                    >
                        {k.keyLabel}
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

