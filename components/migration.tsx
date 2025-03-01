import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BaseError,
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { encodeFunctionData, toHex } from "viem";
import { resolverABI } from "@/lib/abi/resolver";
import { dnsEncode } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { useOtherInfo } from "@/hooks/useOtherInfo";
import { ethChain, optimismChain } from "@/config";

type Props = {
  domain: string;
  setL1Resolver: () => Promise<`0x${string}`>;
};

export default function Migration({ domain, setL1Resolver }: Props) {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const switchToOptimism = async () => {
    await switchChain({ chainId: optimismChain.id });
  };

  const switchToEth = async () => {
    await switchChain({ chainId: ethChain.id });
  };

  return (
    <Card className="bg-gray-50 p-2">
      <CardHeader>
        <CardTitle>
          <span className="md:text-3xl font-bold text-gray-600">{domain}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-600">
          Two more steps to migrate your domain to Optimism
        </div>

        <div className="text-gray-600 mt-4">
          <div>1. Migrate domain records to Optimism</div>
        </div>

        <hr className="mt-4" />

        <div className="text-gray-600 mt-4">
          <div>2. Point domain to our Superchain resolver</div>
          <div>
            {chainId !== ethChain.id ? (
              <Button onClick={switchToEth} className="mt-2">
                Switch to Ethereum
              </Button>
            ) : (
              <Button onClick={setL1Resolver} className="mt-2">
                Set Resolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
