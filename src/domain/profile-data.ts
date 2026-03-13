import { createDefaultResumeSettings, emptyProfileDefaults } from './profile-defaults'
import { isBulletLevel } from '../utils/bullet-levels'
import { normalizeDocumentHeaderTemplate } from '../utils/document-header-templates'
import { defaultResumeSectionOrder } from '../utils/resume-section-labels'
import { normalizeResumeSectionLabel } from '../utils/resume-section-labels'
import type {
  Achievement,
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  AppDataState,
  Certification,
  DocumentHeaderTemplate,
  EducationBullet,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Id,
  IsoTimestamp,
  PersonalDetails,
  Profile,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  ResumeSectionKey,
  Skill,
  SkillCategory,
} from '../types/state'

export interface UpdateProfileInput {
  profileId: Id
  changes: Partial<Pick<Profile, 'name' | 'summary' | 'coverLetter'>>
  personalDetails?: Partial<PersonalDetails>
}

export interface SetDocumentHeaderTemplateInput {
  profileId: Id
  headerTemplate: DocumentHeaderTemplate
}

export interface SetResumeSectionEnabledInput {
  profileId: Id
  section: ResumeSectionKey
  enabled: boolean
}

export interface SetResumeSectionLabelInput {
  profileId: Id
  section: ResumeSectionKey
  label: string
}

export interface ReorderResumeSectionsInput {
  profileId: Id
  orderedSections: ResumeSectionKey[]
}

export interface DuplicateProfileInput {
  sourceProfileId: Id
  targetJobId?: Id | null
  name?: string
}

export interface UpdateProfileLinkInput {
  profileLinkId: Id
  changes: Partial<Pick<ProfileLink, 'name' | 'url' | 'enabled' | 'sortOrder'>>
}

export interface ReorderProfileEntitiesInput {
  profileId: Id
  orderedIds: Id[]
}

export interface UpdateSkillCategoryInput {
  skillCategoryId: Id
  changes: Partial<Pick<SkillCategory, 'name' | 'enabled' | 'sortOrder'>>
}

export interface UpdateSkillInput {
  skillId: Id
  changes: Partial<Pick<Skill, 'name' | 'enabled' | 'sortOrder'>>
}

export interface UpdateAchievementInput {
  achievementId: Id
  changes: Partial<Omit<Achievement, 'id' | 'profileId'>>
}

export interface UpdateExperienceEntryInput {
  experienceEntryId: Id
  changes: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>>
}

export interface UpdateExperienceBulletInput {
  experienceBulletId: Id
  changes: Partial<Pick<ExperienceBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>
}

export interface ReorderExperienceBulletsInput {
  experienceEntryId: Id
  orderedIds: Id[]
}

export interface UpdateEducationEntryInput {
  educationEntryId: Id
  changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>
}

export interface UpdateEducationBulletInput {
  educationBulletId: Id
  changes: Partial<Pick<EducationBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>
}

export interface ReorderEducationBulletsInput {
  educationEntryId: Id
  orderedIds: Id[]
}

export interface UpdateProjectInput {
  projectId: Id
  changes: Partial<Omit<Project, 'id' | 'profileId'>>
}

export interface UpdateProjectBulletInput {
  projectBulletId: Id
  changes: Partial<Pick<ProjectBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>
}

export interface ReorderProjectBulletsInput {
  projectId: Id
  orderedIds: Id[]
}

export interface UpdateAdditionalExperienceEntryInput {
  additionalExperienceEntryId: Id
  changes: Partial<Omit<AdditionalExperienceEntry, 'id' | 'profileId'>>
}

export interface UpdateAdditionalExperienceBulletInput {
  additionalExperienceBulletId: Id
  changes: Partial<Pick<AdditionalExperienceBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>
}

export interface ReorderAdditionalExperienceBulletsInput {
  additionalExperienceEntryId: Id
  orderedIds: Id[]
}

export interface UpdateCertificationInput {
  certificationId: Id
  changes: Partial<Omit<Certification, 'id' | 'profileId'>>
}

export interface UpdateReferenceInput {
  referenceId: Id
  changes: Partial<Omit<Reference, 'id' | 'profileId'>>
}

export interface ProfileMutationContext {
  now(): IsoTimestamp
  createId(): Id
}

export interface ProfileMutationResult {
  data: AppDataState
  createdId?: Id | null
}

const resumeSectionKeys: ResumeSectionKey[] = defaultResumeSectionOrder

const hasExactResumeSections = (orderedSections: ResumeSectionKey[]) => {
  if (orderedSections.length !== resumeSectionKeys.length) {
    return false
  }

  const sectionSet = new Set(orderedSections)

  if (sectionSet.size !== resumeSectionKeys.length) {
    return false
  }

  return resumeSectionKeys.every((section) => sectionSet.has(section))
}

const hasExactIds = (existingIds: Id[], orderedIds: Id[]) => {
  if (existingIds.length !== orderedIds.length) {
    return false
  }

  const existingSet = new Set(existingIds)

  if (existingSet.size !== existingIds.length) {
    return false
  }

  return orderedIds.every((id) => existingSet.has(id))
}

const getNextSortOrder = (sortOrders: number[]) => (sortOrders.length === 0 ? 1 : Math.max(...sortOrders) + 1)

const reorderSortableEntities = <T extends { id: Id; sortOrder: number }>(entities: Record<Id, T>, orderedIds: Id[]) => {
  const nextEntities = { ...entities }

  orderedIds.forEach((id, index) => {
    const entity = nextEntities[id]

    if (!entity) {
      return
    }

    nextEntities[id] = {
      ...entity,
      sortOrder: index + 1,
    }
  })

  return nextEntities
}

const stampUpdatedProfile = (data: AppDataState, profileId: Id, timestamp: string): AppDataState => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return data
  }

  return {
    ...data,
    profiles: {
      ...data.profiles,
      [profileId]: {
        ...profile,
        updatedAt: timestamp,
      },
    },
  }
}

const createProfileRecord = (name: string, context: ProfileMutationContext): Profile => {
  const timestamp = context.now()

  return {
    id: context.createId(),
    name,
    summary: emptyProfileDefaults.summary,
    coverLetter: emptyProfileDefaults.coverLetter,
    resumeSettings: createDefaultResumeSettings(),
    personalDetails: {
      ...emptyProfileDefaults.personalDetails,
    },
    jobId: null,
    clonedFromProfileId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const cloneProfileChildren = (data: AppDataState, sourceProfileId: Id, targetProfileId: Id, context: ProfileMutationContext): AppDataState => {
  const clonedSkillCategoryIds = new Map<Id, Id>()
  const clonedExperienceEntryIds = new Map<Id, Id>()
  const clonedEducationEntryIds = new Map<Id, Id>()
  const clonedProjectIds = new Map<Id, Id>()
  const clonedAdditionalExperienceEntryIds = new Map<Id, Id>()
  const nextData: AppDataState = {
    ...data,
    profileLinks: { ...data.profileLinks },
    skillCategories: { ...data.skillCategories },
    skills: { ...data.skills },
    achievements: { ...data.achievements },
    experienceEntries: { ...data.experienceEntries },
    experienceBullets: { ...data.experienceBullets },
    educationEntries: { ...data.educationEntries },
    educationBullets: { ...data.educationBullets },
    projects: { ...data.projects },
    projectBullets: { ...data.projectBullets },
    additionalExperienceEntries: { ...data.additionalExperienceEntries },
    additionalExperienceBullets: { ...data.additionalExperienceBullets },
    certifications: { ...data.certifications },
    references: { ...data.references },
  }
  const timestamp = context.now()

  Object.values(data.profileLinks)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: ProfileLink = {
        ...item,
        id: context.createId(),
        profileId: targetProfileId,
      }
      nextData.profileLinks[cloned.id] = cloned
    })

  Object.values(data.skillCategories)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = context.createId()
      clonedSkillCategoryIds.set(item.id, newId)
      const cloned: SkillCategory = {
        ...item,
        id: newId,
        profileId: targetProfileId,
      }
      nextData.skillCategories[newId] = cloned
    })

  Object.values(data.skills)
    .filter((item) => clonedSkillCategoryIds.has(item.skillCategoryId))
    .forEach((item) => {
      const cloned: Skill = {
        ...item,
        id: context.createId(),
        skillCategoryId: clonedSkillCategoryIds.get(item.skillCategoryId)!,
      }
      nextData.skills[cloned.id] = cloned
    })

  Object.values(data.achievements)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Achievement = {
        ...item,
        id: context.createId(),
        profileId: targetProfileId,
      }
      nextData.achievements[cloned.id] = cloned
    })

  Object.values(data.experienceEntries)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = context.createId()
      clonedExperienceEntryIds.set(item.id, newId)
      const cloned: ExperienceEntry = {
        ...item,
        id: newId,
        profileId: targetProfileId,
      }
      nextData.experienceEntries[cloned.id] = cloned
    })

  Object.values(data.experienceBullets)
    .filter((item) => clonedExperienceEntryIds.has(item.experienceEntryId))
    .forEach((item) => {
      const cloned: ExperienceBullet = {
        ...item,
        id: context.createId(),
        experienceEntryId: clonedExperienceEntryIds.get(item.experienceEntryId)!,
      }
      nextData.experienceBullets[cloned.id] = cloned
    })

  Object.values(data.educationEntries)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = context.createId()
      clonedEducationEntryIds.set(item.id, newId)
      const cloned: EducationEntry = {
        ...item,
        id: newId,
        profileId: targetProfileId,
      }
      nextData.educationEntries[cloned.id] = cloned
    })

  Object.values(data.educationBullets)
    .filter((item) => clonedEducationEntryIds.has(item.educationEntryId))
    .forEach((item) => {
      const cloned: EducationBullet = {
        ...item,
        id: context.createId(),
        educationEntryId: clonedEducationEntryIds.get(item.educationEntryId)!,
      }
      nextData.educationBullets[cloned.id] = cloned
    })

  Object.values(data.projects)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = context.createId()
      clonedProjectIds.set(item.id, newId)
      const cloned: Project = {
        ...item,
        id: newId,
        profileId: targetProfileId,
      }
      nextData.projects[cloned.id] = cloned
    })

  Object.values(data.projectBullets)
    .filter((item) => clonedProjectIds.has(item.projectId))
    .forEach((item) => {
      const cloned: ProjectBullet = {
        ...item,
        id: context.createId(),
        projectId: clonedProjectIds.get(item.projectId)!,
      }
      nextData.projectBullets[cloned.id] = cloned
    })

  Object.values(data.additionalExperienceEntries)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = context.createId()
      clonedAdditionalExperienceEntryIds.set(item.id, newId)
      const cloned: AdditionalExperienceEntry = {
        ...item,
        id: newId,
        profileId: targetProfileId,
      }
      nextData.additionalExperienceEntries[cloned.id] = cloned
    })

  Object.values(data.additionalExperienceBullets)
    .filter((item) => clonedAdditionalExperienceEntryIds.has(item.additionalExperienceEntryId))
    .forEach((item) => {
      const cloned: AdditionalExperienceBullet = {
        ...item,
        id: context.createId(),
        additionalExperienceEntryId: clonedAdditionalExperienceEntryIds.get(item.additionalExperienceEntryId)!,
      }
      nextData.additionalExperienceBullets[cloned.id] = cloned
    })

  Object.values(data.certifications)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Certification = {
        ...item,
        id: context.createId(),
        profileId: targetProfileId,
      }
      nextData.certifications[cloned.id] = cloned
    })

  Object.values(data.references)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Reference = {
        ...item,
        id: context.createId(),
        profileId: targetProfileId,
      }
      nextData.references[cloned.id] = cloned
    })

  return stampUpdatedProfile(nextData, targetProfileId, timestamp)
}

const deleteProfileCascade = (data: AppDataState, profileId: Id): AppDataState => {
  const skillCategoryIds = new Set(
    Object.values(data.skillCategories)
      .filter((item) => item.profileId === profileId)
      .map((item) => item.id),
  )
  const experienceEntryIds = new Set(
    Object.values(data.experienceEntries)
      .filter((item) => item.profileId === profileId)
      .map((item) => item.id),
  )
  const projectIds = new Set(
    Object.values(data.projects)
      .filter((item) => item.profileId === profileId)
      .map((item) => item.id),
  )
  const additionalExperienceEntryIds = new Set(
    Object.values(data.additionalExperienceEntries)
      .filter((item) => item.profileId === profileId)
      .map((item) => item.id),
  )

  const nextProfiles = { ...data.profiles }
  const nextProfileLinks = { ...data.profileLinks }
  const nextSkillCategories = { ...data.skillCategories }
  const nextSkills = { ...data.skills }
  const nextAchievements = { ...data.achievements }
  const nextExperienceEntries = { ...data.experienceEntries }
  const nextExperienceBullets = { ...data.experienceBullets }
  const nextEducationEntries = { ...data.educationEntries }
  const nextEducationBullets = { ...data.educationBullets }
  const nextProjects = { ...data.projects }
  const nextProjectBullets = { ...data.projectBullets }
  const nextAdditionalExperienceEntries = { ...data.additionalExperienceEntries }
  const nextAdditionalExperienceBullets = { ...data.additionalExperienceBullets }
  const nextCertifications = { ...data.certifications }
  const nextReferences = { ...data.references }

  delete nextProfiles[profileId]

  Object.values(nextProfiles).forEach((profile) => {
    if (profile.clonedFromProfileId === profileId) {
      nextProfiles[profile.id] = {
        ...profile,
        clonedFromProfileId: null,
      }
    }
  })

  Object.values(data.skillCategories).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextSkillCategories[item.id]
    }
  })

  Object.values(data.profileLinks).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextProfileLinks[item.id]
    }
  })

  Object.values(data.skills).forEach((item) => {
    if (skillCategoryIds.has(item.skillCategoryId)) {
      delete nextSkills[item.id]
    }
  })

  Object.values(data.achievements).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextAchievements[item.id]
    }
  })

  Object.values(data.experienceEntries).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextExperienceEntries[item.id]
    }
  })

  Object.values(data.experienceBullets).forEach((item) => {
    if (experienceEntryIds.has(item.experienceEntryId)) {
      delete nextExperienceBullets[item.id]
    }
  })

  Object.values(data.educationEntries).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextEducationEntries[item.id]
    }
  })

  Object.values(data.educationBullets).forEach((item) => {
    const educationEntry = data.educationEntries[item.educationEntryId]

    if (educationEntry?.profileId === profileId) {
      delete nextEducationBullets[item.id]
    }
  })

  Object.values(data.projects).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextProjects[item.id]
    }
  })

  Object.values(data.projectBullets).forEach((item) => {
    if (projectIds.has(item.projectId)) {
      delete nextProjectBullets[item.id]
    }
  })

  Object.values(data.additionalExperienceEntries).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextAdditionalExperienceEntries[item.id]
    }
  })

  Object.values(data.additionalExperienceBullets).forEach((item) => {
    if (additionalExperienceEntryIds.has(item.additionalExperienceEntryId)) {
      delete nextAdditionalExperienceBullets[item.id]
    }
  })

  Object.values(data.certifications).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextCertifications[item.id]
    }
  })

  Object.values(data.references).forEach((item) => {
    if (item.profileId === profileId) {
      delete nextReferences[item.id]
    }
  })

  return {
    ...data,
    profiles: nextProfiles,
    profileLinks: nextProfileLinks,
    skillCategories: nextSkillCategories,
    skills: nextSkills,
    achievements: nextAchievements,
    experienceEntries: nextExperienceEntries,
    experienceBullets: nextExperienceBullets,
    educationEntries: nextEducationEntries,
    educationBullets: nextEducationBullets,
    projects: nextProjects,
    projectBullets: nextProjectBullets,
    additionalExperienceEntries: nextAdditionalExperienceEntries,
    additionalExperienceBullets: nextAdditionalExperienceBullets,
    certifications: nextCertifications,
    references: nextReferences,
  }
}

const deleteSkillCategoryCascade = (data: AppDataState, skillCategoryId: Id): AppDataState => {
  const nextSkillCategories = { ...data.skillCategories }
  const nextSkills = { ...data.skills }

  delete nextSkillCategories[skillCategoryId]

  Object.values(data.skills).forEach((item) => {
    if (item.skillCategoryId === skillCategoryId) {
      delete nextSkills[item.id]
    }
  })

  return {
    ...data,
    skillCategories: nextSkillCategories,
    skills: nextSkills,
  }
}

const deleteExperienceEntryCascade = (data: AppDataState, experienceEntryId: Id): AppDataState => {
  const nextExperienceEntries = { ...data.experienceEntries }
  const nextExperienceBullets = { ...data.experienceBullets }

  delete nextExperienceEntries[experienceEntryId]

  Object.values(data.experienceBullets).forEach((item) => {
    if (item.experienceEntryId === experienceEntryId) {
      delete nextExperienceBullets[item.id]
    }
  })

  return {
    ...data,
    experienceEntries: nextExperienceEntries,
    experienceBullets: nextExperienceBullets,
  }
}

const deleteEducationEntryCascade = (data: AppDataState, educationEntryId: Id): AppDataState => {
  const nextEducationEntries = { ...data.educationEntries }
  const nextEducationBullets = { ...data.educationBullets }

  delete nextEducationEntries[educationEntryId]

  Object.values(data.educationBullets).forEach((item) => {
    if (item.educationEntryId === educationEntryId) {
      delete nextEducationBullets[item.id]
    }
  })

  return {
    ...data,
    educationEntries: nextEducationEntries,
    educationBullets: nextEducationBullets,
  }
}

const deleteProjectCascade = (data: AppDataState, projectId: Id): AppDataState => {
  const nextProjects = { ...data.projects }
  const nextProjectBullets = { ...data.projectBullets }

  delete nextProjects[projectId]

  Object.values(data.projectBullets).forEach((item) => {
    if (item.projectId === projectId) {
      delete nextProjectBullets[item.id]
    }
  })

  return {
    ...data,
    projects: nextProjects,
    projectBullets: nextProjectBullets,
  }
}

const deleteAdditionalExperienceEntryCascade = (data: AppDataState, additionalExperienceEntryId: Id): AppDataState => {
  const nextAdditionalExperienceEntries = { ...data.additionalExperienceEntries }
  const nextAdditionalExperienceBullets = { ...data.additionalExperienceBullets }

  delete nextAdditionalExperienceEntries[additionalExperienceEntryId]

  Object.values(data.additionalExperienceBullets).forEach((item) => {
    if (item.additionalExperienceEntryId === additionalExperienceEntryId) {
      delete nextAdditionalExperienceBullets[item.id]
    }
  })

  return {
    ...data,
    additionalExperienceEntries: nextAdditionalExperienceEntries,
    additionalExperienceBullets: nextAdditionalExperienceBullets,
  }
}

const normalizeEducationEntry = (
  existing: EducationEntry,
  changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>,
) => {
  const nextEntry: EducationEntry = {
    ...existing,
    ...changes,
  }

  if (nextEntry.status === 'in_progress') {
    nextEntry.endDate = null
  }

  if (nextEntry.startDate && nextEntry.endDate && nextEntry.startDate > nextEntry.endDate) {
    return null
  }

  return nextEntry
}

const normalizeProject = (existing: Project, changes: Partial<Omit<Project, 'id' | 'profileId'>>) => {
  const nextProject: Project = {
    ...existing,
    ...changes,
  }

  if (nextProject.startDate && nextProject.endDate && nextProject.startDate > nextProject.endDate) {
    return null
  }

  return nextProject
}

const normalizeAdditionalExperienceEntry = (
  existing: AdditionalExperienceEntry,
  changes: Partial<Omit<AdditionalExperienceEntry, 'id' | 'profileId'>>,
) => {
  const nextEntry: AdditionalExperienceEntry = {
    ...existing,
    ...changes,
  }

  if (nextEntry.startDate && nextEntry.endDate && nextEntry.startDate > nextEntry.endDate) {
    return null
  }

  return nextEntry
}

const mergeEducationBulletChanges = (
  existing: EducationBullet,
  changes: Partial<Pick<EducationBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>,
) => {
  if (changes.level !== undefined && !isBulletLevel(changes.level)) {
    return null
  }

  return {
    ...existing,
    ...changes,
  }
}

const mergeExperienceBulletChanges = (
  existing: ExperienceBullet,
  changes: Partial<Pick<ExperienceBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>,
) => {
  if (changes.level !== undefined && !isBulletLevel(changes.level)) {
    return null
  }

  return {
    ...existing,
    ...changes,
  }
}

const mergeProjectBulletChanges = (
  existing: ProjectBullet,
  changes: Partial<Pick<ProjectBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>,
) => {
  if (changes.level !== undefined && !isBulletLevel(changes.level)) {
    return null
  }

  return {
    ...existing,
    ...changes,
  }
}

const mergeAdditionalExperienceBulletChanges = (
  existing: AdditionalExperienceBullet,
  changes: Partial<Pick<AdditionalExperienceBullet, 'content' | 'level' | 'enabled' | 'sortOrder'>>,
) => {
  if (changes.level !== undefined && !isBulletLevel(changes.level)) {
    return null
  }

  return {
    ...existing,
    ...changes,
  }
}

const withResult = (data: AppDataState, createdId?: Id | null): ProfileMutationResult =>
  createdId === undefined ? { data } : { data, createdId }

export const createBaseProfileMutation = (data: AppDataState, name: string, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = createProfileRecord(name, context)

  return withResult(
    {
      ...data,
      profiles: {
        ...data.profiles,
        [profile.id]: profile,
      },
    },
    profile.id,
  )
}

export const updateProfileMutation = (data: AppDataState, input: UpdateProfileInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingProfile = data.profiles[input.profileId]

  if (!existingProfile) {
    return withResult(data)
  }

  return withResult({
    ...data,
    profiles: {
      ...data.profiles,
      [input.profileId]: {
        ...existingProfile,
        ...input.changes,
        personalDetails: {
          ...existingProfile.personalDetails,
          ...input.personalDetails,
        },
        updatedAt: context.now(),
      },
    },
  })
}

export const setDocumentHeaderTemplateMutation = (data: AppDataState, input: SetDocumentHeaderTemplateInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingProfile = data.profiles[input.profileId]

  if (!existingProfile) {
    return withResult(data)
  }

  const nextHeaderTemplate = normalizeDocumentHeaderTemplate(input.headerTemplate)

  if (existingProfile.resumeSettings.headerTemplate === nextHeaderTemplate) {
    return withResult(data)
  }

  return withResult({
    ...data,
    profiles: {
      ...data.profiles,
      [input.profileId]: {
        ...existingProfile,
        resumeSettings: {
          ...existingProfile.resumeSettings,
          headerTemplate: nextHeaderTemplate,
        },
        updatedAt: context.now(),
      },
    },
  })
}

export const setResumeSectionEnabledMutation = (data: AppDataState, input: SetResumeSectionEnabledInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingProfile = data.profiles[input.profileId]

  if (!existingProfile) {
    return withResult(data)
  }

  if (existingProfile.resumeSettings.sections[input.section].enabled === input.enabled) {
    return withResult(data)
  }

  return withResult({
    ...data,
    profiles: {
      ...data.profiles,
      [input.profileId]: {
        ...existingProfile,
        resumeSettings: {
          ...existingProfile.resumeSettings,
          sections: {
            ...existingProfile.resumeSettings.sections,
            [input.section]: {
              ...existingProfile.resumeSettings.sections[input.section],
              enabled: input.enabled,
            },
          },
        },
        updatedAt: context.now(),
      },
    },
  })
}

export const setResumeSectionLabelMutation = (data: AppDataState, input: SetResumeSectionLabelInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingProfile = data.profiles[input.profileId]

  if (!existingProfile) {
    return withResult(data)
  }

  const nextLabel = normalizeResumeSectionLabel(input.section, input.label)

  if (existingProfile.resumeSettings.sections[input.section].label === nextLabel) {
    return withResult(data)
  }

  return withResult({
    ...data,
    profiles: {
      ...data.profiles,
      [input.profileId]: {
        ...existingProfile,
        resumeSettings: {
          ...existingProfile.resumeSettings,
          sections: {
            ...existingProfile.resumeSettings.sections,
            [input.section]: {
              ...existingProfile.resumeSettings.sections[input.section],
              label: nextLabel,
            },
          },
        },
        updatedAt: context.now(),
      },
    },
  })
}

export const reorderResumeSectionsMutation = (data: AppDataState, input: ReorderResumeSectionsInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingProfile = data.profiles[input.profileId]

  if (!existingProfile || !hasExactResumeSections(input.orderedSections)) {
    return withResult(data)
  }

  const nextSections = { ...existingProfile.resumeSettings.sections }

  input.orderedSections.forEach((section, index) => {
    nextSections[section] = {
      ...nextSections[section],
      sortOrder: index + 1,
    }
  })

  return withResult({
    ...data,
    profiles: {
      ...data.profiles,
      [input.profileId]: {
        ...existingProfile,
        resumeSettings: {
          ...existingProfile.resumeSettings,
          sections: nextSections,
        },
        updatedAt: context.now(),
      },
    },
  })
}

export const duplicateProfileMutation = (data: AppDataState, input: DuplicateProfileInput, context: ProfileMutationContext): ProfileMutationResult => {
  const sourceProfile = data.profiles[input.sourceProfileId]

  if (!sourceProfile) {
    return withResult(data, null)
  }

  if (input.targetJobId !== undefined && input.targetJobId !== null && !data.jobs[input.targetJobId]) {
    return withResult(data, null)
  }

  const timestamp = context.now()
  const trimmedName = input.name?.trim()
  const duplicatedProfileId = context.createId()
  const duplicatedProfile: Profile = {
    ...sourceProfile,
    id: duplicatedProfileId,
    name: trimmedName
      ? trimmedName
      : sourceProfile.jobId === null && input.targetJobId !== undefined && input.targetJobId !== null
        ? sourceProfile.name
        : `${sourceProfile.name} Copy`,
    jobId: input.targetJobId === undefined ? sourceProfile.jobId : input.targetJobId,
    clonedFromProfileId: sourceProfile.id,
    personalDetails: {
      ...sourceProfile.personalDetails,
    },
    resumeSettings: {
      ...sourceProfile.resumeSettings,
      sections: defaultResumeSectionOrder.reduce<Profile['resumeSettings']['sections']>((sections, section) => {
        sections[section] = {
          ...sourceProfile.resumeSettings.sections[section],
        }

        return sections
      }, {} as Profile['resumeSettings']['sections']),
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const withProfile: AppDataState = {
    ...data,
    profiles: {
      ...data.profiles,
      [duplicatedProfile.id]: duplicatedProfile,
    },
  }

  return withResult(cloneProfileChildren(withProfile, sourceProfile.id, duplicatedProfile.id, context), duplicatedProfile.id)
}

export const deleteProfileMutation = (data: AppDataState, profileId: Id): ProfileMutationResult =>
  withResult(deleteProfileCascade(data, profileId))

export const createProfileLinkMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const profileLink: ProfileLink = {
    id: context.createId(),
    profileId,
    name: '',
    url: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.profileLinks)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        profileLinks: {
          ...data.profileLinks,
          [profileLink.id]: profileLink,
        },
      },
      profileId,
      context.now(),
    ),
    profileLink.id,
  )
}

export const updateProfileLinkMutation = (data: AppDataState, input: UpdateProfileLinkInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.profileLinks[input.profileLinkId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        profileLinks: {
          ...data.profileLinks,
          [input.profileLinkId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteProfileLinkMutation = (data: AppDataState, profileLinkId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.profileLinks[profileLinkId]

  if (!existing) {
    return withResult(data)
  }

  const nextProfileLinks = { ...data.profileLinks }
  delete nextProfileLinks[profileLinkId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        profileLinks: nextProfileLinks,
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const reorderProfileLinksMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.profileLinks)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        profileLinks: reorderSortableEntities(data.profileLinks, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createSkillCategoryMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const skillCategory: SkillCategory = {
    id: context.createId(),
    profileId,
    name: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.skillCategories)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skillCategories: {
          ...data.skillCategories,
          [skillCategory.id]: skillCategory,
        },
      },
      profileId,
      context.now(),
    ),
    skillCategory.id,
  )
}

export const updateSkillCategoryMutation = (data: AppDataState, input: UpdateSkillCategoryInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.skillCategories[input.skillCategoryId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skillCategories: {
          ...data.skillCategories,
          [input.skillCategoryId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteSkillCategoryMutation = (data: AppDataState, skillCategoryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.skillCategories[skillCategoryId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedProfile(deleteSkillCategoryCascade(data, skillCategoryId), existing.profileId, context.now()))
}

export const reorderSkillCategoriesMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.skillCategories)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skillCategories: reorderSortableEntities(data.skillCategories, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createSkillMutation = (data: AppDataState, skillCategoryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const category = data.skillCategories[skillCategoryId]

  if (!category) {
    return withResult(data, null)
  }

  const skill: Skill = {
    id: context.createId(),
    skillCategoryId,
    name: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.skills)
        .filter((item) => item.skillCategoryId === skillCategoryId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skills: {
          ...data.skills,
          [skill.id]: skill,
        },
      },
      category.profileId,
      context.now(),
    ),
    skill.id,
  )
}

export const updateSkillMutation = (data: AppDataState, input: UpdateSkillInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.skills[input.skillId]

  if (!existing) {
    return withResult(data)
  }

  const category = data.skillCategories[existing.skillCategoryId]

  if (!category) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skills: {
          ...data.skills,
          [input.skillId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      category.profileId,
      context.now(),
    ),
  )
}

export const deleteSkillMutation = (data: AppDataState, skillId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.skills[skillId]

  if (!existing) {
    return withResult(data)
  }

  const category = data.skillCategories[existing.skillCategoryId]

  if (!category) {
    return withResult(data)
  }

  const nextSkills = { ...data.skills }
  delete nextSkills[skillId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skills: nextSkills,
      },
      category.profileId,
      context.now(),
    ),
  )
}

export const reorderSkillsMutation = (data: AppDataState, skillCategoryId: Id, orderedIds: Id[], context: ProfileMutationContext): ProfileMutationResult => {
  const category = data.skillCategories[skillCategoryId]

  if (!category) {
    return withResult(data)
  }

  const existingIds = Object.values(data.skills)
    .filter((item) => item.skillCategoryId === skillCategoryId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        skills: reorderSortableEntities(data.skills, orderedIds),
      },
      category.profileId,
      context.now(),
    ),
  )
}

export const createAchievementMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const achievement: Achievement = {
    id: context.createId(),
    profileId,
    name: '',
    description: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.achievements)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        achievements: {
          ...data.achievements,
          [achievement.id]: achievement,
        },
      },
      profileId,
      context.now(),
    ),
    achievement.id,
  )
}

export const updateAchievementMutation = (data: AppDataState, input: UpdateAchievementInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.achievements[input.achievementId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        achievements: {
          ...data.achievements,
          [input.achievementId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteAchievementMutation = (data: AppDataState, achievementId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.achievements[achievementId]

  if (!existing) {
    return withResult(data)
  }

  const nextAchievements = { ...data.achievements }
  delete nextAchievements[achievementId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        achievements: nextAchievements,
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const reorderAchievementsMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.achievements)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        achievements: reorderSortableEntities(data.achievements, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createExperienceEntryMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const experienceEntry: ExperienceEntry = {
    id: context.createId(),
    profileId,
    company: '',
    title: '',
    location: '',
    workArrangement: 'unknown',
    employmentType: 'other',
    startDate: null,
    endDate: null,
    isCurrent: false,
    reasonForLeavingShort: '',
    reasonForLeavingDetails: '',
    supervisor: {
      name: '',
      title: '',
      phone: '',
      email: '',
    },
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.experienceEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceEntries: {
          ...data.experienceEntries,
          [experienceEntry.id]: experienceEntry,
        },
      },
      profileId,
      context.now(),
    ),
    experienceEntry.id,
  )
}

export const updateExperienceEntryMutation = (data: AppDataState, input: UpdateExperienceEntryInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.experienceEntries[input.experienceEntryId]

  if (!existing) {
    return withResult(data)
  }

  const nextIsCurrent = input.changes.isCurrent ?? existing.isCurrent
  const nextChanges: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>> = {
    ...input.changes,
  }

  if (nextIsCurrent) {
    nextChanges.endDate = null
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceEntries: {
          ...data.experienceEntries,
          [input.experienceEntryId]: {
            ...existing,
            ...nextChanges,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteExperienceEntryMutation = (data: AppDataState, experienceEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.experienceEntries[experienceEntryId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedProfile(deleteExperienceEntryCascade(data, experienceEntryId), existing.profileId, context.now()))
}

export const reorderExperienceEntriesMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.experienceEntries)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceEntries: reorderSortableEntities(data.experienceEntries, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createExperienceBulletMutation = (data: AppDataState, experienceEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const experienceEntry = data.experienceEntries[experienceEntryId]

  if (!experienceEntry) {
    return withResult(data, null)
  }

  const experienceBullet: ExperienceBullet = {
    id: context.createId(),
    experienceEntryId,
    content: '',
    level: 1,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.experienceBullets)
        .filter((item) => item.experienceEntryId === experienceEntryId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceBullets: {
          ...data.experienceBullets,
          [experienceBullet.id]: experienceBullet,
        },
      },
      experienceEntry.profileId,
      context.now(),
    ),
    experienceBullet.id,
  )
}

export const updateExperienceBulletMutation = (data: AppDataState, input: UpdateExperienceBulletInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.experienceBullets[input.experienceBulletId]

  if (!existing) {
    return withResult(data)
  }

  const experienceEntry = data.experienceEntries[existing.experienceEntryId]

  if (!experienceEntry) {
    return withResult(data)
  }

  const nextBullet = mergeExperienceBulletChanges(existing, input.changes)

  if (!nextBullet) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceBullets: {
          ...data.experienceBullets,
          [input.experienceBulletId]: nextBullet,
        },
      },
      experienceEntry.profileId,
      context.now(),
    ),
  )
}

export const deleteExperienceBulletMutation = (data: AppDataState, experienceBulletId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.experienceBullets[experienceBulletId]

  if (!existing) {
    return withResult(data)
  }

  const experienceEntry = data.experienceEntries[existing.experienceEntryId]

  if (!experienceEntry) {
    return withResult(data)
  }

  const nextExperienceBullets = { ...data.experienceBullets }
  delete nextExperienceBullets[experienceBulletId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceBullets: nextExperienceBullets,
      },
      experienceEntry.profileId,
      context.now(),
    ),
  )
}

export const reorderExperienceBulletsMutation = (data: AppDataState, input: ReorderExperienceBulletsInput, context: ProfileMutationContext): ProfileMutationResult => {
  const experienceEntry = data.experienceEntries[input.experienceEntryId]

  if (!experienceEntry) {
    return withResult(data)
  }

  const existingIds = Object.values(data.experienceBullets)
    .filter((item) => item.experienceEntryId === input.experienceEntryId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        experienceBullets: reorderSortableEntities(data.experienceBullets, input.orderedIds),
      },
      experienceEntry.profileId,
      context.now(),
    ),
  )
}

export const createEducationEntryMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const educationEntry: EducationEntry = {
    id: context.createId(),
    profileId,
    school: '',
    degree: '',
    startDate: null,
    endDate: null,
    status: 'graduated',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.educationEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationEntries: {
          ...data.educationEntries,
          [educationEntry.id]: educationEntry,
        },
      },
      profileId,
      context.now(),
    ),
    educationEntry.id,
  )
}

export const updateEducationEntryMutation = (data: AppDataState, input: UpdateEducationEntryInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.educationEntries[input.educationEntryId]

  if (!existing) {
    return withResult(data)
  }

  const nextEducationEntry = normalizeEducationEntry(existing, input.changes)

  if (!nextEducationEntry) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationEntries: {
          ...data.educationEntries,
          [input.educationEntryId]: nextEducationEntry,
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteEducationEntryMutation = (data: AppDataState, educationEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.educationEntries[educationEntryId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedProfile(deleteEducationEntryCascade(data, educationEntryId), existing.profileId, context.now()))
}

export const reorderEducationEntriesMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.educationEntries)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationEntries: reorderSortableEntities(data.educationEntries, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createEducationBulletMutation = (data: AppDataState, educationEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const educationEntry = data.educationEntries[educationEntryId]

  if (!educationEntry) {
    return withResult(data, null)
  }

  const educationBullet: EducationBullet = {
    id: context.createId(),
    educationEntryId,
    content: '',
    level: 1,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.educationBullets)
        .filter((item) => item.educationEntryId === educationEntryId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationBullets: {
          ...data.educationBullets,
          [educationBullet.id]: educationBullet,
        },
      },
      educationEntry.profileId,
      context.now(),
    ),
    educationBullet.id,
  )
}

export const updateEducationBulletMutation = (data: AppDataState, input: UpdateEducationBulletInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.educationBullets[input.educationBulletId]

  if (!existing) {
    return withResult(data)
  }

  const educationEntry = data.educationEntries[existing.educationEntryId]

  if (!educationEntry) {
    return withResult(data)
  }

  const nextBullet = mergeEducationBulletChanges(existing, input.changes)

  if (!nextBullet) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationBullets: {
          ...data.educationBullets,
          [input.educationBulletId]: nextBullet,
        },
      },
      educationEntry.profileId,
      context.now(),
    ),
  )
}

export const deleteEducationBulletMutation = (data: AppDataState, educationBulletId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.educationBullets[educationBulletId]

  if (!existing) {
    return withResult(data)
  }

  const educationEntry = data.educationEntries[existing.educationEntryId]

  if (!educationEntry) {
    return withResult(data)
  }

  const nextEducationBullets = { ...data.educationBullets }
  delete nextEducationBullets[educationBulletId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationBullets: nextEducationBullets,
      },
      educationEntry.profileId,
      context.now(),
    ),
  )
}

export const reorderEducationBulletsMutation = (data: AppDataState, input: ReorderEducationBulletsInput, context: ProfileMutationContext): ProfileMutationResult => {
  const educationEntry = data.educationEntries[input.educationEntryId]

  if (!educationEntry) {
    return withResult(data)
  }

  const existingIds = Object.values(data.educationBullets)
    .filter((item) => item.educationEntryId === input.educationEntryId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        educationBullets: reorderSortableEntities(data.educationBullets, input.orderedIds),
      },
      educationEntry.profileId,
      context.now(),
    ),
  )
}

export const createProjectMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const project: Project = {
    id: context.createId(),
    profileId,
    name: '',
    organization: '',
    startDate: null,
    endDate: null,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.projects)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projects: {
          ...data.projects,
          [project.id]: project,
        },
      },
      profileId,
      context.now(),
    ),
    project.id,
  )
}

export const updateProjectMutation = (data: AppDataState, input: UpdateProjectInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.projects[input.projectId]

  if (!existing) {
    return withResult(data)
  }

  const nextProject = normalizeProject(existing, input.changes)

  if (!nextProject) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projects: {
          ...data.projects,
          [input.projectId]: nextProject,
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteProjectMutation = (data: AppDataState, projectId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.projects[projectId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedProfile(deleteProjectCascade(data, projectId), existing.profileId, context.now()))
}

export const reorderProjectsMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.projects)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projects: reorderSortableEntities(data.projects, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createProjectBulletMutation = (data: AppDataState, projectId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const project = data.projects[projectId]

  if (!project) {
    return withResult(data, null)
  }

  const projectBullet: ProjectBullet = {
    id: context.createId(),
    projectId,
    content: '',
    level: 1,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.projectBullets)
        .filter((item) => item.projectId === projectId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projectBullets: {
          ...data.projectBullets,
          [projectBullet.id]: projectBullet,
        },
      },
      project.profileId,
      context.now(),
    ),
    projectBullet.id,
  )
}

export const updateProjectBulletMutation = (data: AppDataState, input: UpdateProjectBulletInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.projectBullets[input.projectBulletId]

  if (!existing) {
    return withResult(data)
  }

  const project = data.projects[existing.projectId]

  if (!project) {
    return withResult(data)
  }

  const nextBullet = mergeProjectBulletChanges(existing, input.changes)

  if (!nextBullet) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projectBullets: {
          ...data.projectBullets,
          [input.projectBulletId]: nextBullet,
        },
      },
      project.profileId,
      context.now(),
    ),
  )
}

export const deleteProjectBulletMutation = (data: AppDataState, projectBulletId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.projectBullets[projectBulletId]

  if (!existing) {
    return withResult(data)
  }

  const project = data.projects[existing.projectId]

  if (!project) {
    return withResult(data)
  }

  const nextProjectBullets = { ...data.projectBullets }
  delete nextProjectBullets[projectBulletId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projectBullets: nextProjectBullets,
      },
      project.profileId,
      context.now(),
    ),
  )
}

export const reorderProjectBulletsMutation = (data: AppDataState, input: ReorderProjectBulletsInput, context: ProfileMutationContext): ProfileMutationResult => {
  const project = data.projects[input.projectId]

  if (!project) {
    return withResult(data)
  }

  const existingIds = Object.values(data.projectBullets)
    .filter((item) => item.projectId === input.projectId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        projectBullets: reorderSortableEntities(data.projectBullets, input.orderedIds),
      },
      project.profileId,
      context.now(),
    ),
  )
}

export const createAdditionalExperienceEntryMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const additionalExperienceEntry: AdditionalExperienceEntry = {
    id: context.createId(),
    profileId,
    title: '',
    organization: '',
    location: '',
    startDate: null,
    endDate: null,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.additionalExperienceEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceEntries: {
          ...data.additionalExperienceEntries,
          [additionalExperienceEntry.id]: additionalExperienceEntry,
        },
      },
      profileId,
      context.now(),
    ),
    additionalExperienceEntry.id,
  )
}

export const updateAdditionalExperienceEntryMutation = (data: AppDataState, input: UpdateAdditionalExperienceEntryInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.additionalExperienceEntries[input.additionalExperienceEntryId]

  if (!existing) {
    return withResult(data)
  }

  const nextEntry = normalizeAdditionalExperienceEntry(existing, input.changes)

  if (!nextEntry) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceEntries: {
          ...data.additionalExperienceEntries,
          [input.additionalExperienceEntryId]: nextEntry,
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteAdditionalExperienceEntryMutation = (data: AppDataState, additionalExperienceEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.additionalExperienceEntries[additionalExperienceEntryId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(stampUpdatedProfile(deleteAdditionalExperienceEntryCascade(data, additionalExperienceEntryId), existing.profileId, context.now()))
}

export const reorderAdditionalExperienceEntriesMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.additionalExperienceEntries)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceEntries: reorderSortableEntities(data.additionalExperienceEntries, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createAdditionalExperienceBulletMutation = (data: AppDataState, additionalExperienceEntryId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const entry = data.additionalExperienceEntries[additionalExperienceEntryId]

  if (!entry) {
    return withResult(data, null)
  }

  const additionalExperienceBullet: AdditionalExperienceBullet = {
    id: context.createId(),
    additionalExperienceEntryId,
    content: '',
    level: 1,
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.additionalExperienceBullets)
        .filter((item) => item.additionalExperienceEntryId === additionalExperienceEntryId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceBullets: {
          ...data.additionalExperienceBullets,
          [additionalExperienceBullet.id]: additionalExperienceBullet,
        },
      },
      entry.profileId,
      context.now(),
    ),
    additionalExperienceBullet.id,
  )
}

export const updateAdditionalExperienceBulletMutation = (data: AppDataState, input: UpdateAdditionalExperienceBulletInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.additionalExperienceBullets[input.additionalExperienceBulletId]

  if (!existing) {
    return withResult(data)
  }

  const entry = data.additionalExperienceEntries[existing.additionalExperienceEntryId]

  if (!entry) {
    return withResult(data)
  }

  const nextBullet = mergeAdditionalExperienceBulletChanges(existing, input.changes)

  if (!nextBullet) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceBullets: {
          ...data.additionalExperienceBullets,
          [input.additionalExperienceBulletId]: nextBullet,
        },
      },
      entry.profileId,
      context.now(),
    ),
  )
}

export const deleteAdditionalExperienceBulletMutation = (data: AppDataState, additionalExperienceBulletId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.additionalExperienceBullets[additionalExperienceBulletId]

  if (!existing) {
    return withResult(data)
  }

  const entry = data.additionalExperienceEntries[existing.additionalExperienceEntryId]

  if (!entry) {
    return withResult(data)
  }

  const nextAdditionalExperienceBullets = { ...data.additionalExperienceBullets }
  delete nextAdditionalExperienceBullets[additionalExperienceBulletId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceBullets: nextAdditionalExperienceBullets,
      },
      entry.profileId,
      context.now(),
    ),
  )
}

export const reorderAdditionalExperienceBulletsMutation = (data: AppDataState, input: ReorderAdditionalExperienceBulletsInput, context: ProfileMutationContext): ProfileMutationResult => {
  const entry = data.additionalExperienceEntries[input.additionalExperienceEntryId]

  if (!entry) {
    return withResult(data)
  }

  const existingIds = Object.values(data.additionalExperienceBullets)
    .filter((item) => item.additionalExperienceEntryId === input.additionalExperienceEntryId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        additionalExperienceBullets: reorderSortableEntities(data.additionalExperienceBullets, input.orderedIds),
      },
      entry.profileId,
      context.now(),
    ),
  )
}

export const createCertificationMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const certification: Certification = {
    id: context.createId(),
    profileId,
    name: '',
    issuer: '',
    issueDate: null,
    expiryDate: null,
    credentialId: '',
    credentialUrl: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.certifications)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        certifications: {
          ...data.certifications,
          [certification.id]: certification,
        },
      },
      profileId,
      context.now(),
    ),
    certification.id,
  )
}

export const updateCertificationMutation = (data: AppDataState, input: UpdateCertificationInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.certifications[input.certificationId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        certifications: {
          ...data.certifications,
          [input.certificationId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteCertificationMutation = (data: AppDataState, certificationId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.certifications[certificationId]

  if (!existing) {
    return withResult(data)
  }

  const nextCertifications = { ...data.certifications }
  delete nextCertifications[certificationId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        certifications: nextCertifications,
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const reorderCertificationsMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.certifications)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        certifications: reorderSortableEntities(data.certifications, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}

export const createReferenceMutation = (data: AppDataState, profileId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const profile = data.profiles[profileId]

  if (!profile) {
    return withResult(data, null)
  }

  const reference: Reference = {
    id: context.createId(),
    profileId,
    type: 'professional',
    name: '',
    relationship: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    notes: '',
    enabled: true,
    sortOrder: getNextSortOrder(
      Object.values(data.references)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.sortOrder),
    ),
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        references: {
          ...data.references,
          [reference.id]: reference,
        },
      },
      profileId,
      context.now(),
    ),
    reference.id,
  )
}

export const updateReferenceMutation = (data: AppDataState, input: UpdateReferenceInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.references[input.referenceId]

  if (!existing) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        references: {
          ...data.references,
          [input.referenceId]: {
            ...existing,
            ...input.changes,
          },
        },
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const deleteReferenceMutation = (data: AppDataState, referenceId: Id, context: ProfileMutationContext): ProfileMutationResult => {
  const existing = data.references[referenceId]

  if (!existing) {
    return withResult(data)
  }

  const nextReferences = { ...data.references }
  delete nextReferences[referenceId]

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        references: nextReferences,
      },
      existing.profileId,
      context.now(),
    ),
  )
}

export const reorderReferencesMutation = (data: AppDataState, input: ReorderProfileEntitiesInput, context: ProfileMutationContext): ProfileMutationResult => {
  const existingIds = Object.values(data.references)
    .filter((item) => item.profileId === input.profileId)
    .map((item) => item.id)

  if (!hasExactIds(existingIds, input.orderedIds)) {
    return withResult(data)
  }

  return withResult(
    stampUpdatedProfile(
      {
        ...data,
        references: reorderSortableEntities(data.references, input.orderedIds),
      },
      input.profileId,
      context.now(),
    ),
  )
}