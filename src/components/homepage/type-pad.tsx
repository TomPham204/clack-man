'use client';
import { useEffect, useState } from 'react';

export default function TypePad() {
	const layouts = {
		tsangan: tsanganLayout,
	};
	const [selectedSw, setSelectedSw] = useState('hb');
	const [layout, setLayout] = useState(layouts.tsangan);
	const [alphaColor, setAlphaColor] = useState('#fcfbf6ff');
	const [modColor, setModColor] = useState('#141414ff');
	const [accentColor, setAccentColor] = useState('#5e26a7ff');
	const [enableAccent, setEnableAccent] = useState(false);

	return (
		<div className='flex flex-col gap-2 w-full rounded-lg shadow-lg drop-shadow-lg p-5'>
			{layout.map((r, i) => (
				<Keyrow
					key={i}
					rowData={r}
					colors={{ alphaColor, modColor, accentColor }}
					enableAccent={enableAccent}
				/>
			))}
		</div>
	);
}

type KeyrowProps = {
	rowData: {
		keyName: string;
		keyLength: number;
		keyType: string;
		keyAccentAvailable: boolean;
	}[];
	colors: { accentColor: string; modColor: string; alphaColor: string };
	enableAccent?: boolean;
};

function Keyrow({ rowData, colors, enableAccent = false }: KeyrowProps) {
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
						style={{
							width: `${60 * k.keyLength}px`,
							height: '60px',
							backgroundColor: bg,
							color: legend,
							alignItems: k.keyType == 'alpha' ? 'flex-start' : 'center',
						}}
						className='capitalize text-md rounded-md shadow-sm drop-shadow-sm flex items-center justify-center text-white cursor-pointer brightness-100 hover:opacity-[0.85] focus:opacity-[0.8] active:opacity-[0.8] active:translate-y-[2px] active:scale-[0.98] transition-all ease-in-out duration-150 flex justify-start p-2'
					>
						{k.keyName}
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

const tsanganLayout = [
	[
		// Row: alpha row
		{ keyName: 'Esc', keyLength: 1, keyType: 'mod', keyAccentAvailable: true },
		{ keyName: '1', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '2', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '3', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '4', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '5', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '6', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '7', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '8', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '9', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '0', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '-', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '=', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{
			keyName: 'Del',
			keyLength: 1,
			keyType: 'alpha',
			keyAccentAvailable: false,
		},
		{
			keyName: 'Bksp',
			keyLength: 1,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
	],
	[
		// Row: Tab + Q-P
		{
			keyName: 'Tab',
			keyLength: 1.5,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{ keyName: 'q', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'w', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'e', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'r', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 't', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'y', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'u', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'i', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'o', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'p', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '[', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: ']', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '\\', keyLength: 1.5, keyType: 'mod', keyAccentAvailable: false },
	],
	[
		// Row: Caps / A - L / Enter
		{
			keyName: 'CapsLock',
			keyLength: 1.75,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{ keyName: 'a', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 's', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'd', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'f', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'g', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'h', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'j', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'k', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'l', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: ';', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: "'", keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{
			keyName: 'Ent',
			keyLength: 2.25,
			keyType: 'mod',
			keyAccentAvailable: true,
		},
	],
	[
		// Row: Shift / Z - M / Shift
		{
			keyName: 'Shift',
			keyLength: 2.25,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{ keyName: 'z', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'x', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'c', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'v', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'b', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'n', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: 'm', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: ',', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '.', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{ keyName: '/', keyLength: 1, keyType: 'alpha', keyAccentAvailable: false },
		{
			keyName: 'Shift',
			keyLength: 1.75,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{ keyName: 'Fn', keyLength: 1, keyType: 'mod', keyAccentAvailable: false },
	],
	[
		// Row: Bottom mods
		{
			keyName: 'Ctrl',
			keyLength: 1.5,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{
			keyName: 'Win',
			keyLength: 1,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{
			keyName: 'Alt',
			keyLength: 1.5,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{
			keyName: '',
			keyLength: 7,
			keyType: 'mod',
			keyAccentAvailable: true,
		},
		{
			keyName: 'AltGr',
			keyLength: 1.5,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{
			keyName: 'Win',
			keyLength: 1,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
		{
			keyName: 'Ctrl',
			keyLength: 1.5,
			keyType: 'mod',
			keyAccentAvailable: false,
		},
	],
];
