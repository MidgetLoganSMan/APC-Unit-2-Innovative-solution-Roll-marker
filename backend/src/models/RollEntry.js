export default class RollEntry {
 constructor(id, studentId, classId, timestamp, status, source) {
 this.id = id;
 this.studentId = studentId;
 this.classId = classId;
 this.timestamp = timestamp;
 this.status = status;
 this.source = source;
 }
}