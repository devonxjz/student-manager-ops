// Dữ liệu mẫu cho chế độ mock (VITE_USE_MOCK=true). Sinh ngẫu nhiên nhưng cố định nhờ seed.

function mulberry32(a) {
  return function rand() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COURSES = [
  ['IT001', 'Nhập môn lập trình', 4], ['IT002', 'Lập trình hướng đối tượng', 4], ['IT003', 'Cấu trúc dữ liệu và giải thuật', 4],
  ['IT004', 'Cơ sở dữ liệu', 4], ['IT005', 'Nhập môn mạng máy tính', 4], ['IT006', 'Kiến trúc máy tính', 3],
  ['IT007', 'Hệ điều hành', 4], ['IT008', 'Lập trình trực quan', 3], ['IT009', 'Giới thiệu ngành', 1],
  ['MA001', 'Giải tích 1', 4], ['MA002', 'Giải tích 2', 3], ['MA003', 'Đại số tuyến tính', 3],
  ['MA004', 'Cấu trúc rời rạc', 4], ['MA005', 'Xác suất thống kê', 3], ['PH001', 'Vật lý đại cương', 3],
  ['SE101', 'Nhập môn công nghệ phần mềm', 3], ['SE102', 'Phân tích thiết kế hệ thống', 4], ['SE103', 'Kiểm thử phần mềm', 3],
  ['SE104', 'Quản lý dự án phần mềm', 3], ['SE105', 'Phát triển ứng dụng web', 4], ['SE106', 'Phát triển ứng dụng di động', 4],
  ['SE107', 'Kiến trúc phần mềm', 3], ['SE108', 'DevOps và CI/CD', 3], ['SE109', 'Điện toán đám mây', 3],
  ['IS201', 'Hệ quản trị cơ sở dữ liệu', 4], ['IS202', 'Kho dữ liệu và OLAP', 3], ['IS203', 'Hệ thống thông tin quản lý', 3],
  ['NT301', 'An toàn mạng máy tính', 3], ['NT302', 'Mật mã học', 3], ['NT303', 'Quản trị mạng và hệ thống', 4],
  ['CS401', 'Trí tuệ nhân tạo', 4], ['CS402', 'Học máy', 4], ['CS403', 'Xử lý ngôn ngữ tự nhiên', 3],
  ['CS404', 'Thị giác máy tính', 3], ['CS405', 'Khai phá dữ liệu', 3], ['CS406', 'Đồ hoạ máy tính', 3],
  ['EN001', 'Anh văn 1', 4], ['EN002', 'Anh văn 2', 4], ['EN003', 'Anh văn 3', 4],
  ['PE001', 'Triết học Mác - Lênin', 3], ['PE002', 'Kinh tế chính trị', 2], ['PE003', 'Chủ nghĩa xã hội khoa học', 2],
  ['PE004', 'Tư tưởng Hồ Chí Minh', 2], ['PE005', 'Lịch sử Đảng', 2], ['PE006', 'Pháp luật đại cương', 2],
  ['SK001', 'Kỹ năng mềm', 2], ['SK002', 'Khởi nghiệp', 2], ['PR001', 'Đồ án 1', 2],
  ['PR002', 'Đồ án 2', 2], ['PR003', 'Thực tập doanh nghiệp', 4], ['PR004', 'Khoá luận tốt nghiệp', 10],
];

const TEACHERS = [
  ['GV001', 'Nguyễn Thị Minh Anh'], ['GV002', 'Trần Quốc Bảo'], ['GV003', 'Lê Hoàng Phúc'],
  ['GV004', 'Phạm Thu Hà'], ['GV005', 'Võ Đức Thắng'], ['GV006', 'Đặng Ngọc Lan'],
];

// [mã lớp, tên, index giáo viên | null, số tín chỉ trung bình theo khoá, sĩ số]
const CLASSES = [
  ['CNTT-K20A', 'Công nghệ thông tin K20 - A', 0, 128, 12],
  ['CNTT-K20B', 'Công nghệ thông tin K20 - B', 1, 118, 11],
  ['KTPM-K21A', 'Kỹ thuật phần mềm K21 - A', 0, 92, 13],
  ['HTTT-K21A', 'Hệ thống thông tin K21 - A', 2, 84, 10],
  ['ATTT-K22A', 'An toàn thông tin K22 - A', 3, 55, 12],
  ['KHMT-K22A', 'Khoa học máy tính K22 - A', 4, 60, 11],
  ['CNTT-K23A', 'Công nghệ thông tin K23 - A', null, 22, 9],
];

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const DEM = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Quốc', 'Thanh', 'Hoàng', 'Gia', 'Bảo', 'Đức', 'Khánh', 'Thu'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hải', 'Hiếu', 'Huy', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam', 'Nhi', 'Phong', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Tuấn', 'Uyên', 'Vy', 'Yến'];

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export function buildSeed() {
  const rand = mulberry32(20261014);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const now = new Date('2026-09-01T08:00:00Z').getTime();
  const ts = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();

  const db = { users: [], teachers: [], classes: [], students: [], courses: [], studentCourses: [], seq: {} };
  const nextId = (table) => (db.seq[table] = (db.seq[table] || 0) + 1);

  db.users.push({ id: nextId('users'), username: 'admin', password: 'admin123', role: 'admin', isActive: true, mustChangePassword: false, fullName: 'Quản trị hệ thống', createdAt: ts(400) });

  COURSES.forEach(([courseCode, name, credits]) => db.courses.push({ id: nextId('courses'), courseCode, name, credits }));

  TEACHERS.forEach(([code, fullName], i) => {
    const user = { id: nextId('users'), username: code.toLowerCase(), password: code.toLowerCase(), role: 'teacher', isActive: true, mustChangePassword: i === 5, createdAt: ts(380 - i * 10) };
    db.users.push(user);
    const parts = slug(fullName).split(' ');
    db.teachers.push({ id: nextId('teachers'), userId: user.id, teacherCode: code, fullName, email: `${parts.at(-1)}.${parts[0]}@school.edu.vn` });
  });

  // Môn "khoá luận" chỉ dành cho khoá cuối; còn lại xếp theo thứ tự học
  const ordered = [...db.courses].sort((a, b) => (a.courseCode === 'PR004') - (b.courseCode === 'PR004'));

  CLASSES.forEach(([classCode, name, tIdx, avgCredits, size]) => {
    const cls = { id: nextId('classes'), classCode, name, teacherId: tIdx === null ? null : db.teachers[tIdx].id };
    db.classes.push(cls);
    const year = Number(classCode.match(/K(\d+)/)[1]);
    for (let n = 0; n < size; n += 1) {
      const studentCode = `${year}52${String(cls.id).padStart(2, '0')}${String(n + 1).padStart(2, '0')}`;
      const fullName = `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;
      const user = { id: nextId('users'), username: studentCode, password: studentCode, role: 'student', isActive: rand() > 0.04, mustChangePassword: rand() > 0.7, createdAt: ts(360 - year * 3 - n) };
      db.users.push(user);
      const parts = slug(fullName).split(' ');
      const st = {
        id: nextId('students'), userId: user.id, studentCode, fullName,
        dateOfBirth: `${2000 + (year - 18)}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
        email: `${parts.at(-1)}${parts[0]}${n + 1}@student.edu.vn`, classId: cls.id,
      };
      db.students.push(st);

      // Học lần lượt các môn đến khi đạt số tín chỉ mục tiêu (dao động quanh trung bình của lớp)
      const target = Math.max(4, Math.min(160, Math.round(avgCredits + (rand() - 0.5) * 50)));
      let earned = 0;
      for (const c of ordered) {
        if (earned >= target) break;
        const fail = rand() < 0.1;
        const score = fail ? +(2 + rand() * 2.9).toFixed(1) : +(5 + rand() * 5).toFixed(1);
        db.studentCourses.push({ id: nextId('studentCourses'), studentId: st.id, courseId: c.id, score });
        if (!fail) earned += c.credits;
      }
    }
  });

  return db;
}
