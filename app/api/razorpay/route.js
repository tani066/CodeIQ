import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "mock_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret",
});

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, planId } = await req.json();

        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}_${planId}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
