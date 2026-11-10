import { useTranslation } from 'react-i18next'
import { PageHeading } from '../components/molecules/PageHeading'
import { Wordmark } from '../components/molecules/Wordmark'
import { SectionGrid } from '../components/organisms/SectionGrid'
import { Toolbar } from '../components/organisms/Toolbar'
import { HomeTemplate } from '../components/templates/HomeTemplate'
import { useToolbar } from '../hooks/useToolbar'
import { sectionPath, sections } from '../sections'

export function HomePage() {
  const { t } = useTranslation()
  const toolbar = useToolbar()

  const cards = sections.map((section) => ({
    key: section.key,
    label: t(`sections.${section.key}`),
    to: section.topics.length > 0 ? sectionPath(section) : undefined,
  }))

  return (
    <HomeTemplate
      toolbar={<Toolbar {...toolbar} />}
      heading={<PageHeading title={<Wordmark text={t('home.title')} />} subtitle={t('home.subtitle')} />}
      content={<SectionGrid sections={cards} />}
    />
  )
}
