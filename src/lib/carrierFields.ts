/**
 * Custom fields configuration for carriers that require additional information
 * when registering a tracking number.
 *
 * The 17Track API supports these optional fields:
 * - destination_postal_code: Destination postal/ZIP code
 * - origin_postal_code: Origin postal/ZIP code
 * - ship_date: Shipping date (format: YYYYMMDD)
 * - destination_country: Destination country ISO code (2 letters)
 * - origin_country: Origin country ISO code (2 letters)
 */

export type CustomFieldType = 'text' | 'date' | 'country';

export interface CustomFieldDefinition {
  /** API field name as expected by 17Track */
  name: string;
  /** Human-readable label for the input */
  label: string;
  /** Placeholder text with example */
  placeholder: string;
  /** Input type for rendering */
  type: CustomFieldType;
  /** Whether this field is required for the carrier */
  required: boolean;
  /** Help text shown below the input */
  helpText?: string;
}

export interface CarrierFieldsConfig {
  /** Carrier key from carriers.json */
  carrierKey: number;
  /** Carrier name (for reference) */
  carrierName: string;
  /** List of custom fields for this carrier */
  fields: CustomFieldDefinition[];
}

/**
 * All available custom fields that can be used by carriers.
 * This serves as a template for field definitions.
 */
export const CUSTOM_FIELD_TEMPLATES: Record<string, Omit<CustomFieldDefinition, 'required'>> = {
  destination_postal_code: {
    name: 'destination_postal_code',
    label: 'Destination Postal Code',
    placeholder: 'e.g., 2000',
    type: 'text',
    helpText: 'The postal/ZIP code where the package is being delivered',
  },
  origin_postal_code: {
    name: 'origin_postal_code',
    label: 'Origin Postal Code',
    placeholder: 'e.g., 3000',
    type: 'text',
    helpText: 'The postal/ZIP code where the package was shipped from',
  },
  ship_date: {
    name: 'ship_date',
    label: 'Ship Date',
    placeholder: 'YYYYMMDD',
    type: 'date',
    helpText: 'The date when the package was shipped',
  },
  destination_country: {
    name: 'destination_country',
    label: 'Destination Country',
    placeholder: 'e.g., US',
    type: 'country',
    helpText: 'ISO 2-letter country code for destination',
  },
  origin_country: {
    name: 'origin_country',
    label: 'Origin Country',
    placeholder: 'e.g., CN',
    type: 'country',
    helpText: 'ISO 2-letter country code for origin',
  },
};

/**
 * Carrier-specific field requirements.
 * Add carriers here when they require custom fields for tracking.
 *
 * To find a carrier's key, search in src/lib/carriers.json or use:
 * node -e "const c = require('./src/lib/carriers.json'); console.log(c.find(x => x._name.includes('CarrierName')))"
 */
export const CARRIER_CUSTOM_FIELDS: CarrierFieldsConfig[] = [
  {
    carrierKey: 100623,
    carrierName: 'Allied Express Transport',
    fields: [
      { ...CUSTOM_FIELD_TEMPLATES.destination_postal_code, required: true },
    ],
  },
  // Add more carriers as needed. Examples:
  // {
  //   carrierKey: 12345,
  //   carrierName: 'Example Carrier',
  //   fields: [
  //     { ...CUSTOM_FIELD_TEMPLATES.destination_postal_code, required: true },
  //     { ...CUSTOM_FIELD_TEMPLATES.ship_date, required: false },
  //   ],
  // },
];

/**
 * Map of carrier keys to their field configurations for quick lookup.
 */
export const CARRIER_FIELDS_MAP: Map<number, CustomFieldDefinition[]> = new Map(
  CARRIER_CUSTOM_FIELDS.map(config => [config.carrierKey, config.fields])
);

/**
 * Get custom fields for a carrier.
 * @param carrierKey The carrier's key from carriers.json
 * @returns Array of custom field definitions, or empty array if no custom fields needed
 */
export function getCarrierCustomFields(carrierKey: number): CustomFieldDefinition[] {
  return CARRIER_FIELDS_MAP.get(carrierKey) || [];
}

/**
 * Check if a carrier requires any custom fields.
 * @param carrierKey The carrier's key from carriers.json
 * @returns true if the carrier has required custom fields
 */
export function carrierHasCustomFields(carrierKey: number): boolean {
  const fields = CARRIER_FIELDS_MAP.get(carrierKey);
  return fields !== undefined && fields.length > 0;
}

/**
 * Get only the required fields for a carrier.
 * @param carrierKey The carrier's key from carriers.json
 * @returns Array of required custom field definitions
 */
export function getRequiredCarrierFields(carrierKey: number): CustomFieldDefinition[] {
  return getCarrierCustomFields(carrierKey).filter(field => field.required);
}
