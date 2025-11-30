(function () {
    try {
        const targetUrl = 'https://mutlaq001.github.io/Absence-calculator/';
        const MAX_WAIT_TIME = 7000; // 7 ثوانٍ كحد أقصى للانتظار

        function parseDuration(timeText) {
            if (!timeText) return 0;
            // النمط يدعم الصيغتين "8.0-9.40" و "08:00 - 09:50"
            const match = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            if (!match) return 0;

            const [, h1, m1, h2, m2] = match.map(Number);
            let startMinutes = h1 * 60 + m1;
            let endMinutes = h2 * 60 + m2;
            
            // التعامل مع نظام 12 ساعة إذا كان الوقت المسائي أكبر
            if (endMinutes < startMinutes) endMinutes += 720; 
            
            const diff = endMinutes - startMinutes;
            // كل 50 دقيقة = ساعة أكاديمية
            return Math.round((diff / 50) * 2) / 2;
        }

        function getDayFromColumn(cell) {
            // البحث عن الجدول الأب للوصول إلى الصف الأول (الترويسة)
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
            // *** هذا هو السطر الذي تم تصحيحه ***
            const links = doc.querySelectorAll('a[id^="Href"][class*="calendarStyle"]');
            
            if (links.length === 0) {
                console.log("Extractor: لم يتم العثور على روابط مواد حتى الآن.");
                return null; // لا توجد بيانات بعد
            }
            console.log(`Extractor: تم العثور على ${links.length} رابط محتمل.`);

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
                
                // منع التكرار في حال وجود نفس المحاضرة مرتين في نفس الخلية
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
                // استخدام window.top للخروج من أي إطار (frame)
                window.top.location.href = targetUrl + '?import=' + encodeURIComponent(JSON.stringify(data));
             } else {
                alert('لم يتم العثور على مقررات قابلة للاستخراج في الجدول.');
             }
        }
        
        function findAndObserve() {
            let foundTable = false;
            // البحث في الصفحة الرئيسية وفي كل الإطارات داخلها
            const allDocs = [document, ...Array.from(window.frames).map(f => f.document).filter(Boolean)];
            
            for (const doc of allDocs) {
                const calendarTable = doc.getElementById('calendarTable');
                if (calendarTable) {
                    foundTable = true;
                    
                    // 1. المحاولة الفورية لاستخراج البيانات
                    console.log("تم العثور على الجدول، محاولة الاستخراج الفوري...");
                    const initialData = runExtractor(doc);
                    if (initialData) {
                        processAndRedirect(initialData);
                        return; // تمت المهمة بنجاح
                    }
                    
                    // 2. إذا فشلت المحاولة الأولى (الجدول فارغ)، نبدأ المراقبة
                    console.log("الجدول فارغ، سيتم تفعيل المراقب...");
                    
                    const timeout = setTimeout(() => {
                        observer.disconnect();
                        alert('انتهى وقت الانتظار ولم يتم تحديث الجدول. حاول تحديث الصفحة ثم جرب مرة أخرى.');
                    }, MAX_WAIT_TIME);

                    const observer = new MutationObserver((mutations, obs) => {
                        // عند حدوث أي تغيير في الجدول، نحاول الاستخراج مجدداً
                        console.log("تم رصد تغيير في الجدول، إعادة محاولة الاستخراج...");
                        const finalData = runExtractor(doc);
                        if (finalData) { // إذا نجحت العملية
                            clearTimeout(timeout); // إيقاف مؤقت الفشل
                            obs.disconnect(); // إيقاف المراقبة
                            processAndRedirect(finalData); // إرسال البيانات
                        }
                    });

                    // ابدأ بمراقبة الجدول الرئيسي لأي تغييرات في محتواه
                    observer.observe(calendarTable, { childList: true, subtree: true });
                    break; 
                }
            }
            if (!foundTable) {
                alert('لم يتم العثور على هيكل الجدول الدراسي (calendarTable). تأكد أنك في الصفحة الصحيحة.');
            }
        }

        findAndObserve();

    } catch (e) {
        alert("حدث خطأ غير متوقع أثناء تشغيل الأداة: " + e.message);
        console.error("Absence Calculator Extractor Error:", e);
    }
})();
