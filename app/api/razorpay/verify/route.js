import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tokens } = await req.json();

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mock_key_secret")
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Give user tokens
            await prisma.user.update({
                where: { clerkId: userId },
                data: { tokens: { increment: tokens } }
            });

            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            return NextResponse.json({ error: "Invalid signature sent!" }, { status: 400 });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
}
