import { create } from 'zustand'

import { createDefaultUiState, createEmptyDataState, emptyProfileDefaults } from './create-initial-state'
import type {
  AppDataState,
  AppExportFile,
  AppUiState,
  Certification,
  EducationEntry,
  ExperienceEntry,
  Id,
  Job,
  Profile,
  Reference,
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
    }) => void
    duplicateProfile: (input: { sourceProfileId: Id; targetJobId?: Id | null; name?: string }) => Id | null
    deleteProfile: (profileId: Id) => void
    createJob: (input: Pick<Job, 'companyName' | 'jobTitle'> & Partial<Job>) => void
    updateJob: (input: { jobId: Id; changes: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>> }) => void
    deleteJob: (jobId: Id) => void
    importAppData: (file: AppExportFile) => void
    exportAppData: () => AppExportFile
    resetUiState: () => void
    selectJob: (jobId: Id | null) => void
    selectProfile: (profileId: Id | null) => void
  }
}

const now = () => new Date().toISOString()
const createId = () => crypto.randomUUID()

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

const cloneProfileChildren = (data: AppDataState, sourceProfileId: Id, targetProfileId: Id): AppDataState => {
  const clonedSkillCategoryIds = new Map<Id, Id>()
  const nextData: AppDataState = {
    ...data,
    skillCategories: { ...data.skillCategories },
    skills: { ...data.skills },
    experienceEntries: { ...data.experienceEntries },
    educationEntries: { ...data.educationEntries },
    certifications: { ...data.certifications },
    references: { ...data.references },
  }
  const timestamp = now()

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
      const cloned: ExperienceEntry = {
        ...item,
        id: createId(),
        profileId: targetProfileId,
      }
      nextData.experienceEntries[cloned.id] = cloned
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

  const nextProfiles = { ...data.profiles }
  const nextSkillCategories = { ...data.skillCategories }
  const nextSkills = { ...data.skills }
  const nextExperienceEntries = { ...data.experienceEntries }
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
    skillCategories: nextSkillCategories,
    skills: nextSkills,
    experienceEntries: nextExperienceEntries,
    educationEntries: nextEducationEntries,
    certifications: nextCertifications,
    references: nextReferences,
  }
}

const createProfileRecord = (name: string): Profile => {
  const timestamp = now()

  return {
    id: createId(),
    name,
    ...emptyProfileDefaults,
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
    updateProfile: ({ profileId, changes }) => {
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
              updatedAt: now(),
            },
          },
        },
      }))
    },
    duplicateProfile: ({ sourceProfileId, targetJobId, name }) => {
      const sourceProfile = get().data.profiles[sourceProfileId]

      if (!sourceProfile) {
        return null
      }

      const timestamp = now()
      const clonedProfile: Profile = {
        ...sourceProfile,
        id: createId(),
        name: name?.trim() || `${sourceProfile.name} Copy`,
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
    createJob: (input) => {
      const timestamp = now()
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

      set((state) => ({
        data: {
          ...state.data,
          jobs: {
            ...state.data.jobs,
            [job.id]: job,
          },
        },
        ui: {
          ...state.ui,
          selectedJobId: job.id,
        },
      }))
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
        const nextJobPostingSources = { ...nextData.jobPostingSources }
        const nextJobContacts = { ...nextData.jobContacts }
        const nextJobEvents = { ...nextData.jobEvents }

        delete nextJobs[jobId]

        Object.values(nextData.jobPostingSources).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextJobPostingSources[item.id]
          }
        })

        Object.values(nextData.jobContacts).forEach((item) => {
          if (item.jobId === jobId) {
            delete nextJobContacts[item.id]
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
            jobPostingSources: nextJobPostingSources,
            jobContacts: nextJobContacts,
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
    importAppData: (file) => {
      set({
        data: {
          version: 1,
          exportedAt: file.exportedAt,
          ...file.data,
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
