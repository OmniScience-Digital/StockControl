import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Minus, PlusCircle, Plus, Search, X } from "lucide-react";
import { Component } from "@/types/form.types";
import { useState, useEffect } from "react";

interface ComponentItemProps {
  component: Component;
  availableKeys: string[];
  usedKeys: string[];
  onUpdate: (component: Component) => void;
  onRemove: () => void;
  isRemovable: boolean;
  onAddNewKey?: (newKey: string) => void;
  allComponents?: Component[];
  usedComponentIds?: string[];
}

export default function ComponentItem({
  component,
  availableKeys,
  usedKeys,
  onUpdate,
  onRemove,
  isRemovable,
  onAddNewKey,
  allComponents = [],
  usedComponentIds = []
}: ComponentItemProps) {
  const [isAddingNewKey, setIsAddingNewKey] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [isAddingNewComponent, setIsAddingNewComponent] = useState(false);
  const [newComponentInput, setNewComponentInput] = useState("");
  const [localAvailableKeys, setLocalAvailableKeys] = useState<string[]>(availableKeys);

  // Sync local availableKeys with prop changes
  useEffect(() => {
    setLocalAvailableKeys(availableKeys);
  }, [availableKeys]);

  // // Debug logging
  // useEffect(() => {
  //   console.log('ComponentItem Debug:', {
  //     availableKeys,
  //     localAvailableKeys,
  //     usedKeys,
  //     hasOnAddNewKey: !!onAddNewKey,
  //     componentId: component.id,
  //     subComponents: component.subComponents.map(sc => ({ id: sc.id, key: sc.key }))
  //   });
  // }, [availableKeys, localAvailableKeys, usedKeys, component]);

  const getFilteredComponents = () => {
    return allComponents.filter(comp =>
      comp.name?.toLowerCase().includes(componentSearchTerm.toLowerCase())
    );
  };

  const isComponentDisabled = (componentId: string) => {
    if (componentId === component.id) return false;
    return usedComponentIds.includes(componentId);
  };

  const updateComponentSelection = (componentId: string) => {
    if (componentId === "__add_new_component__") {
      setIsAddingNewComponent(true);
      setNewComponentInput("");
      setComponentSearchTerm("");
      return;
    }

    const selectedComponent = allComponents.find(comp => comp.id === componentId);
    if (selectedComponent) {
      onUpdate({
        ...selectedComponent,
        id: component.id,
        subComponents: [
          { id: `${Date.now()}-1`, key: "", value: "", componentId: Date.now().toString() }
        ]
      });
    }
  };

  const startAddingNewComponent = () => {
    setIsAddingNewComponent(true);
    setNewComponentInput("");
    setComponentSearchTerm("");
  };

  const cancelAddingNewComponent = () => {
    setIsAddingNewComponent(false);
    setNewComponentInput("");
    setComponentSearchTerm("");
  };

  const confirmNewComponent = () => {
    if (newComponentInput.trim()) {
      const newComponent: Component = {
        id: `new-${Date.now()}`,
        name: newComponentInput.trim(),
        subComponents: [
          { id: `${Date.now()}-1`, key: "", value: "", componentId: Date.now().toString() }
        ],
        isWithdrawal: false
      };
      
      onUpdate({
        ...newComponent,
        id: component.id
      });
    }
    cancelAddingNewComponent();
  };

  const addSubComponent = () => {
    const newSubComponent = {
      id: `${component.id}-${Date.now()}`,
      key: "",
      value: "",
      componentId: component.id
    };
    onUpdate({
      ...component,
      subComponents: [...component.subComponents, newSubComponent]
    });
  };

  const removeSubComponent = (subComponentId: string) => {
    if (component.subComponents.length > 1) {
      onUpdate({
        ...component,
        subComponents: component.subComponents.filter(
          (sub) => sub.id !== subComponentId
        )
      });
    }
  };

  const updateSubComponentKey = (subComponentId: string, key: string) => {
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, key } : sub
      )
    });
  };

  const updateSubComponentValue = (subComponentId: string, value: string) => {
    const stringValue = value || "";
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, value: stringValue } : sub
      )
    });
  };

  const startAddingNewKey = (subComponentId: string) => {
    setIsAddingNewKey(subComponentId);
    setNewKeyInput("");
    setSearchTerm("");
  };

  const cancelAddingNewKey = () => {
    setIsAddingNewKey(null);
    setNewKeyInput("");
    setSearchTerm("");
  };

  const confirmNewKey = (subComponentId: string) => {
    if (newKeyInput.trim()) {
      const trimmedKey = newKeyInput.trim();
      
      // Update locally immediately for better UX
      setLocalAvailableKeys(prev => {
        const newKeys = prev.includes(trimmedKey) ? prev : [...prev, trimmedKey];
        return newKeys;
      });

      // Call parent callback if provided
      if (onAddNewKey) {
        console.log('Calling onAddNewKey callback');
        onAddNewKey(trimmedKey);
      }

      // Update the subcomponent key
      updateSubComponentKey(subComponentId, trimmedKey);
    }
    cancelAddingNewKey();
  };

  const handleKeySelect = (subComponentId: string, value: string) => {
    if (value === "__add_new__") {
      startAddingNewKey(subComponentId);
    } else {
      updateSubComponentKey(subComponentId, value);
    }
  };

  // Use localAvailableKeys for filtering to ensure immediate updates
  const filteredKeys = localAvailableKeys.filter(key =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unusedKeys = localAvailableKeys.filter(key => !usedKeys.includes(key));

  const filteredComponents = getFilteredComponents();

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          {isAddingNewComponent ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  value={newComponentInput}
                  onChange={(e) => setNewComponentInput(e.target.value)}
                  placeholder="Enter new component name..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmNewComponent();
                    if (e.key === 'Escape') cancelAddingNewComponent();
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={cancelAddingNewComponent}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={confirmNewComponent}
                  disabled={!newComponentInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Select 
              value={component.id} 
              onValueChange={updateComponentSelection}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Select a component" >
                  {component.name || "Select a component..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search components..."
                      value={componentSearchTerm}
                      onChange={(e) => setComponentSearchTerm(e.target.value)}
                      className="pl-8 pr-8 h-9"
                    />
                    {componentSearchTerm && (
                      <X
                        className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                        onClick={() => setComponentSearchTerm("")}
                      />
                    )}
                  </div>
                </div>

                {filteredComponents.map((comp) => (
                  <SelectItem 
                    key={comp.id} 
                    value={comp.id}
                    disabled={isComponentDisabled(comp.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{comp.name || `Unnamed Component (${comp.id})`}</span>
                    {isComponentDisabled(comp.id) && comp.id !== component.id && (
                      <span className="text-xs text-red-500 ml-2">(already used)</span>
                    )}
                  </SelectItem>
                ))}

                <div className="border-t mt-1 pt-1">
                  <SelectItem 
                    value="__add_new_component__"
                    className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Component...
                  </SelectItem>
                </div>

                {filteredComponents.length === 0 && componentSearchTerm && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No components found matching "{componentSearchTerm}"
                    <div className="mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={startAddingNewComponent}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add "{componentSearchTerm}" as new component
                      </Button>
                    </div>
                  </div>
                )}

                {allComponents.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No components available
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={!isRemovable}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <span className="font-semibold text-sm">Transaction Type:</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={component.isWithdrawal ? "outline" : "default"}
            size="sm"
            onClick={() => onUpdate({ ...component, isWithdrawal: false })}
            className={`flex items-center gap-2 ${
              !component.isWithdrawal ? "bg-green-600 hover:bg-green-700" : ""
            }`}
          >
            <Plus className="h-3 w-3" />
            Intake
          </Button>
          <Button
            type="button"
            variant={component.isWithdrawal ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdate({ ...component, isWithdrawal: true })}
            className={`flex items-center gap-2 ${
              component.isWithdrawal ? "bg-red-600 hover:bg-red-700" : ""
            }`}
          >
            <Minus className="h-3 w-3" />
            Withdrawal
          </Button>
        </div>
      </div>

      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-600">Subcomponents</h4>
          <span className="text-sm text-gray-500 bg-background px-2 py-1 rounded">
            {component.subComponents.length} subcomponent(s)
          </span>
        </div>
        
        {component.subComponents.map((subComponent) => (
          <div
            key={subComponent.id}
            className="flex items-center gap-4 p-4 border rounded-lg bg-background"
          >
            <div className="flex-1 min-w-0">
              {isAddingNewKey === subComponent.id ? (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Input
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      placeholder="Enter new key name..."
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmNewKey(subComponent.id);
                        if (e.key === 'Escape') cancelAddingNewKey();
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={cancelAddingNewKey}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => confirmNewKey(subComponent.id)}
                      disabled={!newKeyInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {unusedKeys.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Suggestions: {unusedKeys.slice(0, 3).join(", ")}
                      {unusedKeys.length > 3 && `... and ${unusedKeys.length - 3} more`}
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  value={subComponent.key}
                  onValueChange={(value) => handleKeySelect(subComponent.id, value)}
                >
                  <SelectTrigger className="relative cursor-pointer">
                    <SelectValue placeholder="Select or add subcomponent">
                      {subComponent.key || "Select a key..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search keys..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-8 h-9"
                        />
                        {searchTerm && (
                          <X
                            className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                            onClick={() => setSearchTerm("")}
                          />
                        )}
                      </div>
                    </div>

                    {filteredKeys.length > 0 ? (
                      filteredKeys.map((key) => (
                        <SelectItem
                          key={key}
                          value={key}
                          disabled={usedKeys.includes(key) && subComponent.key !== key}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span>{key}</span>
                          {usedKeys.includes(key) && subComponent.key !== key && (
                            <span className="text-xs text-red-500 ml-2">(used)</span>
                          )}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        No keys available
                      </div>
                    )}

                    <div className="border-t mt-1 pt-1">
                      <SelectItem 
                        value="__add_new__"
                        className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add New Key...
                      </SelectItem>
                    </div>

                    {filteredKeys.length === 0 && searchTerm && (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        No keys found matching "{searchTerm}"
                        <div className="mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startAddingNewKey(subComponent.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Add "{searchTerm}" as new key
                          </Button>
                        </div>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1">
              <Input
                type="number"
                step="1"
                value={subComponent.value}
                onChange={(e) => updateSubComponentValue(subComponent.id, e.target.value)}
                placeholder="Enter value"
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeSubComponent(subComponent.id)}
              disabled={component.subComponents.length === 1}
              className="shrink-0 hover:border-red-300 hover:text-red-600 cursor-pointer"
              title="Remove subcomponent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSubComponent}
          className="flex items-center gap-2 w-full border-dashed hover:border-solid cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Add Subcomponent
        </Button>
      </div>
    </div>
  );
}