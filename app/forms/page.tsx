"use client";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FormsLanding() {
    const router = useRouter();

    console.log('🔴 FormsLanding component RENDERED at:', new Date().toISOString());

    useEffect(() => {
        console.log('🟡 FormsLanding useEffect FIRED at:', new Date().toISOString());
        
        // Test if this component is even loading
        return () => {
            console.log('🔵 FormsLanding component UNMOUNTING at:', new Date().toISOString());
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 p-1 mt-20 pb-20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Forms Landing Page</h1>
                    <p>If you see this immediately, the issue is elsewhere.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}