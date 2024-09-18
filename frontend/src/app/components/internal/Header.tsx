import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import AddressBar from "../lib/AddressBar";
import ConnectButton from "../lib/Connect";
import MenuButton from "./MenuButton";

const Header = () => {
  const { address } = useAccount();
  const lastYRef = useRef(0);

  useEffect(() => {
    const nav = document.getElementById("nav");
    const handleScroll = () => {
      const difference = window.scrollY - lastYRef.current;
      if (Math.abs(difference) > 50) {
        if (difference > 0) {
          nav?.setAttribute("data-header", "scroll-hide");
        } else {
          nav?.setAttribute("data-header", "scroll-show");
        }
        lastYRef.current = window.scrollY;
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      onFocusCapture={(e) =>
        e.currentTarget.setAttribute("data-header", "scroll-show")
      }
      id="nav"
      className="fixed z-[9999] w-full px-2 pt-4 transition-all duration-500 md:px-8 md:pt-8"
    >
      <header className="rounded-[12px] bg-primary-gradient md:rounded-[32px]">
        <div className="mx-auto flex h-16 max-w-[--header-max-w] items-center justify-between px-4 md:h-28 md:px-8">
          <div className="hidden w-[18.75rem] md:block">
            <Link href={"/"}>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-extrabold text-headings leading-none tracking-tight">
                  STRK Loop
                </h1>
              </div>
            </Link>
          </div>
          <div className="relative">
            {address ? (
              <div className="flex items-center gap-4">
                <AddressBar />
                <MenuButton />
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;