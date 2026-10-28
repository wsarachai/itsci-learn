# itsci-learn

เว็บแอปตัวอย่างแบบ 3 ชั้น สำหรับฝึกพัฒนาเว็บ:

| ชั้น | เทคโนโลยี | หน้าที่ |
| --- | --- | --- |
| Frontend | Next.js 16 (React, TypeScript, Tailwind CSS) | หน้าเว็บที่ผู้ใช้เห็น |
| Backend | Spring Boot 4.1 (Java 25, Maven) | REST API ที่ `/api/...` |
| Database | MySQL 8.4 + phpMyAdmin 5.2 | เก็บข้อมูล และหน้าเว็บจัดการฐานข้อมูล |
| Reverse proxy | Caddy 2 | รับ request ที่ port 80/443 แล้วส่งต่อไปยังแต่ละชั้น พร้อม HTTPS |

ทุกส่วนรันใน Docker ด้วยคำสั่งเดียว (`docker compose up`) และยังรัน frontend / backend บนเครื่องโดยตรงเพื่อแก้โค้ดแล้วเห็นผลทันทีได้ด้วย

คู่มือนี้เขียนสำหรับ **Windows 10 / 11** คำสั่งทั้งหมดพิมพ์ใน **PowerShell** (ยกเว้นที่ระบุไว้)

---

## สารบัญ

1. [ภาพรวมการทำงาน](#1-ภาพรวมการทำงาน)
2. [สิ่งที่ต้องมี](#2-สิ่งที่ต้องมี)
3. [ติดตั้งโปรแกรม](#3-ติดตั้งโปรแกรม)
4. [ดาวน์โหลดโปรเจกต์และตั้งค่า `.env`](#4-ดาวน์โหลดโปรเจกต์และตั้งค่า-env)
5. [แบบ A: รันทั้งระบบด้วย Docker](#5-แบบ-a-รันทั้งระบบด้วย-docker)
6. [แบบ B: โหมดพัฒนา (แก้โค้ดแล้วเห็นผลทันที)](#6-แบบ-b-โหมดพัฒนา-แก้โค้ดแล้วเห็นผลทันที)
7. [โครงสร้างโฟลเดอร์](#7-โครงสร้างโฟลเดอร์)
8. [งานที่ทำบ่อย](#8-งานที่ทำบ่อย)
9. [แก้ปัญหาที่พบบ่อย](#9-แก้ปัญหาที่พบบ่อย)
10. [สำหรับผู้ดูแลเซิร์ฟเวอร์](#10-สำหรับผู้ดูแลเซิร์ฟเวอร์)

---

## 1. ภาพรวมการทำงาน

```
Browser ──► http://127.0.0.1  หรือ  https://127.0.0.1
              │
              ▼
           caddy  (port 80 / 443)
              ├── /phpmyadmin/*  ──► phpmyadmin  ──┐
              ├── /api/*         ──► api (Spring Boot :8080) ──► db (MySQL :3306)
              └── อื่น ๆ ทั้งหมด  ──► web (Next.js :3000)        ▲
                                                             └── phpmyadmin
```

- มีเพียง `caddy` ที่เปิด port ออกนอกเครื่อง (80 และ 443) ส่วน `web`, `api`, `db`, `phpmyadmin` คุยกันใน network ภายในของ Docker
- หน้าเว็บ (Next.js) เรียก API ด้วย path `/api/...` เสมอ ไม่ต้องรู้ว่า backend อยู่ port ไหน
- ตัวอย่างในโปรเจกต์คือระบบ “โน้ต”: หน้าแรกแสดงรายการโน้ตและเพิ่มโน้ตใหม่ได้ ข้อมูลเก็บในตาราง `note` ของ MySQL

API ที่มีให้:

| Method | Path | ทำอะไร |
| --- | --- | --- |
| `GET` | `/api/health` | ตรวจว่า backend ทำงาน ตอบ `{"status":"UP"}` |
| `GET` | `/api/notes` | รายการโน้ตทั้งหมด (ใหม่สุดก่อน) |
| `POST` | `/api/notes` | เพิ่มโน้ต ส่ง JSON `{"text":"..."}` (ห้ามว่าง ยาวไม่เกิน 500 ตัวอักษร) |

---

## 2. สิ่งที่ต้องมี

- Windows 10 รุ่น 22H2 ขึ้นไป หรือ Windows 11 (64-bit)
- RAM อย่างน้อย 8 GB (แนะนำ 16 GB) และพื้นที่ว่างในดิสก์อย่างน้อย 20 GB
- เปิด **Virtualization** ใน BIOS แล้ว (Docker ต้องใช้)
  ตรวจได้ที่ Task Manager → แท็บ **Performance** → **CPU** → บรรทัด **Virtualization** ต้องเป็น **Enabled**
  ถ้าเป็น Disabled ให้เข้า BIOS แล้วเปิด Intel VT-x หรือ AMD-V / SVM (ชื่อเมนูต่างกันตามยี่ห้อเครื่อง)
- อินเทอร์เน็ต (ครั้งแรกต้องดาวน์โหลด Docker image และ library หลาย GB)

> **เปิด PowerShell อย่างไร:** กดปุ่ม Windows พิมพ์ `PowerShell` แล้วกด Enter
> ถ้าขั้นไหนบอกว่าต้องใช้ **สิทธิ์ผู้ดูแล (Administrator)** ให้คลิกขวาที่ PowerShell แล้วเลือก **Run as administrator**

---

## 3. ติดตั้งโปรแกรม

โปรแกรมที่ต้องใช้:

| โปรแกรม | รุ่น | ใช้ทำอะไร | จำเป็นสำหรับ |
| --- | --- | --- | --- |
| Git | ล่าสุด | ดาวน์โหลด / ส่งโค้ด | ทุกแบบ |
| Docker Desktop | ล่าสุด | รัน MySQL และทั้งระบบใน container | ทุกแบบ |
| Visual Studio Code | ล่าสุด | เขียนโค้ด | ทุกแบบ (แนะนำ) |
| Node.js | **22** LTS | รัน / build frontend | แบบ B |
| JDK (Eclipse Temurin) | **25** | รัน / build backend | แบบ B |

ไม่ต้องติดตั้ง Maven หรือ MySQL เอง เพราะโปรเจกต์มี Maven Wrapper (`mvnw.cmd`) และ MySQL รันใน Docker

### 3.1 ติดตั้งด้วย winget (วิธีที่ง่ายที่สุด)

`winget` มากับ Windows 10/11 อยู่แล้ว เปิด PowerShell แบบ **Administrator** แล้วรันทีละบรรทัด:

```powershell
winget install -e --id Git.Git
winget install -e --id Docker.DockerDesktop
winget install -e --id Microsoft.VisualStudioCode
winget install -e --id OpenJS.NodeJS.22
winget install -e --id EclipseAdoptium.Temurin.25.JDK
```

ถ้าถูกถามให้ยอมรับเงื่อนไข (`Do you agree to all the source agreements terms?`) ให้พิมพ์ `Y` แล้ว Enter

> ถ้าไม่มีคำสั่ง `winget` ให้ดาวน์โหลดตัวติดตั้งจากเว็บแทน:
> [Git](https://git-scm.com/download/win) ·
> [Docker Desktop](https://www.docker.com/products/docker-desktop/) ·
> [VS Code](https://code.visualstudio.com/) ·
> [Node.js 22 LTS](https://nodejs.org/en/download) ·
> [Temurin JDK 25](https://adoptium.net/temurin/releases/?version=25&os=windows)
> ตอนติดตั้ง Temurin ให้เลือก **Set JAVA_HOME variable** และ **Add to PATH** ด้วย

### 3.2 ตั้งค่า Docker Desktop (ครั้งแรก)

1. เปิด **Docker Desktop** จาก Start menu
2. ถ้ามีข้อความให้ติดตั้งหรืออัปเดต **WSL** ให้ทำตาม หรือรันใน PowerShell แบบ Administrator:
   ```powershell
   wsl --install
   ```
   แล้ว **restart เครื่อง**
3. เปิด Docker Desktop อีกครั้ง รอจนมุมล่างซ้ายขึ้น **Engine running** (สีเขียว)
4. ใน Settings → General ให้เลือก **Use the WSL 2 based engine** (ปกติเลือกไว้แล้ว)

ต้องเปิด Docker Desktop ทิ้งไว้ทุกครั้งที่ใช้งานโปรเจกต์นี้

### 3.3 ตรวจว่าติดตั้งครบ

**ปิด PowerShell แล้วเปิดใหม่** (เพื่อให้รู้จัก PATH ใหม่) แล้วรัน:

```powershell
git --version              # git version 2.x
docker --version           # Docker version 2x.x
docker compose version     # Docker Compose version v2.x หรือใหม่กว่า
node --version             # v22.x
npm --version              # 10.x หรือใหม่กว่า
java --version             # openjdk 25 ...
```

ถ้าคำสั่งไหนขึ้นว่า `is not recognized as the name of a cmdlet` แปลว่ายังติดตั้งไม่สำเร็จหรือยังไม่ได้เปิด PowerShell ใหม่

### 3.4 ส่วนขยาย VS Code ที่แนะนำ

เปิด VS Code → กด `Ctrl+Shift+X` แล้วค้นหาและติดตั้ง:

- **Extension Pack for Java** (Microsoft)
- **Spring Boot Extension Pack** (VMware / Broadcom)
- **ESLint** (Microsoft)
- **Tailwind CSS IntelliSense** (Tailwind Labs)
- **Docker** หรือ **Container Tools** (Microsoft)

---

## 4. ดาวน์โหลดโปรเจกต์และตั้งค่า `.env`

### 4.1 ตั้งชื่อผู้ใช้ Git (ทำครั้งเดียวต่อเครื่อง)

```powershell
git config --global user.name  "ชื่อ นามสกุล"
git config --global user.email "อีเมลของคุณ"
```

### 4.2 Clone โปรเจกต์

แนะนำให้เก็บโค้ดในโฟลเดอร์ที่ path **ไม่มีภาษาไทยและไม่มีช่องว่าง** เช่น `C:\dev`

```powershell
mkdir C:\dev -Force
cd C:\dev
git clone https://github.com/wsarachai/itsci-learn.git
cd itsci-learn
code .            # เปิดโปรเจกต์ใน VS Code (ไม่บังคับ)
```

### 4.3 สร้างไฟล์ `.env`

`.env` เก็บรหัสผ่านฐานข้อมูลและค่าตั้งค่าของเครื่องคุณ **ไม่ถูกส่งขึ้น Git** (อยู่ใน `.gitignore`) จึงต้องสร้างเองจากไฟล์ตัวอย่าง:

```powershell
Copy-Item .env.example .env
notepad .env
```

แก้ให้เป็นแบบนี้ (เปลี่ยนรหัสผ่านเป็นของคุณเอง ใช้ตัวอักษรภาษาอังกฤษและตัวเลขก็พอ) แล้วบันทึก:

```ini
SITE_ADDRESS=127.0.0.1
MYSQL_DATABASE=itsci_learn
MYSQL_USER=itsci
MYSQL_PASSWORD=dev-password-123
MYSQL_ROOT_PASSWORD=dev-root-123
```

- `SITE_ADDRESS=127.0.0.1` สำคัญ: **ให้ใช้ `127.0.0.1` ไม่ใช่ `localhost`** เพราะ browser แชร์ cookie ของ `localhost` กับทุกโปรเจกต์ในเครื่อง ทำให้ login phpMyAdmin ไม่ได้ (ดู[ข้อ 9](#9-แก้ปัญหาที่พบบ่อย))
- รหัสผ่านจะถูกใช้ **ตอนสร้างฐานข้อมูลครั้งแรกเท่านั้น** ถ้าเปลี่ยนภายหลังต้องลบฐานข้อมูลแล้วสร้างใหม่ (ดู[ข้อ 8.5](#85-ล้างฐานข้อมูลแล้วเริ่มใหม่))

---

## 5. แบบ A: รันทั้งระบบด้วย Docker

เหมาะสำหรับ: ลองใช้งานครั้งแรก, ทดสอบก่อนส่งงาน, หรือดูว่าระบบทำงานเหมือนบนเซิร์ฟเวอร์

### 5.1 เริ่มระบบ

ในโฟลเดอร์ `itsci-learn`:

```powershell
docker compose up -d --build
```

ครั้งแรกใช้เวลาหลายนาที (ดาวน์โหลด image และ build frontend / backend) ครั้งต่อไปจะเร็วขึ้นมาก

ดูสถานะ:

```powershell
docker compose ps
```

รอจนทุกบรรทัดขึ้น `Up` และ `db`, `api`, `web` ขึ้น `(healthy)` (backend ใช้เวลาประมาณ 30–60 วินาที)

### 5.2 เปิดใช้งาน

| สิ่งที่ต้องการ | URL |
| --- | --- |
| หน้าเว็บ | http://127.0.0.1 |
| API | http://127.0.0.1/api/health และ http://127.0.0.1/api/notes |
| phpMyAdmin | https://127.0.0.1/phpmyadmin/ |

- phpMyAdmin บังคับใช้ **https** เท่านั้น ครั้งแรก browser จะเตือน **Your connection is not private** เพราะใบรับรองออกโดย Caddy เอง (ไม่ใช่ของจริงบนอินเทอร์เน็ต) บนเครื่องตัวเองให้กด **Advanced** → **Proceed to 127.0.0.1 (unsafe)** ได้
  หรือติดตั้งใบรับรองของ Caddy ให้ browser เชื่อถือ (ดู[ข้อ 8.7](#87-ให้-browser-เชื่อถือ-https-ของ-caddy))
- login phpMyAdmin ด้วย `MYSQL_USER` / `MYSQL_PASSWORD` จาก `.env` (เห็นเฉพาะฐาน `itsci_learn`) หรือ `root` / `MYSQL_ROOT_PASSWORD` (เห็นทุกอย่าง)

### 5.3 หยุด / เริ่มใหม่

```powershell
docker compose stop          # หยุดทุก container (ข้อมูลยังอยู่)
docker compose start         # เริ่มต่อ
docker compose down          # ลบ container (ข้อมูลใน MySQL ยังอยู่ใน volume)
```

ถ้าแก้โค้ดแล้วอยากเห็นผลในแบบ A ต้อง build ใหม่: `docker compose up -d --build`
(ถ้าแก้บ่อย ให้ใช้แบบ B แทน)

---

## 6. แบบ B: โหมดพัฒนา (แก้โค้ดแล้วเห็นผลทันที)

เหมาะสำหรับ: เขียนโค้ดประจำวัน

ในแบบนี้ **MySQL และ phpMyAdmin รันใน Docker** ส่วน **backend และ frontend รันบน Windows โดยตรง**:

```
Browser ──► http://localhost:3000  (Next.js dev server, แก้โค้ดแล้วหน้าเว็บเปลี่ยนเอง)
               └── /api/* ──► http://localhost:8080  (Spring Boot บน Windows)
                                   └── 127.0.0.1:3306  (MySQL ใน Docker)
phpMyAdmin ──► http://127.0.0.1:8081
```

ต้องเปิด PowerShell **3 หน้าต่าง** (หรือ 3 terminal ใน VS Code: เมนู **Terminal → New Terminal**) ทุกหน้าต่างเริ่มที่โฟลเดอร์ `itsci-learn`

### 6.1 หน้าต่างที่ 1: ฐานข้อมูล

ถ้าเคยรันแบบ A ไว้ ให้หยุดส่วนที่ไม่ใช้ก่อน (เพื่อไม่ให้ port ชนกัน):

```powershell
docker compose stop caddy web api
```

แล้วเปิด MySQL + phpMyAdmin โดยเปิด port ให้ Windows เข้าถึงได้ (`compose.dev.yaml`):

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d db phpmyadmin
docker compose ps
```

รอจน `db` ขึ้น `(healthy)` แล้วลองเปิด phpMyAdmin ที่ http://127.0.0.1:8081

### 6.2 หน้าต่างที่ 2: Backend (Spring Boot)

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

- ครั้งแรก Maven Wrapper จะดาวน์โหลด Maven และ library ทั้งหมด (ใช้เวลาหลายนาที)
- backend อ่านชื่อฐานข้อมูล ผู้ใช้ และรหัสผ่านจาก `..\.env` ให้อัตโนมัติ ไม่ต้องตั้งค่าเพิ่ม
- พร้อมใช้เมื่อเห็นบรรทัด `Tomcat started on port 8080` และ `Started BackendApplication`
- ทดสอบ: เปิด http://localhost:8080/api/health ต้องได้ `{"status":"UP"}`
- หยุด: กด `Ctrl+C`
- **แก้โค้ด Java แล้วต้องหยุดและรันใหม่** (หรือรันจาก VS Code / IntelliJ ด้วยปุ่ม Run / Debug ที่ไฟล์ `BackendApplication.java`)

### 6.3 หน้าต่างที่ 3: Frontend (Next.js)

```powershell
cd frontend
npm install        # ครั้งแรก หรือเมื่อ package.json เปลี่ยน
npm run dev
```

- เปิด http://localhost:3000
- แก้ไฟล์ใน `frontend/src/app/` แล้วบันทึก หน้าเว็บจะเปลี่ยนเองทันที
- request ที่ขึ้นต้นด้วย `/api/` จะถูกส่งต่อไป `http://localhost:8080` ให้อัตโนมัติ (ตั้งไว้ใน `next.config.ts`)
- หยุด: กด `Ctrl+C`

### 6.4 เลิกงาน

กด `Ctrl+C` ในหน้าต่าง backend และ frontend แล้ว:

```powershell
docker compose stop
```

---

## 7. โครงสร้างโฟลเดอร์

```
itsci-learn/
├── backend/                         Spring Boot (Java)
│   ├── pom.xml                      รายการ library ของ Maven
│   ├── mvnw.cmd                     Maven Wrapper สำหรับ Windows
│   ├── Dockerfile                   วิธี build image ของ backend
│   └── src/main/
│       ├── java/th/ac/mju/itsci/learn/
│       │   ├── BackendApplication.java   จุดเริ่มโปรแกรม
│       │   ├── HealthController.java     GET /api/health
│       │   └── note/
│       │       ├── Note.java             Entity = ตาราง note
│       │       ├── NoteRepository.java   คำสั่ง query (Spring Data JPA)
│       │       └── NoteController.java   GET/POST /api/notes
│       └── resources/application.yml     ค่าตั้งค่า (DB, port)
├── frontend/                        Next.js (TypeScript)
│   ├── package.json                 รายการ library ของ npm
│   ├── next.config.ts               ค่าตั้งค่า Next.js (รวมการส่ง /api ไป backend ตอน dev)
│   ├── Dockerfile
│   └── src/app/
│       ├── layout.tsx               โครงหน้าเว็บทุกหน้า
│       ├── page.tsx                 หน้าแรก (/)
│       └── notes.tsx                component รายการโน้ต (เรียก /api/notes)
├── caddy/Caddyfile                  ตั้งค่า reverse proxy และ HTTPS
├── phpmyadmin/                      ตั้งค่าเพิ่มเติมของ phpMyAdmin
├── compose.yaml                     กำหนด container ทั้งหมด
├── compose.dev.yaml                 เปิด port DB / phpMyAdmin สำหรับโหมดพัฒนา (แบบ B)
├── .env.example                     ตัวอย่างไฟล์ .env
└── README.md                        ไฟล์นี้
```

---

## 8. งานที่ทำบ่อย

### 8.1 ทดสอบ API ด้วย PowerShell

ใช้ `Invoke-RestMethod` (ส่งภาษาไทยได้ถูกต้อง):

```powershell
# แบบ A ใช้ http://127.0.0.1   แบบ B ใช้ http://localhost:8080
$base = "http://127.0.0.1"

Invoke-RestMethod "$base/api/health"
Invoke-RestMethod "$base/api/notes"

$body = @{ text = "สวัสดี จาก PowerShell" } | ConvertTo-Json
Invoke-RestMethod "$base/api/notes" -Method Post -Body $body -ContentType "application/json; charset=utf-8"
```

> อย่าใช้ `curl.exe -d '{"text":"ภาษาไทย"}'` บน Windows เพราะข้อความภาษาไทยใน argument จะไม่ถูกส่งเป็น UTF-8 และ backend ตอบ `400 Bad Request`

### 8.2 เพิ่ม API ใหม่ (ตัวอย่าง)

สร้างไฟล์ `backend/src/main/java/th/ac/mju/itsci/learn/HelloController.java`:

```java
package th.ac.mju.itsci.learn;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

	@GetMapping("/api/hello")
	public Map<String, String> hello(@RequestParam(defaultValue = "world") String name) {
		return Map.of("message", "Hello, " + name);
	}

}
```

- path ของ API ต้องขึ้นต้นด้วย `/api/` เสมอ เพราะ Caddy ส่งเฉพาะ `/api/*` ไป backend
- รัน backend ใหม่ แล้วเปิด http://localhost:8080/api/hello?name=ITSCI

### 8.3 เพิ่มหน้าเว็บใหม่ (ตัวอย่าง)

สร้างไฟล์ `frontend/src/app/about/page.tsx`:

```tsx
export default function About() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">เกี่ยวกับเรา</h1>
    </main>
  );
}
```

เปิด http://localhost:3000/about (Next.js สร้าง URL ตามชื่อโฟลเดอร์ใน `src/app/`)

### 8.4 เพิ่มตารางใหม่ในฐานข้อมูล

สร้าง class ที่มี `@Entity` แบบเดียวกับ `note/Note.java` แล้วรัน backend ใหม่
ตอนนี้ตั้ง `spring.jpa.hibernate.ddl-auto: update` ไว้ Hibernate จึงสร้าง / เพิ่มคอลัมน์ให้อัตโนมัติ (แต่ **ไม่ลบ** คอลัมน์ที่เลิกใช้) ดูผลได้ใน phpMyAdmin

### 8.5 ล้างฐานข้อมูลแล้วเริ่มใหม่

> ⚠️ ข้อมูลทั้งหมดในฐานข้อมูลจะหายถาวร

```powershell
docker compose down -v
docker compose up -d --build     # หรือแบบ B: docker compose -f compose.yaml -f compose.dev.yaml up -d db phpmyadmin
```

`-v` ลบ volume `mysql-data` (ข้อมูล MySQL) และ `caddy-data` (ใบรับรอง HTTPS ของเครื่องคุณ) ใช้เมื่อเปลี่ยนรหัสผ่านใน `.env` หรือฐานข้อมูลพัง

### 8.6 ดู log เมื่อมีปัญหา

```powershell
docker compose logs -f api          # backend (กด Ctrl+C เพื่อออก)
docker compose logs -f web          # frontend
docker compose logs --tail 50 db    # MySQL 50 บรรทัดล่าสุด
docker compose logs -f caddy
```

### 8.7 ให้ browser เชื่อถือ HTTPS ของ Caddy

ไม่บังคับ ทำเพื่อไม่ให้ browser เตือนทุกครั้ง (หลังรันแบบ A อย่างน้อยหนึ่งครั้ง):

```powershell
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt .\caddy-root.crt
Import-Certificate -FilePath .\caddy-root.crt -CertStoreLocation Cert:\CurrentUser\Root
```

กด **Yes** ในหน้าต่างยืนยัน แล้วปิด / เปิด browser ใหม่ (ใบรับรองนี้ใช้ได้กับเครื่องคุณเท่านั้น ห้าม commit ไฟล์ `.crt`)

### 8.8 ส่งงานขึ้น Git

```powershell
git checkout -b feature/ชื่องาน     # แยก branch ต่องาน
git add .
git commit -m "อธิบายสิ่งที่ทำ"
git push -u origin feature/ชื่องาน
```

ก่อน commit ตรวจด้วย `git status` ว่าไม่มีไฟล์ `.env`, `node_modules`, `target` หลุดเข้าไป (ถูกกันไว้ใน `.gitignore` แล้ว)

---

## 9. แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `docker: error during connect` หรือ `Cannot connect to the Docker daemon` | ยังไม่ได้เปิด Docker Desktop หรือยังไม่ขึ้น **Engine running** ให้เปิดแล้วรอ |
| Docker Desktop แจ้ง `Virtualization support not detected` หรือ WSL error | เปิด Virtualization ใน BIOS ([ข้อ 2](#2-สิ่งที่ต้องมี)) แล้วรัน `wsl --update` ใน PowerShell แบบ Administrator |
| `Bind for 0.0.0.0:80 failed: port is already allocated` | มีโปรแกรมอื่นใช้ port 80/443 อยู่ (เช่น XAMPP, IIS, Skype รุ่นเก่า) ให้ปิดโปรแกรมนั้น ตรวจด้วย `Get-NetTCPConnection -LocalPort 80 -State Listen` แล้วดู `OwningProcess` ใน Task Manager แท็บ **Details** |
| port `3306` ใช้ไม่ได้ในแบบ B | มี MySQL / MariaDB / XAMPP ติดตั้งในเครื่องอยู่แล้ว ให้หยุด service นั้น (Services → MySQL → Stop) |
| port `8080` หรือ `3000` ถูกใช้ | ยังมี backend / frontend เก่ารันค้าง หรือยังไม่ได้ `docker compose stop caddy web api` |
| phpMyAdmin ขึ้น `Failed to set session cookie` | เข้าด้วย `localhost` แทน `127.0.0.1` ให้ตั้ง `SITE_ADDRESS=127.0.0.1` ใน `.env`, รัน `docker compose up -d` แล้วเข้าที่ https://127.0.0.1/phpmyadmin/ |
| phpMyAdmin ขึ้น `Access denied for user` | รหัสผ่านไม่ตรงกับตอนสร้างฐานข้อมูลครั้งแรก ตรวจ `.env` หรือล้างฐานข้อมูล ([ข้อ 8.5](#85-ล้างฐานข้อมูลแล้วเริ่มใหม่)) |
| backend ขึ้น `Access denied for user 'itsci'` หรือ `Communications link failure` | MySQL ยังไม่ขึ้น หรือไม่ได้รันด้วย `compose.dev.yaml` (port 3306 จึงไม่เปิด) ทำ[ข้อ 6.1](#61-หน้าต่างที่-1-ฐานข้อมูล) ใหม่ และต้องรัน backend จากในโฟลเดอร์ `backend` (เพื่อให้อ่าน `..\.env` ได้) |
| `.\mvnw.cmd` ขึ้น `JAVA_HOME not found` หรือ `release version 25 not supported` | ยังไม่ได้ติดตั้ง JDK 25 หรือ `java --version` ไม่ใช่ 25 ติดตั้ง Temurin 25 แล้วเปิด PowerShell ใหม่ |
| `npm` ขึ้น `running scripts is disabled on this system` | รันครั้งเดียว: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` แล้วตอบ `Y` |
| หน้าเว็บขึ้น `เรียก API ไม่ได้: HTTP 500` หรือ `502` | backend ยังไม่พร้อมหรือหยุดไปแล้ว ดู log ([ข้อ 8.6](#86-ดู-log-เมื่อมีปัญหา)) หรือหน้าต่าง backend ในแบบ B |
| POST ภาษาไทยได้ `400 Bad Request` | ใช้ `Invoke-RestMethod` ตาม[ข้อ 8.1](#81-ทดสอบ-api-ด้วย-powershell) แทน `curl` |
| แก้โค้ดแล้วแบบ A ไม่เปลี่ยน | ต้อง `docker compose up -d --build` ทุกครั้ง หรือใช้แบบ B |
| Docker กินดิสก์มาก | ลบ image / cache ที่ไม่ใช้: `docker system prune` (ไม่ลบ volume ข้อมูล) |

---

## 10. สำหรับผู้ดูแลเซิร์ฟเวอร์

เซิร์ฟเวอร์ `itsci-learn` (Ubuntu) รันแบบ A ที่ `/opt/itsci-learn` โดย `.env` ตั้ง `SITE_ADDRESS=10.1.245.36`

- เว็บเข้าได้ทั้ง `http://` และ `https://` (ไม่ redirect) ยกเว้น `/phpmyadmin` ที่บังคับไป `https://`
  เพราะ session ของ phpMyAdmin ใช้ข้าม http/https บน host เดียวกันไม่ได้ และไม่ควรส่งรหัส DB แบบไม่เข้ารหัส
- phpMyAdmin ปิดการส่ง error report (`phpmyadmin/config.user.inc.php`) เพราะ extension ใน browser (เช่น MetaMask) ทำให้ request error-report ไปเปลี่ยน session ระหว่าง login
- HTTPS ใช้ CA ภายในของ Caddy (`tls internal`) และ `default_sni` เพราะ Windows ไม่ส่ง SNI เมื่อเข้าด้วย IP **ห้ามลบ volume `caddy-data`** (ถ้าลบจะได้ CA ใหม่ ทุกเครื่องต้องติดตั้งใบรับรองใหม่)
- ห้ามใช้ `compose.dev.yaml` บนเซิร์ฟเวอร์

อัปเดตเซิร์ฟเวอร์หลัง push ขึ้น `main`:

```bash
ssh itsci-learn 'cd /opt/itsci-learn && git pull && docker compose up -d --build'
```

Backup ฐานข้อมูล (cron ทุกวัน 02:30 เก็บ 14 วันที่ `/srv/backup`) หรือสั่งเอง:

```bash
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' \
  | gzip > backup-$(date +%F).sql.gz
```
