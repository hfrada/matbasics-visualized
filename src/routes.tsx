import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { CartesianProductPage } from './pages/CartesianProductPage'
import { ComplexNumbersPage } from './pages/ComplexNumbersPage'
import { ConverseInverseContrapositivePage } from './pages/ConverseInverseContrapositivePage'
import { HomePage } from './pages/HomePage'
import { ImplicationBiconditionalPage } from './pages/ImplicationBiconditionalPage'
import { LayeredTablesAndEquivalencePage } from './pages/LayeredTablesAndEquivalencePage'
import { NegationConjunctionDisjunctionPage } from './pages/NegationConjunctionDisjunctionPage'
import { NumberHierarchyPage } from './pages/NumberHierarchyPage'
import { OperationLimitsPage } from './pages/OperationLimitsPage'
import { PowerSetPage } from './pages/PowerSetPage'
import { PropositionsAndQuantifiersPage } from './pages/PropositionsAndQuantifiersPage'
import { SectionPage } from './pages/SectionPage'
import { SetOperationPropertiesPage } from './pages/SetOperationPropertiesPage'
import { SetOperationsPage } from './pages/SetOperationsPage'
import { SubsetsAndComplementPage } from './pages/SubsetsAndComplementPage'
import { TautologiesAndValidArgumentsPage } from './pages/TautologiesAndValidArgumentsPage'
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
  numberHierarchy: NumberHierarchyPage,
  complexNumbers: ComplexNumbersPage,
  propositionsAndQuantifiers: PropositionsAndQuantifiersPage,
  negationConjunctionDisjunction: NegationConjunctionDisjunctionPage,
  implicationBiconditional: ImplicationBiconditionalPage,
  converseInverseContrapositive: ConverseInverseContrapositivePage,
  layeredTablesAndEquivalence: LayeredTablesAndEquivalencePage,
  tautologiesAndValidArguments: TautologiesAndValidArgumentsPage,
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
