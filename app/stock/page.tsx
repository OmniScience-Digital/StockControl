"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import ComponentItem from "./Components/form";
import { Component } from "@/types/form.types";
import Navbar from "@/components/layout/navbar";
import { formSave } from "@/services/form.service";
import ResponseModal from "@/components/response/response";
import { client } from "@/services/schema";

export default function ComponentForm() {
  const [components, setComponents] = useState<Component[]>([
    // { id: "1", name: "Production Cupboard", subComponents: [{ id: "1-1", key: "", value: 0, isWithdrawal: false }] }
  ]);
  const [loading, setLoading] = useState(false);

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  async function listComponents() {
    const { data: subComponents, errors: queryErrors } =
      await client.models.SubComponent.listSubComponentByComponentId({
        componentId: "1758793475020-cvo372",
      });

    console.log(subComponents);

    // client.models.Component.observeQuery().subscribe({
    //   next: async (data) => {
    //     try {
    //       const componentsWithSubComponents = await Promise.all(
    //         data.items.map(async (component) => {

    //           const { data: subComponents, errors: queryErrors } =
    //             await client.models.SubComponent.listSubComponentByComponentIdAndKey({
    //               componentId: component.id,
    //               key: { beginsWith: component.id }
    //             });




    //           if (queryErrors) {
    //             console.error('Error fetching subcomponents:', queryErrors);
    //             return {
    //               id: component.id,
    //               name: component.name || "", // Handle null case
    //               subComponents: []
    //             };
    //           }

    //           // Transform the subcomponents to match your expected structure
    //           const transformedSubComponents = (subComponents || []).map(sub => ({
    //             id: sub.id,
    //             key: sub.key || "",
    //             value: sub.value || 0,
    //             isWithdrawal: sub.isWithdrawal || false,
    //             componentId: sub.componentId
    //           }));

    //           return {
    //             id: component.id,
    //             name: component.name || "",
    //             subComponents: transformedSubComponents
    //           };
    //         })
    //       );

    //       setComponents(componentsWithSubComponents);

    //     } catch (error) {
    //       console.error('Error in observeQuery subscription:', error);
    //     }
    //   },
    //   error: (error: any) => {
    //     console.error('Subscription error:', error);
    //   }
    // });
  }

  useEffect(() => {
    listComponents();
  }, []);


  const keys = [
    "115mm grinding discs",
    "115mm cutting discs",
    "Welding lens auto dark",
    "Welding lens shade",
    "Welding class clear",
    "Anti spatter can",
    "Welding tips and adaptors",
    "14 mm slugger",
    "30 mm slugger"
  ];


  // State for available keys that can be updated when new keys are added
  const [availableKeys, setAvailableKeys] = useState<string[]>(keys);

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

  // New function to handle adding new keys
  const handleAddNewKey = (newKey: string) => {
    // Check if key already exists to avoid duplicates
    if (!availableKeys.includes(newKey)) {
      setAvailableKeys(prev => [...prev, newKey]);
    }
  };

  const [lastSaved, setLastSaved] = useState<
    Record<string, Record<string, { value: number; isWithdrawal: boolean }>>
  >();

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setLoading(true);
      e.preventDefault();

      const result = components.reduce((acc, component) => {
        if (component.name.trim() !== "") {
          const subAcc = component.subComponents.reduce((subAcc, sub) => {
            if (sub.key.trim() !== "") {
              subAcc[sub.key] = {
                value: sub.value,
                isWithdrawal: sub.isWithdrawal,
              };
            }
            return subAcc;
          }, {} as Record<string, { value: number; isWithdrawal: boolean }>);

          if (Object.keys(subAcc).length > 0) {
            acc[component.name] = subAcc;
          }
        }
        return acc;
      }, {} as Record<string, Record<string, { value: number; isWithdrawal: boolean }>>);


      // // Prevent saving empty form
      // if (Object.keys(result).length === 0) {
      //   console.warn("Skipping save: form is empty");
      //   return;
      // }

      // // 2️ Prevent saving duplicate form
      // if (lastSaved && JSON.stringify(lastSaved) === JSON.stringify(result)) {
      //   console.warn("Skipping save: form has not changed");
      //   return;
      // }


      // await formSave({ result });
      // setLastSaved(result);

      const res = await fetch("/api/click-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: 'USer 1', result: result }),
      });

      const resResponse = await res.json();



      setMessage(resResponse.message || "Successfully published to ClickUp");
      setShow(true);
      setSuccessful(resResponse.success);


      // setComponents([])
      // setAvailableKeys([]);

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
              <div className="text-sm text-muted-foreground ">
                <p>• Click "Add New Key..." in any dropdown to create custom subcomponents</p>
                <p>• Use the search feature to quickly find existing keys</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <form onSubmit={handleSubmit} className="space-y-4 min-w-[600px]" >
                  {components.map((component) => (
                    <ComponentItem
                      key={component.id}
                      component={component}
                      availableKeys={availableKeys}
                      usedKeys={getUsedKeys()}
                      onUpdate={(updatedComponent) => updateComponent(component.id, updatedComponent)}
                      onRemove={() => removeComponent(component.id)}
                      isRemovable={components.length > 1}
                      onAddNewKey={handleAddNewKey}
                    />
                  ))}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addComponent}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Component
                    </Button>

                    <Button type="submit" className="flex-1 cursor-pointer">
                      Submit
                      {loading && (
                        <Loader2 className="ml-2 h-8 w-8 animate-spin text-background" />
                      )}
                    </Button>

                  </div>
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