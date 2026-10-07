/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Discipline & Fine Service: Conduct Register, Incident Reports, Black Marks, Fine Slips
 */

class DisciplineService {
  async getAllIncidents() {
    return await db.getTable('discipline_incidents');
  }

  async getAllFines() {
    return await db.getTable('fines');
  }

  async getAllBlackMarks() {
    return await db.getTable('black_marks');
  }

  async recordIncident(data) {
    const year = new Date().getFullYear();
    const incNo = `INC-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    data.incident_no = incNo;
    data.reported_by = data.reported_by || (window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Staff');
    data.status = data.status || 'resolved';

    const incident = await db.insertRecord('discipline_incidents', data);

    // Record Black Marks if applicable
    if (data.black_marks && data.black_marks > 0) {
      await db.insertRecord('black_marks', {
        student_id: data.student_id,
        incident_id: incident.id,
        marks_count: data.black_marks,
        reason: `${data.category}: ${data.description}`,
        issued_date: data.incident_date || new Date().toISOString().split('T')[0],
        issued_by: data.reported_by
      });
    }

    // Record Fine if applicable
    if (data.fine_amount && data.fine_amount > 0) {
      const fnNo = `FN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.insertRecord('fines', {
        fine_no: fnNo,
        student_id: data.student_id,
        incident_id: incident.id,
        category_name: data.category,
        amount: data.fine_amount,
        late_days: 0,
        black_marks: data.black_marks || 0,
        reason: data.description,
        issued_by: data.reported_by,
        issue_date: data.incident_date || new Date().toISOString().split('T')[0],
        status: 'pending'
      });
    }

    return incident;
  }

  async markFinePaid(fineId) {
    return await db.updateRecord('fines', fineId, {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      received_by: window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Accounts / Warden'
    });
  }

  async deleteIncident(incidentId) {
    const [fines, blackMarks] = await Promise.all([
      this.getAllFines(),
      this.getAllBlackMarks()
    ]);

    // Clean up any linked fines
    const linkedFines = fines.filter(f => f.incident_id === incidentId);
    for (const f of linkedFines) {
      await db.deleteRecord('fines', f.id);
    }

    // Clean up any linked black marks
    const linkedMarks = blackMarks.filter(b => b.incident_id === incidentId);
    for (const b of linkedMarks) {
      await db.deleteRecord('black_marks', b.id);
    }

    return await db.deleteRecord('discipline_incidents', incidentId);
  }

  async deleteFine(fineId) {
    return await db.deleteRecord('fines', fineId);
  }

  async deleteBlackMark(markId) {
    return await db.deleteRecord('black_marks', markId);
  }

  async getStudentDisciplineSummary(studentId) {
    const [incidents, fines, blackMarks] = await Promise.all([
      this.getAllIncidents(),
      this.getAllFines(),
      this.getAllBlackMarks()
    ]);

    const sIncidents = incidents.filter(i => i.student_id === studentId);
    const sFines = fines.filter(f => f.student_id === studentId);
    const sMarks = blackMarks.filter(b => b.student_id === studentId);

    const totalFines = sFines.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const pendingFines = sFines.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalMarks = sMarks.reduce((sum, m) => sum + Number(m.marks_count || 1), 0);

    return {
      incidentsCount: sIncidents.length,
      incidents: sIncidents,
      totalFines,
      pendingFines,
      fines: sFines,
      totalBlackMarks: totalMarks,
      blackMarks: sMarks
    };
  }
}

window.DisciplineService = new DisciplineService();
