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

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.sidebar') && !target.closest('.hamburger')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      href: "/agent-management",
      icon: AiOutlineRobot,
      label: "Agent Management",
    },
    {
      href: "/ai-agent",
      icon: AiOutlineRobot,
      label: "AI Agent",
    },
    {
      href: "/settings",
      icon: AiOutlineSetting,
      label: "Settings",
    },
    {
      href: "/sip-settings",
      icon: AiOutlinePhone,
      label: "SIP Settings",
    },
  ];

  return (
    <div ref={navigationRef} data-navigation="main">
      {/* Mobile Header - Only visible on mobile */}
      <div key="mobile-header" className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 shadow-md border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <AiOutlinePhone className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-lg font-semibold tracking-wide text-white">AI Call Center</span>
          </div>
          <button
            className="hamburger p-2 rounded-md text-white hover:bg-slate-700 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <AiOutlineClose className="h-6 w-6" />
            ) : (
              <AiOutlineMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Only visible on desktop, slides in on mobile when open */}
      <div key="sidebar" className={`
        sidebar fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
      `}>
        {/* Logo/Brand */}
        <div className="flex items-center px-6 py-4 border-b border-slate-700">
          <AiOutlinePhone className="h-7 w-7 text-blue-400" />
          <span className="ml-2 text-lg font-semibold tracking-wide">AI Call Center</span>
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
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md"
                  }
                `}
              >
                <Icon className={`h-5 w-5 mr-3 transition-colors ${
                  isActive(item.href) ? "text-white" : "text-slate-400 group-hover:text-white"
                }`} />
                <span className="font-medium">{item.label}</span>
                {isActive(item.href) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-slate-700/50 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <AiOutlineUser className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">admin</p>
              <p className="text-xs text-slate-400 truncate">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            onClick={logout}
          >
            <AiOutlineLogout className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </div>
  );
}

export { Navigation };
