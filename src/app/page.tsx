import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Clack man',
    description: 'Clack man by Tom Pham',
    icons: {
        icon: "/icons/icon.png",
    },
};

export default function Home() {
    return (
        <><div>hello world</div>
            <div className="h-48 bg-red-500 ">hello world</div>
            <div className="h-48 bg-green-500 ">hello world</div>
            <div className="h-48 bg-blue-500 ">hello world</div>
            <div className="h-48 bg-orange-500 ">hello world</div>
            <div className="h-48 bg-cyan-500 ">hello world</div>
            <div className="h-48 bg-purple-500 ">hello world</div>
        </>

    );
}
