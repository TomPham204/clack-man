import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
   return (
			<div className='w-full flex justify-between align-center p-3 shadow-md my-2 sticky'>
				<div>
					<Link href='/' className='underline underline-offset-4'>
						<Image
							src='/icons/clackman-icon.png'
							alt='Clackman logo'
							fill={true}
						/>
					</Link>
				</div>
				<div className='flex align-center gap-4'>
					<Link href='/' className='underline underline-offset-4'>
						Home
					</Link>
					<Link href='/' className='underline underline-offset-4'>
						Chart
					</Link>
					<Link href='/' className='underline underline-offset-4'>
						Partners
					</Link>
				</div>
			</div>
		);
}