import { useState } from 'react'
import type { OrgNode } from '../../services/orgChartService'
import { EmployeeNode } from './EmployeeNode'
import { Tree, TreeNode } from 'react-organizational-chart'
import { updateManager } from '../../services/orgChartService'

interface OrgTreeProps {
  roots: OrgNode[]
  matchedIds: Set<string>
  ancestorIds: Set<string>
  isManagement: boolean
  onManagerUpdated: () => void
}

/**
 * OrgTree — renders the full organization hierarchy.
 *
 * react-organizational-chart handles the SVG connector lines between nodes.
 * We recursively render each OrgNode using the EmployeeNode card.
 *
 * When there are multiple root nodes (e.g. multiple departments with no
 * shared head), we render a hidden "virtual root" so the library has a
 * single entry point.
 */
export function OrgTree({
  roots,
  matchedIds,
  ancestorIds,
  isManagement,
  onManagerUpdated,
}: OrgTreeProps) {
  // Track which nodes are collapsed: Set of employee ids that are collapsed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Drag state: which employee is being dragged
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setCollapsed(new Set())
  }

  function collapseAll(nodes: OrgNode[]) {
    const ids = new Set<string>()
    function collect(n: OrgNode) {
      if (n.children.length > 0) {
        ids.add(n.id)
        n.children.forEach(collect)
      }
    }
    nodes.forEach(collect)
    setCollapsed(ids)
  }

  // Auto-expand ancestors when search has results
  // If a node is an ancestor of a match, force-expand it
  function isForceExpanded(id: string) {
    return ancestorIds.has(id)
  }

  async function handleDrop(draggedId: string, newManagerId: string) {
    if (draggedId === newManagerId) return
    try {
      await updateManager(draggedId, newManagerId)
      onManagerUpdated()
    } catch (err) {
      console.error('Failed to update manager', err)
    }
  }

  /** Recursively renders each node and its children */
  function renderNode(node: OrgNode): React.ReactNode {
    const isCollapsed = collapsed.has(node.id) && !isForceExpanded(node.id)
    const hasChildren = node.children.length > 0
    const isMatched = matchedIds.has(node.id)
    const isAncestor = ancestorIds.has(node.id)

    return (
      <TreeNode
        key={node.id}
        label={
          <EmployeeNode
            employee={node}
            isMatched={isMatched}
            isAncestor={isAncestor}
            isCollapsed={isCollapsed}
            hasChildren={hasChildren}
            isDragging={draggingId === node.id}
            isManagement={isManagement}
            onToggleCollapse={() => toggleCollapse(node.id)}
            onDragStart={() => setDraggingId(node.id)}
            onDragEnd={() => setDraggingId(null)}
            onDrop={(newManagerId) => handleDrop(node.id, newManagerId)}
          />
        }
      >
        {!isCollapsed && node.children.map((child) => renderNode(child))}
      </TreeNode>
    )
  }

  if (roots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="text-5xl mb-4">🏢</div>
        <p className="text-lg font-medium">No employees found</p>
        <p className="text-sm mt-1">Add employees and assign managers to build your org chart.</p>
      </div>
    )
  }

  const lineColor = '#d1d5db' // tailwind gray-300

  return (
    <div className="flex flex-col gap-4">
      {/* Expand / Collapse controls */}
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={expandAll}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          Expand All
        </button>
        <button
          onClick={() => collapseAll(roots)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          Collapse All
        </button>
      </div>

      {/* When there is a single root, render normally.
          When multiple roots exist, render a virtual "Organization" root. */}
      <div className="overflow-x-auto pb-8">
        {roots.length === 1 ? (
          <Tree
            lineWidth="2px"
            lineColor={lineColor}
            lineBorderRadius="8px"
            label={
              <EmployeeNode
                employee={roots[0]}
                isMatched={matchedIds.has(roots[0].id)}
                isAncestor={ancestorIds.has(roots[0].id)}
                isCollapsed={collapsed.has(roots[0].id) && !isForceExpanded(roots[0].id)}
                hasChildren={roots[0].children.length > 0}
                isDragging={draggingId === roots[0].id}
                isManagement={isManagement}
                onToggleCollapse={() => toggleCollapse(roots[0].id)}
                onDragStart={() => setDraggingId(roots[0].id)}
                onDragEnd={() => setDraggingId(null)}
                onDrop={(newManagerId) => handleDrop(roots[0].id, newManagerId)}
              />
            }
          >
            {!(collapsed.has(roots[0].id) && !isForceExpanded(roots[0].id)) &&
              roots[0].children.map((child) => renderNode(child))}
          </Tree>
        ) : (
          <Tree
            lineWidth="2px"
            lineColor={lineColor}
            lineBorderRadius="8px"
            label={
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-lg mx-auto">
                <span>🏢</span> Organization
              </div>
            }
          >
            {roots.map((root) => renderNode(root))}
          </Tree>
        )}
      </div>
    </div>
  )
}
