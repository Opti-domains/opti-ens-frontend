"use client";

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useState} from "react";
import { Plus, X } from "lucide-react";
import {Label} from "@/components/ui/label";
import {Domain} from "@/components/domain-list";

type DialogDemoProps = {
  open: boolean,
  setOpen: (open: boolean) => void,
  domain: Domain | null,
};

export function ManageDialog({open, setOpen, domain}: DialogDemoProps) {
  const [records, setRecords] = useState([{ label: "avatar", value: "https://euc.li/sepolia/ez42.eth" }]);
  const [newLabel, setNewLabel] = useState("");
  const [addingLabel, setAddingLabel] = useState(false);
  const [error, setError] = useState("");

  const checkDuplicateLabel = (label: string) => {
    return records.some(record => record.label.toLowerCase() === label.toLowerCase());
  };

  const handleAddRecord = () => {
    if (newLabel.trim()) {
      setRecords([...records, { label: newLabel, value: "" }]);
      setNewLabel("");
      setAddingLabel(false);
    }
  };

  const handleUpdateValue = (index: number, value: string) => {
    const updatedRecords = [...records];
    updatedRecords[index].value = value;
    setRecords(updatedRecords);
  };

  const handleRemoveRecord = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const handleLabelChange = (e) => {
    const label = e.target.value;
    setNewLabel(label);
    if (checkDuplicateLabel(label)) {
      setError(label+ " already exists");
    } else {
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{domain? domain.name: "edit"} records</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full my-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="font-bold">Text</TabsTrigger>
            <TabsTrigger value="address" className="font-bold">Address</TabsTrigger>
            <TabsTrigger value="other" className="font-bold">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4 space-y-4">
            {records.map((record, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div>
                  <Label className="font-bold text-gray-500 text-xl">{record.label}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="text-gray-500"
                    value={record.value}
                    onChange={(e) => handleUpdateValue(index, e.target.value)}
                    placeholder={`Enter value for ${record.label}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRecord(index)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}

            {addingLabel ? (
              <div
                className="flex items-center gap-2 border rounded-lg px-3 py-3 bg-gray-100">
                <div className="w-full">
                  <Input
                    className="bg-white"
                    value={newLabel}
                    onChange={handleLabelChange}
                    placeholder="Type a record name..."
                  />
                  {error && <Label className="text-red-600 font-light">{error}</Label>}
                </div>
                {newLabel.trim() ? (
                  <Button
                    variant="ghost"
                    className="font-bold text-red-600"
                    onClick={handleAddRecord}
                  >
                    Add
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="font-bold text-gray-400"
                    onClick={() => setAddingLabel(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={() => setAddingLabel(true)} variant="outline"
                      className="w-full flex items-center justify-center font-bold text-gray-500 text-xl">
                <Plus className="w-4 h-4 mr-2" /> Add record
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-2 ">
          <Button variant="outline" className="w-1/2" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="w-1/2" onClick={() => console.log("Updated Records:", records)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
