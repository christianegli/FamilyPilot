import { z } from 'zod'

// Parent validation schema
export const parentSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich'),
  last_name: z.string().min(1, 'Nachname ist erforderlich'),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  staatsangehoerigkeit: z.string().optional().default('deutsch'),
  strasse: z.string().min(1, 'Straße ist erforderlich'),
  hausnummer: z.string().min(1, 'Hausnummer ist erforderlich'),
  plz: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  ort: z.string().optional().default('Hamburg'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  telefon: z.string().min(1, 'Telefonnummer ist erforderlich'),
})

// Child validation schema
export const childSchema = z.object({
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  geburtsort: z.string().optional().default('Hamburg'),
})

// Employment record validation schema
export const employmentSchema = z.object({
  beschaeftigung_typ: z.enum(['ANGESTELLT', 'SELBSTSTAENDIG', 'ARBEITSLOS', 'BEAMTER', 'SONSTIGES']),
  arbeitgeber: z.string().optional(),
  start_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  end_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  netto_monat_einkommen: z.number().positive('Einkommen muss positiv sein').optional(),
  wochenstunden: z.number().min(1).max(60, 'Bitte gültige Wochenstunden eingeben').optional(),
})

// Hamburg Kita application form schema based on official requirements
export const kitaApplicationSchema = z.object({
  parent: parentSchema,
  child: childSchema,
  employment: employmentSchema,
  
  // Care requirements - Hamburg offers 4, 5, 6, 8, 10, or 12 hours
  betreuungsumfang: z.enum(['4', '5', '6', '8', '10', '12'], {
    errorMap: () => ({ message: 'Bitte wählen Sie 4, 5, 6, 8, 10 oder 12 Stunden' })
  }),
  
  // Desired start date - must be 3-6 months in advance
  wunsch_startdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  
  // Reason for care (required for hours beyond basic entitlement)
  betreuungsgrund: z.enum(['BERUFSTAETIGKEIT', 'AUSBILDUNG', 'STUDIUM', 'ARBEITSSUCHE', 'INTEGRATION', 'BESONDERE_HAERTE'], {
    errorMap: () => ({ message: 'Bitte wählen Sie einen Betreuungsgrund' })
  }),
  
  // Family information for calculating Elternbeitrag
  anzahl_kinder_im_haushalt: z.number().min(1, 'Mindestens 1 Kind'),
  familienstand: z.enum(['LEDIG', 'VERHEIRATET', 'GESCHIEDEN', 'VERWITWET', 'LEBENSPARTNERSCHAFT']),
  
  // Additional needs
  besondere_beduerfnisse: z.string().optional(),
  integrationshilfe_benoetigt: z.boolean().default(false),
  
  // Preferred Kitas (optional)
  wunsch_kitas: z.array(z.string()).max(3, 'Maximal 3 Wunsch-Kitas').optional(),
})

// Hamburg Elterngeld application form schema based on research from hamburg.com and einfach-elterngeld.de
export const elterngeldApplicationSchema = z.object({
  parent: parentSchema,
  child: childSchema,
  employment: employmentSchema,
  
  // Type of parental allowance - Hamburg offers 3 types
  elterngeld_typ: z.enum(['ELTERNGELD', 'ELTERNGELD_PLUS', 'PARTNERSCHAFTSBONUS'], {
    errorMap: () => ({ message: 'Bitte wählen Sie einen Elterngeld-Typ' })
  }),
  
  // Duration in months - depends on type
  bezugsdauer_monate: z.number().min(1).max(28, 'Maximal 28 Monate für ElterngeldPlus'),
  
  // Partner information for ElterngeldPlus and Partnerschaftsbonus
  partner_bezieht_elterngeld: z.boolean(),
  partner_name: z.string().optional(),
  partner_geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat').optional(),
  
  // Income validation based on Hamburg limits (from search results)
  jahreseinkommen_vor_geburt: z.number().positive('Einkommen muss positiv sein'),
  einkommen_waehrend_elternzeit: z.number().min(0, 'Einkommen kann nicht negativ sein').optional(),
  
  // Work reduction information (max 32 hours/week for Elterngeld)
  arbeitszeit_reduzierung: z.boolean(),
  neue_wochenstunden: z.number().max(32, 'Maximal 32 Stunden pro Woche').optional(),
  
  // Application timing (must be after birth, within 3 months for retroactive payment)
  antragsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  
  // Hamburg district office assignment
  bezirksamt: z.enum(['HAMBURG_MITTE', 'EIMSBUETTEL', 'ALTONA', 'BERGEDORF', 'HAMBURG_NORD', 'HARBURG', 'WANDSBEK']),
  
  // Additional information
  besondere_umstaende: z.string().optional(),
})

export type ParentFormData = z.infer<typeof parentSchema>
export type ChildFormData = z.infer<typeof childSchema>
export type EmploymentFormData = z.infer<typeof employmentSchema>
export type KitaApplicationFormData = z.infer<typeof kitaApplicationSchema>
export type ElterngeldApplicationFormData = z.infer<typeof elterngeldApplicationSchema>

// Hamburg specific enums for dropdowns
export const BETREUUNGSGRUND_OPTIONS = [
  { value: 'BERUFSTAETIGKEIT', label: 'Berufstätigkeit' },
  { value: 'AUSBILDUNG', label: 'Ausbildung' },
  { value: 'STUDIUM', label: 'Studium' },
  { value: 'ARBEITSSUCHE', label: 'Arbeitssuche' },
  { value: 'INTEGRATION', label: 'Integration' },
  { value: 'BESONDERE_HAERTE', label: 'Besondere Härte' },
] as const

export const BETREUUNGSUMFANG_OPTIONS = [
  { value: '4', label: '4 Stunden täglich' },
  { value: '5', label: '5 Stunden täglich (inkl. Mittagessen)' },
  { value: '6', label: '6 Stunden täglich' },
  { value: '8', label: '8 Stunden täglich' },
  { value: '10', label: '10 Stunden täglich' },
  { value: '12', label: '12 Stunden täglich' },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'ANGESTELLT', label: 'Angestellt' },
  { value: 'SELBSTSTAENDIG', label: 'Selbstständig' },
  { value: 'ARBEITSLOS', label: 'Arbeitslos' },
  { value: 'BEAMTER', label: 'Beamter/Beamtin' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
] as const

// Hamburg Elterngeld specific options (based on search results)
export const ELTERNGELD_TYP_OPTIONS = [
  { value: 'ELTERNGELD', label: 'Basis-Elterngeld (BEG)' },
  { value: 'ELTERNGELD_PLUS', label: 'ElterngeldPlus (EGP)' },
  { value: 'PARTNERSCHAFTSBONUS', label: 'Partnerschaftsbonus-Monate (PBM)' },
] as const

export const HAMBURG_BEZIRKSAMT_OPTIONS = [
  { value: 'HAMBURG_MITTE', label: 'Hamburg-Mitte' },
  { value: 'EIMSBUETTEL', label: 'Eimsbüttel' },
  { value: 'ALTONA', label: 'Altona' },
  { value: 'BERGEDORF', label: 'Bergedorf' },
  { value: 'HAMBURG_NORD', label: 'Hamburg-Nord' },
  { value: 'HARBURG', label: 'Harburg' },
  { value: 'WANDSBEK', label: 'Wandsbek' },
] as const

// Income limits for Hamburg Elterngeld (from search results)
export const ELTERNGELD_INCOME_LIMITS = {
  CHILDREN_BORN_AFTER_APRIL_2025: 175000, // €175,000 for children born after April 1, 2025
  CHILDREN_BORN_AFTER_APRIL_2024: 200000, // €200,000 for children born after April 1, 2024
} as const 