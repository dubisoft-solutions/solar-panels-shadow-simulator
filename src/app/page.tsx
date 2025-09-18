'use client'

import dynamic from 'next/dynamic'

const ShadowSimulator = dynamic(() => import('@/components/simulation/core/ShadowSimulator'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading 3D Scene...</div>
})

export default function Home() {
  return (
    <main className="h-screen w-screen pt-16">
      <ShadowSimulator />
    </main>
  )
}
