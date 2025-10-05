import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";



export default function IMS() {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-1 p-1 mt-20 ">
                IMS
            </main>
            <Footer />
        </div>
    )
}