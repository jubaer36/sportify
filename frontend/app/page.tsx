import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-sky-100 text-foreground p-6">
      {/* Logo */}
      <Image
        src="/Photos/logo4.png"
        alt="App Logo"
        width={500}
        height={200}
        priority
      />

      {/* Tagline + Arrow */}
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl flex items-center gap-2">
        Connect with the sports world  
        <Link href="/login">
          <span className="cursor-pointer text-3xl transition-all duration-300 hover:scale-150 hover:text-blue-700 hover:border-b-2 hover:border-blue-700">
            ➜
          </span>
        </Link>
      </h1>
    </div>
  );
}
