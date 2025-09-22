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
  Square,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
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
        {/* Professional Dashboard Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6 text-blue-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
                    <p className="text-blue-100 mt-1">Real-time performance monitoring & analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-200">System Online</span>
                  </div>
                  <div className="text-sm text-blue-200">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <AgentStatus />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Stats Overview */}
        <div className="mb-8">
          <RealTimeDashboard />
        </div>

        {/* Professional Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Calls */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">{overallStats?.totalCalls || 0}</div>
              <p className="text-sm text-blue-700 font-medium">Total Calls</p>
              <p className="text-xs text-blue-600 mt-1">
                +{overallStats?.completedCalls || 0} completed today
              </p>
            </CardContent>
          </Card>

          {/* Active Agents */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 mb-1">{agentsStats?.activeAgents || 0}</div>
              <p className="text-sm text-emerald-700 font-medium">Active Agents</p>
              <p className="text-xs text-emerald-600 mt-1">
                of {agentsStats?.totalAgents || 0} total agents
              </p>
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+3</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">{numbersStats?.totalNumbers || 0}</div>
              <p className="text-sm text-purple-700 font-medium">Phone Numbers</p>
              <p className="text-xs text-purple-600 mt-1">
                {numbersStats?.availableNumbers || 0} available
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="p-2 bg-amber-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+2.1%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 mb-1">{overallStats?.successRate ? (overallStats.successRate * 100).toFixed(1) : "0"}%</div>
              <p className="text-sm text-amber-700 font-medium">Conversion Rate</p>
              <p className="text-xs text-amber-600 mt-1">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>
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

              {/* Professional Quick Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Total Calls</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{todayStats.totalCalls}</p>
                      <div className="flex items-center mt-2">
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+8% today</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <AiOutlinePhone className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">Completed</p>
                      <p className="text-3xl font-bold text-emerald-900 mt-1">{todayStats.completedCalls}</p>
                      <div className="flex items-center mt-2">
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+12% today</span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-500 rounded-lg">
                      <AiOutlineCheck className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Success Rate</p>
                      <p className="text-3xl font-bold text-purple-900 mt-1">{todayStats.successRate}%</p>
                      <div className="flex items-center mt-2">
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+2.1% this week</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <AiOutlineRobot className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Active Campaigns</p>
                      <p className="text-3xl font-bold text-amber-900 mt-1">{todayStats.activeCampaigns}</p>
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                        <span className="text-xs text-green-600">Running</span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-500 rounded-lg">
                      <AiOutlinePlayCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Active Campaigns List */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Active Campaigns</h3>
                  <Link href="/campaigns">
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      View All
                    </Button>
                  </Link>
                </div>
                {campaigns && campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns
                      .filter(campaign => campaign.status === "ACTIVE" || campaign.status === "PAUSED")
                      .slice(0, 5)
                      .map((campaign) => (
                      <div key={campaign.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${campaign.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{campaign.name}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-600">{campaign._count.leads} leads</p>
                                <Badge className={campaign.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}>
                                  {campaign.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Link href="/campaigns">
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                <AiOutlineEdit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            {campaign.status === "ACTIVE" ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(campaign.id, "PAUSED")}
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              >
                                <AiOutlinePauseCircle className="h-4 w-4 mr-1" />
                                Pause
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleQuickStatusUpdate(campaign.id, "ACTIVE")}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <AiOutlinePlayCircle className="h-4 w-4 mr-1" />
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

          {/* Professional Recent Activity Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                    <p className="text-gray-600">Live updates from your campaigns</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {["today", "week", "month"].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe as "today" | "week" | "month")}
                      className={selectedTimeframe === timeframe ? "bg-blue-600 hover:bg-blue-700" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                    >
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className={`p-6 border-l-4 rounded-r-xl ${getActivityColor(activity.type, activity.status)} hover:shadow-md transition-all duration-300`}>
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-white/50 rounded-lg">
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{activity.message}</p>
                        {activity.campaignName && (
                          <p className="text-xs text-gray-600 mb-2 font-medium">{activity.campaignName}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <AiOutlineClockCircle className="h-3 w-3 text-gray-500" />
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          {activity.status && (
                            <Badge className="ml-2 text-xs">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
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
                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                  <AiOutlineEye className="h-4 w-4 mr-2" />
                  View All Numbers
                </Button>
              </Link>
            </div>

            {/* Professional Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-4">
                <Link href="/campaigns">
                  <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <AiOutlinePlus className="h-4 w-4 mr-3" />
                    Create New Campaign
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50">
                    <AiOutlinePhone className="h-4 w-4 mr-3" />
                    Make Test Call
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button variant="outline" className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50">
                    <AiOutlineUser className="h-4 w-4 mr-3" />
                    Upload Leads
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50">
                    <AiOutlineEdit className="h-4 w-4 mr-3" />
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
