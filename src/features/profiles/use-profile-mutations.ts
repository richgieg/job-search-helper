import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getAppApiClient } from '../../api'
import type {
  DuplicateProfileInput,
  ReorderAdditionalExperienceBulletsInput,
  ReorderEducationBulletsInput,
  ReorderExperienceBulletsInput,
  ReorderProfileEntitiesInput,
  ReorderProjectBulletsInput,
  ReorderResumeSectionsInput,
  SetDocumentHeaderTemplateInput,
  SetResumeSectionEnabledInput,
  SetResumeSectionLabelInput,
  UpdateAchievementInput,
  UpdateAdditionalExperienceBulletInput,
  UpdateAdditionalExperienceEntryInput,
  UpdateCertificationInput,
  UpdateEducationBulletInput,
  UpdateEducationEntryInput,
  UpdateExperienceBulletInput,
  UpdateExperienceEntryInput,
  UpdateProfileInput,
  UpdateProfileLinkInput,
  UpdateProjectBulletInput,
  UpdateProjectInput,
  UpdateReferenceInput,
  UpdateSkillCategoryInput,
  UpdateSkillInput,
} from '../../domain/profile-data'
import { queryKeys } from '../../queries/query-keys'
import { useSelectJob, useSelectProfile, useSelectedProfileId } from '../../store/app-ui-store'
import type { Id } from '../../types/state'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown profile mutation error.')

export const useProfileMutations = () => {
  const queryClient = useQueryClient()
  const selectedProfileId = useSelectedProfileId()
  const selectJob = useSelectJob()
  const selectProfile = useSelectProfile()

  const invalidateProfileQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesListRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profilesDocumentRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsDetailRoot() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
    ])
  }

  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => getAppApiClient().updateProfile(input),
    onSuccess: invalidateProfileQueries,
  })

  const setDocumentHeaderTemplateMutation = useMutation({
    mutationFn: (input: SetDocumentHeaderTemplateInput) => getAppApiClient().setDocumentHeaderTemplate(input),
    onSuccess: invalidateProfileQueries,
  })

  const setResumeSectionEnabledMutation = useMutation({
    mutationFn: (input: SetResumeSectionEnabledInput) => getAppApiClient().setResumeSectionEnabled(input),
    onSuccess: invalidateProfileQueries,
  })

  const setResumeSectionLabelMutation = useMutation({
    mutationFn: (input: SetResumeSectionLabelInput) => getAppApiClient().setResumeSectionLabel(input),
    onSuccess: invalidateProfileQueries,
  })

  const reorderResumeSectionsMutation = useMutation({
    mutationFn: (input: ReorderResumeSectionsInput) => getAppApiClient().reorderResumeSections(input),
    onSuccess: invalidateProfileQueries,
  })

  const createProfileLinkMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createProfileLink(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateProfileLinkMutation = useMutation({
    mutationFn: (input: UpdateProfileLinkInput) => getAppApiClient().updateProfileLink(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteProfileLinkMutation = useMutation({
    mutationFn: (profileLinkId: Id) => getAppApiClient().deleteProfileLink(profileLinkId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderProfileLinksMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderProfileLinks(input),
    onSuccess: invalidateProfileQueries,
  })

  const createSkillCategoryMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createSkillCategory(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateSkillCategoryMutation = useMutation({
    mutationFn: (input: UpdateSkillCategoryInput) => getAppApiClient().updateSkillCategory(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteSkillCategoryMutation = useMutation({
    mutationFn: (skillCategoryId: Id) => getAppApiClient().deleteSkillCategory(skillCategoryId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderSkillCategoriesMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderSkillCategories(input),
    onSuccess: invalidateProfileQueries,
  })

  const createSkillMutation = useMutation({
    mutationFn: (skillCategoryId: Id) => getAppApiClient().createSkill(skillCategoryId),
    onSuccess: invalidateProfileQueries,
  })

  const updateSkillMutation = useMutation({
    mutationFn: (input: UpdateSkillInput) => getAppApiClient().updateSkill(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteSkillMutation = useMutation({
    mutationFn: (skillId: Id) => getAppApiClient().deleteSkill(skillId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderSkillsMutation = useMutation({
    mutationFn: ({ skillCategoryId, orderedIds }: { skillCategoryId: Id; orderedIds: Id[] }) => getAppApiClient().reorderSkills(skillCategoryId, orderedIds),
    onSuccess: invalidateProfileQueries,
  })

  const createAchievementMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createAchievement(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateAchievementMutation = useMutation({
    mutationFn: (input: UpdateAchievementInput) => getAppApiClient().updateAchievement(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteAchievementMutation = useMutation({
    mutationFn: (achievementId: Id) => getAppApiClient().deleteAchievement(achievementId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderAchievementsMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderAchievements(input),
    onSuccess: invalidateProfileQueries,
  })

  const createExperienceEntryMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createExperienceEntry(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateExperienceEntryMutation = useMutation({
    mutationFn: (input: UpdateExperienceEntryInput) => getAppApiClient().updateExperienceEntry(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteExperienceEntryMutation = useMutation({
    mutationFn: (experienceEntryId: Id) => getAppApiClient().deleteExperienceEntry(experienceEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderExperienceEntriesMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderExperienceEntries(input),
    onSuccess: invalidateProfileQueries,
  })

  const createExperienceBulletMutation = useMutation({
    mutationFn: (experienceEntryId: Id) => getAppApiClient().createExperienceBullet(experienceEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const updateExperienceBulletMutation = useMutation({
    mutationFn: (input: UpdateExperienceBulletInput) => getAppApiClient().updateExperienceBullet(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteExperienceBulletMutation = useMutation({
    mutationFn: (experienceBulletId: Id) => getAppApiClient().deleteExperienceBullet(experienceBulletId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderExperienceBulletsMutation = useMutation({
    mutationFn: (input: ReorderExperienceBulletsInput) => getAppApiClient().reorderExperienceBullets(input),
    onSuccess: invalidateProfileQueries,
  })

  const createEducationEntryMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createEducationEntry(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateEducationEntryMutation = useMutation({
    mutationFn: (input: UpdateEducationEntryInput) => getAppApiClient().updateEducationEntry(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteEducationEntryMutation = useMutation({
    mutationFn: (educationEntryId: Id) => getAppApiClient().deleteEducationEntry(educationEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderEducationEntriesMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderEducationEntries(input),
    onSuccess: invalidateProfileQueries,
  })

  const createEducationBulletMutation = useMutation({
    mutationFn: (educationEntryId: Id) => getAppApiClient().createEducationBullet(educationEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const updateEducationBulletMutation = useMutation({
    mutationFn: (input: UpdateEducationBulletInput) => getAppApiClient().updateEducationBullet(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteEducationBulletMutation = useMutation({
    mutationFn: (educationBulletId: Id) => getAppApiClient().deleteEducationBullet(educationBulletId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderEducationBulletsMutation = useMutation({
    mutationFn: (input: ReorderEducationBulletsInput) => getAppApiClient().reorderEducationBullets(input),
    onSuccess: invalidateProfileQueries,
  })

  const createProjectMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createProject(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateProjectMutation = useMutation({
    mutationFn: (input: UpdateProjectInput) => getAppApiClient().updateProject(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: Id) => getAppApiClient().deleteProject(projectId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderProjectsMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderProjects(input),
    onSuccess: invalidateProfileQueries,
  })

  const createProjectBulletMutation = useMutation({
    mutationFn: (projectId: Id) => getAppApiClient().createProjectBullet(projectId),
    onSuccess: invalidateProfileQueries,
  })

  const updateProjectBulletMutation = useMutation({
    mutationFn: (input: UpdateProjectBulletInput) => getAppApiClient().updateProjectBullet(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteProjectBulletMutation = useMutation({
    mutationFn: (projectBulletId: Id) => getAppApiClient().deleteProjectBullet(projectBulletId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderProjectBulletsMutation = useMutation({
    mutationFn: (input: ReorderProjectBulletsInput) => getAppApiClient().reorderProjectBullets(input),
    onSuccess: invalidateProfileQueries,
  })

  const createAdditionalExperienceEntryMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createAdditionalExperienceEntry(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateAdditionalExperienceEntryMutation = useMutation({
    mutationFn: (input: UpdateAdditionalExperienceEntryInput) => getAppApiClient().updateAdditionalExperienceEntry(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteAdditionalExperienceEntryMutation = useMutation({
    mutationFn: (additionalExperienceEntryId: Id) => getAppApiClient().deleteAdditionalExperienceEntry(additionalExperienceEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderAdditionalExperienceEntriesMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderAdditionalExperienceEntries(input),
    onSuccess: invalidateProfileQueries,
  })

  const createAdditionalExperienceBulletMutation = useMutation({
    mutationFn: (additionalExperienceEntryId: Id) => getAppApiClient().createAdditionalExperienceBullet(additionalExperienceEntryId),
    onSuccess: invalidateProfileQueries,
  })

  const updateAdditionalExperienceBulletMutation = useMutation({
    mutationFn: (input: UpdateAdditionalExperienceBulletInput) => getAppApiClient().updateAdditionalExperienceBullet(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteAdditionalExperienceBulletMutation = useMutation({
    mutationFn: (additionalExperienceBulletId: Id) => getAppApiClient().deleteAdditionalExperienceBullet(additionalExperienceBulletId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderAdditionalExperienceBulletsMutation = useMutation({
    mutationFn: (input: ReorderAdditionalExperienceBulletsInput) => getAppApiClient().reorderAdditionalExperienceBullets(input),
    onSuccess: invalidateProfileQueries,
  })

  const createCertificationMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createCertification(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateCertificationMutation = useMutation({
    mutationFn: (input: UpdateCertificationInput) => getAppApiClient().updateCertification(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteCertificationMutation = useMutation({
    mutationFn: (certificationId: Id) => getAppApiClient().deleteCertification(certificationId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderCertificationsMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderCertifications(input),
    onSuccess: invalidateProfileQueries,
  })

  const createReferenceMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().createReference(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const updateReferenceMutation = useMutation({
    mutationFn: (input: UpdateReferenceInput) => getAppApiClient().updateReference(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteReferenceMutation = useMutation({
    mutationFn: (referenceId: Id) => getAppApiClient().deleteReference(referenceId),
    onSuccess: invalidateProfileQueries,
  })

  const reorderReferencesMutation = useMutation({
    mutationFn: (input: ReorderProfileEntitiesInput) => getAppApiClient().reorderReferences(input),
    onSuccess: invalidateProfileQueries,
  })

  const duplicateProfileMutation = useMutation({
    mutationFn: (input: DuplicateProfileInput) => getAppApiClient().duplicateProfile(input),
    onSuccess: invalidateProfileQueries,
  })

  const deleteProfileMutation = useMutation({
    mutationFn: (profileId: Id) => getAppApiClient().deleteProfile(profileId),
    onSuccess: invalidateProfileQueries,
  })

  const mutations = [
    updateProfileMutation,
    setDocumentHeaderTemplateMutation,
    setResumeSectionEnabledMutation,
    setResumeSectionLabelMutation,
    reorderResumeSectionsMutation,
    createProfileLinkMutation,
    updateProfileLinkMutation,
    deleteProfileLinkMutation,
    reorderProfileLinksMutation,
    createSkillCategoryMutation,
    updateSkillCategoryMutation,
    deleteSkillCategoryMutation,
    reorderSkillCategoriesMutation,
    createSkillMutation,
    updateSkillMutation,
    deleteSkillMutation,
    reorderSkillsMutation,
    createAchievementMutation,
    updateAchievementMutation,
    deleteAchievementMutation,
    reorderAchievementsMutation,
    createExperienceEntryMutation,
    updateExperienceEntryMutation,
    deleteExperienceEntryMutation,
    reorderExperienceEntriesMutation,
    createExperienceBulletMutation,
    updateExperienceBulletMutation,
    deleteExperienceBulletMutation,
    reorderExperienceBulletsMutation,
    createEducationEntryMutation,
    updateEducationEntryMutation,
    deleteEducationEntryMutation,
    reorderEducationEntriesMutation,
    createEducationBulletMutation,
    updateEducationBulletMutation,
    deleteEducationBulletMutation,
    reorderEducationBulletsMutation,
    createProjectMutation,
    updateProjectMutation,
    deleteProjectMutation,
    reorderProjectsMutation,
    createProjectBulletMutation,
    updateProjectBulletMutation,
    deleteProjectBulletMutation,
    reorderProjectBulletsMutation,
    createAdditionalExperienceEntryMutation,
    updateAdditionalExperienceEntryMutation,
    deleteAdditionalExperienceEntryMutation,
    reorderAdditionalExperienceEntriesMutation,
    createAdditionalExperienceBulletMutation,
    updateAdditionalExperienceBulletMutation,
    deleteAdditionalExperienceBulletMutation,
    reorderAdditionalExperienceBulletsMutation,
    createCertificationMutation,
    updateCertificationMutation,
    deleteCertificationMutation,
    reorderCertificationsMutation,
    createReferenceMutation,
    updateReferenceMutation,
    deleteReferenceMutation,
    reorderReferencesMutation,
    duplicateProfileMutation,
    deleteProfileMutation,
  ] as const

  const errorMessage = mutations
    .map((mutation) => mutation.error)
    .filter(Boolean)
    .map(getErrorMessage)[0] ?? null

  return {
    errorMessage,
    isSaving: mutations.some((mutation) => mutation.isPending),
    updateProfile: async (input: UpdateProfileInput) => {
      await updateProfileMutation.mutateAsync(input)
    },
    setDocumentHeaderTemplate: async (input: SetDocumentHeaderTemplateInput) => {
      await setDocumentHeaderTemplateMutation.mutateAsync(input)
    },
    setResumeSectionEnabled: async (input: SetResumeSectionEnabledInput) => {
      await setResumeSectionEnabledMutation.mutateAsync(input)
    },
    setResumeSectionLabel: async (input: SetResumeSectionLabelInput) => {
      await setResumeSectionLabelMutation.mutateAsync(input)
    },
    reorderResumeSections: async (input: ReorderResumeSectionsInput) => {
      await reorderResumeSectionsMutation.mutateAsync(input)
    },
    createProfileLink: async (profileId: Id) => {
      const result = await createProfileLinkMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateProfileLink: async (input: UpdateProfileLinkInput) => {
      await updateProfileLinkMutation.mutateAsync(input)
    },
    deleteProfileLink: async (profileLinkId: Id) => {
      await deleteProfileLinkMutation.mutateAsync(profileLinkId)
    },
    reorderProfileLinks: async (input: ReorderProfileEntitiesInput) => {
      await reorderProfileLinksMutation.mutateAsync(input)
    },
    createSkillCategory: async (profileId: Id) => {
      const result = await createSkillCategoryMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateSkillCategory: async (input: UpdateSkillCategoryInput) => {
      await updateSkillCategoryMutation.mutateAsync(input)
    },
    deleteSkillCategory: async (skillCategoryId: Id) => {
      await deleteSkillCategoryMutation.mutateAsync(skillCategoryId)
    },
    reorderSkillCategories: async (input: ReorderProfileEntitiesInput) => {
      await reorderSkillCategoriesMutation.mutateAsync(input)
    },
    createSkill: async (skillCategoryId: Id) => {
      const result = await createSkillMutation.mutateAsync(skillCategoryId)

      return result.createdId ?? null
    },
    updateSkill: async (input: UpdateSkillInput) => {
      await updateSkillMutation.mutateAsync(input)
    },
    deleteSkill: async (skillId: Id) => {
      await deleteSkillMutation.mutateAsync(skillId)
    },
    reorderSkills: async (input: { skillCategoryId: Id; orderedIds: Id[] }) => {
      await reorderSkillsMutation.mutateAsync(input)
    },
    createAchievement: async (profileId: Id) => {
      const result = await createAchievementMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateAchievement: async (input: UpdateAchievementInput) => {
      await updateAchievementMutation.mutateAsync(input)
    },
    deleteAchievement: async (achievementId: Id) => {
      await deleteAchievementMutation.mutateAsync(achievementId)
    },
    reorderAchievements: async (input: ReorderProfileEntitiesInput) => {
      await reorderAchievementsMutation.mutateAsync(input)
    },
    createExperienceEntry: async (profileId: Id) => {
      const result = await createExperienceEntryMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateExperienceEntry: async (input: UpdateExperienceEntryInput) => {
      await updateExperienceEntryMutation.mutateAsync(input)
    },
    deleteExperienceEntry: async (experienceEntryId: Id) => {
      await deleteExperienceEntryMutation.mutateAsync(experienceEntryId)
    },
    reorderExperienceEntries: async (input: ReorderProfileEntitiesInput) => {
      await reorderExperienceEntriesMutation.mutateAsync(input)
    },
    createExperienceBullet: async (experienceEntryId: Id) => {
      const result = await createExperienceBulletMutation.mutateAsync(experienceEntryId)

      return result.createdId ?? null
    },
    updateExperienceBullet: async (input: UpdateExperienceBulletInput) => {
      await updateExperienceBulletMutation.mutateAsync(input)
    },
    deleteExperienceBullet: async (experienceBulletId: Id) => {
      await deleteExperienceBulletMutation.mutateAsync(experienceBulletId)
    },
    reorderExperienceBullets: async (input: ReorderExperienceBulletsInput) => {
      await reorderExperienceBulletsMutation.mutateAsync(input)
    },
    createEducationEntry: async (profileId: Id) => {
      const result = await createEducationEntryMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateEducationEntry: async (input: UpdateEducationEntryInput) => {
      await updateEducationEntryMutation.mutateAsync(input)
    },
    deleteEducationEntry: async (educationEntryId: Id) => {
      await deleteEducationEntryMutation.mutateAsync(educationEntryId)
    },
    reorderEducationEntries: async (input: ReorderProfileEntitiesInput) => {
      await reorderEducationEntriesMutation.mutateAsync(input)
    },
    createEducationBullet: async (educationEntryId: Id) => {
      const result = await createEducationBulletMutation.mutateAsync(educationEntryId)

      return result.createdId ?? null
    },
    updateEducationBullet: async (input: UpdateEducationBulletInput) => {
      await updateEducationBulletMutation.mutateAsync(input)
    },
    deleteEducationBullet: async (educationBulletId: Id) => {
      await deleteEducationBulletMutation.mutateAsync(educationBulletId)
    },
    reorderEducationBullets: async (input: ReorderEducationBulletsInput) => {
      await reorderEducationBulletsMutation.mutateAsync(input)
    },
    createProject: async (profileId: Id) => {
      const result = await createProjectMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateProject: async (input: UpdateProjectInput) => {
      await updateProjectMutation.mutateAsync(input)
    },
    deleteProject: async (projectId: Id) => {
      await deleteProjectMutation.mutateAsync(projectId)
    },
    reorderProjects: async (input: ReorderProfileEntitiesInput) => {
      await reorderProjectsMutation.mutateAsync(input)
    },
    createProjectBullet: async (projectId: Id) => {
      const result = await createProjectBulletMutation.mutateAsync(projectId)

      return result.createdId ?? null
    },
    updateProjectBullet: async (input: UpdateProjectBulletInput) => {
      await updateProjectBulletMutation.mutateAsync(input)
    },
    deleteProjectBullet: async (projectBulletId: Id) => {
      await deleteProjectBulletMutation.mutateAsync(projectBulletId)
    },
    reorderProjectBullets: async (input: ReorderProjectBulletsInput) => {
      await reorderProjectBulletsMutation.mutateAsync(input)
    },
    createAdditionalExperienceEntry: async (profileId: Id) => {
      const result = await createAdditionalExperienceEntryMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateAdditionalExperienceEntry: async (input: UpdateAdditionalExperienceEntryInput) => {
      await updateAdditionalExperienceEntryMutation.mutateAsync(input)
    },
    deleteAdditionalExperienceEntry: async (additionalExperienceEntryId: Id) => {
      await deleteAdditionalExperienceEntryMutation.mutateAsync(additionalExperienceEntryId)
    },
    reorderAdditionalExperienceEntries: async (input: ReorderProfileEntitiesInput) => {
      await reorderAdditionalExperienceEntriesMutation.mutateAsync(input)
    },
    createAdditionalExperienceBullet: async (additionalExperienceEntryId: Id) => {
      const result = await createAdditionalExperienceBulletMutation.mutateAsync(additionalExperienceEntryId)

      return result.createdId ?? null
    },
    updateAdditionalExperienceBullet: async (input: UpdateAdditionalExperienceBulletInput) => {
      await updateAdditionalExperienceBulletMutation.mutateAsync(input)
    },
    deleteAdditionalExperienceBullet: async (additionalExperienceBulletId: Id) => {
      await deleteAdditionalExperienceBulletMutation.mutateAsync(additionalExperienceBulletId)
    },
    reorderAdditionalExperienceBullets: async (input: ReorderAdditionalExperienceBulletsInput) => {
      await reorderAdditionalExperienceBulletsMutation.mutateAsync(input)
    },
    createCertification: async (profileId: Id) => {
      const result = await createCertificationMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateCertification: async (input: UpdateCertificationInput) => {
      await updateCertificationMutation.mutateAsync(input)
    },
    deleteCertification: async (certificationId: Id) => {
      await deleteCertificationMutation.mutateAsync(certificationId)
    },
    reorderCertifications: async (input: ReorderProfileEntitiesInput) => {
      await reorderCertificationsMutation.mutateAsync(input)
    },
    createReference: async (profileId: Id) => {
      const result = await createReferenceMutation.mutateAsync(profileId)

      return result.createdId ?? null
    },
    updateReference: async (input: UpdateReferenceInput) => {
      await updateReferenceMutation.mutateAsync(input)
    },
    deleteReference: async (referenceId: Id) => {
      await deleteReferenceMutation.mutateAsync(referenceId)
    },
    reorderReferences: async (input: ReorderProfileEntitiesInput) => {
      await reorderReferencesMutation.mutateAsync(input)
    },
    duplicateProfile: async (input: DuplicateProfileInput) => {
      const result = await duplicateProfileMutation.mutateAsync(input)
      const createdProfileId = result.createdId ?? null
      const createdProfile = createdProfileId ? result.data.profiles[createdProfileId] : null

      if (createdProfileId) {
        selectProfile(createdProfileId)
      }

      if (createdProfile?.jobId !== undefined) {
        selectJob(createdProfile?.jobId ?? null)
      }

      return createdProfileId
    },
    deleteProfile: async (profileId: Id) => {
      await deleteProfileMutation.mutateAsync(profileId)

      if (selectedProfileId === profileId) {
        selectProfile(null)
      }
    },
  }
}