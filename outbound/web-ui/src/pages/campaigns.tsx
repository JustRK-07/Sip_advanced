import { useState } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AiOutlineLoading3Quarters,
  AiOutlineUpload,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineWarning,
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineEdit,
  AiOutlineRobot,
  AiOutlinePhone,
} from "react-icons/ai";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { ConversationDetails } from "@/components/ConversationDetails";
import { CampaignOutcomes } from "@/components/CampaignOutcomes";

type Campaign = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: Date;
  _count: {
    leads: number;
  };
  script?: string;
};

type Lead = {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  status: "PENDING" | "PROCESSED" | "FAILED" | "INTERESTED" | "NOT_INTERESTED" | "CALLBACK_REQUESTED" | "TRANSFERRED_TO_AGENT" | "WAITING_AGENT";
  errorReason: string | null;
  createdAt: Date;
  callCount?: number;
  source?: string;
  conversation?: Conversation | null;
};

type Conversation = {
  id: string;
  transcript?: string | null;
  results?: {
    outcome: string;
    summary: string;
    data: Record<string, string>;
    interest_status?: string;
    call_status?: string;
  } | null;
  callStartTime?: Date | null;
  callEndTime?: Date | null;
  duration?: number | null;
};

export default function Campaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [scriptContent, setScriptContent] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [testCallDialogOpen, setTestCallDialogOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");

  // Queries and Mutations
  const { data: campaigns, refetch: refetchCampaigns } = api.campaign.getAll.useQuery();
  
  const { data: campaignDetails, refetch: refetchDetails } = api.campaign.getDetails.useQuery(
    { id: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const { data: campaignStats } = api.campaign.getStats.useQuery(
    { id: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const { mutate: createCampaign, isPending: isCreating } = api.campaign.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      setNewCampaignName("");
      void refetchCampaigns();
    },
  });

  const { mutate: updateStatus } = api.campaign.updateStatus.useMutation({
    onSuccess: () => {
      void refetchCampaigns();
      if (selectedCampaign) void refetchDetails();
    },
  });

  const { mutate: uploadLeads, isPending: isUploading } = api.campaign.uploadLeads.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.count} leads!`);
      setCsvFile(null);
      if (selectedCampaign) void refetchDetails();
    },
  });

  const { mutate: updateScript, isPending: isUpdatingScript } = api.campaign.updateScript.useMutation({
    onSuccess: () => {
      toast.success("Script updated successfully!");
      setScriptDialogOpen(false);
      if (selectedCampaign) void refetchDetails();
    },
  });

  const { mutate: startCampaign, isPending: isStarting } = api.campaign.startCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign started successfully!");
      void refetchCampaigns();
      if (selectedCampaign) void refetchDetails();
    },
  });

  const { mutate: makeTestCall, isPending: isTestCalling } = api.livekit.makeCall.useMutation({
    onSuccess: () => {
      toast.success("Test call initiated successfully!");
      setTestCallDialogOpen(false);
      setTestPhoneNumber("");
    },
    onError: (error) => {
      toast.error(`Failed to make test call: ${error.message}`);
    },
  });

  const { mutate: makeRealCall, isPending: isRealCalling } = api.campaign.makeCall.useMutation({
    onSuccess: () => {
      toast.success("Real call initiated successfully!");
      setTestCallDialogOpen(false);
      setTestPhoneNumber("");
    },
    onError: (error) => {
      toast.error(`Failed to make real call: ${error.message}`);
    },
  });

  // Event Handlers
  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }
    createCampaign({ name: newCampaignName });
  };

  const handleStatusUpdate = (id: string, status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED") => {
    updateStatus({ id, status });
  };

  const handleFileUpload = async () => {
    if (!csvFile || !selectedCampaign) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result?.toString() || "";
      uploadLeads({ campaignId: selectedCampaign, content });
    };
    reader.readAsText(csvFile);
  };

  const toggleLeadExpansion = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const handleScriptUpdate = () => {
    if (!selectedCampaign || !scriptContent.trim()) return;
    updateScript({ id: selectedCampaign, script: scriptContent });
  };

  const handleStartCampaign = () => {
    if (!selectedCampaign) return;
    startCampaign({ id: selectedCampaign });
  };

  const handleTestCall = () => {
    if (!testPhoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    makeTestCall({ phoneNumber: testPhoneNumber });
  };

  const handleRealCall = () => {
    if (!testPhoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    const defaultScript = "Hi, this is a call from our loan department. I'm calling to see if you might be interested in learning about loan options we have available. Are you currently looking for any type of loan or financial assistance?";
    makeRealCall({
      phoneNumber: testPhoneNumber,
      script: defaultScript,
      useRealCall: true,
    });
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case "PROCESSED":
      case "COMPLETED":
        return <AiOutlineCheck className="h-5 w-5 text-green-500" />;
      case "INTERESTED":
      case "TRANSFERRED_TO_AGENT":
        return <AiOutlineCheck className="h-5 w-5 text-green-600" />;
      case "NOT_INTERESTED":
        return <AiOutlineClose className="h-5 w-5 text-red-500" />;
      case "CALLBACK_REQUESTED":
        return <AiOutlinePhone className="h-5 w-5 text-yellow-500" />;
      case "FAILED":
        return <AiOutlineWarning className="h-5 w-5 text-red-500" />;
      case "PENDING":
        return <AiOutlineClose className="h-5 w-5 text-gray-500" />;
      case "NO_ANSWER":
        return <AiOutlineClose className="h-5 w-5 text-yellow-500" />;
      case "VOICEMAIL":
        return <AiOutlineWarning className="h-5 w-5 text-orange-500" />;
      case "HUNG_UP":
        return <AiOutlineClose className="h-5 w-5 text-red-500" />;
      case "WAITING_AGENT":
        return <AiOutlineRobot className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PROCESSED":
      case "COMPLETED":
        return "text-green-600";
      case "INTERESTED":
      case "TRANSFERRED_TO_AGENT":
        return "text-green-700 font-semibold";
      case "NOT_INTERESTED":
        return "text-red-600";
      case "CALLBACK_REQUESTED":
        return "text-yellow-600";
      case "FAILED":
        return "text-red-600";
      case "PENDING":
        return "text-gray-600";
      case "NO_ANSWER":
        return "text-yellow-600";
      case "VOICEMAIL":
        return "text-orange-600";
      case "HUNG_UP":
        return "text-red-600";
      case "WAITING_AGENT":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  }

  return (
    <>
      <Head>
        <title>Campaign Management</title>
        <meta name="description" content="Campaign Management" />
      </Head>
      <Navigation />
      <main className="container mx-auto p-6">
        {/* Dashboard Toggle */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setTestCallDialogOpen(true)}
            >
              <AiOutlinePhone className="h-5 w-5 mr-2" />
              Test Call
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaigns List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Campaigns</h2>
              <Button
                variant="outline"
                onClick={() => setTestCallDialogOpen(true)}
              >
                <AiOutlinePhone className="h-5 w-5 mr-2" />
                Test Call
              </Button>
            </div>
            
            {/* Create Campaign Form */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="New Campaign Name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
              />
              <Button onClick={handleCreateCampaign} disabled={isCreating}>
                {isCreating ? (
                  <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>

            {/* Campaigns Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Leads</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns?.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className={`border-t ${
                        selectedCampaign === campaign.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="p-2 border">{campaign.name}</td>
                      <td className="p-2 border">{campaign.status}</td>
                      <td className="p-2 border">{campaign._count.leads}</td>
                      <td className="p-2 border">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={selectedCampaign === campaign.id ? "default" : "outline"}
                            onClick={() => setSelectedCampaign(campaign.id)}
                          >
                            View
                          </Button>
                          {campaign.status === "DRAFT" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCampaign(campaign.id);
                                  setScriptContent(campaign.script || "");
                                  setScriptDialogOpen(true);
                                }}
                              >
                                <AiOutlineEdit className="h-5 w-5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartCampaign()}
                                disabled={isStarting}
                              >
                                {isStarting ? (
                                  <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                                ) : (
                                  <AiOutlinePlayCircle className="h-5 w-5" />
                                )}
                              </Button>
                            </>
                          )}
                          {campaign.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusUpdate(campaign.id, "PAUSED")
                              }
                            >
                              <AiOutlinePauseCircle className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Details */}
          {selectedCampaign && campaignDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">
                Campaign: {campaignDetails.name}
              </h2>

              {/* Campaign Stats */}
              {campaignStats && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Total Leads</div>
                      <div className="text-2xl font-semibold">
                        {campaignStats.totalLeads}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Processed</div>
                      <div className="text-2xl font-semibold">
                        {campaignStats.processedLeads}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Failed</div>
                      <div className="text-2xl font-semibold">
                        {campaignStats.failedLeads}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Completed Calls</div>
                      <div className="text-2xl font-semibold">
                        {campaignStats.completedCalls}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Outcomes */}
                  {campaignStats.completedCalls > 0 && (
                    <div className="mb-6">
                      <CampaignOutcomes
                        outcomes={campaignStats.outcomes}
                        totalCalls={campaignStats.completedCalls}
                        callStatuses={{
                          "PROCESSED": campaignStats.processedLeads,
                          "FAILED": campaignStats.failedLeads,
                          "PENDING": campaignStats.totalLeads - campaignStats.processedLeads - campaignStats.failedLeads
                        }}
                        realtimeData={{
                          activeCallsCount: campaignDetails.leads.filter((lead) => lead.status === "WAITING_AGENT").length,
                          completedToday: campaignDetails.leads.filter((lead) => 
                            (lead as any).conversation?.callEndTime && 
                            new Date((lead as any).conversation.callEndTime).toDateString() === new Date().toDateString()
                          ).length,
                          callbacksScheduled: campaignDetails.leads.filter((lead) => lead.status === "CALLBACK_REQUESTED").length
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* CSV Upload */}
              <div className="grid grid-cols-4 items-center gap-4 mb-6">
                <Input
                  type="file"
                  accept=".csv"
                  className="col-span-3"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <Button
                  onClick={handleFileUpload}
                  className="col-span-1"
                  disabled={!csvFile || isUploading}
                >
                  {isUploading ? (
                    <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                  ) : (
                    <AiOutlineUpload className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Leads Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Phone</th>
                      <th className="p-2 border">Name</th>
                      <th className="p-2 border">Email</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignDetails.leads.map((lead) => (
                      <>
                        <tr
                          key={lead.id}
                          className={`border-t cursor-pointer hover:bg-gray-50 ${
                            lead.status === "FAILED" ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="p-2 border">{lead.phoneNumber}</td>
                          <td className="p-2 border">{lead.name || "-"}</td>
                          <td className="p-2 border">{lead.email || "-"}</td>
                          <td className="p-2 border">
                            <div className="flex items-center justify-center">
                              {getStatusIcon(lead.status)}
                              <span className={`ml-2 ${getStatusColor(lead.status)}`}>
                                {lead.status}
                                {lead.errorReason && (
                                  <span className="block text-xs text-gray-500">
                                    {lead.errorReason}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 border text-center">
                            {(lead as any).conversation && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedConversation((lead as any).conversation || null)
                                }
                              >
                                View Call
                              </Button>
                            )}
                          </td>
                        </tr>
                        {expandedLeads.has(lead.id) && lead.errorReason && (
                          <tr className="bg-red-50">
                            <td colSpan={5} className="p-4 border">
                              <div className="text-red-600">
                                <strong>Error:</strong> {lead.errorReason}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Script Editor Dialog */}
        <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Edit Campaign Script</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                className="min-h-[300px]"
                placeholder="Enter the AI conversation script..."
              />
              <Button onClick={handleScriptUpdate} disabled={isUpdatingScript}>
                {isUpdatingScript ? (
                  <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                ) : (
                  "Save Script"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Call Dialog */}
        <Dialog open={testCallDialogOpen} onOpenChange={setTestCallDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Make a Call</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestCall} 
                  disabled={isTestCalling || isRealCalling}
                  variant="outline"
                  className="flex-1"
                >
                  {isTestCalling ? (
                    <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <AiOutlineRobot className="h-5 w-5 mr-2" />
                  )}
                  {isTestCalling ? "Calling..." : "Test Call"}
                </Button>
                
                <Button 
                  onClick={handleRealCall} 
                  disabled={isTestCalling || isRealCalling}
                  className="flex-1"
                >
                  {isRealCalling ? (
                    <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <AiOutlinePhone className="h-5 w-5 mr-2" />
                  )}
                  {isRealCalling ? "Calling..." : "Real Call"}
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Test Call:</strong> Uses LiveKit SIP for testing (no real phone call)</p>
                <p><strong>Real Call:</strong> Uses Twilio to make actual phone calls</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Conversation Details Dialog */}
        {selectedConversation && (
          <ConversationDetails
            open={!!selectedConversation}
            onOpenChange={(open) => !open && setSelectedConversation(null)}
            conversation={selectedConversation}
          />
        )}
      </main>
    </>
  );
} 