import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BaseError,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { encodeFunctionData } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { useOtherInfo } from "@/hooks/useOtherInfo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { encode } from "@ensdomains/content-hash";

type Props = {
  parentDomain: string;
  resolverAddress: `0x${string}`;
};

function convertContentHash(type: string, hash: string) {
  if (type === "IPFS") {
    return `0x${encode("ipfs", hash)}` as `0x${string}`;
  }
  return `0x${encode("arweave", hash)}` as `0x${string}`;
}

export default function Profile({ parentDomain, resolverAddress }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [storageType, setStorageType] = useState("IPFS");
  const [state, setState] = useState({
    contenthash: "",
    display: "",
    description: "",
    avatar: "",
    email: "",
  });
  const router = useRouter();
  const parent = parentDomain.split(".").slice(1).join(".");

  const { profileDecoded, refetchProfile } = useOtherInfo(
    parentDomain,
    resolverAddress
  );
  const { data: hash, error: writeErr, writeContract } = useWriteContract();
  const {
    isError,
    error: txError,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

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
            args: [
              dnsEncode(parentDomain),
              convertContentHash(storageType, state.contenthash),
            ],
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
  }, [isError, writeErr, isConfirmed, refetchProfile]);

  return (
    <Card className="bg-gray-50 p-2">
      <CardHeader>
        <CardTitle>
          <span className="md:text-3xl font-bold text-gray-600">
            {parentDomain}
          </span>
        </CardTitle>
        {parent && parent.toLowerCase() != "eth" && (
          <CardDescription>
            <Popover>
              <PopoverTrigger className="border border-white rounded-lg p-1 bg-white hover:bg-blue-50 hover:border-blue-100">
                <span className="text-gray-500 font-bold">parent</span>
                <span className="text-gray-400 font-bold italic ml-4">
                  {parent}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-full p-1">
                <Button
                  variant="ghost"
                  className="text-gray-500 font-bold"
                  onClick={() => router.push(`/${parent}`)}
                >
                  View Profile
                </Button>
              </PopoverContent>
            </Popover>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex w-full space-x-4 items-center">
          <div className="flex flex-col w-2/3 gap-3">
            <Label className="font-bold text-gray-500">
              Avatar (Image URL)
            </Label>
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
                <Copy className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>
          <div className="md:pl-10">
            <Image
              src={
                state.avatar
                  ? `/api/image/${encodeURIComponent(state.avatar)}`
                  : "/default-avatar.svg"
              }
              alt="avatar"
              width={100}
              height={100}
            />
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
                  <Copy className="w-5 h-5 text-gray-500" />
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
                  <Copy className="w-5 h-5 text-gray-500" />
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
                  <Copy className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex w-full space-x-4 items-center">
            <div className="flex flex-col w-full gap-3">
              <Collapsible
                open={isOpen && isEditing}
                onOpenChange={setIsOpen}
                className="w-full space-y-2"
              >
                <div className="flex items-center justify-between space-x-4">
                  <span className="font-bold text-gray-500">
                    Website (on {storageType === "IPFS" ? "IPFS" : "ARWEAVE"})
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={!isEditing}>
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-2 w-full">
                  <div className="flex flex-row space-x-4 items-center justify-center">
                    <div
                      className={`flex flex-col items-center justify-center p-4 w-32 h-32 border rounded-md cursor-pointer ${
                        storageType === "IPFS"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                      onClick={() => {
                        setStorageType("IPFS");
                        setIsOpen(false);
                      }}
                    >
                      <Image
                        src="/icons/ipfs.svg"
                        alt="ipfs"
                        width={40}
                        height={40}
                      />
                      <span className="mt-2 text-sm font-bold">IPFS</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 w-32 h-32 border rounded-md cursor-pointer ${
                        storageType === "AR"
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                      onClick={() => {
                        setStorageType("AR");
                        setIsOpen(false);
                      }}
                    >
                      <Image
                        src="/icons/ar.svg"
                        alt="ar"
                        width={40}
                        height={40}
                      />
                      <span className="mt-2 text-sm font-bold">ARWEAVE</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-2 flex items-center">
                  <Image
                    src={
                      storageType === "IPFS"
                        ? "/icons/ipfs.svg"
                        : "/icons/ar.svg"
                    }
                    alt="store"
                    width={30}
                    height={30}
                  />
                </div>
                <Input
                  className="pl-12 text-gray-500 bg-white hover:bg-blue-50"
                  value={state.contenthash}
                  placeholder={storageType === "IPFS" ? "ipfs://" : "ar://"}
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
                  <Copy className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="md:min-w-48 min-w-36 font-bold" onClick={handleEdit}>
          {isEditing ? (
            isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )
          ) : (
            "Edit Profile"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
