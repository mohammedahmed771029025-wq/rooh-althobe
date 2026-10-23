/* === APP STATE === */
const state = {
  currentStep: 1,
  selectedFabric: null,
  selectedFabricName: null,
  selectedColor: null,
  selectedColorName: null,
  selectedSize: null,
  sizeMode: 'standard'
};

/* === FABRIC NAMES MAP === */
const fabricNames = {
  'japanese-cotton': 'قطن ياباني فاخر',
  'korean-silk': 'سلك كوري فاخر',
  'light-summer': 'قماش صيفي خفيف',
  'royal-wool': 'جوخ ملكي شتوي'
};

/* ============================================================
   NAVBAR
============================================================ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.opacity = '';
  spans[2].style.transform = '';
}

/* ============================================================
   GOLD PARTICLES
============================================================ */
function createParticles() {
  const container = document.getElementById('particles');
  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.6 + 0.1};
    `;
    container.appendChild(p);
  }
}

createParticles();

/* ============================================================
   REVEAL ON SCROLL
============================================================ */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

// Add reveal classes dynamically
function addRevealClasses() {
  const sections = [
    '.trust-item',
    '.fabric-card',
    '.color-card',
    '.testimonial-card',
    '.about-main-card',
    '.about-stat-card',
    '.footer-brand',
    '.footer-col'
  ];
  sections.forEach((selector, si) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      if (i > 0) el.classList.add(`reveal-delay-${Math.min(i, 3)}`);
    });
  });
}

addRevealClasses();
window.addEventListener('load', initReveal);

/* ============================================================
   EASTERN ARABIC NUMERALS & STATS COUNTER ANIMATION
============================================================ */
function toArabicDigits(num) {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, d => arabicDigits[d]);
}

function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const duration = 1800;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);

            el.textContent = toArabicDigits(current) + '+';

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = toArabicDigits(target) + '+';
            }
          }

          requestAnimationFrame(updateCounter);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) observer.observe(statsSection);
}

window.addEventListener('load', initCounters);

/* ============================================================
   HERO 3D PARALLAX TILT & CURSOR GLOW
============================================================ */
const heroVisual = document.getElementById('heroVisual');
const heroGlassCard = document.getElementById('heroGlassCard');

if (heroVisual && heroGlassCard && window.innerWidth > 900) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 12;
    const rotateY = (x / rect.width) * 12;

    heroGlassCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  heroVisual.addEventListener('mouseleave', () => {
    heroGlassCard.style.transform = '';
  });
}

const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && window.innerWidth > 800) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  });
}

/* === FABRIC TO REAL THOBE IMAGE MAP === */
const fabricImages = {
  'japanese-cotton': 'images/thobe-white.jpg',
  'korean-silk': 'images/thobe-cream.jpg',
  'light-summer': 'images/thobe-summer.jpg',
  'royal-wool': 'images/thobe-charcoal.jpg'
};

function changeHeroThobe(src, el) {
  const img = document.getElementById('heroThobeImg');
  if (img) {
    img.style.opacity = '0.3';
    img.style.transform = 'scale(0.96)';
    setTimeout(() => {
      img.src = src;
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 180);
  }
  if (el) {
    document.querySelectorAll('.fabric-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  }
}

/* ============================================================
   STEP 1 – FABRIC SELECTION
============================================================ */
document.querySelectorAll('.fabric-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.fabric-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.selectedFabric = card.dataset.fabric;
    state.selectedFabricName = fabricNames[card.dataset.fabric] || card.dataset.fabric;

    // Update hero showcase image to match selected thobe fabric
    if (fabricImages[card.dataset.fabric]) {
      changeHeroThobe(fabricImages[card.dataset.fabric]);
    }

    // Enable next button
    const nextBtn = document.getElementById('next-to-2');
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';

    updatePreview();
    pulseSelection(card);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

/* ============================================================
   STEP 2 – COLOR SELECTION
============================================================ */
document.querySelectorAll('.color-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.color-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.selectedColor = card.dataset.color;
    state.selectedColorName = card.dataset.colorName;

    const nextBtn = document.getElementById('next-to-3');
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';

    updatePreview();
    pulseSelection(card);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

/* ============================================================
   STEP 3 – SIZE SELECTION & PRESETS
============================================================ */
function selectSize(el) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedSize = el.dataset.size;
  updatePreview();
}

function switchSizeMode(mode) {
  state.sizeMode = mode;
  const standardPanel = document.getElementById('standard-sizes');
  const customPanel = document.getElementById('custom-sizes');
  const toggleStd = document.getElementById('toggle-standard');
  const toggleCustom = document.getElementById('toggle-custom');

  if (mode === 'standard') {
    standardPanel.classList.add('active');
    customPanel.classList.remove('active');
    toggleStd.classList.add('active');
    toggleCustom.classList.remove('active');
    state.selectedSize = null;
    updatePreview();
  } else {
    customPanel.classList.add('active');
    standardPanel.classList.remove('active');
    toggleCustom.classList.add('active');
    toggleStd.classList.remove('active');
    state.selectedSize = 'مقاسات مخصصة';
    updatePreview();
  }
}

function applyPresetSize(neck, height, shoulder, sleeve) {
  switchSizeMode('custom');

  const neckInput = document.getElementById('neck-size');
  const heightInput = document.getElementById('height-size');
  const shoulderInput = document.getElementById('shoulder-size');
  const sleeveInput = document.getElementById('sleeve-size');

  if (neckInput) neckInput.value = neck;
  if (heightInput) heightInput.value = height;
  if (shoulderInput) shoulderInput.value = shoulder;
  if (sleeveInput) sleeveInput.value = sleeve;

  [neckInput, heightInput, shoulderInput, sleeveInput].forEach(inp => {
    if (inp) {
      inp.style.borderColor = 'var(--gold-mid)';
      inp.style.background = 'rgba(184, 137, 27, 0.12)';
      setTimeout(() => {
        inp.style.borderColor = '';
        inp.style.background = '';
      }, 700);
    }
  });

  state.selectedSize = `رقبة ${neck}سم | طول ${height}سم | كتف ${shoulder}سم | أكمام ${sleeve}سم`;
  updatePreview();
}

// Listen to custom measurement inputs
['neck-size', 'height-size', 'shoulder-size', 'sleeve-size'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      state.selectedSize = 'مقاسات مخصصة';
      updatePreview();
    });
  }
});

/* ============================================================
   UPDATE SUMMARY PREVIEW
============================================================ */
function updatePreview() {
  document.getElementById('preview-fabric').textContent = state.selectedFabricName || 'لم يتم الاختيار';
  document.getElementById('preview-color').textContent = state.selectedColorName || 'لم يتم الاختيار';
  document.getElementById('preview-size').textContent = state.selectedSize || 'لم يتم الاختيار';

  let filledCount = 0;
  if (state.selectedFabric) filledCount++;
  if (state.selectedColor) filledCount++;
  if (state.selectedSize) filledCount++;

  const previewBadge = document.getElementById('previewBadge');
  if (previewBadge) {
    if (filledCount === 3) {
      previewBadge.textContent = 'جاهز لتأكيد الطلب ✓';
      previewBadge.classList.add('ready');
    } else if (filledCount === 2) {
      previewBadge.textContent = 'متبقي خطوة واحدة (٦٦٪)';
      previewBadge.classList.remove('ready');
    } else {
      previewBadge.textContent = 'قيد الاختيار (٣٣٪)';
      previewBadge.classList.remove('ready');
    }
  }
}

/* ============================================================
   INTERACTIVE STEP NAVIGATION (GoToStep)
============================================================ */
function goToStep(step) {
  if (step === state.currentStep) return;

  // Validation when going forward
  if (step > 1 && !state.selectedFabric) {
    pulseSelection(document.querySelector('.fabric-grid-main'));
    return;
  }
  if (step > 2 && !state.selectedColor) {
    pulseSelection(document.querySelector('.color-grid'));
    return;
  }

  // Toggle Panels
  document.querySelectorAll('.step-panel').forEach((p, idx) => {
    p.classList.toggle('active', idx + 1 === step);
  });

  // Toggle Indicators
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`step-indicator-${i}`);
    if (ind) {
      ind.classList.remove('active');
      if (i < step) ind.classList.add('done');
      else if (i === step) {
        ind.classList.add('active');
        ind.classList.remove('done');
      } else {
        ind.classList.remove('done');
      }
    }
  }

  // Toggle Lines
  const line12 = document.getElementById('line-1-2');
  const line23 = document.getElementById('line-2-3');
  if (line12) line12.classList.toggle('filled', step >= 2);
  if (line23) line23.classList.toggle('filled', step >= 3);

  // Update Status Meter Bar
  const meterFill = document.getElementById('statusMeterFill');
  const stepTitle = document.getElementById('statusStepTitle');
  const stepPercent = document.getElementById('statusPercent');

  const titles = [
    'الخطوة ١ من ٣: اختر نوع القماش المناسب لك',
    'الخطوة ٢ من ٣: حدد لون الثوب المفضل لديك',
    'الخطوة ٣ من ٣: أدخل مقاساتك بدقة للحصول على تفصيل مثالي'
  ];
  const percents = ['٣٣٪ مكتمل', '٦٦٪ مكتمل', '١٠٠٪ مكتمل'];
  const widths = ['33%', '66%', '100%'];

  if (meterFill) meterFill.style.width = widths[step - 1];
  if (stepTitle) stepTitle.textContent = titles[step - 1];
  if (stepPercent) stepPercent.textContent = percents[step - 1];

  state.currentStep = step;
  document.getElementById('builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nextStep(step) {
  goToStep(step);
}

function prevStep(step) {
  goToStep(step);
}

// Disable next buttons initially (handled by disabled attribute in HTML)
// But style them for the disabled state
document.querySelectorAll('.step-next[disabled]').forEach(btn => {
  btn.style.opacity = '0.5';
  btn.style.cursor = 'not-allowed';
});

/* ============================================================
   ORDER MODAL
============================================================ */
function openOrderModal() {
  // Populate modal summary
  document.getElementById('modal-fabric').textContent = state.selectedFabricName || '—';
  document.getElementById('modal-color').textContent = state.selectedColorName || '—';

  let sizeText = '—';
  if (state.sizeMode === 'custom') {
    const n = document.getElementById('neck-size') ? document.getElementById('neck-size').value : '';
    const h = document.getElementById('height-size') ? document.getElementById('height-size').value : '';
    const sh = document.getElementById('shoulder-size') ? document.getElementById('shoulder-size').value : '';
    const sl = document.getElementById('sleeve-size') ? document.getElementById('sleeve-size').value : '';
    sizeText = `رقبة ${n || '—'}سم | طول ${h || '—'}سم | كتف ${sh || '—'}سم | أكمام ${sl || '—'}سم`;
  } else {
    sizeText = state.selectedSize || '—';
  }
  document.getElementById('modal-size').textContent = sizeText;

  const overlay = document.getElementById('orderModal');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // إعادة تمرير القالب لأعلى لضمان رؤية البيانات كاملة على الجوال
  const modalCard = overlay.querySelector('.modal-card');
  if (modalCard) modalCard.scrollTop = 0;
}

function closeOrderModal() {
  const overlay = document.getElementById('orderModal');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.getElementById('orderModal').addEventListener('click', function(e) {
  if (e.target === this) closeOrderModal();
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOrderModal();
});

/* ============================================================
   FORM SUBMISSION (Direct Backend API -> Gmail)
============================================================ */
async function submitOrder(event) {
  if (event) event.preventDefault();
  const btn = document.getElementById('confirm-btn');
  if (!btn || btn.disabled) return;

  // مراجع حقول البيانات
  const nameEl = document.getElementById('full-name');
  const phoneEl = document.getElementById('phone-number');
  const emailEl = document.getElementById('email-address');
  const notesEl = document.getElementById('notes');

  const customerName = (nameEl ? nameEl.value : '').trim();
  let customerPhone = (phoneEl ? phoneEl.value : '').trim();
  const customerEmail = (emailEl ? emailEl.value : '').trim();
  const notes = notesEl ? notesEl.value.trim() : '';

  // تحويل الأرقام العربية المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية
  customerPhone = customerPhone.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
                               .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  // التحقق المباشر من الحقول مع إظهار رسائل واضحة للعميل على الجوال
  if (!customerName) {
    showToast('يرجى كتابة الاسم', 'الاسم مطلوب لإتمام الطلب وتأكيد الحجز', true);
    if (nameEl) nameEl.focus();
    return;
  }

  const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    showToast('رقم الجوال غير مكتمل', 'يرجى إدخال رقم جوال صحيح للتواصل معك عبر واتساب', true);
    if (phoneEl) phoneEl.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!customerEmail || !emailRegex.test(customerEmail)) {
    showToast('البريد الإلكتروني غير صحيح', 'يرجى إدخال بريد صالح لاستلام رسالة تأكيد الطلب', true);
    if (emailEl) emailEl.focus();
    return;
  }

  // Collect size info
  let sizeText = '—';
  if (state.sizeMode === 'custom') {
    const n = document.getElementById('neck-size') ? document.getElementById('neck-size').value : '';
    const h = document.getElementById('height-size') ? document.getElementById('height-size').value : '';
    const sh = document.getElementById('shoulder-size') ? document.getElementById('shoulder-size').value : '';
    const sl = document.getElementById('sleeve-size') ? document.getElementById('sleeve-size').value : '';
    sizeText = `رقبة ${n || '—'}سم | طول ${h || '—'}سم | كتف ${sh || '—'}سم | أكمام ${sl || '—'}سم`;
  } else {
    sizeText = state.selectedSize || '—';
  }

  // Build order payload
  const orderData = {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    fabric: state.selectedFabricName || '—',
    color: state.selectedColorName || '—',
    size: sizeText,
    notes: notes || 'لا توجد ملاحظات'
  };

  // Animate button
  const originalBtnHtml = `<span>تأكيد الطلب والإرسال</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>`;
  btn.innerHTML = `<span>جارٍ إرسال الطلب...</span> <div class="loader-dots"><span></span><span></span><span></span></div>`;
  btn.disabled = true;
  addLoaderStyle();

  // تنبيه العميل بلباقة في حال استغرق السيرفر السحابي بضع ثوانٍ للاستيقاظ
  const wakingNoticeTimer = setTimeout(() => {
    if (btn.disabled) {
      btn.innerHTML = `<span>جارٍ تأكيد الطلب مع السيرفر...</span> <div class="loader-dots"><span></span><span></span><span></span></div>`;
    }
  }, 7000);

  // تحديد رابط الـ API بذكاء (يعمل سواء فُتح الموقع من السيرفر أو بالنقر المباشر على الملف)
  const apiUrl = (window.location.origin && window.location.origin.startsWith('http'))
    ? '/api/order'
    : 'http://localhost:3000/api/order';

  const controller = new AbortController();
  // ضبط مهلة الانتظار إلى 60 ثانية كاملة لضمان استيعاب وقت استيقاظ السيرفر السحابي
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    clearTimeout(wakingNoticeTimer);

    const result = await response.json();

    if (response.ok && result.success) {
      closeOrderModal();
      document.body.style.overflow = '';
      btn.innerHTML = originalBtnHtml;
      btn.disabled = false;
      showToast(result.message || 'تم إرسال طلبك بنجاح!', 'سيتواصل معك فريقنا خلال ٢٤ ساعة');
      document.getElementById('orderForm').reset();
    } else {
      throw new Error(result.error || 'فشل في تسجيل الطلب');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    clearTimeout(wakingNoticeTimer);
    console.error('Order Submission Error:', error);

    let errorTitle = 'تعذر إرسال الطلب';
    let errorDetail = 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً';

    if (!navigator.onLine) {
      errorTitle = 'لا يوجد اتصال بالإنترنت';
      errorDetail = 'يرجى التحقق من اتصال الشبكة وإعادة المحاولة';
    } else if (error.name === 'AbortError') {
      errorTitle = 'استغرق الطلب وقتاً طويلاً';
      errorDetail = 'السيرفر يستغرق وقتاً للاستيقاظ، يرجى إعادة المحاولة الآن';
    } else if (error.message && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      errorTitle = 'السيرفر غير متصل';
      errorDetail = 'يرجى تشغيل السيرفر أولاً عبر النقر على run.bat';
    } else if (error.message) {
      errorDetail = error.message;
    }

    btn.innerHTML = `<span>${errorTitle}</span>`;
    showToast(errorTitle, errorDetail, true);
    btn.disabled = false;

    setTimeout(() => {
      btn.innerHTML = originalBtnHtml;
    }, 4000);
  }
}

function addLoaderStyle() {
  if (document.getElementById('loader-style')) return;
  const style = document.createElement('style');
  style.id = 'loader-style';
  style.textContent = `
    .loader-dots { display: flex; gap: 4px; align-items: center; }
    .loader-dots span {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(13,13,18,0.7);
      animation: dot-bounce 1.4s ease-in-out infinite;
    }
    .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes dot-bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.2); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function showToast(title = 'تم إرسال طلبك بنجاح!', subtitle = 'سيتواصل معك فريقنا خلال ٢٤ ساعة', isError = false) {
  const toast = document.getElementById('successToast');
  if (!toast) return;

  const iconEl = toast.querySelector('.toast-icon');
  const strongEl = toast.querySelector('.toast-text strong');
  const spanEl = toast.querySelector('.toast-text span');

  if (iconEl) iconEl.textContent = isError ? '✕' : '✓';
  if (strongEl) strongEl.textContent = title;
  if (spanEl) spanEl.textContent = subtitle;

  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

/* ============================================================
   PULSE ANIMATION ON SELECTION
============================================================ */
function pulseSelection(el) {
  el.style.transform = 'scale(1.02)';
  setTimeout(() => { el.style.transform = ''; }, 300);
}

/* ============================================================
   SMOOTH ACTIVE NAV LINK
============================================================ */
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.style.color = 'var(--gold-mid)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));

/* ============================================================
   HERO BUTTON INTERACTION
============================================================ */
const heroCta = document.getElementById('hero-cta');
if (heroCta) {
  heroCta.addEventListener('mouseenter', () => {
    heroCta.style.letterSpacing = '0.03em';
  });
  heroCta.addEventListener('mouseleave', () => {
    heroCta.style.letterSpacing = '';
  });
}

/* ============================================================
   FABRIC CARD FOCUS KEYBOARD NAV
============================================================ */
document.querySelectorAll('.fabric-card, .color-card').forEach(card => {
  card.setAttribute('tabindex', '0');
});

/* ============================================================
   NUMBER INPUT ARABIZE (Display Only)
============================================================ */
// Keep inputs as standard numbers but validate on blur
document.querySelectorAll('.measure-input').forEach(input => {
  input.addEventListener('blur', () => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      const min = parseFloat(input.min);
      const max = parseFloat(input.max);
      if (val < min) input.value = min;
      if (val > max) input.value = max;
    }
  });
});

/* ============================================================
   THOBE SVG COLOR PREVIEW
============================================================ */
const colorMap = {
  'off-white': '#FAF7F2',
  'bright-white': '#FFFFFF',
  'cream': '#FFFDD0',
  'soft-gold': '#F3E5AB',
  'charcoal': '#444444',
  'light-blue': '#B8D8F8'
};

document.querySelectorAll('.color-card').forEach(card => {
  card.addEventListener('click', () => {
    const color = colorMap[card.dataset.color];
    if (color) {
      const thobeGrad = document.getElementById('thobeGrad');
      if (thobeGrad) {
        thobeGrad.querySelectorAll('stop')[0].style.stopColor = color;
        thobeGrad.querySelectorAll('stop')[1].style.stopColor = shadeColor(color, -10);
      }
    }
  });
});

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

/* ============================================================
   INIT & MOBILE TOUCH HANDLING
============================================================ */
console.log('%c روح الثوب 🏆', 'color: #B8891B; font-size: 20px; font-weight: bold;');
console.log('%c أناقة تتجسد في تفاصيلك', 'color: #C69A2B; font-size: 14px;');

// ضمان استجابة زر تأكيد الطلب الفورية عند النقر أو اللمس على الجوال
const confirmButtonEl = document.getElementById('confirm-btn');
if (confirmButtonEl) {
  confirmButtonEl.addEventListener('click', (e) => {
    if (!confirmButtonEl.disabled) {
      submitOrder(e);
    }
  });
}
