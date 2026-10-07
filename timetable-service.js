/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Timetable Management & Conflict Detection Engine
 */

class TimetableService {
  async getAllTimetables() {
    return await db.getTable('timetables');
  }

  // Detect schedule conflicts
  async checkConflicts(newEntry, excludeId = null) {
    const all = await this.getAllTimetables();
    const groups = await window.AttendanceService.getClassGroups();
    const teachers = await db.getTable('teachers');

    const [newStartH, newStartM] = newEntry.start_time.split(':').map(Number);
    const [newEndH, newEndM] = newEntry.end_time.split(':').map(Number);
    const newStartTotal = newStartH * 60 + newStartM;
    const newEndTotal = newEndH * 60 + newEndM;

    for (const item of all) {
      if (excludeId && item.id === excludeId) continue;
      if (item.day_of_week !== newEntry.day_of_week) continue;

      const [itemStartH, itemStartM] = item.start_time.split(':').map(Number);
      const [itemEndH, itemEndM] = item.end_time.split(':').map(Number);
      const itemStartTotal = itemStartH * 60 + itemStartM;
      const itemEndTotal = itemEndH * 60 + itemEndM;

      // Check time overlap
      const isOverlap = (newStartTotal < itemEndTotal && newEndTotal > itemStartTotal);
      if (!isOverlap) continue;

      // 1. Teacher double booking conflict
      if (item.teacher_id === newEntry.teacher_id) {
        const teacher = teachers.find(t => t.id === newEntry.teacher_id);
        const group = groups.find(g => g.id === item.group_id);
        return {
          hasConflict: true,
          type: 'TEACHER_DOUBLE_BOOKING',
          message: `Double Booking Conflict: Teacher "${teacher ? teacher.full_name : 'Assigned Teacher'}" already has a class scheduled with "${group ? group.group_name : 'Class'}" on ${item.day_of_week} between ${item.start_time} and ${item.end_time}.`
        };
      }

      // 2. Room double booking conflict
      if (newEntry.room_name && item.room_name && newEntry.room_name.toLowerCase() === item.room_name.toLowerCase()) {
        const group = groups.find(g => g.id === item.group_id);
        return {
          hasConflict: true,
          type: 'ROOM_DOUBLE_BOOKING',
          message: `Room Conflict: Room "${newEntry.room_name}" is already booked for "${group ? group.group_name : 'Group'}" on ${item.day_of_week} from ${item.start_time} to ${item.end_time}.`
        };
      }
    }

    return { hasConflict: false };
  }

  async saveTimetableEntry(entryData) {
    const conflict = await this.checkConflicts(entryData, entryData.id);
    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    if (entryData.id) {
      return await db.updateRecord('timetables', entryData.id, entryData);
    } else {
      return await db.insertRecord('timetables', entryData);
    }
  }

  async deleteTimetableEntry(id) {
    return await db.deleteRecord('timetables', id);
  }
}

window.TimetableService = new TimetableService();
