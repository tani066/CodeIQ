"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
        fontFamily: "inherit",
        primaryColor: "#39ff14",
        primaryTextColor: "#000",
        primaryBorderColor: "#32e612",
        lineColor: "#39ff14",
        secondaryColor: "#006100",
        tertiaryColor: "#fff"
    }
});

const MermaidRenderer = ({ chart }) => {
    const ref = useRef(null);
    const [svg, setSvg] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const renderChart = async () => {
            if (!chart) {
                setLoading(false);
                return;
            }

            if (ref.current) {
                setLoading(true);
                setError(false);
                try {
                    // Unique ID for this render
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    // Mermaid render returns an object with svg property
                    const { svg } = await mermaid.render(id, chart);
                    setSvg(svg);
                } catch (err) {
                    console.error("Mermaid Render Error:", err);
                    console.log("Failed Chart Source:", chart);
                    setError(true);
                } finally {
                    setLoading(false);
                }
            }
        };

        renderChart();
    }, [chart]);

    if (error) return (
        <div className="text-red-400 text-sm p-4 border border-red-500/20 rounded-md">
            <p className="font-bold">Failed to render diagram.</p>
            <pre className="text-xs mt-2 overflow-auto max-h-40 bg-black/50 p-2">{chart}</pre>
        </div>
    );

    return (
        <div ref={ref} className="w-full relative group">
            {/* Debug overlay on hover */}
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={() => console.log(chart)}
                    className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded hover:bg-black/80 hover:text-white transition-colors"
                >
                    Log Source
                </button>
            </div>

            <div className="w-full overflow-x-auto bg-black/20 p-4 rounded-lg flex justify-center items-center min-h-[200px]">
                {loading && (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
                        <span className="text-xs text-muted-foreground">Rendering Graph...</span>
                    </div>
                )}

                {/* Always render container, hide if loading */}
                {/* We use visibility hidden instead of conditional rendering to keep DOM structure stable if needed, but absolute positioning works too for overlay */}
                <div
                    dangerouslySetInnerHTML={{ __html: svg }}
                    className={`mermaid-svg-container transition-opacity duration-500 ${loading ? 'opacity-0 absolute' : 'opacity-100'}`}
                />
            </div>

            {/* If chart is empty/null */}
            {!chart && !loading && (
                <div className="text-center text-gray-500 py-10">No diagram data available</div>
            )}
        </div>
    );
};

export default MermaidRenderer;
