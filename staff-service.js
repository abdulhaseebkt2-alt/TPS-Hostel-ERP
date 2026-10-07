/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Staff Management Service: Teachers, Usthads, Wardens, Coaching Tutors, Academic In-Charges
 */

class StaffService {
  async getAllStaff() {
    return await db.getTable('teachers');
  }

  async getStaffById(id) {
    const all = await this.getAllStaff();
    return all.find(s => s.id === id) || null;
  }

  hasStaffRole(staff, roleKey) {
    if (!staff) return false;
    const rKey = (roleKey || '').toLowerCase().trim();
    if (Array.isArray(staff.roles)) {
      if (staff.roles.includes(rKey)) return true;
      if (rKey === 'mentor' && (staff.roles.includes('mentor') || staff.roles.includes('incharge'))) return true;
      if (rKey === 'warden' && staff.roles.includes('warden')) return true;
      if (rKey === 'moral_teacher' && staff.roles.includes('moral_teacher')) return true;
      if (rKey === 'coaching_tutor' && staff.roles.includes('coaching_tutor')) return true;
    }
    if (staff.role === rKey) return true;
    if (rKey === 'mentor' && (staff.role === 'incharge' || (staff.designation && staff.designation.toLowerCase().includes('mentor')) || (staff.specialization && staff.specialization.toLowerCase().includes('mentor')))) return true;
    if (rKey === 'moral_teacher' && ((staff.specialization && staff.specialization.toLowerCase().includes('moral')) || (staff.full_name && staff.full_name.toLowerCase().includes('usthad')))) return true;
    if (rKey === 'coaching_tutor' && (staff.specialization && (staff.specialization.toLowerCase().includes('coaching') || staff.specialization.toLowerCase().includes('math') || staff.specialization.toLowerCase().includes('science')))) return true;
    if (rKey === 'warden' && (staff.specialization && staff.specialization.toLowerCase().includes('warden'))) return true;
    return false;
  }

  async getStaffSummary() {
    const staff = await this.getAllStaff();
    const classGroups = await db.getTable('class_groups');
    const hostels = await db.getTable('hostels');

    const total = staff.length;
    const active = staff.filter(s => s.status === 'active' || !s.status).length;
    const moralUsthads = staff.filter(s => this.hasStaffRole(s, 'moral_teacher')).length;
    const coachingTutors = staff.filter(s => this.hasStaffRole(s, 'coaching_tutor')).length;
    const wardens = staff.filter(s => this.hasStaffRole(s, 'warden') || hostels.some(h => h.warden_name && h.warden_name.includes(s.full_name))).length;
    const mentors = staff.filter(s => this.hasStaffRole(s, 'mentor')).length;

    return {
      total,
      active,
      moralUsthads,
      coachingTutors,
      wardens,
      mentors,
      totalClassesAssigned: classGroups.filter(cg => cg.teacher_id).length
    };
  }

  async getStaffAssignedClasses(staffId) {
    const classGroups = await db.getTable('class_groups');
    return classGroups.filter(cg => cg.teacher_id === staffId);
  }

  async getStaffAssignedTimetables(staffId) {
    const slots = await db.getTable('timetable_slots');
    return slots.filter(ts => ts.teacher_id === staffId);
  }

  async createStaff(data) {
    const staff = await this.getAllStaff();

    // Auto-generate employee_id if not provided
    let empId = data.employee_id ? data.employee_id.trim().toUpperCase() : '';
    if (!empId) {
      const nextNum = staff.length + 1;
      empId = `TCH-${String(nextNum).padStart(3, '0')}`;
    }

    // Check duplicate employee_id
    if (staff.some(s => s.employee_id && s.employee_id.toUpperCase() === empId)) {
      throw new Error(`Employee ID "${empId}" is already assigned to another staff member.`);
    }

    const assignedRoles = Array.isArray(data.roles) && data.roles.length > 0 
      ? data.roles 
      : (data.role ? [data.role] : ['teacher']);

    const newStaffMember = {
      id: `t-${Date.now()}`,
      employee_id: empId,
      full_name: data.full_name ? data.full_name.trim() : 'Staff Member',
      role: assignedRoles[0] || 'teacher',
      roles: assignedRoles,
      designation: data.designation || data.role || 'Teacher',
      phone: data.phone ? data.phone.trim() : '',
      whatsapp: data.whatsapp ? data.whatsapp.trim() : (data.phone ? data.phone.trim() : ''),
      email: data.email ? data.email.trim().toLowerCase() : '',
      specialization: data.specialization ? data.specialization.trim() : 'General',
      qualification: data.qualification ? data.qualification.trim() : '',
      hostel_id: data.hostel_id || '',
      gender: data.gender || 'male',
      status: data.status || 'active',
      joining_date: data.joining_date || new Date().toISOString().split('T')[0],
      avatar_url: data.avatar_url || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : ''),
      address: data.address || '',
      remarks: data.remarks || '',
      created_at: new Date().toISOString()
    };

    const inserted = await db.insertRecord('teachers', newStaffMember);
    return inserted;
  }

  async updateStaff(id, updates) {
    const staff = await this.getAllStaff();
    const existing = staff.find(s => s.id === id);
    if (!existing) throw new Error('Staff record not found.');

    if (updates.employee_id && updates.employee_id.trim().toUpperCase() !== (existing.employee_id || '').toUpperCase()) {
      const newEmpId = updates.employee_id.trim().toUpperCase();
      if (staff.some(s => s.id !== id && s.employee_id && s.employee_id.toUpperCase() === newEmpId)) {
        throw new Error(`Employee ID "${newEmpId}" is already assigned to another staff member.`);
      }
      updates.employee_id = newEmpId;
    }

    if (updates.roles && Array.isArray(updates.roles)) {
      updates.role = updates.roles[0] || existing.role || 'teacher';
    }

    const updated = await db.updateRecord('teachers', id, updates);

    // If user account is linked to this teacher, sync full_name and phone
    const users = await db.getTable('users');
    const linkedUser = users.find(u => u.linked_teacher_id === id);
    if (linkedUser) {
      await db.updateRecord('users', linkedUser.id, {
        full_name: updates.full_name || existing.full_name,
        phone: updates.phone || existing.phone,
        avatar_url: updates.avatar_url || existing.avatar_url
      });
    }

    return updated;
  }

  async deleteStaff(id) {
    const existing = await this.getStaffById(id);
    if (!existing) throw new Error('Staff record not found.');

    // Unlink teacher from any class groups
    const classGroups = await db.getTable('class_groups');
    for (const cg of classGroups) {
      if (cg.teacher_id === id) {
        await db.updateRecord('class_groups', cg.id, { teacher_id: '' });
      }
    }

    // Unlink teacher from timetable slots
    const slots = await db.getTable('timetable_slots');
    for (const ts of slots) {
      if (ts.teacher_id === id) {
        await db.updateRecord('timetable_slots', ts.id, { teacher_id: '' });
      }
    }

    await db.deleteRecord('teachers', id);
    return existing;
  }

  generateNextEmployeeId(staffList = []) {
    const list = Array.isArray(staffList) ? staffList : [];
    const maxNum = list.reduce((max, s) => {
      const match = (s.employee_id || '').match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TCH-${String(maxNum + 1).padStart(3, '0')}`;
  }
}

window.StaffService = new StaffService();
