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
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Domain } from "@/components/domain-list";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type BaseError,
} from "wagmi";
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
  { label: "Twitter", key: "com.twitter", value: "" },
  { label: "Github", key: "com.github", value: "" },
  { label: "Telegram", key: "org.telegram", value: "" },
  { label: "Discord", key: "com.discord", value: "" },
  { label: "Farcaster", key: "xyz.farcaster", value: "" },
];

export function ManageDialog({
  open,
  setOpen,
  domain,
  resolverAddress,
}: ManageDialogProps) {
  // Track which tab is active
  const [activeTab, setActiveTab] = useState("text");

  // Local form state
  const [state, setState] = useState({
    records: initialRecords,
    contenthash: "",
    display: "",
    description: "",
    avatar: "",
    email: "",
    url: "",
    address: "",
  });

  // Wagmi writes
  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Label in manage is domain name
  const label = domain.name;

  // Hooks that read on-chain data (refetched when tab changes)
  const {
    dataDecoded: otherData,
    isUpdate,
    refetchOther,
  } = useOtherInfo(activeTab, label, resolverAddress);
  const { addr: addressData, refetchAddress } = useAddressInfo(
    activeTab,
    label,
    resolverAddress
  );
  const { textDecoded, refetchText } = useTextInfo(
    activeTab,
    label,
    resolverAddress
  );

  /**
   * Force the "text" tab whenever the dialog is opened.
   * This ensures "textDecoded" is fetched immediately.
   */
  useEffect(() => {
    if (open) {
      setActiveTab("general");
    }
  }, [open]);

  /**
   * Also optionally re-trigger the on-chain calls
   * whenever the dialog opens. This ensures you refetch
   * if the user has updated data previously.
   */
  useEffect(() => {
    if (open) {
      refetchText();
      refetchAddress();
      refetchOther();
    }
  }, [open, refetchText, refetchAddress, refetchOther]);

  // Handler to update local "records"
  const handleUpdateValue = useCallback((index: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.records];
      updated[index].value = value;
      return { ...prev, records: updated };
    });
  }, []);

  // Write logic based on which tab is active
  const handleSave = useCallback(() => {
    if (!domain) return;

    const calls: `0x${string}`[] = [];
    if (activeTab === "social") {
      // text records
      calls.push(
        ...state.records.map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), record.key, record.value],
          })
        )
      );
    } else if (activeTab === "address") {
      // address record
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
    } else if (activeTab === "general") {
      // content hash & ABI
      if (state.contenthash) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setContenthash",
            args: [dnsEncode(label), toHex(state.contenthash)],
          })
        );
      }
      if (state.display) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), "display", state.display],
          })
        );
      }
      if (state.description) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), "description", state.description],
          })
        );
      }
      if (state.avatar) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), "avatar", state.avatar],
          })
        );
      }
      if (state.email) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), "email", state.email],
          })
        );
      }
      if (state.url) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(label), "url", state.url],
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

  // Show loading/error/success notifications
  useEffect(() => {
    if (writeErr) {
      toast.dismiss();
      console.error("Contract Write Error:", writeErr);
      toast.error("Transaction failed", {
        description: (writeErr as BaseError)?.shortMessage || writeErr.message,
      });
    }

    if (isConfirming) {
      toast.loading("Waiting for confirmation...");
    }

    if (isConfirmed) {
      toast.dismiss();
      // After success, close dialog & reset local state
      setOpen(false);
      setState({
        records: initialRecords,
        contenthash: "",
        display: "",
        description: "",
        avatar: "",
        email: "",
        url: "",
        address: "",
      });
      // Re-fetch new data so next time we open, it's updated
      refetchText();
      refetchAddress();
      refetchOther();

      toast.success("Records updated successfully!");
    }
  }, [
    writeErr,
    isConfirming,
    isConfirmed,
    setOpen,
    refetchText,
    refetchAddress,
    refetchOther,
  ]);

  /**
   * On tab changes, fill local form state from our hooks
   */
  useEffect(() => {
    if (activeTab === "social") {
      setState((prev) => ({ ...prev, records: textDecoded }));
    } else if (activeTab === "address") {
      setState((prev) => ({ ...prev, address: addressData }));
    } else if (activeTab === "general") {
      if (isUpdate) {
        setState((prev) => ({
          ...prev,
          contenthash: otherData.contenthash,
          display: otherData.display,
          description: otherData.description,
          avatar: otherData.avatar,
          email: otherData.email,
          url: otherData.url,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          contenthash: "",
          display: "",
          description: "",
          avatar: "",
          email: "",
          url: "",
        }));
      }
    }
  }, [activeTab, textDecoded, addressData, otherData, isUpdate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{domain?.name || "Edit"} Records</DialogTitle>
        </DialogHeader>

        {/* TABS */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="my-4 w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="font-bold">
              General
            </TabsTrigger>
            <TabsTrigger value="address" className="font-bold">
              Address
            </TabsTrigger>
            <TabsTrigger value="social" className="font-bold">
              Social
            </TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="mt-4">
            <Label className="text-sm font-bold text-gray-500">
              Display Name
            </Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.display}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  display: e.target.value,
                }))
              }
            />

            <Label className="text-sm font-bold text-gray-500">
              Description
            </Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.description}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <Label className="text-sm font-bold text-gray-500">
              Avatar Image URL
            </Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.avatar}
              onChange={(e) =>
                setState((prev) => ({ ...prev, avatar: e.target.value }))
              }
            />

            <Label className="text-sm font-bold text-gray-500">Email</Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.email}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />

            <Label className="text-sm font-bold text-gray-500">URL</Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.url}
              onChange={(e) =>
                setState((prev) => ({ ...prev, url: e.target.value }))
              }
            />

            <Label className="text-sm font-bold text-gray-500">
              Content Hash
            </Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.contenthash}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  contenthash: e.target.value,
                }))
              }
            />
          </TabsContent>

          {/* ADDRESS TAB */}
          <TabsContent value="address" className="mt-4">
            <Label className="text-sm font-bold text-gray-500">
              EVM Address
            </Label>
            <Input
              className="text-gray-500"
              value={state.address}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </TabsContent>

          {/* SOCIAL TAB */}
          <TabsContent value="social" className="mt-4">
            {state.records.map((record, index) => (
              <div key={index} className="flex flex-col mb-2">
                <Label className="text-sm font-bold text-gray-500">
                  {record.label}
                </Label>
                <Input
                  className="text-gray-500"
                  value={record.value}
                  onChange={(e) => handleUpdateValue(index, e.target.value)}
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* ACTIONS */}
        <div className="flex justify-center gap-2">
          <Button
            className="w-1/2"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button className="w-1/2" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
