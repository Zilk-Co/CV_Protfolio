import * as z from "zod";

export const UpdatePortfolioBody = z.object({
  name: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  about: z.string().max(10000).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  theme: z.string().max(50).optional(),
  isAdmin: z.boolean().optional(),
  photoUrl: z.string().max(2000).nullable().optional(),
  status: z.string().max(50).optional(),
  employmentStatus: z.string().max(50).optional(),
  additionalInfo: z.record(z.string().max(100), z.string().max(1000)).optional(),
  sectionOrder: z.array(z.string().max(100)).max(50).optional(),
  features: z.object({
    cvImportExport: z.boolean().optional(),
    aiChat: z.boolean().optional(),
    themeSelector: z.boolean().optional(),
    blogPage: z.boolean().optional(),
    exploreAccess: z.boolean().optional(),
    aiMatchAccess: z.boolean().optional(),
  }).optional(),
});

export const ChangeLoginUsernameBody = z.object({
  currentPassword: z.string().min(1).max(128),
  newUsername: z.string().min(3).max(100).regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric (letters, numbers, underscores)"),
});

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(4).max(128),
  confirmPassword: z.string().min(4).max(128),
});

export const AddEducationBody = z.object({
  institution: z.string().max(200),
  degree: z.string().max(200),
  field: z.string().max(200),
  startDate: z.string().max(50),
  endDate: z.string().max(50).nullable().optional(),
  grade: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateEducationBody = z.object({
  institution: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  startDate: z.string().max(50).optional(),
  endDate: z.string().max(50).nullable().optional(),
  grade: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateEducationParams = z.object({ id: z.coerce.number() });
export const DeleteEducationParams = z.object({ id: z.coerce.number() });

export const AddExperienceBody = z.object({
  company: z.string().max(200),
  role: z.string().max(200),
  startDate: z.string().max(50),
  endDate: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateExperienceBody = z.object({
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  startDate: z.string().max(50).optional(),
  endDate: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateExperienceParams = z.object({ id: z.coerce.number() });
export const DeleteExperienceParams = z.object({ id: z.coerce.number() });

export const AddSkillBody = z.object({
  name: z.string().max(100),
  category: z.string().max(100),
});

export const DeleteSkillParams = z.object({ id: z.coerce.number() });
export const UpdateSkillBody = z.object({ name: z.string().max(100).optional(), category: z.string().max(100).optional() });
export const UpdateSkillParams = z.object({ id: z.coerce.number() });

export const AddCertificationBody = z.object({
  name: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().max(50).nullable().optional(),
});

export const UpdateCertificationBody = z.object({
  name: z.string().max(200).optional(),
  issuer: z.string().max(200).optional(),
  date: z.string().max(50).nullable().optional(),
});

export const UpdateCertificationParams = z.object({ id: z.coerce.number() });
export const DeleteCertificationParams = z.object({ id: z.coerce.number() });

export const AddBlogBody = z.object({
  title: z.string().max(200),
  content: z.string().max(50000),
  summary: z.string().max(500).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateBlogBody = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  summary: z.string().max(500).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateBlogParams = z.object({ id: z.coerce.number() });
export const DeleteBlogParams = z.object({ id: z.coerce.number() });

export const AddCustomSectionBody = z.object({
  title: z.string().max(200),
  content: z.string().max(5000).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateCustomSectionBody = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(5000).optional(),
  orderIndex: z.number().optional(),
});

export const UpdateCustomSectionParams = z.object({ id: z.coerce.number() });
export const DeleteCustomSectionParams = z.object({ id: z.coerce.number() });

export const AddCustomSectionItemBody = z.object({
  customSectionId: z.number(),
  title: z.string().max(200),
  subtitle: z.string().max(200).nullable().optional(),
  startDate: z.string().max(50).nullable().optional(),
  endDate: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  url: z.string().max(2000).nullable().optional(),
  orderIndex: z.number().optional(),
});

export const UpdateCustomSectionItemBody = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).nullable().optional(),
  startDate: z.string().max(50).nullable().optional(),
  endDate: z.string().max(50).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  accomplishments: z.array(z.string().max(500)).max(20).optional(),
  url: z.string().max(2000).nullable().optional(),
  orderIndex: z.number().optional(),
});

export const UpdateCustomSectionItemParams = z.object({ id: z.coerce.number() });
export const DeleteCustomSectionItemParams = z.object({ id: z.coerce.number() });

export const ExtractCvBody = z.object({
  text: z.string().max(20000),
});

export const CreateOpenaiConversationBody = z.object({
  title: z.string().max(200),
});

export const SendOpenaiMessageBody = z.object({
  content: z.string().max(10000),
});

export const SendOpenaiMessageParams = z.object({ id: z.coerce.number() });
