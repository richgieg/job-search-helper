import { useEffect, useMemo, useState } from 'react'

import { ActionToggle, DeleteIconButton, getActionIconButtonClassName } from '../../components/CompactActionControls'
import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import type {
  ProfileDetailAdditionalExperienceEntryDto,
  ProfileDetailEducationEntryDto,
  ProfileDetailExperienceEntryDto,
  ProfileDetailProjectEntryDto,
  ProfileDetailSkillCategoryDto,
} from '../../api/read-models'
import type {
  ProfileEditorAdditionalExperienceModel,
  ProfileEditorAchievementsModel,
  ProfileEditorCertificationsModel,
  ProfileEditorEducationModel,
  ProfileEditorExperienceModel,
  ProfileEditorLinksModel,
  ProfileEditorProjectsModel,
  ProfileEditorReferencesModel,
  ProfileEditorSkillsModel,
} from '../../features/profiles/use-profile-editor-model'
import { useProfileMutations } from '../../features/profiles/use-profile-mutations'
import type {
  Achievement,
  AdditionalExperienceBullet,
  AdditionalExperienceEntry,
  BulletLevel,
  Certification,
  EducationBullet,
  EducationEntry,
  EducationStatus,
  ExperienceBullet,
  ExperienceEntry,
  ProfileLink,
  Project,
  ProjectBullet,
  Reference,
  ReferenceType,
  Skill,
} from '../../types/state'
import { employmentTypeOptions, workArrangementOptions } from '../../utils/job-field-options'
import { moveOrderedItem } from '../../utils/reorder'
import { useScrollIntoViewOnMount } from '../../utils/use-scroll-into-view-on-mount'

const TextField = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  hideLabel = false,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date'
  hideLabel?: boolean
  disabled?: boolean
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className={hideLabel ? 'sr-only' : 'font-medium'}>{label}</span>
    <input
      className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring disabled:cursor-not-allowed disabled:bg-app-surface-subtle disabled:text-app-text-subtle"
      disabled={disabled}
      placeholder={placeholder}
      spellCheck={type === 'url' ? false : undefined}
      type={type}
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const TextAreaField = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hideLabel = false,
  className,
  minHeightClass = 'min-h-24',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  hideLabel?: boolean
  className?: string
  minHeightClass?: string
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className={hideLabel ? 'sr-only' : 'font-medium'}>{label}</span>
    <textarea
      className={[minHeightClass, 'rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring', className]
        .filter(Boolean)
        .join(' ')}
      placeholder={placeholder}
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const SelectField = <T extends string>({
  label,
  value,
  onChange,
  onBlur,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  options: Array<{ value: T; label: string }>
}) => (
  <label className="flex flex-col gap-2 text-sm text-app-text-muted">
    <span className="font-medium">{label}</span>
    <select
      className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const getNextBulletLevel = (level: BulletLevel): BulletLevel => {
  if (level === 3) {
    return 1
  }

  return (level + 1) as BulletLevel
}

const BulletLevelMarkerIcon = ({ level }: { level: BulletLevel }) => {
  if (level === 1) {
    return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-app-text" />
  }

  if (level === 2) {
    return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border border-app-text" />
  }

  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 border border-app-text bg-app-text" />
}

const BulletLevelField = ({
  level,
  onChange,
}: {
  level: BulletLevel
  onChange: (level: BulletLevel) => void
}) => {
  const nextLevel = getNextBulletLevel(level)

  return (
    <button
      aria-label={`Bullet level ${level}. Activate to change to level ${nextLevel}.`}
      className="inline-flex min-w-11 items-center gap-2 rounded-xl border border-app-border bg-app-surface px-2.5 py-2 text-sm font-medium text-app-text-muted transition hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-focus-ring"
      onClick={() => onChange(nextLevel)}
      type="button"
    >
      <BulletLevelMarkerIcon level={level} />
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-app-surface-subtle px-1 text-xs font-semibold text-app-text">
        {level}
      </span>
      <span className="sr-only">{`Current bullet level ${level}. Activate to change to level ${nextLevel}.`}</span>
    </button>
  )
}

const OrderBadge = ({ value }: { value: number }) => (
  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-app-surface-subtle px-2 text-xs font-semibold text-app-text-subtle">
    {value}
  </span>
)

const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <div className="flex flex-col gap-2 text-sm text-app-text-muted">
    <p className="font-medium">{label}</p>
    <div>
      <ActionToggle checked={checked} label={label} onChange={onChange} />
    </div>
  </div>
)

const countLabel = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`

const formatMonthYear = (value: string | null) => {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}T00:00:00`)

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent?: boolean) => {
  const start = formatMonthYear(startDate) || 'No start date'
  const end = isCurrent ? 'Present' : formatMonthYear(endDate) || 'No end date'

  return `${start} – ${end}`
}

const educationStatusOptions: Array<{ value: EducationStatus; label: string }> = [
  { value: 'graduated', label: 'Graduated' },
  { value: 'attended', label: 'Attended' },
  { value: 'in_progress', label: 'In progress' },
]

const formatEducationSummaryDate = (entry: Pick<EducationEntry, 'startDate' | 'endDate' | 'status'> | null | undefined) => {
  if (!entry) {
    return ''
  }

  if (entry.status === 'graduated') {
    return formatMonthYear(entry.endDate) || 'Graduated'
  }

  const start = formatMonthYear(entry.startDate)
  const end = entry.status === 'in_progress' ? 'Present' : formatMonthYear(entry.endDate)

  if (start && end) {
    return `${start} – ${end}`
  }

  if (start) {
    return entry.status === 'in_progress' ? `${start} – Present` : start
  }

  if (end) {
    return end
  }

  return entry.status === 'in_progress' ? 'In progress' : ''
}

const formatProjectSummaryDate = (entry: Pick<Project, 'startDate' | 'endDate'> | null | undefined) => {
  if (!entry) {
    return ''
  }

  const start = formatMonthYear(entry.startDate)
  const end = formatMonthYear(entry.endDate)

  if (start && end) {
    return `${start} – ${end}`
  }

  return start || end || ''
}

const formatAdditionalExperienceSummaryDate = (entry: Pick<AdditionalExperienceEntry, 'startDate' | 'endDate'> | null | undefined) => {
  if (!entry) {
    return ''
  }

  const start = formatMonthYear(entry.startDate)
  const end = formatMonthYear(entry.endDate)

  if (start && end) {
    return `${start} – ${end}`
  }

  return start || end || ''
}

const summarizeParts = (parts: Array<string | null | undefined>) => parts.filter((part): part is string => Boolean(part && part.trim())).join(' • ')

const ProfileLinkRow = ({
  profileLink,
  orderedProfileLinkIds,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  profileLink: ProfileLink
  orderedProfileLinkIds: string[]
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteProfileLink, reorderProfileLinks, updateProfileLink } = useProfileMutations()
  const [name, setName] = useState(profileLink.name)
  const [url, setUrl] = useState(profileLink.url)
  const [enabled, setEnabled] = useState(profileLink.enabled)
  const { scrollTargetRef: rowRef, scrollTargetStyle: rowScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const profileLinkIndex = orderedProfileLinkIds.indexOf(profileLink.id)

  useEffect(() => {
    setName(profileLink.name)
    setUrl(profileLink.url)
    setEnabled(profileLink.enabled)
  }, [profileLink])

  const commitName = () => {
    if (name === profileLink.name) {
      return
    }

    void updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { name },
    })
  }

  const commitUrl = () => {
    if (url === profileLink.url) {
      return
    }

    void updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { url },
    })
  }

  const trimmedUrl = url.trim()
  const hasUrl = trimmedUrl.length > 0

  return (
    <div className="rounded-xl border border-app-border-muted p-3" ref={rowRef} style={rowScrollStyle}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] md:items-end">
        <TextField label="Link name" onBlur={commitName} value={name} onChange={setName} />
        <TextField label="URL" type="url" onBlur={commitUrl} value={url} onChange={setUrl} />
        <div className="flex flex-wrap items-center justify-end gap-2 md:self-end">
          <ActionToggle checked={enabled} label="Enable profile link" onChange={(value) => {
            setEnabled(value)
            void updateProfileLink({ profileLinkId: profileLink.id, changes: { enabled: value } })
          }} />
          {hasUrl ? (
            <a
              aria-label="Open link in new tab"
              className={getActionIconButtonClassName()}
              href={trimmedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </a>
          ) : (
            <button aria-label="Open link in new tab" className={getActionIconButtonClassName('neutral', true)} disabled type="button">
              <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </button>
          )}
          <ReorderButtons
            canMoveDown={orderedProfileLinkIds.length > 1}
            canMoveUp={orderedProfileLinkIds.length > 1}
            onMoveDown={() =>
              void reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(orderedProfileLinkIds, profileLinkIndex, 1),
              })
            }
            onMoveUp={() =>
              void reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(orderedProfileLinkIds, profileLinkIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete profile link" onDelete={() => void deleteProfileLink(profileLink.id)} />
        </div>
      </div>
    </div>
  )
}

const ExperienceBulletRow = ({
  bullet,
  orderedBulletIds,
}: {
  bullet: ExperienceBullet
  orderedBulletIds: string[]
}) => {
  const { deleteExperienceBullet, reorderExperienceBullets, updateExperienceBullet } = useProfileMutations()
  const [content, setContent] = useState(bullet.content)
  const [level, setLevel] = useState(bullet.level)
  const [enabled, setEnabled] = useState(bullet.enabled)

  const bulletIndex = orderedBulletIds.indexOf(bullet.id)

  useEffect(() => {
    setContent(bullet.content)
    setLevel(bullet.level)
    setEnabled(bullet.enabled)
  }, [bullet])

  const commitContent = () => {
    if (content === bullet.content) {
      return
    }

    void updateExperienceBullet({ experienceBulletId: bullet.id, changes: { content } })
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <TextAreaField hideLabel label="Bullet" minHeightClass="min-h-10" onBlur={commitContent} placeholder="Describe an accomplishment or responsibility" value={content} onChange={setContent} />
      <div className="flex flex-wrap items-center justify-end gap-2 md:self-center">
        <ActionToggle checked={enabled} label="Enable experience bullet" onChange={(value) => {
          setEnabled(value)
          void updateExperienceBullet({ experienceBulletId: bullet.id, changes: { enabled: value } })
        }} />
        <BulletLevelField level={level} onChange={(value) => {
          setLevel(value)
          void updateExperienceBullet({ experienceBulletId: bullet.id, changes: { level: value } })
        }} />
        <ReorderButtons
          canMoveDown={orderedBulletIds.length > 1}
          canMoveUp={orderedBulletIds.length > 1}
          onMoveDown={() =>
            void reorderExperienceBullets({
              experienceEntryId: bullet.experienceEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, 1),
            })
          }
          onMoveUp={() =>
            void reorderExperienceBullets({
              experienceEntryId: bullet.experienceEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, -1),
            })
          }
        />
        <DeleteIconButton label="Delete experience bullet" onDelete={() => void deleteExperienceBullet(bullet.id)} />
      </div>
    </div>
  )
}

const EducationBulletRow = ({
  bullet,
  orderedBulletIds,
}: {
  bullet: EducationBullet
  orderedBulletIds: string[]
}) => {
  const { deleteEducationBullet, reorderEducationBullets, updateEducationBullet } = useProfileMutations()
  const [content, setContent] = useState(bullet.content)
  const [level, setLevel] = useState(bullet.level)
  const [enabled, setEnabled] = useState(bullet.enabled)

  const bulletIndex = orderedBulletIds.indexOf(bullet.id)

  useEffect(() => {
    setContent(bullet.content)
    setLevel(bullet.level)
    setEnabled(bullet.enabled)
  }, [bullet])

  const commitContent = () => {
    if (content === bullet.content) {
      return
    }

    void updateEducationBullet({ educationBulletId: bullet.id, changes: { content } })
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <TextAreaField hideLabel label="Bullet" minHeightClass="min-h-10" onBlur={commitContent} placeholder="Describe coursework, honors, or related details" value={content} onChange={setContent} />
      <div className="flex flex-wrap items-center justify-end gap-2 md:self-center">
        <ActionToggle checked={enabled} label="Enable education bullet" onChange={(value) => {
          setEnabled(value)
          void updateEducationBullet({ educationBulletId: bullet.id, changes: { enabled: value } })
        }} />
        <BulletLevelField level={level} onChange={(value) => {
          setLevel(value)
          void updateEducationBullet({ educationBulletId: bullet.id, changes: { level: value } })
        }} />
        <ReorderButtons
          canMoveDown={orderedBulletIds.length > 1}
          canMoveUp={orderedBulletIds.length > 1}
          onMoveDown={() =>
            void reorderEducationBullets({
              educationEntryId: bullet.educationEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, 1),
            })
          }
          onMoveUp={() =>
            void reorderEducationBullets({
              educationEntryId: bullet.educationEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, -1),
            })
          }
        />
        <DeleteIconButton label="Delete education bullet" onDelete={() => void deleteEducationBullet(bullet.id)} />
      </div>
    </div>
  )
}

const ProjectBulletRow = ({
  bullet,
  orderedBulletIds,
}: {
  bullet: ProjectBullet
  orderedBulletIds: string[]
}) => {
  const { deleteProjectBullet, reorderProjectBullets, updateProjectBullet } = useProfileMutations()
  const [content, setContent] = useState(bullet.content)
  const [level, setLevel] = useState(bullet.level)
  const [enabled, setEnabled] = useState(bullet.enabled)

  const bulletIndex = orderedBulletIds.indexOf(bullet.id)

  useEffect(() => {
    setContent(bullet.content)
    setLevel(bullet.level)
    setEnabled(bullet.enabled)
  }, [bullet])

  const commitContent = () => {
    if (content === bullet.content) {
      return
    }

    void updateProjectBullet({ projectBulletId: bullet.id, changes: { content } })
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <TextAreaField hideLabel label="Bullet" minHeightClass="min-h-10" onBlur={commitContent} placeholder="Describe the project outcome, scope, or technologies used" value={content} onChange={setContent} />
      <div className="flex flex-wrap items-center justify-end gap-2 md:self-center">
        <ActionToggle checked={enabled} label="Enable project bullet" onChange={(value) => {
          setEnabled(value)
          void updateProjectBullet({ projectBulletId: bullet.id, changes: { enabled: value } })
        }} />
        <BulletLevelField level={level} onChange={(value) => {
          setLevel(value)
          void updateProjectBullet({ projectBulletId: bullet.id, changes: { level: value } })
        }} />
        <ReorderButtons
          canMoveDown={orderedBulletIds.length > 1}
          canMoveUp={orderedBulletIds.length > 1}
          onMoveDown={() =>
            void reorderProjectBullets({
              projectId: bullet.projectId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, 1),
            })
          }
          onMoveUp={() =>
            void reorderProjectBullets({
              projectId: bullet.projectId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, -1),
            })
          }
        />
        <DeleteIconButton label="Delete project bullet" onDelete={() => void deleteProjectBullet(bullet.id)} />
      </div>
    </div>
  )
}

const AdditionalExperienceBulletRow = ({
  bullet,
  orderedBulletIds,
}: {
  bullet: AdditionalExperienceBullet
  orderedBulletIds: string[]
}) => {
  const { deleteAdditionalExperienceBullet, reorderAdditionalExperienceBullets, updateAdditionalExperienceBullet } = useProfileMutations()
  const [content, setContent] = useState(bullet.content)
  const [level, setLevel] = useState(bullet.level)
  const [enabled, setEnabled] = useState(bullet.enabled)

  const bulletIndex = orderedBulletIds.indexOf(bullet.id)

  useEffect(() => {
    setContent(bullet.content)
    setLevel(bullet.level)
    setEnabled(bullet.enabled)
  }, [bullet])

  const commitContent = () => {
    if (content === bullet.content) {
      return
    }

    void updateAdditionalExperienceBullet({ additionalExperienceBulletId: bullet.id, changes: { content } })
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <TextAreaField hideLabel label="Bullet" minHeightClass="min-h-10" onBlur={commitContent} placeholder="Describe the work, scope, or impact" value={content} onChange={setContent} />
      <div className="flex flex-wrap items-center justify-end gap-2 md:self-center">
        <ActionToggle checked={enabled} label="Enable additional experience bullet" onChange={(value) => {
          setEnabled(value)
          void updateAdditionalExperienceBullet({ additionalExperienceBulletId: bullet.id, changes: { enabled: value } })
        }} />
        <BulletLevelField level={level} onChange={(value) => {
          setLevel(value)
          void updateAdditionalExperienceBullet({ additionalExperienceBulletId: bullet.id, changes: { level: value } })
        }} />
        <ReorderButtons
          canMoveDown={orderedBulletIds.length > 1}
          canMoveUp={orderedBulletIds.length > 1}
          onMoveDown={() =>
            void reorderAdditionalExperienceBullets({
              additionalExperienceEntryId: bullet.additionalExperienceEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, 1),
            })
          }
          onMoveUp={() =>
            void reorderAdditionalExperienceBullets({
              additionalExperienceEntryId: bullet.additionalExperienceEntryId,
              orderedIds: moveOrderedItem(orderedBulletIds, bulletIndex, -1),
            })
          }
        />
        <DeleteIconButton label="Delete additional experience bullet" onDelete={() => void deleteAdditionalExperienceBullet(bullet.id)} />
      </div>
    </div>
  )
}

const SkillRow = ({
  orderedSkillIds,
  skill,
}: {
  orderedSkillIds: string[]
  skill: Skill
}) => {
  const { deleteSkill, reorderSkills, updateSkill } = useProfileMutations()
  const [name, setName] = useState(skill.name)
  const [enabled, setEnabled] = useState(skill.enabled)

  const skillIndex = orderedSkillIds.indexOf(skill.id)

  useEffect(() => {
    setName(skill.name)
    setEnabled(skill.enabled)
  }, [skill])

  const commitName = () => {
    if (name === skill.name) {
      return
    }

    void updateSkill({ skillId: skill.id, changes: { name } })
  }

  return (
    <div className="rounded-xl border border-app-border-muted p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex items-center gap-3">
          <OrderBadge value={skillIndex + 1} />
          <div className="min-w-0 flex-1">
            <TextField hideLabel label="Skill name" onBlur={commitName} value={name} onChange={setName} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 md:self-end">
          <ActionToggle checked={enabled} label="Enable skill" onChange={(value) => {
            setEnabled(value)
            void updateSkill({ skillId: skill.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={orderedSkillIds.length > 1}
            canMoveUp={orderedSkillIds.length > 1}
            onMoveDown={() =>
              void reorderSkills({
                skillCategoryId: skill.skillCategoryId,
                orderedIds: moveOrderedItem(orderedSkillIds, skillIndex, 1),
              })
            }
            onMoveUp={() =>
              void reorderSkills({
                skillCategoryId: skill.skillCategoryId,
                orderedIds: moveOrderedItem(orderedSkillIds, skillIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete skill" onDelete={() => void deleteSkill(skill.id)} />
        </div>
      </div>
    </div>
  )
}

const SkillCategoryCard = ({
  skillCategoryEntry,
  orderedSkillCategoryIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  skillCategoryEntry: ProfileDetailSkillCategoryDto
  orderedSkillCategoryIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { createSkill, deleteSkillCategory, reorderSkillCategories, updateSkillCategory } = useProfileMutations()
  const category = skillCategoryEntry.category
  const skills = skillCategoryEntry.skills
  const [name, setName] = useState(category.name)
  const [enabled, setEnabled] = useState(category.enabled)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const skillCategoryIndex = orderedSkillCategoryIds.indexOf(category.id)

  const skillIds = useMemo(() => skills.map((item) => item.id), [skills])
  const splitSkillIndex = Math.ceil(skillIds.length / 2)
  const leftColumnSkills = skills.slice(0, splitSkillIndex)
  const rightColumnSkills = skills.slice(splitSkillIndex)

  useEffect(() => {
    setName(category.name)
    setEnabled(category.enabled)
  }, [category])

  const summary = summarizeParts([countLabel(skillIds.length, 'skill')])

  const commitName = () => {
    if (name === category.name) {
      return
    }

    void updateSkillCategory({ skillCategoryId: category.id, changes: { name } })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={enabled} label="Enable skill category" onChange={(value) => {
              setEnabled(value)
              void updateSkillCategory({ skillCategoryId: category.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedSkillCategoryIds.length > 1}
              canMoveUp={orderedSkillCategoryIds.length > 1}
              onMoveDown={() =>
                void reorderSkillCategories({
                  profileId: category.profileId,
                  orderedIds: moveOrderedItem(orderedSkillCategoryIds, skillCategoryIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderSkillCategories({
                  profileId: category.profileId,
                  orderedIds: moveOrderedItem(orderedSkillCategoryIds, skillCategoryIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete skill category" onDelete={() => void deleteSkillCategory(category.id)} />
          </div>
        }
        summary={summary}
        title={name || 'Skill category'}
      >
        <div className="grid gap-3">
          <TextField label="Category name" onBlur={commitName} value={name} onChange={setName} />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Skills</h4>
            <button
              className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted"
              onClick={() => void createSkill(category.id)}
              type="button"
            >
              Add skill
            </button>
          </div>

          <div className="mt-3">
            {skillIds.length === 0 ? (
              <p className="text-sm text-app-text-subtle">No skills yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  {leftColumnSkills.map((skill) => <SkillRow key={skill.id} orderedSkillIds={skillIds} skill={skill} />)}
                </div>
                <div className="space-y-3">
                  {rightColumnSkills.map((skill) => <SkillRow key={skill.id} orderedSkillIds={skillIds} skill={skill} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const AchievementCard = ({
  achievement,
  orderedAchievementIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  achievement: Achievement
  orderedAchievementIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteAchievement, reorderAchievements, updateAchievement } = useProfileMutations()
  const [draft, setDraft] = useState(achievement)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const achievementIndex = orderedAchievementIds.indexOf(achievement.id)

  useEffect(() => {
    setDraft(achievement)
  }, [achievement])

  const summary = summarizeParts([
    draft.description.trim() ? draft.description.trim() : 'No description',
  ])

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable achievement" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateAchievement({ achievementId: achievement.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedAchievementIds.length > 1}
              canMoveUp={orderedAchievementIds.length > 1}
              onMoveDown={() =>
                void reorderAchievements({
                  profileId: achievement.profileId,
                  orderedIds: moveOrderedItem(orderedAchievementIds, achievementIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderAchievements({
                  profileId: achievement.profileId,
                  orderedIds: moveOrderedItem(orderedAchievementIds, achievementIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete achievement" onDelete={() => void deleteAchievement(achievement.id)} />
          </div>
        }
        summary={summary}
        title={draft.name || achievement.name || 'Achievement'}
      >
        <div className="grid gap-4">
          <TextField
            label="Name"
            onBlur={() => draft.name !== achievement.name && void updateAchievement({ achievementId: achievement.id, changes: { name: draft.name } })}
            value={draft.name}
            onChange={(value) => setDraft({ ...draft, name: value })}
          />
          <TextAreaField
            label="Description"
            onBlur={() => draft.description !== achievement.description && void updateAchievement({ achievementId: achievement.id, changes: { description: draft.description } })}
            placeholder="Describe the outcome or recognition"
            value={draft.description}
            onChange={(value) => setDraft({ ...draft, description: value })}
          />
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const ExperienceCard = ({
  experienceEntry,
  orderedExperienceEntryIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  experienceEntry: ProfileDetailExperienceEntryDto
  orderedExperienceEntryIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { createExperienceBullet, deleteExperienceEntry, reorderExperienceEntries, updateExperienceEntry } = useProfileMutations()
  const entry = experienceEntry.entry
  const bullets = experienceEntry.bullets
  const [draft, setDraft] = useState(entry)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const experienceEntryIndex = orderedExperienceEntryIds.indexOf(entry.id)
  const bulletIds = useMemo(() => bullets.map((item) => item.id), [bullets])

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  const summary = summarizeParts([
    draft?.company || 'Unknown company',
    formatDateRange(draft?.startDate ?? null, draft?.endDate ?? null, draft?.isCurrent),
    countLabel(bulletIds.length, 'bullet'),
  ])

  if (!draft) {
    return null
  }

  const commitEntryChanges = (changes: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>>) => {
    void updateExperienceEntry({ experienceEntryId: entry.id, changes })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable experience entry" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateExperienceEntry({ experienceEntryId: entry.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedExperienceEntryIds.length > 1}
              canMoveUp={orderedExperienceEntryIds.length > 1}
              onMoveDown={() =>
                void reorderExperienceEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedExperienceEntryIds, experienceEntryIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderExperienceEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedExperienceEntryIds, experienceEntryIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete experience entry" onDelete={() => void deleteExperienceEntry(entry.id)} />
          </div>
        }
        summary={summary}
        title={draft.title || entry.title || 'Experience entry'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Company" onBlur={() => draft.company !== entry.company && commitEntryChanges({ company: draft.company })} value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" onBlur={() => draft.title !== entry.title && commitEntryChanges({ title: draft.title })} value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Location" onBlur={() => draft.location !== entry.location && commitEntryChanges({ location: draft.location })} value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
        <SelectField label="Work arrangement" onBlur={() => draft.workArrangement !== entry.workArrangement && commitEntryChanges({ workArrangement: draft.workArrangement })} value={draft.workArrangement} onChange={(value) => setDraft({ ...draft, workArrangement: value })} options={workArrangementOptions} />
        <SelectField label="Employment type" onBlur={() => draft.employmentType !== entry.employmentType && commitEntryChanges({ employmentType: draft.employmentType })} value={draft.employmentType} onChange={(value) => setDraft({ ...draft, employmentType: value })} options={employmentTypeOptions} />
        <TextField label="Start date" type="date" onBlur={() => draft.startDate !== entry.startDate && commitEntryChanges({ startDate: draft.startDate })} value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
        <TextField
          disabled={draft.isCurrent}
          label="End date"
          type="date"
          onBlur={() => draft.endDate !== entry.endDate && commitEntryChanges({ endDate: draft.endDate })}
          value={draft.endDate ?? ''}
          onChange={(value) => setDraft({ ...draft, endDate: value || null })}
        />
        <ToggleField
          checked={draft.isCurrent}
          label="Current role"
          onChange={(value) => {
            setDraft({
              ...draft,
              isCurrent: value,
              endDate: value ? null : draft.endDate,
            })
            void updateExperienceEntry({ experienceEntryId: entry.id, changes: { isCurrent: value } })
          }}
        />
        <div className="xl:col-span-3">
          <TextField
            label="Reason for leaving (short)"
            onBlur={() => draft.reasonForLeavingShort !== entry.reasonForLeavingShort && commitEntryChanges({ reasonForLeavingShort: draft.reasonForLeavingShort })}
            value={draft.reasonForLeavingShort}
            onChange={(value) => setDraft({ ...draft, reasonForLeavingShort: value })}
          />
        </div>
        <div className="xl:col-span-3">
          <TextAreaField
            label="Reason for leaving (details)"
            onBlur={() => draft.reasonForLeavingDetails !== entry.reasonForLeavingDetails && commitEntryChanges({ reasonForLeavingDetails: draft.reasonForLeavingDetails })}
            placeholder="Optional application-only context"
            value={draft.reasonForLeavingDetails}
            onChange={(value) => setDraft({ ...draft, reasonForLeavingDetails: value })}
          />
        </div>
        <div className="xl:col-span-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Supervisor</h4>
          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <TextField
              label="Supervisor name"
              onBlur={() =>
                (draft.supervisor.name !== entry.supervisor.name ||
                  draft.supervisor.title !== entry.supervisor.title ||
                  draft.supervisor.phone !== entry.supervisor.phone ||
                  draft.supervisor.email !== entry.supervisor.email) && commitEntryChanges({ supervisor: draft.supervisor })
              }
              value={draft.supervisor.name}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, name: value } })}
            />
            <TextField
              label="Supervisor title"
              onBlur={() =>
                (draft.supervisor.name !== entry.supervisor.name ||
                  draft.supervisor.title !== entry.supervisor.title ||
                  draft.supervisor.phone !== entry.supervisor.phone ||
                  draft.supervisor.email !== entry.supervisor.email) && commitEntryChanges({ supervisor: draft.supervisor })
              }
              value={draft.supervisor.title}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, title: value } })}
            />
            <TextField
              label="Supervisor phone"
              type="tel"
              onBlur={() =>
                (draft.supervisor.name !== entry.supervisor.name ||
                  draft.supervisor.title !== entry.supervisor.title ||
                  draft.supervisor.phone !== entry.supervisor.phone ||
                  draft.supervisor.email !== entry.supervisor.email) && commitEntryChanges({ supervisor: draft.supervisor })
              }
              value={draft.supervisor.phone}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, phone: value } })}
            />
            <TextField
              label="Supervisor email"
              type="email"
              onBlur={() =>
                (draft.supervisor.name !== entry.supervisor.name ||
                  draft.supervisor.title !== entry.supervisor.title ||
                  draft.supervisor.phone !== entry.supervisor.phone ||
                  draft.supervisor.email !== entry.supervisor.email) && commitEntryChanges({ supervisor: draft.supervisor })
              }
              value={draft.supervisor.email}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, email: value } })}
            />
          </div>
        </div>
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Bullets</h4>
            <button
              className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted"
              onClick={() => void createExperienceBullet(entry.id)}
              type="button"
            >
              Add bullet
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {bulletIds.length === 0 ? (
              <p className="text-sm text-app-text-subtle">No bullets yet.</p>
            ) : (
                bullets.map((bullet) => <ExperienceBulletRow key={bullet.id} bullet={bullet} orderedBulletIds={bulletIds} />)
            )}
          </div>
        </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const EducationCard = ({
  educationEntry,
  orderedEducationEntryIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  educationEntry: ProfileDetailEducationEntryDto
  orderedEducationEntryIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { createEducationBullet, deleteEducationEntry, reorderEducationEntries, updateEducationEntry } = useProfileMutations()
  const entry = educationEntry.entry
  const bullets = educationEntry.bullets
  const [draft, setDraft] = useState(entry)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const educationEntryIndex = orderedEducationEntryIds.indexOf(entry.id)
  const bulletIds = useMemo(() => bullets.map((item) => item.id), [bullets])

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  const summary = summarizeParts([
    draft?.school || 'No school',
    formatEducationSummaryDate(draft) || null,
    countLabel(bulletIds.length, 'bullet'),
  ])

  if (!draft) {
    return null
  }

  const commitEntryChanges = (changes: Partial<Omit<EducationEntry, 'id' | 'profileId'>>) => {
    void updateEducationEntry({ educationEntryId: entry.id, changes })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable education entry" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateEducationEntry({ educationEntryId: entry.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedEducationEntryIds.length > 1}
              canMoveUp={orderedEducationEntryIds.length > 1}
              onMoveDown={() =>
                void reorderEducationEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedEducationEntryIds, educationEntryIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderEducationEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedEducationEntryIds, educationEntryIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete education entry" onDelete={() => void deleteEducationEntry(entry.id)} />
          </div>
        }
        summary={summary}
        title={draft.degree || entry.degree || 'Education entry'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <TextField label="Degree / Program" onBlur={() => draft.degree !== entry.degree && commitEntryChanges({ degree: draft.degree })} value={draft.degree} onChange={(value) => setDraft({ ...draft, degree: value })} />
          <TextField label="School" onBlur={() => draft.school !== entry.school && commitEntryChanges({ school: draft.school })} value={draft.school} onChange={(value) => setDraft({ ...draft, school: value })} />
          <SelectField
            label="Status"
            onBlur={() => draft.status !== entry.status && commitEntryChanges({ status: draft.status })}
            value={draft.status}
            onChange={(value) =>
              setDraft({
                ...draft,
                status: value,
                endDate: value === 'in_progress' ? null : draft.endDate,
              })
            }
            options={educationStatusOptions}
          />
          <TextField label="Start date" type="date" onBlur={() => draft.startDate !== entry.startDate && commitEntryChanges({ startDate: draft.startDate })} value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
          <TextField label="End date" disabled={draft.status === 'in_progress'} type="date" onBlur={() => draft.endDate !== entry.endDate && commitEntryChanges({ endDate: draft.endDate })} value={draft.endDate ?? ''} onChange={(value) => setDraft({ ...draft, endDate: value || null })} />
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Bullets</h4>
              <button
                className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted"
                onClick={() => void createEducationBullet(entry.id)}
                type="button"
              >
                Add bullet
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {bulletIds.length === 0 ? (
                <p className="text-sm text-app-text-subtle">No bullets yet.</p>
              ) : (
                bullets.map((bullet) => <EducationBulletRow key={bullet.id} bullet={bullet} orderedBulletIds={bulletIds} />)
              )}
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const ProjectCard = ({
  projectEntry,
  orderedProjectIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  projectEntry: ProfileDetailProjectEntryDto
  orderedProjectIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { createProjectBullet, deleteProject, reorderProjects, updateProject } = useProfileMutations()
  const project = projectEntry.entry
  const bullets = projectEntry.bullets
  const [draft, setDraft] = useState(project)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const projectIndex = orderedProjectIds.indexOf(project.id)
  const bulletIds = useMemo(() => bullets.map((item) => item.id), [bullets])

  useEffect(() => {
    setDraft(project)
  }, [project])

  const summary = summarizeParts([
    draft?.organization || 'Personal or unaffiliated',
    formatProjectSummaryDate(draft) || null,
    countLabel(bulletIds.length, 'bullet'),
  ])

  if (!draft) {
    return null
  }

  const commitProjectChanges = (changes: Partial<Omit<Project, 'id' | 'profileId'>>) => {
    void updateProject({ projectId: project.id, changes })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable project" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateProject({ projectId: project.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedProjectIds.length > 1}
              canMoveUp={orderedProjectIds.length > 1}
              onMoveDown={() =>
                void reorderProjects({
                  profileId: project.profileId,
                  orderedIds: moveOrderedItem(orderedProjectIds, projectIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderProjects({
                  profileId: project.profileId,
                  orderedIds: moveOrderedItem(orderedProjectIds, projectIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete project" onDelete={() => void deleteProject(project.id)} />
          </div>
        }
        summary={summary}
        title={draft.name || project.name || 'Project'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <TextField label="Name" onBlur={() => draft.name !== project.name && commitProjectChanges({ name: draft.name })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <TextField label="Company / School / Organization" onBlur={() => draft.organization !== project.organization && commitProjectChanges({ organization: draft.organization })} value={draft.organization} onChange={(value) => setDraft({ ...draft, organization: value })} />
          <div className="hidden xl:block" />
          <TextField label="Start date" type="date" onBlur={() => draft.startDate !== project.startDate && commitProjectChanges({ startDate: draft.startDate })} value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
          <TextField label="End date" type="date" onBlur={() => draft.endDate !== project.endDate && commitProjectChanges({ endDate: draft.endDate })} value={draft.endDate ?? ''} onChange={(value) => setDraft({ ...draft, endDate: value || null })} />
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Bullets</h4>
              <button
                className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted"
                onClick={() => void createProjectBullet(project.id)}
                type="button"
              >
                Add bullet
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {bulletIds.length === 0 ? (
                <p className="text-sm text-app-text-subtle">No bullets yet.</p>
              ) : (
                bullets.map((bullet) => <ProjectBulletRow key={bullet.id} bullet={bullet} orderedBulletIds={bulletIds} />)
              )}
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const AdditionalExperienceCard = ({
  additionalExperienceEntry,
  orderedAdditionalExperienceEntryIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  additionalExperienceEntry: ProfileDetailAdditionalExperienceEntryDto
  orderedAdditionalExperienceEntryIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { createAdditionalExperienceBullet, deleteAdditionalExperienceEntry, reorderAdditionalExperienceEntries, updateAdditionalExperienceEntry } = useProfileMutations()
  const entry = additionalExperienceEntry.entry
  const bullets = additionalExperienceEntry.bullets
  const [draft, setDraft] = useState(entry)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const entryIndex = orderedAdditionalExperienceEntryIds.indexOf(entry.id)
  const bulletIds = useMemo(() => bullets.map((item) => item.id), [bullets])

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  const summary = summarizeParts([
    draft?.organization || 'No organization',
    draft?.location || null,
    formatAdditionalExperienceSummaryDate(draft) || null,
    countLabel(bulletIds.length, 'bullet'),
  ])

  if (!draft) {
    return null
  }

  const commitEntryChanges = (changes: Partial<Omit<AdditionalExperienceEntry, 'id' | 'profileId'>>) => {
    void updateAdditionalExperienceEntry({ additionalExperienceEntryId: entry.id, changes })
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable additional experience entry" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateAdditionalExperienceEntry({ additionalExperienceEntryId: entry.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedAdditionalExperienceEntryIds.length > 1}
              canMoveUp={orderedAdditionalExperienceEntryIds.length > 1}
              onMoveDown={() =>
                void reorderAdditionalExperienceEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedAdditionalExperienceEntryIds, entryIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderAdditionalExperienceEntries({
                  profileId: entry.profileId,
                  orderedIds: moveOrderedItem(orderedAdditionalExperienceEntryIds, entryIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete additional experience entry" onDelete={() => void deleteAdditionalExperienceEntry(entry.id)} />
          </div>
        }
        summary={summary}
        title={draft.title || entry.title || 'Additional experience entry'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <TextField label="Title" onBlur={() => draft.title !== entry.title && commitEntryChanges({ title: draft.title })} value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
          <TextField label="Organization" onBlur={() => draft.organization !== entry.organization && commitEntryChanges({ organization: draft.organization })} value={draft.organization} onChange={(value) => setDraft({ ...draft, organization: value })} />
          <TextField label="Location" onBlur={() => draft.location !== entry.location && commitEntryChanges({ location: draft.location })} value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
          <TextField label="Start date" type="date" onBlur={() => draft.startDate !== entry.startDate && commitEntryChanges({ startDate: draft.startDate })} value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
          <TextField label="End date" type="date" onBlur={() => draft.endDate !== entry.endDate && commitEntryChanges({ endDate: draft.endDate })} value={draft.endDate ?? ''} onChange={(value) => setDraft({ ...draft, endDate: value || null })} />
          <div className="hidden xl:block" />
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Bullets</h4>
              <button
                className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-muted hover:bg-app-surface-muted"
                onClick={() => void createAdditionalExperienceBullet(entry.id)}
                type="button"
              >
                Add bullet
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {bulletIds.length === 0 ? (
                <p className="text-sm text-app-text-subtle">No bullets yet.</p>
              ) : (
                bullets.map((bullet) => <AdditionalExperienceBulletRow key={bullet.id} bullet={bullet} orderedBulletIds={bulletIds} />)
              )}
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const CertificationCard = ({
  certification,
  orderedCertificationIds,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  certification: Certification
  orderedCertificationIds: string[]
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteCertification, reorderCertifications, updateCertification } = useProfileMutations()
  const [draft, setDraft] = useState(certification)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const certificationIndex = orderedCertificationIds.indexOf(certification.id)

  useEffect(() => {
    setDraft(certification)
  }, [certification])

  const summary = summarizeParts([
    draft?.issuer || 'No issuer',
    formatMonthYear(draft?.issueDate ?? null) || null,
    draft?.expiryDate ? `Expires ${formatMonthYear(draft.expiryDate)}` : null,
  ])

  if (!draft) {
    return null
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable certification" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateCertification({ certificationId: certification.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedCertificationIds.length > 1}
              canMoveUp={orderedCertificationIds.length > 1}
              onMoveDown={() =>
                void reorderCertifications({
                  profileId: certification.profileId,
                  orderedIds: moveOrderedItem(orderedCertificationIds, certificationIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderCertifications({
                  profileId: certification.profileId,
                  orderedIds: moveOrderedItem(orderedCertificationIds, certificationIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete certification" onDelete={() => void deleteCertification(certification.id)} />
          </div>
        }
        summary={summary}
        title={draft.name || certification.name || 'Certification'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <TextField label="Name" onBlur={() => draft.name !== certification.name && void updateCertification({ certificationId: certification.id, changes: { name: draft.name } })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <TextField label="Issuer" onBlur={() => draft.issuer !== certification.issuer && void updateCertification({ certificationId: certification.id, changes: { issuer: draft.issuer } })} value={draft.issuer} onChange={(value) => setDraft({ ...draft, issuer: value })} />
          <TextField label="Credential ID" onBlur={() => draft.credentialId !== certification.credentialId && void updateCertification({ certificationId: certification.id, changes: { credentialId: draft.credentialId } })} value={draft.credentialId} onChange={(value) => setDraft({ ...draft, credentialId: value })} />
          <TextField label="Issue date" type="date" onBlur={() => draft.issueDate !== certification.issueDate && void updateCertification({ certificationId: certification.id, changes: { issueDate: draft.issueDate } })} value={draft.issueDate ?? ''} onChange={(value) => setDraft({ ...draft, issueDate: value || null })} />
          <TextField label="Expiry date" type="date" onBlur={() => draft.expiryDate !== certification.expiryDate && void updateCertification({ certificationId: certification.id, changes: { expiryDate: draft.expiryDate } })} value={draft.expiryDate ?? ''} onChange={(value) => setDraft({ ...draft, expiryDate: value || null })} />
          <TextField label="Credential URL" type="url" onBlur={() => draft.credentialUrl !== certification.credentialUrl && void updateCertification({ certificationId: certification.id, changes: { credentialUrl: draft.credentialUrl } })} value={draft.credentialUrl} onChange={(value) => setDraft({ ...draft, credentialUrl: value })} />
        </div>
      </CollapsiblePanel>
    </div>
  )
}

const ReferenceCard = ({
  orderedReferenceIds,
  reference,
  defaultExpanded = false,
  scrollIntoViewOnMount = false,
  onScrollIntoViewComplete,
}: {
  orderedReferenceIds: string[]
  reference: Reference
  defaultExpanded?: boolean
  scrollIntoViewOnMount?: boolean
  onScrollIntoViewComplete?: () => void
}) => {
  const { deleteReference, reorderReferences, updateReference } = useProfileMutations()
  const [draft, setDraft] = useState(reference)
  const { scrollTargetRef: cardRef, scrollTargetStyle: cardScrollStyle } = useScrollIntoViewOnMount<HTMLDivElement>({
    enabled: scrollIntoViewOnMount,
    onComplete: onScrollIntoViewComplete,
  })

  const referenceIndex = orderedReferenceIds.indexOf(reference.id)

  useEffect(() => {
    setDraft(reference)
  }, [reference])

  const summary = summarizeParts([
    draft?.type === 'professional' ? 'Professional' : 'Personal',
    draft?.company || draft?.relationship || null,
  ])

  if (!draft) {
    return null
  }

  return (
    <div ref={cardRef} style={cardScrollStyle}>
      <CollapsiblePanel
        defaultExpanded={defaultExpanded}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ActionToggle checked={draft.enabled} label="Enable reference" onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              void updateReference({ referenceId: reference.id, changes: { enabled: value } })
            }} />
            <ReorderButtons
              canMoveDown={orderedReferenceIds.length > 1}
              canMoveUp={orderedReferenceIds.length > 1}
              onMoveDown={() =>
                void reorderReferences({
                  profileId: reference.profileId,
                  orderedIds: moveOrderedItem(orderedReferenceIds, referenceIndex, 1),
                })
              }
              onMoveUp={() =>
                void reorderReferences({
                  profileId: reference.profileId,
                  orderedIds: moveOrderedItem(orderedReferenceIds, referenceIndex, -1),
                })
              }
            />
            <DeleteIconButton label="Delete reference" onDelete={() => void deleteReference(reference.id)} />
          </div>
        }
        summary={summary}
        title={draft.name || reference.name || 'Reference'}
      >
        <div className="grid gap-4 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-app-text-muted">
          <span className="font-medium">Type</span>
          <select
            className="rounded-xl border border-app-border px-3 py-2 text-sm outline-none transition focus:border-app-focus-ring"
            onBlur={() => draft.type !== reference.type && void updateReference({ referenceId: reference.id, changes: { type: draft.type } })}
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value as ReferenceType })}
          >
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
          </select>
        </label>
        <TextField label="Name" onBlur={() => draft.name !== reference.name && void updateReference({ referenceId: reference.id, changes: { name: draft.name } })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Relationship" onBlur={() => draft.relationship !== reference.relationship && void updateReference({ referenceId: reference.id, changes: { relationship: draft.relationship } })} value={draft.relationship} onChange={(value) => setDraft({ ...draft, relationship: value })} />
        <TextField label="Company" onBlur={() => draft.company !== reference.company && void updateReference({ referenceId: reference.id, changes: { company: draft.company } })} value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" onBlur={() => draft.title !== reference.title && void updateReference({ referenceId: reference.id, changes: { title: draft.title } })} value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Email" type="email" onBlur={() => draft.email !== reference.email && void updateReference({ referenceId: reference.id, changes: { email: draft.email } })} value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
        <TextField label="Phone" type="tel" onBlur={() => draft.phone !== reference.phone && void updateReference({ referenceId: reference.id, changes: { phone: draft.phone } })} value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
        <div className="xl:col-span-2">
          <TextAreaField label="Notes" onBlur={() => draft.notes !== reference.notes && void updateReference({ referenceId: reference.id, changes: { notes: draft.notes } })} value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

export const ProfileChildEditors = ({
  additionalExperienceModel,
  achievementsModel,
  certificationsModel,
  educationModel,
  experienceModel,
  linksModel,
  profileId,
  projectsModel,
  referencesModel,
  skillsModel,
}: {
  additionalExperienceModel: ProfileEditorAdditionalExperienceModel
  achievementsModel: ProfileEditorAchievementsModel
  certificationsModel: ProfileEditorCertificationsModel
  educationModel: ProfileEditorEducationModel
  experienceModel: ProfileEditorExperienceModel
  linksModel: ProfileEditorLinksModel
  profileId: string
  projectsModel: ProfileEditorProjectsModel
  referencesModel: ProfileEditorReferencesModel
  skillsModel: ProfileEditorSkillsModel
}) => {
  const {
    createAchievement,
    createAdditionalExperienceEntry,
    createCertification,
    createEducationEntry,
    createExperienceEntry,
    createProfileLink,
    createProject,
    createReference,
    createSkillCategory,
  } = useProfileMutations()
  const [newProfileLinkId, setNewProfileLinkId] = useState<string | null>(null)
  const [newSkillCategoryId, setNewSkillCategoryId] = useState<string | null>(null)
  const [newAchievementId, setNewAchievementId] = useState<string | null>(null)
  const [newExperienceEntryId, setNewExperienceEntryId] = useState<string | null>(null)
  const [newEducationEntryId, setNewEducationEntryId] = useState<string | null>(null)
  const [newProjectId, setNewProjectId] = useState<string | null>(null)
  const [newAdditionalExperienceEntryId, setNewAdditionalExperienceEntryId] = useState<string | null>(null)
  const [newCertificationId, setNewCertificationId] = useState<string | null>(null)
  const [newReferenceId, setNewReferenceId] = useState<string | null>(null)

  const { profileLinks } = linksModel
  const { achievements } = achievementsModel
  const { skillCategories } = skillsModel
  const { experienceEntries } = experienceModel
  const { educationEntries } = educationModel
  const { projectEntries } = projectsModel
  const { additionalExperienceEntries } = additionalExperienceModel
  const { certifications } = certificationsModel
  const { references } = referencesModel

  const profileLinkIds = useMemo(() => profileLinks.map((item) => item.id), [profileLinks])
  const skillCategoryIds = useMemo(() => skillCategories.map((item) => item.category.id), [skillCategories])

  const experienceEntryIds = useMemo(() => experienceEntries.map((item) => item.entry.id), [experienceEntries])

  const achievementIds = useMemo(() => achievements.map((item) => item.id), [achievements])

  const educationEntryIds = useMemo(() => educationEntries.map((item) => item.entry.id), [educationEntries])

  const projectIds = useMemo(() => projectEntries.map((item) => item.entry.id), [projectEntries])

  const additionalExperienceEntryIds = useMemo(() => additionalExperienceEntries.map((item) => item.entry.id), [additionalExperienceEntries])

  const certificationIds = useMemo(() => certifications.map((item) => item.id), [certifications])

  const referenceIds = useMemo(() => references.map((item) => item.id), [references])

  const hasProfileLinks = profileLinkIds.length > 0
  const hasSkillCategories = skillCategoryIds.length > 0
  const hasAchievements = achievementIds.length > 0
  const hasExperienceEntries = experienceEntryIds.length > 0
  const hasEducationEntries = educationEntryIds.length > 0
  const hasProjects = projectIds.length > 0
  const hasAdditionalExperienceEntries = additionalExperienceEntryIds.length > 0
  const hasCertifications = certificationIds.length > 0
  const hasReferences = referenceIds.length > 0

  return (
    <>
      <CollapsiblePanel
        actionLabel="Add link"
        actionStyle="icon"
        collapsible={hasProfileLinks}
        description="Store the public URLs that should travel with this profile."
        onAction={async () => {
          const createdId = await createProfileLink(profileId)

          if (createdId) {
            setNewProfileLinkId(createdId)
          }
        }}
        showBottomActionWhenHeaderHidden
        title="Links"
      >
        {hasProfileLinks ? (
          <div className="space-y-4">
            {profileLinks.map((profileLink) => (
              <ProfileLinkRow
                key={profileLink.id}
                orderedProfileLinkIds={profileLinkIds}
                profileLink={profileLink}
                scrollIntoViewOnMount={profileLink.id === newProfileLinkId}
                {...(profileLink.id === newProfileLinkId
                  ? { onScrollIntoViewComplete: () => setNewProfileLinkId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add skill category"
        actionStyle="icon"
        collapsible={hasSkillCategories}
        description="Organize skills into enabled or disabled categories."
        onAction={async () => {
          const createdId = await createSkillCategory(profileId)

          if (createdId) {
            setNewSkillCategoryId(createdId)
          }
        }}
        showBottomActionWhenHeaderHidden
        title="Skills"
      >
        {hasSkillCategories ? (
          <div className="space-y-4">
            {skillCategories.map((skillCategoryEntry) => (
              <SkillCategoryCard
                defaultExpanded={skillCategoryEntry.category.id === newSkillCategoryId}
                key={skillCategoryEntry.category.id}
                orderedSkillCategoryIds={skillCategoryIds}
                scrollIntoViewOnMount={skillCategoryEntry.category.id === newSkillCategoryId}
                skillCategoryEntry={skillCategoryEntry}
                {...(skillCategoryEntry.category.id === newSkillCategoryId
                  ? { onScrollIntoViewComplete: () => setNewSkillCategoryId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add achievement"
        actionStyle="icon"
        collapsible={hasAchievements}
        description="Capture notable accomplishments that should appear as a standalone resume section."
        onAction={async () => {
          const createdId = await createAchievement(profileId)

          if (createdId) {
            setNewAchievementId(createdId)
          }
        }}
        showBottomActionWhenHeaderHidden
        title="Achievements"
      >
        {hasAchievements ? (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <AchievementCard
                achievement={achievement}
                defaultExpanded={achievement.id === newAchievementId}
                key={achievement.id}
                orderedAchievementIds={achievementIds}
                scrollIntoViewOnMount={achievement.id === newAchievementId}
                {...(achievement.id === newAchievementId
                  ? { onScrollIntoViewComplete: () => setNewAchievementId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add experience"
        actionStyle="icon"
        onAction={async () => {
          const createdId = await createExperienceEntry(profileId)

          if (createdId) {
            setNewExperienceEntryId(createdId)
          }
        }}
        collapsible={hasExperienceEntries}
        description="Capture work history entries used in resumes and applications."
        showBottomActionWhenHeaderHidden
        title="Experience"
      >
        {hasExperienceEntries ? (
          <div className="space-y-4">
            {experienceEntries.map((experienceEntry) => (
              <ExperienceCard
                defaultExpanded={experienceEntry.entry.id === newExperienceEntryId}
                experienceEntry={experienceEntry}
                key={experienceEntry.entry.id}
                orderedExperienceEntryIds={experienceEntryIds}
                scrollIntoViewOnMount={experienceEntry.entry.id === newExperienceEntryId}
                {...(experienceEntry.entry.id === newExperienceEntryId
                  ? { onScrollIntoViewComplete: () => setNewExperienceEntryId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add education"
        actionStyle="icon"
        onAction={async () => {
          const createdId = await createEducationEntry(profileId)

          if (createdId) {
            setNewEducationEntryId(createdId)
          }
        }}
        collapsible={hasEducationEntries}
        description="Store education entries that can be enabled or disabled per profile."
        showBottomActionWhenHeaderHidden
        title="Education"
      >
        {hasEducationEntries ? (
          <div className="space-y-4">
            {educationEntries.map((educationEntry) => (
              <EducationCard
                defaultExpanded={educationEntry.entry.id === newEducationEntryId}
                educationEntry={educationEntry}
                key={educationEntry.entry.id}
                orderedEducationEntryIds={educationEntryIds}
                scrollIntoViewOnMount={educationEntry.entry.id === newEducationEntryId}
                {...(educationEntry.entry.id === newEducationEntryId
                  ? { onScrollIntoViewComplete: () => setNewEducationEntryId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add project"
        actionStyle="icon"
        onAction={async () => {
          const createdId = await createProject(profileId)

          if (createdId) {
            setNewProjectId(createdId)
          }
        }}
        collapsible={hasProjects}
        description="Store projects with optional organization context, dates, and bullets."
        showBottomActionWhenHeaderHidden
        title="Projects"
      >
        {hasProjects ? (
          <div className="space-y-4">
            {projectEntries.map((projectEntry) => (
              <ProjectCard
                defaultExpanded={projectEntry.entry.id === newProjectId}
                key={projectEntry.entry.id}
                orderedProjectIds={projectIds}
                projectEntry={projectEntry}
                scrollIntoViewOnMount={projectEntry.entry.id === newProjectId}
                {...(projectEntry.entry.id === newProjectId
                  ? { onScrollIntoViewComplete: () => setNewProjectId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add additional experience"
        actionStyle="icon"
        onAction={async () => {
          const createdId = await createAdditionalExperienceEntry(profileId)

          if (createdId) {
            setNewAdditionalExperienceEntryId(createdId)
          }
        }}
        collapsible={hasAdditionalExperienceEntries}
        description="Store volunteer service or other non-standard experience with optional organization, location, dates, and bullets."
        showBottomActionWhenHeaderHidden
        title="Additional Experience"
      >
        {hasAdditionalExperienceEntries ? (
          <div className="space-y-4">
            {additionalExperienceEntries.map((additionalExperienceEntry) => (
              <AdditionalExperienceCard
                additionalExperienceEntry={additionalExperienceEntry}
                defaultExpanded={additionalExperienceEntry.entry.id === newAdditionalExperienceEntryId}
                key={additionalExperienceEntry.entry.id}
                orderedAdditionalExperienceEntryIds={additionalExperienceEntryIds}
                scrollIntoViewOnMount={additionalExperienceEntry.entry.id === newAdditionalExperienceEntryId}
                {...(additionalExperienceEntry.entry.id === newAdditionalExperienceEntryId
                  ? { onScrollIntoViewComplete: () => setNewAdditionalExperienceEntryId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add certification"
        actionStyle="icon"
        onAction={async () => {
          const createdId = await createCertification(profileId)

          if (createdId) {
            setNewCertificationId(createdId)
          }
        }}
        collapsible={hasCertifications}
        description="Track certifications and their optional credential metadata."
        showBottomActionWhenHeaderHidden
        title="Certifications"
      >
        {hasCertifications ? (
          <div className="space-y-4">
            {certifications.map((certification) => (
              <CertificationCard
                certification={certification}
                defaultExpanded={certification.id === newCertificationId}
                key={certification.id}
                orderedCertificationIds={certificationIds}
                scrollIntoViewOnMount={certification.id === newCertificationId}
                {...(certification.id === newCertificationId
                  ? { onScrollIntoViewComplete: () => setNewCertificationId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add reference"
        actionStyle="icon"
        collapsible={hasReferences}
        description="Maintain both professional and personal references."
        onAction={async () => {
          const createdId = await createReference(profileId)

          if (createdId) {
            setNewReferenceId(createdId)
          }
        }}
        showBottomActionWhenHeaderHidden
        title="References"
      >
        {hasReferences ? (
          <div className="space-y-4">
            {references.map((reference) => (
              <ReferenceCard
                defaultExpanded={reference.id === newReferenceId}
                key={reference.id}
                orderedReferenceIds={referenceIds}
                reference={reference}
                scrollIntoViewOnMount={reference.id === newReferenceId}
                {...(reference.id === newReferenceId
                  ? { onScrollIntoViewComplete: () => setNewReferenceId(null) }
                  : {})}
              />
            ))}
          </div>
        ) : null}
      </CollapsiblePanel>
    </>
  )
}
