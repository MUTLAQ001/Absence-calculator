(function () {
    try {
        const targetUrl = 'https://mutlaq001.github.io/Absence-calculator/';
        const MAX_WAIT_TIME = 7000; // 7 ثوانٍ كحد أقصى للانتظار

        function parseDuration(timeText) {
            if (!timeText) return 0;
            const match = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            if (!match) return 0;

            const [, h1, m1, h2, m2] = match.map(Number);
            const startMinutes = h1 * 60 + m1;
            let endMinutes = h2 * 60 + m2;
            
            if (endMinutes < startMinutes) endMinutes += 720; // Handle PM times without AM/PM marker

            const diff = endMinutes - startMinutes;
            return Math.round((diff / 50) * 2) / 2; // Each 50 min is an academic hour
        }

        function getDayFromColumn(cell) {
            const table = cell.closest('table[id^="calendarTable"]');
            if (!table || !table.rows[0]) return "غير محدد";
            
            const headerCell = table.rows[0].cells[cell.cellIndex];
            if (!headerCell) return "غير محدد";

            const dayText = (headerCell.innerText || headerCell.textContent).trim();
            if (dayText.includes("الاحد")) return "الأحد";
            if (dayText.includes("الاثنين")) return "الاثنين";
            if (dayText.includes("الثلاثاء")) return "الثلاثاء";
            if (dayText.includes("الاربعاء")) return "الأربعاء";
            if (dayText.includes("الخميس")) return "الخميس";
            
            return "غير محدد";
        }

        function runExtractor(doc) {
            const courses = {};
            const links = doc.querySelectorAll('a[id^="Href"].calendarStyle');
            
            if (links.length === 0) return null; // لا توجد بيانات بعد

            links.forEach(link => {
                const courseName = link.textContent.replace(/<!--.*?-->/g, '').trim();
                if (!courseName) return;

                const miniTable = link.closest('table');
                const timeText = miniTable ? (miniTable.innerText || miniTable.textContent) : '';
                const hours = parseDuration(timeText);
                
                if (hours === 0) return;
                
                const mainCell = link.closest('td.eventBodyCalendar');
                const day = mainCell ? getDayFromColumn(mainCell) : "غير محدد";

                if (!courses[courseName]) {
                    courses[courseName] = { totalHours: 0, slots: new Set() };
                }

                // استخدام Set لمنع إضافة نفس المحاضرة مرتين
                const slotId = `${day}-${timeText.trim()}`;
                if (!courses[courseName].slots.has(slotId)) {
                    courses[courseName].totalHours += hours;
                    courses[courseName].slots.add(slotId);
                }
            });

            const result = Object.entries(courses).map(([name, data]) => ({
                name: name,
                lectureHours: data.totalHours,
                absenceHours: 0,
                id: Date.now() + Math.random(),
                lastUpdated: Date.now()
            }));

            return result.length > 0 ? result : null;
        }

        function processAndRedirect(data) {
             if (data && data.length > 0) {
                console.log(`تم استخراج ${data.length} مقررات، جارِ التحويل...`);
                window.top.location.href = targetUrl + '?import=' + encodeURIComponent(JSON.stringify(data));
             } else {
                alert('لم يتم العثور على مقررات في الجدول.');
             }
        }
        
        function findAndObserve() {
            let found = false;
            const allDocs = [document, ...Array.from(window.frames).map(f => f.document).filter(Boolean)];
            
            for (const doc of allDocs) {
                const calendarTable = doc.getElementById('calendarTable');
                if (calendarTable) {
                    found = true;
                    
                    // محاولة فورية
                    const initialData = runExtractor(doc);
                    if (initialData) {
                        processAndRedirect(initialData);
                        return;
                    }
                    
                    // إذا فشلت، قم بالمراقبة
                    console.log("الجدول فارغ، سيتم تفعيل المراقب...");
                    
                    const timeout = setTimeout(() => {
                        observer.disconnect();
                        alert('انتهى وقت الانتظار ولم يتم العثور على بيانات الجدول.');
                    }, MAX_WAIT_TIME);

                    const observer = new MutationObserver((mutations, obs) => {
                        const finalData = runExtractor(doc);
                        if (finalData) {
                            clearTimeout(timeout);
                            obs.disconnect();
                            processAndRedirect(finalData);
                        }
                    });

                    observer.observe(calendarTable, { childList: true, subtree: true });
                    break; 
                }
            }
            if (!found) {
                alert('لم يتم العثور على عنصر الجدول (calendarTable). تأكد أنك في صفحة الجدول الأسبوعي.');
            }
        }

        findAndObserve();

    } catch (e) {
        alert("حدث خطأ غير متوقع: " + e.message);
    }
})();
