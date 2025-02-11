"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Domain } from "@/components/domain-list";
import { useWaitForTransactionReceipt, useWriteContract, type BaseError } from "wagmi";
import { toast } from "sonner";
import { encodeFunctionData, isAddress, toHex } from "viem";
import { dnsEncode } from "@/lib/utils";
import { resolverABI } from "@/lib/abi/resolver";
import { multicallABI } from "@/lib/abi/multical";
import { useOtherInfo } from "@/hooks/useOtherInfo";
import { useAddressInfo } from "@/hooks/useAddressInfo";
import { useTextInfo } from "@/hooks/useTextInfo";

type ManageDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  domain: Domain;
  resolverAddress: `0x${string}`;
};

export const initialRecords = [
  { label: "avatar", value: "" },
  { label: "url", value: "" },
  { label: "twitter", value: "" },
  { label: "github", value: "" },
  { label: "description", value: "" },
];

export function ManageDialog({ open, setOpen, domain, resolverAddress }: ManageDialogProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [state, setState] = useState({
    records: initialRecords,
    contentHash: "",
    abi: "",
    address: "",
  });

  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const label = useMemo(() => domain?.name?.split(".")[0] || "", [domain?.name]);

  const { dataDecoded: otherData, isUpdate, refetchOther } = useOtherInfo(activeTab, label, resolverAddress);
  const { addr: addressData, hasAddr: isAddressSuccess, refetchAddress } = useAddressInfo(activeTab, label, resolverAddress);
  const { textDecoded, isUpdate: textUpdate, refetchText } = useTextInfo(activeTab, label, resolverAddress);

  const handleUpdateValue = useCallback((index: number, value: string) => {
    setState((prev) => {
      const updatedRecords = [...prev.records];
      updatedRecords[index].value = value;
      return { ...prev, records: updatedRecords };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!domain) return;

    const calls = [];
    if (activeTab === "text") {
      calls.push(
        ...state.records.map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), record.label, record.value],
          })
        )
      );
    } else if (activeTab === "address") {
      if (!isAddress(state.address)) {
        toast.error("Invalid Ethereum address");
        return;
      }
      calls.push(
        encodeFunctionData({
          abi: resolverABI,
          functionName: "setAddr",
          args: [dnsEncode(label), state.address],
        })
      );
    } else if (activeTab === "other") {
      if (state.contentHash) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setContenthash",
            args: [dnsEncode(label), toHex(state.contentHash)],
          })
        );
      }
      if (state.abi) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setData",
            args: [dnsEncode(label), "abi", toHex(state.abi)],
          })
        );
      }
    }

    if (calls.length > 0) {
      writeContract({
        address: resolverAddress,
        abi: multicallABI,
        functionName: "multicall",
        args: [calls],
      });
    }
  }, [activeTab, domain, label, resolverAddress, state, writeContract]);

  useEffect(() => {
    if (writeErr) {
      toast.dismiss();
      console.error("Contract Write Error:", writeErr);
      toast.error("Transaction failed", { description: (writeErr as BaseError)?.shortMessage || writeErr.message });
    }

    if (isConfirming) {
      toast.loading("Waiting for confirmation...");
    }

    if (isConfirmed) {
      toast.dismiss();
      setOpen(false);
      refetchText();
      refetchAddress();
      refetchOther();
      setState({ records: initialRecords, contentHash: "", abi: "", address: "" });
      toast.success("Records updated successfully!");
    }
  }, [writeErr, isConfirming, isConfirmed, setOpen]);

  useEffect(() => {
    switch (activeTab) {
      case "text":
        setState((prev) => ({ ...prev, records: textDecoded }));
        break;
      case "address":
        setState((prev) => ({ ...prev, address: addressData }));
        break;
      case "other":
        if (isUpdate) {
          setState((prev) => ({ ...prev, contentHash: otherData[0], abi: otherData[1] }));
        } else {
          setState((prev) => ({ ...prev, contentHash: "", abi: "" }));
        }
        break;
    }
  }, [activeTab, isUpdate, isAddressSuccess, textUpdate, addressData, otherData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{domain?.name || "Edit"} Records</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full my-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="font-bold">Text</TabsTrigger>
            <TabsTrigger value="address" className="font-bold">Address</TabsTrigger>
            <TabsTrigger value="other" className="font-bold">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4 space-y-2">
            {state.records.map((record, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Label className="font-bold text-gray-500 text-xl">{record.label}</Label>
                <Input className="text-gray-500" value={record.value} onChange={(e) => handleUpdateValue(index, e.target.value)} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="address" className="mt-4 space-y-2">
            <Label className="font-bold text-gray-500 text-sm">EVM Address</Label>
            <Input className="text-gray-500" value={state.address} onChange={(e) => setState((prev) => ({ ...prev, address: e.target.value }))} />
          </TabsContent>

          <TabsContent value="other" className="mt-4 space-y-2">
            <Label className="font-bold text-gray-500 text-sm">Content Hash</Label>
            <Input className="text-gray-500 mb-2" value={state.contentHash} onChange={(e) => setState((prev) => ({ ...prev, contentHash: e.target.value }))} />
            <Label className="font-bold text-gray-500 text-sm">ABI</Label>
            <Input className="text-gray-500" value={state.abi} onChange={(e) => setState((prev) => ({ ...prev, abi: e.target.value }))} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-2">
          <Button className="w-1/2" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="w-1/2" onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}