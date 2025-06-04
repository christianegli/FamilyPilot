# GDPR Data Mapping for FamilienPilot Hamburg

## Overview
This document provides a comprehensive mapping of all personal data processing activities in FamilienPilot Hamburg in compliance with GDPR Article 30 (Records of Processing Activities).

**Last Updated**: June 4, 2025  
**Data Controller**: FamilienPilot Hamburg  
**Document Version**: 1.0

## Legal Framework
- **Primary Regulation**: EU GDPR (General Data Protection Regulation)
- **Territorial Scope**: Hamburg, Germany (EU jurisdiction)
- **Data Residency**: Germany (Frankfurt region via Supabase EU)

---

## 1. Kita-Gutschein Application Data Processing

### 1.1 Parent Personal Data
**Purpose**: Application for childcare voucher (Kita-Gutschein)  
**Legal Basis**: Legitimate interest (public service provision) + Consent  
**Data Categories**:

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `first_name` | String | Personal | 7 years | Identification, application processing |
| `last_name` | String | Personal | 7 years | Identification, application processing |
| `geburtsdatum` | Date | Personal | 7 years | Age verification, eligibility |
| `staatsangehoerigkeit` | String | Personal | 7 years | Eligibility verification |
| `strasse` | String | Personal | 7 years | Address verification, Amt routing |
| `hausnummer` | String | Personal | 7 years | Address verification, Amt routing |
| `plz` | String | Personal | 7 years | District assignment, Amt routing |
| `ort` | String | Personal | 7 years | Location verification |
| `email` | Email | Personal | 7 years | Communication, notifications |
| `telefon` | String | Personal | 7 years | Communication, verification |

### 1.2 Child Data (Special Category - Enhanced Protection)
**Purpose**: Child identification for Kita-Gutschein application  
**Legal Basis**: Legitimate interest (public service) + Explicit consent  
**Special Considerations**: Child data requires enhanced protection under GDPR

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `vorname` | String | Special (Child) | 7 years | Child identification |
| `nachname` | String | Special (Child) | 7 years | Child identification |
| `geburtsdatum` | Date | Special (Child) | 7 years | Age verification, care requirements |
| `geburtsort` | String | Special (Child) | 7 years | Document verification |

### 1.3 Employment & Financial Data
**Purpose**: Eligibility verification and Elternbeitrag calculation  
**Legal Basis**: Legitimate interest + Consent

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `beschaeftigung_typ` | Enum | Personal | 7 years | Care need verification |
| `arbeitgeber` | String | Personal | 7 years | Employment verification |
| `wochenstunden` | Number | Personal | 7 years | Care hour justification |
| `netto_monat_einkommen` | Number | Financial | 7 years | Elternbeitrag calculation |
| `start_datum` | Date | Personal | 7 years | Employment verification |
| `end_datum` | Date | Personal | 7 years | Employment verification |

### 1.4 Care Requirements Data
**Purpose**: Care allocation and service provision  
**Legal Basis**: Legitimate interest

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `betreuungsumfang` | Enum | Personal | 7 years | Care hour allocation |
| `betreuungsgrund` | Enum | Personal | 7 years | Eligibility verification |
| `wunsch_startdatum` | Date | Personal | 7 years | Service planning |
| `anzahl_kinder_im_haushalt` | Number | Personal | 7 years | Elternbeitrag calculation |
| `familienstand` | Enum | Personal | 7 years | Elternbeitrag calculation |
| `integrationshilfe_benoetigt` | Boolean | Special | 7 years | Special needs provision |
| `besondere_beduerfnisse` | Text | Special | 7 years | Special care requirements |

---

## 2. Elterngeld Application Data Processing

### 2.1 Parent Personal Data (Reused Schema)
**Purpose**: Parental allowance application  
**Legal Basis**: Legitimate interest (social security) + Consent  
*Uses same schema as Kita application - see section 1.1*

### 2.2 Child Data (Reused Schema)
**Purpose**: Child identification for Elterngeld eligibility  
**Legal Basis**: Legitimate interest + Explicit consent  
*Uses same schema as Kita application - see section 1.2*

### 2.3 Financial & Employment Data (Extended)
**Purpose**: Elterngeld calculation and eligibility  
**Legal Basis**: Legal obligation (social security law) + Consent

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `jahreseinkommen_vor_geburt` | Number | Financial | 7 years | Benefit calculation |
| `einkommen_waehrend_elternzeit` | Number | Financial | 7 years | Benefit calculation |
| `arbeitszeit_reduzierung` | Boolean | Personal | 7 years | Benefit type determination |
| `neue_wochenstunden` | Number | Personal | 7 years | ElterngeldPlus calculation |

### 2.4 Elterngeld Configuration Data
**Purpose**: Benefit type selection and calculation  
**Legal Basis**: Legitimate interest + Consent

| Field | Data Type | Sensitivity | Retention | Purpose |
|-------|-----------|-------------|-----------|---------|
| `elterngeld_typ` | Enum | Personal | 7 years | Benefit type allocation |
| `bezugsdauer_monate` | Number | Personal | 7 years | Benefit duration planning |
| `partner_bezieht_elterngeld` | Boolean | Personal | 7 years | Benefit coordination |
| `partner_name` | String | Personal | 7 years | Partner identification |
| `partner_geburtsdatum` | Date | Personal | 7 years | Partner identification |
| `antragsdatum` | Date | Personal | 7 years | Application processing |
| `bezirksamt` | Enum | Personal | 7 years | Administrative routing |
| `besondere_umstaende` | Text | Personal | 7 years | Special case handling |

---

## 3. Data Processing Activities

### 3.1 Data Collection
**When**: During wizard completion  
**How**: Web forms with step-by-step validation  
**Location**: User's browser → Supabase (EU Frankfurt)  
**Security**: HTTPS encryption, input validation

### 3.2 Data Storage
**Primary Storage**: Supabase PostgreSQL (EU Frankfurt)  
**Encryption**: Database-level encryption  
**Access Control**: Row Level Security (RLS) policies  
**Backup**: Automated daily backups (EU region)

### 3.3 Data Processing
**Purpose**: Application validation, PDF generation, submission  
**Location**: Supabase Edge Functions (EU)  
**Security**: Function-level access controls

### 3.4 Data Transmission
**Internal**: Application → Database (encrypted)  
**External**: PDF → Hamburg government offices  
**Security**: TLS 1.3, secure email where applicable

---

## 4. Third-Party Data Processors

### 4.1 Supabase (Primary Processor)
**Purpose**: Database, authentication, file storage  
**Location**: EU (Frankfurt) data center  
**DPA**: Data Processing Agreement required  
**Certification**: SOC 2, ISO 27001  
**Data Types**: All application data

### 4.2 PDF Generation Service
**Purpose**: Form filling and document generation  
**Location**: EU-based processing  
**Data Types**: All form data for PDF creation  
**Retention**: Temporary processing only

### 4.3 Email Service Provider (Future)
**Purpose**: Notifications and communication  
**Location**: EU-based service required  
**Data Types**: Email addresses, notification content  
**Retention**: As per communication logs

---

## 5. Data Subject Rights Implementation

### 5.1 Right of Access (Article 15)
**Implementation**: User dashboard with data export  
**Format**: JSON and human-readable PDF  
**Timeline**: Within 1 month of request

### 5.2 Right to Rectification (Article 16)
**Implementation**: Edit functionality in user dashboard  
**Scope**: All personal data fields  
**Notification**: Relevant authorities notified of changes

### 5.3 Right to Erasure (Article 17)
**Implementation**: Account deletion with data purge  
**Exceptions**: Legal obligation to retain (government applications)  
**Timeline**: Immediate for withdrawable data

### 5.4 Right to Data Portability (Article 20)
**Implementation**: Machine-readable export (JSON)  
**Scope**: All user-provided data  
**Format**: Structured, commonly used format

### 5.5 Right to Object (Article 21)
**Implementation**: Opt-out mechanisms for non-essential processing  
**Scope**: Marketing, analytics, optional features

---

## 6. Data Retention & Deletion

### 6.1 Retention Periods
**Government Applications**: 7 years (legal requirement)  
**User Account Data**: Until account deletion + 30 days  
**Audit Logs**: 3 years  
**Session Data**: 24 hours

### 6.2 Automated Deletion
**Implementation**: Scheduled job for expired data  
**Frequency**: Daily cleanup process  
**Verification**: Deletion confirmation logs

---

## 7. Security Measures

### 7.1 Technical Safeguards
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Multi-factor authentication
- **Audit Logging**: All data access logged
- **Session Management**: Secure session handling

### 7.2 Organizational Safeguards
- **Staff Training**: GDPR awareness training
- **Access Policies**: Need-to-know basis
- **Incident Response**: Data breach procedures
- **Regular Audits**: Quarterly compliance reviews

---

## 8. Cross-Border Data Transfers

### 8.1 EU Processing Only
**Supabase**: EU Frankfurt data center  
**PDF Processing**: EU-based services only  
**Email Services**: EU-based providers only

### 8.2 Adequacy Decisions
**Current**: No third-country transfers planned  
**Future**: Only to countries with adequacy decisions

---

## 9. Special Categories of Data

### 9.1 Child Data
**Enhanced Protection**: Explicit consent required  
**Access Restriction**: Limited to authorized personnel  
**Retention**: Minimum necessary period

### 9.2 Financial Data
**Purpose Limitation**: Only for benefit calculation  
**Access Control**: Finance team only  
**Encryption**: Additional encryption layer

---

## 10. Compliance Monitoring

### 10.1 Regular Reviews
**Frequency**: Quarterly data mapping reviews  
**Scope**: New processing activities, data flows  
**Documentation**: Updated data mapping records

### 10.2 Auditing
**Internal**: Monthly compliance checks  
**External**: Annual GDPR audit  
**Remediation**: Immediate action on findings

---

## Document Control
**Created**: June 4, 2025  
**Last Review**: June 4, 2025  
**Next Review**: September 4, 2025  
**Owner**: Data Protection Officer  
**Approved**: [Pending]

*This document must be updated whenever new data processing activities are introduced or existing ones are modified.* 