import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getInitials, getAvatarGradient } from '../utils/avatarUtils'
import './StudentSwitcher.css'

// LocalStorage key for recent students
const RECENT_KEY = 'lt_recent_students'

/**
 * Utility: fuzzy-ish match by name or id (case-insensitive, substring)
 */
function matchesQuery(student, query) {
  if (!query) return true
  const q = query.toLowerCase()
  const name = (student.name || '').toLowerCase()
  const id = (student.id || '').toString().toLowerCase()
  return name.includes(q) || id.includes(q)
}

/**
 * Load recent student ids from localStorage
 */
function loadRecentStudentIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save recent student ids to localStorage
 */
function saveRecentStudentIds(ids) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids))
  } catch {
    // fail silently – not critical
  }
}

/**
 * Student search dropdown / combobox with keyboard navigation.
 */
function StudentSearchDropdown({ students, selectedStudent, onSelect }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    const base = students || []
    return base.filter(s => matchesQuery(s, query)).slice(0, 25)
  }, [students, query])

  // Ensure highlighted index is in range when filtered list changes
  useEffect(() => {
    if (highlightedIndex >= filtered.length) {
      setHighlightedIndex(filtered.length > 0 ? 0 : -1)
    }
  }, [filtered.length, highlightedIndex])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filtered.length === 0) return
      setHighlightedIndex((prev) => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filtered.length === 0) return
      setHighlightedIndex((prev) =>
        prev <= 0 ? filtered.length - 1 : prev - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const student =
        filtered[highlightedIndex] || filtered[0] || selectedStudent
      if (student) {
        onSelect(student.id)
        setIsOpen(false)
        // Keep query aligned with selected student for clarity
        setQuery(student.name || '')
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleOptionClick = (studentId) => {
    onSelect(studentId)
    setIsOpen(false)
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setQuery(student.name || '')
    }
  }

  // Close list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        listRef.current &&
        !listRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize query with selected student name
  useEffect(() => {
    if (selectedStudent && !query) {
      setQuery(selectedStudent.name || '')
    }
  }, [selectedStudent, query])

  return (
    <div className="student-switcher-dropdown">
      <label
        htmlFor="student-search"
        className="student-switcher-label"
      >
        Select student
      </label>
      <div
        className="combobox-wrapper"
        role="combobox"
        aria-expanded={isOpen}
        aria-owns="student-search-listbox"
        aria-haspopup="listbox"
      >
        <input
          id="student-search"
          ref={inputRef}
          type="text"
          className="student-search-input"
          placeholder="Search by name or ID…"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-controls="student-search-listbox"
        />
        {isOpen && filtered.length > 0 && (
          <ul
            id="student-search-listbox"
            className="student-search-list"
            role="listbox"
            ref={listRef}
          >
            {filtered.map((student, index) => (
              <li
                key={student.id}
                role="option"
                aria-selected={index === highlightedIndex}
                className={
                  'student-search-option' +
                  (index === highlightedIndex ? ' highlighted' : '')
                }
                onMouseDown={(e) => {
                  // prevent input blur before click handler
                  e.preventDefault()
                }}
                onClick={() => handleOptionClick(student.id)}
              >
                <div 
                  className="student-avatar student-avatar-small"
                  style={{
                    background: getAvatarGradient(student.name || student.id),
                    color: 'white'
                  }}
                >
                  <span>{getInitials(student.name, 'LT')}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="student-option-name">
                    {student.name || 'Unnamed student'}
                  </span>
                  <span className="student-option-id">
                    {student.id}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Compact pills of recently selected students.
 */
function RecentStudents({ recentStudents, onSelect }) {
  if (!recentStudents || recentStudents.length === 0) return null

  return (
    <div className="recent-students">
      <span className="recent-label">Recent:</span>
      <div className="recent-pills">
        {recentStudents.map((student) => (
          <button
            key={student.id}
            type="button"
            className="recent-pill"
            onClick={() => onSelect(student.id)}
          >
            <div 
              className="student-avatar student-avatar-tiny"
              style={{
                background: getAvatarGradient(student.name || student.id),
                color: 'white'
              }}
            >
              <span>{getInitials(student.name, 'LT')}</span>
            </div>
            <span>{student.name || student.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Modal for browsing all students in a card layout.
 * Includes basic focus trapping and ESC-to-close.
 */
function BrowseStudentsModal({
  isOpen,
  onClose,
  students,
  onSelectStudent
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        // Basic focus trap: loop focus within modal
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus the first focusable element when opening
    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="students-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="students-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browse-students-title"
        onMouseDown={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="students-modal-header">
          <h2 id="browse-students-title">Browse all students</h2>
          <button
            type="button"
            className="students-modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="students-grid">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className="student-card"
              onClick={() => {
                onSelectStudent(student.id)
                onClose()
              }}
            >
              <div 
                className="student-avatar"
                style={{
                  background: getAvatarGradient(student.name || student.id),
                  color: 'white'
                }}
              >
                <span>{getInitials(student.name, 'LT')}</span>
              </div>
              <div className="student-card-body">
                <div className="student-card-name">
                  {student.name || 'Unnamed student'}
                </div>
                <div className="student-card-meta">
                  ID: {student.id}
                </div>
                <div className="student-card-meta subtle">
                  {/* Placeholder metadata – age / last assessment could go here if available */}
                  Assessment history available
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * High-level student switcher:
 * - Searchable dropdown with keyboard support
 * - Recent students
 * - "Browse all students" modal
 */
function StudentSwitcher({ students, selectedStudent, onStudentChange }) {
  const [recentIds, setRecentIds] = useState(loadRecentStudentIds)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Derive recent student objects (most recent ids first, deduped)
  const recentStudents = useMemo(() => {
    if (!students || students.length === 0) return []
    const byId = new Map(students.map((s) => [s.id, s]))
    const result = []
    for (const id of recentIds) {
      if (byId.has(id)) {
        result.push(byId.get(id))
      }
      if (result.length >= 8) break
    }
    return result
  }, [students, recentIds])

  /**
   * Update selected student globally and maintain recent list.
   */
  const handleSelectStudent = (studentId) => {
    onStudentChange(studentId)
    setRecentIds((prev) => {
      const next = [studentId, ...prev.filter((id) => id !== studentId)]
      const limited = next.slice(0, 8)
      saveRecentStudentIds(limited)
      return limited
    })
  }

  // Ensure currently selected student is in recents on mount / change
  useEffect(() => {
    if (!selectedStudent) return
    setRecentIds((prev) => {
      if (prev[0] === selectedStudent.id) return prev
      const next = [selectedStudent.id, ...prev.filter((id) => id !== selectedStudent.id)]
      const limited = next.slice(0, 8)
      saveRecentStudentIds(limited)
      return limited
    })
  }, [selectedStudent])

  return (
    <section
      className="student-switcher"
      aria-label="Student selection"
    >
      <div className="student-switcher-main">
        <StudentSearchDropdown
          students={students}
          selectedStudent={selectedStudent}
          onSelect={handleSelectStudent}
        />
        <button
          type="button"
          className="browse-students-button"
          onClick={() => setIsModalOpen(true)}
        >
          Browse all students
        </button>
      </div>
      <RecentStudents
        recentStudents={recentStudents}
        onSelect={handleSelectStudent}
      />
      <BrowseStudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        students={students}
        onSelectStudent={handleSelectStudent}
      />
    </section>
  )
}

export default StudentSwitcher

