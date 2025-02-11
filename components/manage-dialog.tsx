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
import {useEffect, useState} from "react";
import {Label} from "@/components/ui/label";
import {Domain} from "@/components/domain-list";
import {type BaseError, useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import {toast} from "sonner";
import {encodeFunctionData, isAddress, toHex} from "viem";
import {dnsEncode} from "@/lib/utils";
import {resolverABI} from "@/lib/abi/resolver";
import {multicallABI} from "@/lib/abi/multical";
import {useOtherInfo} from "@/hooks/useOtherInfo";
import {useAddressInfo} from "@/hooks/useAddressInfo";
import {useTextInfo} from "@/hooks/useTextInfo";

type DialogDemoProps = {
  open: boolean,
  setOpen: (open: boolean) => void,
  domain: Domain,
  resolverAddress: `0x${string}`,
};
type TextRecord = {
  label: string;
  value: string;
}

export const initialRecords: TextRecord[] = [
  { label: "avatar", value: "" },
  { label: "url", value: "" },
  { label: "twitter", value: "" },
  { label: "github", value: "" },
  { label: "description", value: "" }
];

export function ManageDialog({open, setOpen, domain, resolverAddress}: DialogDemoProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [records, setRecords] = useState(initialRecords);
  // const [typeError, setTypeError] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [abi, setAbi] = useState("");
  const [address, setAddress] = useState("");
  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const {dataDecoded: dataOther, isUpdate} = useOtherInfo(activeTab, domain?.name.split(".")[0], resolverAddress);
  const {addr: addressData, hasAddr: isAddressSuccess} = useAddressInfo(activeTab, domain?.name.split(".")[0], resolverAddress);
  const {textDecoded, isUpdate: textUpdate} = useTextInfo(activeTab, domain.name.split(".")[0], resolverAddress);

  const handleUpdateValue = (index: number, value: string) => {
    const updatedRecords = [...records];
    updatedRecords[index].value = value;
    setRecords(updatedRecords);
  };

  const saveTextRecords = (label: string) => {
    const calls = records.map((record) =>
      encodeFunctionData({
        abi: resolverABI,
        functionName: 'setText',
        args: [dnsEncode(label), record.label, record.value],
      })
    );
    console.log("Save changes calls", calls);

    writeContract({
      address: resolverAddress,
      abi: multicallABI,
      functionName: 'multicall',
      args: [calls],
    });
  }

  const saveOtherRecords = (label: string) => {
    const calls =[];
    if (contentHash) {
      calls.push(encodeFunctionData({
        abi: resolverABI,
        functionName: 'setContenthash',
        args: [dnsEncode(label), toHex(contentHash)],
      }));
    }
    if (abi) {
      calls.push(encodeFunctionData({
        abi: resolverABI,
        functionName: 'setData',
        args: [dnsEncode(label),"abi", toHex(abi)],
      }));
    }

    console.log("Save changes calls", calls);
    writeContract({
      address: resolverAddress,
      abi: multicallABI,
      functionName: 'multicall',
      args: [calls],
    });
  }

  const saveAddressRecords = (label: string) => {
    // validate address
    if (!address) {
      toast.error("Please enter address");
      return;
    }
    // validate is EVM address
    if (!isAddress(address)) {
      toast.error("Invalid address");
      return;
    }
    writeContract({
      address: resolverAddress,
      abi: resolverABI,
      functionName: 'setAddr',
      args: [dnsEncode(label), address],
    });
  }

  const handleSaveChange = () => {
    if (!domain) return;
    const label = domain.name.split(".")[0];

    switch (activeTab) {
      case "text":
        saveTextRecords(label);
        break;
      case "address":
        saveAddressRecords(label);
        break;
      case "other":
        saveOtherRecords(label);
        break;
    }
  }

  useEffect(() => {
    if (writeErr) {
      toast.dismiss();
      console.error("Error writing contract:", writeErr);
      toast.error("Failed to set records!", { description: (writeErr as BaseError).shortMessage || writeErr.message });
    }

    if (isConfirming) {
      toast.loading("Waiting for confirmation...");
    }

    if (isConfirmed) {
      toast.dismiss();
      setOpen(false);
      setContentHash("");
      setAbi("");
      setRecords(initialRecords);
      toast.success("Set records successfully!");
    }
  }, [writeErr, isConfirmed, isConfirming]);

  useEffect(() => {
    switch (activeTab) {
      case "text":
        setRecords(textDecoded);
        break;
      case "address":
        setAddress(addressData);
        break;
      case "other":
        if(isUpdate) {
          setContentHash(dataOther[0]);
          setAbi(dataOther[1]);
        } else {
          setContentHash("");
          setAbi("");
        }
        break;
    }
  }, [activeTab, isUpdate, isAddressSuccess, textUpdate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{domain? domain.name: "edit"} records</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full my-4">
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
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="address" className="mt-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div>
                <Label className="font-bold text-gray-500 text-sm">ETH</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="text-gray-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address..."
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="other" className="mt-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div>
                <Label className="font-bold text-gray-500 text-sm">Content hash</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="text-gray-500"
                  value={contentHash}
                  onChange={(e) => setContentHash(e.target.value)}
                  placeholder="e.g. ipfs://"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <Label className="font-bold text-gray-500 text-sm">ABI</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="text-gray-500"
                  value={abi}
                  onChange={(e) => setAbi(e.target.value)}
                  placeholder="Enter ABI..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-2 ">
          <Button variant="outline" className="w-1/2" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="w-1/2" onClick={handleSaveChange}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
