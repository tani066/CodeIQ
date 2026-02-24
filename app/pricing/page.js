"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Script from "next/script";

const PLANS = [
    { id: "plan_50", name: "Starter Stack", tokens: 50, price: 99, popular: false },
    { id: "plan_200", name: "Pro Developer", tokens: 200, price: 299, popular: true },
    { id: "plan_500", name: "Agency Scale", tokens: 500, price: 599, popular: false },
];

export default function PricingPage() {
    const { user, isLoaded } = useUser();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [message, setMessage] = useState(null);

    const handlePurchase = async (plan) => {
        if (!isLoaded || !user) {
            alert("Please sign in to purchase tokens.");
            return;
        }
        setLoadingPlan(plan.id);
        setMessage(null);

        try {
            const res = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: plan.price, planId: plan.id }),
            });
            const order = await res.json();

            if (order.error) {
                setMessage({ type: "error", text: order.error });
                setLoadingPlan(null);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "mock_key_id",
                amount: order.amount,
                currency: order.currency,
                name: "Code IQ",
                description: `Purchase ${plan.tokens} Tokens`,
                order_id: order.id,
                handler: async function (response) {
                    const verificationRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            tokens: plan.tokens,
                        }),
                    });
                    const verificationData = await verificationRes.json();
                    if (verificationData.success) {
                        setMessage({ type: "success", text: `Successfully added ${plan.tokens} tokens to your account!` });
                    } else {
                        setMessage({ type: "error", text: verificationData.error || "Verification failed." });
                    }
                },
                prefill: {
                    name: user.fullName || "",
                    email: user.primaryEmailAddress?.emailAddress || "",
                },
                theme: { color: "#10b981" }, // Neon green
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                setMessage({ type: "error", text: "Payment failed or cancelled." });
            });
            rzp.open();

        } catch (error) {
            console.error("Checkout Error:", error);
            setMessage({ type: "error", text: "Something went wrong. Please try again." });
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground bg-grid-pattern py-20 px-6">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <div className="max-w-6xl mx-auto space-y-12 text-center">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                        Fuel Your Code <span className="text-neon-green">Analysis</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        1 Analysis = 5 Tokens. Get the insights you need to ace interviews and write better code.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-md max-w-lg mx-auto ${message.type === "success" ? "bg-neon-green/20 text-neon-green border border-neon-green/30" : "bg-red-500/20 text-red-500 border border-red-500/30"}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8 pt-8">
                    {PLANS.map((plan) => (
                        <Card key={plan.id} className={`relative flex flex-col bg-black/40 border-white/10 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/30 ${plan.popular ? 'border-neon-green shadow-[0_0_30px_-5px_var(--neon-green)]' : ''}`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-neon-green text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <CardHeader className="text-center pt-8">
                                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                                <CardDescription className="text-gray-400 mt-2">Perfect for side projects</CardDescription>
                                <div className="mt-6 flex justify-center items-baseline gap-2">
                                    <span className="text-5xl font-extrabold text-white">₹{plan.price}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-4 text-left mt-4 text-sm text-gray-300">
                                    <li className="flex gap-3 items-center">
                                        <div className="rounded-full bg-neon-green/20 p-1"><Check className="w-4 h-4 text-neon-green" /></div>
                                        <span className="font-semibold text-white">{plan.tokens} Tokens</span>
                                    </li>
                                    <li className="flex gap-3 items-center">
                                        <div className="rounded-full bg-neon-green/20 p-1"><Check className="w-4 h-4 text-neon-green" /></div>
                                        <span>{plan.tokens / 5} Code Analyses</span>
                                    </li>
                                    <li className="flex gap-3 items-center">
                                        <div className="rounded-full bg-neon-green/20 p-1"><Check className="w-4 h-4 text-neon-green" /></div>
                                        <span>PDF Report Downloads</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="pb-8">
                                <Button
                                    className={`w-full text-lg h-12 font-semibold ${plan.popular ? 'bg-neon-green text-black hover:bg-neon-hover' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    onClick={() => handlePurchase(plan)}
                                    disabled={loadingPlan === plan.id}
                                >
                                    {loadingPlan === plan.id ? "Processing..." : `Get ${plan.tokens} Tokens`}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
