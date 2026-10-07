/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Central Report Center & Export Engine (CSV, Excel, Print, PDF)
 */

class ReportService {
  // Export table data to CSV file
  exportToCSV(filename, headers, rows) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

    rows.forEach(row => {
      csvContent += row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate & Download Official Student Import CSV Template
  downloadStudentImportTemplate() {
    const headers = [
      'photo_url',
      'id_number',
      'students_name',
      'class',
      'address',
      'gender',
      'category',
      'date_of_admission_school',
      'date_of_birth',
      'age',
      'mobile_no',
      'whatsapp_no',
      'fathers_name',
      'mothers_name',
      'enrolled_withdrawn',
      'date_of_admission_hostel',
      'remarks'
    ];

    const sampleRows = [
      [
        '',
        'TPS2026056',
        'Zainab Fathima',
        'STD-VIII',
        'Kottakkal, Malappuram, Kerala - 676503',
        'female',
        'General',
        '2026-06-01',
        '2012-04-12',
        '14',
        '+91 98471 22334',
        '+91 98471 22334',
        'Abdul Kareem',
        'Rasiya Kareem',
        'Enrolled',
        '2026-06-01',
        'No allergies'
      ],
      [
        '',
        'TPS2026057',
        'Bilal Mohammed',
        'STD-IX',
        'Manjeri, Malappuram, Kerala - 676121',
        'male',
        'Orphan',
        '2026-06-01',
        '2011-09-18',
        '15',
        '+91 98472 33445',
        '+91 98472 33445',
        'Hamza Kutty',
        'Khadeeja Hamza',
        'Enrolled',
        '2026-06-01',
        'Asthma inhaler required'
      ]
    ];

    this.exportToCSV('TPS_Student_Import_Template', headers, sampleRows);
  }

  // Export table data to Excel-compatible file
  exportToExcel(filename, tableTitle, headers, rows) {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
      <h2>Thaiba Public School - ${tableTitle}</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table border="1">
        <thead>
          <tr style="background-color: #0d5c3a; color: #ffffff;">
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(val => `<td>${val ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Generate Monthly Attendance Summary
  async getMonthlyAttendanceReport(monthYearStr) {
    const students = await window.StudentService.getAllStudents();
    const attendanceRecords = await db.getTable('student_attendance');
    const sessions = await db.getTable('attendance_sessions');

    const reportData = [];
    for (const s of students) {
      const sRecords = attendanceRecords.filter(r => r.student_id === s.id);
      const total = sRecords.length;
      const present = sRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const absent = sRecords.filter(r => r.status === 'absent').length;
      const leave = sRecords.filter(r => r.status === 'leave' || r.status === 'excused').length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;

      reportData.push({
        student_id: s.id,
        admission_no: s.admission_no,
        full_name: s.full_name,
        school_class: s.school_class,
        gender: s.gender,
        total_classes: total,
        present,
        absent,
        leave,
        percentage: `${pct}%`
      });
    }

    return reportData;
  }
}

window.ReportService = new ReportService();
