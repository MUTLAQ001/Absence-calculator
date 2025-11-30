(function () {
    try {
        var u = 'https://mutlaq001.github.io/Absence-calculator/'; // الرابط الصحيح

        // 1. العثور على الصفحة (الإطار) الذي يحتوي على الجدول
        function getAllDocuments() {
            var docs = [document];
            try {
                if (window.frames && window.frames.length > 0) {
                    for (var i = 0; i < window.frames.length; i++) {
                        try {
                            docs.push(window.frames[i].document);
                        } catch (e) { } // تجاوز أخطاء CORS
                    }
                }
            } catch (e) {}
            return docs;
        }

        var docs = getAllDocuments();
        var links = [];
        
        // البحث عن المواد في كل الإطارات
        for (var i = 0; i < docs.length; i++) {
            var doc = docs[i];
            if (!doc) continue;
            var found = doc.querySelectorAll('a[id^="Href"]');
            if (found && found.length > 0) {
                for(var j=0; j<found.length; j++) links.push(found[j]);
            }
        }

        if (links.length === 0) {
            alert('لم يتم العثور على بيانات الجدول. تأكد أنك في صفحة "المقررات المسجلة" أو "Student Detail Schedule".');
            return;
        }

        var c = {};

        function gH(s) {
            if (!s) return 0;
            // تحسين النمط لاستقبال التوقيت بمسافات أو بدون
            var m = s.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
            if (!m) return 0;
            var t1 = m[1].split(/[.:]/);
            var t2 = m[2].split(/[.:]/);
            var m1 = parseInt(t1[0]) * 60 + parseInt(t1[1]);
            var m2 = parseInt(t2[0]) * 60 + parseInt(t2[1]);
            var d = m2 - m1;
            // معالجة فرق التوقيت الصباحي والمسائي التقريبي (نظام 12 ساعة)
            if (d < 0) d += 720; 
            return Math.round((d / 50) * 2) / 2;
        }

        for (var i = 0; i < links.length; i++) {
            var a = links[i];
            var n = a.textContent.replace(/<!--.*?-->/g, '').trim();
            var r = a.closest('tr');
            if (!r) continue;
            var txt = r.innerText || r.textContent;
            var hr = gH(txt);

            if (hr > 0) {
                var dy = "";
                if (txt.match(/(U|الأحد)/)) dy = "الأحد";
                else if (txt.match(/(M|Monday|الإثنين|الاثنين)/)) dy = "الاثنين";
                else if (txt.match(/(T|Tuesday|الثلاثاء)/) && !txt.match(/Thursday|الخميس/)) dy = "الثلاثاء";
                else if (txt.match(/(W|Wednesday|الأربعاء)/)) dy = "الأربعاء";
                else if (txt.match(/(R|Thursday|الخميس)/)) dy = "الخميس";
                else dy = "محاضرة";

                if (!c[n]) c[n] = { t: 0, d: [] };

                // منع التكرار لنفس الوقت واليوم
                var ex = c[n].d.some(function (x) { return x.day === dy && x.hours === hr; });
                if (!ex || dy === "محاضرة") {
                    c[n].t += hr;
                    c[n].d.push({ day: dy, hours: hr });
                }
            }
        }

        var res = [];
        for (var k in c) {
            res.push({
                name: k,
                lectureHours: c[k].t,
                absenceHours: 0,
                id: Date.now() + Math.random(),
                lastUpdated: Date.now() // إضافة هذا الحقل
            });
        }
        
        if (res.length === 0) {
            alert("وجدنا أسماء مواد لكن لم نستطع استخراج الأوقات. هل الجدول يحتوي أوقات؟");
            return;
        }

        // استخدام Top للخروج من ال iframe إذا وجد
        window.top.location.href = u + '?import=' + encodeURIComponent(JSON.stringify(res));

    } catch (e) {
        alert("حدث خطأ: " + e.message);
    }
})();
