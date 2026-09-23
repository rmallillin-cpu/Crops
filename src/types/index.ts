export type CropCategoryFlag = "major" | "priority" | "emerging" | "others" | "discontinue";

export type Crop = {
  id: number;
  name: string;
};

export type CropCategory = {
  name: string;
  crops: Crop[];
};

export type CropEntry = {
  cropId: number;
  cropName: string;
  major: boolean;
  priority: boolean;
  emerging: boolean;
  others: boolean;
  discontinue: boolean;
  remarks: string;
};

export type AllowedUser = {
  email: string;
  name: string;
  lguSlug: string;
  role: "respondent" | "admin";
  status: "active" | "disabled" | "pending";
  passwordHash?: string;
};

export type SubmissionSummary = {
  lguSlug: string;
  lguName: string;
  respondentEmail: string;
  respondentName: string;
  submittedAt: string;
  totalCrops: number;
  major: number;
  priority: number;
  emerging: number;
  others: number;
  discontinue: number;
};
