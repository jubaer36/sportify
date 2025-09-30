import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center bg-cover bg-center bg-no-repeat bg-sky-100 text-foreground p-6 background-photo">
      {/* Brighter overlay for readability */}
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="relative z-20 flex flex-col items-center -translate-y-10">
        {/* Logo with border radius */}
        <Image
          src="/Photos/logo2.png"
          alt="App Logo"
          width={700}
          height={300}
          priority
          className="rounded-4xl shadow-lg"
        />

        {/* Tagline + Arrow */}
        <h1 className="mt-6 text-6xl font-extrabold sm:text-4xl flex items-center gap-3">
          Connect with the sports world
          <Link href="/login">
            <span className="cursor-pointer text-3xl transition-all duration-200 hover:scale-1000 hover:text-blue-700 hover:border-b-4 hover:border-blue-700">
              ➜
            </span>
          </Link>
        </h1>
      </div>
    </div>
  );
}
