"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  signInWithGoogle,
  signOut,
  onAuthStateChanged,
} from "../lib/firebase/auth";
import { useRouter } from "next/navigation";
import { UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

function useUserSession(initialUser) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email !== initialUser?.email) {
      router.refresh();
    }
  }, [user, initialUser, router]);

  return user;
}

const NavigationTabs = ({ tabs }) => {
  return tabs.map(tab => (
    <Link key={tab.name} href={tab.href} className="text-sm font-medium text-[#4284F3] hover:text-blue-700 px-3 py-2 rounded-md">
      {tab.name}
    </Link>
  ));
};

export default function Header({ initialUser }) {
  const user = useUserSession(initialUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };

  const tabs = [
    { name: "Events", href: "/events" },
    { name: "Locations", href: "/locations" },
    // Add more tabs as needed
  ];

  return (
    <header className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg text-[#4284F3] flex justify-between items-center px-4 py-2 shadow-md">
      <div className="flex items-center">
        <Link href="/" className="text-lg font-bold cursor-pointer">
          YesEvent
        </Link>
        <div className="ml-10">
          <NavigationTabs tabs={tabs} />
        </div>
      </div>
      {user ? (
        <div className="relative">
          <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
            <UserCircleIcon className="h-6 w-6" />
            <span>{user.displayName.split(' ')[0]}</span>
            <ChevronDownIcon className="h-5 w-5" />	
          </div>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg z-50">
              <ul className="py-1 text-gray-700">
                <li                     className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={handleSignOut}>
                 
                    Logg ut
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="bg-[#4284F3] hover:bg-opacity-90 px-3 py-2 rounded text-sm shadow text-white"
        >
          Logg inn
        </button>
      )}
    </header>
  );
}
