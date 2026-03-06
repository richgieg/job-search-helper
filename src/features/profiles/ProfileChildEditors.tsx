import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { useAppStore } from '../../store/app-store'
import type { ReferenceType } from '../../types/state'

const Section = ({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string
  description: string
  actionLabel: string
  onAdd: () => void
  children: ReactNode
}) => {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          onClick={onAdd}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

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

const ItemActions = ({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) => (
  <div className="flex flex-wrap gap-2">
    <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onSave} type="button">
      Save
    </button>
    <button className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={onDelete} type="button">
      Delete
    </button>
  </div>
)

const ExperienceBulletRow = ({ bulletId }: { bulletId: string }) => {
  const bullet = useAppStore((state) => state.data.experienceBullets[bulletId])
  const updateExperienceBullet = useAppStore((state) => state.actions.updateExperienceBullet)
  const deleteExperienceBullet = useAppStore((state) => state.actions.deleteExperienceBullet)
  const [content, setContent] = useState(bullet?.content ?? '')

  useEffect(() => {
    if (!bullet) {
      return
    }

    setContent(bullet.content)
  }, [bullet])

  if (!bullet) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <TextAreaField label="Bullet" placeholder="Describe an accomplishment or responsibility" value={content} onChange={setContent} />
        <ItemActions
          onDelete={() => deleteExperienceBullet(bullet.id)}
          onSave={() => updateExperienceBullet({ experienceBulletId: bullet.id, changes: { content } })}
        />
      </div>
    </div>
  )
}

const SkillRow = ({ skillId }: { skillId: string }) => {
  const skill = useAppStore((state) => state.data.skills[skillId])
  const updateSkill = useAppStore((state) => state.actions.updateSkill)
  const deleteSkill = useAppStore((state) => state.actions.deleteSkill)
  const [name, setName] = useState(skill?.name ?? '')
  const [enabled, setEnabled] = useState(skill?.enabled ?? true)

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

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <TextField label="Skill name" value={name} onChange={setName} />
      <ToggleField checked={enabled} label="Enabled" onChange={setEnabled} />
      <ItemActions
        onDelete={() => deleteSkill(skill.id)}
        onSave={() => updateSkill({ skillId: skill.id, changes: { name, enabled } })}
      />
    </div>
  )
}

const SkillCategoryCard = ({ skillCategoryId }: { skillCategoryId: string }) => {
  const category = useAppStore((state) => state.data.skillCategories[skillCategoryId])
  const skillsById = useAppStore((state) => state.data.skills)
  const updateSkillCategory = useAppStore((state) => state.actions.updateSkillCategory)
  const deleteSkillCategory = useAppStore((state) => state.actions.deleteSkillCategory)
  const createSkill = useAppStore((state) => state.actions.createSkill)
  const [name, setName] = useState(category?.name ?? '')
  const [enabled, setEnabled] = useState(category?.enabled ?? true)

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

  if (!category) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <TextField label="Category name" value={name} onChange={setName} />
        <ToggleField checked={enabled} label="Enabled" onChange={setEnabled} />
        <ItemActions
          onDelete={() => deleteSkillCategory(category.id)}
          onSave={() => updateSkillCategory({ skillCategoryId: category.id, changes: { name, enabled } })}
        />
      </div>

      <div className="mt-4 space-y-3">
        {skillIds.map((skillId) => (
          <SkillRow key={skillId} skillId={skillId} />
        ))}
      </div>

      <button className="mt-4 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => createSkill(category.id)} type="button">
        Add skill
      </button>
    </div>
  )
}

const ExperienceCard = ({ entryId }: { entryId: string }) => {
  const entry = useAppStore((state) => state.data.experienceEntries[entryId])
  const bulletsById = useAppStore((state) => state.data.experienceBullets)
  const updateExperienceEntry = useAppStore((state) => state.actions.updateExperienceEntry)
  const deleteExperienceEntry = useAppStore((state) => state.actions.deleteExperienceEntry)
  const createExperienceBullet = useAppStore((state) => state.actions.createExperienceBullet)
  const [draft, setDraft] = useState(entry)

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

  if (!entry || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Company" value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
        <TextField label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
        <TextField label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
        <TextField label="Start date" type="date" value={draft.startDate ?? ''} onChange={(value) => setDraft({ ...draft, startDate: value || null })} />
        <TextField label="End date" type="date" value={draft.endDate ?? ''} onChange={(value) => setDraft({ ...draft, endDate: value || null })} />
        <ToggleField checked={draft.isCurrent} label="Current role" onChange={(value) => setDraft({ ...draft, isCurrent: value })} />
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
        <div className="xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
          <ToggleField checked={draft.enabled} label="Enabled" onChange={(value) => setDraft({ ...draft, enabled: value })} />
          <ItemActions
            onDelete={() => deleteExperienceEntry(entry.id)}
            onSave={() => updateExperienceEntry({ experienceEntryId: entry.id, changes: draft })}
          />
        </div>
      </div>
    </div>
  )
}

const EducationCard = ({ entryId }: { entryId: string }) => {
  const entry = useAppStore((state) => state.data.educationEntries[entryId])
  const updateEducationEntry = useAppStore((state) => state.actions.updateEducationEntry)
  const deleteEducationEntry = useAppStore((state) => state.actions.deleteEducationEntry)
  const [draft, setDraft] = useState(entry)

  useEffect(() => {
    setDraft(entry)
  }, [entry])

  if (!entry || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="School" value={draft.school} onChange={(value) => setDraft({ ...draft, school: value })} />
        <TextField label="Degree" value={draft.degree} onChange={(value) => setDraft({ ...draft, degree: value })} />
        <TextField label="Field of study" value={draft.fieldOfStudy} onChange={(value) => setDraft({ ...draft, fieldOfStudy: value })} />
        <TextField label="Graduation date" type="date" value={draft.graduationDate ?? ''} onChange={(value) => setDraft({ ...draft, graduationDate: value || null })} />
        <div className="xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
          <ToggleField checked={draft.enabled} label="Enabled" onChange={(value) => setDraft({ ...draft, enabled: value })} />
          <ItemActions
            onDelete={() => deleteEducationEntry(entry.id)}
            onSave={() => updateEducationEntry({ educationEntryId: entry.id, changes: draft })}
          />
        </div>
      </div>
    </div>
  )
}

const CertificationCard = ({ certificationId }: { certificationId: string }) => {
  const certification = useAppStore((state) => state.data.certifications[certificationId])
  const updateCertification = useAppStore((state) => state.actions.updateCertification)
  const deleteCertification = useAppStore((state) => state.actions.deleteCertification)
  const [draft, setDraft] = useState(certification)

  useEffect(() => {
    setDraft(certification)
  }, [certification])

  if (!certification || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <TextField label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
        <TextField label="Issuer" value={draft.issuer} onChange={(value) => setDraft({ ...draft, issuer: value })} />
        <TextField label="Credential ID" value={draft.credentialId} onChange={(value) => setDraft({ ...draft, credentialId: value })} />
        <TextField label="Issue date" type="date" value={draft.issueDate ?? ''} onChange={(value) => setDraft({ ...draft, issueDate: value || null })} />
        <TextField label="Expiry date" type="date" value={draft.expiryDate ?? ''} onChange={(value) => setDraft({ ...draft, expiryDate: value || null })} />
        <TextField label="Credential URL" type="url" value={draft.credentialUrl} onChange={(value) => setDraft({ ...draft, credentialUrl: value })} />
        <div className="xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
          <ToggleField checked={draft.enabled} label="Enabled" onChange={(value) => setDraft({ ...draft, enabled: value })} />
          <ItemActions
            onDelete={() => deleteCertification(certification.id)}
            onSave={() => updateCertification({ certificationId: certification.id, changes: draft })}
          />
        </div>
      </div>
    </div>
  )
}

const ReferenceCard = ({ referenceId }: { referenceId: string }) => {
  const reference = useAppStore((state) => state.data.references[referenceId])
  const updateReference = useAppStore((state) => state.actions.updateReference)
  const deleteReference = useAppStore((state) => state.actions.deleteReference)
  const [draft, setDraft] = useState(reference)

  useEffect(() => {
    setDraft(reference)
  }, [reference])

  if (!reference || !draft) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
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
        <div className="xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
          <ToggleField checked={draft.enabled} label="Enabled" onChange={(value) => setDraft({ ...draft, enabled: value })} />
          <ItemActions
            onDelete={() => deleteReference(reference.id)}
            onSave={() => updateReference({ referenceId: reference.id, changes: draft })}
          />
        </div>
      </div>
    </div>
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

  return (
    <div className="mt-6">
      <Section actionLabel="Add skill category" description="Organize skills into enabled or disabled categories." onAdd={() => createSkillCategory(profileId)} title="Skills">
        {skillCategoryIds.length === 0 ? <p className="text-sm text-slate-500">No skill categories yet.</p> : skillCategoryIds.map((id) => <SkillCategoryCard key={id} skillCategoryId={id} />)}
      </Section>

      <Section actionLabel="Add experience" description="Capture work history entries used in resumes and applications." onAdd={() => createExperienceEntry(profileId)} title="Experience">
        {experienceEntryIds.length === 0 ? <p className="text-sm text-slate-500">No experience entries yet.</p> : experienceEntryIds.map((id) => <ExperienceCard key={id} entryId={id} />)}
      </Section>

      <Section actionLabel="Add education" description="Store education entries that can be enabled or disabled per profile." onAdd={() => createEducationEntry(profileId)} title="Education">
        {educationEntryIds.length === 0 ? <p className="text-sm text-slate-500">No education entries yet.</p> : educationEntryIds.map((id) => <EducationCard key={id} entryId={id} />)}
      </Section>

      <Section actionLabel="Add certification" description="Track certifications and their optional credential metadata." onAdd={() => createCertification(profileId)} title="Certifications">
        {certificationIds.length === 0 ? <p className="text-sm text-slate-500">No certifications yet.</p> : certificationIds.map((id) => <CertificationCard key={id} certificationId={id} />)}
      </Section>

      <Section actionLabel="Add reference" description="Maintain both professional and personal references." onAdd={() => createReference(profileId)} title="References">
        {referenceIds.length === 0 ? <p className="text-sm text-slate-500">No references yet.</p> : referenceIds.map((id) => <ReferenceCard key={id} referenceId={id} />)}
      </Section>
    </div>
  )
}
