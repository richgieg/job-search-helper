import { useEffect, useMemo, useState } from 'react'

import { ActionToggle, DeleteIconButton } from '../../components/CompactActionControls'
import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import { useAppStore } from '../../store/app-store'
import type { EmploymentType, ExperienceEntry, ReferenceType, WorkArrangement } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'

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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className={hideLabel ? 'sr-only' : 'font-medium'}>{label}</span>
    <input
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className={hideLabel ? 'sr-only' : 'font-medium'}>{label}</span>
    <textarea
      className={[minHeightClass, 'rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500', className]
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
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <select
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
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

const workArrangementOptions: Array<{ value: WorkArrangement; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

const employmentTypeOptions: Array<{ value: EmploymentType; label: string }> = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'other', label: 'Other' },
]

const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
    <input checked={checked} className="h-4 w-4 rounded border-slate-300" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    {label}
  </label>
)

const OrderBadge = ({ value }: { value: number }) => (
  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
    {value}
  </span>
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

const summarizeParts = (parts: Array<string | null | undefined>) => parts.filter((part): part is string => Boolean(part && part.trim())).join(' • ')

const ProfileLinkRow = ({ profileLinkId }: { profileLinkId: string }) => {
  const profileLink = useAppStore((state) => state.data.profileLinks[profileLinkId])
  const profileLinksById = useAppStore((state) => state.data.profileLinks)
  const updateProfileLink = useAppStore((state) => state.actions.updateProfileLink)
  const deleteProfileLink = useAppStore((state) => state.actions.deleteProfileLink)
  const reorderProfileLinks = useAppStore((state) => state.actions.reorderProfileLinks)
  const [name, setName] = useState(profileLink?.name ?? '')
  const [url, setUrl] = useState(profileLink?.url ?? '')
  const [enabled, setEnabled] = useState(profileLink?.enabled ?? true)

  const profileLinkIds = useMemo(
    () =>
      profileLink
        ? Object.values(profileLinksById)
            .filter((item) => item.profileId === profileLink.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [profileLink, profileLinksById],
  )
  const profileLinkIndex = profileLinkIds.indexOf(profileLinkId)

  useEffect(() => {
    if (!profileLink) {
      return
    }

    setName(profileLink.name)
    setUrl(profileLink.url)
    setEnabled(profileLink.enabled)
  }, [profileLink])

  if (!profileLink) {
    return null
  }

  const commitName = () => {
    if (name === profileLink.name) {
      return
    }

    updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { name },
    })
  }

  const commitUrl = () => {
    if (url === profileLink.url) {
      return
    }

    updateProfileLink({
      profileLinkId: profileLink.id,
      changes: { url },
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-end">
        <TextField label="Link name" onBlur={commitName} value={name} onChange={setName} />
        <TextField label="URL" type="url" onBlur={commitUrl} value={url} onChange={setUrl} />
        <div className="flex flex-wrap items-center justify-end gap-2 md:self-end">
          <ActionToggle checked={enabled} label="Enable profile link" onChange={(value) => {
            setEnabled(value)
            updateProfileLink({ profileLinkId: profileLink.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={profileLinkIds.length > 1}
            canMoveUp={profileLinkIds.length > 1}
            onMoveDown={() =>
              reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(profileLinkIds, profileLinkIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderProfileLinks({
                profileId: profileLink.profileId,
                orderedIds: moveOrderedItem(profileLinkIds, profileLinkIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete profile link" onDelete={() => deleteProfileLink(profileLink.id)} />
        </div>
      </div>
    </div>
  )
}

const ExperienceBulletRow = ({ bulletId }: { bulletId: string }) => {
  const bullet = useAppStore((state) => state.data.experienceBullets[bulletId])
  const bulletsById = useAppStore((state) => state.data.experienceBullets)
  const updateExperienceBullet = useAppStore((state) => state.actions.updateExperienceBullet)
  const deleteExperienceBullet = useAppStore((state) => state.actions.deleteExperienceBullet)
  const reorderExperienceBullets = useAppStore((state) => state.actions.reorderExperienceBullets)
  const [content, setContent] = useState(bullet?.content ?? '')
  const [enabled, setEnabled] = useState(bullet?.enabled ?? true)

  const bulletIds = useMemo(
    () =>
      bullet
        ? Object.values(bulletsById)
            .filter((item) => item.experienceEntryId === bullet.experienceEntryId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [bullet, bulletsById],
  )
  const bulletIndex = bulletIds.indexOf(bulletId)

  useEffect(() => {
    if (!bullet) {
      return
    }

    setContent(bullet.content)
    setEnabled(bullet.enabled)
  }, [bullet])

  if (!bullet) {
    return null
  }

  const commitContent = () => {
    if (content === bullet.content) {
      return
    }

    updateExperienceBullet({ experienceBulletId: bullet.id, changes: { content } })
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <TextAreaField hideLabel label="Bullet" minHeightClass="min-h-10" onBlur={commitContent} placeholder="Describe an accomplishment or responsibility" value={content} onChange={setContent} />
      <div className="flex flex-wrap items-center justify-end gap-2 md:self-center">
        <ActionToggle checked={enabled} label="Enable experience bullet" onChange={(value) => {
          setEnabled(value)
          updateExperienceBullet({ experienceBulletId: bullet.id, changes: { enabled: value } })
        }} />
        <ReorderButtons
          canMoveDown={bulletIds.length > 1}
          canMoveUp={bulletIds.length > 1}
          onMoveDown={() =>
            reorderExperienceBullets({
              experienceEntryId: bullet.experienceEntryId,
              orderedIds: moveOrderedItem(bulletIds, bulletIndex, 1),
            })
          }
          onMoveUp={() =>
            reorderExperienceBullets({
              experienceEntryId: bullet.experienceEntryId,
              orderedIds: moveOrderedItem(bulletIds, bulletIndex, -1),
            })
          }
        />
        <DeleteIconButton label="Delete experience bullet" onDelete={() => deleteExperienceBullet(bullet.id)} />
      </div>
    </div>
  )
}

const SkillRow = ({ skillId }: { skillId: string }) => {
  const skill = useAppStore((state) => state.data.skills[skillId])
  const skillsById = useAppStore((state) => state.data.skills)
  const updateSkill = useAppStore((state) => state.actions.updateSkill)
  const deleteSkill = useAppStore((state) => state.actions.deleteSkill)
  const reorderSkills = useAppStore((state) => state.actions.reorderSkills)
  const [name, setName] = useState(skill?.name ?? '')
  const [enabled, setEnabled] = useState(skill?.enabled ?? true)

  const skillIds = useMemo(
    () =>
      skill
        ? Object.values(skillsById)
            .filter((item) => item.skillCategoryId === skill.skillCategoryId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [skill, skillsById],
  )
  const skillIndex = skillIds.indexOf(skillId)

  useEffect(() => {
    if (!skill) {
      return
    }

    setName(skill.name)
    setEnabled(skill.enabled)
  }, [skill])

  if (!skill) {
    return null
  }

  const commitName = () => {
    if (name === skill.name) {
      return
    }

    updateSkill({ skillId: skill.id, changes: { name } })
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
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
            updateSkill({ skillId: skill.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={skillIds.length > 1}
            canMoveUp={skillIds.length > 1}
            onMoveDown={() =>
              reorderSkills({
                skillCategoryId: skill.skillCategoryId,
                orderedIds: moveOrderedItem(skillIds, skillIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderSkills({
                skillCategoryId: skill.skillCategoryId,
                orderedIds: moveOrderedItem(skillIds, skillIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete skill" onDelete={() => deleteSkill(skill.id)} />
        </div>
      </div>
    </div>
  )
}

const SkillCategoryCard = ({ skillCategoryId }: { skillCategoryId: string }) => {
  const category = useAppStore((state) => state.data.skillCategories[skillCategoryId])
  const skillCategoriesById = useAppStore((state) => state.data.skillCategories)
  const skillsById = useAppStore((state) => state.data.skills)
  const updateSkillCategory = useAppStore((state) => state.actions.updateSkillCategory)
  const deleteSkillCategory = useAppStore((state) => state.actions.deleteSkillCategory)
  const reorderSkillCategories = useAppStore((state) => state.actions.reorderSkillCategories)
  const createSkill = useAppStore((state) => state.actions.createSkill)
  const [name, setName] = useState(category?.name ?? '')
  const [enabled, setEnabled] = useState(category?.enabled ?? true)

  const skillCategoryIds = useMemo(
    () =>
      category
        ? Object.values(skillCategoriesById)
            .filter((item) => item.profileId === category.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [category, skillCategoriesById],
  )
  const skillCategoryIndex = skillCategoryIds.indexOf(skillCategoryId)

  const skillIds = useMemo(
    () =>
      Object.values(skillsById)
        .filter((item) => item.skillCategoryId === skillCategoryId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [skillCategoryId, skillsById],
  )
  const splitSkillIndex = Math.ceil(skillIds.length / 2)
  const leftColumnSkillIds = skillIds.slice(0, splitSkillIndex)
  const rightColumnSkillIds = skillIds.slice(splitSkillIndex)

  useEffect(() => {
    if (!category) {
      return
    }

    setName(category.name)
    setEnabled(category.enabled)
  }, [category])

  const summary = summarizeParts([countLabel(skillIds.length, 'skill')])

  if (!category) {
    return null
  }

  const commitName = () => {
    if (name === category.name) {
      return
    }

    updateSkillCategory({ skillCategoryId: category.id, changes: { name } })
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionToggle checked={enabled} label="Enable skill category" onChange={(value) => {
            setEnabled(value)
            updateSkillCategory({ skillCategoryId: category.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={skillCategoryIds.length > 1}
            canMoveUp={skillCategoryIds.length > 1}
            onMoveDown={() =>
              reorderSkillCategories({
                profileId: category.profileId,
                orderedIds: moveOrderedItem(skillCategoryIds, skillCategoryIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderSkillCategories({
                profileId: category.profileId,
                orderedIds: moveOrderedItem(skillCategoryIds, skillCategoryIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete skill category" onDelete={() => deleteSkillCategory(category.id)} />
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
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Skills</h4>
          <button
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => createSkill(category.id)}
            type="button"
          >
            Add skill
          </button>
        </div>

        <div className="mt-3">
          {skillIds.length === 0 ? (
            <p className="text-sm text-slate-500">No skills yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                {leftColumnSkillIds.map((skillId) => <SkillRow key={skillId} skillId={skillId} />)}
              </div>
              <div className="space-y-3">
                {rightColumnSkillIds.map((skillId) => <SkillRow key={skillId} skillId={skillId} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </CollapsiblePanel>
  )
}

const ExperienceCard = ({ entryId }: { entryId: string }) => {
  const entry = useAppStore((state) => state.data.experienceEntries[entryId])
  const experienceEntriesById = useAppStore((state) => state.data.experienceEntries)
  const bulletsById = useAppStore((state) => state.data.experienceBullets)
  const updateExperienceEntry = useAppStore((state) => state.actions.updateExperienceEntry)
  const deleteExperienceEntry = useAppStore((state) => state.actions.deleteExperienceEntry)
  const reorderExperienceEntries = useAppStore((state) => state.actions.reorderExperienceEntries)
  const createExperienceBullet = useAppStore((state) => state.actions.createExperienceBullet)
  const [draft, setDraft] = useState(entry)

  const experienceEntryIds = useMemo(
    () =>
      entry
        ? Object.values(experienceEntriesById)
            .filter((item) => item.profileId === entry.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [entry, experienceEntriesById],
  )
  const experienceEntryIndex = experienceEntryIds.indexOf(entryId)

  const bulletIds = useMemo(
    () =>
      Object.values(bulletsById)
        .filter((item) => item.experienceEntryId === entryId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [bulletsById, entryId],
  )

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  const summary = summarizeParts([
    draft?.company || 'Unknown company',
    formatDateRange(draft?.startDate ?? null, draft?.endDate ?? null, draft?.isCurrent),
    countLabel(bulletIds.length, 'bullet'),
  ])

  if (!entry || !draft) {
    return null
  }

  const commitEntryChanges = (changes: Partial<Omit<ExperienceEntry, 'id' | 'profileId'>>) => {
    updateExperienceEntry({ experienceEntryId: entry.id, changes })
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionToggle checked={draft.enabled} label="Enable experience entry" onChange={(value) => {
            setDraft({ ...draft, enabled: value })
            updateExperienceEntry({ experienceEntryId: entry.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={experienceEntryIds.length > 1}
            canMoveUp={experienceEntryIds.length > 1}
            onMoveDown={() =>
              reorderExperienceEntries({
                profileId: entry.profileId,
                orderedIds: moveOrderedItem(experienceEntryIds, experienceEntryIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderExperienceEntries({
                profileId: entry.profileId,
                orderedIds: moveOrderedItem(experienceEntryIds, experienceEntryIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete experience entry" onDelete={() => deleteExperienceEntry(entry.id)} />
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
            updateExperienceEntry({ experienceEntryId: entry.id, changes: { isCurrent: value } })
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
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Supervisor</h4>
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
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Bullets</h4>
            <button
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => createExperienceBullet(entry.id)}
              type="button"
            >
              Add bullet
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {bulletIds.length === 0 ? (
              <p className="text-sm text-slate-500">No bullets yet.</p>
            ) : (
              bulletIds.map((bulletId) => <ExperienceBulletRow key={bulletId} bulletId={bulletId} />)
            )}
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  )
}

const EducationCard = ({ entryId }: { entryId: string }) => {
  const entry = useAppStore((state) => state.data.educationEntries[entryId])
  const educationEntriesById = useAppStore((state) => state.data.educationEntries)
  const updateEducationEntry = useAppStore((state) => state.actions.updateEducationEntry)
  const deleteEducationEntry = useAppStore((state) => state.actions.deleteEducationEntry)
  const reorderEducationEntries = useAppStore((state) => state.actions.reorderEducationEntries)
  const [draft, setDraft] = useState(entry)

  const educationEntryIds = useMemo(
    () =>
      entry
        ? Object.values(educationEntriesById)
            .filter((item) => item.profileId === entry.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [educationEntriesById, entry],
  )
  const educationEntryIndex = educationEntryIds.indexOf(entryId)

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  const summary = summarizeParts([
    draft?.school || 'No school',
    formatMonthYear(draft?.graduationDate ?? null) || null,
  ])

  if (!entry || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionToggle checked={draft.enabled} label="Enable education entry" onChange={(value) => {
            setDraft({ ...draft, enabled: value })
            updateEducationEntry({ educationEntryId: entry.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={educationEntryIds.length > 1}
            canMoveUp={educationEntryIds.length > 1}
            onMoveDown={() =>
              reorderEducationEntries({
                profileId: entry.profileId,
                orderedIds: moveOrderedItem(educationEntryIds, educationEntryIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderEducationEntries({
                profileId: entry.profileId,
                orderedIds: moveOrderedItem(educationEntryIds, educationEntryIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete education entry" onDelete={() => deleteEducationEntry(entry.id)} />
        </div>
      }
      summary={summary}
      title={draft.degree || entry.degree || 'Education entry'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Degree" onBlur={() => draft.degree !== entry.degree && updateEducationEntry({ educationEntryId: entry.id, changes: { degree: draft.degree } })} value={draft.degree} onChange={(value) => setDraft({ ...draft, degree: value })} />
        <TextField label="School" onBlur={() => draft.school !== entry.school && updateEducationEntry({ educationEntryId: entry.id, changes: { school: draft.school } })} value={draft.school} onChange={(value) => setDraft({ ...draft, school: value })} />
        <TextField label="Graduation date" type="date" onBlur={() => draft.graduationDate !== entry.graduationDate && updateEducationEntry({ educationEntryId: entry.id, changes: { graduationDate: draft.graduationDate } })} value={draft.graduationDate ?? ''} onChange={(value) => setDraft({ ...draft, graduationDate: value || null })} />
      </div>
    </CollapsiblePanel>
  )
}

const CertificationCard = ({ certificationId }: { certificationId: string }) => {
  const certification = useAppStore((state) => state.data.certifications[certificationId])
  const certificationsById = useAppStore((state) => state.data.certifications)
  const updateCertification = useAppStore((state) => state.actions.updateCertification)
  const deleteCertification = useAppStore((state) => state.actions.deleteCertification)
  const reorderCertifications = useAppStore((state) => state.actions.reorderCertifications)
  const [draft, setDraft] = useState(certification)

  const certificationIds = useMemo(
    () =>
      certification
        ? Object.values(certificationsById)
            .filter((item) => item.profileId === certification.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [certification, certificationsById],
  )
  const certificationIndex = certificationIds.indexOf(certificationId)

  useEffect(() => {
    setDraft(certification)
  }, [certification])

  const summary = summarizeParts([
    draft?.issuer || 'No issuer',
    formatMonthYear(draft?.issueDate ?? null) || null,
    draft?.expiryDate ? `Expires ${formatMonthYear(draft.expiryDate)}` : null,
  ])

  if (!certification || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionToggle checked={draft.enabled} label="Enable certification" onChange={(value) => {
            setDraft({ ...draft, enabled: value })
            updateCertification({ certificationId: certification.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={certificationIds.length > 1}
            canMoveUp={certificationIds.length > 1}
            onMoveDown={() =>
              reorderCertifications({
                profileId: certification.profileId,
                orderedIds: moveOrderedItem(certificationIds, certificationIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderCertifications({
                profileId: certification.profileId,
                orderedIds: moveOrderedItem(certificationIds, certificationIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete certification" onDelete={() => deleteCertification(certification.id)} />
        </div>
      }
      summary={summary}
      title={draft.name || certification.name || 'Certification'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Name" onBlur={() => draft.name !== certification.name && updateCertification({ certificationId: certification.id, changes: { name: draft.name } })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Issuer" onBlur={() => draft.issuer !== certification.issuer && updateCertification({ certificationId: certification.id, changes: { issuer: draft.issuer } })} value={draft.issuer} onChange={(value) => setDraft({ ...draft, issuer: value })} />
        <TextField label="Credential ID" onBlur={() => draft.credentialId !== certification.credentialId && updateCertification({ certificationId: certification.id, changes: { credentialId: draft.credentialId } })} value={draft.credentialId} onChange={(value) => setDraft({ ...draft, credentialId: value })} />
        <TextField label="Issue date" type="date" onBlur={() => draft.issueDate !== certification.issueDate && updateCertification({ certificationId: certification.id, changes: { issueDate: draft.issueDate } })} value={draft.issueDate ?? ''} onChange={(value) => setDraft({ ...draft, issueDate: value || null })} />
        <TextField label="Expiry date" type="date" onBlur={() => draft.expiryDate !== certification.expiryDate && updateCertification({ certificationId: certification.id, changes: { expiryDate: draft.expiryDate } })} value={draft.expiryDate ?? ''} onChange={(value) => setDraft({ ...draft, expiryDate: value || null })} />
        <TextField label="Credential URL" type="url" onBlur={() => draft.credentialUrl !== certification.credentialUrl && updateCertification({ certificationId: certification.id, changes: { credentialUrl: draft.credentialUrl } })} value={draft.credentialUrl} onChange={(value) => setDraft({ ...draft, credentialUrl: value })} />
      </div>
    </CollapsiblePanel>
  )
}

const ReferenceCard = ({ referenceId }: { referenceId: string }) => {
  const reference = useAppStore((state) => state.data.references[referenceId])
  const referencesById = useAppStore((state) => state.data.references)
  const updateReference = useAppStore((state) => state.actions.updateReference)
  const deleteReference = useAppStore((state) => state.actions.deleteReference)
  const reorderReferences = useAppStore((state) => state.actions.reorderReferences)
  const [draft, setDraft] = useState(reference)

  const referenceIds = useMemo(
    () =>
      reference
        ? Object.values(referencesById)
            .filter((item) => item.profileId === reference.profileId)
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => item.id)
        : [],
    [reference, referencesById],
  )
  const referenceIndex = referenceIds.indexOf(referenceId)

  useEffect(() => {
    setDraft(reference)
  }, [reference])

  const summary = summarizeParts([
    draft?.type === 'professional' ? 'Professional' : 'Personal',
    draft?.company || draft?.relationship || null,
  ])

  if (!reference || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionToggle checked={draft.enabled} label="Enable reference" onChange={(value) => {
            setDraft({ ...draft, enabled: value })
            updateReference({ referenceId: reference.id, changes: { enabled: value } })
          }} />
          <ReorderButtons
            canMoveDown={referenceIds.length > 1}
            canMoveUp={referenceIds.length > 1}
            onMoveDown={() =>
              reorderReferences({
                profileId: reference.profileId,
                orderedIds: moveOrderedItem(referenceIds, referenceIndex, 1),
              })
            }
            onMoveUp={() =>
              reorderReferences({
                profileId: reference.profileId,
                orderedIds: moveOrderedItem(referenceIds, referenceIndex, -1),
              })
            }
          />
          <DeleteIconButton label="Delete reference" onDelete={() => deleteReference(reference.id)} />
        </div>
      }
      summary={summary}
      title={draft.name || reference.name || 'Reference'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Type</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            onBlur={() => draft.type !== reference.type && updateReference({ referenceId: reference.id, changes: { type: draft.type } })}
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value as ReferenceType })}
          >
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
          </select>
        </label>
        <TextField label="Name" onBlur={() => draft.name !== reference.name && updateReference({ referenceId: reference.id, changes: { name: draft.name } })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Relationship" onBlur={() => draft.relationship !== reference.relationship && updateReference({ referenceId: reference.id, changes: { relationship: draft.relationship } })} value={draft.relationship} onChange={(value) => setDraft({ ...draft, relationship: value })} />
        <TextField label="Company" onBlur={() => draft.company !== reference.company && updateReference({ referenceId: reference.id, changes: { company: draft.company } })} value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" onBlur={() => draft.title !== reference.title && updateReference({ referenceId: reference.id, changes: { title: draft.title } })} value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Email" type="email" onBlur={() => draft.email !== reference.email && updateReference({ referenceId: reference.id, changes: { email: draft.email } })} value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
        <TextField label="Phone" type="tel" onBlur={() => draft.phone !== reference.phone && updateReference({ referenceId: reference.id, changes: { phone: draft.phone } })} value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
        <div className="xl:col-span-2">
          <TextAreaField label="Notes" onBlur={() => draft.notes !== reference.notes && updateReference({ referenceId: reference.id, changes: { notes: draft.notes } })} value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
      </div>
    </CollapsiblePanel>
  )
}

export const ProfileChildEditors = ({ profileId }: { profileId: string }) => {
  const profileLinksById = useAppStore((state) => state.data.profileLinks)
  const skillCategoriesById = useAppStore((state) => state.data.skillCategories)
  const experienceEntriesById = useAppStore((state) => state.data.experienceEntries)
  const educationEntriesById = useAppStore((state) => state.data.educationEntries)
  const certificationsById = useAppStore((state) => state.data.certifications)
  const referencesById = useAppStore((state) => state.data.references)
  const createProfileLink = useAppStore((state) => state.actions.createProfileLink)
  const createSkillCategory = useAppStore((state) => state.actions.createSkillCategory)
  const createExperienceEntry = useAppStore((state) => state.actions.createExperienceEntry)
  const createEducationEntry = useAppStore((state) => state.actions.createEducationEntry)
  const createCertification = useAppStore((state) => state.actions.createCertification)
  const createReference = useAppStore((state) => state.actions.createReference)

  const profileLinkIds = useMemo(
    () =>
      Object.values(profileLinksById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [profileId, profileLinksById],
  )

  const skillCategoryIds = useMemo(
    () =>
      Object.values(skillCategoriesById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [profileId, skillCategoriesById],
  )

  const experienceEntryIds = useMemo(
    () =>
      Object.values(experienceEntriesById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [experienceEntriesById, profileId],
  )

  const educationEntryIds = useMemo(
    () =>
      Object.values(educationEntriesById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [educationEntriesById, profileId],
  )

  const certificationIds = useMemo(
    () =>
      Object.values(certificationsById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [certificationsById, profileId],
  )

  const referenceIds = useMemo(
    () =>
      Object.values(referencesById)
        .filter((item) => item.profileId === profileId)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.id),
    [profileId, referencesById],
  )

  const hasProfileLinks = profileLinkIds.length > 0
  const hasSkillCategories = skillCategoryIds.length > 0
  const hasExperienceEntries = experienceEntryIds.length > 0
  const hasEducationEntries = educationEntryIds.length > 0
  const hasCertifications = certificationIds.length > 0
  const hasReferences = referenceIds.length > 0

  return (
    <>
      <CollapsiblePanel
        actionLabel="Add link"
        collapsible={hasProfileLinks}
        description="Store the public URLs that should travel with this profile."
        onAction={() => createProfileLink(profileId)}
        title="Links"
      >
        {hasProfileLinks ? <div className="space-y-4">{profileLinkIds.map((id) => <ProfileLinkRow key={id} profileLinkId={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add skill category"
        collapsible={hasSkillCategories}
        description="Organize skills into enabled or disabled categories."
        onAction={() => createSkillCategory(profileId)}
        title="Skills"
      >
        {hasSkillCategories ? <div className="space-y-4">{skillCategoryIds.map((id) => <SkillCategoryCard key={id} skillCategoryId={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add experience"
        collapsible={hasExperienceEntries}
        description="Capture work history entries used in resumes and applications."
        onAction={() => createExperienceEntry(profileId)}
        title="Experience"
      >
        {hasExperienceEntries ? <div className="space-y-4">{experienceEntryIds.map((id) => <ExperienceCard entryId={id} key={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add education"
        collapsible={hasEducationEntries}
        description="Store education entries that can be enabled or disabled per profile."
        onAction={() => createEducationEntry(profileId)}
        title="Education"
      >
        {hasEducationEntries ? <div className="space-y-4">{educationEntryIds.map((id) => <EducationCard entryId={id} key={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add certification"
        collapsible={hasCertifications}
        description="Track certifications and their optional credential metadata."
        onAction={() => createCertification(profileId)}
        title="Certifications"
      >
        {hasCertifications ? <div className="space-y-4">{certificationIds.map((id) => <CertificationCard certificationId={id} key={id} />)}</div> : null}
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add reference"
        collapsible={hasReferences}
        description="Maintain both professional and personal references."
        onAction={() => createReference(profileId)}
        title="References"
      >
        {hasReferences ? <div className="space-y-4">{referenceIds.map((id) => <ReferenceCard key={id} referenceId={id} />)}</div> : null}
      </CollapsiblePanel>
    </>
  )
}
