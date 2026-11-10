import { useTranslation } from 'react-i18next'
import { locateTopic, sectionPath, topicPath, type TopicKey } from '../sections'

export function useTopicNavigation(key: TopicKey) {
  const { t } = useTranslation()
  const { section, index } = locateTopic(key)
  const siblings = section.topics.map((topic) => ({
    label: t(`topics.${topic.key}.title`),
    to: topicPath(section, topic),
  }))

  return {
    breadcrumb: {
      trail: [
        { label: t('home.title'), to: '/' },
        { label: t(`sections.${section.key}`), to: sectionPath(section) },
      ],
      current: siblings[index].label,
      siblings,
      currentIndex: index,
    },
    pager: {
      previous: siblings[index - 1] ?? null,
      next: siblings[index + 1] ?? null,
      previousLabel: t('pager.previous'),
      nextLabel: t('pager.next'),
    },
  }
}
