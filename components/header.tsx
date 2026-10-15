"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Studio" },
  { href: "/battle", label: "Battle" },
  { href: "/feed", label: "Feed" },
];

function NavLinks({ id }: { id: string }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              active ? "text-ink" : "text-lavender hover:text-bone"
            }`}
          >
            {active && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-full bg-mint shadow-[0_6px_20px_-6px_rgba(85,240,176,.7)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function Header() {
  return (
    <>
      <header className="sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-2rem)] max-w-6xl">
        <div className="glass flex items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2 sm:pl-5">
          <Link href="/" className="group flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-bone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/chog/main.jpg"
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-white/15 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
            />
            <span>
              Chog <span className="text-mint">Echo</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full bg-ink/60 p-1 md:flex">
            <NavLinks id="nav-pill-desktop" />
          </nav>

          <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: "avatar", largeScreen: "address" }} />
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="glass fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-sm items-center justify-between rounded-full p-1 md:hidden"
      >
        <NavLinks id="nav-pill-mobile" />
      </nav>
    </>
  );
}
