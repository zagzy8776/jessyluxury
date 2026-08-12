'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createSoftMistTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 245, 220, 0.65)')
    gradient.addColorStop(0.3, 'rgba(255, 225, 170, 0.35)')
    gradient.addColorStop(0.65, 'rgba(255, 200, 130, 0.12)')
    gradient.addColorStop(1, 'rgba(255, 180, 100, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function PerfumeSpray() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })

    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Dynamic Nozzle 3D positioning adapted for Desktop vs Mobile screen crop
    function getNozzlePosition() {
      const vFOV = (camera.fov * Math.PI) / 180
      const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z
      const visibleWidth = visibleHeight * camera.aspect

      const isMobile = camera.aspect < 1.0
      const percentX = isMobile ? 0.10 : 0.22
      const percentY = isMobile ? 0.44 : 0.36

      const x = -visibleWidth / 2 + visibleWidth * percentX
      const y = visibleHeight / 2 - visibleHeight * percentY
      return { x, y, visibleWidth }
    }

    let { x: nozzleX, y: nozzleY, visibleWidth } = getNozzlePosition()

    // 2. Scroll-Tied Particle Mist Setup
    const particleCount = 2400
    const initialOffsets = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Slight initial nozzle jitter offset
      initialOffsets[i3] = (Math.random() - 0.5) * 0.08
      initialOffsets[i3 + 1] = (Math.random() - 0.5) * 0.08
      initialOffsets[i3 + 2] = (Math.random() - 0.5) * 0.05

      // Natural forward spray trajectories (X forward, Y vertical cone, Z depth toward camera)
      velocities[i3] = 3.5 + Math.random() * 4.5
      velocities[i3 + 1] = (Math.random() - 0.45) * 3.2
      velocities[i3 + 2] = (Math.random() - 0.5) * 4.0

      // Start all particles resting at bottle nozzle tip
      positions[i3] = nozzleX + initialOffsets[i3]
      positions[i3 + 1] = nozzleY + initialOffsets[i3 + 1]
      positions[i3 + 2] = initialOffsets[i3 + 2]
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mistTexture = createSoftMistTexture()
    const material = new THREE.PointsMaterial({
      map: mistTexture,
      color: 0xfff0db,
      size: 0.14,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // 3. Smooth Scroll Listener & Lerp Engine
    let targetScrollProgress = 0
    let currentScrollProgress = 0

    function handleScroll() {
      const heroHeight = container?.clientHeight || window.innerHeight
      const currentY = window.scrollY
      // Normalize scroll progress (0 at top, 1 when user scrolls down hero section)
      targetScrollProgress = Math.min(1, Math.max(0, currentY / (heroHeight * 0.85)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initialize state

    // 4. Animation Loop (Renders dynamically tied to scroll movement)
    let animationFrameId: number

    function animate() {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth linear interpolation for silky scroll movement
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08

      const posAttr = geometry.attributes.position
      const posArray = posAttr.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3

        // Move particles outward from nozzle proportionally to scroll progress
        const p = currentScrollProgress
        posArray[i3] = nozzleX + initialOffsets[i3] + velocities[i3] * p
        posArray[i3 + 1] = nozzleY + initialOffsets[i3 + 1] + velocities[i3 + 1] * p
        posArray[i3 + 2] = initialOffsets[i3 + 2] + velocities[i3 + 2] * p
      }

      // Dynamically fade material opacity as user scrolls past hero section
      material.opacity = Math.max(0, 0.28 * (1 - currentScrollProgress * 0.85))

      posAttr.needsUpdate = true
      renderer.render(scene, camera)
    }

    animate()

    // 5. Responsive Viewport Handler
    function handleResize() {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)

      const newPos = getNozzlePosition()
      nozzleX = newPos.x
      nozzleY = newPos.y
      visibleWidth = newPos.visibleWidth
      handleScroll()
    }

    window.addEventListener('resize', handleResize)

    // 6. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)

      geometry.dispose()
      material.dispose()
      mistTexture.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-1"
      aria-hidden="true"
    />
  )
}
