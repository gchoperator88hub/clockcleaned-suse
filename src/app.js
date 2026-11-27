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
background:var(--year-bg-c, #ffffff);
cursor:pointer;
font-weight:bold;
font-size:16px;
color:var(--year-txt-c, #ff0000);
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
     if (id === "v-alarm-card-bg") document.documentElement.style.setProperty("--alarm-card-bg-val", finalValue);
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

    // from gpt 27.10.26
    if (window.globalAlarmAudio.src !== newSrc) {
  window.globalAlarmAudio.pause();
  window.globalAlarmAudio.src = newSrc;
  window.globalAlarmAudio.load();
}
  }

  // Перевіряємо вибір одразу при запуску сторінки
  applyAudioSource();

  // Слідкуємо за кліками користувача в меню налаштувань
  if (sourceModeElement) {
    sourceModeElement.addEventListener("change", applyAudioSource);
  }
});



function startAlarmSound() {
  // Зчитуємо параметри "Тривалість" та "Гучність" безпосередньо з вашої HTML-панелі
  const durationSec = Math.max(5, Math.min(3600, parseInt(alarmLen?.value || "300", 10)));
  const volumePercent = parseInt(alarmVol?.value || "35", 10);
  
  // Повне скидання попереднього стану треку та виставлення нової гучності (від 0.0 до 1.0)
  window.globalAlarmAudio.pause();
  window.globalAlarmAudio.currentTime = 0;
  window.globalAlarmAudio.volume = Math.max(0, Math.min(1, volumePercent / 100));
  
  // from gpt 27.10.26
  window.globalAlarmAudio.play().catch(() => {});

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
 ? `;color:var(--cur-m-clock, #ffcc00);font-size:2.4rem !important;font-weight:900;transform:rotate(-${i * 30}deg) scale(1.45)`
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
// =========================================================================
// ЕНЕРГОЕФЕКТИВНЕ НАКЛАДАННЯ 1 ФОТО НА ГОДИННИК (БЕЗ НАВАНТАЖЕННЯ НА CPU)
// =========================================================================

// 1. Обробник завантаження: автоматично видаляє старе фото і ставить нове
document.getElementById('clk-bg-file')?.addEventListener('change', async function(e) {
  const iframe = document.getElementById('iFrameResizer0');
  const doc = iframe?.contentDocument || iframe?.contentWindow?.document || document;
  const file = e.target.files[0]; // Беремо рівно один файл
  if (!file) return;
  
  // Показуємо ім'я нового файлу в меню
  const nameLabel = document.getElementById('clk-bg-name');
  if (nameLabel) nameLabel.textContent = file.name;

  // Створюємо легке посилання на фото в пам'яті (RAM)
  const blobUrl = await new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });

  // Створюємо або оновлюємо ізольований CSS-стиль для круглого віджета #face
  let styleEl = doc.getElementById('global-clock-photo-style');
  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.id = 'global-clock-photo-style';
    doc.head.appendChild(styleEl);
  }

  // МІНІМАЛЬНА ЗМІНА: додано правило відключення фото, якщо активується інлайн-стиль анімації миготіння
  styleEl.textContent = `
    #face:not(.clock-blink-active):not([style*="opacity"]) { 
      background-image: url(${blobUrl}) !important; 
      background-size: cover !important; 
      background-position: center !important;
      background-repeat: no-repeat !important;
    }
  `;
});

// 2. Кнопка видалення (✕): повністю очищує фото і миттєво повертає вибраний колір
document.getElementById('clear-clk-bg-file')?.addEventListener('click', function() {
  const fileInput = document.getElementById('clk-bg-file');
  if (fileInput) fileInput.value = ""; 
  
  const nameLabel = document.getElementById('clk-bg-name');
  if (nameLabel) nameLabel.textContent = "";

  const iframe = document.getElementById('iFrameResizer0');
  const doc = iframe?.contentDocument || iframe?.contentWindow?.document || document;

  // Видаляємо CSS-стиль фото, повертаючи колір палітри за замовчуванням
  doc.getElementById('global-clock-photo-style')?.remove();
  localStorage.removeItem('saved-clock-photo-css');
});

// 3. Автозбереження фону годинника та відновлення після оновлення сторінки (0% CPU)
(() => {
  const saved = localStorage.getItem('saved-clock-photo-css');
  const d = document.getElementById('iFrameResizer0')?.contentDocument || document;
  if (saved) {
    let s = d.getElementById('global-clock-photo-style') || d.createElement('style');
    s.id = 'global-clock-photo-style'; 
    s.textContent = saved;
    d.head.appendChild(s);
  }

  new MutationObserver(() => {
    const s = d.getElementById('global-clock-photo-style');
    if (s?.textContent) localStorage.setItem('saved-clock-photo-css', s.textContent);
  }).observe(d.head, { childList: true, subtree: true });
})();


/* НЕЗАЛЕЖНИЙ ПЕРЕХОПЛЮВАЧ НАЛАШТУВАНЬ ВСІХ СТРІЛОК ГОДИННИКА (ЗАХИСТ ВІД ЗЛАМІВ) */
document.addEventListener("input", (e) => {
  const id = e.target?.id;
  if (!id || !id.startsWith("v-") || !id.includes("hand")) return;
  
  // КРИТИЧНО: Повністю блокуємо втручання оригінального ядра, щоб воно не додавало "px" до кольорів
  e.stopImmediatePropagation();
  
  const value = e.target.value;
  localStorage.setItem(id, value);
  
  const cssVarName = id.slice(2); // Відрізаємо "v-"
  let unit = "";
  
  if (e.target.type === "range") {
    unit = id.endsWith("-h") ? "%" : "px"; // Довжині — відсотки, товщині — пікселі
  }
  
  document.documentElement.style.setProperty(`--${cssVarName}`, value + unit);
}, true); // Фаза перехоплення (true) гарантує пріоритет над базовими скриптами

/* Автоматичне відновлення стану стрілок годинника при кожному старті браузера */
document.addEventListener("DOMContentLoaded", () => {
  const handInputIds = ["v-h-hand-c", "v-h-hand-w", "v-h-hand-h", "v-m-hand-c", "v-m-hand-w", "v-m-hand-h", "v-s-hand-c", "v-s-hand-w", "v-s-hand-h"];
  
  // Даємо базовому DOM-дереву 100мс повністю збудуватися, щоб уникнути скидання розмірів
  setTimeout(() => {
    handInputIds.forEach(id => {
      const savedValue = localStorage.getItem(id);
      if (savedValue !== null) {
        const inputEl = document.getElementById(id);
        if (inputEl) inputEl.value = savedValue;
        
        const cssVarName = id.slice(2); // Відрізаємо "v-"
        let unit = "";
        
        if (id.endsWith("-w")) unit = "px";
        if (id.endsWith("-h")) unit = "%";
        
        document.documentElement.style.setProperty(`--${cssVarName}`, savedValue + unit);
      }
    });
  }, 100);
});



// =========================================================================
// START LANGUAGE SWITCH (UK / EN) — Adapted for app.js
// =========================================================================
(() => {
  'use strict';

  /* ================================================================
     LANGUAGE SWITCH (Українська / English)
     - Ukrainian mode: this block only adds the language selector. Nothing else runs.
     - English mode: the text of the whole app is translated once at start and
       whenever the app writes new text (no timers, no polling, no observers).
     - The original Ukrainian text is remembered, so every script that reads
       the text of the page (textContent) still sees Ukrainian and keeps working.
     To add a word or phrase: add one line to DICT below.
     ================================================================ */

  const KEY = 'app-lang';
  let lang = 'uk';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'uk'; } catch (_) {}

  /* ---------- 1) the settings parameter (always present) ---------- */
  function addSelector() {
    const panel = document.getElementById('panel');
    if (!panel || document.getElementById('td-lang-row')) return !!document.getElementById('td-lang-row');
    const row = document.createElement('div');
    row.className = 'row';
    row.id = 'td-lang-row';
    row.setAttribute('data-no-tr', '1');
    row.style.cssText = 'margin:10px 0 14px;padding:8px 0;border-bottom:1px solid #eee;';
    row.innerHTML = 'Мова / Language <select id="td-lang-select" style="padding:4px 8px;font-size:0.95rem;">' +
      '<option value="uk">Українська</option><option value="en">English</option></select>';
    const h2 = panel.querySelector('h2');
    if (h2) h2.after(row); else panel.prepend(row);
    const sel = row.querySelector('select');
    sel.value = lang;
    sel.addEventListener('change', () => {
      try { localStorage.setItem(KEY, sel.value); } catch (_) {}
      location.reload(); // translation is applied once, at start
    });
    return true;
  }

  if (!addSelector()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSelector);
    else setTimeout(addSelector, 0);
  }

  if (lang !== 'en') return; // Ukrainian: nothing more to do

  /* ---------- 2) dictionary: Ukrainian -> English ---------- */
  const DICT = {
    "(рамка — колір)": "(outline — color)",
    "(рамка — товщина)": "(outline — thickness)",
    "м": "m",
    "Badge рамка": "Badge border",
    "Badge фон": "Badge background",
    "Badge час (колір)": "Badge time (color)",
    "Badge час (розмір)": "Badge time (size)",
    "Badge час: положення": "Badge time: position",
    "Badge час: рамка тексту (колір)": "Badge time: text outline (color)",
    "Badge час: рамка тексту (товщина)": "Badge time: text outline (thickness)",
    "MP3 файл збережено": "MP3 file saved",
    "PM цифри (колір)": "PM numbers (color)",
    "PM цифри (радіус)": "PM numbers (radius)",
    "PM цифри (розмір px)": "PM numbers (size px)",
    "PM цифри (товщина)": "PM numbers (thickness)",
    "Snooze (відкладення):": "Snooze (postpone):",
    "Днів:": "Days:",
    "Заповнених слотів:": "Filled slots:",
    "Рік:": "Year:",
    "Є подія планувальника": "Planner event present",
    "Інтервал": "Interval",
    "Інтервал (Через X хв)": "Interval (In X min)",
    "Активна кнопка (текст)": "Active button (text)",
    "Активна кнопка (фон)": "Active button (background)",
    "БУДИЛЬНИК №": "ALARM #",
    "Березень": "March",
    "Будильник": "Alarm",
    "Будильник №": "Alarm #",
    "Будильник:": "Alarm:",
    "Вбудований звук (Base64 текст)": "Built-in sound (Base64 text)",
    "Введіть ваш текст тут...": "Enter your text here...",
    "Введіть точну фразу для пошуку...": "Enter the exact phrase to search...",
    "Введіть фразу для пошуку в усіх нотатках і подіях.": "Enter a phrase to search in all notes and events.",
    "Ввімкнено": "On",
    "Великий фон вікна": "Large window background",
    "Великий фон вікна 2:": "Large window background 2:",
    "Вересень": "September",
    "Весна": "Spring",
    "Весна (2 → 5, березень–травень)": "Spring (2 → 5, March–May)",
    "Видалено записів за": "Records deleted for",
    "Видалити нотатки за": "Delete notes for",
    "Видалити події планувальника за": "Delete planner events for",
    "Вимкнено": "Off",
    "Вимкнено повністю": "Fully disabled",
    "Висота години": "Hour height",
    "Висота клітинки дня, px": "Day cell height, px",
    "Висота клітинок днів (×)": "Day cells height (×)",
    "Висота кнопки «Зберегти»": "Height of the “Save” button",
    "Висота кнопки дня (відступ)": "Day button height (padding)",
    "Висота списку нотаток (×)": "Notes list height (×)",
    "Вт": "Tue",
    "Віджет на екрані": "Widget on screen",
    "Віджет у додатку": "Widget in the app",
    "Віджети показані — натисніть, щоб сховати": "Widgets shown — click to hide",
    "Віджети сховані — натисніть, щоб показати": "Widgets hidden — click to show",
    "Відкласти дзвінок:": "Postpone the ring:",
    "Відкласти на (прямо зараз):": "Postpone by (right now):",
    "Відстань між днями": "Gap between days",
    "Відстань між клітинками (×)": "Gap between cells (×)",
    "Відступ усередині вікна": "Padding inside the window",
    "Відступ усередині поля тексту": "Padding inside the text field",
    "Годинна": "Hour hand",
    "Годинна (довжина %)": "Hour hand (length %)",
    "Годинна (колір)": "Hour hand (color)",
    "Годинна (товщина)": "Hour hand (thickness)",
    "Грудень": "December",
    "Гучність": "Volume",
    "Джерело звуку будильника:": "Alarm sound source:",
    "Дзвонити через:": "Ring in:",
    "Днів із записами:": "Days with entries:",
    "Довжина годинної стрілки (%)": "Hour hand length (%)",
    "Довжина хвилинної стрілки (%)": "Minute hand length (%)",
    "Додаткові будильники (клони №2)": "Extra alarms (clones #2)",
    "Жирність тексту (400–900)": "Text weight (400–900)",
    "Жовтень": "October",
    "ЗАВАНТАЖИТИ MP3 ДЛЯ БУДИЛЬНИКА": "UPLOAD MP3 FOR ALARM",
    "ЗАВАНТАЖИТИ MP3 ДЛЯ БУДИЛЬНИКА 2": "UPLOAD MP3 FOR ALARM 2",
    "ЗАВАНТАЖИТИ MP3 ДЛЯ ПОДІЙ": "UPLOAD MP3 FOR EVENTS",
    "ЗАРАЗ АКТИВОВАНО: МІНІМУМ ЦП (ЕКО)": "ACTIVE NOW: MINIMUM CPU (ECO)",
    "ЗАРАЗ АКТИВОВАНО: СТАНДАРТНИЙ РЕЖИМ": "ACTIVE NOW: STANDARD MODE",
    "ЗАФІКСУВАТИ БУДИЛЬНИК": "SET ALARM",
    "ЗАФІКСУВАТИ БУДИЛЬНИК 2": "SET ALARM 2",
    "ЗБЕРЕГТИ ВСЕ": "SAVE ALL",
    "За замовчуванням": "Default",
    "Заголовок місяця (×)": "Month title (×)",
    "Закрити приклад (нічого не зберігається)": "Close example (nothing is saved)",
    "Закрити ": "Close ",
    "Заокруглення кнопки «Зберегти»": "Corner radius of the “Save” button",
    "Заокруглення кнопки дня": "Day button corner radius",
    "Зараз": "Now",
    "Зберегти": "Save",
    "Звичайні нотатки календаря та події інших років залишаться.": "Regular calendar notes and events of other years will remain.",
    "Зима": "Winter",
    "Зима (11 → 2, грудень–лютий)": "Winter (11 → 2, December–February)",
    "Знайдено:": "Found:",
    "Значок у шапці дня (текст)": "Day header badge (text)",
    "Значок у шапці дня (фон)": "Day header badge (background)",
    "Картка поп-апу": "Pop-up card",
    "Картка поп-апу 2:": "Pop-up card 2:",
    "Квітень": "April",
    "Кнопка СТОП (текст)": "STOP button (text)",
    "Кнопка СТОП (фон)": "STOP button (background)",
    "Кнопка показу віджетів": "Show-widgets button",
    "Кнопка режиму (текст)": "Mode button (text)",
    "Кнопка режиму (фон)": "Mode button (background)",
    "Кнопка сьогодні (колір)": "Today button (color)",
    "Кнопка сьогодні (розмір, px)": "Today button (size, px)",
    "Кнопка (колір)": " button (color)",
    "Кнопка/підказка (текст)": "Button/hint (text)",
    "Кнопка/підказка (фон)": "Button/hint (background)",
    "Кнопки ‹ › (×)": "‹ › buttons (×)",
    "Коли грати мелодію": "When to play the melody",
    "Коло пір року": "Seasons circle",
    "Колонка сьогодні поверх усього / як було": "Today column on top of everything / as it was",
    "Кольори": "Colors",
    "Колір": "Color",
    "Колір 11 місяців": "Color of 11 months",
    "Колір 1:": "Color 1:",
    "Колір 2": "Color 2",
    "Колір 2:": "Color 2:",
    "Колір digital": "Digital color",
    "Колір будильника": "Alarm color",
    "Колір годинника": "Clock color",
    "Колір годинної стрілки будильника": "Alarm hour hand color",
    "Колір дати (заголовок)": "Date color (title)",
    "Колір днів тижня": "Weekday color",
    "Колір днів, що залишилися": "Color of remaining days",
    "Колір заголовка": "Title color",
    "Колір заголовка місяця": "Month title color",
    "Колір заголовка року": "Year title color",
    "Колір звичайних днів": "Regular days color",
    "Колір кнопки ×": "Button × color",
    "Колір ліній/рамки": "Lines/border color",
    "Колір ліній:": "Line color:",
    "Колір місяця на годиннику": "Month color on the clock",
    "Колір мітки": "Marker color",
    "Колір назв днів тижня": "Weekday names color",
    "Колір назв місяців": "Month names color",
    "Колір номерів тижнів": "Week numbers color",
    "Колір повзунка": "Slider color",
    "Колір позначки дня": "Day marker color",
    "Колір позначки події": "Event marker color",
    "Колір поточного дня": "Current day color",
    "Колір поточного місяця": "Current month color",
    "Колір підказки в полі": "Field hint color",
    "Колір рамки вікна": "Window border color",
    "Колір рамки дня": "Day border color",
    "Колір рамки дня з нотаткою": "Border color of a day with a note",
    "Колір рамки поля": "Field border color",
    "Колір рамки при введенні": "Border color while typing",
    "Колір рамки сьогоднішнього дня": "Today’s border color",
    "Колір рамок": "Border color",
    "Колір року": "Year color",
    "Колір символу": "Symbol color",
    "Колір смуги": "Bar color",
    "Колір спалаху 1": "Flash color 1",
    "Колір спалаху 2": "Flash color 2",
    "Колір стрілок будильника": "Alarm hands color",
    "Колір сьогодні": "Today color",
    "Колір сітки": "Grid color",
    "Колір таблиці": "Table color",
    "Колір тексту": "Text color",
    "Колір тексту (дні)": "Text color (days)",
    "Колір тексту кнопки": "Button text color",
    "Колір тексту нотатки": "Note text color",
    "Колір тексту поточного дня": "Current day text color",
    "Колір тексту рядка 1": "Line 1 text color",
    "Колір тексту рядка 2 (час і дата)": "Line 2 text color (time and date)",
    "Колір тексту рядка 3 (опис події)": "Line 3 text color (event description)",
    "Колір тексту рядка 4 (відлік)": "Line 4 text color (countdown)",
    "Колір фону": "Background color",
    "Колір фону digital:": "Digital background color:",
    "Колір хвилинної стрілки будильника": "Alarm minute hand color",
    "Колір цифр": "Numbers color",
    "Колір цифр дня": "Day numbers color",
    "Колір цифри години:": "Hour number color:",
    "Колір цифри:": "Number color:",
    "Колір часу": "Time color",
    "Колір часу (08:00)": "Time color (08:00)",
    "Колір часу події": "Event time color",
    "Кількість:": "Count:",
    "Липень": "July",
    "Листопад": "November",
    "Локальний файл для Вбудованого звуку:": "Local file for the built-in sound:",
    "Лютий": "February",
    "Лінія часу": "Time line",
    "Літо": "Summer",
    "Літо (5 → 8, червень–серпень)": "Summer (5 → 8, June–August)",
    "Мелодія-нагадування для цієї півгодини": "Reminder melody for this half-hour",
    "Мелодія:": "Melody:",
    "Мелодії подій": "Event melodies",
    "Миготіння кожну нову годину:": "Blink every new hour:",
    "Миготіти ДО початку години": "Blink BEFORE the hour starts",
    "Моя власна мелодія (З вікна налаштувань)": "My own melody (from the settings window)",
    "Мітка поточної півгодини": "Current half-hour marker",
    "На місці (у клітинці)": "In place (in the cell)",
    "Назви днів тижня (×)": "Weekday names (×)",
    "Назви місяців у колі пір року": "Month names in the seasons circle",
    "Найближчі події": "Upcoming events",
    "Налаштування": "Settings",
    "Наступна подія": "Next event",
    "Наступний місяць": "Next month",
    "Наступний рік": "Next year",
    "Нд": "Sun",
    "Не вдалося прочитати планувальник. Нічого не видалено.": "Could not read the planner. Nothing was deleted.",
    "Не знайдено основне вікно редактора дня.": "The main day editor window was not found.",
    "Неділя, 10.05.2026": "Sunday, 10.05.2026",
    "Неправильна дата результату.": "Invalid result date.",
    "Номери тижнів (×)": "Week numbers (×)",
    "Нотатка:": "Note:",
    "Нотатки + події": "Notes + events",
    "Нотатки та події —": "Notes and events —",
    "Нотаток цього місяця немає": "No notes this month",
    "Нічого": "Nothing",
    "Обводка зараз": "Outline now",
    "Об’єднувати (14:00–15:00)": "Merge (14:00–15:00)",
    "Окремі рядки": "Separate lines",
    "Основний текст": "Main text",
    "Осінь": "Autumn",
    "Осінь (8 → 11, вересень–листопад)": "Autumn (8 → 11, September–November)",
    "Очищення завершено.": "Cleanup finished.",
    "Очікування файлу...": "Waiting for file...",
    "Очікування...": "Waiting...",
    "Параметри віджета найближчої події": "Upcoming-event widget settings",
    "Пн": "Mon",
    "Повернути badge на місце": "Return the badge to its place",
    "Повернути віджет на місце": "Return the widget to its place",
    "Повернути віджет події на місце": "Return the event widget to its place",
    "Повернути до поточного часу (лінія часу посередині екрана)": "Return to the current time (time line in the middle of the screen)",
    "Повернути під годинник": "Return under the clock",
    "Повернути стандартну мелодію": "Restore the default melody",
    "Повернутись до поточного місяця": "Back to the current month",
    "Подій немає": "No events",
    "Подій планувальника цього місяця немає": "No planner events this month",
    "Події планувальника": "Planner events",
    "Показати приклад вікна": "Show window example",
    "Показувати": "Show",
    "Помилка збереження планувальника.": "Error saving the planner.",
    "Попередній місяць": "Previous month",
    "Попередній рік": "Previous year",
    "Поточний рік": "Current year",
    "Пошук у всіх збережених нотатках і подіях.": "Search all saved notes and events.",
    "Прозорий": "Transparent",
    "Прозорість затемнення": "Dimming transparency",
    "Прозорість сусідніх днів:": "Adjacent days transparency:",
    "Прозорість фону (%)": "Background transparency (%)",
    "Проміжок МІЖ рядками, px (0 = впритул)": "Gap BETWEEN lines, px (0 = flush)",
    "Проміжок між днями, px": "Gap between days, px",
    "Проміжок між місяцями, px": "Gap between months, px",
    "Пряме посилання (Hugging Face URL)": "Direct link (Hugging Face URL)",
    "Пт": "Fri",
    "Під годинником": "Under the clock",
    "Рамка": "Border",
    "Рамка PM цифр: колір": "PM numbers outline: color",
    "Рамка PM цифр: товщина (px)": "PM numbers outline: thickness (px)",
    "Рамка поля": "Field border",
    "Рамка поточного дня": "Current day border",
    "Рамка поточного дня (колір)": "Current day border (color)",
    "Рамка поточного дня (товщина, px)": "Current day border (thickness, px)",
    "Рамка сьогодні": "Today border",
    "Рамка текста заголовка — толщина (px)": "Title text outline — thickness (px)",
    "Рамка текста заголовка — цвет": "Title text outline — color",
    "Рамка текста місяців — колір": "Months text outline — color",
    "Рамка текста місяців — товщина (px)": "Months text outline — thickness (px)",
    "Рамка текста поточного дня — толщина (px)": "Current day text outline — thickness (px)",
    "Рамка текста поточного дня — цвет": "Current day text outline — color",
    "Рамка тексту (колір)": "Text outline (color)",
    "Рамка тексту (товщина)": "Text outline (thickness)",
    "Рамка тексту digital (колір)": "Digital text outline (color)",
    "Рамка тексту digital (товщина)": "Digital text outline (thickness)",
    "Рамка цифр: колір": "Numbers outline: color",
    "Рамка цифр: товщина (px)": "Numbers outline: thickness (px)",
    "Режим": "Mode",
    "Режим 2:": "Mode 2:",
    "Режим миготіння щогодини:": "Hourly blink mode:",
    "Розмір": "Size",
    "Розмір (ширина, px)": "Size (width, px)",
    "Розмір будильника": "Alarm size",
    "Розмір дат, рамка сьогодні та маркер події": "Date size, today border and event marker",
    "Розмір дати (заголовка)": "Date size (title)",
    "Розмір днів тижня": "Weekday size",
    "Розмір заголовка": "Title size",
    "Розмір заголовка року": "Year title size",
    "Розмір значка та числа": "Badge and number size",
    "Розмір кнопки ×": "Button × size",
    "Розмір мітки": "Marker size",
    "Розмір назв днів тижня": "Weekday names size",
    "Розмір назв місяців": "Month names size",
    "Розмір позначки дня": "Day marker size",
    "Розмір поля будильника": "Alarm field size",
    "Розмір поточного дня": "Current day size",
    "Розмір символу": "Symbol size",
    "Розмір тексту": "Text size",
    "Розмір тексту віджета": "Widget text size",
    "Розмір тексту віджета 2:": "Widget text size 2:",
    "Розмір тексту кнопки «Зберегти»": "“Save” button text size",
    "Розмір тексту нотатки": "Note text size",
    "Розмір тексту під годинником:": "Text size under the clock:",
    "Розмір цифр": "Numbers size",
    "Розмір цифр годинника:": "Clock numbers size:",
    "Розмір цифр дня": "Day numbers size",
    "Розмір часу": "Time size",
    "Розмір чисел днів": "Day numbers size",
    "Розміри": "Sizes",
    "Розміри й кольори річного календаря": "Yearly calendar sizes and colors",
    "Рухомий віджет": "Movable widget",
    "Рядків тексту однієї нотатки": "Text lines per note",
    "Рядок 1: кнопка нагадування, px": "Line 1: reminder button, px",
    "Рядок 2: час і дата, px": "Line 2: time and date, px",
    "Рядок 3: опис події, px": "Line 3: event description, px",
    "Рядок 4: зворотний відлік, px": "Line 4: countdown, px",
    "Рік": "Yr",
    "Рік нотаток": "Notes year",
    "Рік ›": "Year ›",
    "Річний календар нотаток і подій": "Yearly calendar of notes and events",
    "Річний прогрес на рамці годинника": "Yearly progress on the clock frame",
    "Сб": "Sat",
    "Сек. мітки (висота)": "Second ticks (height)",
    "Сек. мітки (головні вис.)": "Second ticks (major height)",
    "Сек. мітки (головні)": "Second ticks (major)",
    "Сек. мітки (колір)": "Second ticks (color)",
    "Сек. мітки (товщина)": "Second ticks (thickness)",
    "Секундна": "Second hand",
    "Секундна (довжина %)": "Second hand (length %)",
    "Секундна (колір)": "Second hand (color)",
    "Секундна (товщина)": "Second hand (thickness)",
    "Серпень": "August",
    "Симуляцію запущено! Подивіться на годинник: він почне миготіти і зупиниться рівно на 00:00.": "Simulation started! Look at the clock: it will start blinking and stop exactly at 00:00.",
    "Скинути": "Reset",
    "Скинути будильник": "Reset alarm",
    "Скинути вікно місяця": "Reset month window",
    "Скинути кольори вікна": "Reset window colors",
    "Скинути кольори й розміри планувальника": "Reset planner colors and sizes",
    "Скинути параметри вікна": "Reset window parameters",
    "Скинути розміри вікна нотатки": "Reset note window sizes",
    "Скинути розміри елементів": "Reset element sizes",
    "Скинути ці параметри": "Reset these parameters",
    "Скоро: змінити колір за (хв)": "Soon: change color at (min)",
    "Смуга прокрутки таблиці": "Table scroll bar",
    "Смужка/крапка позначки": "Marker stripe/dot",
    "Список нотаток під календарем": "Notes list under the calendar",
    "Список під календарем": "List under the calendar",
    "Ср": "Wed",
    "Старт звуку:": "Sound start:",
    "Стрілки": "Hands",
    "Стандартна мелодія (alarm.mp3)": "Default melody (alarm.mp3)",
    "Сусідні півгодини": "Adjacent half-hours",
    "Сховати": "Hide",
    "Сітка всієї таблиці": "Grid of the whole table",
    "Січень": "January",
    "ТЕСТ: ЩОГОДИННЕ МИГОТІННЯ": "TEST: HOURLY BLINK",
    "Текст (звичайний)": "Text (regular)",
    "Текст власної мелодії (Base64):": "Own melody text (Base64):",
    "Текст віджета": "Widget text",
    "Текст віджета 2:": "Widget text 2:",
    "Текст дня з нотаткою": "Text of a day with a note",
    "Текст днів з нотатками": "Text of days with notes",
    "Текст звичайних днів": "Text of regular days",
    "Текст позначки в клітинці": "Cell marker text",
    "Текст під годинником: положення": "Text under the clock: position",
    "Текст списку нотаток (×)": "Notes list text (×)",
    "Текст у полі": "Text in the field",
    "Текст, коли подія скоро": "Text when the event is soon",
    "Текст, коли подія триває": "Text when the event is ongoing",
    "Тиж": "Wk",
    "Тип встановлення:": "Setting type:",
    "Типово за (хв) до події": "Default (min) before the event",
    "Товщина": "Thickness",
    "Товщина годинної стрілки (px)": "Hour hand thickness (px)",
    "Товщина кола": "Circle thickness",
    "Товщина ліній:": "Line thickness:",
    "Товщина лінії": "Line thickness",
    "Товщина маркера події:": "Event marker thickness:",
    "Товщина місяців": "Months thickness",
    "Товщина рамки (px)": "Border thickness (px)",
    "Товщина рамки вікна": "Window border thickness",
    "Товщина рамки дня": "Day border thickness",
    "Товщина рамки дня з нотаткою": "Border thickness of a day with a note",
    "Товщина рамки поля тексту": "Text field border thickness",
    "Товщина рамки сьогодні (px)": "Today border thickness (px)",
    "Товщина рамки сьогодні:": "Today border thickness:",
    "Товщина рамки сьогоднішнього дня": "Today’s border thickness",
    "Товщина рамок клітинок (px)": "Cell border thickness (px)",
    "Товщина смуги (px)": "Bar thickness (px)",
    "Товщина стрілок (px)": "Hands thickness (px)",
    "Товщина тексту": "Text thickness",
    "Товщина хвилинної стрілки (px)": "Minute hand thickness (px)",
    "Товщина цифр годинника": "Clock numbers thickness",
    "Товщина шрифту дати": "Date font weight",
    "Товщина шрифту днів тижня": "Weekday font weight",
    "Товщина шрифту заголовка": "Title font weight",
    "Товщина шрифту кнопки «Зберегти»": "“Save” button font weight",
    "Товщина шрифту кнопки нагадування:": "Reminder button font weight:",
    "Товщина шрифту тексту нотатки": "Note text font weight",
    "Товщина шрифту цифр дня": "Day numbers font weight",
    "Точка часу": "Point in time",
    "Точка часу (HH:MM)": "Point in time (HH:MM)",
    "Точно (сек):": "Exact (sec):",
    "Точну фразу не знайдено.": "Exact phrase not found.",
    "Травень": "May",
    "Тривалість (сек)": "Duration (sec)",
    "Тривалість (сек):": "Duration (sec):",
    "Триває зараз": "In progress now",
    "Тільки майбутні": "Only upcoming",
    "Тільки нотатки": "Notes only",
    "Тільки події планувальника": "Planner events only",
    "Увімкнено": "On",
    "Усі за місяць": "All for the month",
    "Файл alarm.mp3": "File alarm.mp3",
    "Фон": "Background",
    "Фон (звичайний)": "Background (regular)",
    "Фон 11 місяців": "Background of 11 months",
    "Фон верхньої панелі": "Top bar background",
    "Фон віджета": "Widget background",
    "Фон віджета 2:": "Widget background 2:",
    "Фон вікна": "Window background",
    "Фон дня": "Day background",
    "Фон дня з нотаткою": "Background of a day with a note",
    "Фон днів з нотатками": "Background of days with notes",
    "Фон за вікном (затемнення)": "Background behind the window (dimming)",
    "Фон заповненої півгодини": "Filled half-hour background",
    "Фон зараз": "Background now",
    "Фон звичайних днів": "Regular days background",
    "Фон картки будильника": "Alarm card background",
    "Фон кнопки": "Button background",
    "Фон кнопки «Зберегти»": "“Save” button background",
    "Фон кнопки ×": "Button × background",
    "Фон кнопки часу": "Time button background",
    "Фон місяців": "Months background",
    "Фон позначки в клітинці": "Cell marker background",
    "Фон поля": "Field background",
    "Фон поля тексту": "Text field background",
    "Фон поточного місяця": "Current month background",
    "Фон року": "Year background",
    "Фон сьогодні": "Today background",
    "Фон, коли подія скоро": "Background when the event is soon",
    "Фон, коли подія триває": "Background when the event is ongoing",
    "Фото годинника": "Clock photo",
    "Хвилинна": "Minute hand",
    "Хвилинна (довжина %)": "Minute hand (length %)",
    "Хвилинна (колір)": "Minute hand (color)",
    "Хвилинна (товщина)": "Minute hand (thickness)",
    "Час дзвінка": "Ring time",
    "Час дзвінка 2:": "Ring time 2:",
    "Час настав": "Time has come",
    "Час настав!": "Time has come!",
    "Червень": "June",
    "Через:": "In:",
    "Числа днів (×)": "Day numbers (×)",
    "Числа днів:": "Day numbers:",
    "Чт": "Thu",
    "Швидкість (сек):": "Speed (sec):",
    "Швидкість миготіння": "Blink speed",
    "Швидкість миготіння будильника (разів/с)": "Alarm blink speed (times/s)",
    "Швидкість миготіння цифри (разів/с)": "Number blink speed (times/s)",
    "Швидкість цифри (сек):": "Number speed (sec):",
    "Швидкість цифри:": "Number speed:",
    "Ширина вікна": "Window width",
    "Гучність і тривалість беруться з налаштувань будильника («Гучність», «Тривалість»).": "Volume and duration are taken from the alarm settings (“Volume”, “Duration”).",
    "впритул)": "flush)",
    "г": "h",
    "дн": "d",
    "до": "until",
    "дуже швидко": "very fast",
    "за": "before",
    "за скільки хвилин до початку (0–15)": "how many minutes before the start (0–15)",
    "завтра": "tomorrow",
    "залишилось": "remaining",
    "зберігається автоматично": "saved automatically",
    "кружок з цифрою (показати)": "circle with number (show)",
    "кружок: позиція на стрілці %": "circle: position on the hand %",
    "кружок: розмір (px)": "circle: size (px)",
    "кружок: фон (колір)": "circle: background (color)",
    "кружок: цифри (колір)": "circle: numbers (color)",
    "кружок: цифри (розмір px)": "circle: numbers (size px)",
    "кружок: цифри (товщина)": "circle: numbers (thickness)",
    "миготінь на секунду. Картка будильника яскрава": "blinks per second. The alarm card is bright for",
    "миготінь на секунду. Цифра видима": "blinks per second. The number is visible for",
    "о": "at",
    "повільно": "slow",
    "помірно": "moderate",
    "рік": "year",
    "рік:": "year:",
    "рік?": "year?",
    "с": "s",
    "с (цикл": "s (cycle",
    "с). Фон не миготить.": "s). The background does not blink.",
    "с, потім прихована": "s, then hidden for",
    "с, потім тьмяна": "s, then dim for",
    "скинути": "reset",
    "сьогодні": "today",
    "хв": "min",
    "хв ·": "min ·",
    "хв до початку": "min before the start",
    "хвилина всередині півгодини (можна ввести вручну, ↑↓ або вибрати зі списку)": "minute within the half-hour (type it, use ↑↓ or pick from the list)",
    "через": "in",
    "швидко": "fast",
    "швидко →": "fast →",
    "• 1) Час дзвінка:": "• 1) Ring time:",
    "• 2) Залишок часу:": "• 2) Time left:",
    "• 2) Залишок часу: 00:00:00": "• 2) Time left: 00:00:00",
    "• 3) Пройшло від старту:": "• 3) Elapsed since start:",
    "• 4) Час старту:": "• 4) Start time:",
    "‹ Рік": "‹ Year",
    "← повільно": "← slow",
    "↕ Прокрутка таблиці (24 год)": "↕ Table scroll (24 h)",
    " Будильник": " Alarm",
    " СТОП МЕЛОДІЇ": " STOP MELODY",
    " Енергоспоживання ПК:": " PC power consumption:",
    " ТЕСТ": " TEST",
    " Стрілки & Цифри": " Hands & Numbers",
    " MP3 файл 2 збережено.": " MP3 file 2 saved.",
    " MP3 файл збережено": " MP3 file saved",
    " ЗАВАНТАЖИТИ MP3": " UPLOAD MP3",
    " Фото": " Photo",
    " Вікно місяця (спливаюче)": " Month window (pop-up)",
    " Таблиця": " Table",
    " Віджет місяця": " Month widget",
    " Позначки в таблиці та календарях": " Markers in the table and calendars",
    " Вікно нотатки: розміри і товщина": " Note window: sizes and thickness",
    " Дизайн вікна нотатки": " Note window design",
    " Нотатка ·": " Note ·",
    " Текст": " Text",
    " натисніть, щоб увімкнути звук": " click to enable sound",
    " Розміри елементів віджета місяця": " Month widget element sizes",
    " Пошук": " Search",
    " Віджет найближчої події": " Upcoming-event widget",
    " Мелодії подій планувальника": " Planner event melodies",
    " Рамка — сьогодні": " Border — today",
    " Годинник": " Clock",
    " Вікно планувальника": " Planner window",
    " Очищення старих подій планувальника": " Clear old planner events",
    " Планувальник (по 30 хв)": " Planner (30-min slots)",
    " Планувальник (події по 30 хв)": " Planner (30-min events)",
    " Подія ·": " Event ·",
    " День із нотаткою": " Day with a note",
    " Нижня смужка — подія": " Bottom stripe — event",
    " Тест мелодії": " Test melody",
    "кружок": "circle",
    "Січ": "Jan",
    "Лют": "Feb",
    "Бер": "Mar",
    "Кві": "Apr",
    "Тра": "May",
    "Чер": "Jun",
    "Лип": "Jul",
    "Сер": "Aug",
    "Вер": "Sep",
    "Жов": "Oct",
    "Лис": "Nov",
    "Гру": "Dec",
    "січ": "Jan",
    "лют": "Feb",
    "бер": "Mar",
    "кві": "Apr",
    "тра": "May",
    "чер": "Jun",
    "лип": "Jul",
    "сер": "Aug",
    "вер": "Sep",
    "жов": "Oct",
    "лис": "Nov",
    "гру": "Dec",
    "Неділя": "Sunday",
    "приклад": "example",
    " ЗАВАНТАЖИТИ MP3 ДЛЯ ПОДІЙ": " UPLOAD MP3 FOR EVENTS",
    " ЗАВАНТАЖИТИ MP3 ДЛЯ БУДИЛЬНИКА": " UPLOAD MP3 FOR ALARM",
    " ЗАВАНТАЖИТИ MP3 ДЛЯ БУДИЛЬНИКА 2": " UPLOAD MP3 FOR ALARM 2"
  };

  /* ---------- 3) translator ---------- */
  const CYR = /[\u0400-\u04FF]/;
  const norm = s => s.replace(/([\u0400-\u04FF])['ʼ](?=[\u0400-\u04FF])/g, '$1’');
  const N = Object.create(null);
  Object.keys(DICT).forEach(k => { N[norm(k)] = DICT[k]; });
  const keys = Object.keys(N).sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  const L = '(?<![\\u0400-\\u04FF])', R = '(?![\\u0400-\\u04FF])';
  const RE = new RegExp(keys.map(k =>
    (CYR.test(k[0]) ? L : '') + esc(k) + (CYR.test(k[k.length - 1]) ? R : '')
  ).join('|'), 'g');

  // small context rules (applied before the dictionary)
  const RULES = [[/(\d{4}) рік(?![\u0400-\u04FF])/g, '$1']];
  const CACHE = new Map();

  function core(c) {
    const key = norm(c.replace(/\s+/g, ' '));
    let r = CACHE.get(key);
    if (r !== undefined) return r;
    if (N[key] !== undefined) r = N[key];
    else {
      let t = key;
      RULES.forEach(([re, rep]) => { t = t.replace(re, rep); });
      t = t.replace(RE, m => (N[m] !== undefined ? N[m] : m));
      r = CYR.test(t) ? null : t; // only translate when EVERYTHING is known (user text stays untouched)
    }
    if (CACHE.size > 4000) CACHE.clear();
    CACHE.set(key, r);
    return r;
  }

  function tr(s) {
    if (typeof s !== 'string' || !CYR.test(s)) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    if (!m[2]) return s;
    const o = core(m[2]);
    return o === null ? s : m[1] + o + m[3];
  }

  const trMsg = s => s.split('\n').map(tr).join('\n');

  /* ---------- 4) native accessors (used by the hooks) ---------- */
  const desc = (o, p) => Object.getOwnPropertyDescriptor(o, p);
  const tcD = desc(Node.prototype, 'textContent');
  const nvD = desc(Node.prototype, 'nodeValue');
  const cdD = desc(CharacterData.prototype, 'data');
  const getAttr = Element.prototype.getAttribute;
  const setAttr = Element.prototype.setAttribute;

  const ORIG = new WeakMap();  // Text node -> original (Ukrainian) text
  const ORIGA = new WeakMap(); // Element -> { attribute: original text }
  let count = 0;

  const SKIP_SEL = '[data-no-tr],textarea,[contenteditable=""],[contenteditable="true"],.gs2-result-text,.pl-nw-desc';
  const SKIP_TAG = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  const ATTRS = ['title', 'placeholder', 'alt', 'aria-label', 'label', 'aria-description'];
  const ATTR_SET = { title: 1, placeholder: 1, alt: 1, 'aria-label': 1, label: 1, 'aria-description': 1 };
  const SKIP_ATTR_SEL = '[data-no-tr],[contenteditable=""],[contenteditable="true"],.gs2-result-text,.pl-nw-desc';

  const inSkipped = e => !!(e.closest && e.closest(SKIP_SEL));
  const inSkippedAttr = e => !!(e.closest && e.closest(SKIP_ATTR_SEL)); // text boxes keep their user text, but their placeholder is translated
  const skipEl = e => SKIP_TAG[e.tagName] === 1 || (e.hasAttributes() && e.matches(SKIP_SEL));

  function translateText(n) {
    const s = cdD.get.call(n);
    if (!CYR.test(s)) return;
    const o = tr(s);
    if (o === s) return;
    ORIG.set(n, s); count++;
    cdD.set.call(n, o);
  }

  function translateAttrs(el) {
    if (!el.hasAttributes()) return;
    const list = (el.tagName === 'INPUT' && /^(button|submit|reset)$/.test(el.type)) ? ATTRS.concat('value') : ATTRS;
    for (const a of list) {
      if (!el.hasAttribute(a)) continue;
      const v = getAttr.call(el, a);
      if (!CYR.test(v)) continue;
      const o = tr(v);
      if (o === v) continue;
      let m = ORIGA.get(el); if (!m) { m = {}; ORIGA.set(el, m); }
      m[a] = v;
      setAttr.call(el, a, o);
    }
  }

  const walkerFilter = {
    acceptNode(n) {
      if (n.nodeType !== 1 || !skipEl(n)) return NodeFilter.FILTER_ACCEPT;
      if (n.tagName === 'TEXTAREA') translateAttrs(n);
      return NodeFilter.FILTER_REJECT;
    }
  };

  function translateTree(root) {
    if (!root) return;
    const t = root.nodeType;
    if (t === 3) { if (!root.parentElement || !inSkipped(root.parentElement)) translateText(root); return; }
    if (t === 1) {
      if (skipEl(root)) { if (root.tagName === 'TEXTAREA' && !inSkippedAttr(root)) translateAttrs(root); return; }
      if (inSkipped(root)) return;
      translateAttrs(root);
    }
    else if (t !== 11 && t !== 9) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, walkerFilter);
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) translateText(n); else translateAttrs(n); }
    if (root.content) translateTree(root.content); // <template>
  }

  /* ---------- 5) hooks: translate whatever the app writes later ---------- */
  // reading text gives the ORIGINAL Ukrainian text, so existing logic is not affected
  function collect(el) {
    let s = '';
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) { const o = ORIG.get(n); s += o !== undefined ? o : cdD.get.call(n); }
    return s;
  }

  Object.defineProperty(Node.prototype, 'textContent', {
    configurable: true, enumerable: true,
    get() {
      const t = this.nodeType;
      if (t === 3) { const o = ORIG.get(this); return o !== undefined ? o : tcD.get.call(this); }
      if (count && (t === 1 || t === 11)) return collect(this);
      return tcD.get.call(this);
    },
    set(v) { tcD.set.call(this, v); if (this.nodeType === 3) { ORIG.delete(this); translateTree(this); } else translateTree(this); }
  });

  Object.defineProperty(Node.prototype, 'nodeValue', {
    configurable: true, enumerable: true,
    get() { if (this.nodeType === 3) { const o = ORIG.get(this); if (o !== undefined) return o; } return nvD.get.call(this); },
    set(v) { nvD.set.call(this, v); if (this.nodeType === 3) { ORIG.delete(this); translateTree(this); } }
  });

  Object.defineProperty(CharacterData.prototype, 'data', {
    configurable: true, enumerable: true,
    get() { if (this.nodeType === 3) { const o = ORIG.get(this); if (o !== undefined) return o; } return cdD.get.call(this); },
    set(v) { cdD.set.call(this, v); if (this.nodeType === 3) { ORIG.delete(this); translateTree(this); } }
  });

  // innerHTML / outerHTML / innerText / insertAdjacentHTML
  const ihD = desc(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true, enumerable: true, get: ihD.get,
    set(v) { ihD.set.call(this, v); translateTree(this); }
  });

  const ohD = desc(Element.prototype, 'outerHTML');
  Object.defineProperty(Element.prototype, 'outerHTML', {
    configurable: true, enumerable: true, get: ohD.get,
    set(v) { const p = this.parentNode; ohD.set.call(this, v); translateTree(p); }
  });

  const itD = desc(HTMLElement.prototype, 'innerText');
  Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true, enumerable: true, get: itD.get,
    set(v) { itD.set.call(this, v); translateTree(this); }
  });

  const iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, html) {
    iah.call(this, pos, html);
    const p = String(pos).toLowerCase();
    translateTree(p === 'afterbegin' || p === 'beforeend' ? this : (this.parentNode || this));
  };

  const iat = Element.prototype.insertAdjacentText;
  Element.prototype.insertAdjacentText = function (pos, text) { iat.call(this, pos, tr(String(text))); };

  // text nodes created directly
  const ctn = Document.prototype.createTextNode;
  Document.prototype.createTextNode = function (s) {
    const n = ctn.call(this, s);
    translateText(n);
    return n;
  };

  // string arguments of append / prepend / before / after / replaceWith / replaceChildren
  const textArgs = a => (typeof a === 'string' ? document.createTextNode(a) : a);
  [[Element.prototype, ['append', 'prepend', 'before', 'after', 'replaceWith', 'replaceChildren']],
   [DocumentFragment.prototype, ['append', 'prepend', 'replaceChildren']],
   [CharacterData.prototype, ['before', 'after', 'replaceWith']]].forEach(([proto, names]) => {
    names.forEach(nm => {
      const f = proto[nm];
      if (!f) return;
      proto[nm] = function (...args) { return f.apply(this, args.map(textArgs)); };
    });
  });

  // attributes shown to the user
  Element.prototype.setAttribute = function (name, value) {
    if (typeof value === 'string' && CYR.test(value) && ATTR_SET[String(name).toLowerCase()] && !inSkippedAttr(this)) {
      const o = tr(value);
      if (o !== value) {
        let m = ORIGA.get(this); if (!m) { m = {}; ORIGA.set(this, m); }
        m[String(name).toLowerCase()] = value;
        value = o;
      }
    }
    return setAttr.call(this, name, value);
  };

  [[HTMLElement.prototype, 'title'], [HTMLInputElement.prototype, 'placeholder'],
   [HTMLTextAreaElement.prototype, 'placeholder'], [HTMLImageElement.prototype, 'alt']].forEach(([proto, p]) => {
    const d = desc(proto, p);
    if (!d || !d.set) return;
    Object.defineProperty(proto, p, {
      configurable: true, enumerable: true, get: d.get,
      set(v) { d.set.call(this, (typeof v === 'string' && CYR.test(v) && !inSkippedAttr(this)) ? tr(v) : v); }
    });
  });

  // new Option("text")
  const NativeOption = window.Option;
  window.Option = function (text, value, def, sel) {
    const o = new NativeOption(text, value, def, sel);
    translateTree(o);
    return o;
  };
  window.Option.prototype = NativeOption.prototype;

  // browser dialogs and the page title
  ['alert', 'confirm', 'prompt'].forEach(n => {
    const f = window[n];
    if (typeof f !== 'function') return;
    window[n] = function (m, ...rest) { return f.call(window, typeof m === 'string' ? trMsg(m) : m, ...rest); };
  });

  const dtD = desc(Document.prototype, 'title');
  if (dtD && dtD.set) {
    Object.defineProperty(Document.prototype, 'title', {
      configurable: true, enumerable: true, get: dtD.get, set(v) { dtD.set.call(this, tr(String(v))); }
    });
  }

  /* ---------- 6) one-time passes over everything already on the page ---------- */
  function translateCss() {
    const fix = rules => {
      for (const r of rules) {
        if (r.cssRules && r.cssRules.length) fix(r.cssRules);
        else if (r.style && r.style.content && CYR.test(r.style.content)) {
          r.style.content = r.style.content.replace(/(["'])((?:\\.|(?!\1).)*)\1/g, (m, q, t) => q + tr(t) + q);
        }
      }
    };
    for (const sh of Array.from(document.styleSheets)) { try { fix(sh.cssRules); } catch (_) {} }
  }

  function pass() {
    try { translateTree(document.documentElement); translateCss(); document.title = document.title; }
    catch (e) { console.warn('Translation pass failed:', e); }
  }

  pass();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { addSelector(); pass(); });
  } else {
    setTimeout(() => { addSelector(); pass(); }, 0);
  }
  window.addEventListener('load', () => { addSelector(); pass(); setTimeout(pass, 1500); });

  /* ---------- 7) helper for the console: list Ukrainian text that is still not translated ---------- */
  window.tdTranslate = {
    lang: 'en', tr,
    scan: pass,
    missing() {
      const out = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(n) { return n.parentElement && (SKIP_TAG[n.parentElement.tagName] || inSkipped(n.parentElement)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
      });
      let n;
      while ((n = w.nextNode())) { const s = cdD.get.call(n); if (CYR.test(s)) out.add(s.trim()); }
      return Array.from(out);
    }
  };
})();
// =========================================================================
// END LANGUAGE SWITCH (UK / EN)
// =========================================================================



/* ===== START DATA EXCHANGE (export / import file with smart merge) ===================
   Settings -> "Data exchange between copies of the app":
     Export  = saves notes, planner events and settings to clock-data-DATE.json (Downloads)
     Import  = merges such a file into this copy of the app (nothing is simply overwritten)
   Works the same in the browser (Hugging Face) and in the installed apps. No account, no site.
   ================================================================================== */
(() => {
  'use strict';
  if (window.tdXfer) return;

  const ST = Storage.prototype;
  const rawGet = ST.getItem, rawSet = ST.setItem, rawRemove = ST.removeItem, rawClear = ST.clear;
  const ls = window.localStorage;
  const get = k => { try { return rawGet.call(ls, k); } catch (_) { return null; } };
  const put = (k, v) => { try { rawSet.call(ls, k, v); } catch (_) {} };
  const drop = k => { try { rawRemove.call(ls, k); } catch (_) {} };

  const MAX_LEN = 300000;       // longer values (photos, big sounds) are not exchanged
  // not exchanged: own bookkeeping, running alarm state, widget position, per-PC eco mode
  const SKIP = [
    /^td-sync-/,
    /^alarm\d*-(v|snz|abs-start|start-moment|triggered-moment)$/,
    /^alarm-in$/,
    /^(w_left|w_top)$/,
    /^eco_mode_active$/
  ];
  const skipped = k => SKIP.some(r => r.test(k));
  const ALWAYS = /^(calendar_notes|calendar_planner)$/;     // notes and events are exchanged whatever their size
  const K_BASE = 'td-sync-base', K_LW = 'td-sync-lw';

  const EN = get('app-lang') === 'en';
  const TXT = EN ? {
    title: '💾 Data exchange between copies of the app',
    exp: '⬇ Export data', imp: '⬆ Import data', how: 'How it works',
    help: 'Export saves notes, planner events and settings to a file in your Downloads folder.<br>' +
          'Copy that file to the other computer (USB stick, shared folder, …) and press “Import data” there.<br>' +
          'Import MERGES: entries from both copies are kept, for the same entry the newer one wins, deletions are carried over.<br>' +
          'Not exchanged: running alarms, widget position, eco mode, values over 300 KB (photos).',
    done: 'Exported', keys: 'keys', notes: 'notes (days)', events: 'events (days)', sets: 'settings', big: 'too big (skipped)', imported: 'Imported', changed: 'changed here',
    bad: 'This is not a data file of the app', read: 'Could not read the file', reload: 'reloading…', same: 'Nothing to change — already identical'
  } : {
    title: '💾 Обмін даними між копіями додатку',
    exp: '⬇ Експорт даних', imp: '⬆ Імпорт даних', how: 'Як це працює',
    help: 'Експорт зберігає нотатки, події планувальника та налаштування у файл у папці «Завантаження».<br>' +
          'Скопіюйте цей файл на інший комп’ютер (флешка, спільна папка …) і натисніть там «Імпорт даних».<br>' +
          'Імпорт ОБ’ЄДНУЄ: записи з обох копій зберігаються, для того самого запису перемагає новіший, видалення переносяться.<br>' +
          'Не переносяться: запущені будильники, позиція віджета, еко-режим, значення понад 300 КБ (фото).',
    done: 'Експортовано', keys: 'ключів', notes: 'нотатки (днів)', events: 'події (днів)', sets: 'налаштування', big: 'завеликі (пропущено)', imported: 'Імпортовано', changed: 'змінено тут',
    bad: 'Це не файл даних цього додатку', read: 'Не вдалося прочитати файл', reload: 'перезавантаження…', same: 'Нічого міняти — дані вже однакові'
  };

  /* ---------- 1) remember when each key was last changed on THIS copy ---------- */
  let lw = {};
  try { lw = JSON.parse(get(K_LW) || '{}') || {}; } catch (_) { lw = {}; }
  let lwTimer = 0;
  const saveLw = () => { lwTimer = 0; put(K_LW, JSON.stringify(lw)); };
  function onWrite(k) {
    if (skipped(k)) return;
    lw[k] = Date.now();
    if (!lwTimer) lwTimer = setTimeout(saveLw, 2000);
  }
  ST.setItem = function (k, v) { rawSet.call(this, k, v); if (this === ls) onWrite(String(k)); };
  ST.removeItem = function (k) { rawRemove.call(this, k); if (this === ls) onWrite(String(k)); };
  ST.clear = function () {
    const keys = []; if (this === ls) for (let i = 0; i < ls.length; i++) keys.push(ls.key(i));
    rawClear.call(this);
    keys.forEach(onWrite);
  };

  /* ---------- 2) three-way merge ---------- */
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  // l = this copy, b = state at the last exchange, r = file; tl/tr = time of last change (newer wins on a real conflict)
  function m3(l, b, r, tl, tr) {
    if (eq(l, r)) return l;
    if (eq(l, b)) return r;
    if (eq(r, b)) return l;
    if (isObj(l) && isObj(r)) {
      const bb = isObj(b) ? b : {};
      const out = {};
      new Set([...Object.keys(l), ...Object.keys(bb), ...Object.keys(r)]).forEach(k => {
        const v = m3(l[k], bb[k], r[k], tl, tr);
        if (v !== undefined) out[k] = v;
      });
      return out;
    }
    return tl > tr ? l : r;
  }
  const parseObj = s => { if (s == null) return undefined; try { const o = JSON.parse(s); return isObj(o) ? o : NaN; } catch (_) { return NaN; } };
  function mergeKey(L, B, R, tl, tr) {            // strings or null (= absent)
    if (L === R) return L;
    if (L === B) return R;
    if (R === B) return L;
    const lo = parseObj(L), bo = parseObj(B), ro = parseObj(R);
    if (isObj(lo) && isObj(ro) && (bo === undefined || isObj(bo))) return JSON.stringify(m3(lo, bo || {}, ro, tl, tr));
    return tl > tr ? L : R;
  }
  function localMap() {
    const m = {}, big = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (skipped(k)) continue;
      const v = rawGet.call(ls, k);
      if (v == null) continue;
      if (v.length > MAX_LEN && !ALWAYS.test(k)) { big.push(k); continue; }
      m[k] = v;
    }
    return { m, big };
  }
  function mergeIn(file) {
    const { m: local, big } = localMap();
    let base = {}; try { base = JSON.parse(get(K_BASE) || '{}') || {}; } catch (_) { base = {}; }
    const rk = file.keys || {};
    const applyLocal = [], nextBase = {};
    new Set([...Object.keys(local), ...Object.keys(base), ...Object.keys(rk)]).forEach(k => {
      if (skipped(k)) return;
      const rec = rk[k];
      const L = k in local ? local[k] : null;
      const B = k in base ? base[k] : null;
      const R = rec && typeof rec.v === 'string' ? rec.v : null;
      const v = mergeKey(L, B, R, lw[k] || 0, rec ? (rec.t || 0) : 0);
      if (v !== L) applyLocal.push([k, v]);
      if (v !== null) nextBase[k] = v;
    });
    return { applyLocal, nextBase, big };
  }

  /* ---------- 3) export / import ---------- */
  const pad = n => String(n).padStart(2, '0');
  const days = s => { try { return Object.keys(JSON.parse(s || '{}')).length; } catch (_) { return 0; } };
  function doExport() {
    const now = new Date();
    const { m, big } = localMap();
    const keys = {};
    Object.keys(m).forEach(k => { keys[k] = { v: m[k], t: lw[k] || now.getTime() }; });
    const data = { app: 'clock-data', v: 1, exported: now.toISOString(), keys };
    const name = 'clock-data-' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                 '_' + pad(now.getHours()) + '-' + pad(now.getMinutes()) + '.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    put(K_BASE, JSON.stringify(m));                    // this is now the shared state
    saveLw();
    return TXT.done + ': ' + name + ' · ' + TXT.notes + ': ' + days(m.calendar_notes) + ' · ' + TXT.events + ': ' + days(m.calendar_planner) +
           ' · ' + TXT.sets + ': ' + (Object.keys(m).length - (m.calendar_notes != null) - (m.calendar_planner != null)) +
           (big.length ? ' · ' + big.length + ' ' + TXT.big : '');
  }
  async function doImport(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (_) { return TXT.read; }
    if (!data || data.app !== 'clock-data' || !data.keys || typeof data.keys !== 'object') return TXT.bad;
    const res = mergeIn(data);
    res.applyLocal.forEach(([k, v]) => { if (v === null) drop(k); else put(k, v); });
    put(K_BASE, JSON.stringify(res.nextBase));
    saveLw();
    if (!res.applyLocal.length) return TXT.same;
    setTimeout(() => location.reload(), 1200);         // show the new data
    const fk = data.keys;
    return TXT.imported + ' · ' + TXT.notes + ': ' + days(fk.calendar_notes && fk.calendar_notes.v) + ' · ' + TXT.events + ': ' + days(fk.calendar_planner && fk.calendar_planner.v) +
           ' · ' + TXT.changed + ': ' + res.applyLocal.length + ' · ' + TXT.reload;
  }

  /* ---------- 4) settings panel ---------- */
  function buildUI() {
    const panel = document.getElementById('panel');
    if (!panel) return false;
    if (document.getElementById('td-xfer-box')) return true;
    const box = document.createElement('div');
    box.id = 'td-xfer-box';
    box.setAttribute('data-no-tr', '1');
    box.style.cssText = 'margin:10px 0 14px;padding:10px 0;border-bottom:1px solid #eee;font-size:0.9rem;';
    box.innerHTML =
      '<div style="font-weight:700;margin-bottom:8px;">' + TXT.title + '</div>' +
      '<div class="row" style="gap:8px;">' +
        '<button type="button" id="td-xfer-export" style="flex:1;padding:7px 10px;cursor:pointer;">' + TXT.exp + '</button>' +
        '<button type="button" id="td-xfer-import" style="flex:1;padding:7px 10px;cursor:pointer;">' + TXT.imp + '</button>' +
        '<input type="file" id="td-xfer-file" accept=".json,application/json" style="display:none;">' +
      '</div>' +
      '<div id="td-xfer-status" style="font-size:12px;color:#444;margin:4px 0 8px;word-break:break-word;"></div>' +
      '<details><summary style="cursor:pointer;font-size:12px;">' + TXT.how + '</summary>' +
      '<div style="font-size:12px;color:#444;margin-top:6px;line-height:1.5;">' + TXT.help + '</div></details>';
    const anchor = document.getElementById('td-lang-row') || panel.querySelector('h2');
    if (anchor) anchor.after(box); else panel.prepend(box);

    const status = box.querySelector('#td-xfer-status');
    const fileInput = box.querySelector('#td-xfer-file');
    box.querySelector('#td-xfer-export').addEventListener('click', () => { status.textContent = doExport(); });
    box.querySelector('#td-xfer-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      status.textContent = await doImport(f);
      fileInput.value = '';
    });
    return true;
  }
  let tries = 0;
  const uiTimer = setInterval(() => { if (buildUI() || ++tries > 60) clearInterval(uiTimer); }, 500);

  window.tdXfer = { export: doExport, import: doImport, mergeKey };
})();
/* ===== END DATA EXCHANGE ============================================================ */