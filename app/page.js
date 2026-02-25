"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Github, Upload, FileCode, AlertTriangle, CheckCircle, Terminal, Cpu, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import AnalysisReport from "@/components/ui/analysis-report";
import Image from "next/image";

export default function Home() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("github");
  const [githubLink, setGithubLink] = useState("");
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing...");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState(null);
  const [tokens, setTokens] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetch("/api/user/tokens")
        .then(res => res.json())
        .then(data => {
          if (data.tokens !== undefined) setTokens(data.tokens);
        })
        .catch(err => console.error("Failed to fetch tokens:", err));
    }
  }, [user]);

  const runAnalysis = async () => {
    try {
      const formData = new FormData();
      if (activeTab === "github") {
        formData.append("githubLink", githubLink);
      } else {
        formData.append("zipFile", zipFile);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysis(data.analysis);
    } catch (err) {
      if (err.message.includes("Insufficient tokens")) {
        setError(err.message);
        setErrorLink("/pricing");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      // Refresh tokens after run attempt
      if (user) {
        fetch("/api/user/tokens")
          .then(res => res.json())
          .then(data => data.tokens !== undefined && setTokens(data.tokens));
      }
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === "github" && !githubLink) {
      setError("Please enter a GitHub URL");
      return;
    }
    if (activeTab === "zip" && !zipFile) {
      setError("Please upload a ZIP file");
      return;
    }

    if (user && tokens !== null && tokens < 5) {
      setError("Insufficient tokens. This analysis requires 5 tokens.");
      setErrorLink("/pricing");
      return;
    }

    setError("");
    setErrorLink(null);
    setAnalysis(null);
    setLoading(true);
    setLoadingText(activeTab === "github" ? "Cloning Repo..." : "Reading Zip...");

    // Timers for UX
    const t1 = setTimeout(() => setLoadingText("Analyzing Architecture..."), 3000);
    const t2 = setTimeout(() => setLoadingText("Generating Defense Strategy..."), 6000);
    const t3 = setTimeout(() => setLoadingText("Drawing Diagrams..."), 9000);

    await runAnalysis();

    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };

  return (
    <main className="min-h-screen bg-background text-foreground bg-grid-pattern overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 max-w-screen-2xl items-center px-6 justify-between">
          {/* <div className="flex items-center gap-2 font-bold text-neon-green text-xl tracking-wider">
            <ShieldCheck className="h-6 w-6" />
            <span>CodeIQ</span>
          </div> */}
          <Image
            src="/logo.png"
            alt="CodeIQ Logo"
            width={100}
            height={100}
            className="mr-3"
          />
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/10">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              {tokens !== null && (
                <div className="px-3 py-1.5 mr-2 bg-black/40 border border-neon-green/30 rounded-md flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-green"></div>
                  <span className="text-sm font-medium text-white">{tokens} Tokens</span>
                </div>
              )}
              <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/10 mr-2" onClick={() => window.location.href = '/dashboard'}>Dashboard</Button>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>

      <div className="container max-w-5xl py-12 px-4 mx-auto space-y-12">

        {/* Hero Section */}
        <section className="text-center space-y-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold tracking-tight lg:text-7xl text-white"
          >
            Crack Your Tech Interview <br /> <span className="text-neon-green glow-text">Like a Senior.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-xl max-w-2xl mx-auto"
          >
            Upload your project. Our AI analyzes your code, exposes vulnerabilities, and preps you with defense strategies and resume bullets.
          </motion.p>
        </section>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="bg-black/20 border-b border-white/5">
              <CardTitle>Submit Your Codebase</CardTitle>
              <CardDescription>We support public GitHub repositories or .zip uploads.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tabs */}
              <div className="flex items-center p-1 bg-black/40 rounded-lg mb-8 w-fit mx-auto border border-white/10">
                <button
                  onClick={() => setActiveTab("github")}
                  className={cn("px-6 py-2.5 rounded-md text-sm font-medium transition-all", activeTab === "github" ? "bg-neon-green/10 text-neon-green shadow-sm border border-neon-green/20" : "text-muted-foreground hover:text-white")}
                >
                  <div className="flex items-center gap-2"><Github className="w-4 h-4" /> GitHub Link</div>
                </button>
                <button
                  onClick={() => setActiveTab("zip")}
                  className={cn("px-6 py-2.5 rounded-md text-sm font-medium transition-all", activeTab === "zip" ? "bg-neon-green/10 text-neon-green shadow-sm border border-neon-green/20" : "text-muted-foreground hover:text-white")}
                >
                  <div className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Zip</div>
                </button>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                {activeTab === "github" ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://github.com/username/repo"
                      value={githubLink || ""}
                      onChange={(e) => setGithubLink(e.target.value)}
                      className="bg-black/20 border-white/10 focus-visible:ring-neon-green h-12 text-lg"
                    />
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:border-neon-green/50 hover:bg-neon-green/5 transition-all cursor-pointer bg-black/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => setZipFile(e.target.files?.[0])}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <FileCode className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-lg font-medium">{zipFile ? zipFile.name : "Click to upload .zip"}</p>
                      <p className="text-xs text-muted-foreground">Max 50MB</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                    {errorLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/20 text-white border-red-500/40 hover:bg-red-500/40"
                        onClick={() => window.location.href = errorLink}
                      >
                        Buy Tokens
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  className="w-full font-bold text-lg h-14 bg-neon-green text-black hover:bg-neon-hover hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" /> {loadingText}
                    </span>
                  ) : "Generate Defense Strategy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <AnalysisReport analysis={analysis} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
