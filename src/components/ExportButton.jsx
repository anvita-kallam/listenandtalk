import React, { useState } from 'react'
import { exportStudentReport, printStudentReport } from '../utils/exportUtils'
import './ExportButton.css'

function ExportButton({ student, assessments, insights = [] }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExportReport = () => {
    exportStudentReport(student, assessments, insights)
    setIsOpen(false)
  }

  const handlePrintReport = () => {
    printStudentReport(student, assessments)
    setIsOpen(false)
  }

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export options"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 11L3 6H6V1H10V6H13L8 11Z" fill="currentColor"/>
          <path d="M14 13H2V15H14V13Z" fill="currentColor"/>
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          <div 
            className="export-overlay" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="export-menu" role="menu">
            <button
              className="export-menu-item"
              onClick={handleExportReport}
              role="menuitem"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 2H11V0H5V2H2C1.45 2 1 2.45 1 3V15C1 15.55 1.45 16 2 16H14C14.55 16 15 15.55 15 15V3C15 2.45 14.55 2 14 2ZM7 1H9V2H7V1ZM14 15H2V3H14V15Z" fill="currentColor"/>
                <path d="M8 5V12M5 9L8 12L11 9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              Download Report (TXT)
            </button>
            <button
              className="export-menu-item"
              onClick={handlePrintReport}
              role="menuitem"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 4H13V1C13 0.45 12.55 0 12 0H4C3.45 0 3 0.45 3 1V4H2C1.45 4 1 4.45 1 5V12C1 12.55 1.45 13 2 13H3V15C3 15.55 3.45 16 4 16H12C12.55 16 13 15.55 13 15V13H14C14.55 13 15 12.55 15 12V5C15 4.45 14.55 4 14 4ZM5 1H11V4H5V1ZM11 15H5V10H11V15ZM14 12H13V10H3V12H2V5H14V12Z" fill="currentColor"/>
              </svg>
              Print Report
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton
