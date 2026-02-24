import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let userRecord = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        // Auto provision if they don't exist yet
        if (!userRecord) {
            userRecord = await prisma.user.create({
                data: {
                    clerkId: userId,
                    tokens: 5 // Default free tokens
                }
            });
        }

        return NextResponse.json({ tokens: userRecord.tokens });

    } catch (error) {
        console.error("Token Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
    }
}
