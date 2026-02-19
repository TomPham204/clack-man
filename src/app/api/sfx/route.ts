import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SFX_DIR = path.join(process.cwd(), 'public', 'sfx');
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.webm']);

/** 9-point + space sample roles for positional SFX packs */
const PACK_SAMPLE_NAMES = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se', 'space'] as const;

function isPackFolder(dirPath: string): boolean {
    if (!fs.statSync(dirPath).isDirectory()) return false;
    const names = fs.readdirSync(dirPath).map((f) => path.basename(f, path.extname(f)).toLowerCase());
    return PACK_SAMPLE_NAMES.every((role) => names.includes(role));
}

function getPackSamples(dirPath: string): Record<string, string> {
    const files = fs.readdirSync(dirPath);
    const samples: Record<string, string> = {};
    for (const role of PACK_SAMPLE_NAMES) {
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
                if (Object.keys(samples).length === PACK_SAMPLE_NAMES.length) {
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
