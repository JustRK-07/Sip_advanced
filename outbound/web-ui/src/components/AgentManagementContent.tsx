import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bot, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Phone,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  MessageSquare,
  Zap
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AgentForm {
  name: string;
  description: string;
  prompt: string;
  model: string;
  voice: string;
  temperature: number;
  maxTokens: number;
}

export default function AgentManagementContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState<string | null>(null);
  const [testAgent, setTestAgent] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Form state
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: "",
    description: "",
    prompt: "",
    model: "gpt-4",
    voice: "nova",
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Fetch data
  const { data: agents, refetch: refetchAgents } = api.agents.getAll.useQuery();
  const { data: stats } = api.agents.getStats.useQuery();
  const { data: realTimeStatus } = api.agents.getRealTimeStatus.useQuery(
    undefined,
    { 
      refetchInterval: 5000, // Refresh every 5 seconds
      refetchOnWindowFocus: true
    }
  );

  // Mutations
  const createAgentMutation = api.agents.create.useMutation({
    onSuccess: (data) => {
      setCreateDialogOpen(false);
      setAgentForm({ name: "", description: "", prompt: "", model: "gpt-4", voice: "nova", temperature: 0.7, maxTokens: 1000 });
      void refetchAgents();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateAgentMutation = api.agents.update.useMutation({
    onSuccess: (data) => {
      setEditDialogOpen(false);
      setSelectedAgent(null);
      void refetchAgents();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deployAgentMutation = api.agents.deploy.useMutation({
    onSuccess: (data) => {
      setIsDeploying(null);
      void refetchAgents();
      toast.success(data.message);
    },
    onError: (error) => {
      setIsDeploying(null);
      toast.error(error.message);
    },
  });

  const stopAgentMutation = api.agents.stop.useMutation({
    onSuccess: (data) => {
      setIsStopping(null);
      void refetchAgents();
      toast.success(data.message);
    },
    onError: (error) => {
      setIsStopping(null);
      toast.error(error.message);
    },
  });

  const deleteAgentMutation = api.agents.delete.useMutation({
    onSuccess: (data) => {
      void refetchAgents();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateAgent = () => {
    createAgentMutation.mutate(agentForm);
  };

  const handleEditAgent = (agent: any) => {
    setSelectedAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description || "",
      prompt: agent.prompt,
      model: agent.model,
      voice: agent.voice,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAgent = () => {
    if (!selectedAgent) return;
    updateAgentMutation.mutate({
      id: selectedAgent.id,
      ...agentForm,
    });
  };

  const handleDeployAgent = (agentId: string) => {
    setIsDeploying(agentId);
    deployAgentMutation.mutate({ id: agentId });
  };

  const handleStopAgent = (agentId: string) => {
    setIsStopping(agentId);
    stopAgentMutation.mutate({ id: agentId });
  };

  const handleDeleteAgent = (agentId: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      deleteAgentMutation.mutate({ id: agentId });
    }
  };

  const handleTestAgent = (agent: any) => {
    setTestAgent(agent);
    setShowTestModal(true);
  };

  const getStatusColor = (status: string, isRunning?: boolean) => {
    if (isRunning && status === "ACTIVE") {
      return "bg-green-100 text-green-800 border-green-200";
    }
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-gray-100 text-gray-800";
      case "DEPLOYING": return "bg-yellow-100 text-yellow-800";
      case "ERROR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string, isRunning?: boolean) => {
    if (isRunning && status === "ACTIVE") {
      return <Play className="h-4 w-4 text-green-600" />;
    }
    switch (status) {
      case "ACTIVE": return <CheckCircle className="h-4 w-4" />;
      case "INACTIVE": return <XCircle className="h-4 w-4" />;
      case "DEPLOYING": return <Clock className="h-4 w-4" />;
      case "ERROR": return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getRealTimeStatus = (agentId: string) => {
    return realTimeStatus?.find(status => status.id === agentId);
  };

  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Create Agent Button */}
      <div className="mb-6 flex justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Configure your AI agent with custom prompts and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                    placeholder="e.g., Sales Agent"
                  />
                </div>
                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={agentForm.model} onValueChange={(value) => setAgentForm({...agentForm, model: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={agentForm.description}
                  onChange={(e) => setAgentForm({...agentForm, description: e.target.value})}
                  placeholder="Brief description of this agent's purpose"
                />
              </div>
              <div>
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={agentForm.prompt}
                  onChange={(e) => setAgentForm({...agentForm, prompt: e.target.value})}
                  placeholder="Enter the system prompt that defines how this agent should behave..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="voice">Voice</Label>
                  <Select value={agentForm.voice} onValueChange={(value) => setAgentForm({...agentForm, voice: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={agentForm.temperature}
                    onChange={(e) => setAgentForm({...agentForm, temperature: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={agentForm.maxTokens}
                    onChange={(e) => setAgentForm({...agentForm, maxTokens: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
            <p className="text-xs text-muted-foreground">
              All created agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeAgents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deploying</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.deployingAgents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently deploying
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DEPLOYING">Deploying</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>
            Manage your AI agents and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAgents?.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No agents found</p>
              <p className="text-sm text-gray-400">Create your first agent to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgents?.map((agent) => {
                const realTime = getRealTimeStatus(agent.id);
                return (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(agent.status, realTime?.isRunning)}
                      <Badge className={getStatusColor(agent.status, realTime?.isRunning)}>
                        {realTime?.isRunning ? "RUNNING" : agent.status}
                      </Badge>
                      {realTime?.isRunning && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">Live</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {agent.model}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          {agent.voice}
                        </span>
                        {agent.phoneNumber && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {agent.phoneNumber.number}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {agent._count.conversations} calls
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.conversionRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">Conversion</p>
                    </div>
                    <div className="flex space-x-2">
                      {!realTime?.isRunning && (agent.status === "INACTIVE" || agent.status === "ERROR") && (
                        <Button 
                          size="sm" 
                          onClick={() => handleDeployAgent(agent.id)}
                          disabled={isDeploying === agent.id}
                          className="bg-green-600 hover:bg-green-700"
                          title="Launch Agent - Start Python process"
                        >
                          {isDeploying === agent.id ? (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Launching...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Launch
                            </>
                          )}
                        </Button>
                      )}
                      {realTime?.isRunning && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTestAgent(agent)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                            title="Test Agent - Voice/Chat Communication"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStopAgent(agent.id)}
                            disabled={isStopping === agent.id}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                          >
                            {isStopping === agent.id ? (
                              <Clock className="h-3 w-3" />
                            ) : (
                              <Square className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                      {agent.status === "ACTIVE" && !realTime?.isRunning && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStopAgent(agent.id)}
                          disabled={isStopping === agent.id}
                        >
                          {isStopping === agent.id ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditAgent(agent)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update your agent configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input
                  id="edit-name"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-model">AI Model</Label>
                <Select value={agentForm.model} onValueChange={(value) => setAgentForm({...agentForm, model: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={agentForm.description}
                onChange={(e) => setAgentForm({...agentForm, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-prompt">System Prompt</Label>
              <Textarea
                id="edit-prompt"
                value={agentForm.prompt}
                onChange={(e) => setAgentForm({...agentForm, prompt: e.target.value})}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-voice">Voice</Label>
                <Select value={agentForm.voice} onValueChange={(value) => setAgentForm({...agentForm, voice: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova">Nova</SelectItem>
                    <SelectItem value="alloy">Alloy</SelectItem>
                    <SelectItem value="echo">Echo</SelectItem>
                    <SelectItem value="fable">Fable</SelectItem>
                    <SelectItem value="onyx">Onyx</SelectItem>
                    <SelectItem value="shimmer">Shimmer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-temperature">Temperature</Label>
                <Input
                  id="edit-temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={agentForm.temperature}
                  onChange={(e) => setAgentForm({...agentForm, temperature: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxTokens">Max Tokens</Label>
                <Input
                  id="edit-maxTokens"
                  type="number"
                  min="1"
                  max="4000"
                  value={agentForm.maxTokens}
                  onChange={(e) => setAgentForm({...agentForm, maxTokens: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent} disabled={updateAgentMutation.isPending}>
                {updateAgentMutation.isPending ? "Updating..." : "Update Agent"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Agent Modal */}
      {showTestModal && testAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Test Agent: {testAgent.name}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTestModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Agent Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Agent Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span> {testAgent.model}
                  </div>
                  <div>
                    <span className="font-medium">Voice:</span> {testAgent.voice}
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span> {testAgent.temperature}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      RUNNING
                    </span>
                  </div>
                </div>
              </div>

              {/* Communication Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Communication Options</h4>
                
                {/* Voice Test */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Voice Test
                    </h5>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => window.open(`/agents?tab=control&room=agent-${testAgent.id}`, '_blank')}
                    >
                      Start Voice Call
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Opens a new tab with LiveKit voice interface to test the agent with real-time voice communication.
                  </p>
                </div>

                {/* Chat Test */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat Test
                    </h5>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/agents?tab=control&room=agent-${testAgent.id}&mode=chat`, '_blank')}
                    >
                      Start Chat
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Opens a new tab with text-based chat interface to test the agent's responses.
                  </p>
                </div>

                {/* Direct Room Access */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Direct Access
                    </h5>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Room ID:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        agent-{testAgent.id}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(`agent-${testAgent.id}`)}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Use this room ID to connect directly to the agent from any LiveKit client.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Testing Instructions</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Click "Start Voice Call" to test voice communication</li>
                  <li>• Click "Start Chat" to test text-based communication</li>
                  <li>• The agent will use your custom prompt: "{testAgent.prompt}"</li>
                  <li>• Make sure your microphone is enabled for voice tests</li>
                  <li>• The agent should respond according to its configuration</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowTestModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
