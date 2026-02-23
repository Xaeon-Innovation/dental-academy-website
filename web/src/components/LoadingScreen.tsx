import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black">
      <div className="animate-pulse-scale">
        <Image
          src="/images/logo/logoTransparent.png"
          alt="Loading"
          width={200}
          height={70}
          className="max-w-[200px] w-auto h-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
