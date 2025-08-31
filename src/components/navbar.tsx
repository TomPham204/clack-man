import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    return (
        <div className='w-full flex justify-between items-center p-2 shadow-md mb-2 sticky'>
            <div>
                <Link href='/' className='underline underline-offset-4'>
                    <Image
                        src='/icons/icon.png'
                        alt='Clackman logo'
                        width={40}
                        height={40}
                        priority
                    />
                </Link>
            </div>
            <div className='flex items-center gap-4'>
                <Link href='/' className='underline underline-offset-4 h-fit'>
                    Home
                </Link>
                <Link href='/' className='underline underline-offset-4 h-fit'>
                    Chart
                </Link>
                <Link href='/' className='underline underline-offset-4 h-fit'>
                    Partners
                </Link>
            </div>
        </div>
    );
}
