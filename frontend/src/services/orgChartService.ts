import type { Employee } from '../types/employee'
import { doc, getDocs, updateDoc, collection } from 'firebase/firestore'
import { db } from './firebase'
import { toEmployee } from './employeeService'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A tree node: an Employee with its children attached */
export interface OrgNode extends Employee {
  children: OrgNode[]
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/** Fetch all employees from Firestore (reuses the employees collection) */
export async function getEmployeesForOrg(): Promise<Employee[]> {
  const snapshot = await getDocs(collection(db, 'employees'))
  return snapshot.docs.map((d) => toEmployee(d.id, d.data()))
}

// ─── Hierarchy Builder ────────────────────────────────────────────────────────

/**
 * buildHierarchy — converts a flat list of employees into a tree.
 *
 * How it works:
 * 1. Create a lookup map: id → OrgNode
 * 2. For each employee, if managerId points to someone in the map,
 *    push this node into that manager's children array.
 * 3. Employees with no valid managerId become root nodes.
 *
 * This is O(n) and handles any depth of hierarchy.
 */
export function buildHierarchy(employees: Employee[]): OrgNode[] {
  // Step 1: Create a map of id → OrgNode with empty children
  const nodeMap = new Map<string, OrgNode>()
  for (const emp of employees) {
    nodeMap.set(emp.id, { ...emp, children: [] })
  }

  // Step 2: Wire up parent → child relationships
  const roots: OrgNode[] = []
  for (const node of nodeMap.values()) {
    const managerId = node.managerId?.trim()
    if (managerId && nodeMap.has(managerId)) {
      nodeMap.get(managerId)!.children.push(node)
    } else {
      // No valid manager → this is a root (CEO / top-level)
      roots.push(node)
    }
  }

  return roots
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * searchEmployees — filters employees by name, designation, or department.
 * Returns matching employee ids (used to highlight nodes in the tree).
 */
export function searchEmployees(
  employees: Employee[],
  term: string,
): Set<string> {
  const lower = term.toLowerCase().trim()
  if (!lower) return new Set()
  const matches = new Set<string>()
  for (const emp of employees) {
    if (
      emp.name.toLowerCase().includes(lower) ||
      emp.designation.toLowerCase().includes(lower) ||
      emp.department.toLowerCase().includes(lower)
    ) {
      matches.add(emp.id)
    }
  }
  return matches
}

/**
 * getAncestorIds — returns the set of all ancestor ids for a given set of
 * matched employee ids. Used to auto-expand parent branches on search.
 */
export function getAncestorIds(
  employees: Employee[],
  matchedIds: Set<string>,
): Set<string> {
  // Build child → parent map
  const parentMap = new Map<string, string>()
  for (const emp of employees) {
    if (emp.managerId) parentMap.set(emp.id, emp.managerId)
  }

  const ancestors = new Set<string>()
  for (const id of matchedIds) {
    let current = parentMap.get(id)
    while (current) {
      ancestors.add(current)
      current = parentMap.get(current)
    }
  }
  return ancestors
}

// ─── Department Filter ────────────────────────────────────────────────────────

/** Get unique departments from the employee list */
export function getDepartments(employees: Employee[]): string[] {
  const depts = new Set<string>()
  for (const emp of employees) {
    if (emp.department) depts.add(emp.department)
  }
  return Array.from(depts).sort()
}

// ─── Manager Update (Drag & Drop) ─────────────────────────────────────────────

/**
 * updateManager — updates an employee's managerId in Firestore.
 * Called when an admin drags an employee card and drops it under a new manager.
 */
export async function updateManager(
  employeeId: string,
  newManagerId: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'employees', employeeId), {
    managerId: newManagerId ?? '',
  })
}
