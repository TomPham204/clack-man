'use client';

import dynamic from 'next/dynamic';

const SwitchViewer = dynamic(() => import('./switch-viewer'), {
	ssr: false,
	loading: () => (
		<div className="h-[280px] w-full max-w-[320px] rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
			Loading 3D…
		</div>
	),
});

export default function Switch() {
	return (
		<div className="relative w-full max-w-[320px] aspect-[1.1] min-h-[240px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm">
			<SwitchViewer />
		</div>
	);
}
