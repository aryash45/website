import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fingerprint, ShieldCheck } from "lucide-react";

// ---------- WebAuthn / Passkey helpers ----------

/**
 * Attempt a platform-authenticator (Touch ID / Windows Hello / Face ID) login.
 * This uses the browser's built-in `navigator.credentials` API — no extra library needed.
 * NOTE: Full passkey enrollment + server-side challenge verification is outside scope here;
 * this triggers the native biometric prompt and returns the credential for the server to verify.
 */
async function triggerBiometricLogin(): Promise<PublicKeyCredential | null> {
  if (!window.PublicKeyCredential) return null;

  // Check that a platform (on-device) authenticator is actually available
  const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!available) return null;

  try {
    // A real implementation would fetch a challenge from the server.
    // Here we use a random 32-byte challenge as a placeholder.
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60_000,
        userVerification: "required",
        rpId: window.location.hostname,
      },
    });

    return credential as PublicKeyCredential;
  } catch (err) {
    // User cancelled or device doesn't support the call — treat as "not available"
    return null;
  }
}

// -------------------------------------------------

export default function Login() {
  const { login, register } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [error, setError] = useState("");

  // Customer Login Form State
  const [custUsername, setCustUsername] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form State
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Whether the browser supports platform biometrics (Touch ID / Windows Hello)
  const [biometricSupported] = useState(() => {
    // Evaluated once on mount; can't use async here so we optimistically show the button
    // and let triggerBiometricLogin() return null if not supported
    return typeof window !== "undefined" && Boolean(window.PublicKeyCredential);
  });

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const user = await login(custUsername, custPassword, rememberMe);
      if (user) {
        toast({
          title: "Welcome Back!",
          description: rememberMe
            ? "Logged in and remembered for 30 days."
            : "Logged in successfully to your account.",
        });
        setLocation(user.role === "admin" ? "/admin" : "/profile");
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError("");
    setIsBiometricLoading(true);
    try {
      const credential = await triggerBiometricLogin();
      if (!credential) {
        toast({
          title: "Biometric Not Available",
          description:
            "Your device doesn't support biometric login, or you cancelled the prompt.",
          variant: "destructive",
        });
        return;
      }

      // ── TODO: send `credential` to /api/auth/webauthn/verify for server-side verification ──
      // For now we show a friendly "coming soon" message since full WebAuthn server-side
      // challenge validation requires a dedicated endpoint.
      toast({
        title: "Biometric Captured ✓",
        description:
          "Biometric authentication is being set up. For now, please sign in with your password.",
      });
    } catch (err) {
      console.error("Biometric login error:", err);
      setError("Biometric login failed. Please use your password.");
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const success = await register(regUsername, regEmail, regPassword, regPhone);
      if (success) {
        toast({
          title: "Account Created!",
          description: "Your customer account has been registered successfully.",
        });
        setLocation("/profile");
      } else {
        setError("Registration failed. Username or email might already be taken.");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
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
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-xs md:text-sm font-bold text-accent-navy transition-all"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-xs md:text-sm font-bold text-accent-navy transition-all"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* ── Customer Login Tab ── */}
            <TabsContent value="login" className="mt-0">
              {/*
               * The <form> wraps the entire card content so password managers
               * (Google, Apple Keychain, 1Password, Bitwarden) can detect the
               * login form and offer to auto-fill credentials.
               */}
              <form onSubmit={handleCustomerLogin} autoComplete="on">
                <CardHeader className="space-y-1 py-6 px-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl font-black text-accent-navy">
                      Customer Login
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Sign in to manage your orders, wishlist, and shipping addresses
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-8">
                  {/* Error banner */}
                  {error && (
                    <div
                      role="alert"
                      className="text-sm text-red-600 font-semibold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200"
                    >
                      {error}
                    </div>
                  )}

                  {/* Username — autocomplete="username" lets password managers link this field */}
                  <div className="space-y-2">
                    <Label htmlFor="custUsername">Username</Label>
                    <Input
                      id="custUsername"
                      name="username"
                      autoComplete="username"
                      placeholder="e.g. parent123"
                      value={custUsername}
                      onChange={(e) => setCustUsername(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password — autocomplete="current-password" triggers password-manager fill */}
                  <div className="space-y-2">
                    <Label htmlFor="custPassword">Password</Label>
                    <Input
                      id="custPassword"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Remember Me checkbox — extends session cookie to 30 days on the server */}
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-medium cursor-pointer select-none"
                    >
                      Remember me for 30 days
                    </Label>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 py-6 px-8">
                  {/* Primary sign-in button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-accent-coral text-white font-bold h-11 rounded-full uppercase tracking-wider transition-colors cursor-pointer"
                    disabled={isLoading || isBiometricLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>

                  {/* Biometric / Passkey login — only shown when the browser supports it */}
                  {biometricSupported && (
                    <>
                      <div className="relative w-full flex items-center gap-2">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                        <span className="text-xs text-zinc-400 font-medium">or</span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-full font-semibold border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-2"
                        onClick={handleBiometricLogin}
                        disabled={isLoading || isBiometricLoading}
                        title="Sign in with Touch ID, Face ID, or Windows Hello"
                      >
                        {isBiometricLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Fingerprint className="h-4 w-4 text-primary" />
                        )}
                        Sign in with Biometrics / Touch ID
                      </Button>
                    </>
                  )}
                </CardFooter>
              </form>
            </TabsContent>

            {/* ── Register Account Tab ── */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} autoComplete="on">
                <CardHeader className="space-y-1 py-6 px-8">
                  <CardTitle className="text-2xl font-black text-accent-navy">
                    Create an Account
                  </CardTitle>
                  <CardDescription>
                    Join Rajouri Kids for a faster checkout and personalised wishlist
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-8">
                  {error && (
                    <div
                      role="alert"
                      className="text-sm text-red-600 font-semibold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="regUsername">Username *</Label>
                    <Input
                      id="regUsername"
                      name="username"
                      autoComplete="username"
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
                      name="email"
                      type="email"
                      autoComplete="email"
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
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      placeholder="e.g. +91 9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password *</Label>
                    <Input
                      id="regPassword"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="py-6 px-8">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-accent-coral text-white font-bold h-11 rounded-full uppercase tracking-wider transition-colors cursor-pointer"
                    disabled={isLoading}
                  >
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