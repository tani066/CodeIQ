"use client";

import { AlertTriangle, CheckCircle, Terminal, Cpu, FileText, Zap, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import MermaidRenderer from "@/components/ui/mermaid-renderer";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState, useRef } from "react";
import { Loader } from "@/components/ui/loader";

export default function AnalysisReport({ analysis }) {
    const reportRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    const downloadPDF = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        try {
            // Ensure we capture everything by temporarily removing any problematic styles
            const element = reportRef.current;
            const originalStyle = element.style.cssText;
            element.style.width = `${element.scrollWidth}px`;
            element.style.height = `${element.scrollHeight}px`;
            element.style.maxWidth = 'none';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#0a0a0a", // Match background color
                logging: false,
                onclone: (clonedDoc) => {
                    // html2canvas fails on oklch/oklab/lab/lch/color() colors generated natively by Tailwind v4.
                    // We'll walk all elements in the clone and force valid rgb/hex fallbacks where it crashes.
                    const elements = clonedDoc.querySelectorAll('*');
                    const unsupportedColors = ['oklab', 'oklch', 'lab', 'lch', 'color('];

                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i];
                        const styles = clonedDoc.defaultView.getComputedStyle(el);

                        const hasUnsupported = (val) => val && unsupportedColors.some(c => val.includes(c));

                        if (hasUnsupported(styles.color)) {
                            el.style.color = '#ffffff'; // safe fallback
                        }
                        if (hasUnsupported(styles.backgroundColor)) {
                            el.style.backgroundColor = '#1a1a1a';
                        }
                        if (hasUnsupported(styles.borderColor)) {
                            el.style.borderColor = '#333333';
                        }
                    }
                }
            });

            // Restore original styles
            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png');

            // Calculate proper PDF dimensions (A4 ratio)
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`code-iq-report-${analysis.title || 'project'}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setDownloading(false);
        }
    };

    if (!analysis) return null;

    return (
        <div className="space-y-8 relative">
            <div className="flex justify-end mb-4 absolute -top-14 right-0 z-10">
                <Button
                    onClick={downloadPDF}
                    disabled={downloading}
                    className="bg-neon-green text-black hover:bg-neon-hover gap-2"
                >
                    {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloading ? "Generating PDF..." : "Download PDF"}
                </Button>
            </div>

            <div ref={reportRef} className="space-y-8 bg-background p-6 rounded-xl border border-white/5">
                {/* Dashboard Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Card */}
                    <Card className="bg-black/30 border-white/10 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Complexity Score</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-8">
                            <ScoreGauge score={analysis.complexity_score || 75} label="System Complexity" />
                        </CardContent>
                    </Card>

                    {/* Key Stats */}
                    <Card className="bg-black/30 border-white/10 backdrop-blur-md md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Project DNA</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-sm text-gray-400 mb-1">Architecture Type</div>
                                <div className="text-2xl font-bold text-white">{analysis.project_type || "Fullstack"}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-sm text-gray-400 mb-1">Tech Stack Items</div>
                                <div className="text-2xl font-bold text-blue-400">{analysis.tech_stack_analysis?.length || 0}</div>
                            </div>
                            {analysis.red_flags?.length > 0 && (
                                <div className="col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                    <AlertTriangle className="text-red-400 h-5 w-5" />
                                    <div>
                                        <div className="font-bold text-red-400">{analysis.red_flags.length} Red Flags Detected</div>
                                        <div className="text-xs text-red-300/70">Critical issues that need explanation</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Architecture Diagram */}
                {analysis.mermaid_diagram && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Cpu className="text-neon-green" /> System Architecture
                        </h2>
                        <Card className="bg-white/5 border-neon-green/20 break-inside-avoid">
                            <CardContent className="p-4">
                                <MermaidRenderer chart={analysis.mermaid_diagram} />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Two Column Layout for Resume & Intro */}
                <div className="grid md:grid-cols-2 gap-8 text-left">
                    {/* 1. The Hook (STAR) */}
                    <section className="break-inside-avoid">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Terminal className="text-neon-green" /> The Hook
                        </h2>
                        <Card className="bg-white/5 border-white/10 h-full">
                            <CardHeader>
                                <CardTitle className="text-neon-green text-lg">Intro Pitch (STAR Protocol)</CardTitle>
                            </CardHeader>
                            <CardContent className="text-base leading-relaxed text-gray-300">
                                {analysis.star_intro}
                            </CardContent>
                        </Card>
                    </section>

                    {/* Resume Bullets */}
                    <section className="break-inside-avoid">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                            <FileText className="text-blue-400" /> Resume Boosters
                        </h2>
                        <Card className="bg-white/5 border-white/10 h-full">
                            <CardContent className="pt-6 space-y-4">
                                {analysis.resume_bullets?.map((bullet, idx) => (
                                    <div key={idx} className="flex gap-3 items-start group">
                                        <Zap className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                        <p className="text-gray-300 text-sm group-hover:text-white transition-colors">{bullet}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* 2. Architecture Choices */}
                <section className="text-left">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                        <CheckCircle className="text-blue-400" /> Technical Deep Dive
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {analysis.tech_stack_analysis?.map((item, idx) => (
                            <Card key={idx} className="bg-black/40 border-white/10 hover:border-blue-400/50 transition-all hover:-translate-y-1">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">{item.choice}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <p><span className="text-gray-400 font-semibold">Why:</span> {item.justification}</p>
                                    <p><span className="text-yellow-500 font-semibold">Trade-off:</span> {item.trade_off}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* 3. Red Flags */}
                {analysis.red_flags && analysis.red_flags.length > 0 && (
                    <section className="text-left">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-destructive">
                            <AlertTriangle /> Red Flags (Fix These!)
                        </h2>
                        <Card className="border-destructive/30 bg-destructive/5 text-left">
                            <CardContent className="pt-6">
                                <ul className="space-y-3 text-left">
                                    {analysis.red_flags.map((flag, idx) => (
                                        <li key={idx} className="flex gap-2 items-start text-destructive-foreground text-left">
                                            <span className="mt-1">•</span> {flag}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* 4. The Grill (Accordion) */}
                <section className="pb-20 text-left">
                    <h2 className="text-2xl font-bold mb-4 text-white">The Grill</h2>
                    <Card className="bg-black/40 border-white/10">
                        <CardContent className="pt-6">
                            <Accordion type="single" collapsible className="w-full">
                                {analysis.interview_questions?.map((q, idx) => (
                                    <AccordionItem key={idx} value={`item-${idx}`} className="border-white/10">
                                        <AccordionTrigger className="text-left text-lg hover:no-underline hover:text-neon-green transition-colors text-white">
                                            {q.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-gray-400 pl-4 border-l-2 border-neon-green ml-2">
                                            <p className="font-semibold text-neon-green mb-1">Model Answer:</p>
                                            {q.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
