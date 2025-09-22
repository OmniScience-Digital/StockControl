import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Minus, PlusCircle } from "lucide-react";
import { Component } from "@/types/form.types";

interface ComponentItemProps {
  component: Component;
  availableKeys: string[];
  usedKeys: string[];
  onUpdate: (component: Component) => void;
  onRemove: () => void;
  isRemovable: boolean;
}

export default function ComponentItem({
  component,
  availableKeys,
  usedKeys,
  onUpdate,
  onRemove,
  isRemovable
}: ComponentItemProps) {
  const updateComponentName = (name: string) => {
    onUpdate({ ...component, name });
  };

  const addSubComponent = () => {
    const newSubComponent = {
      id: `${component.id}-${Date.now()}`,
      key: "",
      value: 0,
      isWithdrawal: false
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
    const numValue = parseFloat(value) || 0;
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId ? { ...sub, value: numValue } : sub
      )
    });
  };

  const toggleWithdrawal = (subComponentId: string) => {
    onUpdate({
      ...component,
      subComponents: component.subComponents.map((sub) =>
        sub.id === subComponentId
          ? { ...sub, isWithdrawal: !sub.isWithdrawal }
          : sub
      )
    });
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            value={component.name}
            onChange={(e) => updateComponentName(e.target.value)}
            placeholder="Component name (e.g., Speed Sensor)"
            className="w-full"
          />
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

      <div className="space-y-4 pl-6 border-l-2">
        <h4 className="font-medium">Subcomponents</h4>
        {component.subComponents.map((subComponent) => (
          <div
            key={subComponent.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1">
              <Select
                value={subComponent.key}
                onValueChange={(value) => updateSubComponentKey(subComponent.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcomponent" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      disabled={usedKeys.includes(key) && subComponent.key !== key}
                    >
                      {key}
                      {usedKeys.includes(key) && subComponent.key !== key && " (already used)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Input
                type="number"
                step="0.01"
                value={subComponent.value}
                onChange={(e) => updateSubComponentValue(subComponent.id, e.target.value)}
                placeholder="Enter value"
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant={subComponent.isWithdrawal ? "destructive" : "outline"}
              className={subComponent.isWithdrawal ? "" : "border-green-500 text-green-600"}
              size="icon"
              onClick={() => toggleWithdrawal(subComponent.id)}
              title={subComponent.isWithdrawal ? "Withdrawal" : "Addition"}
            >
              {subComponent.isWithdrawal ? (
                <Minus className="h-4 w-4" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeSubComponent(subComponent.id)}
              disabled={component.subComponents.length === 1}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSubComponent}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Subcomponent
        </Button>
      </div>
    </div>
  );
}