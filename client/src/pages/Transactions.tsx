import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Download, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type TransactionType = "transfer" | "deposit" | "withdrawal" | "exchange";
type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export default function Transactions() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | "all">("all");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch transactions
  const { data: transactionsData, isLoading, refetch } = trpc.transactions.list.useQuery(
    {
      limit: 100,
      offset: 0,
      type: selectedType === "all" ? undefined : selectedType,
      status: selectedStatus === "all" ? undefined : selectedStatus,
    },
    { enabled: isAuthenticated }
  );

  const handleExport = (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      if (transactionsData?.success && transactionsData.transactions) {
        const transactions = transactionsData.transactions;

        if (format === "json") {
          const json = JSON.stringify(transactions, null, 2);
          const element = document.createElement("a");
          element.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(json)}`);
          element.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.json`);
          element.style.display = "none";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        } else {
          const headers = ["ID", "Type", "Status", "Amount", "Fee", "Date", "Description"];
          const rows = transactions.map(t => [
            t.id,
            t.transactionType,
            t.status,
            t.amount,
            t.fee,
            new Date(t.createdAt).toISOString(),
            t.description || "",
          ]);

          const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
          const element = document.createElement("a");
          element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
          element.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
          element.style.display = "none";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }

        toast.success("Transactions exported successfully");
      } else {
        toast.error("No transactions to export");
      }
    } catch (error) {
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to view transactions</CardDescription>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-2">View and manage all your transactions</p>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground">Transaction Type</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as TransactionType | "all")}
                >
                  <option value="all">All Types</option>
                  <option value="transfer">Transfer</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TransactionStatus | "all")}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("csv")}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {transactionsData?.success && transactionsData.transactions
                ? `Showing ${transactionsData.transactions.length} transactions`
                : "No transactions found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading transactions...
              </div>
            ) : transactionsData?.success && transactionsData.transactions && transactionsData.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsData.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {tx.transactionType === "transfer" || tx.transactionType === "deposit" ? (
                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <span className="capitalize font-medium">{tx.transactionType}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${tx.transactionType === "withdrawal" ? "text-red-600" : "text-green-600"}`}>
                            {tx.transactionType === "withdrawal" ? "-" : "+"}{tx.amount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            tx.status === "completed" ? "bg-green-100 text-green-800" :
                            tx.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            tx.status === "failed" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {tx.description || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation(`/transactions/${tx.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No transactions found</p>
                <p className="text-sm mt-2">Start by creating a wallet or making a transfer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
