import DomainDetails from "@/components/details";

type Props = {
  params: { label: string };
};

export default async function DomainDetailPage({params}: Props) {
  const {label} = await params;
  return <DomainDetails label={label}/>
}
