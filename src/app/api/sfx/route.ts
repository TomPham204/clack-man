import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SFX_DIR = path.join(process.cwd(), 'public', 'sfx');
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.webm']);

/** 9-point (nc/sc) + space + long mods. Required for a pack: 9 grid + space. */
const PACK_REQUIRED_NAMES = ['nw', 'nc', 'ne', 'w', 'c', 'e', 'sw', 'sc', 'se', 'space'] as const;
const PACK_ALL_SAMPLE_NAMES = [...PACK_REQUIRED_NAMES, 'lshift', 'rshift', 'enter'] as const;

function isPackFolder(dirPath: string): boolean {
    if (!fs.statSync(dirPath).isDirectory()) return false;
    const names = fs.readdirSync(dirPath).map((f) => path.basename(f, path.extname(f)).toLowerCase());
    return PACK_REQUIRED_NAMES.every((role) => names.includes(role));
}

function getPackSamples(dirPath: string): Record<string, string> {
    const files = fs.readdirSync(dirPath);
    const samples: Record<string, string> = {};
    for (const role of PACK_ALL_SAMPLE_NAMES) {
        const found = files.find(
            (f) => AUDIO_EXT.has(path.extname(f).toLowerCase()) && path.basename(f, path.extname(f)).toLowerCase() === role
        );
        if (found) samples[role] = found;
    }
    return samples;
}

export async function GET() {
    try {
        if (!fs.existsSync(SFX_DIR)) {
            return NextResponse.json({ files: [], packs: [] });
        }
        const entries = fs.readdirSync(SFX_DIR, { withFileTypes: true });
        const files = entries
            .filter((e) => e.isFile() && AUDIO_EXT.has(path.extname(e.name).toLowerCase()))
            .map((e) => e.name)
            .sort();
        const packs: { id: string; name: string; samples: Record<string, string> }[] = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const dirPath = path.join(SFX_DIR, entry.name);
            if (isPackFolder(dirPath)) {
                const samples = getPackSamples(dirPath);
                if (Object.keys(samples).length >= PACK_REQUIRED_NAMES.length) {
                    packs.push({
                        id: entry.name,
                        name: entry.name,
                        samples: { ...samples },
                    });
                }
                continue;
            }
            const dirFiles = fs.readdirSync(dirPath).filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()));
            if (dirFiles.length === 1) {
                files.push(`${entry.name}/${dirFiles[0]}`);
            }
        }
        files.sort();
        return NextResponse.json({ files, packs });
    } catch (err) {
        console.error('Failed to read sfx directory:', err);
        return NextResponse.json({ files: [], packs: [] }, { status: 500 });
    }
}
