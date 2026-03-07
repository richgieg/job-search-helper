import { useCallback, useEffect, useMemo, useState } from 'react'

import { CollapsiblePanel } from '../../components/CollapsiblePanel'
import { ReorderButtons } from '../../components/ReorderButtons'
import { useAppStore } from '../../store/app-store'
import type { EmploymentType, ReferenceType, WorkArrangement } from '../../types/state'
import { moveOrderedItem } from '../../utils/reorder'

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date'
}) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <input
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <textarea
      className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const SelectField = <T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
}) => (
  <label className="flex flex-col gap-2 text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <select
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
      value={value}
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

const sectionSaveButtonClassName =
  'rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300'

const ItemActions = ({
  onSave,
  onDelete,
  saveDisabled = false,
}: {
  onSave: () => void
  onDelete: () => void
  saveDisabled?: boolean
}) => (
  <div className="flex flex-wrap gap-2">
    <button className={sectionSaveButtonClassName} disabled={saveDisabled} onClick={onSave} type="button">
      Save
    </button>
    <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={onDelete} type="button">
      Delete
    </button>
  </div>
)

const updateDirtyFlags = (current: Record<string, boolean>, id: string, dirty: boolean) => {
  if (dirty) {
    if (current[id]) {
      return current
    }

    return {
      ...current,
      [id]: true,
    }
  }

  if (!current[id]) {
    return current
  }

  const next = { ...current }
  delete next[id]
  return next
}

const countLabel = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`

const formatEnabledState = (enabled: boolean) => (enabled ? 'Enabled' : 'Disabled')

const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent?: boolean) => {
  const start = startDate || 'No start date'
  const end = isCurrent ? 'Present' : endDate || 'No end date'

  return `${start} – ${end}`
}

const summarizeParts = (parts: Array<string | null | undefined>) => parts.filter((part): part is string => Boolean(part && part.trim())).join(' • ')

const stripEnabled = <T extends { enabled: boolean }>(value: T) => {
  const { enabled: _enabled, ...rest } = value
  return rest
}

const ExperienceBulletRow = ({
  bulletId,
  onDirtyChange,
}: {
  bulletId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
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

  const isDirty = bullet ? content !== bullet.content : false

  useEffect(() => {
    onDirtyChange?.(bulletId, isDirty)

    return () => {
      onDirtyChange?.(bulletId, false)
    }
  }, [bulletId, isDirty, onDirtyChange])

  if (!bullet) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <TextAreaField label="Bullet" placeholder="Describe an accomplishment or responsibility" value={content} onChange={setContent} />
        <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-end">
          <ToggleField
            checked={enabled}
            label="Enabled"
            onChange={(value) => {
              setEnabled(value)
              updateExperienceBullet({ experienceBulletId: bullet.id, changes: { enabled: value } })
            }}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
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
            <ItemActions
              onDelete={() => deleteExperienceBullet(bullet.id)}
              onSave={() => updateExperienceBullet({ experienceBulletId: bullet.id, changes: { content } })}
              saveDisabled={!isDirty}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const SkillRow = ({
  skillId,
  onDirtyChange,
}: {
  skillId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
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

  const isDirty = skill ? name !== skill.name : false

  useEffect(() => {
    onDirtyChange?.(skillId, isDirty)

    return () => {
      onDirtyChange?.(skillId, false)
    }
  }, [isDirty, onDirtyChange, skillId])

  if (!skill) {
    return null
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
      <TextField label="Skill name" value={name} onChange={setName} />
      <ToggleField
        checked={enabled}
        label="Enabled"
        onChange={(value) => {
          setEnabled(value)
          updateSkill({ skillId: skill.id, changes: { enabled: value } })
        }}
      />
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
      <ItemActions
        onDelete={() => deleteSkill(skill.id)}
        onSave={() => updateSkill({ skillId: skill.id, changes: { name } })}
        saveDisabled={!isDirty}
      />
    </div>
  )
}

const SkillCategoryCard = ({
  skillCategoryId,
  onDirtyChange,
}: {
  skillCategoryId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
  const category = useAppStore((state) => state.data.skillCategories[skillCategoryId])
  const skillCategoriesById = useAppStore((state) => state.data.skillCategories)
  const skillsById = useAppStore((state) => state.data.skills)
  const updateSkillCategory = useAppStore((state) => state.actions.updateSkillCategory)
  const deleteSkillCategory = useAppStore((state) => state.actions.deleteSkillCategory)
  const reorderSkillCategories = useAppStore((state) => state.actions.reorderSkillCategories)
  const createSkill = useAppStore((state) => state.actions.createSkill)
  const [name, setName] = useState(category?.name ?? '')
  const [enabled, setEnabled] = useState(category?.enabled ?? true)
  const [dirtySkillIds, setDirtySkillIds] = useState<Record<string, boolean>>({})

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

  useEffect(() => {
    if (!category) {
      return
    }

    setName(category.name)
    setEnabled(category.enabled)
  }, [category])

  const ownIsDirty = category ? name !== category.name : false
  const isDirty = category ? ownIsDirty || Object.keys(dirtySkillIds).length > 0 : false
  const summary = summarizeParts([
    name || 'Untitled category',
    formatEnabledState(enabled),
    countLabel(skillIds.length, 'skill'),
  ])

  const handleSkillDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtySkillIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  useEffect(() => {
    onDirtyChange?.(skillCategoryId, isDirty)

    return () => {
      onDirtyChange?.(skillCategoryId, false)
    }
  }, [isDirty, onDirtyChange, skillCategoryId])

  if (!category) {
    return null
  }

  return (
    <CollapsiblePanel
      actionLabel="Add skill"
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleField
            checked={enabled}
            label="Enabled"
            onChange={(value) => {
              setEnabled(value)
              updateSkillCategory({ skillCategoryId: category.id, changes: { enabled: value } })
            }}
          />
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
          <ItemActions
            onDelete={() => deleteSkillCategory(category.id)}
            onSave={() => updateSkillCategory({ skillCategoryId: category.id, changes: { name } })}
            saveDisabled={!ownIsDirty}
          />
        </div>
      }
      isDirty={isDirty}
      onAction={() => createSkill(category.id)}
      onDiscardChanges={() => {
        setName(category.name)
        setEnabled(category.enabled)
        setDirtySkillIds({})
      }}
      summary={summary}
      title={name || 'Skill category'}
    >
      <div className="grid gap-3">
        <TextField label="Category name" value={name} onChange={setName} />
      </div>

      <div className="mt-4 space-y-3">
        {skillIds.length === 0 ? <p className="text-sm text-slate-500">No skills yet.</p> : skillIds.map((skillId) => <SkillRow key={skillId} onDirtyChange={handleSkillDirtyChange} skillId={skillId} />)}
      </div>
    </CollapsiblePanel>
  )
}

const ExperienceCard = ({
  entryId,
  onDirtyChange,
}: {
  entryId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
  const entry = useAppStore((state) => state.data.experienceEntries[entryId])
  const experienceEntriesById = useAppStore((state) => state.data.experienceEntries)
  const bulletsById = useAppStore((state) => state.data.experienceBullets)
  const updateExperienceEntry = useAppStore((state) => state.actions.updateExperienceEntry)
  const deleteExperienceEntry = useAppStore((state) => state.actions.deleteExperienceEntry)
  const reorderExperienceEntries = useAppStore((state) => state.actions.reorderExperienceEntries)
  const createExperienceBullet = useAppStore((state) => state.actions.createExperienceBullet)
  const [draft, setDraft] = useState(entry)
  const [dirtyBulletIds, setDirtyBulletIds] = useState<Record<string, boolean>>({})

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

  const ownIsDirty = entry && draft ? JSON.stringify(stripEnabled(draft)) !== JSON.stringify(stripEnabled(entry)) : false
  const isDirty = entry && draft ? ownIsDirty || Object.keys(dirtyBulletIds).length > 0 : false
  const summary = summarizeParts([
    draft?.title || 'Untitled role',
    draft?.company || 'Unknown company',
    formatDateRange(draft?.startDate ?? null, draft?.endDate ?? null, draft?.isCurrent),
    formatEnabledState(draft?.enabled ?? true),
    countLabel(bulletIds.length, 'bullet'),
  ])

  const handleBulletDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyBulletIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  useEffect(() => {
    onDirtyChange?.(entryId, isDirty)

    return () => {
      onDirtyChange?.(entryId, false)
    }
  }, [entryId, isDirty, onDirtyChange])

  if (!entry || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      actionLabel="Add bullet"
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleField
            checked={draft.enabled}
            label="Enabled"
            onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              updateExperienceEntry({ experienceEntryId: entry.id, changes: { enabled: value } })
            }}
          />
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
          <ItemActions
            onDelete={() => deleteExperienceEntry(entry.id)}
            onSave={() => updateExperienceEntry({ experienceEntryId: entry.id, changes: stripEnabled(draft) })}
            saveDisabled={!ownIsDirty}
          />
        </div>
      }
      isDirty={isDirty}
      onAction={() => createExperienceBullet(entry.id)}
      onDiscardChanges={() => {
        setDraft(entry)
        setDirtyBulletIds({})
      }}
      summary={summary}
      title={draft.title || entry.title || 'Experience entry'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Company" value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
        <SelectField label="Work arrangement" value={draft.workArrangement} onChange={(value) => setDraft({ ...draft, workArrangement: value })} options={workArrangementOptions} />
        <SelectField label="Employment type" value={draft.employmentType} onChange={(value) => setDraft({ ...draft, employmentType: value })} options={employmentTypeOptions} />
        <TextField label="Start date" type="date" value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
        <TextField label="End date" type="date" value={draft.endDate ?? ''} onChange={(value) => setDraft({ ...draft, endDate: value || null })} />
        <ToggleField checked={draft.isCurrent} label="Current role" onChange={(value) => setDraft({ ...draft, isCurrent: value })} />
        <TextField
          label="Reason for leaving (short)"
          value={draft.reasonForLeavingShort}
          onChange={(value) => setDraft({ ...draft, reasonForLeavingShort: value })}
        />
        <div className="xl:col-span-3">
          <TextAreaField
            label="Reason for leaving (details)"
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
              value={draft.supervisor.name}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, name: value } })}
            />
            <TextField
              label="Supervisor title"
              value={draft.supervisor.title}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, title: value } })}
            />
            <TextField
              label="Supervisor phone"
              type="tel"
              value={draft.supervisor.phone}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, phone: value } })}
            />
            <TextField
              label="Supervisor email"
              type="email"
              value={draft.supervisor.email}
              onChange={(value) => setDraft({ ...draft, supervisor: { ...draft.supervisor, email: value } })}
            />
          </div>
        </div>
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Bullets</h4>
          </div>
          <div className="mt-3 space-y-3">
            {bulletIds.length === 0 ? (
              <p className="text-sm text-slate-500">No bullets yet.</p>
            ) : (
              bulletIds.map((bulletId) => <ExperienceBulletRow key={bulletId} bulletId={bulletId} onDirtyChange={handleBulletDirtyChange} />)
            )}
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  )
}

const EducationCard = ({
  entryId,
  onDirtyChange,
}: {
  entryId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
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

  const isDirty = entry && draft ? JSON.stringify(stripEnabled(draft)) !== JSON.stringify(stripEnabled(entry)) : false
  const summary = summarizeParts([
    draft?.degree || 'No degree',
    draft?.school || 'No school',
    draft?.graduationDate ? `Graduates ${draft.graduationDate}` : null,
    formatEnabledState(draft?.enabled ?? true),
  ])

  useEffect(() => {
    onDirtyChange?.(entryId, isDirty)

    return () => {
      onDirtyChange?.(entryId, false)
    }
  }, [entryId, isDirty, onDirtyChange])

  if (!entry || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleField
            checked={draft.enabled}
            label="Enabled"
            onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              updateEducationEntry({ educationEntryId: entry.id, changes: { enabled: value } })
            }}
          />
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
          <ItemActions
            onDelete={() => deleteEducationEntry(entry.id)}
            onSave={() => updateEducationEntry({ educationEntryId: entry.id, changes: stripEnabled(draft) })}
            saveDisabled={!isDirty}
          />
        </div>
      }
      isDirty={isDirty}
      onDiscardChanges={() => setDraft(entry)}
      summary={summary}
      title={draft.school || entry.school || 'Education entry'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="School" value={draft.school} onChange={(value) => setDraft({ ...draft, school: value })} />
        <TextField label="Degree" value={draft.degree} onChange={(value) => setDraft({ ...draft, degree: value })} />
        <TextField label="Graduation date" type="date" value={draft.graduationDate ?? ''} onChange={(value) => setDraft({ ...draft, graduationDate: value || null })} />
      </div>
    </CollapsiblePanel>
  )
}

const CertificationCard = ({
  certificationId,
  onDirtyChange,
}: {
  certificationId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
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

  const isDirty = certification && draft ? JSON.stringify(stripEnabled(draft)) !== JSON.stringify(stripEnabled(certification)) : false
  const summary = summarizeParts([
    draft?.name || 'Unnamed certification',
    draft?.issuer || 'No issuer',
    draft?.issueDate ? `Issued ${draft.issueDate}` : null,
    draft?.expiryDate ? `Expires ${draft.expiryDate}` : null,
    formatEnabledState(draft?.enabled ?? true),
  ])

  useEffect(() => {
    onDirtyChange?.(certificationId, isDirty)

    return () => {
      onDirtyChange?.(certificationId, false)
    }
  }, [certificationId, isDirty, onDirtyChange])

  if (!certification || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleField
            checked={draft.enabled}
            label="Enabled"
            onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              updateCertification({ certificationId: certification.id, changes: { enabled: value } })
            }}
          />
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
          <ItemActions
            onDelete={() => deleteCertification(certification.id)}
            onSave={() => updateCertification({ certificationId: certification.id, changes: stripEnabled(draft) })}
            saveDisabled={!isDirty}
          />
        </div>
      }
      isDirty={isDirty}
      onDiscardChanges={() => setDraft(certification)}
      summary={summary}
      title={draft.name || certification.name || 'Certification'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Issuer" value={draft.issuer} onChange={(value) => setDraft({ ...draft, issuer: value })} />
        <TextField label="Credential ID" value={draft.credentialId} onChange={(value) => setDraft({ ...draft, credentialId: value })} />
        <TextField label="Issue date" type="date" value={draft.issueDate ?? ''} onChange={(value) => setDraft({ ...draft, issueDate: value || null })} />
        <TextField label="Expiry date" type="date" value={draft.expiryDate ?? ''} onChange={(value) => setDraft({ ...draft, expiryDate: value || null })} />
        <TextField label="Credential URL" type="url" value={draft.credentialUrl} onChange={(value) => setDraft({ ...draft, credentialUrl: value })} />
      </div>
    </CollapsiblePanel>
  )
}

const ReferenceCard = ({
  referenceId,
  onDirtyChange,
}: {
  referenceId: string
  onDirtyChange?: (id: string, dirty: boolean) => void
}) => {
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

  const isDirty = reference && draft ? JSON.stringify(stripEnabled(draft)) !== JSON.stringify(stripEnabled(reference)) : false
  const summary = summarizeParts([
    draft?.type === 'professional' ? 'Professional' : 'Personal',
    draft?.name || 'Unnamed reference',
    draft?.company || draft?.relationship || null,
    formatEnabledState(draft?.enabled ?? true),
  ])

  useEffect(() => {
    onDirtyChange?.(referenceId, isDirty)

    return () => {
      onDirtyChange?.(referenceId, false)
    }
  }, [isDirty, onDirtyChange, referenceId])

  if (!reference || !draft) {
    return null
  }

  return (
    <CollapsiblePanel
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ToggleField
            checked={draft.enabled}
            label="Enabled"
            onChange={(value) => {
              setDraft({ ...draft, enabled: value })
              updateReference({ referenceId: reference.id, changes: { enabled: value } })
            }}
          />
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
          <ItemActions
            onDelete={() => deleteReference(reference.id)}
            onSave={() => updateReference({ referenceId: reference.id, changes: stripEnabled(draft) })}
            saveDisabled={!isDirty}
          />
        </div>
      }
      isDirty={isDirty}
      onDiscardChanges={() => setDraft(reference)}
      summary={summary}
      title={draft.name || reference.name || 'Reference'}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-medium">Type</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value as ReferenceType })}
          >
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
          </select>
        </label>
        <TextField label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Relationship" value={draft.relationship} onChange={(value) => setDraft({ ...draft, relationship: value })} />
        <TextField label="Company" value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Email" type="email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
        <TextField label="Phone" type="tel" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
        <div className="xl:col-span-2">
          <TextAreaField label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
        </div>
      </div>
    </CollapsiblePanel>
  )
}

export const ProfileChildEditors = ({ profileId }: { profileId: string }) => {
  const skillCategoriesById = useAppStore((state) => state.data.skillCategories)
  const experienceEntriesById = useAppStore((state) => state.data.experienceEntries)
  const educationEntriesById = useAppStore((state) => state.data.educationEntries)
  const certificationsById = useAppStore((state) => state.data.certifications)
  const referencesById = useAppStore((state) => state.data.references)
  const createSkillCategory = useAppStore((state) => state.actions.createSkillCategory)
  const createExperienceEntry = useAppStore((state) => state.actions.createExperienceEntry)
  const createEducationEntry = useAppStore((state) => state.actions.createEducationEntry)
  const createCertification = useAppStore((state) => state.actions.createCertification)
  const createReference = useAppStore((state) => state.actions.createReference)
  const [dirtySkillCategoryIds, setDirtySkillCategoryIds] = useState<Record<string, boolean>>({})
  const [dirtyExperienceEntryIds, setDirtyExperienceEntryIds] = useState<Record<string, boolean>>({})
  const [dirtyEducationEntryIds, setDirtyEducationEntryIds] = useState<Record<string, boolean>>({})
  const [dirtyCertificationIds, setDirtyCertificationIds] = useState<Record<string, boolean>>({})
  const [dirtyReferenceIds, setDirtyReferenceIds] = useState<Record<string, boolean>>({})

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

  const handleSkillCategoryDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtySkillCategoryIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  const handleExperienceEntryDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyExperienceEntryIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  const handleEducationEntryDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyEducationEntryIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  const handleCertificationDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyCertificationIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  const handleReferenceDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyReferenceIds((current) => updateDirtyFlags(current, id, dirty))
  }, [])

  return (
    <div className="mt-6 space-y-6">
      <CollapsiblePanel
        actionLabel="Add skill category"
        description="Organize skills into enabled or disabled categories."
        isDirty={Object.keys(dirtySkillCategoryIds).length > 0}
        onAction={() => createSkillCategory(profileId)}
        title="Skills"
      >
        <div className="space-y-4">
          {skillCategoryIds.length === 0 ? <p className="text-sm text-slate-500">No skill categories yet.</p> : skillCategoryIds.map((id) => <SkillCategoryCard key={id} onDirtyChange={handleSkillCategoryDirtyChange} skillCategoryId={id} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add experience"
        description="Capture work history entries used in resumes and applications."
        isDirty={Object.keys(dirtyExperienceEntryIds).length > 0}
        onAction={() => createExperienceEntry(profileId)}
        title="Experience"
      >
        <div className="space-y-4">
          {experienceEntryIds.length === 0 ? <p className="text-sm text-slate-500">No experience entries yet.</p> : experienceEntryIds.map((id) => <ExperienceCard entryId={id} key={id} onDirtyChange={handleExperienceEntryDirtyChange} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add education"
        description="Store education entries that can be enabled or disabled per profile."
        isDirty={Object.keys(dirtyEducationEntryIds).length > 0}
        onAction={() => createEducationEntry(profileId)}
        title="Education"
      >
        <div className="space-y-4">
          {educationEntryIds.length === 0 ? <p className="text-sm text-slate-500">No education entries yet.</p> : educationEntryIds.map((id) => <EducationCard entryId={id} key={id} onDirtyChange={handleEducationEntryDirtyChange} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add certification"
        description="Track certifications and their optional credential metadata."
        isDirty={Object.keys(dirtyCertificationIds).length > 0}
        onAction={() => createCertification(profileId)}
        title="Certifications"
      >
        <div className="space-y-4">
          {certificationIds.length === 0 ? <p className="text-sm text-slate-500">No certifications yet.</p> : certificationIds.map((id) => <CertificationCard certificationId={id} key={id} onDirtyChange={handleCertificationDirtyChange} />)}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actionLabel="Add reference"
        description="Maintain both professional and personal references."
        isDirty={Object.keys(dirtyReferenceIds).length > 0}
        onAction={() => createReference(profileId)}
        title="References"
      >
        <div className="space-y-4">
          {referenceIds.length === 0 ? <p className="text-sm text-slate-500">No references yet.</p> : referenceIds.map((id) => <ReferenceCard key={id} onDirtyChange={handleReferenceDirtyChange} referenceId={id} />)}
        </div>
      </CollapsiblePanel>
    </div>
  )
}
