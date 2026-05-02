/**
 * Compatibility Checker – shared types
 */

export type ParameterEntry = {
  A: string | number;
  B: string | number;
  Status: "OK" | "Different" | "Missing";
};

export type ComparisonResponse = Record<string, unknown> & {
  Summary?: string;
  raw?: string;
  DetectedComponents?: {
    component_a_type: string;
    component_b_type: string;
    component_a_confidence?: number;
    component_b_confidence?: number;
    pair_key: string;
    pair_supported: boolean;
    component_a_evidence?: string;
    component_b_evidence?: string;
  };
};

export type Status = "compatible" | "incompatible" | "missing";

export type ComparisonRow = {
  parameter: string;
  productA: string;
  productB: string;
  status: Status;
  reasoning: string;
};
