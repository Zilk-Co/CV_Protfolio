import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import type {
  Blog,
  Certification,
  CreateBlogBody,
  CreateCertificationBody,
  CreateCustomSectionBody,
  CreateEducationBody,
  CreateExperienceBody,
  CreateOpenaiConversationBody,
  CreateSkillBody,
  CustomSection,
  Education,
  Experience,
  ExtractCvBody,
  ExtractedCvData,
  HealthStatus,
  OpenaiConversation,
  Portfolio,
  SendOpenaiMessageBody,
  Skill,
  UpdateBlogBody,
  UpdateCertificationBody,
  UpdateCustomSectionBody,
  UpdateEducationBody,
  UpdateExperienceBody,
  UpdatePortfolioBody,
  CreateCustomSectionItemBody,
  UpdateCustomSectionItemBody,
  CustomSectionItem,
  ChangePasswordBody,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ── Health ──────────────────────────────────────────────────────────────────

export const getHealthCheckUrl = () => `/api/healthz`;

export const healthCheck = async (options?: RequestInit): Promise<HealthStatus> =>
  customFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });

export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;

export const getHealthCheckQueryOptions = <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>; request?: SecondParameter<typeof customFetch> }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof healthCheck>>> = ({ signal }) => healthCheck({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & { queryKey: QueryKey };
};

export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;

export function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  query.queryKey = queryOptions.queryKey;
  return query;
}

// ── Portfolio ────────────────────────────────────────────────────────────────

export const getGetPortfolioQueryKey = () => [`/api/portfolio`] as const;

export const getPortfolio = async (options?: RequestInit): Promise<Portfolio> =>
  customFetch<Portfolio>(`/api/portfolio`, { ...options, method: "GET" });

export const getGetPortfolioQueryOptions = <TData = Awaited<ReturnType<typeof getPortfolio>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getPortfolio>>, TError, TData>; request?: SecondParameter<typeof customFetch> }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetPortfolioQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getPortfolio>>> = ({ signal }) => getPortfolio({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getPortfolio>>, TError, TData> & { queryKey: QueryKey };
};

export function useGetPortfolio<TData = Awaited<ReturnType<typeof getPortfolio>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getPortfolio>>, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetPortfolioQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  query.queryKey = queryOptions.queryKey;
  return query;
}

export const updatePortfolio = async (body: BodyType<UpdatePortfolioBody>, options?: RequestInit): Promise<Portfolio> =>
  customFetch<Portfolio>(`/api/portfolio`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdatePortfolio = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePortfolio>>, TError, { data: BodyType<UpdatePortfolioBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updatePortfolio>>, TError, { data: BodyType<UpdatePortfolioBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updatePortfolio>>, { data: BodyType<UpdatePortfolioBody> }> = ({ data }) => updatePortfolio(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updatePortfolio>>, TError, { data: BodyType<UpdatePortfolioBody> }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Education ────────────────────────────────────────────────────────────────

export const addEducation = async (body: BodyType<CreateEducationBody>, options?: RequestInit): Promise<Education> =>
  customFetch<Education>(`/api/portfolio/education`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddEducation = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addEducation>>, TError, { data: BodyType<CreateEducationBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addEducation>>, TError, { data: BodyType<CreateEducationBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addEducation>>, { data: BodyType<CreateEducationBody> }> = ({ data }) => addEducation(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addEducation>>, TError, { data: BodyType<CreateEducationBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateEducation = async (id: number, body: BodyType<UpdateEducationBody>, options?: RequestInit): Promise<Education> =>
  customFetch<Education>(`/api/portfolio/education/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateEducation = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEducation>>, TError, { id: number; data: BodyType<UpdateEducationBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateEducation>>, TError, { id: number; data: BodyType<UpdateEducationBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateEducation>>, { id: number; data: BodyType<UpdateEducationBody> }> = ({ id, data }) => updateEducation(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateEducation>>, TError, { id: number; data: BodyType<UpdateEducationBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteEducation = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/education/${id}`, { ...options, method: "DELETE" });

export const useDeleteEducation = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEducation>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteEducation>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteEducation>>, { id: string }> = ({ id }) => deleteEducation(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteEducation>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Experience ───────────────────────────────────────────────────────────────

export const addExperience = async (body: BodyType<CreateExperienceBody>, options?: RequestInit): Promise<Experience> =>
  customFetch<Experience>(`/api/portfolio/experience`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddExperience = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addExperience>>, TError, { data: BodyType<CreateExperienceBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addExperience>>, TError, { data: BodyType<CreateExperienceBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addExperience>>, { data: BodyType<CreateExperienceBody> }> = ({ data }) => addExperience(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addExperience>>, TError, { data: BodyType<CreateExperienceBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateExperience = async (id: number, body: BodyType<UpdateExperienceBody>, options?: RequestInit): Promise<Experience> =>
  customFetch<Experience>(`/api/portfolio/experience/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateExperience = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateExperience>>, TError, { id: number; data: BodyType<UpdateExperienceBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateExperience>>, TError, { id: number; data: BodyType<UpdateExperienceBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateExperience>>, { id: number; data: BodyType<UpdateExperienceBody> }> = ({ id, data }) => updateExperience(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateExperience>>, TError, { id: number; data: BodyType<UpdateExperienceBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteExperience = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/experience/${id}`, { ...options, method: "DELETE" });

export const useDeleteExperience = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteExperience>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteExperience>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteExperience>>, { id: string }> = ({ id }) => deleteExperience(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteExperience>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Skills ───────────────────────────────────────────────────────────────────

export const addSkill = async (body: BodyType<CreateSkillBody>, options?: RequestInit): Promise<Skill> =>
  customFetch<Skill>(`/api/portfolio/skills`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddSkill = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addSkill>>, TError, { data: BodyType<CreateSkillBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addSkill>>, TError, { data: BodyType<CreateSkillBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addSkill>>, { data: BodyType<CreateSkillBody> }> = ({ data }) => addSkill(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addSkill>>, TError, { data: BodyType<CreateSkillBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteSkill = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/skills/${id}`, { ...options, method: "DELETE" });

export const useDeleteSkill = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSkill>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteSkill>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteSkill>>, { id: string }> = ({ id }) => deleteSkill(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteSkill>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Certifications ────────────────────────────────────────────────────────────

export const addCertification = async (body: BodyType<CreateCertificationBody>, options?: RequestInit): Promise<Certification> =>
  customFetch<Certification>(`/api/portfolio/certifications`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddCertification = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addCertification>>, TError, { data: BodyType<CreateCertificationBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addCertification>>, TError, { data: BodyType<CreateCertificationBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addCertification>>, { data: BodyType<CreateCertificationBody> }> = ({ data }) => addCertification(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addCertification>>, TError, { data: BodyType<CreateCertificationBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateCertification = async (id: number, body: BodyType<UpdateCertificationBody>, options?: RequestInit): Promise<Certification> =>
  customFetch<Certification>(`/api/portfolio/certifications/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateCertification = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCertification>>, TError, { id: number; data: BodyType<UpdateCertificationBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateCertification>>, TError, { id: number; data: BodyType<UpdateCertificationBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCertification>>, { id: number; data: BodyType<UpdateCertificationBody> }> = ({ id, data }) => updateCertification(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateCertification>>, TError, { id: number; data: BodyType<UpdateCertificationBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteCertification = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/certifications/${id}`, { ...options, method: "DELETE" });

export const useDeleteCertification = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCertification>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteCertification>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCertification>>, { id: string }> = ({ id }) => deleteCertification(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteCertification>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Blogs ─────────────────────────────────────────────────────────────────────

export const addBlog = async (body: BodyType<CreateBlogBody>, options?: RequestInit): Promise<Blog> =>
  customFetch<Blog>(`/api/portfolio/blogs`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddBlog = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addBlog>>, TError, { data: BodyType<CreateBlogBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addBlog>>, TError, { data: BodyType<CreateBlogBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addBlog>>, { data: BodyType<CreateBlogBody> }> = ({ data }) => addBlog(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addBlog>>, TError, { data: BodyType<CreateBlogBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateBlog = async (id: number, body: BodyType<UpdateBlogBody>, options?: RequestInit): Promise<Blog> =>
  customFetch<Blog>(`/api/portfolio/blogs/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateBlog = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBlog>>, TError, { id: number; data: BodyType<UpdateBlogBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateBlog>>, TError, { id: number; data: BodyType<UpdateBlogBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateBlog>>, { id: number; data: BodyType<UpdateBlogBody> }> = ({ id, data }) => updateBlog(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateBlog>>, TError, { id: number; data: BodyType<UpdateBlogBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteBlog = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/blogs/${id}`, { ...options, method: "DELETE" });

export const useDeleteBlog = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBlog>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteBlog>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteBlog>>, { id: string }> = ({ id }) => deleteBlog(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteBlog>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Custom Sections ───────────────────────────────────────────────────────────

export const addCustomSection = async (body: BodyType<CreateCustomSectionBody>, options?: RequestInit): Promise<CustomSection> =>
  customFetch<CustomSection>(`/api/portfolio/custom-sections`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddCustomSection = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addCustomSection>>, TError, { data: BodyType<CreateCustomSectionBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addCustomSection>>, TError, { data: BodyType<CreateCustomSectionBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addCustomSection>>, { data: BodyType<CreateCustomSectionBody> }> = ({ data }) => addCustomSection(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addCustomSection>>, TError, { data: BodyType<CreateCustomSectionBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateCustomSection = async (id: number, body: BodyType<UpdateCustomSectionBody>, options?: RequestInit): Promise<CustomSection> =>
  customFetch<CustomSection>(`/api/portfolio/custom-sections/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateCustomSection = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomSection>>, TError, { id: number; data: BodyType<UpdateCustomSectionBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateCustomSection>>, TError, { id: number; data: BodyType<UpdateCustomSectionBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCustomSection>>, { id: number; data: BodyType<UpdateCustomSectionBody> }> = ({ id, data }) => updateCustomSection(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateCustomSection>>, TError, { id: number; data: BodyType<UpdateCustomSectionBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteCustomSection = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/custom-sections/${id}`, { ...options, method: "DELETE" });

export const useDeleteCustomSection = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomSection>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteCustomSection>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCustomSection>>, { id: string }> = ({ id }) => deleteCustomSection(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteCustomSection>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── CV Extraction ─────────────────────────────────────────────────────────────

export const extractCv = async (body: BodyType<ExtractCvBody>, options?: RequestInit): Promise<ExtractedCvData> =>
  customFetch<ExtractedCvData>(`/api/cv/extract`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useExtractCv = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof extractCv>>, TError, { data: BodyType<ExtractCvBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof extractCv>>, TError, { data: BodyType<ExtractCvBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof extractCv>>, { data: BodyType<ExtractCvBody> }> = ({ data }) => extractCv(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof extractCv>>, TError, { data: BodyType<ExtractCvBody> }, TContext>({ mutationFn, ...mutationOptions });
};

// ── OpenAI Conversations ──────────────────────────────────────────────────────

export const createOpenaiConversation = async (body: BodyType<CreateOpenaiConversationBody>, options?: RequestInit): Promise<OpenaiConversation> =>
  customFetch<OpenaiConversation>(`/api/openai/conversations`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useCreateOpenaiConversation = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, { data: BodyType<CreateOpenaiConversationBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, { data: BodyType<CreateOpenaiConversationBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof createOpenaiConversation>>, { data: BodyType<CreateOpenaiConversationBody> }> = ({ data }) => createOpenaiConversation(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof createOpenaiConversation>>, TError, { data: BodyType<CreateOpenaiConversationBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const sendOpenaiMessage = async (id: number, body: BodyType<SendOpenaiMessageBody>, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/openai/conversations/${id}/messages`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

// ── Custom Section Items ──────────────────────────────────────────────────────

export const addCustomSectionItem = async (body: BodyType<CreateCustomSectionItemBody>, options?: RequestInit): Promise<CustomSectionItem> =>
  customFetch<CustomSectionItem>(`/api/portfolio/custom-section-items`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useAddCustomSectionItem = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof addCustomSectionItem>>, TError, { data: BodyType<CreateCustomSectionItemBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof addCustomSectionItem>>, TError, { data: BodyType<CreateCustomSectionItemBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof addCustomSectionItem>>, { data: BodyType<CreateCustomSectionItemBody> }> = ({ data }) => addCustomSectionItem(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof addCustomSectionItem>>, TError, { data: BodyType<CreateCustomSectionItemBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const updateCustomSectionItem = async (id: number, body: BodyType<UpdateCustomSectionItemBody>, options?: RequestInit): Promise<CustomSectionItem> =>
  customFetch<CustomSectionItem>(`/api/portfolio/custom-section-items/${id}`, { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useUpdateCustomSectionItem = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomSectionItem>>, TError, { id: number; data: BodyType<UpdateCustomSectionItemBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateCustomSectionItem>>, TError, { id: number; data: BodyType<UpdateCustomSectionItemBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCustomSectionItem>>, { id: number; data: BodyType<UpdateCustomSectionItemBody> }> = ({ id, data }) => updateCustomSectionItem(id, data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof updateCustomSectionItem>>, TError, { id: number; data: BodyType<UpdateCustomSectionItemBody> }, TContext>({ mutationFn, ...mutationOptions });
};

export const deleteCustomSectionItem = async (id: string | number, options?: RequestInit): Promise<void> =>
  customFetch<void>(`/api/portfolio/custom-section-items/${id}`, { ...options, method: "DELETE" });

export const useDeleteCustomSectionItem = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomSectionItem>>, TError, { id: string }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteCustomSectionItem>>, TError, { id: string }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCustomSectionItem>>, { id: string }> = ({ id }) => deleteCustomSectionItem(id, requestOptions);
  return useMutation<Awaited<ReturnType<typeof deleteCustomSectionItem>>, TError, { id: string }, TContext>({ mutationFn, ...mutationOptions });
};

// ── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (body: BodyType<ChangePasswordBody>, options?: RequestInit): Promise<{ success: boolean }> =>
  customFetch<{ success: boolean }>(`/api/portfolio/change-password`, { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body) });

export const useChangePassword = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof changePassword>>, TError, { data: BodyType<ChangePasswordBody> }, TContext>; request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof changePassword>>, TError, { data: BodyType<ChangePasswordBody> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof changePassword>>, { data: BodyType<ChangePasswordBody> }> = ({ data }) => changePassword(data, requestOptions);
  return useMutation<Awaited<ReturnType<typeof changePassword>>, TError, { data: BodyType<ChangePasswordBody> }, TContext>({ mutationFn, ...mutationOptions });
};
