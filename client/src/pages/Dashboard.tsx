import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Send, Plus, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user wallets
  const { data: walletsData, isLoading: walletsLoading } = trpc.wallets.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = trpc.transactions.list.useQuery(
    { limit: 5, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Fetch portfolio value
  const { data: portfolioData } = trpc.wallets.getPortfolioValue.useQuery(
    { baseCurrency: "USD" },
    { enabled: isAuthenticated }
  );

  // Fetch wallet distribution
  const { data: distributionData } = trpc.wallets.getDistribution.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Biometric Wallet</CardTitle>
            <CardDescription>Please log in to access your dashboard</CardDescription>
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

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name || "User"}</h1>
          <p className="text-muted-foreground mt-2">Manage your digital wallet and track your assets</p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${portfolioData?.success && portfolioData.totalValue ? portfolioData.totalValue.toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {walletsData?.success && walletsData.wallets ? walletsData.wallets.length : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currencies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {transactionsData?.success && transactionsData.transactions ? transactionsData.transactions.length : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
              <CardDescription>Asset allocation by currency</CardDescription>
            </CardHeader>
            <CardContent>
              {distributionData?.success && distributionData.distribution && distributionData.distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData.distribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ currency, percentage }) => `${currency} ${(percentage as number).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {distributionData.distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balances</CardTitle>
              <CardDescription>Your current holdings</CardDescription>
            </CardHeader>
            <CardContent>
              {walletsData?.success && walletsData.wallets && walletsData.wallets.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={walletsData.wallets?.map(w => ({
                      currency: w.currencyCode,
                      balance: parseFloat(w.balance),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="balance" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No wallets yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center"
            onClick={() => setLocation("/wallets")}
          >
            <Plus className="w-6 h-6 mb-2" />
            <span>Add Wallet</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center"
            onClick={() => setLocation("/transfer")}
          >
            <Send className="w-6 h-6 mb-2" />
            <span>Send Money</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center"
            onClick={() => setLocation("/crypto")}
          >
            <ArrowDownLeft className="w-6 h-6 mb-2" />
            <span>Deposit Crypto</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center"
            onClick={() => setLocation("/transactions")}
          >
            <Wallet className="w-6 h-6 mb-2" />
            <span>View History</span>
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transaction activity</CardDescription>
          </CardHeader>
          <CardContent>
              {transactionsData?.success && transactionsData.transactions && transactionsData.transactions.length > 0 ? (
              <div className="space-y-4">
                {transactionsData.transactions?.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {tx.transactionType === "transfer" || tx.transactionType === "deposit" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.transactionType}</p>
                        <p className="text-sm text-muted-foreground">{tx.description || "Transaction"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.transactionType === "withdrawal" ? "text-red-600" : "text-green-600"}`}>
                        {tx.transactionType === "withdrawal" ? "-" : "+"}{tx.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Start by adding a wallet or making a transfer.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
