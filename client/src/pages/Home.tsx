import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Wallet, TrendingUp, Lock, Zap, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Biometric Wallet</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/wallets")}>
                Wallets
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/transactions")}>
                Transactions
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/settings")}>
                Settings
              </Button>
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Manage your digital assets with biometric security
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => setLocation("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/wallets")}>
                Manage Wallets
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Fingerprint className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Biometric Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Use your fingerprint for secure authentication and transaction verification
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Multi-Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage fiat currencies and cryptocurrencies in one unified wallet
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your portfolio performance with detailed analytics and insights
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Military-grade encryption protects all your transactions and data
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Instant Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Send and receive money instantly with peer-to-peer transfers
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wallet className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Crypto Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Deposit and withdraw Bitcoin, Ethereum, and other cryptocurrencies
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-6">
              Create your first wallet and start managing your digital assets securely
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => setLocation("/wallets")}>
                Create Wallet
              </Button>
              <Button variant="outline" onClick={() => setLocation("/settings")}>
                Security Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Biometric Wallet</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Secure Digital Wallet with Biometric Authentication
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage multiple currencies and cryptocurrencies with fingerprint-based security. 
            Experience the future of digital payments.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-background rounded-lg p-6 border border-border">
            <Fingerprint className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Biometric Security</h3>
            <p className="text-muted-foreground">
              Your fingerprint is your password. Secure, fast, and impossible to forget.
            </p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <Globe className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Multi-Currency</h3>
            <p className="text-muted-foreground">
              Manage USD, EUR, Bitcoin, Ethereum, and more in one place.
            </p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <TrendingUp className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Analytics</h3>
            <p className="text-muted-foreground">
              Track your portfolio with detailed charts and performance metrics.
            </p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <Lock className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Enterprise Security</h3>
            <p className="text-muted-foreground">
              Military-grade encryption protects your transactions and personal data.
            </p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <Zap className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Instant Transfers</h3>
            <p className="text-muted-foreground">
              Send money to other users instantly with peer-to-peer transfers.
            </p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <Wallet className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Crypto Support</h3>
            <p className="text-muted-foreground">
              Seamlessly deposit and withdraw cryptocurrencies from your wallet.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to secure your digital assets?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of users who trust Biometric Wallet for their financial security
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Sign Up Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 Biometric Wallet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
