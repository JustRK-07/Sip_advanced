import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  AiOutlineDashboard,
  AiOutlinePhone,
  AiOutlineLogout,
  AiOutlineUser,
  AiOutlineSetting,
} from "react-icons/ai";

export function Navigation() {
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md border-b border-slate-700">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <AiOutlinePhone className="h-7 w-7 text-blue-400" />
              <span className="ml-2 text-lg font-semibold tracking-wide">AI Call Center</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive("/")
                    ? "bg-slate-700 text-blue-400"
                    : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
                }`}
              >
                <AiOutlineDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/campaigns"
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive("/campaigns")
                    ? "bg-slate-700 text-blue-400"
                    : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
                }`}
              >
                <AiOutlinePhone className="h-5 w-5 mr-2" />
                Campaigns
              </Link>
              <Link
                href="/settings"
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive("/settings")
                    ? "bg-slate-700 text-blue-400"
                    : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
                }`}
              >
                <AiOutlineSetting className="h-5 w-5 mr-2" />
                Settings
              </Link>
              <Link
                href="/sip-settings"
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive("/sip-settings")
                    ? "bg-slate-700 text-blue-400"
                    : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
                }`}
              >
                <AiOutlinePhone className="h-5 w-5 mr-2" />
                SIP Settings
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-md bg-slate-700/50">
                <AiOutlineUser className="h-5 w-5 text-blue-400" />
                <span className="text-slate-300">admin</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-slate-700 hover:text-blue-400"
              onClick={logout}
            >
              <AiOutlineLogout className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-center mt-4 space-x-2">
          <Link
            href="/"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive("/")
                ? "bg-slate-700 text-blue-400"
                : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
            }`}
          >
            <AiOutlineDashboard className="h-5 w-5 mr-2" />
            Dashboard
          </Link>
          <Link
            href="/campaigns"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive("/campaigns")
                ? "bg-slate-700 text-blue-400"
                : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
            }`}
          >
            <AiOutlinePhone className="h-5 w-5 mr-2" />
            Campaigns
          </Link>
          <Link
            href="/settings"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive("/settings")
                ? "bg-slate-700 text-blue-400"
                : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
            }`}
          >
            <AiOutlineSetting className="h-5 w-5 mr-2" />
            Settings
          </Link>
          <Link
            href="/sip-settings"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive("/sip-settings")
                ? "bg-slate-700 text-blue-400"
                : "text-slate-300 hover:bg-slate-700 hover:text-blue-400"
            }`}
          >
            <AiOutlinePhone className="h-5 w-5 mr-2" />
            SIP Settings
          </Link>
        </div>
      </div>
    </nav>
  );
} 