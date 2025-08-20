'use client'

import dynamic from 'next/dynamic'

const ShadowSimulator = dynamic(() => import('@/components/ShadowSimulator'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading 3D Scene...</div>
})

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <ShadowSimulator />
    </main>
  )
}
