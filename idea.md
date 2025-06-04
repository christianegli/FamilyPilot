# FamilienPilot – Hamburg MVP

Comprehensive developer handbook for the **Hamburg-focused** first release.  Drop this file in the root of your mono‑repo; it doubles as the architectural spec ✍️ and on‑boarding guide.

---

## 1  Product Goal

Streamline **Kita‑Gutschein** and **Elterngeld / Elterngeld Plus** applications for Hamburg parents. One wizard, one document vault, one status timeline.

---

## 2  High‑Level Architecture

```mermaid
flowchart LR
  subgraph Frontend (Next.js 14)
    A[Wizard UI]
    B[Status Timeline]
    C[LLM Chat]
  end
  subgraph Backend Edge
    D(Supabase Postgres)
    E(Storage – S3 (FRA))
    F(Node PDF Service)
    G(Azure OpenAI – Chat)
    H(Submission Worker)
  end
  A -->|supabase-js| D
  B -->|supabase-js| D
  A -->|presigned URLs| E
  F -->|read/write| E
  F --> D
  H -->|PLZ → Amt| D
  H -->|SMTP/De‑Mail & Post API| E
  C --> G
```

---

## 3  Database Schema (Supabase SQL)

<details>
<summary>Click to expand the full DDL snippet</summary>

```sql
-- Run this in Supabase SQL editor (Postgres 15)
-- Extensions
create extension if not exists "pgcrypto";

-- Parents
author:
create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  geburtsdatum date not null,
  staatsangehoerigkeit text,
  strasse text,
  hausnummer text,
  plz text,
  ort text,
  email text,
  telefon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_parents_user_id on parents(user_id);

-- Children
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  vorname text not null,
  nachname text not null,
  geburtsdatum date not null,
  geburtsort text,
  geburtsurkunde_file_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_children_parent_id on children(parent_id);

-- Employment Records
create type employment_type as enum ('ANGESTELLT', 'SELBSTSTAENDIG', 'ARBEITSLOS', 'BEAMTER', 'SONSTIGES');
create table if not exists employment_records (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  arbeitgeber text,
  beschaeftigung_typ employment_type not null default 'ANGESTELLT',
  start_datum date,
  end_datum date,
  netto_monat_einkommen numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_empl_parent_id on employment_records(parent_id);

-- Documents
create type document_type as enum ('GEHALTSNACHWEIS','GEBURTSURKUNDE','MIETVERTRAG','KRANKENKASSENBESCHEINIGUNG','SONSTIGES');
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_parent_id uuid references parents(id) on delete cascade,
  type document_type,
  file_name text not null,
  mime_type text not null,
  file_size bigint,
  storage_path text not null,
  extracted_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_docs_owner on documents(owner_parent_id);

-- RLS Policies (parents, children, employment_records, documents) omitted for brevity – identical to previous rev.
```

</details>

---

## 4  Local Development Workflow

1. **Boot Supabase**

   ```bash
   supabase db reset --force
   supabase gen types typescript --project-id $PROJECT_ID > src/types/supabase.ts
   ```
2. **Scaffold Next.js app**

   ```bash
   npx create-next-app familienpilot --typescript --tailwind --src-dir
   npm i @supabase/supabase-js react-hook-form zod pdf-lib
   ```
3. **Run dev** `npm run dev`

---

## 5  Milestone Timeline (8 Weeks)

| Week | Deliverable                                                     |
| ---- | --------------------------------------------------------------- |
| 1    | Field inventory & repo.                                         |
| 2    | DB schema + wizard skeleton.                                    |
| 3    | **PDF fill (v1)** for AS‑76.                                    |
| 4    | OCR & vault.                                                    |
| 5    | **Submission worker PoC** (ElterngeldDigital + Kita email/fax). |
| 6    | Notifications & timeline.                                       |
| 7    | Pen‑test, private beta.                                         |
| 8    | UX polish, Pro tier.                                            |

---

## 6  Security & Compliance Checklist

* **GDPR** – German region storage, DPA signed.
* **eIDAS‑QES** – *sign‑me* integration.
* **BSI C5** – central log sink.
* **BITV 2.0** – WCAG AA.

---

## 7  PDF Generation & Submission

### 7.1  PDF Filling Service

* **Library**: `pdf-lib` (MIT) with Type 1 fonts embedded.
* **Coordinates mapping**: YAML files per form (e.g., `as76.yml`) mapping field‑name → {page,x,y,fontSize}.
* **Endpoint**: `POST /api/pdf/kita` − body `{ childId, parentId }` → returns filled PDF (Content‑Disposition: attachment; filename="kita-gutschein.pdf").
* **Signature workflows**:

  1. **Digital QES** via `sign‑me` API; embed certificate.
  2. **Wet signature** fallback: add a signature placeholder and show print instructions.

### 7.2  Address Routing (Hamburg Jugendämter)

* Table `amtsbezirke` (plz PRIMARY KEY, amt\_name, street, zip\_city, email, fax).
* Server util `getAmtByPLZ(plz)` returns address block.

### 7.3  Dispatch Options

| Channel                        | When used                        | Implementation                                                                                      |
| ------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| **E‑Mail / De‑Mail**           | Amt accepts PDF via secure inbox | Node SMTP client with STARTTLS; config per Amt.                                                     |
| **Internetmarke/SNIP API**     | Amt requires paper               | Generate label PNG & PDF cover sheet; enqueue to print queue or prompt user to drop at post office. |
| **ElterngeldDigital Headless** | For Elterngeld                   | Puppeteer script logs in, fills JSON, uploads attachments, saves receipt PDF to vault.              |

### 7.4  Events & Timeline

Every dispatch creates events:

```ts
interface Event {
  id: string;
  user_id: string;
  type: 'SUBMITTED' | 'RECEIPT' | 'ERROR';
  benefit: 'KITA' | 'ELTERNGELD';
  payload: Json;
  created_at: string;
}
```

Supabase `events` table feeds the `<Timeline/>` component.

---

## 8  Cursor AI Prompt

Paste this at the top of a Cursor session to scaffold the remaining layers:

```text
You are an expert Full‑Stack TypeScript dev.
Context:
- Next.js 14 app (src/).
- Supabase schema provided in README.
- pdf-lib for form filling.
- PLZ‑>Amt routing table.
Task:
1. Add step‑wizard (react‑hook‑form + zod) for Kita‑Gutschein.
2. Implement `lib/pdf.ts` with `fillAs76(data): Promise<Uint8Array>` using coordinates from `as76.yml`.
3. Build API route POST /api/pdf/kita returning the filled PDF.
4. Create `/api/dispatch/kita` that looks up Amt by PLZ, and either sends De‑Mail or returns Internetmarke PDF.
5. Build `<Timeline/>` that streams events from Supabase `events` table (real‑time subscriptions).
Deliver only code snippets (no prose).
```

---

## 9  Open Questions

1. Digital signature acceptance for Kita‑Gutschein?
2. Max file size & mime types for Elterngeld attachments?
3. Azure OpenAI token budget?
4. Mobile‑first vs. responsive desktop?

---

*Last updated 04 June 2025 – PDF & dispatch section added*
