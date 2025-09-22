import { useState } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AiOutlinePhone,
  AiOutlineCheck,
  AiOutlineWarning,
  AiOutlineUser,
  AiOutlineRobot,
  AiOutlinePlus,
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineClockCircle,
  AiOutlineEdit,
  AiOutlineShoppingCart,
  AiOutlineEye,
} from "react-icons/ai";
import { 
  Phone, 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { RealTimeDashboard } from "@/components/RealTimeDashboard";
import { AgentStatus } from "@/components/AgentStatus";
import Link from "next/link";

type RecentActivity = {
  id: string;
  type: "call_completed" | "campaign_created" | "lead_uploaded" | "campaign_started";
  message: string;
  timestamp: Date;
  status?: string;
  campaignName?: string;
};

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "week" | "month">("today");
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
  const { mutate: purchaseNumber, isLoading: isPurchasing } = api.numbers.purchase.useMutation({
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

  // Mock recent activity data (in a real app, this would come from an API)
  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      type: "call_completed",
      message: "Call completed with lead interested in loan",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: "INTERESTED",
      campaignName: "Q4 Loan Campaign"
    },
    {
      id: "2", 
      type: "campaign_started",
      message: "Started campaign 'Holiday Loans'",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      campaignName: "Holiday Loans"
    },
    {
      id: "3",
      type: "call_completed", 
      message: "Call completed - callback requested",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      status: "CALLBACK_REQUESTED",
      campaignName: "Q4 Loan Campaign"
    },
    {
      id: "4",
      type: "lead_uploaded",
      message: "Uploaded 150 new leads to campaign",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      campaignName: "Small Business Loans"
    }
  ];

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case "call_completed":
        if (status === "INTERESTED") return <AiOutlineCheck className="h-4 w-4 text-green-500" />;
        if (status === "CALLBACK_REQUESTED") return <AiOutlinePhone className="h-4 w-4 text-yellow-500" />;
        return <AiOutlineCheck className="h-4 w-4 text-blue-500" />;
      case "campaign_created":
      case "campaign_started":
        return <AiOutlinePlayCircle className="h-4 w-4 text-green-500" />;
      case "lead_uploaded":
        return <AiOutlineUser className="h-4 w-4 text-blue-500" />;
      default:
        return <AiOutlineWarning className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case "call_completed":
        if (status === "INTERESTED") return "border-l-green-500 bg-green-50";
        if (status === "CALLBACK_REQUESTED") return "border-l-yellow-500 bg-yellow-50";
        return "border-l-blue-500 bg-blue-50";
      case "campaign_created":
      case "campaign_started":
        return "border-l-green-500 bg-green-50";
      case "lead_uploaded":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
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
      <main className="container mx-auto p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Monitor your campaigns and track performance in real-time</p>
            </div>
            <div className="mt-2">
              <AgentStatus />
            </div>
          </div>
        </div>

        {/* Real-time Stats Overview */}
        <div className="mb-8">
          <RealTimeDashboard />
        </div>

        {/* Comprehensive Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Calls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalCalls || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{overallStats?.completedCalls || 0} completed today
              </p>
            </CardContent>
          </Card>

          {/* Active Agents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentsStats?.activeAgents || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {agentsStats?.totalAgents || 0} total agents
              </p>
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phone Numbers</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numbersStats?.totalNumbers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {numbersStats?.availableNumbers || 0} available
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.successRate ? (overallStats.successRate * 100).toFixed(1) : "0"}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Campaign Management Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Campaign Management</h2>
                <Link href="/campaigns">
                  <Button>
                    <AiOutlinePlus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </Link>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Total Calls</p>
                      <p className="text-2xl font-bold text-blue-800">{todayStats.totalCalls}</p>
                    </div>
                    <AiOutlinePhone className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Completed</p>
                      <p className="text-2xl font-bold text-green-800">{todayStats.completedCalls}</p>
                    </div>
                    <AiOutlineCheck className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Success Rate</p>
                      <p className="text-2xl font-bold text-purple-800">{todayStats.successRate}%</p>
                    </div>
                    <AiOutlineRobot className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-700">Active Campaigns</p>
                      <p className="text-2xl font-bold text-indigo-800">{todayStats.activeCampaigns}</p>
                    </div>
                    <AiOutlinePlayCircle className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Active Campaigns List */}
              <div>
                <h3 className="text-lg font-medium mb-4">Active Campaigns</h3>
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns
                      .filter(campaign => campaign.status === "ACTIVE" || campaign.status === "PAUSED")
                      .slice(0, 5)
                      .map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${campaign.status === "ACTIVE" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                          <div>
                            <h4 className="font-medium">{campaign.name}</h4>
                            <p className="text-sm text-gray-600">{campaign._count.leads} leads • {campaign.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href="/campaigns">
                            <Button variant="outline" size="sm">
                              <AiOutlineEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {campaign.status === "ACTIVE" ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleQuickStatusUpdate(campaign.id, "PAUSED")}
                            >
                              <AiOutlinePauseCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleQuickStatusUpdate(campaign.id, "ACTIVE")}
                            >
                              <AiOutlinePlayCircle className="h-4 w-4" />
                            </Button>
                          )}
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

          {/* Recent Activity Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <div className="flex space-x-2">
                  {["today", "week", "month"].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe as "today" | "week" | "month")}
                    >
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className={`p-4 border-l-4 rounded-r-lg ${getActivityColor(activity.type, activity.status)}`}>
                    <div className="flex items-start space-x-3">
                      {getActivityIcon(activity.type, activity.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        {activity.campaignName && (
                          <p className="text-xs text-gray-600 mt-1">{activity.campaignName}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <AiOutlineClockCircle className="h-3 w-3 mr-1" />
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </div>
            </div>

            {/* Phone Number Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Phone Numbers</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <AiOutlineShoppingCart className="h-4 w-4 mr-1" />
                  Purchase
                </Button>
              </div>
              
              {/* Phone Numbers List */}
              <div className="space-y-2 mb-4">
                {numbers?.slice(0, 3).map((number) => (
                  <div key={number.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{number.number}</p>
                      <p className="text-xs text-gray-500">{number.country} • ${number.monthlyCost}/mo</p>
                    </div>
                    <Badge variant={number.status === "AVAILABLE" ? "default" : "secondary"}>
                      {number.status}
                    </Badge>
                  </div>
                ))}
                {(!numbers || numbers.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No phone numbers purchased yet</p>
                )}
              </div>
              
              <Link href="/number-management">
                <Button variant="outline" className="w-full">
                  <AiOutlineEye className="h-4 w-4 mr-2" />
                  View All Numbers
                </Button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/campaigns">
                  <Button className="w-full justify-start">
                    <AiOutlinePlus className="h-4 w-4 mr-2" />
                    Create New Campaign
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" className="w-full justify-start">
                    <AiOutlinePhone className="h-4 w-4 mr-2" />
                    Make Test Call
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" className="w-full justify-start">
                    <AiOutlineUser className="h-4 w-4 mr-2" />
                    Upload Leads
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <AiOutlineEdit className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
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
      </main>
    </>
  );
}
