/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Attendance Engine: Section Management (Moral, Coaching, Extra), Classrooms,
 * Weekly Timetable Schedule Engine & Date-wise Records
 */

class AttendanceService {
  constructor() {
    this.customSectionsKey = 'tps_custom_sections';
    this.deletedSectionsKey = 'tps_deleted_sections';
  }

  // Normalize section ID to primary section key
  normalizeSectionId(secId) {
    if (!secId) return 'moral_section';
    if (secId === 'moral_class' || secId === 'moral_section') return 'moral_section';
    if (secId === 'hostel_coaching' || secId === 'coaching_section') return 'coaching_section';
    if (secId === 'extra_coaching' || secId === 'extra_section' || secId === 'school_coaching') return 'extra_section';
    return secId;
  }

  // Get all configured sections (Moral Section, Coaching Section, Extra Section + custom sections)
  getSections() {
    let custom = [];
    let deleted = [];
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const savedCustom = localStorage.getItem(this.customSectionsKey);
        if (savedCustom) custom = JSON.parse(savedCustom);
        const savedDeleted = localStorage.getItem(this.deletedSectionsKey);
        if (savedDeleted) deleted = JSON.parse(savedDeleted);
      }
    } catch (e) {
      console.warn('Failed to parse section configuration:', e);
    }

    const defaultSections = [
      { id: 'moral_section', name: 'Moral Section', description: 'Quran Recitation, Tajweed & Islamic Moral Values', icon: 'book', color: '#059669', badgeBg: 'rgba(5, 150, 105, 0.12)' },
      { id: 'coaching_section', name: 'Coaching Section', description: 'Supervised Evening & Hostel Coaching', icon: 'academic', color: '#0284c7', badgeBg: 'rgba(2, 132, 199, 0.12)' },
      { id: 'extra_section', name: 'Extra Section', description: 'Extra Coaching, Special Tuition & STEM Support', icon: 'sparkle', color: '#7c3aed', badgeBg: 'rgba(124, 58, 237, 0.12)' }
    ];

    const map = new Map();
    defaultSections.forEach(s => map.set(s.id, { ...s }));
    custom.forEach(s => map.set(s.id, { ...s }));

    const deletedSet = new Set(Array.isArray(deleted) ? deleted : []);
    const result = Array.from(map.values()).filter(s => !deletedSet.has(s.id));

    // Always keep at least 1 section available
    if (result.length === 0) {
      return [{ id: 'moral_section', name: 'Moral Section', description: 'Moral & Spiritual Studies', icon: 'book', color: '#059669', badgeBg: 'rgba(5, 150, 105, 0.12)' }];
    }

    return result;
  }

  getSectionById(sectionId) {
    if (!sectionId) return null;
    const normalizedId = this.normalizeSectionId(sectionId);
    const sections = this.getSections();
    return sections.find(s => s.id === normalizedId) || {
      id: normalizedId,
      name: normalizedId.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: 'Educational Department',
      icon: 'folder',
      color: '#0d5c3a',
      badgeBg: 'rgba(13, 92, 58, 0.12)'
    };
  }

  // Add a new Section dynamically
  addSection(sectionData) {
    if (!sectionData.name || !sectionData.name.trim()) {
      throw new Error('Please enter a section name.');
    }

    const cleanName = sectionData.name.trim();
    const id = sectionData.id || 'sec_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
    
    const newSec = {
      id,
      name: cleanName,
      description: (sectionData.description || 'Educational Section').trim(),
      icon: sectionData.icon || 'folder',
      color: sectionData.color || '#0d5c3a',
      badgeBg: sectionData.badgeBg || 'rgba(13, 92, 58, 0.12)',
      is_custom: true
    };

    let custom = [];
    let deleted = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const sCustom = localStorage.getItem(this.customSectionsKey);
        if (sCustom) custom = JSON.parse(sCustom);
        const sDel = localStorage.getItem(this.deletedSectionsKey);
        if (sDel) deleted = JSON.parse(sDel);
      }
    } catch (e) {}

    // Un-delete if previously deleted
    deleted = deleted.filter(delId => delId !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.deletedSectionsKey, JSON.stringify(deleted));
    }

    const cIdx = custom.findIndex(s => s.id === id);
    if (cIdx >= 0) custom[cIdx] = newSec;
    else custom.push(newSec);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.customSectionsKey, JSON.stringify(custom));
    }

    db.logAudit('CREATE_SECTION', 'sections', id, { name: newSec.name });
    return newSec;
  }

  // Update existing Section
  updateSection(sectionId, updates) {
    if (!sectionId) throw new Error('Section ID is required.');
    const sections = this.getSections();
    const current = sections.find(s => s.id === sectionId);
    if (!current) throw new Error('Section not found.');

    const updated = {
      ...current,
      name: (updates.name || current.name).trim(),
      description: (updates.description !== undefined ? updates.description : current.description).trim(),
      icon: updates.icon || current.icon || 'folder',
      color: updates.color || current.color || '#0d5c3a',
      badgeBg: updates.color ? `${updates.color}20` : current.badgeBg,
      is_custom: true
    };

    let custom = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const sCustom = localStorage.getItem(this.customSectionsKey);
        if (sCustom) custom = JSON.parse(sCustom);
      }
    } catch (e) {}

    const cIdx = custom.findIndex(s => s.id === sectionId);
    if (cIdx >= 0) custom[cIdx] = updated;
    else custom.push(updated);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.customSectionsKey, JSON.stringify(custom));
    }

    db.logAudit('UPDATE_SECTION', 'sections', sectionId, { name: updated.name });
    return updated;
  }

  // Delete Section
  async deleteSection(sectionId) {
    if (!sectionId) throw new Error('Section ID is required.');

    let custom = [];
    let deleted = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const sCustom = localStorage.getItem(this.customSectionsKey);
        if (sCustom) custom = JSON.parse(sCustom);
        const sDel = localStorage.getItem(this.deletedSectionsKey);
        if (sDel) deleted = JSON.parse(sDel);
      }
    } catch (e) {}

    // Remove from custom if present
    custom = custom.filter(s => s.id !== sectionId);
    if (!deleted.includes(sectionId)) {
      deleted.push(sectionId);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.customSectionsKey, JSON.stringify(custom));
      localStorage.setItem(this.deletedSectionsKey, JSON.stringify(deleted));
    }

    // Check if any classrooms were assigned to this section
    const allGroups = await this.getClassGroups();
    const affected = allGroups.filter(g => {
      const gSec = this.normalizeSectionId(g.category || g.section_id);
      return gSec === sectionId;
    });

    const remainingSections = this.getSections();
    const fallbackSecId = remainingSections[0]?.id || 'moral_section';

    for (const g of affected) {
      await db.updateRecord('class_groups', g.id, {
        category: fallbackSecId,
        section_id: fallbackSecId
      });
    }

    db.logAudit('DELETE_SECTION', 'sections', sectionId, {
      reassigned_classrooms: affected.length,
      fallback_section: fallbackSecId
    });

    return true;
  }

  // Backwards compatibility alias
  saveCustomSection(sectionData) {
    return this.addSection(sectionData);
  }

  // Check if current time falls within permitted class attendance window
  isAttendanceWindowOpen(startTimeStr, endTimeStr, graceMinutes = 30) {
    if (window.Auth && window.Auth.currentUser && window.Auth.currentUser.role === CONFIG.ROLES.SUPER_ADMIN) {
      return { isOpen: true, statusText: 'Admin Mode (Unlimited Access)', minutesRemaining: 60 };
    }

    if (!startTimeStr || !endTimeStr) {
      return { isOpen: true, statusText: 'Open Session', minutesRemaining: 60 };
    }

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM + graceMinutes;

    if (currentTotalMinutes < startTotal) {
      const waitMin = startTotal - currentTotalMinutes;
      return {
        isOpen: false,
        statusText: `Class opens at ${startTimeStr} (in ${waitMin}m)`,
        minutesRemaining: 0,
        isEarly: true
      };
    } else if (currentTotalMinutes > endTotal) {
      return {
        isOpen: false,
        statusText: `Window closed after ${endTimeStr} (+${graceMinutes}m grace)`,
        minutesRemaining: 0,
        isClosed: true
      };
    } else {
      const remMin = endTotal - currentTotalMinutes;
      return {
        isOpen: true,
        statusText: `Window Open (${remMin} mins remaining)`,
        minutesRemaining: remMin
      };
    }
  }

  // Get all class rooms or filter by section
  async getClassGroups(sectionId = null) {
    const groups = await db.getTable('class_groups');
    if (!sectionId) return groups;

    const normSec = this.normalizeSectionId(sectionId);
    return groups.filter(g => {
      const groupSec = this.normalizeSectionId(g.category || g.section_id);
      return groupSec === normSec;
    });
  }

  async getGroupById(id) {
    const groups = await db.getTable('class_groups');
    return groups.find(g => g.id === id) || null;
  }

  // Create a new Classroom under a Section
  async createClassGroup(groupData, studentIds = []) {
    if (!groupData.group_name || !groupData.category) {
      throw new Error('Please enter classroom name and select a section.');
    }

    const normSec = this.normalizeSectionId(groupData.category);
    groupData.category = normSec;
    groupData.section_id = normSec;
    groupData.start_time = groupData.start_time || '18:00';
    groupData.end_time = groupData.end_time || '19:00';
    groupData.status = groupData.status || 'active';
    groupData.assigned_student_ids = Array.isArray(studentIds) ? studentIds : [];

    const newGroup = await db.insertRecord('class_groups', groupData);

    if (studentIds && studentIds.length > 0) {
      await this.syncStudentsGroup(newGroup.id, newGroup.category, studentIds);
    }

    db.logAudit('CREATE_CLASS_ROOM', 'class_groups', newGroup.id, {
      group_name: newGroup.group_name,
      section: newGroup.category,
      students_count: studentIds.length
    });

    return newGroup;
  }

  // Update Classroom details & student assignments
  async updateClassGroup(groupId, updates, studentIds = null) {
    const current = await this.getGroupById(groupId);
    if (!current) throw new Error('Class room not found.');

    if (updates.category === 'school_coaching') updates.category = 'extra_coaching';
    if (updates.category) updates.section_id = updates.category;

    if (studentIds !== null && Array.isArray(studentIds)) {
      updates.assigned_student_ids = studentIds;
      const category = updates.category || current.category;
      await this.syncStudentsGroup(groupId, category, studentIds);
    }

    const updated = await db.updateRecord('class_groups', groupId, updates);

    db.logAudit('UPDATE_CLASS_ROOM', 'class_groups', groupId, {
      group_name: updated.group_name,
      updates
    });

    return updated;
  }

  // Delete Classroom
  async deleteClassGroup(groupId) {
    const current = await this.getGroupById(groupId);
    if (!current) throw new Error('Class room not found.');

    // Unlink students from this group
    const students = await window.StudentService.getAllStudents();
    for (const s of students) {
      let changed = false;
      const studentUpdates = {};
      if (s.moral_group_id === groupId) { studentUpdates.moral_group_id = null; changed = true; }
      if (s.hostel_coaching_id === groupId) { studentUpdates.hostel_coaching_id = null; changed = true; }
      if (s.school_coaching_id === groupId || s.extra_coaching_id === groupId) {
        studentUpdates.school_coaching_id = null;
        studentUpdates.extra_coaching_id = null;
        changed = true;
      }
      if (changed) {
        await window.StudentService.updateStudent(s.id, studentUpdates);
      }
    }

    // Clean up all timetable periods for this classroom
    const allTimetables = await db.getTable('timetables');
    const classPeriods = allTimetables.filter(t => t.group_id === groupId);
    for (const p of classPeriods) {
      await db.deleteRecord('timetables', p.id);
    }

    const res = await db.deleteRecord('class_groups', groupId);

    db.logAudit('DELETE_CLASS_ROOM', 'class_groups', groupId, {
      group_name: current.group_name,
      deleted_periods: classPeriods.length
    });

    return res;
  }

  // Sync students assigned to this group
  async syncStudentsGroup(groupId, category, studentIds) {
    const students = await window.StudentService.getAllStudents();
    const targetSet = new Set(studentIds);

    for (const s of students) {
      const isTarget = targetSet.has(s.id);
      const studentUpdates = {};
      let changed = false;

      if (category === 'moral_class') {
        if (isTarget && s.moral_group_id !== groupId) {
          studentUpdates.moral_group_id = groupId;
          changed = true;
        } else if (!isTarget && s.moral_group_id === groupId) {
          studentUpdates.moral_group_id = null;
          changed = true;
        }
      } else if (category === 'hostel_coaching') {
        if (isTarget && s.hostel_coaching_id !== groupId) {
          studentUpdates.hostel_coaching_id = groupId;
          changed = true;
        } else if (!isTarget && s.hostel_coaching_id === groupId) {
          studentUpdates.hostel_coaching_id = null;
          changed = true;
        }
      } else if (category === 'extra_coaching' || category === 'school_coaching') {
        if (isTarget && s.school_coaching_id !== groupId && s.extra_coaching_id !== groupId) {
          studentUpdates.school_coaching_id = groupId;
          studentUpdates.extra_coaching_id = groupId;
          changed = true;
        } else if (!isTarget && (s.school_coaching_id === groupId || s.extra_coaching_id === groupId)) {
          studentUpdates.school_coaching_id = null;
          studentUpdates.extra_coaching_id = null;
          changed = true;
        }
      }

      if (changed) {
        await window.StudentService.updateStudent(s.id, studentUpdates);
      }
    }
  }

  // Get all students enrolled in a group
  async getStudentsInGroup(groupId) {
    const group = await this.getGroupById(groupId);
    if (!group) return [];
    const students = await window.StudentService.getAllStudents();

    return students.filter(s => {
      if (Array.isArray(group.assigned_student_ids) && group.assigned_student_ids.length > 0) {
        return group.assigned_student_ids.includes(s.id);
      }
      if (group.category === 'moral_class') return s.moral_group_id === group.id;
      if (group.category === 'hostel_coaching') return s.hostel_coaching_id === group.id;
      if (group.category === 'extra_coaching' || group.category === 'school_coaching') {
        return s.school_coaching_id === group.id || s.extra_coaching_id === group.id;
      }
      return false;
    });
  }

  // Add single or multiple students to a classroom
  async addStudentsToGroup(groupId, studentIds) {
    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Classroom not found.');

    const currentIds = Array.isArray(group.assigned_student_ids) ? [...group.assigned_student_ids] : [];
    const toAdd = Array.isArray(studentIds) ? studentIds : [studentIds];

    toAdd.forEach(id => {
      if (!currentIds.includes(id)) currentIds.push(id);
    });

    return await this.updateClassGroup(groupId, { assigned_student_ids: currentIds }, currentIds);
  }

  // Remove single student from classroom
  async removeStudentFromGroup(groupId, studentId) {
    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Classroom not found.');

    const currentIds = (group.assigned_student_ids || []).filter(id => id !== studentId);
    return await this.updateClassGroup(groupId, { assigned_student_ids: currentIds }, currentIds);
  }

  // Transfer student from one classroom to another classroom
  async transferStudent(studentId, fromGroupId, toGroupId) {
    if (!studentId || !toGroupId) throw new Error('Student and Destination classroom required.');

    const destGroup = await this.getGroupById(toGroupId);
    if (!destGroup) throw new Error('Destination classroom not found.');

    // Remove from source if present
    if (fromGroupId) {
      await this.removeStudentFromGroup(fromGroupId, studentId);
    }

    // Add to destination
    await this.addStudentsToGroup(toGroupId, [studentId]);

    const student = await window.StudentService.getStudentById(studentId);
    db.logAudit('TRANSFER_STUDENT_CLASSROOM', 'class_groups', toGroupId, {
      student_name: student ? student.full_name : studentId,
      from_group_id: fromGroupId,
      to_group_id: toGroupId,
      section: destGroup.category
    });
    return true;
  }

  // =========================================================================
  // WEEKLY TIMETABLE SCHEDULE ENGINE (CLASSROOM-SPECIFIC)
  // =========================================================================

  async getClassroomTimetables(groupId) {
    if (!groupId) return [];
    const all = await db.getTable('timetables');
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    return all.filter(t => t.group_id === groupId).sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      if (dDiff !== 0) return dDiff;
      const oA = Number(a.order_index) || Number(a.period_number) || 0;
      const oB = Number(b.order_index) || Number(b.period_number) || 0;
      if (oA !== oB) return oA - oB;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }

  async getClassroomDayTimetable(groupId, dayName) {
    if (!groupId || !dayName) return [];
    const all = await this.getClassroomTimetables(groupId);
    return all.filter(t => t.day.toLowerCase() === dayName.toLowerCase());
  }

  async saveClassroomPeriod(periodData) {
    if (!periodData.group_id || !periodData.day || !periodData.subject) {
      throw new Error('Please fill all required period fields (Classroom, Day & Subject).');
    }

    if (!periodData.start_time || !periodData.end_time) {
      throw new Error('Please enter valid start and end times for this period.');
    }

    // Attach teacher name if teacher_id is given
    if (periodData.teacher_id && (!periodData.teacher_name || periodData.teacher_name.startsWith('Usthad') || periodData.teacher_name.startsWith('Mr'))) {
      const teachers = await db.getTable('teachers');
      const tch = teachers.find(t => t.id === periodData.teacher_id);
      if (tch) periodData.teacher_name = tch.full_name;
    }

    if (periodData.is_active === undefined) {
      periodData.is_active = true;
    }

    let saved;
    if (periodData.id) {
      saved = await db.updateRecord('timetables', periodData.id, periodData);
    } else {
      periodData.id = `tt-${periodData.group_id}-${periodData.day.toLowerCase().slice(0, 3)}-${Date.now().toString(36)}`;
      const daySlots = await this.getClassroomDayTimetable(periodData.group_id, periodData.day);
      periodData.order_index = periodData.order_index || (daySlots.length + 1);
      periodData.period_number = periodData.period_number || periodData.order_index;
      saved = await db.insertRecord('timetables', periodData);
    }

    db.logAudit('SAVE_CLASSROOM_PERIOD', 'timetables', saved.id, {
      group_id: saved.group_id,
      day: saved.day,
      subject: saved.subject,
      time: `${saved.start_time} - ${saved.end_time}`
    });

    return saved;
  }

  async deleteClassroomPeriod(periodId) {
    const res = await db.deleteRecord('timetables', periodId);
    db.logAudit('DELETE_CLASSROOM_PERIOD', 'timetables', periodId, {});
    return res;
  }

  async duplicateClassroomPeriod(periodId, targetDays = []) {
    const all = await db.getTable('timetables');
    const source = all.find(t => t.id === periodId);
    if (!source) throw new Error('Source period not found.');

    const created = [];
    for (const day of targetDays) {
      const daySlots = await this.getClassroomDayTimetable(source.group_id, day);
      const clone = {
        ...source,
        id: `tt-${source.group_id}-${day.toLowerCase().slice(0, 3)}-${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
        day: day,
        order_index: daySlots.length + 1,
        period_number: daySlots.length + 1
      };
      const res = await db.insertRecord('timetables', clone);
      created.push(res);
    }

    return created;
  }

  async copyDaySchedule(groupId, sourceDay, targetDays = [], overwrite = false) {
    const sourceSlots = await this.getClassroomDayTimetable(groupId, sourceDay);
    if (sourceSlots.length === 0) throw new Error(`No scheduled periods found on ${sourceDay} to copy.`);

    const created = [];
    for (const day of targetDays) {
      if (day.toLowerCase() === sourceDay.toLowerCase()) continue;

      if (overwrite) {
        const existing = await this.getClassroomDayTimetable(groupId, day);
        for (const ex of existing) {
          await db.deleteRecord('timetables', ex.id);
        }
      }

      const currentDaySlots = overwrite ? [] : await this.getClassroomDayTimetable(groupId, day);
      let baseOrder = currentDaySlots.length;

      for (const slot of sourceSlots) {
        baseOrder++;
        const clone = {
          ...slot,
          id: `tt-${groupId}-${day.toLowerCase().slice(0, 3)}-${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
          day: day,
          order_index: baseOrder,
          period_number: baseOrder
        };
        const res = await db.insertRecord('timetables', clone);
        created.push(res);
      }
    }

    return created;
  }

  async togglePeriodStatus(periodId, isActive) {
    return await db.updateRecord('timetables', periodId, { is_active: Boolean(isActive) });
  }

  async reorderClassroomPeriods(groupId, day, orderedIds) {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      await db.updateRecord('timetables', id, {
        order_index: i + 1,
        period_number: i + 1
      });
    }
    return true;
  }

  // Detect currently active or upcoming scheduled period for classroom & date
  async getCurrentScheduledPeriod(groupId, dateStr = null, timeStr = null) {
    if (!groupId) return { currentPeriod: null, todayPeriods: [], dayName: 'Monday', isLive: false };

    const targetDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[targetDate.getDay()];

    const todayPeriods = (await this.getClassroomDayTimetable(groupId, dayName)).filter(p => p.is_active !== false);

    let currentMinutes;
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      currentMinutes = h * 60 + m;
    } else {
      const now = new Date();
      currentMinutes = now.getHours() * 60 + now.getMinutes();
    }

    let currentPeriod = null;
    let isLive = false;

    // Check for exact ongoing period
    for (const p of todayPeriods) {
      if (!p.start_time || !p.end_time) continue;
      const [sH, sM] = p.start_time.split(':').map(Number);
      const [eH, eM] = p.end_time.split(':').map(Number);
      const sMin = sH * 60 + sM;
      const eMin = eH * 60 + eM;

      if (currentMinutes >= sMin && currentMinutes <= eMin) {
        currentPeriod = p;
        isLive = true;
        break;
      }
    }

    // If not actively running, find nearest upcoming period today
    if (!currentPeriod && todayPeriods.length > 0) {
      for (const p of todayPeriods) {
        if (!p.start_time) continue;
        const [sH, sM] = p.start_time.split(':').map(Number);
        const sMin = sH * 60 + sM;
        if (sMin >= currentMinutes) {
          currentPeriod = p;
          isLive = false;
          break;
        }
      }
      if (!currentPeriod) {
        currentPeriod = todayPeriods[0];
      }
    }

    return {
      currentPeriod,
      todayPeriods,
      dayName,
      isLive
    };
  }

  // Attendance Sessions & Records
  async getSessions(filterDate = null, groupId = null) {
    const sessions = await db.getTable('attendance_sessions');
    return sessions.filter(s => {
      if (filterDate && s.session_date !== filterDate) return false;
      if (groupId && s.group_id !== groupId) return false;
      return true;
    });
  }

  async getSessionById(sessionId) {
    const sessions = await db.getTable('attendance_sessions');
    return sessions.find(s => s.id === sessionId) || null;
  }

  async getStudentAttendanceBySession(sessionId) {
    const records = await db.getTable('student_attendance');
    return records.filter(r => r.session_id === sessionId);
  }

  // Get classroom attendance for a specific date
  async getClassroomDateAttendance(groupId, dateStr) {
    const sessions = await this.getSessions(dateStr, groupId);
    if (!sessions || sessions.length === 0) return null;

    const session = sessions[sessions.length - 1]; // latest session
    const records = await this.getStudentAttendanceBySession(session.id);
    const stateMap = {};
    records.forEach(r => {
      stateMap[r.student_id] = r.status;
    });

    return {
      session,
      stateMap,
      records
    };
  }

  // Submit attendance session
  async submitAttendanceSession(sessionData, studentRecords) {
    sessionData.status = 'submitted';
    sessionData.submitted_at = new Date().toISOString();
    sessionData.submitted_by = window.Auth.currentUser ? window.Auth.currentUser.id : null;
    sessionData.session_date = sessionData.session_date || new Date().toISOString().split('T')[0];

    // Check if session already exists for this group and date
    const existing = await this.getSessions(sessionData.session_date, sessionData.group_id);
    let savedSession;

    if (existing && existing.length > 0) {
      savedSession = await db.updateRecord('attendance_sessions', existing[0].id, sessionData);
      // Clean previous student records for this session
      const allRecords = await db.getTable('student_attendance');
      const toDelete = allRecords.filter(r => r.session_id === savedSession.id);
      for (const rec of toDelete) {
        await db.deleteRecord('student_attendance', rec.id);
      }
    } else {
      savedSession = await db.insertRecord('attendance_sessions', sessionData);
    }

    // Save student records
    for (const rec of studentRecords) {
      rec.session_id = savedSession.id;
      rec.date = sessionData.session_date;
      rec.time_marked = new Date().toISOString();
      await db.insertRecord('student_attendance', rec);
    }

    // Log teacher attendance
    if (savedSession.teacher_id) {
      await db.insertRecord('teacher_attendance', {
        session_id: savedSession.id,
        teacher_id: savedSession.teacher_id,
        status: 'present',
        submitted_time: new Date().toISOString(),
        is_auto_marked: false,
        remarks: 'Submitted attendance successfully on time'
      });
    }

    return savedSession;
  }

  // Auto-flag teacher absence if class period ended without submission
  async checkAndFlagMissingTeacherAttendance() {
    const groups = await this.getClassGroups();
    const today = new Date().toISOString().split('T')[0];
    const sessions = await this.getSessions(today);
    const flagged = [];

    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();

    for (const group of groups) {
      if (!group.teacher_id) continue;
      const [endH, endM] = (group.end_time || '19:00').split(':').map(Number);
      const classEndMin = endH * 60 + endM + 30; // 30 min lock threshold

      if (currentTotalMin > classEndMin) {
        const hasSession = sessions.some(s => s.group_id === group.id && s.status === 'submitted');
        if (!hasSession) {
          await db.insertRecord('teacher_attendance', {
            teacher_id: group.teacher_id,
            status: 'not_submitted',
            assigned_time: `${group.start_time} - ${group.end_time}`,
            submitted_time: null,
            is_auto_marked: true,
            remarks: `Automatic System Record: Attendance was not submitted for ${group.group_name} within permitted window.`
          });
          flagged.push({ group: group.group_name, teacher: group.teacher_id });
        }
      }
    }
    return flagged;
  }

  // Generate comprehensive report for a classroom across date range
  async getClassroomReport(groupId, startDate = null, endDate = null) {
    const group = await this.getGroupById(groupId);
    if (!group) return { students: [], sessions: [], stats: {} };

    const students = await this.getStudentsInGroup(groupId);
    let sessions = await db.getTable('attendance_sessions');
    sessions = sessions.filter(s => s.group_id === groupId && s.status === 'submitted');

    if (startDate) sessions = sessions.filter(s => s.session_date >= startDate);
    if (endDate) sessions = sessions.filter(s => s.session_date <= endDate);

    sessions.sort((a, b) => b.session_date.localeCompare(a.session_date));

    const allRecords = await db.getTable('student_attendance');
    const sessionIds = new Set(sessions.map(s => s.id));
    const relevantRecords = allRecords.filter(r => sessionIds.has(r.session_id));

    const studentStats = students.map(s => {
      const sRecords = relevantRecords.filter(r => r.student_id === s.id);
      const present = sRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const absent = sRecords.filter(r => r.status === 'absent').length;
      const leave = sRecords.filter(r => r.status === 'leave' || r.status === 'excused').length;
      const total = sessions.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

      return {
        student: s,
        present,
        absent,
        leave,
        total,
        percentage
      };
    });

    const totalPossible = students.length * sessions.length;
    const totalPresent = studentStats.reduce((acc, curr) => acc + curr.present, 0);
    const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 100;

    return {
      group,
      sessions,
      students: studentStats,
      stats: {
        totalSessions: sessions.length,
        enrolledStudents: students.length,
        overallRate
      }
    };
  }

  // Calculate monthly stats for a student
  async calculateStudentAttendanceRate(studentId) {
    const records = await db.getTable('student_attendance');
    const studentRecords = records.filter(r => r.student_id === studentId);
    if (studentRecords.length === 0) {
      return { total: 0, present: 0, absent: 0, leave: 0, percentage: 100 };
    }

    const present = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    const leave = studentRecords.filter(r => r.status === 'leave' || r.status === 'excused').length;
    const total = studentRecords.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return { total, present, absent, leave, percentage: rate };
  }
}

window.AttendanceService = new AttendanceService();
