import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Wallet, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Wallets() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isOpen, setIsOpen] = useState(false);

  // Fetch wallets
  const { data: walletsData, isLoading, refetch } = trpc.wallets.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Create wallet mutation
  const createWalletMutation = trpc.wallets.create.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetch();
        setIsOpen(false);
        setSelectedCurrency("USD");
      } else {
        toast.error(data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create wallet");
    },
  });

  const handleCreateWallet = () => {
    createWalletMutation.mutate({
      currencyCode: selectedCurrency,
    });
  };

  const handleCopyAddress = (address: string, currency: string) => {
    navigator.clipboard.writeText(address);
    setCopied(currency);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to view wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Wallets</h1>
            <p className="text-muted-foreground mt-2">Manage your multi-currency wallets</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wallet</DialogTitle>
                <DialogDescription>Add a new currency wallet to your account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <optgroup label="Fiat">
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="JPY">Japanese Yen (JPY)</option>
                      <option value="CAD">Canadian Dollar (CAD)</option>
                      <option value="AUD">Australian Dollar (AUD)</option>
                    </optgroup>
                    <optgroup label="Cryptocurrency">
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="LTC">Litecoin (LTC)</option>
                      <option value="XRP">Ripple (XRP)</option>
                    </optgroup>
                  </select>
                </div>
                <Button
                  onClick={handleCreateWallet}
                  disabled={createWalletMutation.isPending}
                  className="w-full"
                >
                  {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading wallets...
            </div>
          ) : walletsData?.success && walletsData.wallets && walletsData.wallets.length > 0 ? (
            walletsData.wallets.map((wallet) => (
              <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{wallet.currencyCode}</CardTitle>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${wallet.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {wallet.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <CardDescription>Balance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {parseFloat(wallet.balance).toFixed(8)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{wallet.currencyCode}</p>
                  </div>

                  {wallet.address && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Address</p>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs break-all text-foreground">
                          {wallet.address.substring(0, 20)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyAddress(wallet.address || "", wallet.currencyCode)}
                        >
                          {copied === wallet.currencyCode ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/transfer?wallet=${wallet.id}`)}
                    >
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/crypto?wallet=${wallet.id}`)}
                    >
                      Receive
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Created: {new Date(wallet.createdAt).toLocaleDateString()}</p>
                    <p>Updated: {new Date(wallet.updatedAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No wallets yet</p>
                    <Button onClick={() => setIsOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Wallet Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Wallet Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• Create separate wallets for different currencies to organize your assets</p>
            <p>• Cryptocurrency wallets will generate unique addresses for receiving deposits</p>
            <p>• Keep your wallet addresses safe and share them only with trusted sources</p>
            <p>• Always verify the currency before sending or receiving funds</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
