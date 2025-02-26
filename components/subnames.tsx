"use client";

import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "lucide-react";
import DomainTable from "@/components/domain-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useState} from "react";

type Props = {
  resolver: `0x${string}`;
  parentDomain: string
}

export default function Subnames({ resolver, parentDomain }: Props) {
  console.log(resolver);
  const [label, setLabel] = useState("");
  return (
    <div>
      <Card className="bg-gray-50 mb-6">
        <div className="flex flex-row items-center justify-between md:p-4 p-2">
          <span className="font-light italic md:text-base text-xs">Subnames let you create additional names from your existing name.</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="md:p-6 p-3 font-bold">
                <PlusIcon className="w-6 h-6 mr-1"/>
                New subname
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-center md:text-2xl">Create Subname</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-left font-bold text-xl text-gray-500">
                  Label
                </Label>
                <div className="relative w-full">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="rounded-lg"
                  />
                  <span
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 bg-gray-100 rounded-r-lg">
                    .{parentDomain}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

      </Card>
      <Card className="bg-gray-50 py-2">
        <DomainTable/>
      </Card>
    </div>
  );
}