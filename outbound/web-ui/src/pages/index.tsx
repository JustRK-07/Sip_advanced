import { useState } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AiOutlineWarning,
  AiOutlinePlus,
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineEdit,
  AiOutlineShoppingCart,
  AiOutlineEye,
} from "react-icons/ai";
import { 
  Phone, 
  BarChart3,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { RealTimeDashboard } from "@/components/RealTimeDashboard";
import { AgentStatus } from "@/components/AgentStatus";
import Link from "next/link";


export default function Dashboard() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseCountry, setPurchaseCountry] = useState("US");
  const [purchaseAreaCode, setPurchaseAreaCode] = useState("");

  // Fetch overall stats for dashboard
  const { data: overallStats } = api.campaign.getOverallStats.useQuery(
    undefined,
    { 
      refetchInterval: 10000, // Refresh every 10 seconds
      refetchOnWindowFocus: true
    }
  );

  // Fetch campaigns for quick management
  const { data: campaigns } = api.campaign.getAll.useQuery();

  // Fetch numbers stats and data
  const { data: numbersStats } = api.numbers.getStats.useQuery();
  const { data: numbers } = api.numbers.getAll.useQuery();

  // Fetch agents stats and data
  const { data: agentsStats } = api.agents.getStats.useQuery();
  const { data: agents } = api.agents.getAll.useQuery();

  // Mutations for quick actions
  const { mutate: updateStatus } = api.campaign.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Campaign status updated!");
    },
  });

  // Twilio number purchase mutation
  const { mutate: purchaseNumber, isPending: isPurchasing } = api.numbers.purchase.useMutation({
    onSuccess: () => {
      toast.success("Phone number purchased successfully!");
      setShowPurchaseModal(false);
      setPurchaseAreaCode("");
    },
    onError: (error) => {
      toast.error(`Failed to purchase number: ${error.message}`);
    },
  });

  const handlePurchaseNumber = () => {
    if (!purchaseAreaCode) {
      toast.error("Please enter an area code");
      return;
    }
    // Generate a mock phone number for now - in real implementation, you'd search available numbers first
    const mockPhoneNumber = `+1${purchaseAreaCode}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
    purchaseNumber({
      phoneNumber: mockPhoneNumber,
      friendlyName: `Purchased Number ${purchaseAreaCode}`,
      capabilities: ["voice", "sms"],
    });
  };


  const handleQuickStatusUpdate = (campaignId: string, status: "ACTIVE" | "PAUSED") => {
    updateStatus({ id: campaignId, status });
  };

  // Calculate summary statistics
  const todayStats = {
    totalCalls: overallStats?.totalCalls || 0,
    completedCalls: overallStats?.completedCalls || 0,
    successRate: overallStats?.successRate ? (overallStats.successRate * 100).toFixed(1) : "0",
    activeCampaigns: campaigns?.filter(c => c.status === "ACTIVE").length || 0
  };

  return (
    <>
      <Head>
        <title>Campaign Dashboard</title>
        <meta name="description" content="Campaign Management Dashboard" />
      </Head>
      <div className="container mx-auto">
        {/* Professional Dashboard Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6 text-[#5bc0be]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
                    <p className="text-[#6fffe9] mt-1">Real-time performance monitoring & analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-200">System Online</span>
                  </div>
                  <div className="text-sm text-[#5bc0be]">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AgentStatus />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Stats Overview */}
        <div className="mb-8">
          <RealTimeDashboard />
        </div>


        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Professional Campaign Management Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
                    <p className="text-gray-600">Monitor and control your active campaigns</p>
                  </div>
                </div>
                <Link href="/campaigns">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <AiOutlinePlus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </Link>
              </div>


              {/* Professional Active Campaigns List */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Active Campaigns</h3>
                  <Link href="/campaigns">
                    <Button variant="outline" className="text-[#5bc0be] border-[#3a506b] hover:bg-[#1c2541]">
                      View All
                    </Button>
                  </Link>
                </div>
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-2">
                    {campaigns
                      .filter(campaign => campaign.status === "ACTIVE" || campaign.status === "PAUSED")
                      .slice(0, 5)
                      .map((campaign) => (
                      <div key={campaign.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${campaign.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900">{campaign.name}</h4>
                              <div className="flex items-center space-x-3 mt-0.5">
                                <p className="text-xs text-gray-600">{campaign._count.leads} leads</p>
                                <Badge className={`text-xs px-2 py-0.5 ${campaign.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}`}>
                                  {campaign.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link href="/campaigns">
                              <Button variant="outline" size="sm" className="text-[#5bc0be] border-[#3a506b] hover:bg-[#1c2541] h-7 px-2 text-xs">
                                <AiOutlineEdit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            {campaign.status === "ACTIVE" ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(campaign.id, "PAUSED")}
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 h-7 px-2 text-xs"
                              >
                                <AiOutlinePauseCircle className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(campaign.id, "ACTIVE")}
                                className="text-green-600 border-green-200 hover:bg-green-50 h-7 px-2 text-xs"
                              >
                                <AiOutlinePlayCircle className="h-3 w-3 mr-1" />
                                Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AiOutlineWarning className="h-12 w-12 mx-auto mb-2" />
                    <p>No active campaigns</p>
                    <Link href="/campaigns">
                      <Button className="mt-2">Create Your First Campaign</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>


            {/* Professional Phone Number Management */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Phone Numbers</h3>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <AiOutlineShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>
              
              {/* Professional Phone Numbers List */}
              <div className="space-y-3 mb-6">
                {numbers?.slice(0, 3).map((number) => (
                  <div key={number.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{number.number}</p>
                      <p className="text-xs text-gray-600">{number.country} • ${number.monthlyCost}/mo</p>
                    </div>
                    <Badge className={number.status === "AVAILABLE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                      {number.status}
                    </Badge>
                  </div>
                ))}
                {(!numbers || numbers.length === 0) && (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No phone numbers purchased yet</p>
                  </div>
                )}
              </div>
              
              <Link href="/number-management">
                <Button variant="outline" className="w-full text-[#5bc0be] border-[#3a506b] hover:bg-[#1c2541]">
                  <AiOutlineEye className="h-4 w-4 mr-2" />
                  View All Numbers
                </Button>
              </Link>
            </div>

          </div>

        {/* Purchase Number Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Purchase Phone Number</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={purchaseCountry}
                    onChange={(e) => setPurchaseCountry(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Code (optional)
                  </label>
                  <input
                    type="text"
                    value={purchaseAreaCode}
                    onChange={(e) => setPurchaseAreaCode(e.target.value)}
                    placeholder="e.g., 555"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchaseNumber}
                  disabled={isPurchasing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPurchasing ? "Purchasing..." : "Purchase Number"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
