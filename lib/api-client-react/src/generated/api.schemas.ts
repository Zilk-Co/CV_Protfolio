export interface HealthStatus {
  status: string;
}

export interface Portfolio {
  id: number;
  name: string;
  title: string;
  about: string;
  email: string;
  phone: string;
  location: string;
  theme: string;
  isAdmin: boolean;
  photoUrl?: string | null;
  status: string;
  employmentStatus?: string;
  additionalInfo: Record<string, string>;
  sectionOrder: string[];
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  blogs: Blog[];
  customSections: CustomSection[];
  adminPassword?: string;
  loginUsername?: string;
}

export interface UpdatePortfolioBody {
  name?: string;
  title?: string;
  about?: string;
  email?: string;
  phone?: string;
  location?: string;
  theme?: string;
  isAdmin?: boolean;
  photoUrl?: string | null;
  status?: string;
  additionalInfo?: Record<string, string>;
  sectionOrder?: string[];
}

export interface Education {
  id: number;
  portfolioId: number;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
  description?: string | null;
  accomplishments: string[];
  orderIndex: number;
}

export interface CreateEducationBody {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
  description?: string | null;
  accomplishments?: string[];
  orderIndex?: number;
}

export interface UpdateEducationBody {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string | null;
  grade?: string | null;
  description?: string | null;
  accomplishments?: string[];
  orderIndex?: number;
}

export interface Experience {
  id: number;
  portfolioId: number;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  accomplishments: string[];
  orderIndex: number;
}

export interface CreateExperienceBody {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  accomplishments?: string[];
  orderIndex?: number;
}

export interface UpdateExperienceBody {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string | null;
  description?: string | null;
  accomplishments?: string[];
  orderIndex?: number;
}

export interface Skill {
  id: number;
  portfolioId: number;
  name: string;
  category: string;
}

export interface CreateSkillBody {
  name: string;
  category: string;
}

export interface Certification {
  id: number;
  portfolioId: number;
  name: string;
  issuer: string;
  date?: string | null;
}

export interface CreateCertificationBody {
  name: string;
  issuer: string;
  date?: string | null;
}

export interface UpdateCertificationBody {
  name?: string;
  issuer?: string;
  date?: string | null;
}

export interface Blog {
  id: number;
  portfolioId: number;
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  orderIndex: number;
}

export interface CreateBlogBody {
  title: string;
  content: string;
  summary?: string;
  orderIndex?: number;
}

export interface UpdateBlogBody {
  title?: string;
  content?: string;
  summary?: string;
  orderIndex?: number;
}

export interface CustomSection {
  id: number;
  portfolioId: number;
  title: string;
  content: string;
  orderIndex: number;
  items: CustomSectionItem[];
}

export interface CreateCustomSectionBody {
  title: string;
  content?: string;
  orderIndex?: number;
}

export interface UpdateCustomSectionBody {
  title?: string;
  content?: string;
  orderIndex?: number;
}

export interface CustomSectionItem {
  id: number;
  portfolioId: number;
  customSectionId: number;
  title: string;
  subtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  accomplishments: string[];
  url?: string | null;
  orderIndex: number;
}

export interface CreateCustomSectionItemBody {
  customSectionId: number;
  title: string;
  subtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  accomplishments?: string[];
  url?: string | null;
  orderIndex?: number;
}

export interface UpdateCustomSectionItemBody {
  title?: string;
  subtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  accomplishments?: string[];
  url?: string | null;
  orderIndex?: number;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ExtractCvBody {
  text: string;
}

export interface ExtractedCvData {
  name?: string;
  title?: string;
  about?: string;
  email?: string;
  phone?: string;
  location?: string;
  education?: CreateEducationBody[];
  experience?: CreateExperienceBody[];
  skills?: CreateSkillBody[];
  certifications?: CreateCertificationBody[];
}

export interface OpenaiConversation {
  id: number;
  title: string;
}

export interface CreateOpenaiConversationBody {
  title: string;
}

export interface SendOpenaiMessageBody {
  content: string;
}
