/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Hostel Management Service: Hostels, Rooms (8 Beds/Room), Bed Assignments, Digital Diary, Entry/Exit
 */

class HostelService {
  async getAllHostels() {
    return await db.getTable('hostels');
  }

  async getAllRooms(hostelId = null) {
    const rooms = await db.getTable('rooms');
    if (!hostelId) return rooms;
    return rooms.filter(r => r.hostel_id === hostelId);
  }

  async getAllBeds(roomId = null) {
    const beds = await db.getTable('beds');
    if (!roomId) return beds;
    return beds.filter(b => b.room_id === roomId);
  }

  async getHostelStats() {
    const [hostels, rooms, beds, students, outsideEntries, leaves, leaveStudents] = await Promise.all([
      this.getAllHostels(),
      this.getAllRooms(),
      this.getAllBeds(),
      window.StudentService.getAllStudents(),
      this.getCurrentlyOutsideStudents(),
      db.getTable('leaves'),
      db.getTable('leave_students')
    ]);

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const availableBeds = totalBeds - occupiedBeds;

    // Active unreturned students from leave_students & outsideEntries
    const unreturnedLeaveStudents = (leaveStudents || []).filter(ls => !ls.is_returned);
    const onLeaveStudentIds = new Set(unreturnedLeaveStudents.map(ls => ls.student_id));
    (outsideEntries || []).filter(e => e.status === 'outside').forEach(e => onLeaveStudentIds.add(e.student_id));

    const isStudentOnLeave = (s) => onLeaveStudentIds.has(s.id) || onLeaveStudentIds.has(s.admission_no);

    const boys = students.filter(s => s.gender === 'male' || s.gender === 'boys');
    const girls = students.filter(s => s.gender === 'female' || s.gender === 'girls');

    const boysLeaveCount = boys.filter(isStudentOnLeave).length;
    const girlsLeaveCount = girls.filter(isStudentOnLeave).length;
    const totalOnLeave = boysLeaveCount + girlsLeaveCount;

    const presentBoysCount = Math.max(0, boys.length - boysLeaveCount);
    const presentGirlsCount = Math.max(0, girls.length - girlsLeaveCount);
    const presentTotalCount = Math.max(0, students.length - totalOnLeave);

    return {
      totalStudents: students.length,
      activeStudents: presentTotalCount,
      presentTotalCount,
      onLeaveStudents: totalOnLeave,
      currentlyOutside: totalOnLeave,
      boysCount: boys.length,
      girlsCount: girls.length,
      presentBoysCount,
      presentGirlsCount,
      boysLeaveCount,
      girlsLeaveCount,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    };
  }

  // Super Admin / Admin Bed Assignment
  async assignStudentToBed(bedId, studentId) {
    const beds = await this.getAllBeds();
    const targetBed = beds.find(b => b.id === bedId);
    if (!targetBed) throw new Error('Target bed not found.');

    const rooms = await this.getAllRooms();
    const room = rooms.find(r => r.id === targetBed.room_id);
    if (!room) throw new Error('Room not found for bed.');

    const student = await window.StudentService.getStudentById(studentId);
    if (!student) throw new Error('Student not found.');

    // 1. If target bed was previously occupied by someone else, vacate that previous student
    if (targetBed.current_student_id && targetBed.current_student_id !== studentId) {
      await window.StudentService.updateStudent(targetBed.current_student_id, {
        bed_id: null,
        room_id: null
      });
    }

    // 2. If the new student previously occupied another bed, free that old bed
    if (student.bed_id && student.bed_id !== bedId) {
      await db.updateRecord('beds', student.bed_id, {
        status: 'available',
        current_student_id: null
      });
    }

    // 3. Occupy the new bed
    await db.updateRecord('beds', bedId, {
      status: 'occupied',
      current_student_id: studentId
    });

    // 4. Update the student profile
    await window.StudentService.updateStudent(studentId, {
      hostel_id: room.hostel_id,
      room_id: room.id,
      bed_id: bedId
    });

    db.logAudit('ASSIGN_BED', 'hostel_beds', bedId, {
      student_name: student.full_name,
      student_id: student.id,
      room_number: room.room_number,
      bed_number: targetBed.bed_number
    });

    return { success: true, student, bed: targetBed, room };
  }

  // Vacate a bed
  async vacateBed(bedId) {
    const beds = await this.getAllBeds();
    const bed = beds.find(b => b.id === bedId);
    if (!bed) throw new Error('Bed record not found.');

    if (bed.current_student_id) {
      await window.StudentService.updateStudent(bed.current_student_id, {
        bed_id: null,
        room_id: null
      });
    }

    await db.updateRecord('beds', bedId, {
      status: 'available',
      current_student_id: null
    });

    db.logAudit('VACATE_BED', 'hostel_beds', bedId, { bed_number: bed.bed_number });
    return { success: true };
  }

  // Create new Bedroom with configurable side/zone layouts (e.g. 4 or 5 left side, 3 window side)
  async createRoom(roomData, zones = null) {
    roomData.status = roomData.status || 'active';

    // If zones are provided, calculate total capacity
    let totalBeds = 0;
    if (zones && Array.isArray(zones) && zones.length > 0) {
      totalBeds = zones.reduce((sum, z) => sum + (parseInt(z.count) || 0), 0);
    } else {
      const leftCount = parseInt(roomData.left_side_beds) || 4;
      const windowCount = parseInt(roomData.window_side_beds) || 4;
      const rightCount = parseInt(roomData.right_side_beds) || 0;
      totalBeds = leftCount + windowCount + rightCount;
      zones = [
        { name: 'Left Side', count: leftCount },
        { name: 'Window Side', count: windowCount }
      ];
      if (rightCount > 0) {
        zones.push({ name: 'Right Side', count: rightCount });
      }
    }

    roomData.capacity = totalBeds;
    roomData.room_type = roomData.room_type || `${totalBeds}-Bed Dormitory`;

    const newRoom = await db.insertRecord('rooms', {
      hostel_id: roomData.hostel_id,
      floor: roomData.floor || 'Ground Floor',
      room_number: roomData.room_number,
      capacity: totalBeds,
      room_type: roomData.room_type,
      status: roomData.status
    });

    // Automatically create beds grouped by their side / zone
    let bedIndex = 1;
    for (const zone of zones) {
      const count = parseInt(zone.count) || 0;
      for (let i = 1; i <= count; i++) {
        await db.insertRecord('beds', {
          room_id: newRoom.id,
          bed_number: `Bed ${bedIndex}`,
          side: zone.name,
          status: 'available',
          current_student_id: null
        });
        bedIndex++;
      }
    }

    db.logAudit('CREATE_ROOM', 'rooms', newRoom.id, {
      room_number: newRoom.room_number,
      total_beds: totalBeds,
      zones: zones
    });

    return newRoom;
  }

  // Delete a room and safely unassign all students in its beds
  async deleteRoom(roomId) {
    const rooms = await this.getAllRooms();
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) throw new Error('Room record not found.');

    const roomBeds = await this.getAllBeds(roomId);

    // 1. Vacate all students assigned to this room's beds
    for (const b of roomBeds) {
      if (b.current_student_id) {
        await window.StudentService.updateStudent(b.current_student_id, {
          bed_id: null,
          room_id: null
        });
      }
      // 2. Delete bed record
      await db.deleteRecord('beds', b.id);
    }

    // 3. Delete room record
    await db.deleteRecord('rooms', roomId);

    db.logAudit('DELETE_ROOM', 'rooms', roomId, {
      room_number: targetRoom.room_number,
      deleted_beds_count: roomBeds.length
    });

    return { success: true, roomNumber: targetRoom.room_number, deletedBeds: roomBeds.length };
  }

  // Add an individual bed space to an existing room (e.g. Left Side or Window Side)
  async addBedToRoom(roomId, bedData) {
    const rooms = await this.getAllRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room record not found.');

    const roomBeds = await this.getAllBeds(roomId);
    const newBedNumber = bedData.bed_number || `Bed ${roomBeds.length + 1}`;
    const side = bedData.side || 'Left Side';

    const newBed = await db.insertRecord('beds', {
      room_id: roomId,
      bed_number: newBedNumber,
      side: side,
      status: 'available',
      current_student_id: null
    });

    // Update room capacity
    const newCapacity = roomBeds.length + 1;
    await db.updateRecord('rooms', roomId, {
      capacity: newCapacity,
      room_type: `${newCapacity}-Bed Dormitory`
    });

    db.logAudit('ADD_BED', 'beds', newBed.id, {
      room_number: room.room_number,
      bed_number: newBedNumber,
      side: side
    });

    return newBed;
  }

  // Delete an individual bed space (and vacate student if occupied)
  async deleteBed(bedId) {
    const beds = await this.getAllBeds();
    const targetBed = beds.find(b => b.id === bedId);
    if (!targetBed) throw new Error('Bed record not found.');

    const roomId = targetBed.room_id;

    // 1. If occupied, vacate student
    if (targetBed.current_student_id) {
      await window.StudentService.updateStudent(targetBed.current_student_id, {
        bed_id: null,
        room_id: null
      });
    }

    // 2. Delete bed
    await db.deleteRecord('beds', bedId);

    // 3. Recalculate room capacity
    const remainingBeds = (await this.getAllBeds(roomId)).filter(b => b.id !== bedId);
    await db.updateRecord('rooms', roomId, {
      capacity: remainingBeds.length,
      room_type: `${remainingBeds.length}-Bed Dormitory`
    });

    db.logAudit('DELETE_BED', 'beds', bedId, {
      bed_number: targetBed.bed_number,
      room_id: roomId
    });

    return { success: true, bedNumber: targetBed.bed_number };
  }

  // Update Bed (rename or change side/zone)
  async updateBed(bedId, updates) {
    return await db.updateRecord('beds', bedId, updates);
  }

  // Update Room
  async updateRoom(roomId, updates) {
    return await db.updateRecord('rooms', roomId, updates);
  }

  // Entry / Exit
  async getCurrentlyOutsideStudents() {
    const entries = await db.getTable('hostel_entries');
    return entries.filter(e => e.status === 'outside');
  }

  async recordEntryExit(data) {
    data.exit_date = data.exit_date || new Date().toISOString().split('T')[0];
    data.status = 'outside';
    data.permission_by = data.permission_by || (window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden');
    return await db.insertRecord('hostel_entries', data);
  }

  async markEntryReturned(entryId, returnDate, returnTime) {
    return await db.updateRecord('hostel_entries', entryId, {
      return_date: returnDate || new Date().toISOString().split('T')[0],
      return_time: returnTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'returned'
    });
  }

  // Daily Hostel Diary
  async getDiaryEntry(hostelId, dateStr) {
    const diaries = await db.getTable('hostel_diary');
    return diaries.find(d => d.hostel_id === hostelId && d.diary_date === dateStr) || null;
  }

  async saveDiaryEntry(diaryData) {
    if (diaryData.id) {
      return await db.updateRecord('hostel_diary', diaryData.id, diaryData);
    } else {
      return await db.insertRecord('hostel_diary', diaryData);
    }
  }
}

window.HostelService = new HostelService();
