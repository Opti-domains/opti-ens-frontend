"use client";

import {Card, CardContent, CardDescription, CardFooter, CardHeader} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {initialSocials, useTextInfo} from "@/hooks/useTextInfo";
import {type BaseError, useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import {encodeFunctionData} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {Copy, Loader2} from "lucide-react";
import {toast} from "sonner";

type Props = {
  parentDomain: string
  resolverAddress: `0x${string}`;
}

export default function Socials({ parentDomain, resolverAddress }: Props) {
  // State
  const [state, setState] = useState({ records: initialSocials });
  const [isEditing, setIsEditing] = useState(false);


  // Hooks
  const {textDecoded, refetchText} = useTextInfo(parentDomain,resolverAddress);
  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const { isError, error: txError, isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Handlers
  const handleUpdateValue = useCallback((index: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.records];
      updated[index].value = value;
      return { ...prev, records: updated };
    });
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      // change to edit mode
      setIsEditing(true);
    }else {
      // save changes
      const calls: `0x${string}`[] = [];
      calls.push(
        ...state.records.map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(parentDomain), record.key, record.value],
          })
        )
      );

      if (calls.length > 0) {
        writeContract({
          address: resolverAddress,
          abi: resolverABI,
          functionName: "multicall",
          args: [calls],
        });
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  useEffect(() => {
    if (textDecoded) {
      setState({records: textDecoded});
    }
  }, [textDecoded]);

  useEffect(() => {
    if (writeErr) {
      toast.error("Transaction failed", {
        description: (writeErr as BaseError)?.shortMessage || writeErr.message,
      });
    }
    if (isError) {
      toast.error("Transaction failed", {
        description: (txError as BaseError)?.shortMessage || txError.message,
      });
    }

    if (isConfirmed) {
      refetchText();
      setIsEditing(false);
      toast.success("Socials updated successfully!");
    }
  }, [
    isError,
    writeErr,
    isConfirmed,
    refetchText,
  ]);


  return (
    <Card className="bg-gray-50 p-2">
      <CardHeader>
        <CardDescription>
          <span className="text-base font-bold italic">Enter your social media handles for easy connectivity and verification.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
      {state.records.map((record, index) => (
        <div key={index} className="flex flex-col mb-2 space-x-2">
          <Label className="text-sm font-bold text-gray-500 mb-2">
            {record.label}
          </Label>
        <div className="relative w-full">
          <Input
            className="text-gray-500 bg-white hover:bg-blue-50"
            value={record.value}
            disabled={!isEditing}
            onChange={(e) => handleUpdateValue(index, e.target.value)}
          />
          <Button
            className="absolute inset-y-0 right-0"
            variant="ghost"
            onClick={() => handleCopy(record.value)}
          >
            <Copy className="w-5 h-5 text-gray-500" />
          </Button>

        </div>
        </div>
      ))}
      </CardContent>
      <CardFooter>
        <Button className="md:min-w-48 min-w-36 font-bold" onClick={handleEdit}>
          {isEditing ? (isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/>  : "Save Changes") : "Edit Socials"}
        </Button>
      </CardFooter>
    </Card>
  );
}