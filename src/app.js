// App logic extracted from the prior inline <script> in index.html.
// Behavior should remain identical.

export function bootstrapApp() {
    

  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// real current week (Monday → Sunday)
const now = new Date();
const currentDay = now.getDay(); // 0 = Sunday

const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setHours(0, 0, 0, 0);
monday.setDate(now.getDate() + mondayOffset);
    setInterval(() => {
    if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    const t = new Date();
    // Спрацьовує строго один раз на початку хвилини (на 00 секунді)
    if (t.getSeconds() === 0 && typeof alarmIn !== 'undefined' && alarmIn && alarmIn.value) {
      const [h, m] = alarmIn.value.split(":");
      if (parseInt(h,10) === t.getHours() && parseInt(m,10) === t.getMinutes()) {
        const k = h + ":" + m;
        if (typeof lastRingKey !== 'undefined' && lastRingKey !== k && Date.now() > (snoozeUntilMs || 0)) {
          const isModalOpen = document.getElementById("alarm-modal")?.classList.contains("open");
          if (!isModalOpen) {
            lastRingKey = k;
            
            // Відкриває виключно ваш внутрішній HTML-поп-ап сайту
            if (typeof openAlarmModal === "function") openAlarmModal(t);
          }
        }
      }
    }
    
       // Оновлення залишку часу на кнопці будильника з урахуванням snoozing
    if (typeof alarmTimeBtn !== 'undefined' && alarmTimeBtn && typeof alarmIn !== 'undefined' && alarmIn) {
      const val = alarmIn.value;
      
        // Перевіряємо, чи активний режим сну (відкладення) прямо зараз
      if (typeof snoozeUntilMs !== 'undefined' && snoozeUntilMs > Date.now()) {
        const snoozeDate = new Date(snoozeUntilMs);
        const snH = snoozeDate.getHours().toString().padStart(2, "0");
        const snM = snoozeDate.getMinutes().toString().padStart(2, "0");
        const snoozeTimeStr = `${snH}:${snM}`;

        const diffMs = snoozeUntilMs - t.getTime();
        const diffMin = Math.ceil(diffMs / 60000);
        const lh = Math.floor(diffMin / 60).toString().padStart(2, "0");
        const lm = (diffMin % 60).toString().padStart(2, "0");
        alarmTimeBtn.innerHTML = `${snoozeTimeStr} <span style="float:right; font-weight:bold; color:#ff0000;">(${lh}:${lm})</span>`;
      } else if (val) {
        // Якщо режим сну не активний, рахуємо час до стандартного будильника
        const [th, tm] = val.split(":").map(Number);
        let td = new Date(t); td.setHours(th, tm, 0, 0);
        if (td <= t) td.setDate(td.getDate() + 1);
        const diffMin = Math.ceil((td - t) / 60000);
        const lh = Math.floor(diffMin / 60).toString().padStart(2, "0");
        const lm = (diffMin % 60).toString().padStart(2, "0");
        alarmTimeBtn.innerHTML = `${val} <span style="float:right; font-weight:bold; color:#ff0000;">(${lh}:${lm})</span>`;
      } else {
        alarmTimeBtn.textContent = "--:--";
      }



    }
  }, 1000);



  const hdr = document.getElementById("hdr-row");
  const grid = document.getElementById("grid-main");
  const sidebar = document.getElementById("hours-sidebar");
  const scroller = document.querySelector(".scroller");

  // Побудова годин (0-23)
  let hoursHtml = "";
  for (let h = 0; h < 24; h++) {
    hoursHtml += `<div class="cell"><span class="h-label">${h}:00</span></div>`;
  }
  sidebar.innerHTML = hoursHtml;

  // Побудова днів
  const colsFrag = document.createDocumentFragment();
  let hdrHtml = `<div class="hdr-cell"></div>`;
  const dayCols = [];
  let hdrCells = [];
    days.forEach((day, i) => {
  const currentDate = new Date(monday);
  currentDate.setDate(monday.getDate() + i);
  const d = currentDate.getDate();
  hdrHtml += `<div class="hdr-cell" style="color: var(--day-color); font-size: var(--day-size); display: inline-flex; align-items: center; justify-content: center; gap: 6px;"><b>${d.toString().padStart(2, "0")}</b><span>${day}</span></div>`;


    const col = document.createElement("div");
    col.className = "day-column";
    let colHtml = "";
    for (let h = 0; h < 24; h++) colHtml += `<div class="cell"></div>`;
    col.innerHTML = colHtml;
    dayCols.push(col);
    colsFrag.appendChild(col);
  });
  hdr.innerHTML = hdrHtml;
  grid.appendChild(colsFrag);
  hdrCells = Array.from(hdr.querySelectorAll(".hdr-cell")).slice(1);
    // --- БЛОК КАЛЕНДАРЯ ТА МОДАЛЬНИХ ВІКОН ---
  let calendarNotes = JSON.parse(localStorage.getItem("calendar_notes") || "{}");

  const modalStyles = document.createElement('style');
 modalStyles.textContent = `
 .day-column.today-col .cell { background-color: var(--today-col-bg) !important; }
  /* Збільшення часу всередині самої клітинки таблиці */
.now-cell, [class*="now-cell"], [data-now] {
    font-size: 28px !important;
}
.now-cell::after, .now-cell::before, [data-now]::after, [data-now]::before {
    font-size: 28px !important;
    display: inline-block !important;
}
    .cal-modal { display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; font-family: sans-serif; }
    .cal-modal.open { display: flex; }
    .cal-modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 90%; max-width: 400px; color: #000; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
    
    .cal-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .cal-modal-title { margin: 0; font-size: 18px; font-weight: bold; }
    .cal-close { font-size: 24px; cursor: pointer; background: none; border: none; color: #666; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 10px; }
    .cal-btn { padding: 8px 4px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px; text-align: center; font-size: 12px; font-weight: bold; color: #000; }
    .cal-btn:hover { background: #f0f0f0; }
    .cal-btn.has-note { background: #ffeb3b !important; border-color: #fbc02d; }
    .month-btn.has-note { background: #fff59d !important; border: 1px solid #fbc02d !important; border-radius: 4px; }
     #day-modal .cal-modal-content { width: 100vw !important; height: 100vh !important; max-width: 100vw !important; max-height: 100vh !important; border-radius: 0 !important; display: flex !important; flex-direction: column !important; box-sizing: border-box !important; }
 .cal-textarea { width: 100%; flex: 1 !important; height: 72vh !important; margin-top: 10px; box-sizing: border-box; padding: 15px; font-size: 1.4rem; line-height: 1.5; resize: none; }
 .cal-save-btn { width: 100%; padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: auto !important; font-size: 1.2rem; font-weight: bold; }
  `;
  document.head.appendChild(modalStyles);

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = `
    <div id="month-modal" class="cal-modal"><div class="cal-modal-content"><div class="cal-modal-header"><h3 id="month-modal-title" class="cal-modal-title"></h3><button id="month-modal-close" class="cal-close">&times;</button></div><div id="days-container" class="cal-grid"></div></div></div>
    <div id="day-modal" class="cal-modal"><div class="cal-modal-content"><div class="cal-modal-header"><h3 id="day-modal-title" class="cal-modal-title"></h3><button id="day-modal-close" class="cal-close">&times;</button></div><textarea id="day-note-text" class="cal-textarea" placeholder="Введіть ваш текст тут..."></textarea><button id="day-note-save" class="cal-save-btn">Зберегти</button></div></div>
  `;
  document.body.appendChild(modalContainer);

  const monthModal = document.getElementById("month-modal");
  const dayModal = document.getElementById("day-modal");
  const monthModalTitle = document.getElementById("month-modal-title");
  const dayModalTitle = document.getElementById("day-modal-title");
  const daysContainer = document.getElementById("days-container");
  const dayNoteText = document.getElementById("day-note-text");
  const dayNoteSave = document.getElementById("day-note-save");

  let activeMonthIdx = null, activeDayNum = null;

  document.getElementById("month-modal-close").onclick = () => monthModal.classList.remove("open");
  document.getElementById("day-modal-close").onclick = () => dayModal.classList.remove("open");
  window.addEventListener('click', (e) => {
    if (e.target === monthModal) monthModal.classList.remove("open");
    if (e.target === dayModal) dayModal.classList.remove("open");
  });

  function updateMonthRowHighlights() {
    document.querySelectorAll(".month-btn").forEach((btn, idx) => {
      const hasNote = Object.keys(calendarNotes).some(
 key => key.startsWith(`${selectedYear}-${idx}-`)
);
      if (hasNote) btn.classList.add("has-note"); else btn.classList.remove("has-note");
    });
  }

  setTimeout(() => {
    const mRow = document.createElement("div");
    mRow.style = "width:100%;background:#ffffff;border-bottom:1px solid #ccc;padding:4px 0;margin-bottom:5px;box-sizing:border-box;color:#000000;display:block;";
    const currentYear = new Date().getFullYear();
let selectedYear = currentYear;

let innerHtml = `
<div style="display:flex;width:100%;box-sizing:border-box;position:relative;">

<button id="year-btn" style="
width:var(--hours-w, 60px);
border:none;
background:#ffffff;
cursor:pointer;
font-weight:bold;
font-size:16px;
color:#ff0000;
">
${selectedYear}
</button>
<div id="year-popup" style="
display:none;
position:absolute;
top:36px;
left:0;
background:#ffffff;
border:1px solid #ccc;
border-radius:6px;
padding:4px;
z-index:99999;
flex-direction:column;
gap:4px;
">

<button class="year-choice" data-year="${currentYear - 1}">
${currentYear - 1}
</button>

<button class="year-choice" data-year="${currentYear}">
${currentYear}
</button>

<button class="year-choice" data-year="${currentYear + 1}">
${currentYear + 1}
</button>

</div>
<div style="
display:flex;
justify-content:space-around;
flex:1;
box-sizing:border-box;
">
`;
    const monthsNames = ["Січ1","Лют2","Бер3","Кві4","Тра5","Чер6","Лип7","Сер8","Вер9","Жов10","Лис11","Гру12"];
    
    monthsNames.forEach((m, i) => {
      const isCurrent = i === (new Date()).getMonth();
      const txtStyle = isCurrent ? "font-weight:900;color:#ff0000;opacity:1;display:inline-flex;gap:2px;letter-spacing:-0.5px;" : "color:var(--day-color, #000000);opacity:1;font-weight:900;display:inline-flex;gap:2px;letter-spacing:-0.5px;";
      innerHtml += `<button class="month-btn" data-idx="${i}" style="${txtStyle}flex:1;text-align:center;font-size:var(--day-size, 16px);display:inline-block;background:none;border:none;cursor:pointer;padding:2px 0;">${m}</button>`;
    });
    innerHtml += `</div>`;
    mRow.innerHTML = innerHtml;
    
    hdr.parentNode.insertBefore(mRow, hdr);

        function updateWeekRowHighlights() {
      const hdrCells = Array.from(document.querySelectorAll("#hdr-row .hdr-cell")).slice(1);
      hdrCells.forEach((cell, i) => {
        const cellDate = new Date(monday);
        cellDate.setDate(monday.getDate() + i);
        const mIdx = cellDate.getMonth();
        const dNum = cellDate.getDate();
        
        if (calendarNotes[`${selectedYear}-${mIdx}-${dNum}`]) {
          cell.style.background = "#ffeb3b";
          cell.style.borderRadius = "4px";
        } else {
          cell.style.background = "none";
        }
      });
    }

    document.getElementById("year-btn").onclick = () => {

 const popup = document.getElementById("year-popup");

 popup.style.display =
 popup.style.display === "flex" ? "none" : "flex";

};

document.querySelectorAll(".year-choice").forEach(yBtn => {

 yBtn.onclick = () => {

 selectedYear = parseInt(yBtn.dataset.year, 10);

 document.getElementById("year-btn").textContent =
 selectedYear;

 document.getElementById("year-popup").style.display = "none";
   updateWeekRowHighlights();

 };

});

document.querySelectorAll(".month-btn").forEach(btn => {

 btn.addEventListener('click', (e) => {

 activeMonthIdx =
 parseInt(e.currentTarget.getAttribute("data-idx"), 10);

 const daysInMonth =
 new Date(selectedYear, activeMonthIdx + 1, 0).getDate();

 let firstDayOfWeek =
 new Date(selectedYear, activeMonthIdx, 1).getDay();

 let offset =
 firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

 monthModalTitle.textContent =
 `${monthsNames[activeMonthIdx]} ${selectedYear}`;

 let daysHtml = "";

 days.forEach(dName => {
 daysHtml += `<div class="cal-weekday">${dName}</div>`;
 });

 for (let o = 0; o < offset; o++) {
 daysHtml += `<div class="cal-empty"></div>`;
 }

 for (let d = 1; d <= daysInMonth; d++) {
const noteKey =
`${selectedYear}-${activeMonthIdx}-${d}`;
const hasNoteClass =
calendarNotes[noteKey] ? "has-note" : "";

// Перевірка, чи збігається дата кнопки з реальним сьогоднішнім днем
const todayCheck = new Date();
const isToday = selectedYear === todayCheck.getFullYear() && 
                activeMonthIdx === todayCheck.getMonth() && 
                d === todayCheck.getDate();
const todayStyle = isToday ? ' style="border: 2px solid #ff0000 !important;"' : '';

daysHtml +=
`<button class="cal-btn ${hasNoteClass}" data-day="${d}"${todayStyle}>${d}</button>`;
}


 daysContainer.innerHTML = daysHtml;

 monthModal.classList.add("open");

 document.querySelectorAll(".cal-btn").forEach(dayBtn => {

 dayBtn.addEventListener('click', (de) => {

 activeDayNum =
 parseInt(de.currentTarget.getAttribute("data-day"), 10);

 const noteKey =
 `${selectedYear}-${activeMonthIdx}-${activeDayNum}`;

 dayModalTitle.textContent =
 `${activeDayNum} ${monthsNames[activeMonthIdx]} ${selectedYear}`;

 dayNoteText.value =
 calendarNotes[noteKey] || "";

 dayModal.classList.add("open");

 });

 });

 });

});

dayNoteSave.onclick = () => {

 if (activeMonthIdx === null || activeDayNum === null)
 return;

 const noteKey =
 `${selectedYear}-${activeMonthIdx}-${activeDayNum}`;

 const textVal = dayNoteText.value.trim();

 if (textVal)
 calendarNotes[noteKey] = textVal;
 else
 delete calendarNotes[noteKey];

 localStorage.setItem(
 "calendar_notes",
 JSON.stringify(calendarNotes)
 );

 const dayBtn =
 daysContainer.querySelector(
 `.cal-btn[data-day="${activeDayNum}"]`
 );

 if (dayBtn) {

 if (textVal)
 dayBtn.classList.add("has-note");
 else
 dayBtn.classList.remove("has-note");

 }

 updateMonthRowHighlights();
 updateWeekRowHighlights();

 dayModal.classList.remove("open");

};
    updateMonthRowHighlights();
    updateWeekRowHighlights();
    if (typeof updateViewportAnchors === "function") updateViewportAnchors();
  }, 0);

  






             // ЄДИНЕ УНІВЕРСАЛЬНЕ КЕРУВАННЯ ВСІМА НАЛАШТУВАННЯМИ ГОДИННИКА ТА CANVAS
 document.querySelectorAll("input, select, textarea").forEach((inp) => {
   if (!inp.id || (!inp.id.startsWith('v-') && !inp.id.startsWith('alarm-'))) return;

   const applySetting = (id, value) => {
     const cssVarName = id.startsWith('v-') ? id.slice(2) : id;
     let finalValue = value;
     
     if (id === 'v-clk-size' && (!value || parseInt(value) < 100)) finalValue = "300px";
     if (id === 'v-time-fs' && (!value || !value.includes('rem'))) finalValue = "2rem";
     if (id === 'v-dig-fs' && (!value || !value.includes('rem'))) finalValue = "1rem";
     if (id === 'v-num-fs' && (!value || !value.includes('rem'))) finalValue = "1rem";

     let unit = "";
     if (inp.type === "range" && !finalValue.includes("px") && !finalValue.includes("rem") && !finalValue.startsWith("#")) {
       unit = id.includes("-fs") ? "rem" : "px";
     }

     document.documentElement.style.setProperty(`--${cssVarName}`, finalValue + unit);
     if (id === "v-table-bg") document.querySelectorAll(".day-column .cell, #hours-sidebar .cell").forEach(c => c.style.backgroundColor = finalValue);
     if (id === "v-clk-bg") { const face = document.getElementById("face"); if (face) face.style.backgroundColor = finalValue; }
     if (id === "v-today-col-bg") document.querySelectorAll(".day-column.today-col .cell").forEach(c => c.style.setProperty("background-color", finalValue, "important"));
     if (id === "v-num-fs" || id === "v-dig-fs") document.documentElement.style.setProperty(`--${cssVarName}`, finalValue + "rem");





   };

   inp.addEventListener("input", () => {
     localStorage.setItem(inp.id, inp.value);
     applySetting(inp.id, inp.value);
   });

   const saved = localStorage.getItem(inp.id);
   if (saved !== null) {
     if (inp.id === 'v-clk-size' && parseInt(saved) < 100) {
       localStorage.removeItem(inp.id);
     } else {
       inp.value = saved;
       applySetting(inp.id, saved);
     }
   }
   applySetting(inp.id, inp.value);
 });

 // АВТО-ЗВ'ЯЗОК ПОВЗУНКІВ З КАНВАСОМ (МАЛЮВАННЯМ СТРІЛОК)
 const canvasElement = document.querySelector("canvas");
 if (canvasElement) {
   const originalGetContext = canvasElement.getContext;
   canvasElement.getContext = function (type, ...args) {
     const ctx = originalGetContext.call(this, type, ...args);
     if (ctx && type === "2d" && !ctx._wrapped) {
       ctx._wrapped = true;

       // Перехоплюємо встановлення товщини ліній стрілок
       Object.defineProperty(ctx, 'lineWidth', {
         set: function (val) {
           let newVal = val;
           if (val === 10) newVal = parseFloat(document.getElementById("v-clk-brd-w")?.value) || 10;
           else if (val === 6) newVal = parseFloat(document.getElementById("v-h-hand")?.value) || 6;
           else if (val === 4) newVal = parseFloat(document.getElementById("v-m-hand")?.value) || 4;
           else if (val === 2) newVal = parseFloat(document.getElementById("v-s-hand")?.value) || 2;
           this._lineWidth = newVal;
         },
         get: function () { return this._lineWidth || 1; }
       });

       // Перехоплюємо кольори (цифр, фону, стрілок)
       Object.defineProperty(ctx, 'strokeStyle', {
         set: function (val) {
           let newVal = val;
           if (val === '#000000' || val === '#000' || val === 'black') {
             newVal = document.getElementById("v-num-c")?.value || val;
           }
           this._strokeStyle = newVal;
         },
         get: function () { return this._strokeStyle || '#000000'; }
       });
       
       Object.defineProperty(ctx, 'fillStyle', {
         set: function (val) {
           let newVal = val;
           if (val === '#000000' || val === '#000' || val === 'black') {
             newVal = document.getElementById("v-num-c")?.value || val;
           } else if (val === '#ffffff' || val === '#fff' || val === 'white') {
             newVal = document.getElementById("v-clk-bg")?.value || val;
           }
           this._fillStyle = newVal;
         },
         get: function () { return this._fillStyle || '#000000'; }
       });
     }
     return ctx;
   };
 }












  // Cache frequently used elements
  const timeline = document.getElementById("timeline");
  const sHand = document.getElementById("s-h");
  const mHand = document.getElementById("m-h");
  const hHand = document.getElementById("h-h");
  const vTime = document.getElementById("v-time");
  const alarmIn = document.getElementById("alarm-in");
  alarmIn.value = "";
localStorage.removeItem("alarm-in");
  const alarmSound = document.getElementById("alarm-sound");
  const alarmLen = document.getElementById("alarm-len");
  const alarmVol = document.getElementById("alarm-vol");
  const alarmSnooze = document.getElementById("alarm-snooze");
  const alarmModal = document.getElementById("alarm-modal");
  const alarmSub = document.getElementById("alarm-sub");
  const alarmStop = document.getElementById("alarm-stop");
  const alarmSnoozeBtn = document.getElementById("alarm-snooze-btn");
  const alarmTimeBtn = document.getElementById("alarm-time-btn");
  const alarmSection = document.getElementById("alarm-section");
  const panel = document.getElementById("panel");
  const alarmMarkerWrap = document.getElementById("alarm-marker-wrap");
    alarmTimeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = panel.classList.contains("open");
    if (isOpen) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    } else {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
    }
  });


  
  // Alarm hand customization defaults (CSS variables)
  const rootStyle = document.documentElement.style;

  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-hour-color")) {
    rootStyle.setProperty("--alarm-hour-color", "red");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-minute-color")) {
    rootStyle.setProperty("--alarm-minute-color", "#00ff4c");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-hour-width")) {
    rootStyle.setProperty("--alarm-hour-width", "4px");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-minute-width")) {
    rootStyle.setProperty("--alarm-minute-width", "3px");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-hour-height")) {
    rootStyle.setProperty("--alarm-hour-height", "110px");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--alarm-minute-height")) {
    rootStyle.setProperty("--alarm-minute-height", "160px");
  }

  if (!getComputedStyle(document.documentElement).getPropertyValue("--day-color")) {
    rootStyle.setProperty("--day-color", "black");
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue("--day-size")) {
    rootStyle.setProperty("--day-size", "16px");
  }



  // Alarm state
  let lastRingKey = "";
  let snoozeUntilMs = 0;
  let audioCtx = null;
  let stopAlarmFn = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function openAlarmModal(now) {
 if (!alarmModal) return;

 const hh = now.getHours().toString().padStart(2, "0");
 const mm = now.getMinutes().toString().padStart(2, "0");

 if (alarmSub) alarmSub.textContent = `Зараз ${hh}:${mm}`;

 alarmModal.classList.add("open");
 alarmModal.setAttribute("aria-hidden", "false");

 const face = document.getElementById("face");

 if (face) {
   document.documentElement.style.setProperty(
     "--h-blink-c1",
     localStorage.getItem("v-h-blink-c1-val") ||
     localStorage.getItem("fc1") ||
     "#ff0000"
   );

   document.documentElement.style.setProperty(
     "--h-blink-c2",
     localStorage.getItem("v-h-blink-c2-val") ||
     localStorage.getItem("fc2") ||
     "#000000"
   );

   document.documentElement.style.setProperty(
     "--h-blink-spd",
     (
       localStorage.getItem("v-h-blink-speed-val") ||
       localStorage.getItem("fspd") ||
       "0.5"
     ) + "s"
   );

   face.classList.add("clock-blink-active");
 }
}

  function closeAlarmModal() {
 if (!alarmModal) return;

 alarmModal.classList.remove("open");
 alarmModal.setAttribute("aria-hidden", "true");

 document.getElementById("face")
   ?.classList.remove("clock-blink-active");
}

  // Нативна ініціалізація аудіо-плеєра для файлу alarm.mp3 через пряме посилання Hugging Face
if (!window.globalAlarmAudio) {
 window.globalAlarmAudio = new Audio("https://huggingface.co/spaces/gchgch/clock/resolve/main/public/alarm.mp3");
 window.globalAlarmAudio.load();
 window.globalAlarmAudio.loop = true;
}
  // Додатковий блок для підтримки перемикача джерела звуку (Base64 / URL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const sourceModeElement = document.getElementById("audio-source-mode");
  // РЕМОНТ: Опція base64 тепер асинхронно дістає файл з вашої нової бази AlarmFileDB
 window.addEventListener('DOMContentLoaded', () => {
   if (window.globalAlarmAudio) {
     const origPlay = window.globalAlarmAudio.play;
     
     window.globalAlarmAudio.play = function(...args) {
       if (document.getElementById('audio-source-mode')?.value === 'base64') {
         const dbReq = indexedDB.open('AlarmFileDB', 1);
         dbReq.onsuccess = (e) => {
           const db = e.target.result;
           db.transaction('mp3_store').objectStore('mp3_store').get('track').onsuccess = (ev) => {
             const fileData = ev.target.result;
             if (fileData) {
               // Формуємо робоче посилання на mp3 з бази та запускаємо
               window.globalAlarmAudio.src = URL.createObjectURL(fileData);
               window.globalAlarmAudio.load();
             }
             origPlay.apply(window.globalAlarmAudio, args);
           };
         };
         return Promise.resolve();
       }
       return origPlay.apply(this, args);
     };
   }
 }); 
  const originalUrlSource = "https://huggingface.co/spaces/gchgch/clock/resolve/main/public/alarm.mp3";

  // Функція, яка дивиться на перемикач і міняє шлях всередині вашого старого плеєра
  function applyAudioSource() {
    if (!window.globalAlarmAudio) return;
    
    const selectedMode = sourceModeElement ? sourceModeElement.value : "base64";
    const newSrc = (selectedMode === "url") ? originalUrlSource : alarmBase64Source;

    // Якщо шлях змінився в меню, оновлюємо плеєр вашого старого коду
    if (window.globalAlarmAudio.src !== newSrc) {
      const wasPlaying = !window.globalAlarmAudio.paused;
      window.globalAlarmAudio.pause();
      window.globalAlarmAudio.src = newSrc;
      window.globalAlarmAudio.load();
      if (wasPlaying) {
        window.globalAlarmAudio.play().catch(e => console.log("Помилка відтворення:", e));
      }
    }
  }

  // Перевіряємо вибір одразу при запуску сторінки
  applyAudioSource();

  // Слідкуємо за кліками користувача в меню налаштувань
  if (sourceModeElement) {
    sourceModeElement.addEventListener("change", applyAudioSource);
  }
});

// Попереднє зняття блокування звуку браузером за першим кліком користувача на сторінці
const removeBrowserAudioBlock = () => {
  if (window.globalAlarmAudio) {
    window.globalAlarmAudio.play().then(() => {
  window.globalAlarmAudio.pause();
  window.globalAlarmAudio.currentTime = 0;
  console.log("Alarm audio unlocked");
}).catch(err => console.log("Alarm unlock failed:", err));
    document.removeEventListener('click', removeBrowserAudioBlock);
    document.removeEventListener('touchstart', removeBrowserAudioBlock);
  }
};
document.addEventListener('click', removeBrowserAudioBlock);
document.addEventListener('touchstart', removeBrowserAudioBlock);

function startAlarmSound() {
  // Зчитуємо параметри "Тривалість" та "Гучність" безпосередньо з вашої HTML-панелі
  const durationSec = Math.max(5, Math.min(3600, parseInt(alarmLen?.value || "300", 10)));
  const volumePercent = parseInt(alarmVol?.value || "35", 10);
  
  // Повне скидання попереднього стану треку та виставлення нової гучності (від 0.0 до 1.0)
  window.globalAlarmAudio.pause();
  window.globalAlarmAudio.currentTime = 0;
  window.globalAlarmAudio.volume = Math.max(0, Math.min(1, volumePercent / 100));
  
  // Запускаємо відтворення файлу alarm.mp3
  window.globalAlarmAudio.play().catch(() => {
    // Якщо кліків не було, звук активується примусово при взаємодії з вікном будильника
    const playOnClick = () => { window.globalAlarmAudio.play().catch(() => {}); document.removeEventListener('click', playOnClick); };
    document.addEventListener('click', playOnClick);
  });

  // Локальна функція зупинки для повної сумісності з оригінальними кнопками Stop/Snooze
  const localStop = () => {
    if (window.globalAlarmAudio) {
      window.globalAlarmAudio.pause();
      window.globalAlarmAudio.currentTime = 0;
    }
  };

  stopAlarmFn = localStop;
  window.setTimeout(() => {
    if (stopAlarmFn === localStop) {
      stopAlarmFn = null;
      localStop();
    }
  }, durationSec * 1000);
}

function stopAlarm() {
  // Цей блок повністю зберігає ваші оригінальні зв'язки та системні виклики вікон
  if (stopAlarmFn) {
    stopAlarmFn();
    stopAlarmFn = null;
  }
  closeAlarmModal();
  if (snoozeUntilMs === 0) setAlarmIndicatorFromValue(alarmIn?.value || "", false);
}

  function snoozeAlarm(now) {
    const mins = Math.max(1, Math.min(600, parseInt(alarmSnooze?.value || "5", 10)));
    snoozeUntilMs = now.getTime() + mins * 60 * 1000;
    setAlarmIndicatorFromSnoozeTarget();
    stopAlarm();
  }

  if (alarmStop) alarmStop.addEventListener("click", stopAlarm);
  if (alarmSnoozeBtn)
    alarmSnoozeBtn.addEventListener("click", () => snoozeAlarm(new Date()));

  function openAlarmMenu() {
    panel?.classList.add("open");
    window.requestAnimationFrame(() => {
      alarmSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (alarmTimeBtn) {
    alarmTimeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAlarmMenu();
    });
  }

  function setAlarmIndicatorFromValue(value, _isSnooze) {
  if (!alarmTimeBtn && !alarmMarkerWrap) return;

  if (!value) {
    if (alarmTimeBtn) alarmTimeBtn.textContent = "--:--";
    if (alarmMarkerWrap) alarmMarkerWrap.style.display = "none";
    return;
  }

  if (alarmTimeBtn) alarmTimeBtn.textContent = value;

  const [hhRaw, mmRaw] = value.split(":");
  const hh = Number.parseInt(hhRaw, 10);
  const mm = Number.parseInt(mmRaw, 10);

  if (Number.isNaN(hh) || Number.isNaN(mm)) {
    if (alarmMarkerWrap) alarmMarkerWrap.style.display = "none";
    return;
  }

  const hours12 = (hh % 12) + mm / 60;
  const hourDeg = hours12 * 30;
  const minuteDeg = mm * 6;

  if (!alarmMarkerWrap) return;

  alarmMarkerWrap.style.display = "block";
  alarmMarkerWrap.innerHTML = "";

  // shared base hand style
  const base =
    "position:absolute;left:50%;top:50%;" +
    "transform-origin:50% 100%;" +
    "translate(-50%,-100%);";

  // HOUR HAND (customizable)
const hourHand = document.createElement("div");
hourHand.style.cssText =
  base +
  `width:var(--alarm-hour-width);` +
  `height:var(--alarm-hour-height);` +
  `background:var(--alarm-hour-color);` +
  "border-radius:4px;" +
  `transform:translate(-50%,-100%) rotate(${hourDeg}deg);` +
  "z-index:2;";

// MINUTE HAND (customizable)
const minuteHand = document.createElement("div");
minuteHand.style.cssText =
  base +
  `width:var(--alarm-minute-width);` +
  `height:var(--alarm-minute-height);` +
  `background:var(--alarm-minute-color);` +
  "border-radius:4px;" +
  `transform:translate(-50%,-100%) rotate(${minuteDeg}deg);` +
  "z-index:1;";

  // optional center dot for realism
  const centerDot = document.createElement("div");
  centerDot.style.cssText =
    "position:absolute;left:50%;top:50%;" +
    "width:6px;height:6px;background:#fff;border-radius:50%;" +
    "transform:translate(-50%,-50%);z-index:3;";

  alarmMarkerWrap.appendChild(hourHand);
  alarmMarkerWrap.appendChild(minuteHand);
  alarmMarkerWrap.appendChild(centerDot);
}

  function setAlarmIndicatorFromSnoozeTarget() {
    if (!snoozeUntilMs) return;
    const d = new Date(snoozeUntilMs);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    setAlarmIndicatorFromValue(`${hh}:${mm}`, true);
  }

  if (alarmIn) {
    alarmIn.addEventListener("input", () => {
      if (snoozeUntilMs) {
        // keep showing snooze target until it rings (or snooze cleared)
        setAlarmIndicatorFromSnoozeTarget();
      } else {
        setAlarmIndicatorFromValue(alarmIn.value, false);
      }
    });
    setAlarmIndicatorFromValue(alarmIn.value, false);
  }

  

  function updateViewportAnchors() {
    const rect = scroller?.getBoundingClientRect();
    const top = rect ? rect.height / 2 : window.innerHeight / 2;
    timeline.style.top = top + "px";
  }
  window.addEventListener("resize", updateViewportAnchors);
  updateViewportAnchors();

  // Highlight today and the current time cell
  let lastTodayIdx = -1;
  let lastNowHour = -1;

  function getTodayIdx(now) {
    // JS: 0=Sun..6=Sat, our array: 0=Mon..6=Sun
    return (now.getDay() + 6) % 7;
  }

  function updateHighlights(now, hour, hhmm) {
    const todayIdx = getTodayIdx(now);
    if (todayIdx !== lastTodayIdx) {
      if (lastTodayIdx >= 0) {
        hdrCells[lastTodayIdx]?.classList.remove("today");
        dayCols[lastTodayIdx]?.classList.remove("today-col");
      }
      hdrCells[todayIdx]?.classList.add("today");
      dayCols[todayIdx]?.classList.add("today-col");
      lastTodayIdx = todayIdx;
      // Force re-evaluate hour highlight on day change
      lastNowHour = -1;
    }

    if (hour !== lastNowHour) {
      const prevCol = dayCols[todayIdx];
      if (prevCol && lastNowHour >= 0) {
        const prevCell = prevCol.children[lastNowHour];
        prevCell?.classList.remove("now-cell");
        if (prevCell) delete prevCell.dataset.now;
      }
      if (prevCol) {
        const cell = prevCol.children[hour];
        cell?.classList.add("now-cell");
        if (cell) cell.dataset.now = hhmm;
      }
      lastNowHour = hour;
    } else {
      // Same hour, but keep the displayed actual time updated
      const col = dayCols[todayIdx];
      const cell = col?.children[hour];
      if (cell && cell.classList.contains("now-cell")) cell.dataset.now = hhmm;
    }
  }

   function sync() {
 const now = new Date();
 const h = now.getHours(),
 m = now.getMinutes(),
 s = now.getSeconds();
 const currentCellH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hour-h")) || 60;
 const y = h * currentCellH + (m / 60) * currentCellH;




    const rect = scroller?.getBoundingClientRect();
    const midY = rect ? rect.height / 2 : window.innerHeight / 2 - 48;
    if (s === 0 && m % 10 === 0) {
    grid.style.transform = `translateY(${midY - y}px)`;
}

    sHand.style.transform = `translateX(-50%) rotate(${s * 6}deg)`;
    mHand.style.transform = `translateX(-50%) rotate(${m * 6 + s * 0.1}deg)`;
    hHand.style.transform = `translateX(-50%) rotate(${(h % 12) * 30 + m * 0.5}deg)`;

    vTime.innerText = [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
    const dateUnderClock = document.getElementById("v-date");

if (dateUnderClock) {
  const months = [
 "січ",
 "лют",
 "бер",
 "кві",
 "тра",
 "чер",
 "лип",
 "сер",
 "вер",
 "жов",
 "лис",
 "гру"
 ];

  const dd = now.getDate().toString().padStart(2, "0");
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const monthWord = months[now.getMonth()];
  const yyyy = now.getFullYear();

  dateUnderClock.innerText = `${dd}.${mm} ${monthWord} ${yyyy}`;
  
}
    const hh = h.toString().padStart(2, "0");
 const mm = m.toString().padStart(2, "0");
 const ss = s.toString().padStart(2, "0"); // Додаємо секунди
 updateHighlights(now, h, `${hh}:${mm}:${ss}`);

    const ringKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${hh}:${mm}`;

    const alarmTime = alarmIn?.value || "";
    const shouldRingFromTime = alarmTime && alarmTime === `${hh}:${mm}`;
    const shouldRingFromSnooze = snoozeUntilMs > 0 && now.getTime() >= snoozeUntilMs;

    if (s === 0 && ringKey !== lastRingKey && (shouldRingFromTime || shouldRingFromSnooze)) {
      lastRingKey = ringKey;
      if (shouldRingFromSnooze) snoozeUntilMs = 0;
      openAlarmModal(now);
      startAlarmSound();
      // when snooze target has triggered, go back to showing the configured alarm time
      if (!snoozeUntilMs) setAlarmIndicatorFromValue(alarmIn?.value || "", false);
    }
  }
  setInterval(sync, 1000);
  sync();
  if (typeof scroller !== 'undefined' && scroller) new ResizeObserver(() => updateViewportAnchors()).observe(scroller);


  // Drag & Drop (throttle via rAF for smoother dragging)
  const widget = document.getElementById("master-widget");
  let move = false,
    ox,
    oy,
    raf = 0,
    lastX = 0,
    lastY = 0;

  function applyDrag() {
    raf = 0;
    if (!move) return;
    widget.style.left = lastX - ox + "px";
    widget.style.top = lastY - oy + "px";
    widget.style.right = "auto";
  }

  widget.onmousedown = (e) => {
    if (e.target.closest("#alarm-time-btn")) return;
    move = true;
    ox = e.clientX - widget.offsetLeft;
    oy = e.clientY - widget.offsetTop;
  };
  document.onmousemove = (e) => {
    if (!move) return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!raf) raf = requestAnimationFrame(applyDrag);
  };
  document.onmouseup = () => {
    move = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // Цифри
  const face = document.getElementById("face");
  const currentMonth = new Date().getMonth() + 1;
  for (let i = 1; i <= 12; i++) {
  const n = document.createElement("div");

  n.className =
    "num" + (i === currentMonth ? " current-month" : "");

  n.style.transform = `rotate(${i * 30}deg)`;



    n.innerHTML = `
 <span style="
 display:inline-block;
 font-size: ${(localStorage.getItem('v-num-size-custom') || 32)}px !important;
 
 transform:rotate(-${i * 30}deg)
 ${i === currentMonth
 ? `;color:#ffcc00;font-size:2.4rem !important;font-weight:900;transform:rotate(-${i * 30}deg) scale(1.45)`
 : ""}
 ">
 ${i}
 </span>
 `;



  face.appendChild(n);
}

  // Second/minute marks (60 ticks)
  const secMarks = document.getElementById("sec-marks");
  if (secMarks) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) {
      const t = document.createElement("div");
      t.className = "sec-tick" + (i % 5 === 0 ? " major" : "");
      t.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg) translateY(calc(var(--clk-size) / -2 + var(--sec-tick-inset)))`;
      frag.appendChild(t);
    }
    secMarks.appendChild(frag);
  }
  


}

// ПРОСТЕ ТА ЕНЕРГОЕФЕКТИВНЕ ВІДОБРАЖЕННЯ ФОТО
document.getElementById('table-bg-file')?.addEventListener('change', async function(e) {

  const iframe = document.getElementById('iFrameResizer0');
  const doc = iframe?.contentDocument || iframe?.contentWindow?.document || document; // ВИПРАВЛЕНО: Додано резервний перехід на document, якщо iframe не існує
  const file = e.target.files[0]; // Беремо рівно один файл
  if (!file) return;
  console.log('PHOTO HANDLER START');
  
  // 1. Показуємо ім'я файлу в панелі налаштувань
  const nameLabel = document.getElementById('table-bg-name');
  if (nameLabel) nameLabel.textContent = file.name;

  // 2. Створюємо легке посилання на фото в оперативній пам'яті (RAM)
  const blobUrl = await new Promise(resolve => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.readAsDataURL(file);
});
console.log('AFTER FILE LOADED');
  // 3. Створюємо ізольоване CSS-правило в голові документа
  let styleEl = doc.getElementById('global-photo-style');

if (!styleEl) {
  styleEl = doc.createElement('style');
  styleEl.id = 'global-photo-style';
  doc.head.appendChild(styleEl);
    console.log('APPENDED STYLE ELEMENT:', styleEl);
  }
console.log('WRITING PHOTO CSS')
  // Накладаємо фото на фон таблиці, а 6 днів робимо прозорими. Поточний день (.today-col) захищено!
  styleEl.textContent = `
    #grid-main, .grid-content, .scroller, .timetable-grid { 
      background-image: url(${blobUrl}) !important; 
      background-size: 100% auto !important; /* МІНІМАЛЬНА ЗМІНА: замінено cover на contain */
      background-position: center !important;
      background-repeat: no-repeat !important;
    }
    .day-column:not(.today-col), .day-column:not(.today-col) .cell, #hours-sidebar .cell { 
      background: transparent !important; 
      background-color: transparent !important; 
    }
  `;
  styleEl.textContent += ` #hours-sidebar, #hours-sidebar .cell { background: var(--table-bg) !important; background-color: var(--table-bg) !important; }`;
  // ВИПРАВЛЕНО: Додано селектор .day-column:not(.today-col), щоб зробити прозорими самі стовпці, які перекривали фото білим фоном
  setTimeout(() => {
  console.log('STYLE AFTER 1s:', doc.getElementById('global-photo-style')); // ВИПРАВЛЕНО: Замінено document на doc для повної відповідності контексту
}, 1000);
});

// КНОПКА ВИДАЛЕННЯ ФОТО (✕)
document.getElementById('clear-table-bg-file')?.addEventListener('click', function() {
  const fileInput = document.getElementById('table-bg-file');
  if (fileInput) fileInput.value = ""; 
  
  const nameLabel = document.getElementById('table-bg-name');
  if (nameLabel) nameLabel.textContent = "";

  // Повністю видаляємо фото-стилі, повертаючи колір із налаштувань
  const iframe = document.getElementById('iFrameResizer0');
  const doc = iframe?.contentDocument || iframe?.contentWindow?.document || document; // ВИПРАВЛЕНО: Ініціалізовано doc, щоб уникнути ReferenceError при видаленні фото
  doc.getElementById('global-photo-style')?.remove();
});

// АВТОЗБЕРЕЖЕННЯ ТА ВІДНОВЛЕННЯ З 0% НАВАНТАЖЕННЯ НА CPU
(() => {
  const saved = localStorage.getItem('saved-photo-css');
  const d = document.getElementById('iFrameResizer0')?.contentDocument || document;
  if (saved) {
    let s = d.getElementById('global-photo-style') || d.createElement('style');
    s.id = 'global-photo-style'; s.textContent = saved;
    d.head.appendChild(s);
  }
  new MutationObserver(() => {
    const s = d.getElementById('global-photo-style');
    if (s?.textContent) localStorage.setItem('saved-photo-css', s.textContent);
  }).observe(d.head, { childList: true, subtree: true });
})();
document.getElementById('clear-table-bg-file')?.addEventListener('click', () => {
  localStorage.removeItem('saved-photo-css');
});
