import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { HomePage } from './pages/HomePage'
import { PowerSetPage } from './pages/PowerSetPage'
import { SectionPage } from './pages/SectionPage'
import { SubsetsAndComplementPage } from './pages/SubsetsAndComplementPage'
import { WritingSetsPage } from './pages/WritingSetsPage'
import { RootLayout } from './RootLayout'
import { sectionPath, sections, topicPath, type TopicKey } from './sections'

const topicPages: Record<TopicKey, ComponentType> = {
  writingSets: WritingSetsPage,
  subsetsAndComplement: SubsetsAndComplementPage,
  powerSet: PowerSetPage,
}

const sectionRoutes: RouteObject[] = sections
  .filter((section) => section.topics.length > 0)
  .flatMap((section) => [
    { path: sectionPath(section), element: <SectionPage section={section} /> },
    ...section.topics.map((topic) => {
      const Page = topicPages[topic.key]
      return { path: topicPath(section, topic), element: <Page /> }
    }),
  ])

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{ path: '/', element: <HomePage /> }, ...sectionRoutes],
  },
])
