"use client"; // Required for client-side interactivity

import { useState, useEffect } from "react";
// import { client } from "@/service/schemaClient";
import { useRouter } from "next/navigation";
import { Plus, Trash2, LayoutDashboard, Search, MoreVertical, Calendar, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { DialogDashboard } from "./dialog";
// import { ConfirmDialog } from "../../components/widgets/deletedialog";
// import Loading from "@/components/widgets/loading"; // Import the Loading component
// import { DataItem } from "@/types/schema";

export default function Home() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<string[]>([]);
//   const [dataArray, setData] = useState<DataItem[]>([]); // Correctly typed
  const [open, setOpen] = useState(false); // Dialog visibility state for adding dashboard
  const [opendelete, setOpendelete] = useState(false); // Dialog visibility state for deleting dashboard
  const [name, setName] = useState(""); // Empty by default
  const [loading, setLoading] = useState(true); // Loading state
  const [dashboardToDelete, setDashboardToDelete] = useState<number | null>(
    null,
  ); // Index of dashboard to delete
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [favorites, setFavorites] = useState<number[]>([]); // Array of favorite dashboard indices

  // Mock data for demonstration
  useEffect(() => {
    const mockDashboards = [
      "Sales Analytics Dashboard",
      "Marketing Performance Overview",
      "User Metrics & Analytics",
      "Financial Reports Summary",
      "Project Tracking Dashboard",
      "Team Productivity Insights",
      "Customer Success Metrics",
      "Revenue Analytics Portal"
    ];
    setDashboards(mockDashboards);
    setFavorites([0, 2]); // Set first and third as favorites by default
    setLoading(false);
  }, []);

  // Toggle favorite and reorder
  const toggleFavorite = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const dashboardName = dashboards[index];
    const isCurrentlyFavorite = favorites.includes(index);
    
    let newFavorites: number[];
    let newDashboards: string[];

    if (isCurrentlyFavorite) {
      // Remove from favorites
      newFavorites = favorites.filter(favIndex => favIndex !== index);
      newDashboards = [...dashboards];
    } else {
      // Add to favorites and move to top
      newFavorites = [...favorites, index];
      
      // Reorder dashboards: favorites first, then others
      const favoriteDashboards = newFavorites.map(favIndex => dashboards[favIndex]);
      const otherDashboards = dashboards.filter((_, i) => !newFavorites.includes(i));
      
      newDashboards = [...favoriteDashboards, ...otherDashboards];
      
      // Update favorites indices to match new order
      newFavorites = newFavorites.map((_, i) => i);
    }
    
    setFavorites(newFavorites);
    setDashboards(newDashboards);
  };

  // Filter dashboards based on search query
  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get random views count
  const getRandomViews = () => Math.floor(Math.random() * 1000) + 100;

  // Get random date
  const getRandomDate = () => {
    const dates = [
      "2h ago",
      "Yesterday",
      "3d ago",
      "1w ago",
      "2w ago"
    ];
    return dates[Math.floor(Math.random() * dates.length)];
  };

  // Get category from dashboard name
  const getCategory = (name: string) => {
    if (name.includes("Sales") || name.includes("Revenue")) return "Sales";
    if (name.includes("Marketing")) return "Marketing";
    if (name.includes("User") || name.includes("Customer")) return "Analytics";
    if (name.includes("Financial")) return "Finance";
    if (name.includes("Project")) return "Project";
    if (name.includes("Team")) return "HR";
    return "General";
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Sales: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      Marketing: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      Analytics: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      Finance: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      Project: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      HR: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      General: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    };
    return colors[category] || colors.General;
  };

  // Check if a dashboard is favorite in the current order
  const isFavorite = (index: number) => {
    return favorites.includes(index);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Dashboards
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your data visualization workspaces
          </p>
        </div>

        {/* Search */}
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Dashboards List */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-1 sm:p-2">
            {/* {loading ? (
              <Loading />
            ) : ( */}
              <div className="space-y-1">
                {filteredDashboards.map((dashboard, index) => (
                  <div
                    key={index}
                    className="group p-2 sm:p-3 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-200 cursor-pointer rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    // onClick={() => redirectToDashboard(dashboard)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Icon - Hidden on mobile */}
                        <div className="hidden xs:block p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate text-xs sm:text-sm">
                              {dashboard}
                            </h3>
                            {/* Badge - Hidden on small mobile */}
                            <Badge 
                              variant="secondary"
                              className={`${getCategoryColor(getCategory(dashboard))} text-xs font-normal px-1.5 py-0 hidden sm:inline-flex`}
                            >
                              {getCategory(dashboard)}
                            </Badge>
                            {/* Star indicator - Always visible for favorites */}
                            {isFavorite(index) && (
                              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Metadata - Simplified on mobile */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="text-xs">{getRandomDate()}</span>
                            </div>
                            {/* Views - Hidden on small screens */}
                            <div className="hidden sm:flex items-center gap-0.5 sm:gap-1">
                              <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="text-xs">{getRandomViews()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {/* Favorite Button - Always visible on mobile */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-70 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/20"
                          onClick={(e) => toggleFavorite(index, e)}
                        >
                          <Star className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                            isFavorite(index) 
                              ? "text-yellow-500 fill-yellow-500" 
                              : "text-gray-400 hover:text-yellow-500"
                          }`} />
                        </Button>

                        {/* More Options - Always visible */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-70 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="text-xs w-28 sm:w-32"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem 
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(index, e);
                              }}
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Star className={`h-3.5 w-3.5 mr-2 ${
                                isFavorite(index) ? "fill-yellow-500 text-yellow-500" : ""
                              }`} />
                              {isFavorite(index) ? "Unfavorite" : "Favorite"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDashboardToDelete(index);
                                setOpendelete(true);
                              }}
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty state */}
                {filteredDashboards.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-1 sm:mb-2 opacity-50" />
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      No dashboards found
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 sm:mb-3">
                      {searchQuery ? "Try different search terms" : "Create your first dashboard"}
                    </p>
                    <Button 
                      onClick={() => setOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-xs h-7 sm:h-8"
                    >
                      <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      New Dashboard
                    </Button>
                  </div>
                )}
              </div>
            {/* )} */}
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <Button
          className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 border-0"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Dialog to Add Dashboard */}
        {/* <DialogDashboard
          open={open}
          setOpen={setOpen}
          name={name}
          setName={setName}
          addDashboard={addDashboard}
        /> */}

        {/* Dialog to delete dashboard */}
        {/* <ConfirmDialog
          open={opendelete}
          setOpen={setOpendelete}
          handleConfirm={handleDeleteConfirmation}
        /> */}
      </div>
    </div>
  );
}