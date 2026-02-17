import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SFX_DIR = path.join(process.cwd(), 'public', 'sfx');
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.webm']);

export async function GET() {
    try {
        if (!fs.existsSync(SFX_DIR)) {
            return NextResponse.json({ files: [] });
        }
        const files = fs
            .readdirSync(SFX_DIR)
            .filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()))
            .sort();
        return NextResponse.json({ files });
    } catch (err) {
        console.error('Failed to read sfx directory:', err);
        return NextResponse.json({ files: [] }, { status: 500 });
    }
}
