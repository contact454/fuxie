'use client'

import React, { useRef, useEffect, useState } from 'react'
import ds from './diagrams.module.css'

/* ──────────────────────────────────────────────
   sein & haben Conjugation — Rough.js Excalidraw-style
   Hand-drawn SVG borders + crisp text
   ────────────────────────────────────────────── */

const SEIN = ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'] as const
const HABEN = ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'] as const
const PRONOUNS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'] as const

// Viewport: padL=16, boxW=248, gap=12, boxW=248, padR=16 => total=540
const W = 540, H = 480
const BOX_W = 248, BOX_H = 370, GAP = 12, PAD_TOP = 70
const LEFT_X = 16, RIGHT_X = LEFT_X + BOX_W + GAP
const ROW_H = 38, ROW_START = 80 // relative to box top

export default function SeinHabenRule() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<string[]>([])

  useEffect(() => {
    // Dynamic import Rough.js (browser only)
    import('roughjs').then(({ default: rough }) => {
      const svg = svgRef.current
      if (!svg) return

      const rc = rough.svg(svg)
      const newPaths: string[] = []

      // Helper: extract path d from rough node
      const extractPaths = (node: SVGGElement) => {
        node.querySelectorAll('path').forEach(p => {
          const d = p.getAttribute('d')
          const stroke = p.getAttribute('stroke')
          const fill = p.getAttribute('fill')
          const sw = p.getAttribute('stroke-width')
          if (d) newPaths.push(JSON.stringify({ d, stroke: stroke || 'none', fill: fill || 'none', sw: sw || '1' }))
        })
      }

      // Left box (sein - blue)
      extractPaths(rc.rectangle(LEFT_X, PAD_TOP, BOX_W, BOX_H, {
        stroke: '#3b82f6', strokeWidth: 2.5, roughness: 1.5, fill: 'rgba(219,234,254,0.3)', fillStyle: 'solid',
      }) as unknown as SVGGElement)

      // Right box (haben - green)
      extractPaths(rc.rectangle(RIGHT_X, PAD_TOP, BOX_W, BOX_H, {
        stroke: '#22c55e', strokeWidth: 2.5, roughness: 1.5, fill: 'rgba(220,252,231,0.3)', fillStyle: 'solid',
      }) as unknown as SVGGElement)

      // Header underlines
      extractPaths(rc.line(LEFT_X + 20, PAD_TOP + 60, LEFT_X + BOX_W - 20, PAD_TOP + 60, {
        stroke: '#93c5fd', strokeWidth: 1.5, roughness: 2,
      }) as unknown as SVGGElement)
      extractPaths(rc.line(RIGHT_X + 20, PAD_TOP + 60, RIGHT_X + BOX_W - 20, PAD_TOP + 60, {
        stroke: '#86efac', strokeWidth: 1.5, roughness: 2,
      }) as unknown as SVGGElement)

      // Small arrows for each row
      for (let i = 0; i < 6; i++) {
        const y = PAD_TOP + ROW_START + i * ROW_H + 12
        // Left arrows
        extractPaths(rc.line(LEFT_X + 100, y, LEFT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1.5,
        }) as unknown as SVGGElement)
        extractPaths(rc.line(LEFT_X + 125, y - 4, LEFT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1,
        }) as unknown as SVGGElement)
        extractPaths(rc.line(LEFT_X + 125, y + 4, LEFT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1,
        }) as unknown as SVGGElement)

        // Right arrows
        extractPaths(rc.line(RIGHT_X + 100, y, RIGHT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1.5,
        }) as unknown as SVGGElement)
        extractPaths(rc.line(RIGHT_X + 125, y - 4, RIGHT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1,
        }) as unknown as SVGGElement)
        extractPaths(rc.line(RIGHT_X + 125, y + 4, RIGHT_X + 130, y, {
          stroke: '#94a3b8', strokeWidth: 1.5, roughness: 1,
        }) as unknown as SVGGElement)
      }

      // Highlight circles around irregular forms
      // sein: all are irregular, circle "ist"
      extractPaths(rc.ellipse(LEFT_X + 170, PAD_TOP + ROW_START + 2 * ROW_H + 10, 50, 32, {
        stroke: '#ef4444', strokeWidth: 1.5, roughness: 2, fill: 'rgba(254,202,202,0.15)', fillStyle: 'solid',
      }) as unknown as SVGGElement)
      // haben: circle "hat"
      extractPaths(rc.ellipse(RIGHT_X + 170, PAD_TOP + ROW_START + 2 * ROW_H + 10, 50, 32, {
        stroke: '#ef4444', strokeWidth: 1.5, roughness: 2, fill: 'rgba(254,202,202,0.15)', fillStyle: 'solid',
      }) as unknown as SVGGElement)

      setPaths(newPaths)
    })
  }, [])

  return (
    <div className={ds.roughBoard}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={ds.roughSvg}
        aria-label="sein und haben Konjugation"
      >
        {/* Render rough.js paths */}
        {paths.map((p, i) => {
          const { d, stroke, fill, sw } = JSON.parse(p)
          return (
            <path
              key={i}
              d={d}
              stroke={stroke}
              fill={fill}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* Title */}
        <text x={W / 2} y={32} textAnchor="middle" className={ds.roughTitle}>
          sein &amp; haben
        </text>
        <text x={W / 2} y={55} textAnchor="middle" className={ds.roughSubtitle}>
          là/ở &amp; có — 2 động từ quan trọng nhất!
        </text>

        {/* Left header */}
        <text x={LEFT_X + BOX_W / 2} y={PAD_TOP + 30} textAnchor="middle" className={ds.roughBoxTitle} fill="#2563eb">
          sein
        </text>
        <text x={LEFT_X + BOX_W / 2} y={PAD_TOP + 50} textAnchor="middle" className={ds.roughBoxSub}>
          (là/ở)
        </text>

        {/* Right header */}
        <text x={RIGHT_X + BOX_W / 2} y={PAD_TOP + 30} textAnchor="middle" className={ds.roughBoxTitle} fill="#16a34a">
          haben
        </text>
        <text x={RIGHT_X + BOX_W / 2} y={PAD_TOP + 50} textAnchor="middle" className={ds.roughBoxSub}>
          (có)
        </text>

        {/* Conjugation rows */}
        {PRONOUNS.map((p, i) => {
          const y = PAD_TOP + ROW_START + i * ROW_H + 16
          return (
            <g key={i}>
              {/* Left: pronoun + sein form */}
              <text x={LEFT_X + 95} y={y} textAnchor="end" className={ds.roughPronoun}>{p}</text>
              <text x={LEFT_X + 140} y={y} className={ds.roughForm} fill="#1d4ed8">{SEIN[i]}</text>

              {/* Right: pronoun + haben form */}
              <text x={RIGHT_X + 95} y={y} textAnchor="end" className={ds.roughPronoun}>{p}</text>
              <text x={RIGHT_X + 140} y={y} className={ds.roughForm} fill="#15803d">{HABEN[i]}</text>
            </g>
          )
        })}

        {/* Labels for circled forms */}
        <text x={LEFT_X + BOX_W - 15} y={PAD_TOP + ROW_START + 2 * ROW_H + 4} textAnchor="end" className={ds.roughAnnotation} fill="#ef4444">
          bất quy tắc!
        </text>
        <text x={RIGHT_X + BOX_W - 15} y={PAD_TOP + ROW_START + 2 * ROW_H + 4} textAnchor="end" className={ds.roughAnnotation} fill="#ef4444">
          bất quy tắc!
        </text>

        {/* Fuxie at bottom */}
        <text x={W - 60} y={H - 15} className={ds.roughFuxie}>🦊</text>
        <text x={W - 95} y={H - 18} textAnchor="end" className={ds.roughFuxieText}>
          Học thuộc nhé!
        </text>
      </svg>
    </div>
  )
}
