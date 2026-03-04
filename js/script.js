const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6ETjfAWYxbujVjlKJZ4Sr0folBpyN6tm9cnDyE4Uk_GG4E9J4XRWu2VUzh0qRnHgUOg/exec";

const sheet = document.getElementById('sheet');
const box = sheet.querySelector('.box');
const btnBuy = document.getElementById('btnBuy');
const btnGift = document.getElementById('btnGift');
const toast = document.getElementById('toast');

function openSheet() {
    sheet.classList.add('open');
    // focus first input
    setTimeout(() => {
        const first = document.querySelector('#orderForm .in');
        if (first) first.focus();
    }, 50);
}
function closeSheet() {
    sheet.classList.remove('open');
}

btnBuy.addEventListener('click', openSheet);

btnGift.addEventListener('click', () => {
    const el = document.getElementById('gift');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Close sheet when tapping outside box
sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSheet();
});

// Basic phone validation for VN
function isValidPhone(p) {
    const s = (p || "").replace(/\s|\.|-/g, '');
    return /^(\+?84|0)\d{8,10}$/.test(s);
}

const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const address = (data.address || '').trim();
    const product = (data.product || '').trim();

    if (!name || !phone || !address) {
        alert("Vui lòng điền đủ Họ tên, SĐT và Địa chỉ.");
        return;
    }
    if (!isValidPhone(phone)) {
        alert("Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.");
        return;
    }

    // TODO: Gắn endpoint của bạn tại đây (Ladipage/Google Sheet/Zapier/CRM)
    // fetch('https://your-endpoint', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })
    const orderData = {
        name: name,
        phone: phone,
        address: address,
        product: product,
    };

    try {
        // Only attempt fetch if URL is configured (not the placeholder)
        if (
            GOOGLE_SCRIPT_URL &&
            !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")
        ) {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors", // Important for Google Apps Script
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });
        } else {
            console.log(
                "Mocking order submission. Configure GOOGLE_SCRIPT_URL to save real data.",
                orderData,
            );
            // Simulate network delay if no URL
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error("Error submitting order:", error);
        alert("Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.");
    }
    e.target.reset();
    closeSheet();

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
}

document.getElementById('orderForm').addEventListener('submit', (e) => handleSubmitOrder(e));

// Small UX: close sheet on ESC (desktop testing)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
});

function initCarousel(root, opts = {}) {
  const slides = root.querySelector('.slides');
  const prevBtn = root.querySelector('.nav.prev');
  const nextBtn = root.querySelector('.nav.next');
  const dots = Array.from(root.querySelectorAll('.dots .dot'));
  const total = opts.total ?? root.querySelectorAll('.slide').length;

  let idx = opts.startIndex ?? 0;

  const mod = (n, m) => ((n % m) + m) % m;

  function render() {
    slides.style.transform = `translateX(${-idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  prevBtn?.addEventListener('click', () => {
    idx = mod(idx - 1, total);
    render();
  });

  nextBtn?.addEventListener('click', () => {
    idx = mod(idx + 1, total);
    render();
  });

  dots.forEach((d, i) => d.addEventListener('click', () => {
    idx = i;
    render();
  }));

  // Swipe (chỉ trong phạm vi carousel này)
  let startX = 0, currentX = 0, dragging = false;

  function onStart(e) {
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    currentX = startX;
    slides.style.transition = 'none';
  }

  function onMove(e) {
    if (!dragging) return;
    currentX = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = currentX - startX;
    const pct = (dx / slides.clientWidth) * 100;
    slides.style.transform = `translateX(${(-idx * 100) + pct}%)`;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    slides.style.transition = 'transform .35s ease';

    const dx = currentX - startX;
    const threshold = slides.clientWidth * 0.18;

    if (dx > threshold) idx = mod(idx - 1, total);
    else if (dx < -threshold) idx = mod(idx + 1, total);

    render();
  }

  root.addEventListener('touchstart', onStart, { passive: true });
  root.addEventListener('touchmove', onMove, { passive: true });
  root.addEventListener('touchend', onEnd);

  // Desktop test (tuỳ chọn)
  if (opts.enableMouse) {
    root.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  }

  render();
  return { next: () => (idx = mod(idx + 1, total), render()), prev: () => (idx = mod(idx - 1, total), render()) };
}

// Init all carousels on page
document.querySelectorAll('.carousel').forEach((c) => {
  initCarousel(c, { enableMouse: true });
});

const closeSheetBtn = document.getElementById('closeSheetBtn');
closeSheetBtn.addEventListener('click', closeSheet);

let sheetStartY = 0;
let sheetCurrentY = 0;
let sheetDragging = false;

function sheetTouchStart(e){
  // chỉ kích hoạt khi chạm vào vùng header/handle để tránh ảnh hưởng nhập form
  const isHeader = e.target.closest('.sheet-head');
  if(!isHeader) return;

  sheetDragging = true;
  sheetStartY = e.touches[0].clientY;
  sheetCurrentY = sheetStartY;
  box.style.transition = 'none';
}

function sheetTouchMove(e){
  if(!sheetDragging) return;
  sheetCurrentY = e.touches[0].clientY;
  const dy = Math.max(0, sheetCurrentY - sheetStartY); // chỉ kéo xuống
  box.style.transform = `translateY(${dy}px)`;
}

function sheetTouchEnd(){
  if(!sheetDragging) return;
  sheetDragging = false;
  box.style.transition = 'transform .2s ease';

  const dy = Math.max(0, sheetCurrentY - sheetStartY);
  const closeThreshold = 120; // ngưỡng đóng

  if(dy > closeThreshold){
    box.style.transform = '';
    closeSheet();
  } else {
    box.style.transform = 'translateY(0)';
    setTimeout(() => (box.style.transform = ''), 220);
  }
}

box.addEventListener('touchstart', sheetTouchStart, {passive:true});
box.addEventListener('touchmove', sheetTouchMove, {passive:true});
box.addEventListener('touchend', sheetTouchEnd);