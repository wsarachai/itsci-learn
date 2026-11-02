# 💻 Chiang Mai Wellness Route - Frontend Application

ส่วนประสานงานผู้ใช้ (Frontend Web Application) สำหรับระบบ **Chiang Mai Wellness Route** พัฒนาด้วย **React 19**, **Tailwind CSS v4**, **React Router v7** และ **Leaflet Map**

---

## 🛠️ เทคโนโลยีและเทคโนโลยีหลัก (Tech Stack & Dependencies)

- **React 19**: Framework สำหรับสร้าง User Interface
- **React Router DOM v7**: จัดการ Routing และ Navigation
- **Leaflet & React Leaflet**: แสดงผลแผนที่แบบ Interactive
- **Leaflet Routing Machine**: คำนวณและแสดงเส้นทางการเดินทางบนแผนที่
- **Lucide React & FontAwesome**: ชุดไอคอนแสดงผล UI
- **Axios**: ส่ง HTTP Request ไปยัง Spring Boot Backend REST APIs
- **Tailwind CSS v4**: จัดสไตล์การแสดงผล UI ด้วย Utility-First CSS

---

## 🚀 คำสั่งสำหรับพัฒนาและสร้างโปรเจกต์ (Available Scripts)

ในไดเรกทอรี `frontend/chiang-mai-wellness` สามารถใช้คำสั่งดังต่อไปนี้:

### `npm start`
เริ่มทำงานในโหมดพัฒนา (Development mode)\
เปิดดูได้ที่ [http://localhost:3000](http://localhost:3000) บนบราวเซอร์

### `npm test`
รันคำสั่งทดสอบระบบ (Test runner)

### `npm run build`
คอมไพล์และ Build โปรเจกต์สำหรับสภาพแวดล้อมการใช้งานจริง (Production Build) ไปยังโฟลเดอร์ `build`

---

## 📁 โครงสร้างโฟลเดอร์ Source Code (`src/`)

```text
src/
├── Components/         # คอมโพเนนต์ที่ใช้ร่วมกัน เช่น Navbar, Footer, MapComponent
├── pages/              # หน้าเว็บแอปพลิเคชันแบ่งตามฟังก์ชัน
│   ├── HomePage/       # หน้าแรกและแนะนำเส้นทาง
│   ├── RouteList/      # รายการเส้นทางท่องเที่ยว
│   ├── RouteDetail/    # รายละเอียดเส้นทางและแผนที่นำทาง
│   ├── SearchResults/  # ค้นหาสถานประกอบการตามอำเภอ/หมวดหมู่
│   ├── ArticleList/    # รายการบทความสุขภาพ
│   ├── LoginAdmin/     # หน้าเข้าสู่ระบบ Admin
│   ├── Dashboard/      # หน้าแดชบอร์ดผู้ดูแลระบบ
│   └── ProviderDashboard/ # หน้าแดชบอร์ดผู้ให้บริการ
├── utils/              # ตัวแปรระบบ ค่ากำหนด API URL และ Helper Functions
├── App.js              # กำหนด Route สิทธิ์การเข้าถึง และการวาง Layout
└── index.js            # จุดเริ่มต้นของ React Application
```

---

## ⚙️ การเชื่อมต่อกับ Backend API

โดยค่าเริ่มต้น Frontend จะเชื่อมต่อ API ไปยัง Spring Boot Server ที่:
`http://localhost:8080/api`

หากต้องการเปลี่ยน URL สามารถปรับเปลี่ยนได้ในไฟล์ตั้งค่าคอนฟิกที่ `src/utils/` หรือในไฟล์ Configuration ของโปรเจกต์
