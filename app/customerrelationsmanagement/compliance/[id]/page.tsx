import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";


export default function Compliance() {
    return (
        <div className="flex flex-col min-h-screen bg-background from-slate-50 to-blue-50/30">
            <Navbar />
            <main className="flex-1 px-4 sm:px-6 mt-20 pb-20">
                <div className="container mx-auto max-w-7xl mt-8">
                </div>
            </main>
            <Footer/>
        </div>
    );
}