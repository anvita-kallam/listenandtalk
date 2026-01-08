import React from 'react'
import './StudentNavigation.css'

function StudentNavigation({ students, selectedStudent, onStudentChange }) {
  const handleChange = (e) => {
    onStudentChange(e.target.value)
  }

  return (
    <nav className="student-navigation" role="navigation" aria-label="Student selection">
      <label htmlFor="student-select" className="student-select-label">
        Select Student:
      </label>
      <select
        id="student-select"
        value={selectedStudent?.id || ''}
        onChange={handleChange}
        className="student-select"
        aria-label="Select a student to view their assessment results"
      >
        {students.map(student => (
          <option key={student.id} value={student.id}>
            {student.name} ({student.id})
          </option>
        ))}
      </select>
      
      {/* Alternative tab view for larger screens */}
      <div className="student-tabs" role="tablist" aria-label="Student tabs">
        {students.map(student => (
          <button
            key={student.id}
            role="tab"
            aria-selected={selectedStudent?.id === student.id}
            aria-controls={`student-${student.id}-panel`}
            className={`student-tab ${selectedStudent?.id === student.id ? 'active' : ''}`}
            onClick={() => onStudentChange(student.id)}
          >
            {student.name}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default StudentNavigation
