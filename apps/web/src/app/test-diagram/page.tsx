'use client'

/**
 * Test page for React diagram prototype
 * Visit: /test-diagram
 */

import SeinHabenRule from '@/components/grammar/diagrams/SeinHabenRule'

export default function TestDiagramPage() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '40px auto',
      padding: '0 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <h1 style={{ fontSize: 20, marginBottom: 8, color: '#1e293b' }}>
        🧪 Diagram Prototype Test
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
        React/CSS diagram (vector, retina-crisp, 100% accurate text)
      </p>

      {/* Test: sein & haben diagram */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <span style={{
            fontSize: 12, fontWeight: 800, textTransform: 'uppercase' as const,
            letterSpacing: 1, padding: '3px 10px', borderRadius: 6,
            color: '#2563EB', background: '#EFF6FF',
          }}>QUY TẮC</span>
        </div>
        <SeinHabenRule />
      </div>
    </div>
  )
}
