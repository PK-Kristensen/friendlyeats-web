// UserDropdown.js
import React, { useState } from "react";
import { UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

const UserDropdown = ({ user, onSignOut }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
        <UserCircleIcon className="h-6 w-6" />
        <span>{user.displayName.split(' ')[0]}</span>
        <ChevronDownIcon className="h-5 w-5" />
      </div>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg z-50">
          <ul className="py-1 text-gray-700">
            <li className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={onSignOut}>
              Logg ut
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
