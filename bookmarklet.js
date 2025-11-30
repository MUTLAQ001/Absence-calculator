(function () {
    try {
        var targetUrl = 'https://mutlaq001.github.io/Absence-calculator/';

        // دالة لاستخراج اليوم بناءً على موقع العمود في الجدول
        function getDayNameFromHeader(table, cellIndex) {
            try {
                // الصف الأول يحتوي على أيام الأسبوع
                // الهيكل: [حد] [فراغ] [وقت] [فراغ] [أحد] [فراغ] [اثنين]...
                var rows = table.rows;
                if (rows.length > 0) {
                    var headerCells = rows[0].cells;
                    if (headerCells[cellIndex]) {
                        var txt = headerCells[cellIndex].innerText || headerCells[cellIndex].textContent;
                        txt = txt.trim();
                        if (txt.match(/U|Sun|الأحد|الاحد/i)) return "الأحد";
                        if (txt.match(/M|Mon|الإثنين|الاثنين/i)) return "الاثنين";
                        if (txt.match(/T|Tue|الثلاثاء/i)) return "الثلاثاء";
                        if (txt.match(/W|Wed|الأربعاء|الاربعاء/i)) return "الأربعاء";
                        if (txt.match(/R|Thu|الخميس/i)) return "الخميس";
                    }
                }
            } catch (e) { console.error(e); }
            return "";
        }

        // دالة لحساب الساعات من النص مثل "8.0-9.40" أو "08:00 - 09:50"
        function parseDuration(timeText) {
            if (!timeText) return 0;
            // دعم النقطة (.) والنقطتين (:) كفاصل
            var m = timeText.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
            if (!m) return 0;
            
            var h1 = parseInt(m[1]), m1 = parseInt(m[2]);
            var h2 = parseInt(m[3]), m2 = parseInt(m[4]);
            
            // تحويل الكل إلى دقائق
            var start = h1 * 60 + m1;
            var end = h2 * 60 + m2;
            
            // تصحيح التوقيت (نظام 12 ساعة) إذا كان الناتج سالب
            if (end < start) end += 720; // إضافة 12 ساعة
            
            var diff = end - start;
            
            // القاعدة: كل 50 دقيقة تحسب ساعة أكاديمية واحدة
            // 50 دقيقة = 1 ساعة، 100 دقيقة = 2 ساعة
            return Math.round((diff / 50) * 2) / 2;
        }

        // تجميع المستندات من الصفحة الحالية وأي إطارات (Frames)
        var allDocs = [document];
        try {
            if (window.frames.length > 0) {
                for (var i = 0; i < window.frames.length; i++) {
                    try { allDocs.push(window.frames[i].document); } catch (e) { }
                }
            }
        } catch (e) { }

        var coursesMap = {}; // لتخزين المواد ومنع التكرار
        var foundData = false;

        allDocs.forEach(function(doc) {
            // البحث عن الروابط التي تحتوي أسماء المواد (معرفاتها تبدأ بـ Href)
            var links = doc.querySelectorAll('a[id^="Href"]');
            
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                var courseName = link.textContent.replace(/<!--.*?-->/g, '').trim(); // تنظيف الاسم
                if (!courseName) continue;

                // الصعود للأعلى للعثور على الجدول الصغير داخل الخلية
                // الهيكل: a -> td -> tr -> tbody -> table (صغير) -> td (خلية اليوم في الجدول الكبير)
                var miniTable = link.closest('table'); 
                
                // البحث عن النص الذي يحتوي الوقت في الجدول الصغير (عادة في الصفوف التي تسبق الرابط)
                var timeText = "";
                if (miniTable) {
                    timeText = miniTable.innerText || miniTable.textContent; 
                }

                // حساب الساعات
                var hours = parseDuration(timeText);
                if (hours === 0) continue; // تخطي إذا لم نجد وقتاً

                // تحديد اليوم
                var mainCell = link.closest('td[class="eventBodyCalendar"]'); // الخلية في الجدول الكبير
                var dayName = "غير محدد";
                
                if (mainCell) {
                    var mainTable = mainCell.closest('table[id="calendarTable"]'); // الجدول الكبير
                    if (mainTable) {
                        dayName = getDayNameFromHeader(mainTable, mainCell.cellIndex);
                    }
                }

                // تخزين البيانات
                foundData = true;
                if (!coursesMap[courseName]) {
                    coursesMap[courseName] = { totalHours: 0, slots: [] };
                }

                // التحقق من عدم تكرار نفس "السلوت" لنفس المادة (مثلاً نفس المحاضرة مسجلة مرتين في الكود)
                var isDuplicate = coursesMap[courseName].slots.some(function(s) {
                    return s.day === dayName && s.hours === hours && Math.abs(timeText.indexOf(s.rawTime)) > -1;
                });

                if (!isDuplicate) {
                    coursesMap[courseName].totalHours += hours;
                    coursesMap[courseName].slots.push({
                        day: dayName,
                        hours: hours,
                        rawTime: timeText
                    });
                }
            }
        });

        if (!foundData) {
            alert('لم يتم العثور على جدول في هذه الصفحة. الرجاء الذهاب لصفحة "الجدول الدراسي الأسبوعي" التي تظهر المربعات.');
            return;
        }

        // تحضير النتيجة النهائية
        var resultList = [];
        for (var key in coursesMap) {
            resultList.push({
                name: key,
                lectureHours: coursesMap[key].totalHours,
                absenceHours: 0,
                id: Date.now() + Math.random(),
                lastUpdated: Date.now()
            });
        }

        // الانتقال للموقع مع البيانات
        window.top.location.href = targetUrl + '?import=' + encodeURIComponent(JSON.stringify(resultList));

    } catch (e) {
        alert("حدث خطأ أثناء سحب الجدول: " + e.message);
    }
})();
