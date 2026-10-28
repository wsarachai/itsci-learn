<?php
// ไม่ส่ง error report: extension ใน browser (เช่น MetaMask) ทำให้เกิด JS error
// แล้ว request error-report ที่ยิงขนานกันจะเปลี่ยน session id ระหว่าง login -> "Failed to set session cookie"
$cfg['SendErrorReports'] = 'never';
