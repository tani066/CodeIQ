import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AnalysisReport from "@/components/ui/analysis-report";

export default async function ReportPage({ params }) {
    const { userId } = await auth();
    if (!userId) redirect("/");

    const { id } = await params;

    const report = await prisma.analysis.findUnique({
        where: { id: id, userId: userId }
    });

    if (!report) redirect("/dashboard");

    const analysisData = JSON.parse(report.data);
    analysisData.title = report.title;

    return (
        <div className="min-h-screen bg-background text-foreground bg-grid-pattern p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="gap-2 hover:bg-white/10">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex-1 truncate">{report.title}</h1>
                </div>

                <AnalysisReport analysis={analysisData} />
            </div>
        </div>
    );
}
