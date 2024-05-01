// NavigationTabs.js
import Link from "next/link";

const NavigationTabs = ({ tabs }) => {
  return tabs.map(tab => (
    <Link key={tab.name} href={tab.href} className="text-sm font-medium text-[#4284F3] hover:text-blue-700 px-3 py-2 rounded-md">
      {tab.name}
    </Link>
  ));
};

export default NavigationTabs;
