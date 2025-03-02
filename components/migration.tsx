import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ethChain, optimismChain } from "@/config";
import { useMigrateRecords } from "@/hooks/useMigrateRecords";

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
  const {
    textRecords,
    addressRecords,
    profileRecords,
    migrateRecords,
    isFetching: isFetchingRecords,
  } = useMigrateRecords(domain);

  console.log("Records for migration", {
    isFetchingRecords,
    textRecords,
    addressRecords,
    profileRecords,
  });

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
                  <Button
                    onClick={async () => {
                      await migrateRecords();
                      setIsMigrated(true);
                    }}
                    className="mt-2"
                    disabled={isFetchingRecords}
                    style={{ opacity: isFetchingRecords ? 0.5 : 1 }}
                  >
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
