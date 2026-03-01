import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FormBuilder } from './form-builder'

export const dynamic = 'force-dynamic'

export default async function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: form, error } = await supabase.from('forms').select('*').eq('id', id).single()
  if (error || !form) notFound()

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/forms" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Forms
      </Link>
      <FormBuilder form={form} submissions={submissions || []} />
    </div>
  )
}
