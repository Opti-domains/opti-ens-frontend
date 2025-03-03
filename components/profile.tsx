import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Copy, Loader2} from "lucide-react";
import {useEffect, useState} from "react";
import {BaseError, useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import {encodeFunctionData, toHex} from "viem";
import {resolverABI} from "@/lib/abi/resolver";
import {dnsEncode} from "@/lib/utils";
import {toast} from "sonner";
import Image from "next/image";
import {useOtherInfo} from "@/hooks/useOtherInfo";

type Props = {
  parentDomain: string
  resolverAddress: `0x${string}`;
}

export default function Profile({parentDomain, resolverAddress}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState({
    contenthash: "",
    display: "",
    description: "",
    avatar: "",
    email: "",
  });

  const {profileDecoded, refetchProfile} = useOtherInfo(parentDomain, resolverAddress);
  const {data: hash, error: writeErr, writeContract} = useWriteContract();
  const {isError, error: txError, isLoading: isConfirming, isSuccess: isConfirmed} =
    useWaitForTransactionReceipt({hash});

  const handleEdit = () => {
    if (!isEditing) {
      // change to edit mode
      setIsEditing(true);
    } else {
      // save changes
      const calls: `0x${string}`[] = [];
      // content hash & ABI
      if (state.contenthash) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setContenthash",
            args: [dnsEncode(parentDomain), toHex(state.contenthash)],
          })
        );
      }
      if (state.display) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(parentDomain), "display", state.display],
          })
        );
      }
      if (state.description) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(parentDomain), "description", state.description],
          })
        );
      }
      if (state.avatar) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(parentDomain), "avatar", state.avatar],
          })
        );
      }
      if (state.email) {
        calls.push(
          encodeFunctionData({
            abi: resolverABI,
            functionName: "setText",
            args: [dnsEncode(parentDomain), "email", state.email],
          })
        );
      }

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
    if (profileDecoded) {
      setState(profileDecoded);
    }
  }, [profileDecoded]);

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
      refetchProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    }
  }, [
    isError,
    writeErr,
    isConfirmed,
    refetchProfile,
  ]);

  return (
    <Card className="bg-gray-50 p-2">
      <CardHeader>
        <CardTitle>
          <span className="md:text-3xl font-bold text-gray-600">{parentDomain}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex w-full space-x-4 items-center">
          <div className="flex flex-col w-2/3 gap-3">
            <Label className="font-bold text-gray-500">Avatar</Label>
            <div className="relative w-full">
              <Input
                className="text-gray-500 bg-white hover:bg-blue-50"
                value={state.avatar}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    avatar: e.target.value,
                  }))
                }
                disabled={!isEditing}
              />
              <Button
                className="absolute inset-y-0 right-0"
                variant="ghost"
                onClick={() => handleCopy(state.avatar)}
              >
                <Copy className="w-5 h-5 text-gray-500"/>
              </Button>
            </div>
          </div>
          <div className="md:pl-10">
            <Image src={state.avatar? `/api/image/${encodeURIComponent(state.avatar)}`: "/default-avatar.svg"} alt="avatar" width={100} height={100}/>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex w-full space-x-4 items-center">
            <div className="flex flex-col w-full gap-3">
              <Label className="font-bold text-gray-500">Display Name</Label>
              <div className="relative w-full">
                <Input
                  className="text-gray-500 bg-white hover:bg-blue-50"
                  value={state.display}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      display: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Button
                  className="absolute inset-y-0 right-0"
                  variant="ghost"
                  onClick={() => handleCopy(state.display)}
                >
                  <Copy className="w-5 h-5 text-gray-500"/>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex w-full space-x-4 items-center">
            <div className="flex flex-col w-full gap-3">
              <Label className="font-bold text-gray-500">Description</Label>
              <div className="relative w-full">
                <Input
                  className="text-gray-500 bg-white hover:bg-blue-50"
                  value={state.description}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Button
                  className="absolute inset-y-0 right-0"
                  variant="ghost"
                  onClick={() => handleCopy(state.description)}
                >
                  <Copy className="w-5 h-5 text-gray-500"/>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex w-full space-x-4 items-center">
            <div className="flex flex-col w-full gap-3">
              <Label className="font-bold text-gray-500">Email</Label>
              <div className="relative w-full">
                <Input
                  className="text-gray-500 bg-white hover:bg-blue-50"
                  value={state.email}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Button
                  className="absolute inset-y-0 right-0"
                  variant="ghost"
                  onClick={() => handleCopy(state.email)}
                >
                  <Copy className="w-5 h-5 text-gray-500"/>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex w-full space-x-4 items-center">
            <div className="flex flex-col w-full gap-3">
              <Label className="font-bold text-gray-500">Content hash</Label>
              <div className="relative w-full">
                <Input
                  className="text-gray-500 bg-white hover:bg-blue-50"
                  value={state.contenthash}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      contenthash: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Button
                  className="absolute inset-y-0 right-0"
                  variant="ghost"
                  onClick={() => handleCopy(state.contenthash)}
                >
                  <Copy className="w-5 h-5 text-gray-500"/>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="md:min-w-48 min-w-36 font-bold" onClick={handleEdit}>
          {isEditing ? (isConfirming ?
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes") : "Edit Profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}