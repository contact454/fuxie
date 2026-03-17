'use client'

import React, { useState } from 'react'
import type {
  TheoryBlock, RuleBlock, ParadigmTableBlock, ExamplesBlock,
  KeyTakeawayBlock, MnemonicBlock, ContrastBlock,
  SituationBlock, DiscoveryBlock, CommonMistakesBlock
} from './types'
import s from './grammar.module.css'

// ─── Rule Card ───────────────────────────────────────
function RuleCard({ block }: { block: RuleBlock }) {
  return (
    <div className={s.theoryCard}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>📋</span>
        <span className={`${s.cardLabel} ${s.labelRule}`}>QUY TẮC</span>
      </div>
      <div className={s.ruleText}>{block.text_vi}</div>
      {block.steps_vi && block.steps_vi.length > 0 && (
        <ol className={s.ruleSteps}>
          {block.steps_vi.map((step, i) => (
            <li key={i} className={s.ruleStep}>{step}</li>
          ))}
        </ol>
      )}
      {block.formula && <div className={s.formulaBox}>{block.formula}</div>}
      {block.comparison_vi && (
        <div className={s.comparisonBox}>
          {block.comparison_vi.split('\n').map((line, i) => (
            <div key={i} className={s.comparisonLine}>{line}</div>
          ))}
        </div>
      )}
      {block.note_vi && <div className={s.ruleNote}>{block.note_vi}</div>}
    </div>
  )
}

// ─── Paradigm Table ──────────────────────────────────
function ParadigmTable({ block }: { block: ParadigmTableBlock }) {
  const hlCols = new Set(block.highlight_columns ?? [])
  return (
    <div className={s.theoryCard}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>📊</span>
        <span className={`${s.cardLabel} ${s.labelTable}`}>BẢNG CHIA</span>
      </div>
      <div className={s.tableWrap}>
        <table className={s.grammarTable}>
          <thead>
            <tr>
              {block.headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`${hlCols.has(ci) ? s.highlight : ''} ${ci > 0 ? s.mono : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Examples ────────────────────────────────────────
function ExampleCards({ block }: { block: ExamplesBlock }) {
  function renderDe(text: string, highlights?: string[]) {
    if (!highlights || highlights.length === 0) return text
    let result = text
    highlights.forEach(hl => {
      result = result.replace(
        new RegExp(`(${hl})`, 'g'),
        `<span class="${s.hlWord}">$1</span>`
      )
    })
    return <span dangerouslySetInnerHTML={{ __html: result }} />
  }

  return (
    <div className={s.theoryCard}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>💡</span>
        <span className={`${s.cardLabel} ${s.labelExample}`}>VÍ DỤ</span>
      </div>
      {block.items.map((ex, i) => (
        <div key={i} className={s.exampleItem}>
          <div className={s.exampleDe}>{renderDe(ex.de, ex.highlight)}</div>
          <div className={s.exampleVi}>{ex.vi}</div>
          {ex.context_vi && (
            <div className={s.exampleContext}>{ex.context_vi}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Key Takeaway ────────────────────────────────────
function KeyTakeaway({ block }: { block: KeyTakeawayBlock }) {
  return (
    <div className={`${s.theoryCard} ${s.takeawayCard}`}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>⭐</span>
        <span className={`${s.cardLabel} ${s.labelTakeaway}`}>GHI NHỚ</span>
      </div>
      <div className={s.takeawayText}>{block.text_vi}</div>
    </div>
  )
}

// ─── Mnemonic Card ───────────────────────────────────
function MnemonicCard({ block }: { block: MnemonicBlock }) {
  return (
    <div className={`${s.theoryCard} ${s.mnemonicCard}`}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>🧠</span>
        <span className={`${s.cardLabel} ${s.labelMnemonic}`}>MẸO NHỚ</span>
      </div>
      {block.visual_emoji && (
        <div className={s.mnemonicVisual}>{block.visual_emoji}</div>
      )}
      <div className={s.mnemonicText}>{block.text_vi}</div>
    </div>
  )
}

// ─── Contrast Box ────────────────────────────────────
function ContrastBox({ block }: { block: ContrastBlock }) {
  return (
    <div className={s.theoryCard}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>⚡</span>
        <span className={`${s.cardLabel} ${s.labelContrast}`}>SO SÁNH</span>
      </div>
      <div className={s.contrastGrid}>
        <div className={`${s.contrastCol} ${s.contrastLeft}`}>
          <div className={`${s.contrastHeader} ${s.contrastLeftHeader}`}>
            ✅ {block.left_label}
          </div>
          {block.rows.map((row, i) => (
            <div key={i} className={s.contrastRow}>{row[0]}</div>
          ))}
        </div>
        <div className={`${s.contrastCol} ${s.contrastRight}`}>
          <div className={`${s.contrastHeader} ${s.contrastRightHeader}`}>
            ✅ {block.right_label}
          </div>
          {block.rows.map((row, i) => (
            <div key={i} className={s.contrastRow}>{row[1]}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Situation Card ──────────────────────────────────
function SituationCard({ block }: { block: SituationBlock }) {
  return (
    <div className={`${s.theoryCard} ${s.situationCard}`}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>{block.scene_emoji || '🎬'}</span>
        <span className={`${s.cardLabel} ${s.labelSituation}`}>TÌNH HUỐNG</span>
      </div>
      <div className={s.situationContext}>{block.context_vi}</div>
      <div className={s.dialogueContainer}>
        {block.dialogue.map((line, i) => (
          <div key={i} className={`${s.dialogueBubble} ${i % 2 === 0 ? s.bubbleLeft : s.bubbleRight}`}>
            <div className={s.dialogueSpeaker}>{line.speaker}</div>
            <div className={s.dialogueTextDe}>{line.text_de}</div>
            <div className={s.dialogueTextVi}>{line.text_vi}</div>
          </div>
        ))}
      </div>
      <div className={s.grammarFocus}>{block.grammar_focus}</div>
    </div>
  )
}

// ─── Discovery Card ──────────────────────────────────
function DiscoveryCard({ block }: { block: DiscoveryBlock }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className={`${s.theoryCard} ${s.discoveryCard}`}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>🔍</span>
        <span className={`${s.cardLabel} ${s.labelDiscovery}`}>QUAN SÁT</span>
      </div>
      <div className={s.discoveryQuestion}>{block.question_vi}</div>
      {block.hints && block.hints.length > 0 && (
        <div className={s.discoveryHints}>
          {block.hints.map((hint, i) => (
            <div key={i} className={s.discoveryHint}>{hint}</div>
          ))}
        </div>
      )}
      {!revealed ? (
        <button className={s.discoveryRevealBtn} onClick={() => setRevealed(true)}>
          👆 Nhấn để xem giải đáp
        </button>
      ) : (
        <div className={s.discoveryAnswer}>{block.reveal_text_vi}</div>
      )}
    </div>
  )
}

// ─── Common Mistakes Card ────────────────────────────
function CommonMistakesCard({ block }: { block: CommonMistakesBlock }) {
  return (
    <div className={s.theoryCard}>
      <div className={s.cardHeader}>
        <span className={s.cardIcon}>⚠️</span>
        <span className={`${s.cardLabel} ${s.labelMistakes}`}>
          {block.title_vi || 'LỖI THƯỜNG GẶP'}
        </span>
      </div>
      <div className={s.mistakesList}>
        {block.mistakes.map((m, i) => (
          <div key={i} className={s.mistakeItem}>
            <div className={s.mistakeWrong}>{m.wrong}</div>
            <div className={s.mistakeCorrect}>{m.correct}</div>
            <div className={s.mistakeExplanation}>{m.explanation_vi}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dispatcher ──────────────────────────────────────
export function TheoryRenderer({ blocks }: { blocks: TheoryBlock[] }) {
  return (
    <div className={s.theoryContainer}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'rule':            return <RuleCard key={i} block={block} />
          case 'paradigm_table':  return <ParadigmTable key={i} block={block} />
          case 'examples':        return <ExampleCards key={i} block={block} />
          case 'key_takeaway':    return <KeyTakeaway key={i} block={block} />
          case 'mnemonic':        return <MnemonicCard key={i} block={block} />
          case 'contrast':        return <ContrastBox key={i} block={block} />
          case 'situation':       return <SituationCard key={i} block={block} />
          case 'discovery':       return <DiscoveryCard key={i} block={block} />
          case 'common_mistakes': return <CommonMistakesCard key={i} block={block} />
          default:                return null
        }
      })}
    </div>
  )
}

export {
  RuleCard, ParadigmTable, ExampleCards, KeyTakeaway,
  MnemonicCard, ContrastBox, SituationCard, DiscoveryCard, CommonMistakesCard
}
