import { useMemo } from 'react'

import type {
  ProfileDetailAdditionalExperienceEntryDto,
  ProfileDetailDto,
  ProfileDetailEducationEntryDto,
  ProfileDetailExperienceEntryDto,
  ProfileDetailProjectEntryDto,
  ProfileDetailSkillCategoryDto,
} from '../../api/read-models'
import type { Achievement, Certification, ProfileLink, Reference } from '../../types/state'

export interface ProfileEditorLinksModel {
  profileLinks: ProfileLink[]
}

export interface ProfileEditorAchievementsModel {
  achievements: Achievement[]
}

export interface ProfileEditorSkillsModel {
  skillCategories: ProfileDetailSkillCategoryDto[]
}

export interface ProfileEditorExperienceModel {
  experienceEntries: ProfileDetailExperienceEntryDto[]
}

export interface ProfileEditorEducationModel {
  educationEntries: ProfileDetailEducationEntryDto[]
}

export interface ProfileEditorProjectsModel {
  projectEntries: ProfileDetailProjectEntryDto[]
}

export interface ProfileEditorAdditionalExperienceModel {
  additionalExperienceEntries: ProfileDetailAdditionalExperienceEntryDto[]
}

export interface ProfileEditorCertificationsModel {
  certifications: Certification[]
}

export interface ProfileEditorReferencesModel {
  references: Reference[]
}

export interface ProfileEditorModel {
  links: ProfileEditorLinksModel
  achievements: ProfileEditorAchievementsModel
  skills: ProfileEditorSkillsModel
  experience: ProfileEditorExperienceModel
  education: ProfileEditorEducationModel
  projects: ProfileEditorProjectsModel
  additionalExperience: ProfileEditorAdditionalExperienceModel
  certifications: ProfileEditorCertificationsModel
  references: ProfileEditorReferencesModel
}

export const useProfileEditorModel = (profileDetail: ProfileDetailDto | null | undefined): ProfileEditorModel =>
  useMemo(
    () => ({
      links: {
        profileLinks: [...(profileDetail?.profileLinks ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
      achievements: {
        achievements: [...(profileDetail?.achievements ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
      skills: {
        skillCategories: [...(profileDetail?.skillCategories ?? [])]
          .map((item) => ({
            ...item,
            skills: [...item.skills].sort((left, right) => left.sortOrder - right.sortOrder),
          }))
          .sort((left, right) => left.category.sortOrder - right.category.sortOrder),
      },
      experience: {
        experienceEntries: [...(profileDetail?.experienceEntries ?? [])]
          .map((item) => ({
            ...item,
            bullets: [...item.bullets].sort((left, right) => left.sortOrder - right.sortOrder),
          }))
          .sort((left, right) => left.entry.sortOrder - right.entry.sortOrder),
      },
      education: {
        educationEntries: [...(profileDetail?.educationEntries ?? [])]
          .map((item) => ({
            ...item,
            bullets: [...item.bullets].sort((left, right) => left.sortOrder - right.sortOrder),
          }))
          .sort((left, right) => left.entry.sortOrder - right.entry.sortOrder),
      },
      projects: {
        projectEntries: [...(profileDetail?.projectEntries ?? [])]
          .map((item) => ({
            ...item,
            bullets: [...item.bullets].sort((left, right) => left.sortOrder - right.sortOrder),
          }))
          .sort((left, right) => left.entry.sortOrder - right.entry.sortOrder),
      },
      additionalExperience: {
        additionalExperienceEntries: [...(profileDetail?.additionalExperienceEntries ?? [])]
          .map((item) => ({
            ...item,
            bullets: [...item.bullets].sort((left, right) => left.sortOrder - right.sortOrder),
          }))
          .sort((left, right) => left.entry.sortOrder - right.entry.sortOrder),
      },
      certifications: {
        certifications: [...(profileDetail?.certifications ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
      references: {
        references: [...(profileDetail?.references ?? [])].sort((left, right) => left.sortOrder - right.sortOrder),
      },
    }),
    [
      profileDetail?.additionalExperienceEntries,
      profileDetail?.achievements,
      profileDetail?.certifications,
      profileDetail?.educationEntries,
      profileDetail?.experienceEntries,
      profileDetail?.profileLinks,
      profileDetail?.projectEntries,
      profileDetail?.references,
      profileDetail?.skillCategories,
    ],
  )