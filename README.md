# itsci-learn

Next.js (frontend) + Spring Boot (backend) + MySQL รันด้วย Docker Compose โดยมี Caddy เป็น reverse proxy + HTTPS

```
http://<SITE_ADDRESS>  และ  https://<SITE_ADDRESS>
  └─ caddy :80/:443  (tls internal)
       ├─ /phpmyadmin/* → phpmyadmin (phpMyAdmin 5.2) ──┐
       ├─ /api/*        → api  (Spring Boot 4.1, Java 25, :8080)
       │                    └─ db (MySQL 8.4, volume mysql-data) ←┘
       └─ /*            → web  (Next.js 16 standalone, :3000)
```

มีเพียง caddy ที่เปิด port ออกนอกเครื่อง (80, 443) ส่วน web / api / phpmyadmin / db อยู่ใน network ภายในของ Compose
เข้าได้ทั้ง `http://` และ `https://` (ไม่ redirect) ยกเว้น `/phpmyadmin` ที่บังคับไป `https://`

## phpMyAdmin

เข้าที่ `/phpmyadmin/` แล้ว login ด้วยบัญชี MySQL ใน `.env`: `MYSQL_USER` / `MYSQL_PASSWORD` สำหรับฐาน `MYSQL_DATABASE`
หรือ `root` / `MYSQL_ROOT_PASSWORD` เมื่อต้องจัดการทั้งเซิร์ฟเวอร์

phpMyAdmin ใช้ได้เฉพาะ `https://` (`http://.../phpmyadmin` จะ redirect ให้) เพราะ session ของ phpMyAdmin
ใช้ข้าม http/https บน host เดียวกันไม่ได้: browser ส่ง cookie ที่ตั้งผ่าน http มากับ request https ด้วย
ทำให้ขึ้น "Failed to set session cookie" หรือ "mismatch between HTTPS indicated on the server and client"
Caddy จะลบ cookie phpMyAdmin เก่าที่ตั้งผ่าน http ให้อัตโนมัติ

## รัน

```bash
cp .env.example .env        # แล้วแก้รหัสผ่านทุกตัว และ SITE_ADDRESS
docker compose up -d --build
docker compose ps           # ทุกตัวต้อง healthy
```

- `SITE_ADDRESS=localhost` สำหรับเครื่องตัวเอง, `SITE_ADDRESS=10.1.245.36` บนเซิร์ฟเวอร์ itsci-learn
- อัปเดตหลังแก้โค้ด: `git pull && docker compose up -d --build`

## ทดสอบ

```bash
curl -k https://localhost/api/health                    # {"status":"UP"}
curl -k https://localhost/api/notes                     # รายการโน้ต
curl -k -X POST https://localhost/api/notes \
  -H 'Content-Type: application/json' -d '{"text":"hello"}'
```

บน Windows ให้ส่งข้อความภาษาไทยจากไฟล์ UTF-8 (`--data-binary @note.json`) เพราะ argument ของ curl ไม่ได้เป็น UTF-8

## ใบรับรอง HTTPS

Caddy ใช้ CA ภายในของตัวเอง (`tls internal`) เพราะเป็น IP ในเครือข่ายมหาลัย browser จะเตือนจนกว่าจะติดตั้ง root cert ของ Caddy:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

แล้วนำ `caddy-root.crt` ไปติดตั้งเป็น Trusted Root Certification Authority บนเครื่องผู้ใช้
ห้ามลบ volume `caddy-data` (เก็บ CA ไว้ ถ้าลบจะได้ CA ใหม่และต้องติดตั้งใหม่ทุกเครื่อง)

ถ้าภายหลังมีโดเมน ให้ตั้ง `SITE_ADDRESS` เป็นชื่อโดเมนและเปลี่ยน `tls internal` ใน `caddy/Caddyfile` เป็นใบรับรองของมหาลัย

## Backup ฐานข้อมูล

```bash
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' \
  | gzip > backup-$(date +%F).sql.gz
```

## พัฒนาบนเครื่อง

- backend: `cd backend && ./mvnw spring-boot:run` (ต้องมี MySQL และตั้ง `SPRING_DATASOURCE_*`)
- frontend: `cd frontend && npm run dev`
