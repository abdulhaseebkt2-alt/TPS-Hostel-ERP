/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Student Service: Admissions, Profiles, Status, Group Assignments, Bed Sync
 */

class StudentService {
  async getAllStudents() {
    return await db.getTable('students');
  }

  async getStudentById(id) {
    const students = await this.getAllStudents();
    return students.find(s => s.id === id) || null;
  }

  async getStudentsByHostel(hostelId) {
    const students = await this.getAllStudents();
    if (!hostelId) return students;
    return students.filter(s => s.hostel_id === hostelId);
  }

  async getStudentsByGroup(groupId) {
    const students = await this.getAllStudents();
    return students.filter(s =>
      s.moral_group_id === groupId ||
      s.hostel_coaching_id === groupId ||
      s.school_coaching_id === groupId
    );
  }

  normalizeClass(raw) {
    if (!raw) return 'STD-VIII';
    const trimmed = raw.toString().trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'LKG' || upper === 'L.K.G' || upper === 'L.K.G.') return 'LKG';
    if (upper === 'UKG' || upper === 'U.K.G' || upper === 'U.K.G.') return 'UKG';

    const romanMap = {
      '1': 'STD-I', 'I': 'STD-I', '01': 'STD-I',
      '2': 'STD-II', 'II': 'STD-II', '02': 'STD-II',
      '3': 'STD-III', 'III': 'STD-III', '03': 'STD-III',
      '4': 'STD-IV', 'IV': 'STD-IV', '04': 'STD-IV',
      '5': 'STD-V', 'V': 'STD-V', '05': 'STD-V',
      '6': 'STD-VI', 'VI': 'STD-VI', '06': 'STD-VI',
      '7': 'STD-VII', 'VII': 'STD-VII', '07': 'STD-VII',
      '8': 'STD-VIII', 'VIII': 'STD-VIII', '08': 'STD-VIII',
      '9': 'STD-IX', 'IX': 'STD-IX', '09': 'STD-IX',
      '10': 'STD-X', 'X': 'STD-X',
      '11': 'STD-XI', 'XI': 'STD-XI',
      '12': 'STD-XII', 'XII': 'STD-XII'
    };

    const clean = upper.replace(/^(STD|CLASS|GRADE|STANDARD|STD\.)[\s\-_]*/i, '').trim();
    if (romanMap[clean]) return romanMap[clean];
    if (upper.startsWith('STD-')) return upper;

    return trimmed;
  }

  async createStudent(studentData) {
    // Validate required fields
    if (!studentData.full_name || !studentData.gender || !studentData.dob || !studentData.school_class) {
      throw new Error('Please fill in all mandatory admission fields.');
    }

    studentData.school_class = this.normalizeClass(studentData.school_class);

    // Auto generate ID number (format: TPS2026056) if not provided from school
    if (!studentData.admission_no) {
      const year = new Date().getFullYear();
      const randomSeq = String(Math.floor(10 + Math.random() * 890)).padStart(3, '0');
      studentData.admission_no = `TPS${year}${randomSeq}`;
    }

    // Check duplicate ID number
    const existing = await this.getAllStudents();
    if (existing.some(s => s.admission_no && s.admission_no.toLowerCase() === studentData.admission_no.toLowerCase())) {
      throw new Error(`ID Number "${studentData.admission_no}" already exists in the system.`);
    }

    // Auto calculate age if not provided
    if (!studentData.age && studentData.dob) {
      const birth = new Date(studentData.dob);
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      studentData.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    studentData.student_category = studentData.student_category || 'General';
    studentData.status = studentData.status || 'Enrolled';
    studentData.school_admission_date = studentData.school_admission_date || studentData.admission_date || new Date().toISOString().split('T')[0];
    studentData.hostel_admission_date = studentData.hostel_admission_date || studentData.admission_date || new Date().toISOString().split('T')[0];
    studentData.admission_date = studentData.hostel_admission_date;
    studentData.photo_url = studentData.photo_url || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');

    const newStudent = await db.insertRecord('students', studentData);

    // If bed is assigned, sync bed occupancy
    if (newStudent.bed_id) {
      await db.updateRecord('beds', newStudent.bed_id, { status: 'occupied', current_student_id: newStudent.id });
    }

    return newStudent;
  }

  async updateStudent(id, updates) {
    const current = await this.getStudentById(id);
    if (!current) throw new Error('Student record not found.');

    if (updates.school_class) {
      updates.school_class = this.normalizeClass(updates.school_class);
    }

    if (updates.dob && !updates.age) {
      const birth = new Date(updates.dob);
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      updates.age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // If bed changed, free old bed and occupy new bed
    if (updates.bed_id !== undefined && updates.bed_id !== current.bed_id) {
      if (current.bed_id) {
        await db.updateRecord('beds', current.bed_id, { status: 'available', current_student_id: null });
      }
      if (updates.bed_id) {
        await db.updateRecord('beds', updates.bed_id, { status: 'occupied', current_student_id: id });
      }
    }

    return await db.updateRecord('students', id, updates);
  }

  async deleteStudent(id) {
    const current = await this.getStudentById(id);
    if (current && current.bed_id) {
      await db.updateRecord('beds', current.bed_id, { status: 'available', current_student_id: null });
    }
    // Also remove from all class groups
    const groups = await db.getTable('class_groups');
    for (const g of groups) {
      if (Array.isArray(g.assigned_student_ids) && g.assigned_student_ids.includes(id)) {
        const updatedIds = g.assigned_student_ids.filter(sId => sId !== id);
        await db.updateRecord('class_groups', g.id, { assigned_student_ids: updatedIds });
      }
    }
    return await db.deleteRecord('students', id);
  }

  async deleteMultipleStudents(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return { success: true, count: 0 };
    let successCount = 0;
    for (const id of ids) {
      try {
        await this.deleteStudent(id);
        successCount++;
      } catch (err) {
        console.error('Error deleting student ' + id, err);
      }
    }
    return { success: true, count: successCount };
  }

  async changeStudentStatus(id, newStatus, remarks = '') {
    return await this.updateStudent(id, {
      status: newStatus,
      status_remarks: remarks,
      status_updated_at: new Date().toISOString()
    });
  }

  async updateClassAssignments(studentId, assignments) {
    return await this.updateStudent(studentId, {
      school_class: this.normalizeClass(assignments.school_class),
      moral_group_id: assignments.moral_group_id,
      hostel_coaching_id: assignments.hostel_coaching_id,
      school_coaching_id: assignments.school_coaching_id
    });
  }

  // Smart date parser supporting DD-Mon-YY, DD/MM/YYYY, YYYY-MM-DD, and text-embedded dates
  parseDateSmart(val) {
    if (!val) return '';
    const str = val.toString().trim();
    if (!str) return '';

    // ISO format YYYY-MM-DD
    const isoMatch = str.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // Standard DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    // Formats like 01-Aug-20 or 15 May 2010 or 12-Jul-18
    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const monMatch = str.match(/\b(\d{1,2})[\/\-\s]+([a-zA-Z]{3,9})[\/\-\s]+(\d{2,4})\b/);
    if (monMatch) {
      const day = monMatch[1].padStart(2, '0');
      const mon = monthMap[monMatch[2].substring(0, 3).toLowerCase()] || '01';
      let yr = monMatch[3];
      if (yr.length === 2) {
        const numYr = parseInt(yr);
        yr = numYr <= 40 ? `20${yr}` : `19${yr}`;
      }
      return `${yr}-${mon}-${day}`;
    }

    // Short DD/MM/YY format
    const shortDmy = str.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/);
    if (shortDmy) {
      const numYr = parseInt(shortDmy[3]);
      const yr = numYr <= 40 ? `20${shortDmy[3]}` : `19${shortDmy[3]}`;
      return `${yr}-${shortDmy[2].padStart(2, '0')}-${shortDmy[1].padStart(2, '0')}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return str;
  }

  // Helper to extract fields from row with diverse header variations
  getRowField(row, patterns) {
    if (!row || typeof row !== 'object') return '';
    const keys = Object.keys(row);
    for (const p of patterns) {
      if (typeof p === 'string') {
        const target = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return String(row[found]).trim();
        }
      } else if (p instanceof RegExp) {
        const found = keys.find(k => p.test(k));
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return String(row[found]).trim();
        }
      }
    }
    return '';
  }

  // Batch import students from parsed CSV / Excel rows
  async importStudents(studentsArray, defaultOverrides = {}) {
    if (!Array.isArray(studentsArray) || studentsArray.length === 0) {
      throw new Error('No valid student rows provided for import.');
    }

    const existing = await this.getAllStudents();
    const existingAdmNos = new Set(existing.map(s => (s.admission_no || '').toLowerCase().trim()));
    const hostels = await window.HostelService.getAllHostels();

    const imported = [];
    const skipped = [];
    const errors = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < studentsArray.length; i++) {
      const row = studentsArray[i];
      const rowNum = i + 1;

      // Skip purely empty rows
      const hasAnyData = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (!hasAnyData) continue;

      try {
        // 1. Student Name
        let fullName = this.getRowField(row, [
          'students_name', 'student_name', 'studentsname', 'studentname', 
          'full_name', 'fullname', 'name', 'student',
          /student.*name|name.*student/i, /^name$/i
        ]);

        if (!fullName) {
          // If name is still blank, check second column if keys are numeric or unlabelled
          const values = Object.values(row).map(v => String(v || '').trim()).filter(Boolean);
          if (values.length >= 2 && !/^\d+$/.test(values[1])) {
            fullName = values[1];
          } else if (values.length >= 1 && !/^\d+$/.test(values[0])) {
            fullName = values[0];
          }
        }

        if (!fullName) {
          skipped.push({ row: rowNum, reason: 'Empty student name' });
          continue;
        }

        // 2. ID Number
        let admNo = this.getRowField(row, [
          'id_number', 'id_no', 'id', 'student_id', 'admission_no', 'adm_no', 'idno',
          /^id/i, /admission.*no/i, /id.*number/i
        ]);

        if (!admNo || admNo.length < 3) {
          const randomSeq = String(Math.floor(10 + Math.random() * 890)).padStart(3, '0');
          admNo = `TPS${currentYear}${randomSeq}`;
        }

        // Avoid duplicate ID number collisions
        if (existingAdmNos.has(admNo.toLowerCase())) {
          admNo = `${admNo}-DUP-${Math.floor(100 + Math.random() * 900)}`;
        }
        existingAdmNos.add(admNo.toLowerCase());

        // 3. Gender
        let rawGender = (this.getRowField(row, ['gender', 'sex', /^gen/i]) || defaultOverrides.gender || 'male').toLowerCase().trim();
        let gender = 'male';
        if (rawGender.startsWith('f') || rawGender.startsWith('g') || rawGender === 'female' || rawGender === 'girl') {
          gender = 'female';
        }

        // 4. Class
        const rawClassVal = this.getRowField(row, ['class', 'school_class', 'grade', 'standard', 'std', /class|grade|standard/i]) || defaultOverrides.school_class || 'STD-VIII';
        const normalizedClass = this.normalizeClass(rawClassVal);

        // 5. Category (Orphan / General / Staff ward)
        const rawCat = this.getRowField(row, ['category', 'student_category', 'orphan_general_staff_ward', /category|orphan|ward/i]) || 'General';
        let category = 'General';
        if (/orphan/i.test(rawCat)) category = 'Orphan';
        else if (/staff/i.test(rawCat)) category = 'Staff ward';

        // 6. Status (Enrolled / Withdrawn)
        const rawStatus = this.getRowField(row, ['enrolled_withdrawn', 'status', 'enrollment_status', /enrolled|withdrawn|status/i]) || defaultOverrides.status || 'Enrolled';
        let status = 'Enrolled';
        if (/withdrawn|dropout|inactive|discharged/i.test(rawStatus)) status = 'Withdrawn';

        // 7. Dates & Age
        const rawDob = this.getRowField(row, ['date_of_birth', 'dob', 'birth_date', 'birthdate', /dob|birth/i]) || '2012-01-01';
        const dob = this.parseDateSmart(rawDob) || '2012-01-01';

        let age = parseInt(this.getRowField(row, ['age', 'student_age', /^age$/i]));
        if (isNaN(age) && dob) {
          const birth = new Date(dob);
          const ageDifMs = Date.now() - birth.getTime();
          const ageDate = new Date(ageDifMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        const rawSchoolAdmDate = this.getRowField(row, ['date_of_admission_school', 'school_admission_date', 'school_admission', /school.*(adm|date)|(adm|date).*school/i]) || new Date().toISOString().split('T')[0];
        const schoolAdmDate = this.parseDateSmart(rawSchoolAdmDate) || new Date().toISOString().split('T')[0];

        const rawHostelAdm = this.getRowField(row, ['date_of_admission_hostel', 'hostel_admission_date', 'hostel_admission', /hostel.*(adm|date)|(adm|date).*hostel/i]) || schoolAdmDate;
        const hostelAdmDate = this.parseDateSmart(rawHostelAdm) || schoolAdmDate;

        // 8. Contact & Parents
        const mobileNo = this.getRowField(row, ['mobile_no', 'mobile', 'phone', 'father_phone', 'mobile_number', /mobile|phone|contact/i]) || '';
        const whatsappNo = this.getRowField(row, ['whatsapp_no', 'whatsapp', 'wa_no', 'father_whatsapp', /whatsapp|wa/i]) || mobileNo;
        const fatherName = this.getRowField(row, ['fathers_name', 'father_name', 'father', 'fathersname', /father/i]) || '';
        const motherName = this.getRowField(row, ['mothers_name', 'mother_name', 'mother', 'mothersname', /mother/i]) || '';
        const address = this.getRowField(row, ['address', 'student_address', 'permanent_address', /address|village/i]) || '';

        // 9. Remarks (incorporating extra notes from rawHostelAdm if any)
        let remarks = this.getRowField(row, ['remarks', 'remark', 'notes', 'note', 'medical_notes', /remark|note|comment/i]) || '';
        if (rawHostelAdm && rawHostelAdm.length > 12 && !remarks.includes(rawHostelAdm)) {
          const extraText = rawHostelAdm.replace(/\d{1,4}[\/\-\s]+\w+[\/\-\s]+\d{2,4}/g, '').replace(/[\/\-\d]+/g, '').trim();
          if (extraText.length > 2 && !remarks) {
            remarks = extraText;
          }
        }

        // 10. Hostel Facility Matching
        let hostelId = (this.getRowField(row, ['hostel_id', 'hostel_name', 'hostel', /^hostel/i]) || defaultOverrides.hostel_id || '').trim();
        if (!hostelId || hostelId === 'auto') {
          const matchedHostel = hostels.find(h => 
            (gender === 'male' && h.gender === 'boys') ||
            (gender === 'female' && h.gender === 'girls')
          );
          hostelId = matchedHostel ? matchedHostel.id : (gender === 'male' ? 'bh-01' : 'gh-01');
        }

        const photoUrl = this.getRowField(row, ['photo_url', 'photo', 'image', 'avatar', /photo|image/i]) || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');

        const studentData = {
          admission_no: admNo,
          full_name: fullName,
          school_class: normalizedClass,
          address: address,
          gender: gender,
          student_category: category,
          school_admission_date: schoolAdmDate,
          dob: dob,
          age: age || 14,
          father_phone: mobileNo,
          father_whatsapp: whatsappNo,
          father_name: fatherName,
          mother_name: motherName,
          status: status,
          hostel_admission_date: hostelAdmDate,
          admission_date: hostelAdmDate,
          remarks: remarks,
          hostel_id: hostelId,
          room_id: null,
          bed_id: null,
          photo_url: photoUrl,
          village: address,
          district: 'Malappuram',
          state: 'Kerala',
          pin_code: '676503'
        };

        const inserted = await db.insertRecord('students', studentData);
        imported.push(inserted);
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
      }
    }

    db.logAudit('BULK_IMPORT_STUDENTS', 'students', null, {
      total_attempted: studentsArray.length,
      imported_count: imported.length,
      skipped_count: skipped.length,
      errors_count: errors.length
    });

    return {
      success: true,
      total: studentsArray.length,
      importedCount: imported.length,
      skippedCount: skipped.length,
      errorsCount: errors.length,
      imported,
      skipped,
      errors
    };
  }
}

window.StudentService = new StudentService();
