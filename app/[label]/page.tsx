import DomainDetails from "@/components/details";

export default async function DomainDetailPage({params}: { params: Promise<{label: string}>; }) {
  const label = (await params).label;
  return <DomainDetails label={label}/>
}
