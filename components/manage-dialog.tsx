"use client";

import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {useState, useEffect, useCallback, useMemo} from "react";
import {Label} from "@/components/ui/label";
import {Domain} from "@/components/domain-list";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type BaseError,
} from "wagmi";
import {toast} from "sonner";
import {encodeFunctionData, isAddress, toHex} from "viem";
import {dnsEncode} from "@/lib/utils";
import {resolverABI} from "@/lib/abi/resolver";
import {multicallABI} from "@/lib/abi/multical";
import {useOtherInfo} from "@/hooks/useOtherInfo";
import {useAddressInfo} from "@/hooks/useAddressInfo";
import {useTextInfo} from "@/hooks/useTextInfo";

type ManageDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  domain: Domain;
  resolverAddress: `0x${string}`;
};

export const initialRecords = [
  {label: "avatar", value: ""},
  {label: "url", value: ""},
  {label: "twitter", value: ""},
  {label: "github", value: ""},
  {label: "description", value: ""},
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
    contentHash: "",
    abi: "",
    address: "",
  });

  // Wagmi writes
  const {data: hash, error: writeErr, writeContract} = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({hash});

  // Extract the subdomain label from "uni.eth" => "uni"
  const label = useMemo(() => {
    return domain?.name?.split(".")[0] || "";
  }, [domain?.name]);

  // Hooks that read on-chain data (refetched when tab changes)
  const {
    dataDecoded: otherData,
    isUpdate,
    refetchOther,
  } = useOtherInfo(activeTab, label, resolverAddress);
  const {
    addr: addressData,
    refetchAddress,
  } = useAddressInfo(activeTab, label, resolverAddress);
  const {
    textDecoded,
    refetchText,
  } = useTextInfo(activeTab, label, resolverAddress);

  /**
   * Force the "text" tab whenever the dialog is opened.
   * This ensures "textDecoded" is fetched immediately.
   */
  useEffect(() => {
    if (open) {
      setActiveTab("text");
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
      return {...prev, records: updated};
    });
  }, []);

  // Write logic based on which tab is active
  const handleSave = useCallback(() => {
    if (!domain) return;

    const calls: `0x${string}`[] = [];
    if (activeTab === "text") {
      // text records
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
    } else if (activeTab === "other") {
      // content hash & ABI
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
  }, [
    activeTab,
    domain,
    label,
    resolverAddress,
    state,
    writeContract,
  ]);

  // Show loading/error/success notifications
  useEffect(() => {
    if (writeErr) {
      toast.dismiss();
      console.error("Contract Write Error:", writeErr);
      toast.error("Transaction failed", {
        description:
          (writeErr as BaseError)?.shortMessage ||
          writeErr.message,
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
        contentHash: "",
        abi: "",
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
    if (activeTab === "text") {
      setState((prev) => ({...prev, records: textDecoded}));
    } else if (activeTab === "address") {
      setState((prev) => ({...prev, address: addressData}));
    } else if (activeTab === "other") {
      if (isUpdate) {
        setState((prev) => ({
          ...prev,
          contentHash: otherData[0],
          abi: otherData[1],
        }));
      } else {
        setState((prev) => ({
          ...prev,
          contentHash: "",
          abi: "",
        }));
      }
    }
  }, [
    activeTab,
    textDecoded,
    addressData,
    otherData,
    isUpdate,
  ]);

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
            <TabsTrigger value="text" className="font-bold">
              Text
            </TabsTrigger>
            <TabsTrigger value="address" className="font-bold">
              Address
            </TabsTrigger>
            <TabsTrigger value="other" className="font-bold">
              Other
            </TabsTrigger>
          </TabsList>

          {/* TEXT TAB */}
          <TabsContent value="text" className="mt-4 space-y-2">
            {state.records.map((record, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Label className="text-xl font-bold text-gray-500">
                  {record.label}
                </Label>
                <Input
                  className="text-gray-500"
                  value={record.value}
                  onChange={(e) =>
                    handleUpdateValue(index, e.target.value)
                  }
                />
              </div>
            ))}
          </TabsContent>

          {/* ADDRESS TAB */}
          <TabsContent value="address" className="mt-4 space-y-2">
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

          {/* OTHER TAB */}
          <TabsContent value="other" className="mt-4 space-y-2">
            <Label className="text-sm font-bold text-gray-500">
              Content Hash
            </Label>
            <Input
              className="mb-2 text-gray-500"
              value={state.contentHash}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  contentHash: e.target.value,
                }))
              }
            />
            <Label className="text-sm font-bold text-gray-500">
              ABI
            </Label>
            <Input
              className="text-gray-500"
              value={state.abi}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  abi: e.target.value,
                }))
              }
            />
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
