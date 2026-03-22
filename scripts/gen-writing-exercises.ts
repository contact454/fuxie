#!/usr/bin/env npx tsx
/**
 * gen-writing-exercises.ts
 *
 * Generates and upgrades writing exercises using Gemini 3 Flash.
 * Two modes:
 *   --upgrade   Adds stimulus texts to existing exercises
 *   --new       Creates brand new exercises from the expansion plan
 *
 * Usage:
 *   npx tsx scripts/gen-writing-exercises.ts --upgrade --level a2
 *   npx tsx scripts/gen-writing-exercises.ts --new --level b2
 *   npx tsx scripts/gen-writing-exercises.ts --upgrade --all
 *   npx tsx scripts/gen-writing-exercises.ts --new --all
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import * as path from 'path'

// ─── Config ─────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-3-flash-preview'
const CONTENT_DIR = path.resolve(__dirname, '../content')
const DELAY_MS = 2000 // between API calls

if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is required')
}

const ai = new GoogleGenerativeAI(API_KEY)
const model = ai.getGenerativeModel({ model: MODEL })

// ─── Types ──────────────────────────────────────────
interface ExerciseJson {
    id: string
    cefrLevel: string
    teil: number
    teilName: string
    textType: string
    register: string
    topic: string
    instruction: string
    instructionVi: string
    situation: string
    contentPoints: string[]
    minWords: number
    maxWords: number | null
    timeMinutes: number
    rubric: { criteria: Array<{ id: string; name: string; nameVi: string; maxScore: number; weight: number }>; maxScore: number }
    maxScore: number
    formFields?: Array<{ label: string; type: string }>
    sourceText?: string
    sourceTextType?: string
    grafikDesc?: string
    stimulusSender?: string
    stimulusQuotes?: Array<{ author: string; text: string }>
    grafikData?: Array<{ label: string; value: number; unit?: string }>
}

// ─── New Exercise Definitions ───────────────────────
// From the approved expansion plan
const NEW_EXERCISES: Record<string, Array<{ id: string; teil: number; teilName: string; textType: string; register: string; topic: string; themenbereich: string }>> = {
    a1: [
        // T1 Formular (+5)
        { id: 'W-A1-T1-011', teil: 1, teilName: 'Formular ausfuellen', textType: 'Formular', register: 'neutral', topic: 'Schwimmbad', themenbereich: 'Freizeit' },
        { id: 'W-A1-T1-012', teil: 1, teilName: 'Formular ausfuellen', textType: 'Formular', register: 'neutral', topic: 'Reisebuchung', themenbereich: 'Reisen' },
        { id: 'W-A1-T1-013', teil: 1, teilName: 'Formular ausfuellen', textType: 'Formular', register: 'neutral', topic: 'Supermarkt-Kundenkarte', themenbereich: 'Einkaufen' },
        { id: 'W-A1-T1-014', teil: 1, teilName: 'Formular ausfuellen', textType: 'Formular', register: 'neutral', topic: 'Malkurs', themenbereich: 'Kultur' },
        { id: 'W-A1-T1-015', teil: 1, teilName: 'Formular ausfuellen', textType: 'Formular', register: 'neutral', topic: 'Umzugsmeldung', themenbereich: 'Wohnen' },
        // T2 E-Mail (+10)
        { id: 'W-A1-T2-011', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Essen gehen', themenbereich: 'Essen' },
        { id: 'W-A1-T2-012', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Arzttermin', themenbereich: 'Gesundheit' },
        { id: 'W-A1-T2-013', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Neue Wohnung', themenbereich: 'Wohnen' },
        { id: 'W-A1-T2-014', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Kinobesuch', themenbereich: 'Freizeit' },
        { id: 'W-A1-T2-015', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Bücherbestellung', themenbereich: 'Einkaufen' },
        { id: 'W-A1-T2-016', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Sport im Park', themenbereich: 'Freizeit' },
        { id: 'W-A1-T2-017', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Deutschpruefung', themenbereich: 'Bildung' },
        { id: 'W-A1-T2-018', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Fahrrad kaputt', themenbereich: 'Reisen' },
        { id: 'W-A1-T2-019', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Neuer Kollege', themenbereich: 'Arbeit' },
        { id: 'W-A1-T2-020', teil: 2, teilName: 'Kurze E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Museumbesuch', themenbereich: 'Kultur' },
    ],
    a2: [
        { id: 'W-A2-T1-011', teil: 1, teilName: 'E-Mail-Antwort', textType: 'E-Mail', register: 'informell', topic: 'Konzert', themenbereich: 'Kultur' },
        { id: 'W-A2-T1-012', teil: 1, teilName: 'E-Mail-Antwort', textType: 'E-Mail', register: 'informell', topic: 'Arztbesuch', themenbereich: 'Gesundheit' },
        { id: 'W-A2-T1-013', teil: 1, teilName: 'E-Mail-Antwort', textType: 'E-Mail', register: 'informell', topic: 'Fahrrad kaufen', themenbereich: 'Einkaufen' },
        { id: 'W-A2-T1-014', teil: 1, teilName: 'E-Mail-Antwort', textType: 'E-Mail', register: 'informell', topic: 'Nachbar', themenbereich: 'Wohnen' },
        { id: 'W-A2-T1-015', teil: 1, teilName: 'E-Mail-Antwort', textType: 'E-Mail', register: 'informell', topic: 'Computerproblem', themenbereich: 'Medien' },
        { id: 'W-A2-T2-011', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Geburtstagessen', themenbereich: 'Essen' },
        { id: 'W-A2-T2-012', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Jobsuche', themenbereich: 'Arbeit' },
        { id: 'W-A2-T2-013', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Sportverein beitreten', themenbereich: 'Freizeit' },
        { id: 'W-A2-T2-014', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Kindergarten wechseln', themenbereich: 'Bildung' },
        { id: 'W-A2-T2-015', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Zugticket', themenbereich: 'Reisen' },
        { id: 'W-A2-T2-016', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Umweltaktion', themenbereich: 'Natur' },
        { id: 'W-A2-T2-017', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Neues Handy', themenbereich: 'Medien' },
        { id: 'W-A2-T2-018', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Kochen fuer Freunde', themenbereich: 'Essen' },
        { id: 'W-A2-T2-019', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Wohnung renovieren', themenbereich: 'Wohnen' },
        { id: 'W-A2-T2-020', teil: 2, teilName: 'Persoenliche Mitteilung', textType: 'Mitteilung', register: 'halbformell', topic: 'Stadtteilfest', themenbereich: 'Kultur' },
    ],
    b1: [
        { id: 'W-B1-T1-011', teil: 1, teilName: 'Persoenliche E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Fitnessstudio-Vertrag', themenbereich: 'Gesundheit' },
        { id: 'W-B1-T1-012', teil: 1, teilName: 'Persoenliche E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Konzertticket-Reklamation', themenbereich: 'Kultur' },
        { id: 'W-B1-T1-013', teil: 1, teilName: 'Persoenliche E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Internetanbieter-Wechsel', themenbereich: 'Medien' },
        { id: 'W-B1-T1-014', teil: 1, teilName: 'Persoenliche E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Umzugsplanung', themenbereich: 'Wohnen' },
        { id: 'W-B1-T1-015', teil: 1, teilName: 'Persoenliche E-Mail', textType: 'E-Mail', register: 'informell', topic: 'Restaurantreservierung', themenbereich: 'Essen' },
        { id: 'W-B1-T2-011', teil: 2, teilName: 'Meinungsaeusserung', textType: 'Forumsbeitrag', register: 'informell', topic: 'Bio-Lebensmittel', themenbereich: 'Natur' },
        { id: 'W-B1-T2-012', teil: 2, teilName: 'Meinungsaeusserung', textType: 'Forumsbeitrag', register: 'informell', topic: 'Schuluniformen', themenbereich: 'Bildung' },
        { id: 'W-B1-T2-013', teil: 2, teilName: 'Meinungsaeusserung', textType: 'Forumsbeitrag', register: 'informell', topic: 'Kulturangebote', themenbereich: 'Kultur' },
        { id: 'W-B1-T2-014', teil: 2, teilName: 'Meinungsaeusserung', textType: 'Forumsbeitrag', register: 'informell', topic: 'Online-Shopping', themenbereich: 'Einkaufen' },
        { id: 'W-B1-T2-015', teil: 2, teilName: 'Meinungsaeusserung', textType: 'Forumsbeitrag', register: 'informell', topic: 'Gesundheits-Apps', themenbereich: 'Gesundheit' },
        { id: 'W-B1-T3-011', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Bewerbung Nebenjob', themenbereich: 'Arbeit' },
        { id: 'W-B1-T3-012', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Flugstornierung', themenbereich: 'Reisen' },
        { id: 'W-B1-T3-013', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Hotelbeschwerde', themenbereich: 'Reisen' },
        { id: 'W-B1-T3-014', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Stromrechnung-Widerspruch', themenbereich: 'Wohnen' },
        { id: 'W-B1-T3-015', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Kursanmeldung', themenbereich: 'Bildung' },
        { id: 'W-B1-T3-016', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Produktreklamation', themenbereich: 'Einkaufen' },
        { id: 'W-B1-T3-017', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Arzttermin verschieben', themenbereich: 'Gesundheit' },
        { id: 'W-B1-T3-018', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Vermieter kontaktieren', themenbereich: 'Wohnen' },
        { id: 'W-B1-T3-019', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Theaterabonnement', themenbereich: 'Kultur' },
        { id: 'W-B1-T3-020', teil: 3, teilName: 'Formelle E-Mail', textType: 'Formeller Brief', register: 'formell', topic: 'Handyreparatur', themenbereich: 'Medien' },
    ],
    b2: [
        { id: 'W-B2-T1-011', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Veganismus', themenbereich: 'Essen' },
        { id: 'W-B2-T1-012', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Soziale Ungleichheit', themenbereich: 'Politik' },
        { id: 'W-B2-T1-013', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'E-Mobilitaet', themenbereich: 'Reisen' },
        { id: 'W-B2-T1-014', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Kulturelle Integration', themenbereich: 'Kultur' },
        { id: 'W-B2-T1-015', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Gesundheitssystem', themenbereich: 'Gesundheit' },
        { id: 'W-B2-T1-016', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Nachhaltiger Konsum', themenbereich: 'Natur' },
        { id: 'W-B2-T1-017', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Digitale Bildung', themenbereich: 'Medien' },
        { id: 'W-B2-T1-018', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Wohnungsmarkt-Krise', themenbereich: 'Wohnen' },
        { id: 'W-B2-T1-019', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Freiwilligendienst', themenbereich: 'Politik' },
        { id: 'W-B2-T1-020', teil: 1, teilName: 'Forumsbeitrag', textType: 'Forumsbeitrag', register: 'neutral', topic: 'Wissenschaft und Gesellschaft', themenbereich: 'Wissenschaft' },
        { id: 'W-B2-T2-011', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Bewerbungsabsage', themenbereich: 'Arbeit' },
        { id: 'W-B2-T2-012', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Mietminderung', themenbereich: 'Wohnen' },
        { id: 'W-B2-T2-013', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Veranstaltungskritik', themenbereich: 'Kultur' },
        { id: 'W-B2-T2-014', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Umweltinitiative', themenbereich: 'Natur' },
        { id: 'W-B2-T2-015', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Restaurantbeschwerde', themenbereich: 'Essen' },
        { id: 'W-B2-T2-016', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Reisestornierung', themenbereich: 'Reisen' },
        { id: 'W-B2-T2-017', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Datenschutzanfrage', themenbereich: 'Medien' },
        { id: 'W-B2-T2-018', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Weiterbildungsantrag', themenbereich: 'Bildung' },
        { id: 'W-B2-T2-019', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Gesundheitsvorsorge', themenbereich: 'Gesundheit' },
        { id: 'W-B2-T2-020', teil: 2, teilName: 'Nachricht/E-Mail', textType: 'E-Mail', register: 'formell', topic: 'Forschungsbericht', themenbereich: 'Wissenschaft' },
    ],
    c1: [
        { id: 'W-C1-T1-011', teil: 1, teilName: 'Argumentativer Text', textType: 'Argumentation', register: 'sachlich', topic: 'Kulturfoerderung', themenbereich: 'Kultur' },
        { id: 'W-C1-T1-012', teil: 1, teilName: 'Argumentativer Text', textType: 'Argumentation', register: 'sachlich', topic: 'Ernaehrungspolitik', themenbereich: 'Essen' },
        { id: 'W-C1-T1-013', teil: 1, teilName: 'Argumentativer Text', textType: 'Argumentation', register: 'sachlich', topic: 'Konsumkritik', themenbereich: 'Einkaufen' },
        { id: 'W-C1-T1-014', teil: 1, teilName: 'Argumentativer Text', textType: 'Argumentation', register: 'sachlich', topic: 'Datensouveraenitaet', themenbereich: 'Medien' },
        { id: 'W-C1-T1-015', teil: 1, teilName: 'Argumentativer Text', textType: 'Argumentation', register: 'sachlich', topic: 'Tourismusethik', themenbereich: 'Reisen' },
        { id: 'W-C1-T2-011', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Forschungsantrag', themenbereich: 'Wissenschaft' },
        { id: 'W-C1-T2-012', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Kulturaustausch', themenbereich: 'Kultur' },
        { id: 'W-C1-T2-013', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Gesundheitsmanagement', themenbereich: 'Gesundheit' },
        { id: 'W-C1-T2-014', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Energieversorgung', themenbereich: 'Natur' },
        { id: 'W-C1-T2-015', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Arbeitnehmerrechte', themenbereich: 'Arbeit' },
        { id: 'W-C1-T2-016', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Verbraucherschutz', themenbereich: 'Einkaufen' },
        { id: 'W-C1-T2-017', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Stadtplanung', themenbereich: 'Wohnen' },
        { id: 'W-C1-T2-018', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Bildungsgerechtigkeit', themenbereich: 'Bildung' },
        { id: 'W-C1-T2-019', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Soziale Integration', themenbereich: 'Politik' },
        { id: 'W-C1-T2-020', teil: 2, teilName: 'Textumwandlung', textType: 'Formeller Brief', register: 'formell', topic: 'Verkehrskonzept', themenbereich: 'Reisen' },
    ],
    c2: [
        { id: 'W-C2-T1-011', teil: 1, teilName: 'Akademischer Text', textType: 'Eroerterung', register: 'akademisch', topic: 'Kulturphilosophie', themenbereich: 'Kultur' },
        { id: 'W-C2-T1-012', teil: 1, teilName: 'Akademischer Text', textType: 'Eroerterung', register: 'akademisch', topic: 'Gesundheitsoekonomie', themenbereich: 'Gesundheit' },
        { id: 'W-C2-T1-013', teil: 1, teilName: 'Akademischer Text', textType: 'Eroerterung', register: 'akademisch', topic: 'Konsumethik', themenbereich: 'Einkaufen' },
        { id: 'W-C2-T1-014', teil: 1, teilName: 'Akademischer Text', textType: 'Eroerterung', register: 'akademisch', topic: 'Mobilitaet der Zukunft', themenbereich: 'Reisen' },
        { id: 'W-C2-T1-015', teil: 1, teilName: 'Akademischer Text', textType: 'Eroerterung', register: 'akademisch', topic: 'Arbeitsphilosophie', themenbereich: 'Arbeit' },
        { id: 'W-C2-T2-011', teil: 2, teilName: 'Textumwandlung', textType: 'Zeitungsartikel', register: 'sachlich', topic: 'Gastronomiekritik', themenbereich: 'Essen' },
        { id: 'W-C2-T2-012', teil: 2, teilName: 'Textumwandlung', textType: 'Leserbrief', register: 'sachlich', topic: 'Wohnungsbaupolitik', themenbereich: 'Wohnen' },
        { id: 'W-C2-T2-013', teil: 2, teilName: 'Textumwandlung', textType: 'Feuilleton-Beitrag', register: 'sachlich', topic: 'Sportjournalismus', themenbereich: 'Freizeit' },
        { id: 'W-C2-T2-014', teil: 2, teilName: 'Textumwandlung', textType: 'Sachtext', register: 'sachlich', topic: 'Datenschutzrecht', themenbereich: 'Medien' },
        { id: 'W-C2-T2-015', teil: 2, teilName: 'Textumwandlung', textType: 'Pressemitteilung', register: 'sachlich', topic: 'Forschungspolitik', themenbereich: 'Wissenschaft' },
        { id: 'W-C2-T2-016', teil: 2, teilName: 'Textumwandlung', textType: 'Zeitungskommentar', register: 'sachlich', topic: 'Integrationspolitik', themenbereich: 'Politik' },
        { id: 'W-C2-T2-017', teil: 2, teilName: 'Textumwandlung', textType: 'Sachtext', register: 'sachlich', topic: 'Gesundheitswesen', themenbereich: 'Gesundheit' },
        { id: 'W-C2-T2-018', teil: 2, teilName: 'Textumwandlung', textType: 'Zeitungskritik', register: 'sachlich', topic: 'Naturschutz', themenbereich: 'Natur' },
        { id: 'W-C2-T2-019', teil: 2, teilName: 'Textumwandlung', textType: 'Akademischer Aufsatz', register: 'akademisch', topic: 'Bildungsfinanzierung', themenbereich: 'Bildung' },
        { id: 'W-C2-T2-020', teil: 2, teilName: 'Textumwandlung', textType: 'Sachtext', register: 'sachlich', topic: 'Arbeitsmarktreform', themenbereich: 'Arbeit' },
    ],
}

// ─── Prompt Builders ────────────────────────────────

function buildUpgradePrompt(exercise: ExerciseJson): string {
    const level = exercise.cefrLevel
    let stimulusInstruction = ''

    if (['A1'].includes(level) && exercise.teil === 1) {
        return '' // Skip A1 formular — no stimulus needed
    }

    if (['A1'].includes(level) && exercise.teil === 2) {
        return '' // A1 E-Mails are short enough without stimulus
    }

    if (['A2'].includes(level)) {
        if (exercise.teil === 1) {
            stimulusInstruction = `Generate a short, natural German email (40-60 words, A2 level vocabulary) from a friend to the student about "${exercise.topic}". 
The email should naturally prompt the student to respond with the following content points: ${JSON.stringify(exercise.contentPoints)}.
The email should use "du" form and be warm/friendly. Include a sender name.`
        } else {
            stimulusInstruction = `Generate a brief situational context note (30-50 words) in German describing the specific situation for "${exercise.topic}" that the student needs to respond to.
Include concrete details (names, addresses, dates, specific problems) that make the situation realistic.`
        }
    }

    if (['B1'].includes(level)) {
        if (exercise.teil === 1) {
            stimulusInstruction = `Generate a personal German email (60-80 words, B1 level) from a friend about "${exercise.topic}".
The email should naturally lead to the content points: ${JSON.stringify(exercise.contentPoints)}.
Use "du" form, include specific details and questions.`
        } else if (exercise.teil === 2) {
            stimulusInstruction = `Generate a German online forum post with topic "${exercise.topic}" suitable for B1 level.
Include:
1. A forum title/header
2. An initial post (50-70 words) posing the question
3. Two short comments (20-30 words each) with different viewpoints — one pro, one contra
4. A prompt asking the reader to share their opinion
Use realistic usernames. The text should naturally lead to: ${JSON.stringify(exercise.contentPoints)}.`
        } else if (exercise.teil === 3) {
            stimulusInstruction = `Generate a formal situational context (60-80 words) in German for "${exercise.topic}".
Include specific details: company/institution name, dates, order numbers, addresses, concrete problem description.
This context should prompt the student to write a formal complaint/request letter.
The student needs to address: ${JSON.stringify(exercise.contentPoints)}.`
        }
    }

    if (['B2'].includes(level)) {
        if (exercise.teil === 1) {
            stimulusInstruction = `Generate a complete German stimulus for a B2 Forumsbeitrag about "${exercise.topic}":
1. A newspaper article excerpt (80-120 words, source: a realistic German newspaper name + date)
   - Present both sides of the issue with facts/statistics
2. A short quote from an expert (1-2 sentences)
3. A short quote from someone with an opposing view (1-2 sentences)
4. A stimulus question prompting the student to take a position

This should naturally lead to these content points: ${JSON.stringify(exercise.contentPoints)}.
Write at B2 level with some complex vocabulary.`
        } else {
            stimulusInstruction = `Generate a business email context for a B2 formal email about "${exercise.topic}":
1. A received email (60-80 words) from a specific person (with name + role/position)
2. Specific context details (company, dates, reference numbers)
The student needs to write a professional response addressing: ${JSON.stringify(exercise.contentPoints)}.
Use "Sie" form in the received email.`
        }
    }

    if (['C1'].includes(level)) {
        if (exercise.teil === 1) {
            stimulusInstruction = `Generate a C1 argumentative essay stimulus about "${exercise.topic}":
1. A chart/graph description in structured format:
   - Chart type (Balkendiagramm/Kreisdiagramm/Liniendiagramm)
   - Title
   - 5-7 data points with years/labels and values
   - Source
2. Two expert quotes (2-3 sentences each) with opposing viewpoints
   - Include name + title for each expert
3. The student should: ${JSON.stringify(exercise.contentPoints)}

Write at C1 level. Use academic vocabulary.`
        } else {
            stimulusInstruction = `Generate a source text (Ausgangstext) for C1 Textumwandlung about "${exercise.topic}":
1. A spoken lecture/presentation excerpt (150-200 words)
   - Include speaker name + context
   - Use informal spoken style (filler words like "also", "na ja")
   - Include concrete examples and statistics
2. The student must transform this into a formal text.
Content points: ${JSON.stringify(exercise.contentPoints)}.`
        }
    }

    if (['C2'].includes(level)) {
        if (exercise.teil === 1) {
            stimulusInstruction = `Generate a C2 academic essay stimulus about "${exercise.topic}":
1. Two reading texts (Lesetexte), each 100-150 words
   - Text 1: From a serious newspaper (FAZ/SZ/Die Zeit), presenting one perspective
   - Text 2: From an academic source, presenting a contrasting view
   - Include realistic titles, authors, publication dates
2. A chart/graph description:
   - Type, title, 5-7 data points, source
3. These should naturally lead to: ${JSON.stringify(exercise.contentPoints)}

Write at C2/near-native level. Use sophisticated vocabulary and complex sentence structures.`
        } else {
            stimulusInstruction = `Generate a source text (Ausgangstext) for C2 Textumwandlung about "${exercise.topic}":
1. A complete source text (180-250 words) in the form of a ${exercise.textType}
   - Include title, author/source
   - Use professional journalistic/academic style
   - Include statistics, expert opinions, concrete examples
2. Content points: ${JSON.stringify(exercise.contentPoints)}

The student must transform this into a different text type.
Write at C2 level.`
        }
    }

    return stimulusInstruction
}

function buildNewExercisePrompt(def: typeof NEW_EXERCISES['a1'][0]): string {
    const level = def.id.split('-')[1] // A1, A2, etc.
    const rubricByLevel: Record<string, any> = {
        A1: {
            criteria: [
                { id: 'inhalt', name: 'Inhalt', nameVi: 'Nội dung', maxScore: 5, weight: 30 },
                { id: 'korrektheit', name: 'Korrektheit', nameVi: 'Chính xác ngữ pháp & chính tả', maxScore: 5, weight: 40 },
                { id: 'angemessenheit', name: 'Angemessenheit', nameVi: 'Tính phù hợp', maxScore: 5, weight: 30 },
            ],
            maxScore: 15,
        },
        A2: {
            criteria: [
                { id: 'inhalt', name: 'Inhalt', nameVi: 'Nội dung', maxScore: 5, weight: 30 },
                { id: 'korrektheit', name: 'Korrektheit', nameVi: 'Chính xác ngữ pháp & chính tả', maxScore: 5, weight: 35 },
                { id: 'angemessenheit', name: 'Kommunikative Angemessenheit', nameVi: 'Phù hợp giao tiếp', maxScore: 5, weight: 35 },
            ],
            maxScore: 15,
        },
        B1: {
            criteria: [
                { id: 'inhalt', name: 'Inhalt', nameVi: 'Nội dung', maxScore: 5, weight: 25 },
                { id: 'angemessenheit', name: 'Kommunikative Angemessenheit', nameVi: 'Phù hợp giao tiếp', maxScore: 5, weight: 20 },
                { id: 'korrektheit', name: 'Korrektheit', nameVi: 'Chính xác ngữ pháp & chính tả', maxScore: 5, weight: 25 },
                { id: 'spektrum', name: 'Wortschatz & Strukturen', nameVi: 'Đa dạng từ vựng & cấu trúc', maxScore: 5, weight: 15 },
                { id: 'kohaerenz', name: 'Kohaerenz & Kohaesion', nameVi: 'Mạch lạc & liên kết', maxScore: 5, weight: 15 },
            ],
            maxScore: 25,
        },
    }
    // B2, C1, C2 use same rubric as B1 but with different weights
    rubricByLevel['B2'] = { ...rubricByLevel['B1'] }
    rubricByLevel['C1'] = {
        criteria: [
            { id: 'inhalt', name: 'Inhalt', nameVi: 'Nội dung', maxScore: 5, weight: 20 },
            { id: 'angemessenheit', name: 'Kommunikative Angemessenheit', nameVi: 'Phù hợp giao tiếp', maxScore: 5, weight: 20 },
            { id: 'korrektheit', name: 'Korrektheit', nameVi: 'Chính xác ngữ pháp & chính tả', maxScore: 5, weight: 20 },
            { id: 'spektrum', name: 'Wortschatz & Strukturen', nameVi: 'Đa dạng từ vựng & cấu trúc', maxScore: 5, weight: 20 },
            { id: 'kohaerenz', name: 'Kohaerenz & Kohaesion', nameVi: 'Mạch lạc & liên kết', maxScore: 5, weight: 20 },
        ],
        maxScore: 25,
    }
    rubricByLevel['C2'] = { ...rubricByLevel['C1'] }

    const wordRanges: Record<string, Record<number, { min: number; max: number | null; time: number }>> = {
        A1: { 1: { min: 15, max: 30, time: 5 }, 2: { min: 20, max: 40, time: 10 } },
        A2: { 1: { min: 40, max: 70, time: 15 }, 2: { min: 40, max: 70, time: 15 } },
        B1: { 1: { min: 80, max: 120, time: 20 }, 2: { min: 80, max: 120, time: 20 }, 3: { min: 80, max: 120, time: 25 } },
        B2: { 1: { min: 150, max: 250, time: 35 }, 2: { min: 100, max: 150, time: 25 } },
        C1: { 1: { min: 250, max: 400, time: 50 }, 2: { min: 200, max: 300, time: 40 } },
        C2: { 1: { min: 350, max: null, time: 60 }, 2: { min: 250, max: null, time: 45 } },
    }

    const words = wordRanges[level]?.[def.teil] || { min: 80, max: 120, time: 20 }
    const rubric = rubricByLevel[level] || rubricByLevel['B1']

    return `Generate a complete JSON exercise file for a ${level} German writing exercise.

Topic: "${def.topic}" (${def.themenbereich})
Text type: ${def.textType}
Register: ${def.register}
Teil: ${def.teil} — ${def.teilName}
Word range: ${words.min}-${words.max || '∞'} words
Time: ${words.time} minutes

Generate a complete exercise JSON with:
1. Realistic "instruction" in German
2. "instructionVi" — concise Vietnamese translation
3. "situation" — detailed context (2-3 sentences in German)
4. "contentPoints" — 3-5 specific writing tasks
5. Appropriate stimulus material based on the level:
${level === 'A1' && def.teil === 1 ? '   - "formFields": array of form fields with label and type' : ''}
${level === 'A2' && def.teil === 1 ? '   - "sourceText": a friend\'s email (40-60 words, in German, A2 vocabulary)' : ''}
${level === 'A2' && def.teil === 2 ? '   - "sourceText": situation context with concrete details' : ''}
${level === 'B1' && def.teil === 1 ? '   - "sourceText": a friend\'s email (60-80 words)' : ''}
${level === 'B1' && def.teil === 2 ? '   - "sourceText": forum post + 2 comments (pro/contra)' : ''}
${level === 'B1' && def.teil === 3 ? '   - "sourceText": formal situation with specific details (names, dates, order numbers)' : ''}
${level === 'B2' && def.teil === 1 ? '   - "sourceText": newspaper article (80-120 words) + expert quotes\n   - "sourceTextType": article source name' : ''}
${level === 'B2' && def.teil === 2 ? '   - "sourceText": business email with context (60-80 words)' : ''}
${level === 'C1' && def.teil === 1 ? '   - "sourceText": 2 expert quotes\n   - "grafikDesc": chart description\n   - "grafikData": [{label, value, unit}] array' : ''}
${level === 'C1' && def.teil === 2 ? '   - "sourceText": spoken lecture excerpt (150-200 words)\n   - "sourceTextType": "Muendlicher Vortrag"' : ''}
${level === 'C2' && def.teil === 1 ? '   - "sourceText": 2 reading texts (100-150 words each) from newspapers\n   - "grafikDesc": chart description\n   - "grafikData": [{label, value, unit}]' : ''}
${level === 'C2' && def.teil === 2 ? '   - "sourceText": complete source text (180-250 words)\n   - "sourceTextType": "${def.textType}"' : ''}

The rubric is: ${JSON.stringify(rubric)}

Return ONLY valid JSON (no markdown, no code fences). Use this exact structure:
{
  "id": "${def.id}",
  "cefrLevel": "${level}",
  "teil": ${def.teil},
  "teilName": "${def.teilName}",
  "textType": "${def.textType}",
  "register": "${def.register}",
  "topic": "${def.topic}",
  "instruction": "...",
  "instructionVi": "...",
  "situation": "...",
  "contentPoints": ["..."],
  "sourceText": "..." (if applicable),
  "sourceTextType": "..." (if applicable),
  "grafikDesc": "..." (if applicable),
  "grafikData": [...] (if applicable),
  "formFields": [...] (if A1 Formular),
  "minWords": ${words.min},
  "maxWords": ${words.max || 'null'},
  "timeMinutes": ${words.time},
  "rubric": ${JSON.stringify(rubric)},
  "maxScore": ${rubric.maxScore}
}`
}

// ─── Helpers ────────────────────────────────────────
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function cleanJson(text: string): string {
    return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
}

// ─── Upgrade Mode ───────────────────────────────────
async function upgradeLevel(level: string) {
    const dir = path.join(CONTENT_DIR, level, 'writing')
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  No writing directory for ${level}`)
        return
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    console.log(`\n📝 Upgrading ${level.toUpperCase()}: ${files.length} exercises`)

    let upgraded = 0
    let skipped = 0

    for (const file of files) {
        const filepath = path.join(dir, file)
        const exercise: ExerciseJson = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

        // Skip if already has stimulus
        if (exercise.sourceText && exercise.sourceText.length > 20) {
            console.log(`  ✓ ${exercise.id} — already has stimulus, skipping`)
            skipped++
            continue
        }

        const stimulusPrompt = buildUpgradePrompt(exercise)
        if (!stimulusPrompt) {
            console.log(`  ○ ${exercise.id} — no stimulus needed (A1)`)
            skipped++
            continue
        }

        console.log(`  ⏳ ${exercise.id} — generating stimulus...`)

        try {
            const result = await model.generateContent(
                `${stimulusPrompt}\n\nReturn ONLY valid JSON with these fields:\n{\n  "sourceText": "...",\n  "sourceTextType": "...",\n  "stimulusSender": "..." (if email),\n  "grafikDesc": "..." (if chart),\n  "grafikData": [...] (if chart data)\n}\n\nDo NOT include any markdown formatting. Return ONLY the JSON object.`
            )
            const parsed = JSON.parse(cleanJson(result.response.text()))

            // Merge stimulus into exercise
            if (parsed.sourceText) exercise.sourceText = parsed.sourceText
            if (parsed.sourceTextType) exercise.sourceTextType = parsed.sourceTextType
            if (parsed.stimulusSender) (exercise as any).stimulusSender = parsed.stimulusSender
            if (parsed.grafikDesc) exercise.grafikDesc = parsed.grafikDesc
            if (parsed.grafikData) (exercise as any).grafikData = parsed.grafikData
            if (parsed.stimulusQuotes) exercise.stimulusQuotes = parsed.stimulusQuotes

            fs.writeFileSync(filepath, JSON.stringify(exercise, null, 2) + '\n')
            console.log(`  ✅ ${exercise.id} — upgraded!`)
            upgraded++
        } catch (err: any) {
            console.error(`  ❌ ${exercise.id} — FAILED: ${err.message}`)
        }

        await sleep(DELAY_MS)
    }

    console.log(`\n  📊 ${level.toUpperCase()}: ${upgraded} upgraded, ${skipped} skipped`)
}

// ─── New Exercise Mode ──────────────────────────────
async function generateNewLevel(level: string) {
    const defs = NEW_EXERCISES[level]
    if (!defs || defs.length === 0) {
        console.log(`⚠️  No new exercises defined for ${level}`)
        return
    }

    const dir = path.join(CONTENT_DIR, level, 'writing')
    fs.mkdirSync(dir, { recursive: true })

    console.log(`\n🆕 Generating ${level.toUpperCase()}: ${defs.length} new exercises`)

    let created = 0
    let skipped = 0

    for (const def of defs) {
        const filepath = path.join(dir, `${def.id}.json`)

        if (fs.existsSync(filepath)) {
            console.log(`  ✓ ${def.id} — already exists, skipping`)
            skipped++
            continue
        }

        console.log(`  ⏳ ${def.id} — generating full exercise...`)

        try {
            const prompt = buildNewExercisePrompt(def)
            const result = await model.generateContent(prompt)
            const parsed = JSON.parse(cleanJson(result.response.text()))

            // Validate required fields
            if (!parsed.id || !parsed.instruction || !parsed.contentPoints) {
                throw new Error('Missing required fields in generated JSON')
            }

            fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2) + '\n')
            console.log(`  ✅ ${def.id} — created!`)
            created++
        } catch (err: any) {
            console.error(`  ❌ ${def.id} — FAILED: ${err.message}`)
        }

        await sleep(DELAY_MS)
    }

    console.log(`\n  📊 ${level.toUpperCase()}: ${created} created, ${skipped} skipped`)
}

// ─── Main ───────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2)
    const mode = args.includes('--upgrade') ? 'upgrade' : args.includes('--new') ? 'new' : null
    const levelArg = args.find(a => !a.startsWith('--'))
    const isAll = args.includes('--all')

    if (!mode) {
        console.log('Usage:')
        console.log('  npx tsx scripts/gen-writing-exercises.ts --upgrade --level a2')
        console.log('  npx tsx scripts/gen-writing-exercises.ts --new --level b2')
        console.log('  npx tsx scripts/gen-writing-exercises.ts --upgrade --all')
        console.log('  npx tsx scripts/gen-writing-exercises.ts --new --all')
        process.exit(1)
    }

    const levels = isAll
        ? ['a2', 'b1', 'b2', 'c1', 'c2'] // A1 doesn't need upgrades
        : [levelArg?.replace('--level', '').trim() || ''].filter(Boolean)

    if (levels.length === 0) {
        console.error('❌ Specify a level (a1, a2, b1, b2, c1, c2) or --all')
        process.exit(1)
    }

    console.log(`\n🚀 Mode: ${mode.toUpperCase()} | Levels: ${levels.map(l => l.toUpperCase()).join(', ')}`)
    console.log(`📦 Content dir: ${CONTENT_DIR}`)
    console.log(`🤖 Model: ${MODEL}\n`)

    for (const level of levels) {
        if (mode === 'upgrade') {
            await upgradeLevel(level)
        } else {
            await generateNewLevel(level)
        }
    }

    console.log('\n✅ All done!')
}

main().catch(console.error)
