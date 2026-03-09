import { create } from 'zustand'

import { createDefaultResumeSettings, createDefaultUiState, createEmptyDataState, emptyProfileDefaults } from './create-initial-state'
import type {
  ApplicationQuestion,
  AppDataState,
  AppExportFile,
  AppUiState,
  Certification,
  ContactRelationshipType,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  Id,
  Job,
  JobContact,
  JobEvent,
  JobEventType,
  JobLink,
  PersonalDetails,
  Profile,
  ProfileLink,
  Reference,
  ResumeSectionKey,
  ResumeSettings,
  Skill,
  SkillCategory,
} from '../types/state'

interface AppStoreState {
  data: AppDataState
  ui: AppUiState
  actions: {
    createBaseProfile: (name: string) => void
    updateProfile: (input: {
      profileId: Id
      changes: Partial<Pick<Profile, 'name' | 'summary' | 'coverLetter'>>
      personalDetails?: Partial<PersonalDetails>
    }) => void
    setResumeSectionEnabled: (input: { profileId: Id; section: ResumeSectionKey; enabled: boolean }) => void
    reorderResumeSections: (input: { profileId: Id; orderedSections: ResumeSectionKey[] }) => void
    duplicateProfile: (input: { sourceProfileId: Id; targetJobId?: Id | null; name?: string }) => Id | null
    deleteProfile: (profileId: Id) => void
    createProfileLink: (profileId: Id) => void
    updateProfileLink: (input: {
      profileLinkId: Id
      changes: Partial<Pick<ProfileLink, 'name' | 'url' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteProfileLink: (profileLinkId: Id) => void
    reorderProfileLinks: (input: { profileId: Id; orderedIds: Id[] }) => void
    createSkillCategory: (profileId: Id) => void
    updateSkillCategory: (input: {
      skillCategoryId: Id
      changes: Partial<Pick<SkillCategory, 'name' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteSkillCategory: (skillCategoryId: Id) => void
    reorderSkillCategories: (input: { profileId: Id; orderedIds: Id[] }) => void
    createSkill: (skillCategoryId: Id) => void
    updateSkill: (input: { skillId: Id; changes: Partial<Pick<Skill, 'name' | 'enabled' | 'sortOrder'>> }) => void
    deleteSkill: (skillId: Id) => void
    reorderSkills: (input: { skillCategoryId: Id; orderedIds: Id[] }) => void
    createExperienceEntry: (profileId: Id) => void
    updateExperienceEntry: (input: {
      experienceEntryId: Id
      changes: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>>
    }) => void
    deleteExperienceEntry: (experienceEntryId: Id) => void
    reorderExperienceEntries: (input: { profileId: Id; orderedIds: Id[] }) => void
    createExperienceBullet: (experienceEntryId: Id) => void
    updateExperienceBullet: (input: {
      experienceBulletId: Id
      changes: Partial<Pick<ExperienceBullet, 'content' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteExperienceBullet: (experienceBulletId: Id) => void
    reorderExperienceBullets: (input: { experienceEntryId: Id; orderedIds: Id[] }) => void
    createEducationEntry: (profileId: Id) => void
    updateEducationEntry: (input: {
      educationEntryId: Id
      changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>
    }) => void
    deleteEducationEntry: (educationEntryId: Id) => void
    reorderEducationEntries: (input: { profileId: Id; orderedIds: Id[] }) => void
    createCertification: (profileId: Id) => void
    updateCertification: (input: {
      certificationId: Id
      changes: Partial<Omit<Certification, 'id' | 'profileId'>>
    }) => void
    deleteCertification: (certificationId: Id) => void
    reorderCertifications: (input: { profileId: Id; orderedIds: Id[] }) => void
    createReference: (profileId: Id) => void
    updateReference: (input: {
      referenceId: Id
      changes: Partial<Omit<Reference, 'id' | 'profileId'>>
    }) => void
    deleteReference: (referenceId: Id) => void
    reorderReferences: (input: { profileId: Id; orderedIds: Id[] }) => void
    createJob: (input: Pick<Job, 'companyName' | 'jobTitle'> & Partial<Job> & { initialLinkUrl?: string }) => Id
    updateJob: (input: { jobId: Id; changes: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>> }) => void
    deleteJob: (jobId: Id) => void
    createJobLink: (jobId: Id) => void
    updateJobLink: (input: {
      jobLinkId: Id
      changes: Partial<Omit<JobLink, 'id' | 'jobId' | 'createdAt'>>
    }) => void
    deleteJobLink: (jobLinkId: Id) => void
    reorderJobLinks: (input: { jobId: Id; orderedIds: Id[] }) => void
    createJobContact: (jobId: Id) => void
    updateJobContact: (input: { jobContactId: Id; changes: Partial<Omit<JobContact, 'id' | 'jobId'>> }) => void
    deleteJobContact: (jobContactId: Id) => void
    reorderJobContacts: (input: { jobId: Id; orderedIds: Id[] }) => void
    createApplicationQuestion: (jobId: Id) => void
    updateApplicationQuestion: (input: {
      applicationQuestionId: Id
      changes: Partial<Omit<ApplicationQuestion, 'id' | 'jobId'>>
    }) => void
    deleteApplicationQuestion: (applicationQuestionId: Id) => void
    reorderApplicationQuestions: (input: { jobId: Id; orderedIds: Id[] }) => void
    createJobEvent: (input: { jobId: Id; eventType?: JobEventType }) => void
    updateJobEvent: (input: { jobEventId: Id; changes: Partial<Omit<JobEvent, 'id' | 'jobId' | 'createdAt'>> }) => void
    deleteJobEvent: (jobEventId: Id) => void
    importAppData: (file: AppExportFile) => void
    exportAppData: () => AppExportFile
    resetUiState: () => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

const now = () => new Date().toISOString()
const createId = () => crypto.randomUUID()

const getNextSortOrder = (sortOrders: number[]) => {
  if (sortOrders.length === 0) {
    return 1
  }

  return Math.max(...sortOrders) + 1
}

const hasExactIds = (expectedIds: Id[], orderedIds: Id[]) => {
  if (expectedIds.length !== orderedIds.length) {
    return false
  }

  const expectedIdSet = new Set(expectedIds)
  const orderedIdSet = new Set(orderedIds)

  if (expectedIdSet.size !== orderedIdSet.size) {
    return false
  }

  return expectedIds.every((id) => orderedIdSet.has(id))
}

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

const resumeSectionKeys: ResumeSectionKey[] = ['summary', 'skills', 'experience', 'education', 'certifications', 'references']

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

const normalizeResumeSettings = (resumeSettings?: ResumeSettings): ResumeSettings => {
  const defaults = createDefaultResumeSettings()

  if (!resumeSettings) {
    return defaults
  }

  const sections = resumeSectionKeys.reduce<Record<ResumeSectionKey, { enabled: boolean; sortOrder: number }>>((accumulator, section) => {
    const sourceSection = resumeSettings.sections?.[section]
    const defaultSection = defaults.sections[section]

    accumulator[section] = {
      enabled: sourceSection?.enabled ?? defaultSection.enabled,
      sortOrder: sourceSection?.sortOrder ?? defaultSection.sortOrder,
    }

    return accumulator
  }, {} as Record<ResumeSectionKey, { enabled: boolean; sortOrder: number }>)

  const orderedSections = resumeSectionKeys
    .slice()
    .sort((left, right) => sections[left].sortOrder - sections[right].sortOrder)

  orderedSections.forEach((section, index) => {
    sections[section] = {
      ...sections[section],
      sortOrder: index + 1,
    }
  })

  return {
    sections,
  }
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

const stampUpdatedJob = (data: AppDataState, jobId: Id, timestamp: string): AppDataState => {
  const job = data.jobs[jobId]

  if (!job) {
    return data
  }

  return {
    ...data,
    jobs: {
      ...data.jobs,
      [jobId]: {
        ...job,
        updatedAt: timestamp,
      },
    },
  }
}

const cloneProfileChildren = (data: AppDataState, sourceProfileId: Id, targetProfileId: Id): AppDataState => {
  const clonedSkillCategoryIds = new Map<Id, Id>()
  const clonedExperienceEntryIds = new Map<Id, Id>()
  const nextData: AppDataState = {
    ...data,
    profileLinks: { ...data.profileLinks },
    skillCategories: { ...data.skillCategories },
    skills: { ...data.skills },
    experienceEntries: { ...data.experienceEntries },
    experienceBullets: { ...data.experienceBullets },
    educationEntries: { ...data.educationEntries },
    certifications: { ...data.certifications },
    references: { ...data.references },
  }
  const timestamp = now()

  Object.values(data.profileLinks)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: ProfileLink = {
        ...item,
        id: createId(),
        profileId: targetProfileId,
      }
      nextData.profileLinks[cloned.id] = cloned
    })

  Object.values(data.skillCategories)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = createId()
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
        id: createId(),
        skillCategoryId: clonedSkillCategoryIds.get(item.skillCategoryId)!,
      }
      nextData.skills[cloned.id] = cloned
    })

  Object.values(data.experienceEntries)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = createId()
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
        id: createId(),
        experienceEntryId: clonedExperienceEntryIds.get(item.experienceEntryId)!,
      }
      nextData.experienceBullets[cloned.id] = cloned
    })

  Object.values(data.educationEntries)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: EducationEntry = {
        ...item,
        id: createId(),
        profileId: targetProfileId,
      }
      nextData.educationEntries[cloned.id] = cloned
    })

  Object.values(data.certifications)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Certification = {
        ...item,
        id: createId(),
        profileId: targetProfileId,
      }
      nextData.certifications[cloned.id] = cloned
    })

  Object.values(data.references)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Reference = {
        ...item,
        id: createId(),
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

  const nextProfiles = { ...data.profiles }
  const nextProfileLinks = { ...data.profileLinks }
  const nextSkillCategories = { ...data.skillCategories }
  const nextSkills = { ...data.skills }
  const nextExperienceEntries = { ...data.experienceEntries }
  const nextExperienceBullets = { ...data.experienceBullets }
  const nextEducationEntries = { ...data.educationEntries }
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
    experienceEntries: nextExperienceEntries,
    experienceBullets: nextExperienceBullets,
    educationEntries: nextEducationEntries,
    certifications: nextCertifications,
    references: nextReferences,
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

const createProfileRecord = (name: string): Profile => {
  const timestamp = now()

  return {
    id: createId(),
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

export const useAppStore = create<AppStoreState>((set, get) => ({
  data: createEmptyDataState(),
  ui: createDefaultUiState(),
  actions: {
    createBaseProfile: (name) => {
      const profile = createProfileRecord(name)

      set((state) => ({
        data: {
          ...state.data,
          profiles: {
            ...state.data.profiles,
            [profile.id]: profile,
          },
        },
        ui: {
          ...state.ui,
          selectedProfileId: profile.id,
        },
      }))
    },
    updateProfile: ({ profileId, changes, personalDetails }) => {
      const existingProfile = get().data.profiles[profileId]

      if (!existingProfile) {
        return
      }

      set((state) => ({
        data: {
          ...state.data,
          profiles: {
            ...state.data.profiles,
            [profileId]: {
              ...existingProfile,
              ...changes,
              personalDetails: {
                ...existingProfile.personalDetails,
                ...personalDetails,
              },
              updatedAt: now(),
            },
          },
        },
      }))
    },
    setResumeSectionEnabled: ({ profileId, section, enabled }) => {
      const existingProfile = get().data.profiles[profileId]

      if (!existingProfile) {
        return
      }

      set((state) => ({
        data: {
          ...state.data,
          profiles: {
            ...state.data.profiles,
            [profileId]: {
              ...existingProfile,
              resumeSettings: {
                sections: {
                  ...existingProfile.resumeSettings.sections,
                  [section]: {
                    ...existingProfile.resumeSettings.sections[section],
                    enabled,
                  },
                },
              },
              updatedAt: now(),
            },
          },
        },
      }))
    },
    reorderResumeSections: ({ profileId, orderedSections }) => {
      const existingProfile = get().data.profiles[profileId]

      if (!existingProfile || !hasExactResumeSections(orderedSections)) {
        return
      }

      set((state) => {
        const nextSections = orderedSections.reduce<ResumeSettings['sections']>((accumulator, section, index) => {
          accumulator[section] = {
            ...existingProfile.resumeSettings.sections[section],
            sortOrder: index + 1,
          }

          return accumulator
        }, {} as ResumeSettings['sections'])

        return {
          data: {
            ...state.data,
            profiles: {
              ...state.data.profiles,
              [profileId]: {
                ...existingProfile,
                resumeSettings: {
                  sections: nextSections,
                },
                updatedAt: now(),
              },
            },
          },
        }
      })
    },
    duplicateProfile: ({ sourceProfileId, targetJobId, name }) => {
      const sourceProfile = get().data.profiles[sourceProfileId]

      if (!sourceProfile) {
        return null
      }

      const timestamp = now()
      const nextName = name?.trim()
        ? name.trim()
        : sourceProfile.jobId === null && targetJobId !== undefined && targetJobId !== null
          ? sourceProfile.name
          : `${sourceProfile.name} Copy`

      const clonedProfile: Profile = {
        ...sourceProfile,
        id: createId(),
        name: nextName,
        resumeSettings: normalizeResumeSettings(sourceProfile.resumeSettings),
        jobId: targetJobId === undefined ? sourceProfile.jobId : targetJobId,
        clonedFromProfileId: sourceProfileId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      set((state) => {
        const withProfile: AppDataState = {
          ...state.data,
          profiles: {
            ...state.data.profiles,
            [clonedProfile.id]: clonedProfile,
          },
        }

        const nextData = cloneProfileChildren(withProfile, sourceProfileId, clonedProfile.id)

        return {
          data: nextData,
          ui: {
            ...state.ui,
            selectedProfileId: clonedProfile.id,
            selectedJobId: clonedProfile.jobId ?? state.ui.selectedJobId,
          },
        }
      })

      return clonedProfile.id
    },
    deleteProfile: (profileId) => {
      set((state) => ({
        data: deleteProfileCascade(state.data, profileId),
        ui: {
          ...state.ui,
          selectedProfileId: state.ui.selectedProfileId === profileId ? null : state.ui.selectedProfileId,
        },
      }))
    },
    createProfileLink: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const profileLink: ProfileLink = {
        id: createId(),
        profileId,
        name: '',
        url: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.profileLinks)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            profileLinks: {
              ...state.data.profileLinks,
              [profileLink.id]: profileLink,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateProfileLink: ({ profileLinkId, changes }) => {
      const existing = get().data.profileLinks[profileLinkId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            profileLinks: {
              ...state.data.profileLinks,
              [profileLinkId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteProfileLink: (profileLinkId) => {
      const existing = get().data.profileLinks[profileLinkId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextProfileLinks = { ...state.data.profileLinks }
        delete nextProfileLinks[profileLinkId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              profileLinks: nextProfileLinks,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderProfileLinks: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.profileLinks)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            profileLinks: reorderSortableEntities(state.data.profileLinks, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createSkillCategory: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const skillCategory: SkillCategory = {
        id: createId(),
        profileId,
        name: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.skillCategories)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skillCategories: {
              ...state.data.skillCategories,
              [skillCategory.id]: skillCategory,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateSkillCategory: ({ skillCategoryId, changes }) => {
      const existing = get().data.skillCategories[skillCategoryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skillCategories: {
              ...state.data.skillCategories,
              [skillCategoryId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteSkillCategory: (skillCategoryId) => {
      const existing = get().data.skillCategories[skillCategoryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(deleteSkillCategoryCascade(state.data, skillCategoryId), existing.profileId, now()),
      }))
    },
    reorderSkillCategories: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.skillCategories)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skillCategories: reorderSortableEntities(state.data.skillCategories, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createSkill: (skillCategoryId) => {
      const category = get().data.skillCategories[skillCategoryId]

      if (!category) {
        return
      }

      const skill: Skill = {
        id: createId(),
        skillCategoryId,
        name: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.skills)
            .filter((item) => item.skillCategoryId === skillCategoryId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skills: {
              ...state.data.skills,
              [skill.id]: skill,
            },
          },
          category.profileId,
          now(),
        ),
      }))
    },
    updateSkill: ({ skillId, changes }) => {
      const existing = get().data.skills[skillId]

      if (!existing) {
        return
      }

      const category = get().data.skillCategories[existing.skillCategoryId]
      if (!category) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skills: {
              ...state.data.skills,
              [skillId]: {
                ...existing,
                ...changes,
              },
            },
          },
          category.profileId,
          now(),
        ),
      }))
    },
    deleteSkill: (skillId) => {
      const existing = get().data.skills[skillId]

      if (!existing) {
        return
      }

      const category = get().data.skillCategories[existing.skillCategoryId]
      if (!category) {
        return
      }

      set((state) => {
        const nextSkills = { ...state.data.skills }
        delete nextSkills[skillId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              skills: nextSkills,
            },
            category.profileId,
            now(),
          ),
        }
      })
    },
    reorderSkills: ({ skillCategoryId, orderedIds }) => {
      const category = get().data.skillCategories[skillCategoryId]

      if (!category) {
        return
      }

      const existingIds = Object.values(get().data.skills)
        .filter((item) => item.skillCategoryId === skillCategoryId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            skills: reorderSortableEntities(state.data.skills, orderedIds),
          },
          category.profileId,
          now(),
        ),
      }))
    },
    createExperienceEntry: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const experienceEntry: ExperienceEntry = {
        id: createId(),
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
          Object.values(get().data.experienceEntries)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceEntries: {
              ...state.data.experienceEntries,
              [experienceEntry.id]: experienceEntry,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateExperienceEntry: ({ experienceEntryId, changes }) => {
      const existing = get().data.experienceEntries[experienceEntryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceEntries: {
              ...state.data.experienceEntries,
              [experienceEntryId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteExperienceEntry: (experienceEntryId) => {
      const existing = get().data.experienceEntries[experienceEntryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(deleteExperienceEntryCascade(state.data, experienceEntryId), existing.profileId, now()),
      }))
    },
    reorderExperienceEntries: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.experienceEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceEntries: reorderSortableEntities(state.data.experienceEntries, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createExperienceBullet: (experienceEntryId) => {
      const experienceEntry = get().data.experienceEntries[experienceEntryId]

      if (!experienceEntry) {
        return
      }

      const experienceBullet: ExperienceBullet = {
        id: createId(),
        experienceEntryId,
        content: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.experienceBullets)
            .filter((item) => item.experienceEntryId === experienceEntryId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceBullets: {
              ...state.data.experienceBullets,
              [experienceBullet.id]: experienceBullet,
            },
          },
          experienceEntry.profileId,
          now(),
        ),
      }))
    },
    updateExperienceBullet: ({ experienceBulletId, changes }) => {
      const existing = get().data.experienceBullets[experienceBulletId]

      if (!existing) {
        return
      }

      const experienceEntry = get().data.experienceEntries[existing.experienceEntryId]

      if (!experienceEntry) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceBullets: {
              ...state.data.experienceBullets,
              [experienceBulletId]: {
                ...existing,
                ...changes,
              },
            },
          },
          experienceEntry.profileId,
          now(),
        ),
      }))
    },
    deleteExperienceBullet: (experienceBulletId) => {
      const existing = get().data.experienceBullets[experienceBulletId]

      if (!existing) {
        return
      }

      const experienceEntry = get().data.experienceEntries[existing.experienceEntryId]

      if (!experienceEntry) {
        return
      }

      set((state) => {
        const nextExperienceBullets = { ...state.data.experienceBullets }
        delete nextExperienceBullets[experienceBulletId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              experienceBullets: nextExperienceBullets,
            },
            experienceEntry.profileId,
            now(),
          ),
        }
      })
    },
    reorderExperienceBullets: ({ experienceEntryId, orderedIds }) => {
      const experienceEntry = get().data.experienceEntries[experienceEntryId]

      if (!experienceEntry) {
        return
      }

      const existingIds = Object.values(get().data.experienceBullets)
        .filter((item) => item.experienceEntryId === experienceEntryId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceBullets: reorderSortableEntities(state.data.experienceBullets, orderedIds),
          },
          experienceEntry.profileId,
          now(),
        ),
      }))
    },
    createEducationEntry: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const educationEntry: EducationEntry = {
        id: createId(),
        profileId,
        school: '',
        degree: '',
        graduationDate: null,
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.educationEntries)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationEntries: {
              ...state.data.educationEntries,
              [educationEntry.id]: educationEntry,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateEducationEntry: ({ educationEntryId, changes }) => {
      const existing = get().data.educationEntries[educationEntryId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationEntries: {
              ...state.data.educationEntries,
              [educationEntryId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteEducationEntry: (educationEntryId) => {
      const existing = get().data.educationEntries[educationEntryId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextEducationEntries = { ...state.data.educationEntries }
        delete nextEducationEntries[educationEntryId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              educationEntries: nextEducationEntries,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderEducationEntries: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.educationEntries)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationEntries: reorderSortableEntities(state.data.educationEntries, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createCertification: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const certification: Certification = {
        id: createId(),
        profileId,
        name: '',
        issuer: '',
        issueDate: null,
        expiryDate: null,
        credentialId: '',
        credentialUrl: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.certifications)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: {
              ...state.data.certifications,
              [certification.id]: certification,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateCertification: ({ certificationId, changes }) => {
      const existing = get().data.certifications[certificationId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: {
              ...state.data.certifications,
              [certificationId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteCertification: (certificationId) => {
      const existing = get().data.certifications[certificationId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextCertifications = { ...state.data.certifications }
        delete nextCertifications[certificationId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              certifications: nextCertifications,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderCertifications: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.certifications)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            certifications: reorderSortableEntities(state.data.certifications, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createReference: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return
      }

      const reference: Reference = {
        id: createId(),
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
          Object.values(get().data.references)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: {
              ...state.data.references,
              [reference.id]: reference,
            },
          },
          profileId,
          now(),
        ),
      }))
    },
    updateReference: ({ referenceId, changes }) => {
      const existing = get().data.references[referenceId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: {
              ...state.data.references,
              [referenceId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteReference: (referenceId) => {
      const existing = get().data.references[referenceId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextReferences = { ...state.data.references }
        delete nextReferences[referenceId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              references: nextReferences,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderReferences: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.references)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            references: reorderSortableEntities(state.data.references, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createJob: (input) => {
      const timestamp = now()
      const initialLinkUrl = input.initialLinkUrl?.trim() ?? ''
      const job: Job = {
        id: createId(),
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        description: input.description ?? '',
        location: input.location ?? '',
        postedCompensation: input.postedCompensation ?? '',
        desiredCompensation: input.desiredCompensation ?? '',
        compensationNotes: input.compensationNotes ?? '',
        workArrangement: input.workArrangement ?? 'unknown',
        employmentType: input.employmentType ?? 'other',
        datePosted: input.datePosted ?? null,
        notes: input.notes ?? '',
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      const initialJobLink: JobLink | null = initialLinkUrl
        ? {
            id: createId(),
            jobId: job.id,
            url: initialLinkUrl,
            sortOrder: 1,
            createdAt: timestamp,
          }
        : null

      set((state) => ({
        data: {
          ...state.data,
          jobs: {
            ...state.data.jobs,
            [job.id]: job,
          },
          jobLinks: initialJobLink
            ? {
                ...state.data.jobLinks,
                [initialJobLink.id]: initialJobLink,
              }
            : state.data.jobLinks,
        },
        ui: {
          ...state.ui,
          selectedJobId: job.id,
        },
      }))

      return job.id
    },
    updateJob: ({ jobId, changes }) => {
      const existingJob = get().data.jobs[jobId]

      if (!existingJob) {
        return
      }

      set((state) => ({
        data: {
          ...state.data,
          jobs: {
            ...state.data.jobs,
            [jobId]: {
              ...existingJob,
              ...changes,
              updatedAt: now(),
            },
          },
        },
      }))
    },
    deleteJob: (jobId) => {
      set((state) => {
        let nextData = state.data

        Object.values(state.data.profiles)
          .filter((profile) => profile.jobId === jobId)
          .forEach((profile) => {
            nextData = deleteProfileCascade(nextData, profile.id)
          })

        const nextJobs = { ...nextData.jobs }
        const nextJobLinks = { ...nextData.jobLinks }
        const nextJobContacts = { ...nextData.jobContacts }
        const nextApplicationQuestions = { ...nextData.applicationQuestions }
        const nextJobEvents = { ...nextData.jobEvents }

        delete nextJobs[jobId]

        Object.values(nextData.jobLinks).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextJobLinks[item.id]
          }
        })

        Object.values(nextData.jobContacts).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextJobContacts[item.id]
          }
        })

        Object.values(nextData.applicationQuestions).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextApplicationQuestions[item.id]
          }
        })

        Object.values(nextData.jobEvents).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextJobEvents[item.id]
          }
        })

        return {
          data: {
            ...nextData,
            jobs: nextJobs,
            jobLinks: nextJobLinks,
            jobContacts: nextJobContacts,
            applicationQuestions: nextApplicationQuestions,
            jobEvents: nextJobEvents,
          },
          ui: {
            ...state.ui,
            selectedJobId: state.ui.selectedJobId === jobId ? null : state.ui.selectedJobId,
            selectedProfileId:
              state.ui.selectedProfileId && nextData.profiles[state.ui.selectedProfileId] === undefined
                ? null
                : state.ui.selectedProfileId,
          },
        }
      })
    },
    createJobLink: (jobId) => {
      const job = get().data.jobs[jobId]

      if (!job) {
        return
      }

      const jobLink: JobLink = {
        id: createId(),
        jobId,
        url: '',
        sortOrder: getNextSortOrder(
          Object.values(get().data.jobLinks)
            .filter((item) => item.jobId === jobId)
            .map((item) => item.sortOrder),
        ),
        createdAt: now(),
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobLinks: {
              ...state.data.jobLinks,
              [jobLink.id]: jobLink,
            },
          },
          jobId,
          now(),
        ),
      }))
    },
    updateJobLink: ({ jobLinkId, changes }) => {
      const existing = get().data.jobLinks[jobLinkId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobLinks: {
              ...state.data.jobLinks,
              [jobLinkId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.jobId,
          now(),
        ),
      }))
    },
    deleteJobLink: (jobLinkId) => {
      const existing = get().data.jobLinks[jobLinkId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextJobLinks = { ...state.data.jobLinks }
        delete nextJobLinks[jobLinkId]

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              jobLinks: nextJobLinks,
            },
            existing.jobId,
            now(),
          ),
        }
      })
    },
    reorderJobLinks: ({ jobId, orderedIds }) => {
      const existingIds = Object.values(get().data.jobLinks)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobLinks: reorderSortableEntities(state.data.jobLinks, orderedIds),
          },
          jobId,
          now(),
        ),
      }))
    },
    createJobContact: (jobId) => {
      const job = get().data.jobs[jobId]

      if (!job) {
        return
      }

      const jobContact: JobContact = {
        id: createId(),
        jobId,
        name: '',
        title: '',
        company: job.companyName,
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        addressLine4: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        relationshipType: 'recruiter' satisfies ContactRelationshipType,
        notes: '',
        sortOrder: getNextSortOrder(
          Object.values(get().data.jobContacts)
            .filter((item) => item.jobId === jobId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobContacts: {
              ...state.data.jobContacts,
              [jobContact.id]: jobContact,
            },
          },
          jobId,
          now(),
        ),
      }))
    },
    updateJobContact: ({ jobContactId, changes }) => {
      const existing = get().data.jobContacts[jobContactId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobContacts: {
              ...state.data.jobContacts,
              [jobContactId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.jobId,
          now(),
        ),
      }))
    },
    deleteJobContact: (jobContactId) => {
      const existing = get().data.jobContacts[jobContactId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextJobContacts = { ...state.data.jobContacts }
        delete nextJobContacts[jobContactId]

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              jobContacts: nextJobContacts,
            },
            existing.jobId,
            now(),
          ),
        }
      })
    },
    reorderJobContacts: ({ jobId, orderedIds }) => {
      const existingIds = Object.values(get().data.jobContacts)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobContacts: reorderSortableEntities(state.data.jobContacts, orderedIds),
          },
          jobId,
          now(),
        ),
      }))
    },
    createApplicationQuestion: (jobId) => {
      const job = get().data.jobs[jobId]

      if (!job) {
        return
      }

      const applicationQuestion: ApplicationQuestion = {
        id: createId(),
        jobId,
        question: '',
        answer: '',
        sortOrder: getNextSortOrder(
          Object.values(get().data.applicationQuestions)
            .filter((item) => item.jobId === jobId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            applicationQuestions: {
              ...state.data.applicationQuestions,
              [applicationQuestion.id]: applicationQuestion,
            },
          },
          jobId,
          now(),
        ),
      }))
    },
    updateApplicationQuestion: ({ applicationQuestionId, changes }) => {
      const existing = get().data.applicationQuestions[applicationQuestionId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            applicationQuestions: {
              ...state.data.applicationQuestions,
              [applicationQuestionId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.jobId,
          now(),
        ),
      }))
    },
    deleteApplicationQuestion: (applicationQuestionId) => {
      const existing = get().data.applicationQuestions[applicationQuestionId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextApplicationQuestions = { ...state.data.applicationQuestions }
        delete nextApplicationQuestions[applicationQuestionId]

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              applicationQuestions: nextApplicationQuestions,
            },
            existing.jobId,
            now(),
          ),
        }
      })
    },
    reorderApplicationQuestions: ({ jobId, orderedIds }) => {
      const existingIds = Object.values(get().data.applicationQuestions)
        .filter((item) => item.jobId === jobId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            applicationQuestions: reorderSortableEntities(state.data.applicationQuestions, orderedIds),
          },
          jobId,
          now(),
        ),
      }))
    },
    createJobEvent: ({ jobId, eventType = 'job_saved' }) => {
      const job = get().data.jobs[jobId]

      if (!job) {
        return
      }

      const timestamp = now()
      const jobEvent: JobEvent = {
        id: createId(),
        jobId,
        eventType,
        occurredAt: timestamp,
        scheduledFor: null,
        notes: '',
        metadata: {},
        createdAt: timestamp,
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobEvents: {
              ...state.data.jobEvents,
              [jobEvent.id]: jobEvent,
            },
          },
          jobId,
          timestamp,
        ),
      }))
    },
    updateJobEvent: ({ jobEventId, changes }) => {
      const existing = get().data.jobEvents[jobEventId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            jobEvents: {
              ...state.data.jobEvents,
              [jobEventId]: {
                ...existing,
                ...changes,
              },
            },
          },
          existing.jobId,
          now(),
        ),
      }))
    },
    deleteJobEvent: (jobEventId) => {
      const existing = get().data.jobEvents[jobEventId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextJobEvents = { ...state.data.jobEvents }
        delete nextJobEvents[jobEventId]

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              jobEvents: nextJobEvents,
            },
            existing.jobId,
            now(),
          ),
        }
      })
    },
    importAppData: (file) => {
      set({
        data: {
          version: 1,
          exportedAt: file.exportedAt,
          ...file.data,
          profiles: Object.fromEntries(
            Object.entries(file.data.profiles ?? {}).map(([profileId, profile]) => [
              profileId,
              {
                ...profile,
                resumeSettings: normalizeResumeSettings(profile.resumeSettings),
              },
            ]),
          ),
          profileLinks: file.data.profileLinks ?? {},
          jobLinks: file.data.jobLinks ?? {},
          applicationQuestions: file.data.applicationQuestions ?? {},
        },
        ui: createDefaultUiState(),
      })
    },
    exportAppData: () => {
      const state = get()
      const exportedAt = now()

      return {
        version: 1,
        exportedAt,
        data: {
          ...state.data,
        },
      }
    },
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState() })),
    selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
    selectProfile: (profileId) =>
      set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
  },
}))
