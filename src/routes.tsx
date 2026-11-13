import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { CartesianProductPage } from './pages/CartesianProductPage'
import { HomePage } from './pages/HomePage'
import { OperationLimitsPage } from './pages/OperationLimitsPage'
import { PowerSetPage } from './pages/PowerSetPage'
import { SectionPage } from './pages/SectionPage'
import { SetOperationPropertiesPage } from './pages/SetOperationPropertiesPage'
import { SetOperationsPage } from './pages/SetOperationsPage'
import { SubsetsAndComplementPage } from './pages/SubsetsAndComplementPage'
import { WritingSetsPage } from './pages/WritingSetsPage'
import { RootLayout } from './RootLayout'
import { sectionPath, sections, topicPath, type TopicKey } from './sections'

const topicPages: Record<TopicKey, ComponentType> = {
  writingSets: WritingSetsPage,
  subsetsAndComplement: SubsetsAndComplementPage,
  powerSet: PowerSetPage,
  setOperations: SetOperationsPage,
  setOperationProperties: SetOperationPropertiesPage,
  cartesianProduct: CartesianProductPage,
  operationLimits: OperationLimitsPage,
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
