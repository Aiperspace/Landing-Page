import type { UserTemplateRecord } from './userTemplates';

export interface TemplateDef {
  id: string;
  label: string;
  /** Section titles shown in the "Document structure" box on the create page */
  outline: string[];
  /** Set for user-uploaded templates: API `template_type` / category */
  baseTypeId?: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'test_procedure',
    label: 'Test Procedure',
    outline: [
      'Purpose',
      'Scope & Applicability',
      'Prerequisites',
      'Safety Considerations',
      'Procedure Steps',
      'Success Criteria',
      'Data Recording',
    ],
  },
  {
    id: 'test_log',
    label: 'Test Log',
    outline: [
      'Test Identification',
      'Test Configuration',
      'Execution Log',
      'Deviations & Non-Conformances',
      'Sign-Off & Approval',
    ],
  },
  {
    id: 'subsystem_verification',
    label: 'Subsystem Verification Summary',
    outline: [
      'Subsystem Identification',
      'Verification Cross-Reference Matrix',
      'Test Campaign Summary',
      'Open Items & Waivers',
      'Compliance Statement',
      'Annexes & Supporting Evidence',
    ],
  },
  {
    id: 'test_report',
    label: 'Test Report (ECSS DRD Compliant)',
    outline: [
      'Introduction',
      'Applicable and Reference Documents',
      'Definitions and Abbreviations',
      'Test Results',
      'Anomalies',
      'Conclusions',
    ],
  },
  {
    id: 'icd',
    label: 'Interface Control Document (ICD)',
    outline: [
      'Scope',
      'Applicable Documents',
      'Reference Documents',
      'Definitions, Acronyms, Abbreviations',
      'System Overview',
      'Interface Overview',
      'Mechanical / Electrical / Data interfaces',
      'Environmental & verification',
    ],
  },
];

export function getTemplate(id: string | null, userTemplates: UserTemplateRecord[] = []): TemplateDef | undefined {
  if (!id) return undefined;
  const builtin = TEMPLATES.find((t) => t.id === id);
  if (builtin) return builtin;
  const custom = userTemplates.find((t) => t.id === id);
  if (!custom) return undefined;
  const base = TEMPLATES.find((t) => t.id === custom.baseTypeId);
  return {
    id: custom.id,
    label: custom.name,
    outline: custom.outline.length ? custom.outline : base?.outline ?? ['Purpose'],
    baseTypeId: custom.baseTypeId,
  };
}
