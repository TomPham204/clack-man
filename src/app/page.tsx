import Switch from '@/components/homepage/switch';
import SwitchTest from '@/components/homepage/switch-test';
import TypePad from '@/components/homepage/type-pad';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Clack man',
	description: 'Clack man by Tom Pham',
	icons: {
		icon: '/icons/icon.png',
	},
};

export default function Home() {
	return (
		<>
			<div className='w-full flex items-center justify-between p-3'>
				<Switch />
			</div>
			<div className='w-full p-3'>
				<SwitchTest />
			</div>
			<div className='w-full max-w-6xl mx-auto'>
				<TypePad />
			</div>
		</>
	);
}
