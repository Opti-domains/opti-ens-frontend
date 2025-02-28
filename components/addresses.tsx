"use client";

import {Card, CardContent, CardDescription, CardFooter, CardHeader} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Copy, Loader2} from "lucide-react";
import {useCallback, useEffect, useState} from "react";
import {initialAddress, useAddressInfo} from "@/hooks/useAddressInfo";
import {encodeFunctionData, toBytes, toHex} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {toast} from "sonner";
import {type BaseError, useWaitForTransactionReceipt, useWriteContract} from "wagmi";

type Props = {
  parentDomain: string
  resolverAddress: `0x${string}`;
}

export default function Addresses({ parentDomain, resolverAddress }: Props) {
  const [state, setState] = useState({ records: initialAddress });
  const [isEditing, setIsEditing] = useState(false);

  const {addressDecoded, refetchAddress} = useAddressInfo(parentDomain,resolverAddress);
  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const { isError, error: txError, isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleUpdateValue = useCallback((index: number, value: string) => {
    setState((prev) => {
      const updated = [...prev.records];
      updated[index].address = value;
      return { ...prev, records: updated };
    });
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      setIsEditing(true);
    }else {
      // save changes
      console.log("state", state);
      console.log("addr", toHex(toBytes(state.records[0].address)));
      const calls: `0x${string}`[] = [];
      calls.push(
        ...state.records.map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setAddr",
            args: [dnsEncode(parentDomain), BigInt(record.coinType), toHex(toBytes(record.address))],
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
    if (addressDecoded) {
      setState({records: addressDecoded});
    }
  }, [addressDecoded]);

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
      refetchAddress();
      setIsEditing(false);
      toast.success("Addresses updated successfully!");
    }
  }, [
    isError,
    writeErr,
    isConfirmed,
    refetchAddress,
  ]);

  return (
    <Card className="bg-gray-50 p-2">
      <CardHeader>
        <CardDescription>
          <span className="text-base font-bold italic">Enter your address will be map with your ENS.</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {state.records.map((record, index) => (
          <div key={index} className="flex flex-col mb-2 space-x-2">
            <Label className="text-sm font-bold text-gray-500 mb-2">
              {record.icon}
            </Label>
            <div className="relative w-full">
              <Input
                className="text-gray-500 bg-white hover:bg-blue-50"
                value={record.address}
                disabled={!isEditing}
                onChange={(e) => handleUpdateValue(index, e.target.value)}
              />
              <Button
                className="absolute inset-y-0 right-0"
                variant="ghost"
                onClick={() => handleCopy(record.address)}
              >
                <Copy className="w-5 h-5 text-gray-500" />
              </Button>

            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="md:min-w-48 min-w-36 font-bold" onClick={handleEdit}>
          {isEditing ? (isConfirming ?
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes") : "Edit Addresses"}
        </Button>
      </CardFooter>
    </Card>
  )
}