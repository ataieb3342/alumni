'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface AccueilHeroSectionProps {
  userName: string | null
  backgroundImage?: string
}

export default function AccueilHeroSection({
  userName,
  backgroundImage = '/images/lycee-victor-hugo.jpg'
}: AccueilHeroSectionProps) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative overflow-hidden text-white py-16 md:py-20">
      {/* Image de fond avec effet parallaxe */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Image
          src={backgroundImage}
          alt="Lycée Victor Hugo"
          fill
          className="object-cover object-bottom"
          priority
        />
        {/* Overlay avec gradient bleu et opacité */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/75 to-blue-800/80"></div>
        {/* Effet de texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      {/* Contenu avec effet fade-out */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-6"
        style={{
          opacity: Math.max(0, 1 - scrollY / 400),
          transform: `translateY(${scrollY * 0.2}px)`,
          transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
        }}
      >
        <div className="text-center space-y-6">

          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent drop-shadow-lg">
              Quoi de neuf
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
              dans la communauté ?
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Découvre les derniers articles, opportunités ou témoignages qui pourraient t&apos;intéresser
          </p>

        </div>
      </div>
    </section>
  )
}
