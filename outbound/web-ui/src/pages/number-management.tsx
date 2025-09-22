import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Phone, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  MapPin,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  capabilities: any;
  locality: string;
  region: string;
  countryCode: string;
  monthlyCost: number;
}

export default function NumberManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Search form state
  const [searchForm, setSearchForm] = useState({
    country: "US",
    areaCode: "",
    contains: "",
    limit: 10,
  });

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    phoneNumber: "",
    friendlyName: "",
    capabilities: ["voice"],
  });

  // Fetch data
  const { data: numbers, refetch: refetchNumbers } = api.numbers.getAll.useQuery();
  const { data: stats } = api.numbers.getStats.useQuery();

  // Mutations
  const searchNumbersMutation = api.numbers.searchAvailable.useMutation({
    onSuccess: (data) => {
      setAvailableNumbers(data.numbers);
      setIsSearching(false);
      toast.success(`Found ${data.numbers.length} available numbers`);
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(error.message);
    },
  });

  const syncFromTwilioMutation = api.numbers.syncFromTwilio.useMutation({
    onSuccess: (data) => {
      void refetchNumbers();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const purchaseNumberMutation = api.numbers.purchase.useMutation({
    onSuccess: (data) => {
      setIsPurchasing(false);
      setPurchaseDialogOpen(false);
      setPurchaseForm({ phoneNumber: "", friendlyName: "", capabilities: ["voice"] });
      void refetchNumbers();
      toast.success(data.message);
    },
    onError: (error) => {
      setIsPurchasing(false);
      toast.error(error.message);
    },
  });

  const assignNumberMutation = api.numbers.assignToAgent.useMutation({
    onSuccess: (data) => {
      void refetchNumbers();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const releaseNumberMutation = api.numbers.releaseFromAgent.useMutation({
    onSuccess: (data) => {
      void refetchNumbers();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSearchNumbers = () => {
    setIsSearching(true);
    searchNumbersMutation.mutate(searchForm);
  };

  const handlePurchaseNumber = (number: AvailableNumber) => {
    setPurchaseForm({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities.voice ? ["voice"] : [],
    });
    setPurchaseDialogOpen(true);
  };

  const handleConfirmPurchase = () => {
    setIsPurchasing(true);
    purchaseNumberMutation.mutate(purchaseForm);
  };

  const handleAssignNumber = (phoneNumberId: string) => {
    // TODO: Open agent selection dialog
    toast.info("Agent selection dialog coming soon");
  };

  const handleReleaseNumber = (phoneNumberId: string) => {
    if (confirm("Are you sure you want to release this number?")) {
      releaseNumberMutation.mutate({ phoneNumberId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-800";
      case "ASSIGNED": return "bg-blue-100 text-blue-800";
      case "SUSPENDED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE": return <CheckCircle className="h-4 w-4" />;
      case "ASSIGNED": return <AlertCircle className="h-4 w-4" />;
      case "SUSPENDED": return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredNumbers = numbers?.filter((number) => {
    const matchesSearch = number.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         number.friendlyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || number.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Number Management</h1>
              <p className="text-gray-600 mt-1">Manage your Twilio phone numbers and assignments</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => syncFromTwilioMutation.mutate()}
                disabled={syncFromTwilioMutation.isLoading}
              >
                <Phone className="h-4 w-4 mr-2" />
                {syncFromTwilioMutation.isLoading ? "Syncing..." : "Sync from Twilio"}
              </Button>
              <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Search Numbers
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search Available Numbers</DialogTitle>
                    <DialogDescription>
                      Search for available phone numbers to purchase from Twilio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={searchForm.country} onValueChange={(value) => setSearchForm({...searchForm, country: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="areaCode">Area Code (Optional)</Label>
                      <Input
                        id="areaCode"
                        placeholder="e.g., 555"
                        value={searchForm.areaCode}
                        onChange={(e) => setSearchForm({...searchForm, areaCode: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contains">Contains (Optional)</Label>
                      <Input
                        id="contains"
                        placeholder="e.g., 123"
                        value={searchForm.contains}
                        onChange={(e) => setSearchForm({...searchForm, contains: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="limit">Number of Results</Label>
                      <Select value={searchForm.limit.toString()} onValueChange={(value) => setSearchForm({...searchForm, limit: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSearchNumbers} disabled={isSearching} className="w-full">
                      {isSearching ? "Searching..." : "Search Numbers"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Purchase Number
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalNumbers || 0}</div>
              <p className="text-xs text-muted-foreground">
                All purchased numbers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.availableNumbers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.assignedNumbers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently in use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.totalMonthlyCost?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground">
                Total monthly cost
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trial Account Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Trial Account Limitation</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your Twilio account is currently on a trial plan, which allows only one phone number. 
                To purchase additional numbers, please upgrade your Twilio account to a paid plan.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search numbers..."
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
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Numbers List */}
        <Card>
          <CardHeader>
            <CardTitle>Phone Numbers</CardTitle>
            <CardDescription>
              Manage your purchased phone numbers and their assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredNumbers?.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No phone numbers found</p>
                <p className="text-sm text-gray-400">Purchase your first number to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNumbers?.map((number) => (
                  <div key={number.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(number.status)}
                        <Badge className={getStatusColor(number.status)}>
                          {number.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{number.number}</p>
                        <p className="text-sm text-gray-600">{number.friendlyName}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {number.country}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${number.monthlyCost}/month
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(number.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {number.assignedAgent && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Assigned to</p>
                          <p className="text-xs text-gray-600">{number.assignedAgent.name}</p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        {number.status === "AVAILABLE" && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignNumber(number.id)}>
                            Assign
                          </Button>
                        )}
                        {number.status === "ASSIGNED" && (
                          <Button size="sm" variant="outline" onClick={() => handleReleaseNumber(number.id)}>
                            Release
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Dialog */}
        <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase Phone Number</DialogTitle>
              <DialogDescription>
                Confirm the purchase of this phone number from Twilio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Phone Number</Label>
                <Input value={purchaseForm.phoneNumber} disabled />
              </div>
              <div>
                <Label>Friendly Name</Label>
                <Input
                  value={purchaseForm.friendlyName}
                  onChange={(e) => setPurchaseForm({...purchaseForm, friendlyName: e.target.value})}
                  placeholder="Enter a friendly name for this number"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmPurchase} disabled={isPurchasing}>
                  {isPurchasing ? "Purchasing..." : "Purchase Number"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
