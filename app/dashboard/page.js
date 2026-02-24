import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, Github, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const userRecord = await prisma.user.findUnique({
        where: { clerkId: userId }
    });

    const reports = await prisma.analysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-background text-foreground bg-grid-pattern p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Reports</h1>
                        <p className="text-muted-foreground">View your past code analysis history.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-black/40 border border-neon-green/30 rounded-md flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-neon-green"></div>
                            <span className="text-sm font-medium text-white">{userRecord?.tokens || 0} Tokens</span>
                        </div>
                        <Link href="/pricing">
                            <Button className="bg-neon-green text-black hover:bg-neon-hover">
                                Buy Tokens
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" /> New Analysis
                            </Button>
                        </Link>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-lg bg-black/20">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-medium text-white">No reports yet</h2>
                        <p className="text-muted-foreground mb-6">Analyze your first project to see it here.</p>
                        <Link href="/">
                            <Button className="bg-neon-green text-black hover:bg-neon-hover">Analyze Project</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report) => {
                            const data = JSON.parse(report.data);
                            return (
                                <Card key={report.id} className="bg-black/40 border-white/10 hover:border-neon-green/30 transition-all backdrop-blur-md">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-bold text-white truncate pr-2" title={report.title || "Untitled"}>
                                                {report.title || "Untitled Project"}
                                            </CardTitle>
                                            {/* We could add delete functionality here later */}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-400">Complexity</div>
                                            <div className={`text-lg font-bold ${report.score > 70 ? 'text-red-400' : 'text-neon-green'}`}>
                                                {report.score}/100
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {data.tech_stack_analysis?.slice(0, 3).map((t, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/5 text-gray-300">
                                                    {t.choice}
                                                </span>
                                            ))}
                                            {data.tech_stack_analysis?.length > 3 && (
                                                <span className="text-xs px-2 py-1 text-gray-500">+{data.tech_stack_analysis.length - 3}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Link href={`/dashboard/report/${report.id}`} className="w-full">
                                            <Button variant="secondary" className="w-full">
                                                View Full Report
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
