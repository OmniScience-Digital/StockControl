"use client";

import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { useState } from "react";

export default function Vehicle_Inspection_Form(){
    const [loading, setLoading] = useState(true);//loading
    

    return (

        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <Navbar />
            
                  {loading  ? (
                    <Loading />
                  ) : (
                    <main className="flex-1 p-6 mt-20 min-h-screen">

                    </main>
                  )}
        </div>
    );
}