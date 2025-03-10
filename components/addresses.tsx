"use client";

import {Card, CardContent, CardDescription, CardFooter, CardHeader} from "@/components/ui/card";
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
import Image from "next/image";
import {getCoderByCoinName} from "@ensdomains/address-encoder";

type Props = {
  parentDomain: string
  resolverAddress: `0x${string}`;
}
const btcCoder = getCoderByCoinName("btc");
const ethCoder = getCoderByCoinName("eth");
const solCoder = getCoderByCoinName("sol");

function convertAddress(address: string, coinType: number) {
  switch (coinType) {
    case 0:
      return btcCoder.decode(address);
    case 501:
      return solCoder.decode(address);
    default:
      return ethCoder.decode(address);
  }
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
      const calls: `0x${string}`[] = [];
      calls.push(
        ...state.records.filter((record) => record.address !== "").map((record) =>
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setAddr",
            args: [dnsEncode(parentDomain), BigInt(record.coinType), toHex(convertAddress(record.address, record.coinType))],
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
      <CardContent className="space-y-5">
        {state.records.map((record, index) => (
          <div key={index} className="flex flex-col mb-2 space-x-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-2 flex items-center">
                <Image src={record.icon} alt="btc" width={45} height={45} className="rounded-full"/>
              </div>

              <Input
                className="pl-16 pr-16 text-gray-600 bg-white hover:bg-blue-50 py-4 md:text-xl font-bold w-full rounded-lg h-[60px]"
                value={record.address}
                disabled={!isEditing}
                onChange={(e) => handleUpdateValue(index, e.target.value)}
              />

              <Button
                className="absolute inset-y-0 right-0 h-[60px] w-[60px] flex items-center justify-center"
                variant="ghost"
                onClick={() => handleCopy(record.address)}
              >
                <Copy className="w-6 h-6 text-gray-500"/>
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