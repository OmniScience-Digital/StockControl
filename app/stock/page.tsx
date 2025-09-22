"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ComponentItem from "./Components/form";
import { Component, availableKeys } from "@/types/form.types";
import Navbar from "@/components/layout/navbar";

export default function ComponentForm() {
  const [components, setComponents] = useState<Component[]>([
    { id: "1", name: "", subComponents: [{ id: "1-1", key: "", value: 0, isWithdrawal: false }] }
  ]);

  const addComponent = () => {
    setComponents([
      ...components,
      { 
        id: Date.now().toString(), 
        name: "", 
        subComponents: [{ id: `${Date.now()}-1`, key: "", value: 0, isWithdrawal: false }] 
      }
    ]);
  };

  const removeComponent = (id: string) => {
    if (components.length > 1) {
      setComponents(components.filter((component) => component.id !== id));
    }
  };

  const updateComponent = (id: string, updatedComponent: Component) => {
    setComponents(
      components.map((component) => 
        component.id === id ? updatedComponent : component
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all components have names and all subcomponents have keys
    const isValid = components.every(component => 
      component.name.trim() !== "" && 
      component.subComponents.every(sub => sub.key.trim() !== "")
    );

    if (!isValid) {
      alert("Please ensure all components have names and all subcomponents have keys selected");
      return;
    }

    // Convert to object for final submission
    const result = components.reduce((acc, component) => {
      acc[component.name] = component.subComponents.reduce((subAcc, sub) => {
        subAcc[sub.key] = {
          value: sub.value,
          isWithdrawal: sub.isWithdrawal
        };
        return subAcc;
      }, {} as Record<string, { value: number; isWithdrawal: boolean }>);
      return acc;
    }, {} as Record<string, Record<string, { value: number; isWithdrawal: boolean }>>);

    console.log("Form submitted:", result);
    // Here you would typically send the data to your API
  };

  const getUsedKeys = () => {
    const usedKeys: string[] = [];
    components.forEach(component => {
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
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {components.map((component) => (
                  <ComponentItem
                    key={component.id}
                    component={component}
                    availableKeys={availableKeys}
                    usedKeys={getUsedKeys()}
                    onUpdate={(updatedComponent) => updateComponent(component.id, updatedComponent)}
                    onRemove={() => removeComponent(component.id)}
                    isRemovable={components.length > 1}
                  />
                ))}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addComponent}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Component
                  </Button>

                  <Button type="submit" className="flex-1">
                    Submit
                  </Button>
                </div>
              </form>

              {/* Display current state for debugging */}
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Current State:</h3>
                <pre className="text-sm">
                  {JSON.stringify(components, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}