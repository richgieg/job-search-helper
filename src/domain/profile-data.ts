import { createDefaultResumeSettings, emptyProfileDefaults } from '../store/create-initial-state'
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