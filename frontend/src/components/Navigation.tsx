import React from "react";
import WalletBar from "./WalletBar";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="text-2xl font-bold leading-none flex items-center">
          <Link href="/" className="hover:text-gray-300">STRK Loop</Link>
        </div>
        <ul className="hidden md:flex space-x-4 ml-8 items-center h-full">
          <li>
            <Link href="/create-subscription" className="hover:text-gray-300">
              Create Subscription
            </Link>
          </li>
        </ul>
        <div className="ml-auto flex items-center h-full">
          <WalletBar />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
