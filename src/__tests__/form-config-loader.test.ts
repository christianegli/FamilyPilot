/**
 * Form Configuration Loader Service Tests
 * Tests for loading and managing form configurations
 * 
 * @author FamilyPilot Hamburg Team
 * @version 1.0.0
 * @since 2024-12-16
 */

import { FormConfigLoader, FormConfig, DistrictInfo } from '../lib/services/form-config-loader';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module for testing
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock YAML configurations
const mockKitaConfig = {
  forms: {
    kita_hauptantrag: {
      name: "Hauptantrag Kita-Gutschein",
      description: "Main application for Kita voucher",
      filename: "hauptantrag_kita_gutschein.pdf",
      version: "2025.1",
      effective_date: "2025-01-01",
      form_type: "kita_application",
      processing_authority: "Bezirksamt - Abteilung Kindertagesbetreuung",
      xl_gutschein_eligible: true,
      fields: {
        child_first_name: {
          coordinates: { x: 120, y: 680 },
          width: 180,
          height: 20,
          required: true,
          data_source: "kita_application.vorname",
          encryption_required: true
        },
        care_hours: {
          coordinates: { x: 200, y: 280 },
          width: 40,
          height: 20,
          required: true,
          data_source: "kita_application.betreuungsumfang",
          options: ["4", "5", "6", "8", "10", "12"]
        }
      }
    },
    kita_5_stunden: {
      name: "5-Stunden Kita-Antrag",
      description: "Application for 5-hour daily Kita care",
      filename: "antrag_5_stunden_kita.pdf",
      version: "2025.1",
      effective_date: "2025-01-01",
      form_type: "kita_application_basic",
      processing_authority: "Bezirksamt - Abteilung Kindertagesbetreuung",
      xl_gutschein_eligible: true,
      xl_automatic: true,
      fields: {
        child_first_name: {
          coordinates: { x: 120, y: 680 },
          width: 180,
          height: 20,
          required: true,
          data_source: "kita_application.vorname",
          encryption_required: true
        }
      }
    }
  },
  districts: {
    altona: {
      name: "Bezirksamt Altona",
      postal_codes: ["22041", "22765"],
      contact: {
        address: "Platz der Republik 1, 22765 Hamburg",
        phone: "040 42811-0",
        email: "kindertagesbetreuung@altona.hamburg.de"
      }
    },
    hamburg_mitte: {
      name: "Bezirksamt Hamburg-Mitte",
      postal_codes: ["20095", "20099"],
      contact: {
        address: "Caffamacherreihe 1-3, 20355 Hamburg",
        phone: "040 42854-0",
        email: "kindertagesbetreuung@hamburg-mitte.hamburg.de"
      }
    }
  },
  submission: {
    methods: ["online", "email", "postal"],
    processing_time: "up to 10 weeks",
    timeline_recommendation: "3-6 months before desired start"
  }
};

const mockElterngeldConfig = {
  forms: {
    elterngeld_hauptantrag: {
      name: "Elterngeld Hauptantrag",
      description: "Main application for parental allowance",
      filename: "elterngeld_antrag_2025.pdf",
      version: "2025.1",
      effective_date: "2025-01-01",
      form_type: "elterngeld_application",
      processing_authority: "Bezirksamt - Elterngeldstelle",
      income_limits: {
        children_born_after_april_2025: 175000,
        default: 200000
      },
      fields: {
        parent_first_name: {
          coordinates: { x: 120, y: 620 },
          width: 180,
          height: 20,
          required: true,
          data_source: "elterngeld_application.first_name",
          encryption_required: true
        },
        annual_income_before_birth: {
          coordinates: { x: 120, y: 220 },
          width: 100,
          height: 20,
          required: true,
          data_source: "elterngeld_application.jahreseinkommen_vor_geburt",
          encryption_required: true,
          format: "currency"
        }
      }
    }
  },
  elterngeld_offices: {
    altona: {
      name: "Elterngeldstelle Altona",
      postal_codes: ["22041", "22765"],
      contact: {
        address: "Platz der Republik 1, 22765 Hamburg",
        phone: "040 42811-2345",
        email: "elterngeld@altona.hamburg.de",
        office_hours: "Mo-Fr 8:00-16:00"
      }
    }
  },
  processing: {
    average_processing_time: "4 weeks",
    application_deadline: "within 3 months of birth",
    retroactive_payment: true,
    maximum_work_hours: 32
  }
};

describe('FormConfigLoader', () => {
  let formConfigLoader: FormConfigLoader;

  beforeEach(() => {
    // Get fresh instance and clear cache
    formConfigLoader = FormConfigLoader.getInstance();
    formConfigLoader.clearCache();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock YAML file loading
    mockFs.readFile.mockImplementation((filePath: string) => {
      const pathStr = filePath.toString();
      if (pathStr.includes('hamburg-forms.yaml')) {
        return Promise.resolve(JSON.stringify(mockKitaConfig));
      } else if (pathStr.includes('elterngeld-forms.yaml')) {
        return Promise.resolve(JSON.stringify(mockElterngeldConfig));
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  afterEach(() => {
    formConfigLoader.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FormConfigLoader.getInstance();
      const instance2 = FormConfigLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Loading', () => {
    it('should load Kita configuration successfully', async () => {
      const config = await formConfigLoader.loadKitaConfig();
      
      expect(config).toBeDefined();
      expect(config.forms).toBeDefined();
      expect(config.forms.kita_hauptantrag).toBeDefined();
      expect(config.districts).toBeDefined();
    });

    it('should load Elterngeld configuration successfully', async () => {
      const config = await formConfigLoader.loadElterngeldConfig();
      
      expect(config).toBeDefined();
      expect(config.forms).toBeDefined();
      expect(config.forms.elterngeld_hauptantrag).toBeDefined();
      expect(config.elterngeld_offices).toBeDefined();
    });

    it('should cache configurations after first load', async () => {
      // First load
      await formConfigLoader.loadKitaConfig();
      
      // Second load (should use cache)
      await formConfigLoader.loadKitaConfig();
      
      // Should only read file once
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle file loading errors', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));
      
      await expect(formConfigLoader.loadKitaConfig()).rejects.toThrow('Failed to load Kita form configuration');
    });
  });

  describe('Form Configuration Retrieval', () => {
    it('should get specific form configuration', async () => {
      const formConfig = await formConfigLoader.getFormConfig('kita', 'kita_hauptantrag');
      
      expect(formConfig).toBeDefined();
      expect(formConfig?.name).toBe("Hauptantrag Kita-Gutschein");
      expect(formConfig?.fields.child_first_name).toBeDefined();
    });

    it('should return null for non-existent form', async () => {
      const formConfig = await formConfigLoader.getFormConfig('kita', 'non_existent_form');
      
      expect(formConfig).toBeNull();
    });

    it('should get all available forms for application type', async () => {
      const forms = await formConfigLoader.getAvailableForms('kita');
      
      expect(Object.keys(forms)).toContain('kita_hauptantrag');
      expect(Object.keys(forms)).toContain('kita_5_stunden');
    });
  });

  describe('Form Determination Logic', () => {
    it('should determine main form for special needs children', async () => {
      const applicationData = {
        betreuungsumfang: 5,
        geburtsdatum: '2023-01-01',
        integrationshilfe_benoetigt: true
      };
      
      const formId = await formConfigLoader.determineForm('kita', applicationData);
      
      expect(formId).toBe('kita_hauptantrag');
    });

    it('should determine 5-hour form for basic care', async () => {
      const applicationData = {
        betreuungsumfang: 5,
        geburtsdatum: '2022-01-01', // Child over 1 year
        integrationshilfe_benoetigt: false
      };
      
      const formId = await formConfigLoader.determineForm('kita', applicationData);
      
      expect(formId).toBe('kita_5_stunden');
    });

    it('should determine main form for extended care hours', async () => {
      const applicationData = {
        betreuungsumfang: 8,
        geburtsdatum: '2022-01-01'
      };
      
      const formId = await formConfigLoader.determineForm('kita', applicationData);
      
      expect(formId).toBe('kita_hauptantrag');
    });

    it('should determine Elterngeld main form', async () => {
      const applicationData = {
        beschaeftigung_typ: 'Vollzeit'
      };
      
      const formId = await formConfigLoader.determineForm('elterngeld', applicationData);
      
      expect(formId).toBe('elterngeld_hauptantrag');
    });
  });

  describe('District Assignment', () => {
    it('should find district by postal code for Kita', async () => {
      const district = await formConfigLoader.getDistrictByPostalCode('22041', 'kita');
      
      expect(district).toBeDefined();
      expect(district?.name).toBe("Bezirksamt Altona");
      expect(district?.contact.email).toBe("kindertagesbetreuung@altona.hamburg.de");
    });

    it('should find office by postal code for Elterngeld', async () => {
      const office = await formConfigLoader.getDistrictByPostalCode('22041', 'elterngeld');
      
      expect(office).toBeDefined();
      expect(office?.name).toBe("Elterngeldstelle Altona");
      expect(office?.contact.email).toBe("elterngeld@altona.hamburg.de");
    });

    it('should return null for unknown postal code', async () => {
      const district = await formConfigLoader.getDistrictByPostalCode('99999', 'kita');
      
      expect(district).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields successfully', async () => {
      const formData = {
        'kita_application': {
          'vorname': 'Max'
        },
        'kita_application.betreuungsumfang': '5'
      };
      
      const validation = await formConfigLoader.validateFormData('kita', 'kita_hauptantrag', formData);
      
      expect(validation.isValid).toBe(false); // Still missing required fields
      expect(validation.errors).toContain('Required field missing: care_hours');
    });

    it('should report validation errors for missing required fields', async () => {
      const formData = {}; // Empty form data
      
      const validation = await formConfigLoader.validateFormData('kita', 'kita_hauptantrag', formData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Required field missing: child_first_name');
    });

    it('should report warnings for encryption required fields', async () => {
      const formData = {
        'kita_application': {
          'vorname': 'Max'
        },
        child_first_name: 'Max',
        care_hours: '5'
      };
      
      const validation = await formConfigLoader.validateFormData('kita', 'kita_hauptantrag', formData);
      
      expect(validation.warnings).toContain('Field requires encryption: child_first_name');
    });

    it('should return error for non-existent form', async () => {
      const validation = await formConfigLoader.validateFormData('kita', 'non_existent', {});
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Form configuration not found: non_existent');
    });
  });

  describe('Form Metadata', () => {
    it('should get form metadata successfully', async () => {
      const metadata = await formConfigLoader.getFormMetadata('kita', 'kita_hauptantrag');
      
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe("Hauptantrag Kita-Gutschein");
      expect(metadata?.version).toBe("2025.1");
      expect(metadata?.processingAuthority).toBe("Bezirksamt - Abteilung Kindertagesbetreuung");
    });

    it('should return null for non-existent form metadata', async () => {
      const metadata = await formConfigLoader.getFormMetadata('kita', 'non_existent');
      
      expect(metadata).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should calculate child age correctly', async () => {
      // Test through form determination which uses calculateChildAge internally
      const currentYear = new Date().getFullYear();
      const oneYearAgo = `${currentYear - 1}-06-15`;
      
      const applicationData = {
        betreuungsumfang: 5,
        geburtsdatum: oneYearAgo,
        integrationshilfe_benoetigt: false
      };
      
      const formId = await formConfigLoader.determineForm('kita', applicationData);
      
      // Child over 1 year should get 5-hour form
      expect(formId).toBe('kita_5_stunden');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache correctly', async () => {
      // Load config to populate cache
      await formConfigLoader.loadKitaConfig();
      
      // Clear cache
      formConfigLoader.clearCache();
      
      // Next load should read file again
      await formConfigLoader.loadKitaConfig();
      
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });
  });
}); 