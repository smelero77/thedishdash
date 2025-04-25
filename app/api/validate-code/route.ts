import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('table_codes')
      .select('table_number')
      .eq('id', code)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error validating code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 