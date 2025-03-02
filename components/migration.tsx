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
  skipMigration: () => void;
};

export default function Migration({
  domain,
  setL1Resolver,
  skipMigration,
}: Props) {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [isMigrated, setIsMigrated] = useState(false);
  const [isMigrationSkipped, setIsMigrationSkipped] = useState(false);

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
          {!isMigrated ? (
            <div>
              <div>
                {chainId !== optimismChain.id ? (
                  <Button onClick={switchToOptimism} className="mt-2">
                    Switch to Optimism
                  </Button>
                ) : (
                  <Button onClick={setL1Resolver} className="mt-2">
                    Migrate Records
                  </Button>
                )}
              </div>
              <div
                className="text-red-500 mt-2 hover:cursor-pointer text-sm"
                onClick={() => {
                  setIsMigrated(true);
                  setIsMigrationSkipped(true);
                }}
              >
                Skip records migration
              </div>
            </div>
          ) : (
            <div
              className={`${
                isMigrationSkipped ? "text-red-600" : "text-green-600"
              } mt-1`}
            >
              {isMigrationSkipped ? "Migration skipped" : "Records migrated"}
            </div>
          )}
        </div>

        <hr className="mt-4" />

        <div className="text-gray-600 mt-4">
          <div>2. Point the domain to our Superchain resolver</div>
          {isMigrated ? (
            <div>
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
              <div
                className="text-red-500 mt-2 hover:cursor-pointer text-sm"
                onClick={() => {
                  skipMigration();
                }}
              >
                Skip resolver migration
              </div>
            </div>
          ) : (
            <div className="text-red-600 mt-1">
              Please migrate the domain records first
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
