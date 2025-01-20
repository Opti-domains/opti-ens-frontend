"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GraphQLClient, gql } from "graphql-request"

import { DomainList } from "@/components/domain-list"
import {toast} from "sonner";
import {ConnectButton} from "@rainbow-me/rainbowkit";

// The Graph endpoint for ENS
const ENDPOINT = "https://api.thegraph.com/subgraphs/name/ensdomains/ens"

const GET_ENS_DOMAINS = gql`
  query getDomains($id: String!) {
    account(id: $id) {
      domains {
        name
        registration {
          expiryDate
        }
      }
    }
  }
`

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [ensDomains, setEnsDomains] = useState<
    { name: string; expiration?: string; action?: string }[]
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const client = new GraphQLClient(ENDPOINT)
        const data: any = await client.request(GET_ENS_DOMAINS, {
          // id: address?.toLowerCase(),
          id: '0xf01Dd015Bc442d872275A79b9caE84A6ff9B2A27'.toLowerCase(),
        })
        console.log(data)

        const fetchedDomains = data?.account?.domains || []

        // Convert the data to the shape needed by DomainList
        const mapped = fetchedDomains.map((d: any) => {
          // The subgraph's expiryDate is a Unix timestamp in *seconds*
          let expiration = "--"
          if (d?.registration?.expiryDate) {
            const expirySec = parseInt(d.registration.expiryDate, 10) * 1000
            expiration = new Date(expirySec).toISOString().split("T")[0]
          }

          return {
            name: d.name,
            expiration,
            action: "Claim",
          }
        })

        setEnsDomains(mapped)
      } catch (err) {
        console.error("Error fetching ENS:", err)
        toast.error("Failed to fetch ENS domains.")
      } finally {
        setLoading(false)
      }
    }

    fetchData().catch((err) => {
      console.error("Error fetching ENS:", err)
      setLoading(false)
      toast.error("Failed to fetch ENS domains.")
    })
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <main className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Welcome to Singular Domain</h1>
        <p className="max-w-xl text-gray-600">
          Singular Domain is a 1:1 claim project based on your ENS domains.
          If you own <strong>.eth</strong> names, you can claim a corresponding
          “Singular Domain” in our ecosystem. Claiming preserves your brand,
          identity, and uniqueness in the web3 space.
        </p>

        <p className="mt-4 text-gray-600">
          Connect your wallet to verify your ENS domains, then mint your 1:1
          Singular Domains absolutely free!
        </p>

        <div className="mt-8">
          <ConnectButton showBalance={false} label="Connect"/>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-8">
      {loading && <p className="mt-2">Loading ENS data...</p>}
      <h2 className="mb-6 text-xl font-semibold">
        Your Singular Domains
      </h2>
      <DomainList domains={ensDomains}/>
    </main>
  )
}
