# 🌿 Chiang Mai Wellness Route (itsci-learn)

ระบบแพลตฟอร์มเส้นทางการท่องเที่ยวเชิงสุขภาพ จังหวัดเชียงใหม่ (Wellness Tourism) รวบรวมข้อมูลสถานประกอบการ แผนที่นำทาง และบทความสุขภาพ พร้อมระบบจัดการสำหรับ Admin และ Wellness Provider

พัฒนาบนสถาปัตยกรรม 3 ชั้นแบบคอนเทนเนอร์ (Containerized 3-Tier Architecture) ตามมาตรฐานของ ITSCI:

| ชั้น | เทคโนโลยี | หน้าที่ |
| --- | --- | --- |
| **Frontend** | React 19 (Tailwind CSS v4, Leaflet Maps, Axios) | หน้าเว็บแบบ Single Page Application (SPA) ให้บริการผ่าน Nginx |
| **Backend** | Spring Boot 3 (Java 21, Spring Data JPA, BCrypt) | REST API ที่ `/api/...` พร้อมระบบจัดการสิทธิ์และส่งเมล |
| **Database** | PostgreSQL 17 + Adminer 4 | จัดเก็บข้อมูล 11 ตารางหลัก พร้อมเว็บแอดมินจัดการฐานข้อมูลที่ Port `:8088` |
| **Storage** | Local Docker Volume (`./uploads`) | จัดเก็บรูปภาพปก แกลเลอรี และเอกสารแนบแบบ Self-contained 100% |
| **Reverse Proxy** | Caddy 2 | รับ Request ที่ Port 80/443 แล้วกระจายต่อไปยัง Frontend, Backend พร้อม HTTPS อัตโนมัติ |

ทุกส่วนรันใน Docker ด้วยคำสั่งเดียว (`docker compose up -d`) และยังรองรับโหมดพัฒนา (Dev Mode) สำหรับรันและแก้ไขโค้ดบนเครื่องโดยตรงได้ทันที

---

## สารบัญ

1. [ภาพรวมสถาปัตยกรรมระบบ](#1-ภาพรวมสถาปัตยกรรมระบบ)
2. [สิ่งที่ต้องมี (Prerequisites)](#2-สิ่งที่ต้องมี-prerequisites)
3. [การตั้งค่าสภาพแวดล้อม (.env)](#3-การตั้งค่าสภาพแวดล้อม-env)
4. [แบบ A: รันทั้งระบบด้วย Docker Compose (แนะนำ)](#4-แบบ-a-รันทั้งระบบด้วย-docker-compose-แนะนำ)
5. [แบบ B: โหมดพัฒนา (Local Development Mode)](#5-แบบ-b-โหมดพัฒนา-local-development-mode)
6. [ทางเข้าใช้งานระบบและบัญชีทดสอบเริ่มต้น](#6-ทางเข้าใช้งานระบบและบัญชีทดสอบเริ่มต้น)
7. [โครงสร้างโฟลเดอร์ของโปรเจกต์](#7-โครงสร้างโฟลเดอร์ของโปรเจกต์)
8. [การ Deploy บนเซิร์ฟเวอร์ (เช่น 10.1.245.36)](#8-การ-deploy-บนเซิร์ฟเวอร์)

---

## 1. ภาพรวมสถาปัตยกรรมระบบ

```text
Browser ──► http://127.0.0.1  หรือ  https://127.0.0.1 (หรือ IP เซิร์ฟเวอร์)
              │
              ▼
           caddy  (port 80 / 443)
              ├── /api/*         ──► api (Spring Boot :8080) ──► db (PostgreSQL :5432)
              ├── /uploads/*     ──► api (Spring Boot :8080) ──► ./uploads (Host Volume)
              └── อื่น ๆ ทั้งหมด  ──► web (React SPA / Nginx :3000)

Database Manager:
Browser ──► http://127.0.0.1:8088 ──► adminer (Port :8088) ──► db (PostgreSQL :5432)
```

- มีเพียง `caddy` และ `adminer` ที่เปิด Port ออกภายนอก ส่วน `web`, `api`, `db` สื่อสารกันในเครือข่ายภายในของ Docker
- หน้าเว็บ React เรียก API ด้วย Relative Path `/api/...` ผ่าน Caddy ทำให้หมดปัญหาเรื่อง CORS ข้าม Port หรือโดเมน 100%
- ฐานข้อมูล PostgreSQL ถูก Seed ข้อมูลเริ่มต้น 11 ตาราง (อำเภอ, หมวดหมู่, เส้นทางท่องเที่ยว, สถานประกอบการ) โดยอัตโนมัติจาก `database/init.sql`
- รหัสผ่านได้รับการป้องกันด้วย **BCrypt Hashing** พร้อมระบบ **Transparent Re-hashing** (รองรับบัญชีเดิมที่เป็น Plaintext และจะแปลงเป็น BCrypt ให้อัตโนมัติเมื่อล็อกอินสำเร็จ)

---

## 2. สิ่งที่ต้องมี (Prerequisites)

- **Docker Desktop** (พร้อมเปิดใช้งาน WSL 2 บน Windows 10/11)
- หากต้องการรันโหมดพัฒนาบนเครื่องโดยตรง (แบบ B):
  - **Node.js**: Version 18.x หรือ 20.x ขึ้นไป
  - **Java**: JDK 21 ขึ้นไป

---

## 3. การตั้งค่าสภาพแวดล้อม (`.env`)

ก่อนเริ่มใช้งาน ให้คัดลอกไฟล์ `.env.example` เป็น `.env`:

```powershell
Copy-Item .env.example .env
```

ตรวจสอบหรือแก้ไขค่าใน `.env`:
```env
# ตั้งค่าโดเมนหรือ IP (เช่น localhost หรือ 10.1.245.36)
SITE_ADDRESS=localhost

# ฐานข้อมูล PostgreSQL
POSTGRES_DB=wellness
POSTGRES_USER=wellness_user
POSTGRES_PASSWORD=wellness_pass_secret

# การส่งอีเมล Gmail SMTP (Optional: หากไม่ใส่ รหัสผ่านจะแสดงใน Server Console แทน)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

---

## 4. แบบ A: รันทั้งระบบด้วย Docker Compose (แนะนำ)

สั่งสร้าง Container และรันทุก Service:

```powershell
docker compose up -d --build
```

ตรวจสอบสถานะการทำงาน:
```powershell
docker compose ps
```

ดู Log การทำงานของ Backend:
```powershell
docker compose logs -f api
```

หยุดการทำงานของระบบ:
```powershell
docker compose down
```

---

## 5. แบบ B: โหมดพัฒนา (Local Development Mode)

โหมดนี้เหมาะสำหรับแก้ไขโค้ด Backend หรือ Frontend แล้วเห็นผลทันที โดยรันเฉพาะ Database และ Adminer บน Docker:

1. **เปิด Database และ Adminer บน Docker:**
   ```powershell
   docker compose -f compose.yaml -f compose.dev.yaml up -d db adminer
   ```

2. **รัน Backend (Spring Boot):**
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
   > Backend จะรันที่ `http://localhost:8080`

3. **รัน Frontend (React):**
   เปิด Terminal ใหม่:
   ```powershell
   cd frontend
   npm install --legacy-peer-deps
   npm start
   ```
   > Frontend จะเปิดขึ้นมาที่ `http://localhost:3000` พร้อมระบบ Proxy ไปยัง Port 8080 อัตโนมัติ

---

## 6. ทางเข้าใช้งานระบบและบัญชีทดสอบเริ่มต้น

| ระบบ / ผู้ใช้งาน | URL | ข้อมูลเข้าสู่ระบบเริ่มต้น |
| :--- | :--- | :--- |
| **ผู้ใช้ทั่วไป / นักท่องเที่ยว** | `http://localhost` หรือ `https://localhost` | ไม่ต้องเข้าสู่ระบบ สามารถค้นหา ดูเส้นทาง และอ่านบทความได้ทันที |
| **ผู้ดูแลระบบ (Admin Backoffice)** | `http://localhost/login` | **Username:** `admin01`<br>**Password:** `pw123456` |
| **ผู้ประกอบการ (Wellness Provider)** | `http://localhost/provider/login` | **Username:** `WH_94`<br>**Password:** `Vx2#gSY4` |
| **จัดการฐานข้อมูล (Adminer)** | `http://localhost:8088` | **System:** PostgreSQL<br>**Server:** `db`<br>**Username:** ค่าใน `.env` (`wellness_user`)<br>**Password:** ค่าใน `.env` (`wellness_pass_secret`)<br>**Database:** `wellness` |

---

## 7. โครงสร้างโฟลเดอร์ของโปรเจกต์

```text
itsci-learn/
├── backend/
│   ├── src/main/java/com/example/wellness/
│   │   ├── config/             # Caddy CORS, PasswordEncoder, DatabaseSequenceInitializer
│   │   ├── controller/         # REST Controllers (Admin, Hubs, Routes, Articles, Requests, Dashboard)
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── model/              # JPA Entities (WellnessHub, MainRoute, EmergencyService, Admin, etc.)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   └── service/            # Business Logic, BCrypt Upgrade, Local Storage, Safe Email Fallback
│   ├── src/main/resources/
│   │   └── application.properties # Datasource & Environment configurations
│   ├── Dockerfile              # Multi-stage Docker build สำหรับ Java 21
│   └── pom.xml                 # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── assets/             # หมุดแผนที่และสัญลักษณ์
│   │   ├── Components/         # Navbar, Footer, AdminSidebar, SessionTimeout
│   │   ├── pages/              # 16+ หน้าจอ (Home, Routes, Dashboard, ApproveRequests, etc.)
│   │   └── App.js              # React Router และ Relative API Gateway
│   ├── nginx.conf              # Nginx configuration สำหรับ Client-side SPA Routing
│   ├── Dockerfile              # Multi-stage Node 22 + Nginx alpine build
│   └── package.json
├── database/
│   └── init.sql                # สคริปต์ DDL และ Seed Data อัตโนมัติ 11 ตาราง
├── uploads/                    # โฟลเดอร์เก็บรูปภาพในเครื่อง (Host Volume ผูกกับ /app/uploads)
│   ├── logo/                   # โลโก้หน่วยงาน
│   └── routes/                 # ภาพประกอบเส้นทางท่องเที่ยว
├── caddy/
│   └── Caddyfile               # การตั้งค่า Reverse Proxy และ HTTPS อัตโนมัติ
├── compose.yaml                # Docker Compose หลักสำหรับทั้งระบบ
├── compose.dev.yaml            # Docker Compose override สำหรับโหมดพัฒนา
├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
└── README.md
```

---

## 8. การ Deploy บนเซิร์ฟเวอร์

สำหรับการ Deploy บนเซิร์ฟเวอร์ (เช่น เครื่อง `10.1.245.36`):

1. **Clone โปรเจกต์ลงบนเซิร์ฟเวอร์:**
   ```bash
   git clone <repo-url> itsci-learn
   cd itsci-learn
   ```

2. **ตั้งค่าไฟล์ `.env`:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   เปลี่ยน `SITE_ADDRESS=10.1.245.36` และเปลี่ยนรหัสผ่านฐานข้อมูลให้ปลอดภัย

3. **สั่งรันระบบ:**
   ```bash
   docker compose up -d --build
   ```

ระบบ Caddy จะสร้างใบรับรอง HTTPS ภายในเครือข่ายให้อัตโนมัติ สามารถเข้าใช้งานได้ทันทีที่ `https://10.1.245.36` ครับ
