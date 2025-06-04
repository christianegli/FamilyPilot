# FamilienPilot Hamburg

> Digital platform to streamline Kita-Gutschein and Elterngeld applications for Hamburg parents

FamilienPilot Hamburg is a comprehensive web application that replaces complex paper-based processes with a unified wizard interface, eliminating bureaucratic friction for Hamburg families.

## 🎯 Project Goals

- **One Wizard**: Unified interface for all family service applications
- **One Document Vault**: Secure storage and reuse of family documents  
- **One Timeline**: Real-time status tracking across all applications

## ✨ Features

### Kita-Gutschein Application
- ✅ Complete 5-step wizard with Hamburg-specific requirements
- ✅ Support for 4, 5, 6, 8, 10, or 12 hours daily care options
- ✅ 3-6 month advance application timeline validation
- ✅ Integration with 1,100+ participating Hamburg Kitas
- ✅ Automatic Elternbeitrag calculation based on family size and income

### Elterngeld Application  
- ✅ Complete 5-step wizard for Basis-Elterngeld, ElterngeldPlus, and Partnerschaftsbonus
- ✅ Income limit validation (€175,000/€200,000 based on child's birth date)
- ✅ Integration with 7 Hamburg Bezirksämter
- ✅ Support for up to 32 hours/week work during Elternzeit
- ✅ Automatic district office assignment based on address

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: pdf-lib
- **Styling**: Tailwind CSS with custom component library

## 📁 Project Structure

```
FamilyPilot/
├── familienpilot/          # Main Next.js application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   ├── kita-gutschein/
│   │   │   ├── elterngeld/
│   │   │   └── page.tsx    # Landing page
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # Utilities and validation
│   │   └── types/          # TypeScript definitions
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── supabase/               # Database migrations
├── .cursor/                # Development documentation
├── idea.md                 # Project specification
└── env.template            # Environment variables template
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FamilyPilot.git
   cd FamilyPilot
   ```

2. **Install dependencies**
   ```bash
   cd familienpilot
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   # Fill in your Supabase credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Current Status

### ✅ Completed (Phase 1-2)
- [x] Next.js 14 foundation with TypeScript
- [x] Supabase database schema design
- [x] Complete Kita-Gutschein wizard (5 steps)
- [x] Complete Elterngeld wizard (5 steps)  
- [x] Hamburg-specific requirement validation
- [x] Professional UI with step-by-step guidance
- [x] Unified landing page

### 🚧 In Progress (Phase 3)
- [ ] Data persistence with cloud Supabase
- [ ] PDF form generation (AS-76 and Elterngeld forms)
- [ ] Hamburg Jugendamt routing system

### 📅 Planned (Phase 4-6)
- [ ] Multi-channel submission (Email, De-Mail, Postal API)
- [ ] ElterngeldDigital integration
- [ ] Document OCR and auto-extraction
- [ ] Real-time status timeline
- [ ] GDPR compliance implementation
- [ ] Security audit and penetration testing

## 🎨 Screenshots

### Landing Page
Professional unified interface for both services with clear navigation and feature descriptions.

### Kita-Gutschein Wizard
5-step wizard with Hamburg-specific validation:
1. Parent personal data
2. Child information  
3. Employment details
4. Care requirements (4-12 hours)
5. Review and submission

### Elterngeld Wizard  
5-step wizard with income validation:
1. Parent personal data
2. Child information
3. Employment and income
4. Elterngeld configuration
5. Review and submission

## 📚 Hamburg Requirements Research

### Kita-Gutschein System
- **Care Hours**: Exactly 4, 5, 6, 8, 10, or 12 hours daily
- **Application Timeline**: 3-6 months advance notice required
- **Scale**: 1,100+ participating Kitas across Hamburg
- **Cost**: Elternbeitrag based on family size, income, and care hours

### Elterngeld System
- **Types**: Basis-Elterngeld (BEG), ElterngeldPlus (EGP), Partnerschaftsbonus (PBM)
- **Income Limits**: €175,000 (children born after April 2025), €200,000 (after April 2024)
- **Offices**: 7 Hamburg district offices (Bezirksämter)
- **Processing**: ~4 weeks, must apply within 3 months for retroactive payment
- **Amount**: €300-€1,800 per month

## 🔒 Security & Compliance

- **GDPR**: German data residency requirements
- **eIDAS-QES**: Digital signature integration planned
- **BITV 2.0**: Accessibility compliance (WCAG AA)
- **BSI C5**: Security logging and audit trails

## 🤝 Contributing

This project is currently in active development. Please see the `.cursor/scratchpad.md` file for detailed development plans and progress tracking.

## 📄 License

This project is proprietary software for Hamburg family services.

## 📞 Contact

For questions about Hamburg family services, contact your local Bezirksamt or visit [hamburg.com](https://www.hamburg.com).

---

**Built with ❤️ for Hamburg families** 