import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Bot
} from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";

// Import the existing components
import AgentManagementContent from "@/components/AgentManagementContent";
import AIAgentContent from "@/components/AIAgentContent";

export default function Agents() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"management" | "control">("management");

  // Handle URL parameters for tab switching and room parameters
  useEffect(() => {
    if (router.isReady) {
      const tab = router.query.tab as string;
      const room = router.query.room as string;
      
      if (tab === "control") {
        setActiveTab("control");
      } else {
        setActiveTab("management");
      }
      
      // If there's a room parameter, switch to control tab
      if (room) {
        setActiveTab("control");
      }
    }
  }, [router.isReady, router.query]);

  // Handle tab switching with URL updates
  const handleTabChange = (tab: "management" | "control") => {
    setActiveTab(tab);
    const query = { ...router.query };
    if (tab === "management") {
      delete query.tab;
    } else {
      query.tab = tab;
    }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
              <p className="text-gray-600 mt-1">Manage and control your AI agents</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("management")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "management"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>Agent Management</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange("control")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "control"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AiOutlineRobot className="h-4 w-4" />
                  <span>AI Agent Control</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "management" && <AgentManagementContent />}
          {activeTab === "control" && <AIAgentContent />}
        </div>
      </div>
    </div>
  );
}
