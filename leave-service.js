/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Leave & Return Service: Batch/Individual Cards, Date-Based Late Fines, Black Marks
 */

class LeaveService {
  async getAllLeaves() {
    return await db.getTable('leave_records');
  }

  async getLeaveStudents(leaveId = null) {
    const records = await db.getTable('leave_students');
    if (!leaveId) return records;
    return records.filter(r => r.leave_id === leaveId);
  }

  // Create Batch or Individual Leave
  async createLeave(leaveData, studentIds) {
    if (!studentIds || studentIds.length === 0) {
      throw new Error('Please select at least one student for leave.');
    }

    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    leaveData.leave_code = `LV-${year}-${randomSeq}`;
    leaveData.status = 'active';
    leaveData.is_batch = studentIds.length > 1;
    leaveData.total_students = studentIds.length;
    leaveData.approved_by = leaveData.approved_by || (window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden Office');

    const newLeave = await db.insertRecord('leave_records', leaveData);

    // Create entry for each student and update student status to 'temporarily_away'
    for (const sId of studentIds) {
      await db.insertRecord('leave_students', {
        leave_id: newLeave.id,
        student_id: sId,
        is_returned: false,
        late_days: 0,
        fine_amount: 0.00,
        black_marks: 0
      });

      // Update student status
      const statusType = leaveData.leave_type === 'vacation' ? 'vacation' :
                         leaveData.leave_type === 'medical_leave' ? 'medical_leave' : 'temporarily_away';
      await window.StudentService.changeStudentStatus(sId, statusType, `On leave: ${leaveData.reason}`);

      // Add to hostel exit register
      const student = await window.StudentService.getStudentById(sId);
      if (student) {
        await db.insertRecord('hostel_entries', {
          student_id: sId,
          hostel_id: student.hostel_id,
          entry_type: 'exit',
          exit_date: leaveData.leaving_date,
          exit_time: leaveData.leaving_time,
          purpose: leaveData.reason,
          permission_by: leaveData.approved_by,
          status: 'outside'
        });
      }
    }

    return newLeave;
  }

  // Calculate Late Fine (Strictly by Calendar Date) & Time-Based Black Mark
  calculateReturnLate(expectedDateStr, expectedTimeStr, actualDateStr, actualTimeStr, fineRate = 100.00) {
    const expDate = new Date(expectedDateStr);
    const actDate = new Date(actualDateStr);

    // Difference in calendar days
    const diffTime = actDate.getTime() - expDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let lateDays = 0;
    let fineAmount = 0.00;
    let blackMarks = 0;

    if (diffDays > 0) {
      lateDays = diffDays;
      fineAmount = lateDays * fineRate;
      blackMarks = lateDays; // 1 black mark per late calendar day
    } else if (diffDays === 0) {
      // Same calendar date: Fine days remain 0, but check time for late-return black mark
      if (actualTimeStr && expectedTimeStr && actualTimeStr > expectedTimeStr) {
        blackMarks = 1; // Late Mark for late return on the same date
      }
    }

    return { lateDays, fineAmount, blackMarks };
  }

  // Record Return for Students (Batch or Individual)
  async recordStudentReturn(leaveStudentId, actualDate, actualTime, condition = 'Good', remarks = '') {
    const leaveStudents = await this.getLeaveStudents();
    const target = leaveStudents.find(ls => ls.id === leaveStudentId);
    if (!target) throw new Error('Leave student record not found.');

    const allLeaves = await this.getAllLeaves();
    const parentLeave = allLeaves.find(l => l.id === target.leave_id);

    const calculation = this.calculateReturnLate(
      parentLeave.expected_return_date,
      parentLeave.expected_return_time,
      actualDate,
      actualTime,
      (parentLeave && parentLeave.fine_per_day != null) ? parseFloat(parentLeave.fine_per_day) : CONFIG.FINES.DEFAULT_RATE_PER_DAY
    );

    // Update leave_students record
    await db.updateRecord('leave_students', leaveStudentId, {
      actual_return_date: actualDate,
      actual_return_time: actualTime,
      late_days: calculation.lateDays,
      fine_amount: calculation.fineAmount,
      black_marks: calculation.blackMarks,
      condition_on_return: condition,
      return_remarks: remarks,
      is_returned: true,
      checked_by: window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden'
    });

    // Reset student status back to Active
    await window.StudentService.changeStudentStatus(target.student_id, 'active', 'Returned to hostel');

    // Update hostel exit entry to 'returned'
    const entries = await db.getTable('hostel_entries');
    const studentEntry = entries.find(e => e.student_id === target.student_id && e.status === 'outside');
    if (studentEntry) {
      await db.updateRecord('hostel_entries', studentEntry.id, {
        return_date: actualDate,
        return_time: actualTime,
        status: 'returned'
      });
    }

    // If fine occurred, create fine record & black mark
    if (calculation.fineAmount > 0) {
      const year = new Date().getFullYear();
      const fnNo = `FN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.insertRecord('fines', {
        fine_no: fnNo,
        student_id: target.student_id,
        leave_id: parentLeave.id,
        category_name: 'Late Hostel Return',
        amount: calculation.fineAmount,
        late_days: calculation.lateDays,
        black_marks: calculation.blackMarks,
        reason: `${calculation.lateDays} days late return from approved hostel leave`,
        issued_by: window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden Office',
        issue_date: actualDate,
        status: 'pending'
      });
    }

    if (calculation.blackMarks > 0) {
      await db.insertRecord('black_marks', {
        student_id: target.student_id,
        leave_id: parentLeave.id,
        marks_count: calculation.blackMarks,
        reason: calculation.lateDays > 0 ? `${calculation.lateDays} days late return` : `Late return on scheduled date (${actualTime})`,
        issued_date: actualDate,
        issued_by: window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden Office'
      });
    }

    return calculation;
  }
}

window.LeaveService = new LeaveService();
