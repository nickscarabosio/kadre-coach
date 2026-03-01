import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>
}) {
  const { id: clientId } = await params
  redirect(`/clients/${clientId}#section-projects`)
}
