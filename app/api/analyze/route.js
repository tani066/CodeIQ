
import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadGithubRepo, processProject } from "@/lib/repo-loader";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'
import prisma from "@/lib/prisma";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a Senior Engineering Manager at a top tech company. Analyze the following codebase for a Junior Developer interview. Return a JSON object with these keys:
- "star_intro": A string (Situation, Task, Action, Result introduction).
- "tech_stack_analysis": An array of objects { "choice": string, "justification": string, "trade_off": string }.
- "interview_questions": An array of objects { "question": string, "answer": string }. Focus on system design and logic.
- "red_flags": An array of strings describing bad coding practices found in the code.
- "mermaid_diagram": A string containing valid Mermaid.js graph syntax (e.g., "graph TD; A[Client] -->|HTTP| B[API]; B --> C[Database];"). KEEP IT SIMPLE. Do not use complex subgraphs or styling classes that might break rendering.
- "complexity_score": A number between 0 and 100 indicating the codebase complexity.
- "resume_bullets": An array of strings (3-5 items) that the candidate can put on their resume about this project, using action verbs and metrics where possible.
- "project_type": A classification string (e.g., "Frontend", "Backend", "Fullstack", "Mobile", "Script").

Output raw JSON only. No markdown code blocks.`;

export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in to analyze projects." },
                { status: 401 }
            );
        }

        // Initialize User if not exists, and check tokens
        let userRecord = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!userRecord) {
            userRecord = await prisma.user.create({ data: { clerkId: userId, tokens: 5 } });
        }

        if (userRecord.tokens < 5) {
            return NextResponse.json(
                { error: "Insufficient tokens. This analysis requires 5 tokens." },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const githubLink = formData.get("githubLink");
        const zipFile = formData.get("zipFile");

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Server Error: GEMINI_API_KEY is missing." },
                { status: 500 }
            );
        }

        let projectCode = "";

        // 1. Get Code Content
        if (githubLink) {
            const buffer = await downloadGithubRepo(githubLink);
            projectCode = await processProject(buffer);
        } else if (zipFile) {
            if (!(zipFile instanceof Blob)) {
                return NextResponse.json({ error: "Invalid file upload" }, { status: 400 });
            }
            const buffer = await zipFile.arrayBuffer();
            projectCode = await processProject(buffer);
        } else {
            return NextResponse.json(
                { error: "Please provide a GitHub link or upload a Zip file." },
                { status: 400 }
            );
        }

        if (!projectCode || projectCode.length < 50) {
            return NextResponse.json(
                { error: "No code found in the project. Please check the files." },
                { status: 400 }
            );
        }

        // 2. Truncate if necessary (Gemini Flash has ~1M context, but safe limit 800k chars for response room)
        // 1 token ~= 4 chars. 1M tokens is huge.
        // But let's be safe. 
        const MAX_CHARS = 1000000;
        if (projectCode.length > MAX_CHARS) {
            projectCode = projectCode.substring(0, MAX_CHARS) + "\n...[Truncated]";
        }

        // 3. Call Gemini
        // 3. Call Gemini
        // User has access to Gemini 2.0+
        let model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        let result;

        try {
            result = await model.generateContent([
                SYSTEM_PROMPT,
                `CODE CONTEXT:\n${projectCode}`
            ]);
        } catch (e) {
            console.warn("Gemini 2.0 Flash failed, retrying with gemini-flash-latest", e.message);
            try {
                // Fallback to generic latest flash
                model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                result = await model.generateContent([
                    SYSTEM_PROMPT,
                    `CODE CONTEXT:\n${projectCode}`
                ]);
            } catch (e2) {
                console.error("Gemini Flash Latest also failed", e2.message);
                // Last resort - gemini-pro-latest which was in the list
                try {
                    model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
                    result = await model.generateContent([
                        SYSTEM_PROMPT,
                        `CODE CONTEXT:\n${projectCode}`
                    ]);
                } catch (e3) {
                    throw new Error(`AI Model Error: All models failed. 2.0 Flash: ${e.message} | Flash Latest: ${e2.message}`);
                }
            }
        }

        const response = await result.response;
        const text = response.text();

        // 4. Parse JSON
        // Find the first opening brace and the last closing brace
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        let cleanJson = text;
        if (firstOpen !== -1 && lastClose !== -1) {
            cleanJson = text.substring(firstOpen, lastClose + 1);
        }

        let analysisData;
        try {
            analysisData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback or error
            return NextResponse.json(
                { error: "Failed to parse AI response.", raw: text },
                { status: 500 }
            );
        }

        // 5. Save to Database & Deduct tokens
        try {
            await prisma.$transaction([
                prisma.analysis.create({
                    data: {
                        userId: userId,
                        repoUrl: githubLink || "Zip File",
                        sourceType: githubLink ? "github" : "zip",
                        score: analysisData.complexity_score || 0,
                        title: githubLink ? githubLink.split('/').slice(-2).join('/') : (zipFile ? zipFile.name : "Unknown Project"),
                        data: JSON.stringify(analysisData)
                    }
                }),
                prisma.user.update({
                    where: { clerkId: userId },
                    data: { tokens: { decrement: 5 } }
                })
            ]);
        } catch (dbError) {
            console.error("Failed to save to DB:", dbError);
            // Don't fail the request, just log it
        }

        return NextResponse.json({ success: true, analysis: analysisData });

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
