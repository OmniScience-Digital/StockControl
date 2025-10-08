"use client";

import { client } from "@/services/schema";
import { Category } from "@/types/form.types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/table/datatable";
import { EditIcon, ArrowUpDown, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { mapApiCategoryToCategory } from "../stockcontrolform/Components/map.categories.helper";
import Loading from "@/components/widgets/loading";
import { Button } from "@/components/ui/button";




export default function IMS() {
    const router = useRouter();

    const [loading, setLoading] = useState(false); // Loading state
    const [categories, setCategories] = useState<Category[]>([]);

    // listCategories function - returns subscription
    useEffect(() => {
        setLoading(true);

        // Subscribe to real-time updates
        const subscription = client.models.Category.observeQuery().subscribe({
            next: ({ items, isSynced }) => {
                // Map API data to our Category type
                const mappedCategories: Category[] = (items || []).map(mapApiCategoryToCategory);
                setCategories(mappedCategories);

                if (isSynced) {
                    setLoading(false);
                }
            },
            error: (error) => {
                console.error("Error subscribing to categories:", error);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);



    //table data
    const columns: ColumnDef<object, any>[] = [
        {
            accessorKey: "catname",
            header: ({ column }: { column: any }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "edit",
            header: "Edit",
            cell: ({ row }: { row: any }) => (
                <Button
                    className="ml-auto cursor-pointer"
                    onClick={() => redirectToDashboard(row.original.catname,row.original.id)} // Log the row ID
                >
                    <EditIcon />
                </Button>
            ),
        },
        {
            accessorKey: "manage",
            header: "Manage",
            cell: ({ row }: { row: any }) => (
                <Button
                    className="bg-red-500 ml-auto cursor-pointer    "
                //   onClick={() => handleDelete(row.original.id)} // Log the row ID
                >
                    <Trash2 />
                </Button>
            ),
        },

    ];

    const data = Array.isArray(categories)
        ? categories.map((cat) => {

            return {
                id: cat.id || "",
                catname: cat.categoryName || "",
                edit: <EditIcon id={cat.id} key={`edit-${cat.id}`} />,
                manage: <Trash2 id={cat.id} key={`delete-${cat.id}`} />,

            };
        })
        : [];

    // Redirect to dashboard
    const redirectToDashboard = (name:string,id: string) => {
        const catname = name;
        localStorage.setItem('categoryName',catname.toUpperCase());
        
       router.push(`/subcategories/${id}`);
    };



    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Navbar />

            {loading ? (
                <Loading />
            ) : (
                <main className="flex-1 p-1 mt-20 ">
                    <DataTable
                        title={"Category Selection"}
                        data={data}
                        columns={columns}
                        pageSize={10}
                        storageKey="categoriesTablePagination"
                    />

                </main>
            )}
            <Footer />
        </div>
    )
}