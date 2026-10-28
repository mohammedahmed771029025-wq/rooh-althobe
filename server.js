const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// إعدادات البريد - يدعم Resend API (الأكثر ضماناً على Render) / Brevo SMTP / Gmail محلياً
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const USE_RESEND = !!RESEND_API_KEY;
const USE_BREVO = !USE_RESEND && !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY);
const EMAIL_USER = process.env.EMAIL_USER || process.env.BREVO_SMTP_USER || 'shirtclothes5@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.BREVO_SMTP_KEY || 'riwuoadcclkgctrc';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shirtclothes5@gmail.com';
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = process.env.SENDER_NAME || 'روح الثوب للخياطة الفاخرة';

// حفظ الطلب محلياً في ملف JSON لضمان عدم ضياع أي طلب إطلاقاً
function saveOrderLocally(orderData) {
  try {
    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
      try {
        const fileContent = fs.readFileSync(ORDERS_FILE, 'utf8');
        orders = JSON.parse(fileContent || '[]');
      } catch (e) {
        orders = [];
      }
    }
    const orderRecord = {
      id: 'ORD-' + Date.now(),
      created_at: new Date().toLocaleString('ar-SA'),
      status: 'pending',
      ...orderData
    };
    orders.unshift(orderRecord);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return orderRecord;
  } catch (err) {
    console.error('⚠️ تحذير: تعذر حفظ الطلب محلياً:', err.message);
    return null;
  }
}

// تحديث حالة الطلب في ملف orders.json
function updateOrderStatus(orderId, status, errorInfo = null) {
  try {
    if (!orderId || !fs.existsSync(ORDERS_FILE)) return;
    const fileContent = fs.readFileSync(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(fileContent || '[]');
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.status = status;
      if (errorInfo) target.email_error = errorInfo;
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    }
  } catch (err) {
    // تجاهل أخطاء التحديث الثانوية
  }
}

// إعداد خدمة البريد
let transporter = null;

async function sendEmail(options) {
  // أولوية 1: Resend API
  if (USE_RESEND && RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from || `${SENDER_NAME} <${SENDER_EMAIL}>`,
          to: Array.isArray(options.to) ? options.to : [options.to],
          reply_to: options.replyTo || options.reply_to,
          subject: options.subject,
          text: options.text,
          html: options.html
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Resend API error: ${response.status}`);
      }
      return { success: true, provider: 'resend', id: data.id };
    } catch (err) {
      console.error('⚠️ فشل الإرسال عبر Resend API:', err.message);
      throw err;
    }
  }

  // أولوية 2: Brevo SMTP
  if (USE_BREVO) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_KEY
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: true
        }
      });
    }
    const info = await transporter.sendMail(options);
    return { success: true, provider: 'brevo', info };
  }

  // أولوية 3: Gmail SMTP (محلياً فقط)
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }
  const info = await transporter.sendMail(options);
  return { success: true, provider: 'gmail', info };
}

// طباعة وضع البريد عند بدء التشغيل
if (USE_RESEND) {
  console.log(`📧 وضع البريد: Resend API (مُفعّل) | المرسل: ${SENDER_NAME} <${SENDER_EMAIL}>`);
} else if (USE_BREVO) {
  console.log('📧 وضع البريد: Brevo SMTP (مُفعّل)');
} else {
  console.log('📧 وضع البريد: Gmail SMTP (محلياً)');
}

// التحقق من صحة الاتصال بالبريد عند بدء التشغيل
if (USE_BREVO && !USE_RESEND) {
  transporter = transporter || nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
  transporter.verify((error) => {
    if (error) {
      console.error('❌ تنبيه: خطأ في الاتصال بخدمة البريد:', error.message);
    } else {
      console.log('✅ تم الاتصال بخدمة البريد بنجاح! جاهز لاستقبال الطلبات.');
    }
  });
} else if (!USE_RESEND && !USE_BREVO) {
  transporter = transporter || nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
  transporter.verify((error) => {
    if (error) {
      console.error('❌ تنبيه: خطأ في الاتصال بخدمة البريد:', error.message);
    } else {
      console.log('✅ تم الاتصال بخدمة البريد بنجاح! جاهز لاستقبال الطلبات.');
    }
  });
} else {
  console.log('✅ وضع Resend API جاهز، لن يتم التحقق من SMTP بشكل مباشر.');
}

// أنواع الملفات المدعومة
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers لتشغيل الطلبات سواء فُتح الموقع من localhost أو كملف محلي
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // نقطة فحص عمل السيرفر (Health Check)
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString() }));
    return;
  }

  // معالجة إرسال الطلب عبر POST
  if (req.method === 'POST' && req.url === '/api/order') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const order = JSON.parse(body || '{}');

        // التحقق من الحقول الأساسية
        if (!order.customer_name || !order.customer_phone) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يرجى إدخال اسم العميل ورقم الجوال' }));
          return;
        }

        // 1. حفظ الطلب محلياً فوراً لحمايته من أي ضياع
        const savedOrder = saveOrderLocally(order);
        const orderId = savedOrder ? savedOrder.id : 'ORD-' + Date.now();
        console.log(`📥 تم تسجيل وحفظ الطلب بنجاح برقم: [${orderId}] للعميل: ${order.customer_name}`);

        const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0D0D12; color: #F0EDE6; padding: 20px; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; background: #181824; border: 1px solid #D4AF37; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            .header { background: linear-gradient(135deg, #D4AF37, #F3E5AB); color: #0D0D12; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 25px; }
            .section-title { color: #E8CC6A; font-size: 16px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 8px; margin-top: 20px; margin-bottom: 15px; font-weight: bold; }
            .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .label { color: #A0A0B0; font-size: 14px; }
            .value { color: #FFFFFF; font-weight: 600; font-size: 15px; }
            .gold-value { color: #F3E5AB; font-weight: bold; }
            .notes-box { background: rgba(255,255,255,0.04); border-right: 3px solid #D4AF37; padding: 12px; margin-top: 10px; border-radius: 4px; font-size: 14px; color: #E0E0E0; }
            .footer { background: #0D0D12; padding: 15px; text-align: center; font-size: 12px; color: #707080; border-top: 1px solid rgba(255,255,255,0.05); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>روح الثوب للخياطة الفاخرة</h1>
              <p>طلب تفصيل جديد عبر الموقع الإلكتروني (رقم الطلب: ${orderId})</p>
            </div>
            <div class="content">
              <div class="section-title">بيانات العميل</div>
              <div class="item-row">
                <span class="label">اسم العميل:</span>
                <span class="value">${order.customer_name || 'غير محدد'}</span>
              </div>
              <div class="item-row">
                <span class="label">رقم الجوال (واتساب):</span>
                <span class="value" dir="ltr">${order.customer_phone || 'غير محدد'}</span>
              </div>
              <div class="item-row">
                <span class="label">البريد الإلكتروني:</span>
                <span class="value" dir="ltr">${order.customer_email || 'غير محدد'}</span>
              </div>

              <div class="section-title">تفاصيل الثوب المختار</div>
              <div class="item-row">
                <span class="label">نوع القماش:</span>
                <span class="gold-value">${order.fabric || 'غير محدد'}</span>
              </div>
              <div class="item-row">
                <span class="label">اللون المختار:</span>
                <span class="gold-value">${order.color || 'غير محدد'}</span>
              </div>
              <div class="item-row">
                <span class="label">المقاس:</span>
                <span class="gold-value">${order.size || 'غير محدد'}</span>
              </div>

              <div class="section-title">ملاحظات إضافية من العميل</div>
              <div class="notes-box">
                ${order.notes ? order.notes.replace(/\n/g, '<br>') : 'لا توجد ملاحظات إضافية'}
              </div>
            </div>
            <div class="footer">
              تم إرسال هذا الإشعار تلقائياً من نظام متجر روح الثوب في ${new Date().toLocaleString('ar-SA')}
            </div>
          </div>
        </body>
        </html>
        `;

        // تجهيز قالب بريد العميل التسويقي وتعزيز الثقة
        const customerMarketingHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0D0D12; color: #F0EDE6; padding: 20px 10px; margin: 0; direction: rtl; }
            .container { max-width: 620px; margin: 0 auto; background: #161622; border: 1px solid #D4AF37; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
            .header { background: linear-gradient(135deg, #181824 0%, #2A2634 50%, #181824 100%); border-bottom: 2px solid #D4AF37; padding: 35px 20px; text-align: center; }
            .badge { display: inline-block; padding: 5px 16px; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4); border-radius: 20px; color: #E8CC6A; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 26px; color: #F3E5AB; font-weight: 800; }
            .header p { margin: 8px 0 0; font-size: 14px; color: #C5C2CE; }
            .content { padding: 30px 25px; }
            .greeting { font-size: 18px; color: #FFFFFF; font-weight: bold; margin-bottom: 15px; }
            .greeting span { color: #E8CC6A; }
            .welcome-msg { font-size: 15px; line-height: 1.8; color: #E0DEE6; margin-bottom: 25px; }
            
            /* بطاقة الثقة والضمانات */
            .trust-card { background: rgba(212,175,55,0.04); border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 20px; margin-bottom: 25px; }
            .trust-title { color: #F3E5AB; font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 8px; }
            .trust-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; font-size: 14px; color: #D6D4DF; line-height: 1.6; }
            .trust-item:last-child { margin-bottom: 0; }
            .trust-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
            .trust-bold { color: #FFFFFF; font-weight: 600; }
            
            /* ملخص الطلب */
            .order-summary { background: #0D0D12; border-right: 4px solid #D4AF37; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .summary-title { color: #E8CC6A; font-size: 15px; font-weight: bold; margin-bottom: 12px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
            .summary-row:last-child { border-bottom: none; }
            .summary-lbl { color: #8F8FA0; }
            .summary-val { color: #FFFFFF; font-weight: 600; }
            .gold-highlight { color: #F3E5AB; font-weight: bold; }
            
            /* هدية تسويقية */
            .gift-box { background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.05)); border: 1px dashed #D4AF37; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 25px; }
            .gift-badge { font-size: 13px; color: #E8CC6A; font-weight: bold; margin-bottom: 6px; }
            .gift-title { font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px; }
            .gift-desc { font-size: 13px; color: #C5C2CE; margin-bottom: 12px; line-height: 1.5; }
            .promo-coupon { display: inline-block; background: #D4AF37; color: #0D0D12; font-weight: 900; font-size: 16px; padding: 8px 22px; border-radius: 6px; letter-spacing: 1.5px; box-shadow: 0 4px 15px rgba(212,175,55,0.3); }
            
            /* خدمة العملاء */
            .support-box { text-align: center; margin: 25px 0 10px; }
            .whatsapp-btn { display: inline-block; background: #25D366; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(37,211,102,0.3); }
            .support-note { font-size: 12px; color: #8F8FA0; margin-top: 10px; }
            
            .footer { background: #0D0D12; padding: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #707080; line-height: 1.8; }
            .footer-brand { color: #D4AF37; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">✨ خياطة رجالية فاخرة بلمسة أصيلة</div>
              <h1>روح الثوب للخياطة الفاخرة</h1>
              <p>شكراً لثقتكم واختياركم لنا لتفصيل ثوبكم المفضل</p>
            </div>
            
            <div class="content">
              <div class="greeting">أهلاً وسهلاً بك يا <span>${order.customer_name}</span>،</div>
              <p class="welcome-msg">
                يسعدنا ويشرفنا انضمامك إلى عائلة عملاء <strong>روح الثوب</strong>. نود إعلامك بأننا استلمنا تفاصيل طلبك بعناية تامة، وهو الآن قيد المراجعة والتحضير بأيدي أمهر خياطينا ليخرج بالصورة التي تليق بمقامك وأناقتك.
              </p>

              <!-- بطاقة الثقة والضمانات -->
              <div class="trust-card">
                <div class="trust-title">✦ لماذا نحن خيارك الموثوق دائماً؟</div>
                <div class="trust-item">
                  <span class="trust-icon">💎</span>
                  <div><span class="trust-bold">أقمشة فاخرة 100%:</span> نختار أقمشتنا بعناية فائقة من أعرق بيوت الأقمشة اليابانية والأوروبية لتضمن لك برودة وانسيابية ومظهراً فخماً طوال اليوم.</div>
                </div>
                <div class="trust-item">
                  <span class="trust-icon">✂️</span>
                  <div><span class="trust-bold">دقة الحياكة والتفصيل:</span> نخيط كل ثوب وفق مقاساتك بدقة متناهية مع عناية خاصة بأدق التفاصيل من الياقة إلى الأكمام.</div>
                </div>
                <div class="trust-item">
                  <span class="trust-icon">🛡️</span>
                  <div><span class="trust-bold">ضمان المقاس والرضا التام:</span> ثقتك وراحتك هي غايتنا؛ نضمن لك ثوباً مثالياً، وفريقنا مستعد لأي ضبط أو تعديل يرضيك.</div>
                </div>
                <div class="trust-item">
                  <span class="trust-icon">⏱️</span>
                  <div><span class="trust-bold">التزام بالمواعيد وجودة التغليف:</span> نعتني بتسليم ثوبك في الموعد المحدد مع تغليف راقٍ يحافظ على رونق الثوب.</div>
                </div>
              </div>

              <!-- تفاصيل الطلب -->
              <div class="order-summary">
                <div class="summary-title">تفاصيل ثوبك المختار:</div>
                <div class="summary-row">
                  <span class="summary-lbl">رقم الطلب:</span>
                  <span class="gold-highlight">${orderId}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-lbl">نوع القماش:</span>
                  <span class="summary-val">${order.fabric || 'غير محدد'}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-lbl">اللون المختار:</span>
                  <span class="summary-val">${order.color || 'غير محدد'}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-lbl">المقاس:</span>
                  <span class="gold-highlight">${order.size || 'غير محدد'}</span>
                </div>
                ${order.notes && order.notes !== 'لا توجد ملاحظات' ? `
                <div class="summary-row">
                  <span class="summary-lbl">ملاحظاتك:</span>
                  <span class="summary-val">${order.notes}</span>
                </div>` : ''}
              </div>

              <!-- هدية تسويقية لتعزيز الولاء -->
              <div class="gift-box">
                <div class="gift-badge">🎁 هدية ترحيبية خاصة بك</div>
                <div class="gift-title">خصم 10% على طلبك القادم</div>
                <div class="gift-desc">تقديراً لاختيارك لنا، يسعدنا أن نهديك كود خصم خاص يمكنك استخدامه في طلبك القادم أو إهدائه لأحد المقربين:</div>
                <div class="promo-coupon">ROOH10</div>
              </div>

              <!-- خدمة العملاء والواتساب -->
              <div class="support-box">
                <a href="https://wa.me/966500000000?text=${encodeURIComponent('مرحباً، أود الاستفسار بخصوص طلبي رقم: ' + orderId)}" target="_blank" class="whatsapp-btn">
                  💬 تواصل معنا مباشرة عبر واتساب
                </a>
                <div class="support-note">إذا كان لديك أي تعديل على المقاسات أو استفسار، فريقنا في خدمتك دائماً.</div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-brand">روح الثوب للخياطة الفاخرة</div>
              <div>أصالة الماضي وأناقة الحاضر</div>
              <div>إذا كان لديك أي استفسار، يمكنك الرد مباشرة على هذه الرسالة.</div>
            </div>
          </div>
        </body>
        </html>
        `;

        // خيارات بريد إدارة المتجر والعميل
        const fromAddress = USE_RESEND 
          ? `${SENDER_NAME} <${SENDER_EMAIL}>`
          : USE_BREVO 
            ? `${SENDER_NAME} <${process.env.BREVO_SENDER_EMAIL || SENDER_EMAIL}>`
            : `"روح الثوب" <${EMAIL_USER}>`;
        const replyAddress = order.customer_email || (USE_RESEND ? SENDER_EMAIL : EMAIL_USER);

        const adminMailOptions = {
          from: fromAddress,
          to: ADMIN_EMAIL,
          replyTo: replyAddress,
          subject: `🛒 طلب ثوب جديد [${orderId}] من العميل: ${order.customer_name || 'عميل روح الثوب'}`,
          text: `طلب جديد برقم: ${orderId}\nالعميل: ${order.customer_name}\nرقم الجوال: ${order.customer_phone}\nالقماش: ${order.fabric}\nاللون: ${order.color}\nالمقاس: ${order.size}\nالملاحظات: ${order.notes}`,
          html: htmlContent
        };

        // خيارات بريد العميل التسويقي
        const customerMailOptions = {
          from: fromAddress,
          to: order.customer_email,
          replyTo: (USE_RESEND ? SENDER_EMAIL : EMAIL_USER),
          subject: `✨ تم استلام طلبك بنجاح [${orderId}] | شكراً لاختيارك روح الثوب`,
          text: `أهلاً وسهلاً بك يا ${order.customer_name}\n\nنشكرك من القلب على اختيارك لمتجر روح الثوب للخياطة الفاخرة.\nتم استلام طلبك رقم [${orderId}] بنجاح وهو الآن قيد التجهيز.\n\nتفاصيل الطلب:\nالقماش: ${order.fabric}\nاللون: ${order.color}\nالمقاس: ${order.size}\n\nكود hية ترحيبية لطلبك القادم: ROOH10\n\nمع تحيات فريق روح الثوب للخياطة الفاخرة.`,
          html: customerMarketingHtml
        };

        // 2. الرد الفوري للعميل لمنع أي تأخير على الإطلاق (استجابة فورية خلال أجزاء من الثانية)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
          success: true, 
          orderId: orderId,
          message: 'تم استلام طلبك بنجاح وسيتواصل معك فريقنا قريباً!' 
        }));

        // 3. إرسال البريدين (للإدارة وللعميل) بالتسلسل في الخلفية لضمان عدم حدوث تضارب
        (async () => {
          let adminSent = false;
          let customerSent = false;

          // أولاً: إرسال بريد إدارة المتجر
          try {
            await sendEmail(adminMailOptions);
            adminSent = true;
            console.log(`📧 تم إرسال إشعار الطلب لإدارة المتجر: ${ADMIN_EMAIL} [${USE_RESEND ? 'Resend' : USE_BREVO ? 'Brevo' : 'Gmail'}]`);
          } catch (adminErr) {
            console.error(`⚠️ تعذر إرسال إيميل الإدارة:`, adminErr.message);
          }

          // فاصل زمني بسيط لتفادي أي تداخل
          await new Promise(r => setTimeout(r, 800));

          // ثانياً: إرسال بريد العميل التسويقي والتأكيدي
          const customerEmail = (order.customer_email || '').trim();
          if (customerEmail && customerEmail.includes('@')) {
            try {
              customerMailOptions.to = customerEmail;
              await sendEmail(customerMailOptions);
              customerSent = true;
              console.log(`💌 تم إرسال رسالة الشكر والتأكيد التسويقية لبريد العميل: ${customerEmail} [${USE_RESEND ? 'Resresend' : USE_BREVO ? 'Brevo' : 'Gmail'}]`);
            } catch (custErr) {
              console.error(`⚠️ تعذر إرسال إيميل العميل (${customerEmail}):`, custErr.message);
            }
          }

          updateOrderStatus(orderId, adminSent ? 'email_sent' : 'saved_locally', {
            adminEmail: adminSent,
            customerEmail: customerSent
          });
        })();

      } catch (err) {
        console.error('❌ خطأ في معالجة بيانات الطلب:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message || 'خطأ داخلي في الخادم' }));
      }
    });
    return;
  }

  // تقديم الملفات الثابتة (Static Files)
  let safePath = path.normalize(req.url.split('?')[0]);
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(__dirname, safePath);

  // حماية من الخروج من مجلد المشروع
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل الآن على: http://0.0.0.0:${PORT}`);
  console.log(`📁 مجلد الموقع: ${__dirname}`);
});
