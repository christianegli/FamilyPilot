export type EmploymentType = 'ANGESTELLT' | 'SELBSTSTAENDIG' | 'ARBEITSLOS' | 'BEAMTER' | 'SONSTIGES'
export type DocumentType = 'GEHALTSNACHWEIS' | 'GEBURTSURKUNDE' | 'MIETVERTRAG' | 'KRANKENKASSENBESCHEINIGUNG' | 'SONSTIGES'
export type EventType = 'SUBMITTED' | 'RECEIPT' | 'ERROR' | 'STATUS_CHANGE'
export type BenefitType = 'KITA' | 'ELTERNGELD' | 'ELTERNGELD_PLUS'

export interface Parent {
  id: string
  user_id: string
  first_name: string
  last_name: string
  geburtsdatum: string // ISO date string
  staatsangehoerigkeit?: string
  strasse?: string
  hausnummer?: string
  plz?: string
  ort?: string
  email?: string
  telefon?: string
  created_at: string
  updated_at: string
}

export interface Child {
  id: string
  parent_id: string
  vorname: string
  nachname: string
  geburtsdatum: string // ISO date string
  geburtsort?: string
  geburtsurkunde_file_id?: string
  created_at: string
  updated_at: string
}

export interface EmploymentRecord {
  id: string
  parent_id: string
  arbeitgeber?: string
  beschaeftigung_typ: EmploymentType
  start_datum?: string // ISO date string
  end_datum?: string // ISO date string
  netto_monat_einkommen?: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  owner_parent_id?: string
  type?: DocumentType
  file_name: string
  mime_type: string
  file_size?: number
  storage_path: string
  extracted_json?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  user_id: string
  type: EventType
  benefit: BenefitType
  payload?: Record<string, any>
  created_at: string
}

export interface Application {
  id: string
  parent_id: string
  child_id?: string
  benefit_type: BenefitType
  status: string
  submitted_at?: string
  pdf_file_id?: string
  created_at: string
  updated_at: string
}

export interface Jugendamt {
  plz: string
  amt_name: string
  street: string
  zip_city: string
  email?: string
  fax?: string
} 