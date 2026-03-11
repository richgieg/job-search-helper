import { create } from 'zustand'

import { createDefaultResumeSettings, createDefaultUiState, createEmptyDataState, emptyProfileDefaults } from './create-initial-state'
import { normalizeResumeSectionLabel } from '../utils/resume-section-labels'
import type {
  Achievement,
  ApplicationQuestion,
  AppDataState,
  AppExportFile,
  AppUiState,
  Certification,
  ContactRelationshipType,
  EducationBullet,
  EducationEntry,
  EducationStatus,
  ExperienceBullet,
  ExperienceEntry,
  FinalOutcome,
  FinalOutcomeStatus,
  Id,
  Interview,
  InterviewContact,
  Job,
  JobContact,
  JobLink,
  PersonalDetails,
  Profile,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  ResumeSectionKey,
  ResumeSettings,
  Skill,
  SkillCategory,
  ThemePreference,
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
    setResumeSectionLabel: (input: { profileId: Id; section: ResumeSectionKey; label: string }) => void
    reorderResumeSections: (input: { profileId: Id; orderedSections: ResumeSectionKey[] }) => void
    duplicateProfile: (input: { sourceProfileId: Id; targetJobId?: Id | null; name?: string }) => Id | null
    deleteProfile: (profileId: Id) => void
    createProfileLink: (profileId: Id) => Id | null
    updateProfileLink: (input: {
      profileLinkId: Id
      changes: Partial<Pick<ProfileLink, 'name' | 'url' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteProfileLink: (profileLinkId: Id) => void
    reorderProfileLinks: (input: { profileId: Id; orderedIds: Id[] }) => void
    createSkillCategory: (profileId: Id) => Id | null
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
    createAchievement: (profileId: Id) => Id | null
    updateAchievement: (input: {
      achievementId: Id
      changes: Partial<Omit<Achievement, 'id' | 'profileId'>>
    }) => void
    deleteAchievement: (achievementId: Id) => void
    reorderAchievements: (input: { profileId: Id; orderedIds: Id[] }) => void
    createExperienceEntry: (profileId: Id) => Id | null
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
    createEducationEntry: (profileId: Id) => Id | null
    updateEducationEntry: (input: {
      educationEntryId: Id
      changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>
    }) => void
    deleteEducationEntry: (educationEntryId: Id) => void
    reorderEducationEntries: (input: { profileId: Id; orderedIds: Id[] }) => void
    createEducationBullet: (educationEntryId: Id) => void
    updateEducationBullet: (input: {
      educationBulletId: Id
      changes: Partial<Pick<EducationBullet, 'content' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteEducationBullet: (educationBulletId: Id) => void
    reorderEducationBullets: (input: { educationEntryId: Id; orderedIds: Id[] }) => void
    createProject: (profileId: Id) => Id | null
    updateProject: (input: {
      projectId: Id
      changes: Partial<Omit<Project, 'id' | 'profileId'>>
    }) => void
    deleteProject: (projectId: Id) => void
    reorderProjects: (input: { profileId: Id; orderedIds: Id[] }) => void
    createProjectBullet: (projectId: Id) => void
    updateProjectBullet: (input: {
      projectBulletId: Id
      changes: Partial<Pick<ProjectBullet, 'content' | 'enabled' | 'sortOrder'>>
    }) => void
    deleteProjectBullet: (projectBulletId: Id) => void
    reorderProjectBullets: (input: { projectId: Id; orderedIds: Id[] }) => void
    createCertification: (profileId: Id) => Id | null
    updateCertification: (input: {
      certificationId: Id
      changes: Partial<Omit<Certification, 'id' | 'profileId'>>
    }) => void
    deleteCertification: (certificationId: Id) => void
    reorderCertifications: (input: { profileId: Id; orderedIds: Id[] }) => void
    createReference: (profileId: Id) => Id | null
    updateReference: (input: {
      referenceId: Id
      changes: Partial<Omit<Reference, 'id' | 'profileId'>>
    }) => void
    deleteReference: (referenceId: Id) => void
    reorderReferences: (input: { profileId: Id; orderedIds: Id[] }) => void
    createJob: (input: Pick<Job, 'companyName' | 'jobTitle'> & Partial<Job> & { initialLinkUrl?: string }) => Id
    updateJob: (input: { jobId: Id; changes: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'appliedAt' | 'finalOutcome'>> }) => void
    deleteJob: (jobId: Id) => void
    createJobLink: (jobId: Id) => Id | null
    updateJobLink: (input: {
      jobLinkId: Id
      changes: Partial<Omit<JobLink, 'id' | 'jobId' | 'createdAt'>>
    }) => void
    deleteJobLink: (jobLinkId: Id) => void
    reorderJobLinks: (input: { jobId: Id; orderedIds: Id[] }) => void
    createJobContact: (jobId: Id) => Id | null
    updateJobContact: (input: { jobContactId: Id; changes: Partial<Omit<JobContact, 'id' | 'jobId'>> }) => void
    deleteJobContact: (jobContactId: Id) => void
    reorderJobContacts: (input: { jobId: Id; orderedIds: Id[] }) => void
    createApplicationQuestion: (jobId: Id) => Id | null
    updateApplicationQuestion: (input: {
      applicationQuestionId: Id
      changes: Partial<Omit<ApplicationQuestion, 'id' | 'jobId'>>
    }) => void
    deleteApplicationQuestion: (applicationQuestionId: Id) => void
    reorderApplicationQuestions: (input: { jobId: Id; orderedIds: Id[] }) => void
    setJobAppliedAt: (input: { jobId: Id; appliedAt: string }) => void
    clearJobAppliedAt: (jobId: Id) => void
    setJobFinalOutcome: (input: { jobId: Id; status: FinalOutcomeStatus; setAt: string }) => void
    clearJobFinalOutcome: (jobId: Id) => void
    createInterview: (jobId: Id) => Id | null
    updateInterview: (input: { interviewId: Id; changes: Partial<Omit<Interview, 'id' | 'jobId'>> }) => void
    deleteInterview: (interviewId: Id) => void
    addInterviewContact: (input: { interviewId: Id; jobContactId: Id }) => void
    removeInterviewContact: (interviewContactId: Id) => void
    reorderInterviewContacts: (input: { interviewId: Id; orderedIds: Id[] }) => void
    importAppData: (file: AppExportFile) => void
    exportAppData: () => AppExportFile
    resetUiState: () => void
    setThemePreference: (themePreference: ThemePreference) => void
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

const resumeSectionKeys: ResumeSectionKey[] = ['summary', 'skills', 'achievements', 'experience', 'education', 'projects', 'certifications', 'references']

const normalizeEducationEntry = (
  existing: EducationEntry,
  changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>,
): EducationEntry | null => {
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

const normalizeProject = (existing: Project, changes: Partial<Omit<Project, 'id' | 'profileId'>>): Project | null => {
  const nextProject: Project = {
    ...existing,
    ...changes,
  }

  if (nextProject.startDate && nextProject.endDate && nextProject.startDate > nextProject.endDate) {
    return null
  }

  return nextProject
}

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
  const clonedEducationEntryIds = new Map<Id, Id>()
  const clonedProjectIds = new Map<Id, Id>()
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

  Object.values(data.achievements)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const cloned: Achievement = {
        ...item,
        id: createId(),
        profileId: targetProfileId,
      }
      nextData.achievements[cloned.id] = cloned
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
      const newId = createId()
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
        id: createId(),
        educationEntryId: clonedEducationEntryIds.get(item.educationEntryId)!,
      }
      nextData.educationBullets[cloned.id] = cloned
    })

  Object.values(data.projects)
    .filter((item) => item.profileId === sourceProfileId)
    .forEach((item) => {
      const newId = createId()
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
        id: createId(),
        projectId: clonedProjectIds.get(item.projectId)!,
      }
      nextData.projectBullets[cloned.id] = cloned
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
  const projectIds = new Set(
    Object.values(data.projects)
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

const deleteInterviewCascade = (data: AppDataState, interviewId: Id): AppDataState => {
  const nextInterviews = { ...data.interviews }
  const nextInterviewContacts = { ...data.interviewContacts }

  delete nextInterviews[interviewId]

  Object.values(data.interviewContacts).forEach((item) => {
    if (item.interviewId === interviewId) {
      delete nextInterviewContacts[item.id]
    }
  })

  return {
    ...data,
    interviews: nextInterviews,
    interviewContacts: nextInterviewContacts,
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
    setResumeSectionLabel: ({ profileId, section, label }) => {
      const existingProfile = get().data.profiles[profileId]

      if (!existingProfile) {
        return
      }

      const nextLabel = normalizeResumeSectionLabel(section, label)

      if (existingProfile.resumeSettings.sections[section].label === nextLabel) {
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
                    label: nextLabel,
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
        resumeSettings: {
          sections: {
            summary: { ...sourceProfile.resumeSettings.sections.summary },
            skills: { ...sourceProfile.resumeSettings.sections.skills },
            achievements: { ...sourceProfile.resumeSettings.sections.achievements },
            experience: { ...sourceProfile.resumeSettings.sections.experience },
            education: { ...sourceProfile.resumeSettings.sections.education },
            projects: { ...sourceProfile.resumeSettings.sections.projects },
            certifications: { ...sourceProfile.resumeSettings.sections.certifications },
            references: { ...sourceProfile.resumeSettings.sections.references },
          },
        },
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
        return null
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

      return profileLink.id
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
        return null
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

      return skillCategory.id
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
    createAchievement: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
      }

      const achievement: Achievement = {
        id: createId(),
        profileId,
        name: '',
        description: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.achievements)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            achievements: {
              ...state.data.achievements,
              [achievement.id]: achievement,
            },
          },
          profileId,
          now(),
        ),
      }))

      return achievement.id
    },
    updateAchievement: ({ achievementId, changes }) => {
      const existing = get().data.achievements[achievementId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            achievements: {
              ...state.data.achievements,
              [achievementId]: {
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
    deleteAchievement: (achievementId) => {
      const existing = get().data.achievements[achievementId]

      if (!existing) {
        return
      }

      set((state) => {
        const nextAchievements = { ...state.data.achievements }
        delete nextAchievements[achievementId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              achievements: nextAchievements,
            },
            existing.profileId,
            now(),
          ),
        }
      })
    },
    reorderAchievements: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.achievements)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            achievements: reorderSortableEntities(state.data.achievements, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createExperienceEntry: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
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

      return experienceEntry.id
    },
    updateExperienceEntry: ({ experienceEntryId, changes }) => {
      const existing = get().data.experienceEntries[experienceEntryId]

      if (!existing) {
        return
      }

      const nextIsCurrent = changes.isCurrent ?? existing.isCurrent
      const nextChanges: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>> = {
        ...changes,
      }

      if (nextIsCurrent) {
        nextChanges.endDate = null
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            experienceEntries: {
              ...state.data.experienceEntries,
              [experienceEntryId]: {
                ...existing,
                ...nextChanges,
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
        return null
      }

      const educationEntry: EducationEntry = {
        id: createId(),
        profileId,
        school: '',
        degree: '',
        startDate: null,
        endDate: null,
        status: 'graduated' as EducationStatus,
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

      return educationEntry.id
    },
    updateEducationEntry: ({ educationEntryId, changes }) => {
      const existing = get().data.educationEntries[educationEntryId]

      if (!existing) {
        return
      }

      const nextEducationEntry = normalizeEducationEntry(existing, changes)

      if (!nextEducationEntry) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationEntries: {
              ...state.data.educationEntries,
              [educationEntryId]: nextEducationEntry,
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

      set((state) => ({
        data: stampUpdatedProfile(deleteEducationEntryCascade(state.data, educationEntryId), existing.profileId, now()),
      }))
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
    createEducationBullet: (educationEntryId) => {
      const educationEntry = get().data.educationEntries[educationEntryId]

      if (!educationEntry) {
        return
      }

      const educationBullet: EducationBullet = {
        id: createId(),
        educationEntryId,
        content: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.educationBullets)
            .filter((item) => item.educationEntryId === educationEntryId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationBullets: {
              ...state.data.educationBullets,
              [educationBullet.id]: educationBullet,
            },
          },
          educationEntry.profileId,
          now(),
        ),
      }))
    },
    updateEducationBullet: ({ educationBulletId, changes }) => {
      const existing = get().data.educationBullets[educationBulletId]

      if (!existing) {
        return
      }

      const educationEntry = get().data.educationEntries[existing.educationEntryId]

      if (!educationEntry) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationBullets: {
              ...state.data.educationBullets,
              [educationBulletId]: {
                ...existing,
                ...changes,
              },
            },
          },
          educationEntry.profileId,
          now(),
        ),
      }))
    },
    deleteEducationBullet: (educationBulletId) => {
      const existing = get().data.educationBullets[educationBulletId]

      if (!existing) {
        return
      }

      const educationEntry = get().data.educationEntries[existing.educationEntryId]

      if (!educationEntry) {
        return
      }

      set((state) => {
        const nextEducationBullets = { ...state.data.educationBullets }
        delete nextEducationBullets[educationBulletId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              educationBullets: nextEducationBullets,
            },
            educationEntry.profileId,
            now(),
          ),
        }
      })
    },
    reorderEducationBullets: ({ educationEntryId, orderedIds }) => {
      const educationEntry = get().data.educationEntries[educationEntryId]

      if (!educationEntry) {
        return
      }

      const existingIds = Object.values(get().data.educationBullets)
        .filter((item) => item.educationEntryId === educationEntryId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            educationBullets: reorderSortableEntities(state.data.educationBullets, orderedIds),
          },
          educationEntry.profileId,
          now(),
        ),
      }))
    },
    createProject: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
      }

      const project: Project = {
        id: createId(),
        profileId,
        name: '',
        organization: '',
        startDate: null,
        endDate: null,
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.projects)
            .filter((item) => item.profileId === profileId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projects: {
              ...state.data.projects,
              [project.id]: project,
            },
          },
          profileId,
          now(),
        ),
      }))

      return project.id
    },
    updateProject: ({ projectId, changes }) => {
      const existing = get().data.projects[projectId]

      if (!existing) {
        return
      }

      const nextProject = normalizeProject(existing, changes)

      if (!nextProject) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projects: {
              ...state.data.projects,
              [projectId]: nextProject,
            },
          },
          existing.profileId,
          now(),
        ),
      }))
    },
    deleteProject: (projectId) => {
      const existing = get().data.projects[projectId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(deleteProjectCascade(state.data, projectId), existing.profileId, now()),
      }))
    },
    reorderProjects: ({ profileId, orderedIds }) => {
      const existingIds = Object.values(get().data.projects)
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projects: reorderSortableEntities(state.data.projects, orderedIds),
          },
          profileId,
          now(),
        ),
      }))
    },
    createProjectBullet: (projectId) => {
      const project = get().data.projects[projectId]

      if (!project) {
        return
      }

      const projectBullet: ProjectBullet = {
        id: createId(),
        projectId,
        content: '',
        enabled: true,
        sortOrder: getNextSortOrder(
          Object.values(get().data.projectBullets)
            .filter((item) => item.projectId === projectId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projectBullets: {
              ...state.data.projectBullets,
              [projectBullet.id]: projectBullet,
            },
          },
          project.profileId,
          now(),
        ),
      }))
    },
    updateProjectBullet: ({ projectBulletId, changes }) => {
      const existing = get().data.projectBullets[projectBulletId]

      if (!existing) {
        return
      }

      const project = get().data.projects[existing.projectId]

      if (!project) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projectBullets: {
              ...state.data.projectBullets,
              [projectBulletId]: {
                ...existing,
                ...changes,
              },
            },
          },
          project.profileId,
          now(),
        ),
      }))
    },
    deleteProjectBullet: (projectBulletId) => {
      const existing = get().data.projectBullets[projectBulletId]

      if (!existing) {
        return
      }

      const project = get().data.projects[existing.projectId]

      if (!project) {
        return
      }

      set((state) => {
        const nextProjectBullets = { ...state.data.projectBullets }
        delete nextProjectBullets[projectBulletId]

        return {
          data: stampUpdatedProfile(
            {
              ...state.data,
              projectBullets: nextProjectBullets,
            },
            project.profileId,
            now(),
          ),
        }
      })
    },
    reorderProjectBullets: ({ projectId, orderedIds }) => {
      const project = get().data.projects[projectId]

      if (!project) {
        return
      }

      const existingIds = Object.values(get().data.projectBullets)
        .filter((item) => item.projectId === projectId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedProfile(
          {
            ...state.data,
            projectBullets: reorderSortableEntities(state.data.projectBullets, orderedIds),
          },
          project.profileId,
          now(),
        ),
      }))
    },
    createCertification: (profileId) => {
      const profile = get().data.profiles[profileId]

      if (!profile) {
        return null
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

      return certification.id
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
        return null
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

      return reference.id
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
        appliedAt: null,
        finalOutcome: null,
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
        const nextInterviews = { ...nextData.interviews }
        const nextInterviewContacts = { ...nextData.interviewContacts }
        const nextApplicationQuestions = { ...nextData.applicationQuestions }

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

        Object.values(nextData.interviews).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextInterviews[item.id]
          }
        })

        Object.values(nextData.interviewContacts).forEach((item) => {
          const interview = nextData.interviews[item.interviewId]

          if (interview?.jobId === jobId) {
            delete nextInterviewContacts[item.id]
          }
        })

        Object.values(nextData.applicationQuestions).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextApplicationQuestions[item.id]
          }
        })

        return {
          data: {
            ...nextData,
            jobs: nextJobs,
            jobLinks: nextJobLinks,
            jobContacts: nextJobContacts,
            interviews: nextInterviews,
            interviewContacts: nextInterviewContacts,
            applicationQuestions: nextApplicationQuestions,
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
        return null
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

      return jobLink.id
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
        return null
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

      return jobContact.id
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
        const nextInterviewContacts = { ...state.data.interviewContacts }
        delete nextJobContacts[jobContactId]

        Object.values(state.data.interviewContacts).forEach((item) => {
          if (item.jobContactId === jobContactId) {
            delete nextInterviewContacts[item.id]
          }
        })

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              jobContacts: nextJobContacts,
              interviewContacts: nextInterviewContacts,
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
        return null
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

      return applicationQuestion.id
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
    setJobAppliedAt: ({ jobId, appliedAt }) => {
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
              appliedAt,
              updatedAt: now(),
            },
          },
        },
      }))
    },
    clearJobAppliedAt: (jobId) => {
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
              appliedAt: null,
              finalOutcome: null,
              updatedAt: now(),
            },
          },
        },
      }))
    },
    setJobFinalOutcome: ({ jobId, status, setAt }) => {
      const existingJob = get().data.jobs[jobId]

      if (!existingJob || !existingJob.appliedAt) {
        return
      }

      const finalOutcome: FinalOutcome = { status, setAt }

      set((state) => ({
        data: {
          ...state.data,
          jobs: {
            ...state.data.jobs,
            [jobId]: {
              ...existingJob,
              finalOutcome,
              updatedAt: now(),
            },
          },
        },
      }))
    },
    clearJobFinalOutcome: (jobId) => {
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
              finalOutcome: null,
              updatedAt: now(),
            },
          },
        },
      }))
    },
    createInterview: (jobId) => {
      const job = get().data.jobs[jobId]

      if (!job) {
        return null
      }

      const timestamp = now()
      const interview: Interview = {
        id: createId(),
        jobId,
        startAt: null,
        notes: '',
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            interviews: {
              ...state.data.interviews,
              [interview.id]: interview,
            },
          },
          jobId,
          timestamp,
        ),
      }))

      return interview.id
    },
    updateInterview: ({ interviewId, changes }) => {
      const existing = get().data.interviews[interviewId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            interviews: {
              ...state.data.interviews,
              [interviewId]: {
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
    deleteInterview: (interviewId) => {
      const existing = get().data.interviews[interviewId]

      if (!existing) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(deleteInterviewCascade(state.data, interviewId), existing.jobId, now()),
      }))
    },
    addInterviewContact: ({ interviewId, jobContactId }) => {
      const interview = get().data.interviews[interviewId]
      const jobContact = get().data.jobContacts[jobContactId]

      if (!interview || !jobContact || interview.jobId !== jobContact.jobId) {
        return
      }

      const hasExistingAssociation = Object.values(get().data.interviewContacts).some(
        (item) => item.interviewId === interviewId && item.jobContactId === jobContactId,
      )

      if (hasExistingAssociation) {
        return
      }

      const interviewContact: InterviewContact = {
        id: createId(),
        interviewId,
        jobContactId,
        sortOrder: getNextSortOrder(
          Object.values(get().data.interviewContacts)
            .filter((item) => item.interviewId === interviewId)
            .map((item) => item.sortOrder),
        ),
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            interviewContacts: {
              ...state.data.interviewContacts,
              [interviewContact.id]: interviewContact,
            },
          },
          interview.jobId,
          now(),
        ),
      }))
    },
    removeInterviewContact: (interviewContactId) => {
      const existing = get().data.interviewContacts[interviewContactId]

      if (!existing) {
        return
      }

      const interview = get().data.interviews[existing.interviewId]

      if (!interview) {
        return
      }

      set((state) => {
        const nextInterviewContacts = { ...state.data.interviewContacts }
        delete nextInterviewContacts[interviewContactId]

        return {
          data: stampUpdatedJob(
            {
              ...state.data,
              interviewContacts: nextInterviewContacts,
            },
            interview.jobId,
            now(),
          ),
        }
      })
    },
    reorderInterviewContacts: ({ interviewId, orderedIds }) => {
      const interview = get().data.interviews[interviewId]

      if (!interview) {
        return
      }

      const existingIds = Object.values(get().data.interviewContacts)
        .filter((item) => item.interviewId === interviewId)
        .map((item) => item.id)

      if (!hasExactIds(existingIds, orderedIds)) {
        return
      }

      set((state) => ({
        data: stampUpdatedJob(
          {
            ...state.data,
            interviewContacts: reorderSortableEntities(state.data.interviewContacts, orderedIds),
          },
          interview.jobId,
          now(),
        ),
      }))
    },
    importAppData: (file) => {
      const currentThemePreference = get().ui.themePreference

      set({
        data: {
          version: 1,
          exportedAt: file.exportedAt,
          ...file.data,
        },
        ui: createDefaultUiState(currentThemePreference),
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
    resetUiState: () => set((state) => ({ ...state, ui: createDefaultUiState(state.ui.themePreference) })),
    setThemePreference: (themePreference) => set((state) => ({ ...state, ui: { ...state.ui, themePreference } })),
    selectJob: (jobId) => set((state) => ({ ...state, ui: { ...state.ui, selectedJobId: jobId } })),
    selectProfile: (profileId) =>
      set((state) => ({ ...state, ui: { ...state.ui, selectedProfileId: profileId } })),
  },
}))
