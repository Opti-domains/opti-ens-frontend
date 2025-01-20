"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GraphQLClient, gql } from "graphql-request"

import { DomainList } from "@/components/domain-list"
import {toast} from "sonner";

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
          id: address?.toLowerCase(),
          // id: '0xf01Dd015Bc442d872275A79b9caE84A6ff9B2A27'.toLowerCase(),
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
            // e.g., '2024-09-10'
          }

          return {
            name: d.name,
            expiration,
            action: "Claim",
          }
        })

        setEnsDomains(mapped)
        toast.success("Successfully fetched ENS domains.")
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
      <main className="p-4">
        <h1 className="text-xl font-bold">Home</h1>
        <p>Please connect your wallet to view your ENS domains.</p>
      </main>
    )
  }

  return (
    <main className="p-4">
      {loading && <p className="mt-2">Loading ENS data...</p>}
      <DomainList domains={ensDomains} />
    </main>
  )
}
