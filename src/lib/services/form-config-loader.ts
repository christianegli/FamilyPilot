/**
 * Form Configuration Loader Service
 * Handles loading and managing form configurations for Hamburg applications
 * 
 * @author FamilyPilot Hamburg Team
 * @version 1.0.0
 * @since 2024-12-16
 */

import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';

// Type definitions for form configurations
export interface FormField {
  coordinates: { x: number; y: number };
  width: number;
  height: number;
  required: boolean;
  data_source: string;
  encryption_required?: boolean;
  format?: string;
  validation?: string;
  field_type?: 'text' | 'checkbox' | 'radio' | 'textarea' | 'select';
  options?: string[];
  default?: string;
  condition?: string;
  auto_assign?: string;
}

export interface FormConfig {
  name: string;
  description: string;
  filename: string;
  version: string;
  effective_date: string;
  form_type: string;
  processing_authority: string;
  xl_gutschein_eligible?: boolean;
  xl_automatic?: boolean;
  xl_krippen_gutschein?: string;
  xl_elementar_gutschein?: string;
  income_limits?: Record<string, number>;
  benefit_amounts?: {
    minimum: number;
    maximum: number;
    calculation_base: string;
    maximum_working_hours: number;
  };
  fields: Record<string, FormField>;
}

export interface DistrictInfo {
  name: string;
  postal_codes: string[];
  contact: {
    address: string;
    phone: string;
    email: string;
    office_hours?: string;
  };
}

export interface FormConfiguration {
  forms: Record<string, FormConfig>;
  districts?: Record<string, DistrictInfo>;
  elterngeld_offices?: Record<string, DistrictInfo>;
  pdf_processing?: {
    default_font: string;
    default_font_size: number;
    encoding: string;
  };
  validation?: {
    required_fields_validation: boolean;
    data_encryption_check: boolean;
    plz_district_assignment: boolean;
    income_verification?: boolean;
    plz_office_assignment?: boolean;
  };
  submission?: {
    methods: string[];
    processing_time: string;
    timeline_recommendation: string;
  };
  processing?: {
    average_processing_time: string;
    application_deadline: string;
    retroactive_payment: boolean;
    maximum_work_hours: number;
    benefit_calculation?: {
      minimum_amount: number;
      maximum_amount: number;
      calculation_rate: number;
      base: string;
    };
    income_limits?: Record<string, number>;
  };
}

/**
 * Service class for loading and managing form configurations
 */
export class FormConfigLoader {
  private static instance: FormConfigLoader;
  private kitaConfig: FormConfiguration | null = null;
  private elterngeldConfig: FormConfiguration | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'src', 'config');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FormConfigLoader {
    if (!FormConfigLoader.instance) {
      FormConfigLoader.instance = new FormConfigLoader();
    }
    return FormConfigLoader.instance;
  }

  /**
   * Load Kita form configuration
   */
  public async loadKitaConfig(): Promise<FormConfiguration> {
    if (this.kitaConfig) {
      return this.kitaConfig;
    }

    try {
      const configFile = path.join(this.configPath, 'hamburg-forms.yaml');
      const fileContent = await fs.readFile(configFile, 'utf8');
      this.kitaConfig = yaml.load(fileContent) as FormConfiguration;
      
      console.log(`✅ Loaded Kita form configuration: ${Object.keys(this.kitaConfig.forms).length} forms`);
      return this.kitaConfig;
    } catch (error) {
      console.error('❌ Failed to load Kita form configuration:', error);
      throw new Error(`Failed to load Kita form configuration: ${error}`);
    }
  }

  /**
   * Load Elterngeld form configuration
   */
  public async loadElterngeldConfig(): Promise<FormConfiguration> {
    if (this.elterngeldConfig) {
      return this.elterngeldConfig;
    }

    try {
      const configFile = path.join(this.configPath, 'elterngeld-forms.yaml');
      const fileContent = await fs.readFile(configFile, 'utf8');
      this.elterngeldConfig = yaml.load(fileContent) as FormConfiguration;
      
      console.log(`✅ Loaded Elterngeld form configuration: ${Object.keys(this.elterngeldConfig.forms).length} forms`);
      return this.elterngeldConfig;
    } catch (error) {
      console.error('❌ Failed to load Elterngeld form configuration:', error);
      throw new Error(`Failed to load Elterngeld form configuration: ${error}`);
    }
  }

  /**
   * Get form configuration by application type and form ID
   */
  public async getFormConfig(applicationType: 'kita' | 'elterngeld', formId: string): Promise<FormConfig | null> {
    const config = applicationType === 'kita' 
      ? await this.loadKitaConfig() 
      : await this.loadElterngeldConfig();
    
    return config.forms[formId] || null;
  }

  /**
   * Get all available forms for an application type
   */
  public async getAvailableForms(applicationType: 'kita' | 'elterngeld'): Promise<Record<string, FormConfig>> {
    const config = applicationType === 'kita' 
      ? await this.loadKitaConfig() 
      : await this.loadElterngeldConfig();
    
    return config.forms;
  }

  /**
   * Determine appropriate form based on application data
   */
  public async determineForm(applicationType: 'kita' | 'elterngeld', applicationData: any): Promise<string> {
    const config = applicationType === 'kita' 
      ? await this.loadKitaConfig() 
      : await this.loadElterngeldConfig();

    if (applicationType === 'kita') {
      return this.determineKitaForm(applicationData, config);
    } else {
      return this.determineElterngeldForm(applicationData, config);
    }
  }

  /**
   * Determine appropriate Kita form based on care requirements
   */
  private determineKitaForm(applicationData: any, config: FormConfiguration): string {
    const careHours = applicationData.betreuungsumfang || 5;
    const childAge = this.calculateChildAge(applicationData.geburtsdatum);
    const hasSpecialNeeds = applicationData.integrationshilfe_benoetigt || false;
    const hasSiblings = applicationData.anzahl_kinder_im_haushalt > 1;

    // Special needs children require main application
    if (hasSpecialNeeds) {
      return 'kita_hauptantrag';
    }

    // 5-hour basic care for children over 1 year
    if (careHours <= 5 && childAge >= 1) {
      return 'kita_5_stunden';
    }

    // All other cases use main application
    return 'kita_hauptantrag';
  }

  /**
   * Determine appropriate Elterngeld form
   */
  private determineElterngeldForm(applicationData: any, config: FormConfiguration): string {
    const isSelfEmployed = applicationData.beschaeftigung_typ === 'Selbstständig';
    
    // Self-employed applicants need additional forms
    if (isSelfEmployed) {
      return 'elterngeld_hauptantrag'; // Will also require selbststaendige_erklaerung
    }

    return 'elterngeld_hauptantrag';
  }

  /**
   * Get district information based on postal code
   */
  public async getDistrictByPostalCode(postalCode: string, applicationType: 'kita' | 'elterngeld'): Promise<DistrictInfo | null> {
    const config = applicationType === 'kita' 
      ? await this.loadKitaConfig() 
      : await this.loadElterngeldConfig();
    
    const districts = applicationType === 'kita' 
      ? config.districts 
      : config.elterngeld_offices;

    if (!districts) return null;

    for (const [districtId, district] of Object.entries(districts)) {
      if (district.postal_codes.includes(postalCode)) {
        return district;
      }
    }

    return null;
  }

  /**
   * Validate form data against configuration
   */
  public async validateFormData(
    applicationType: 'kita' | 'elterngeld', 
    formId: string, 
    formData: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const formConfig = await this.getFormConfig(applicationType, formId);
    
    if (!formConfig) {
      return {
        isValid: false,
        errors: [`Form configuration not found: ${formId}`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    for (const [fieldName, fieldConfig] of Object.entries(formConfig.fields)) {
      if (fieldConfig.required) {
        const value = this.getNestedValue(formData, fieldConfig.data_source);
        
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`Required field missing: ${fieldName}`);
        }
      }

      // Validate format if specified
      if (fieldConfig.validation && formData[fieldName]) {
        const regex = new RegExp(fieldConfig.validation);
        if (!regex.test(formData[fieldName])) {
          errors.push(`Invalid format for field: ${fieldName}`);
        }
      }

      // Check encryption requirements
      if (fieldConfig.encryption_required && formData[fieldName]) {
        warnings.push(`Field requires encryption: ${fieldName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Calculate child age in years
   */
  private calculateChildAge(birthDate: string): number {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMs = now.getTime() - birth.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    
    return Math.floor(ageInYears);
  }

  /**
   * Get form metadata
   */
  public async getFormMetadata(applicationType: 'kita' | 'elterngeld', formId: string): Promise<{
    name: string;
    description: string;
    version: string;
    processingAuthority: string;
    estimatedProcessingTime: string;
  } | null> {
    const formConfig = await this.getFormConfig(applicationType, formId);
    const config = applicationType === 'kita' 
      ? await this.loadKitaConfig() 
      : await this.loadElterngeldConfig();

    if (!formConfig) return null;

    return {
      name: formConfig.name,
      description: formConfig.description,
      version: formConfig.version,
      processingAuthority: formConfig.processing_authority,
      estimatedProcessingTime: config.submission?.processing_time || config.processing?.average_processing_time || 'Unknown'
    };
  }

  /**
   * Clear cached configurations (useful for testing)
   */
  public clearCache(): void {
    this.kitaConfig = null;
    this.elterngeldConfig = null;
  }
}

// Export singleton instance
export const formConfigLoader = FormConfigLoader.getInstance(); 