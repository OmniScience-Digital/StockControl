"use client";
import { useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Home from "./Components/dynamicLanding";



export default function Landing() {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 p-1 mt-20 ">
                <Home />
            </main>
            <Footer />
        </div>
    )
}