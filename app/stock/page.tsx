"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import ComponentItem from "./Components/form"; 
import { Component } from "@/types/form.types";
import Navbar from "@/components/layout/navbar";
import ResponseModal from "@/components/response/response";
import { client } from "@/services/schema";


export default  function ComponentForm() {
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [displayedComponents, setDisplayedComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [componentsLoading, setcomponentLoading] = useState(false);

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);

useEffect(() => {
  let subscription: any;

  const listComponents = () => {
    try {
      setcomponentLoading(true);
      subscription = client.models.Component.observeQuery().subscribe({
        next: async (componentData) => {
          try {
            const componentsWithSubComponents = await Promise.all(
              componentData.items.map(async (component) => {
                const { data: subComponents, errors } =
                  await client.models.SubComponent.listSubComponentByComponentIdAndKey({
                    componentId: component.id,
                  });

                if (errors) {
                  console.error("Error fetching subcomponents:", errors);
                  return {
                    id: component.id,
                    name: component.name || "",
                    isWithdrawal: (component as any).isWithdrawal || false,
                    subComponents: [],
                  };
                }

                const transformedSubComponents = (subComponents || []).map((sub) => ({
                  id: sub.id,
                  key: sub.key || "",
                  value: String(sub.value), 
                  componentId: sub.componentId,
                }));

                return {
                  id: component.id,
                  name: component.name || "",
                  isWithdrawal: (component as any).isWithdrawal || false,
                  subComponents: transformedSubComponents,
                };
              })
            );

            // Set availableKeys AFTER processing all components
            const allKeys = componentsWithSubComponents.flatMap(comp => 
              comp.subComponents.map(sub => sub.key).filter(key => key.trim() !== "")
            );
            setAvailableKeys(allKeys);

            setAllComponents(componentsWithSubComponents);
          } catch (err) {
            console.error("Error in observeQuery processing:", err);
          } finally {
            setcomponentLoading(false);
          }
        },
        error: (err) => {
          console.error("Subscription error:", err);
          setcomponentLoading(false);
        },
      });
    } catch (error) {
      console.error("Error listing components:", error);
      setcomponentLoading(false);
    }
  };

  listComponents();

  // Cleanup function - unsubscribe when component unmounts
  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}, []);

  const getFilteredKeysForComponent = (componentName: string): string[] => {
    if (!componentName || componentName === "Select a component") return [];
    
    // Find the selected component from allComponents
    const selectedComponent = allComponents.find(comp => comp.name === componentName);
    
    if (!selectedComponent) return []; // Return empty if component not found
    
    // Return only the keys that belong to this specific component
    return selectedComponent.subComponents.map(sub => sub.key).filter(key => key.trim() !== "");
  };

  // NEW: Get used component IDs (excluding the current component)
  const getUsedComponentIds = (currentComponentId?: string): string[] => {
    return displayedComponents
      .filter(comp => comp.id !== currentComponentId && comp.name.trim() !== "")
      .map(comp => {
        // Find the original component ID from allComponents based on name
        const originalComponent = allComponents.find(ac => ac.name === comp.name);
        return originalComponent?.id || comp.id;
      });
  };

  // Add a new empty component AT THE TOP
  const addNewComponent = () => {
    const newComponent = {
      id: Date.now().toString(),
      name: "", // Start with empty name instead of "Select a component"
      isWithdrawal: false,
      subComponents: [{ id: `${Date.now()}-1`, key: "", value: "", componentId: Date.now().toString() }]
    };
    
    // Add to the beginning of the array (top)
    setDisplayedComponents([newComponent, ...displayedComponents]);
  };

  // Start with one empty component automatically
  useEffect(() => {
    if (displayedComponents.length === 0) {
      addNewComponent();
    }
  }, []);

  const removeComponent = (id: string) => {
    setDisplayedComponents(displayedComponents.filter((component) => component.id !== id));
  };

  const updateComponent = (id: string, updatedComponent: Component) => {
    setDisplayedComponents(
      displayedComponents.map((component) =>
        component.id === id ? updatedComponent : component
      )
    );
  };

  const handleAddNewKey = (newKey: string) => {
    if (!availableKeys.includes(newKey)) {
      setAvailableKeys(prev => [...prev, newKey]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setLoading(true);
      e.preventDefault();

      const result = displayedComponents.reduce((acc, component) => {
        if (component.name.trim() !== "") {
          const subAcc = component.subComponents.reduce((subAcc, sub) => {
            if (sub.key.trim() !== "") {
              subAcc[sub.key] = {
                value: sub.value,
              };
            }
            return subAcc;
          }, {} as Record<string, { value: string }>);

          if (Object.keys(subAcc).length > 0) {
            acc[component.name] = {
              isWithdrawal: component.isWithdrawal,
              subComponents: subAcc
            };
          }
        }
        return acc;
      }, {} as Record<string, { 
        isWithdrawal: boolean; 
        subComponents: Record<string, { value: string }> 
      }>);


      const res = await fetch("/api/click-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: 'User 1', 
          result: result 
        }),
      });

      const resResponse = await res.json();

      setMessage(resResponse.message || "Successfully published to ClickUp");
      setShow(true);
      setSuccessful(resResponse.success);

      setDisplayedComponents([
  {
    id: Date.now().toString(),
    name: "",
    isWithdrawal: false,
    subComponents: [
      { id: `${Date.now()}-1`, key: "", value: "", componentId: Date.now().toString() }
    ]
  }
]);
setAvailableKeys([]); 


    } catch (error) {
      console.error(error);
      setSuccessful(false);
      setMessage("Failed to publish to ClickUp");
      setShow(true);
    } finally {
      setLoading(false);
    }
  };

  const getUsedKeys = () => {
    const usedKeys: string[] = [];
    displayedComponents.forEach(component => {
      component.subComponents.forEach(sub => {
        if (sub.key) usedKeys.push(sub.key);
      });
    });
    return usedKeys;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="flex-1 p-6 mt-20">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Component and Subcomponent Form
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>• Select a component ,add/remove subcomponents as needed </p>
                <p>• Choose intake or withdrawal for the entire component</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <form onSubmit={handleSubmit} className="space-y-6 min-w-[600px]">
                  {/* Add Component Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addNewComponent}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>

                  {displayedComponents.map((component) => (
                    <ComponentItem
                      key={component.id}
                      componentsLoading={componentsLoading}
                      setcomponentLoading={setcomponentLoading}
                      component={component}
                      availableKeys={getFilteredKeysForComponent(component.name)}
                      usedKeys={getUsedKeys()}
                      usedComponentIds={getUsedComponentIds(component.id)} 
                      allComponents={allComponents}
                      onUpdate={(updatedComponent) => updateComponent(component.id, updatedComponent)}
                      onRemove={() => removeComponent(component.id)}
                      isRemovable={true}
                      onAddNewKey={handleAddNewKey}
                    />
                  ))}
            

                  {/* Submit Button */}
                  {displayedComponents.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="cursor-pointer" disabled={loading}>
                        Submit
                        {loading && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                      </Button>
                    </div>
                  )}
                </form>

                {show && (
                  <ResponseModal
                    successful={successful}
                    message={message}
                    setShow={setShow}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}