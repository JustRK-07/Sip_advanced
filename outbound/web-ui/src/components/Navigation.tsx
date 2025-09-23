import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  AiOutlineDashboard,
  AiOutlinePhone,
  AiOutlineLogout,
  AiOutlineUser,
  AiOutlineSetting,
  AiOutlineRobot,
  AiOutlineMenu,
  AiOutlineClose,
} from "react-icons/ai";

function Navigation() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => router.pathname === path;

  // Ensure only one navigation instance is rendered
  useEffect(() => {
    if (navigationRef.current) {
      // Check if there are multiple navigation elements
      const existingNavigations = document.querySelectorAll('[data-navigation="main"]');
      if (existingNavigations.length > 1) {
        // Remove duplicate navigation elements
        for (let i = 1; i < existingNavigations.length; i++) {
          existingNavigations[i]?.remove();
        }
      }
    }
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);


  // Toggle navbar-expanded class on main content
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('navbar-expanded');
      } else {
        mainContent.classList.remove('navbar-expanded');
      }
    }
  }, [isOpen]);

  // Clean up any body overflow changes on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const navigationItems = [
    {
      href: "/",
      icon: AiOutlineDashboard,
      label: "Dashboard",
    },
    {
      href: "/campaigns",
      icon: AiOutlinePhone,
      label: "Campaigns",
    },
    {
      href: "/number-management",
      icon: AiOutlinePhone,
      label: "Number Management",
    },
    {
      href: "/agents",
      icon: AiOutlineRobot,
      label: "Agents",
    },
    {
      href: "/settings",
      icon: AiOutlineSetting,
      label: "Settings",
    },
  ];

  return (
    <div ref={navigationRef} data-navigation="main">
      {/* Toggle Button - Fixed at top-left corner */}
      <button
        id="toggleBtn"
        className="fixed top-4 left-4 z-50 p-3 bg-[#1c2541] text-[#6fffe9] rounded-lg shadow-lg hover:bg-[#3a506b] transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <AiOutlineClose className="h-6 w-6" />
        ) : (
          <AiOutlineMenu className="h-6 w-6" />
        )}
      </button>


      {/* Navbar - Slides in from left */}
      <div 
        className={`navbar ${isOpen ? 'active' : ''}`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a506b]">
          <div className="flex items-center">
            <AiOutlinePhone className="h-7 w-7 text-[#5bc0be]" />
            <span className="ml-2 text-lg font-semibold tracking-wide text-[#6fffe9]">AI Call Center</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-[#5bc0be] hover:text-[#6fffe9] hover:bg-[#3a506b] transition-colors duration-200"
            aria-label="Close navigation menu"
          >
            <AiOutlineClose className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive(item.href)
                    ? "bg-[#5bc0be] text-[#0b132b] shadow-lg"
                    : "text-[#5bc0be] hover:bg-[#3a506b] hover:text-[#6fffe9] hover:shadow-md"
                  }
                `}
              >
                <Icon className={`h-5 w-5 mr-3 transition-colors ${
                  isActive(item.href) ? "text-[#0b132b]" : "text-[#5bc0be] group-hover:text-[#6fffe9]"
                }`} />
                <span className="font-medium">{item.label}</span>
                {isActive(item.href) && (
                  <div className="ml-auto w-2 h-2 bg-[#0b132b] rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-[#3a506b]">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#3a506b]/50 mb-3">
            <div className="w-8 h-8 bg-[#5bc0be] rounded-full flex items-center justify-center">
              <AiOutlineUser className="h-4 w-4 text-[#0b132b]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#6fffe9] truncate">admin</p>
              <p className="text-xs text-[#5bc0be] truncate">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-[#5bc0be] hover:bg-[#3a506b] hover:text-[#6fffe9] transition-colors"
            onClick={logout}
          >
            <AiOutlineLogout className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export { Navigation };