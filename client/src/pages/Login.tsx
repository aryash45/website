import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Customer Login Form State
  const [custUsername, setCustUsername] = useState("");
  const [custPassword, setCustPassword] = useState("");

  // Register Form State
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const user = await login(custUsername, custPassword);
      if (user) {
        toast({ title: "Welcome Back!", description: "Logged in successfully to your account." });
        // Redirect admins to the admin dashboard, everyone else to profile
        setLocation(user.role === "admin" ? "/admin" : "/profile");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const success = await register(regUsername, regEmail, regPassword, regPhone);
      if (success) {
        toast({ title: "Account Created!", description: "Your customer account has been registered successfully." });
        setLocation("/profile");
      } else {
        setError("Registration failed. Username or email might be taken.");
      }
    } catch (err) {
      setError("An error occurred during registration");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-poppins">
      <Header />

      <main className="flex-1 container mx-auto flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-lg shadow-xl border-zinc-150/80 rounded-3xl overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-900 rounded-none h-14 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-xs md:text-sm font-bold text-accent-navy transition-all">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-xs md:text-sm font-bold text-accent-navy transition-all">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Customer Login Tab */}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleCustomerLogin}>
                <CardHeader className="space-y-1 py-6 px-8">
                  <CardTitle className="text-2xl font-black text-accent-navy">Customer Login</CardTitle>
                  <CardDescription>
                    Sign in to manage your orders, wishlist, and shipping addresses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8">
                  {error && <div className="text-sm text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="custUsername">Username</Label>
                    <Input
                      id="custUsername"
                      placeholder="e.g. parent123"
                      value={custUsername}
                      onChange={(e) => setCustUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custPassword">Password</Label>
                    <Input
                      id="custPassword"
                      type="password"
                      placeholder="••••••••"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col py-6 px-8">
                  <Button type="submit" className="w-full bg-primary hover:bg-accent-coral text-white font-bold h-11 rounded-full uppercase tracking-wider transition-colors cursor-pointer" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Account Tab */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister}>
                <CardHeader className="space-y-1 py-6 px-8">
                  <CardTitle className="text-2xl font-black text-accent-navy">Create an Account</CardTitle>
                  <CardDescription>
                    Join Rajouri Kids for a faster checkout and personalized wishlist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8">
                  {error && <div className="text-sm text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200">{error}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="regUsername">Username *</Label>
                    <Input
                      id="regUsername"
                      placeholder="Choose a username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email Address *</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="e.g. parent@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPhone">Phone Number (Optional)</Label>
                    <Input
                      id="regPhone"
                      placeholder="e.g. +91 9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password *</Label>
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="py-6 px-8">
                  <Button type="submit" className="w-full bg-primary hover:bg-accent-coral text-white font-bold h-11 rounded-full uppercase tracking-wider transition-colors cursor-pointer" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <Footer />
    </div>
  );
}