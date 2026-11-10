import { useTranslation } from 'react-i18next'
import { Title } from '../components/atoms/Title'
import { Breadcrumb } from '../components/organisms/Breadcrumb'
import { Toolbar } from '../components/organisms/Toolbar'
import { TopicGrid } from '../components/organisms/TopicGrid'
import { HomeTemplate } from '../components/templates/HomeTemplate'
import { useToolbar } from '../hooks/useToolbar'
import { topicPath, type Section } from '../sections'

export function SectionPage({ section }: { section: Section }) {
  const { t } = useTranslation()
  const toolbar = useToolbar()
  const name = t(`sections.${section.key}`)

  const topics = section.topics.map((topic) => ({
    key: topic.key,
    label: t(`topics.${topic.key}.title`),
    to: topicPath(section, topic),
  }))

  return (
    <HomeTemplate
      breadcrumb={<Breadcrumb trail={[{ label: t('home.title'), to: '/' }]} current={name} />}
      toolbar={<Toolbar {...toolbar} />}
      heading={<Title>{name}</Title>}
      content={<TopicGrid topics={topics} />}
    />
  )
}
