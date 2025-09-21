import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineUser, AiOutlineLock, AiOutlineLoading3Quarters, AiOutlinePhone } from "react-icons/ai";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Auth() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: "admin123"
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(credentials.username, credentials.password);
      if (success) {
        toast.success("Login successful!");
        await router.push("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - AI Call Center</title>
        <meta name="description" content="Login to AI Call Center" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <AiOutlinePhone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="ml-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                AI Call Center
              </h1>
            </div>
          </div>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-slate-800 dark:text-slate-100">
                Welcome back
              </CardTitle>
              <CardDescription className="text-center text-slate-500 dark:text-slate-400">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AiOutlineUser className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AiOutlineLock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="pt-4 text-center border-t border-slate-200 dark:border-slate-700/50">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Demo Credentials
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Username: admin | Password: admin123
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 AI Call Center. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 