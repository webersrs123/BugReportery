// form.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bugForm');
    const saveBtn = document.getElementById('saveBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const resetBtn = document.getElementById('resetBtn');
    const messageDiv = document.getElementById('message');
    const showReportsLink = document.getElementById('showReportsLink');
    const reportsSection = document.getElementById('reportsListSection');
    const reportsListDiv = document.getElementById('reportsList');

    // ==== Вспомогательные функции ====
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function formatSteps(text) {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length <= 1) return escapeHtml(text).replace(/\n/g, '<br>');
        return '<ol style="margin: 0; padding-left: 20px;">' +
            lines.map(l => `<li style="margin-bottom: 5px;">${escapeHtml(l.trim())}</li>`).join('') +
            '</ol>';
    }

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = 'form-message ' + type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'form-message';
        }, 3000);
    }

    // ==== Работа с localStorage ====
    function getReports() {
        const reports = localStorage.getItem('bugReports');
        return reports ? JSON.parse(reports) : [];
    }

    function saveReports(reports) {
        localStorage.setItem('bugReports', JSON.stringify(reports));
    }

    function saveCurrentReport() {
        const bugId = document.getElementById('bugId').value.trim();
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const steps = document.getElementById('steps').value.trim();
        const expected = document.getElementById('expected').value.trim();
        const actual = document.getElementById('actual').value.trim();

        if (!bugId || !title || !description || !steps || !expected || !actual) {
            showMessage('Пожалуйста, заполните все обязательные поля (отмечены *).', 'error');
            return false;
        }

        const attachmentsInput = document.getElementById('attachments');
        const imageFiles = attachmentsInput && attachmentsInput.files ? Array.from(attachmentsInput.files) : [];

        const report = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            bugId: bugId,
            title: title,
            project: document.getElementById('project').value.trim(),
            author: document.getElementById('author').value.trim(),
            severity: document.getElementById('severity').value,
            priority: document.getElementById('priority').value,
            bugType: document.getElementById('bugType').value,
            status: document.getElementById('status').value,
            environment: {
                device: document.getElementById('envDevice').value.trim(),
                os: document.getElementById('envOS').value.trim(),
                browser: document.getElementById('envBrowser').value.trim(),
                resolution: document.getElementById('envResolution').value.trim(),
                url: document.getElementById('envURL').value.trim()
            },
            description: description,
            steps: steps,
            expected: expected,
            actual: actual,
            additionalInfo: document.getElementById('additionalInfo').value.trim(),
        };

        const reports = getReports();
        reports.push(report);
        saveReports(reports);

        form.reset();
        document.getElementById('severity').value = '';
        document.getElementById('priority').value = '';
        document.getElementById('bugType').value = '';
        document.getElementById('status').value = 'Открыт';
        if (attachmentsInput) attachmentsInput.value = '';

        showMessage('Репорт успешно сохранён!', 'success');
        if (reportsSection.style.display !== 'none') displayReports();
        return true;
    }

    function displayReports() {
        const reports = getReports();
        if (reports.length === 0) {
            reportsListDiv.innerHTML = '<p>Нет сохранённых репортов.</p>';
            return;
        }
        reports.sort((a,b) => b.id - a.id);
        let html = '';
        reports.forEach(r => {
            html += `
                <div class="report-item">
                    <strong>${escapeHtml(r.bugId)}</strong> — ${escapeHtml(r.title)}<br>
                    <span class="meta">${r.date} | ${r.project || '—'} | Статус: ${r.status || 'Открыт'}</span>
                    <div class="report-actions">
                        <button class="view-report" data-id="${r.id}">Просмотр</button>
                        <button class="delete-report" data-id="${r.id}">Удалить</button>
                    </div>
                </div>
            `;
        });
        reportsListDiv.innerHTML = html;

        document.querySelectorAll('.view-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-id'));
                viewReport(id);
            });
        });
        document.querySelectorAll('.delete-report').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-id'));
                if (confirm('Удалить репорт?')) {
                    let reports = getReports();
                    reports = reports.filter(r => r.id !== id);
                    saveReports(reports);
                    displayReports();
                }
            });
        });
    }

    function viewReport(id) {
        const reports = getReports();
        const report = reports.find(r => r.id === id);
        if (!report) return;

        document.getElementById('bugId').value = report.bugId;
        document.getElementById('title').value = report.title;
        document.getElementById('project').value = report.project || '';
        document.getElementById('author').value = report.author || '';
        document.getElementById('severity').value = report.severity || '';
        document.getElementById('priority').value = report.priority || '';
        document.getElementById('bugType').value = report.bugType || '';
        document.getElementById('status').value = report.status || 'Открыт';
        document.getElementById('envDevice').value = report.environment?.device || '';
        document.getElementById('envOS').value = report.environment?.os || '';
        document.getElementById('envBrowser').value = report.environment?.browser || '';
        document.getElementById('envResolution').value = report.environment?.resolution || '';
        document.getElementById('envURL').value = report.environment?.url || '';
        document.getElementById('description').value = report.description;
        document.getElementById('steps').value = report.steps;
        document.getElementById('expected').value = report.expected;
        document.getElementById('actual').value = report.actual;
        document.getElementById('additionalInfo').value = report.additionalInfo || '';

        form.scrollIntoView({ behavior: 'smooth' });
        showMessage('Репорт загружен. Вы можете отредактировать и сохранить как новый.', 'success');
    }

    // ==== Экспорт в PDF (jsPDF + html2canvas) — стабильная версия ====
    async function exportToPDF() {
        showMessage('Генерация PDF... Подождите', 'success');

        const formData = {
            bugId: document.getElementById('bugId').value.trim() || 'не указан',
            title: document.getElementById('title').value.trim() || 'не указано',
            project: document.getElementById('project').value.trim() || 'не указан',
            author: document.getElementById('author').value.trim() || 'не указан',
            severity: document.getElementById('severity').value || 'не выбрана',
            priority: document.getElementById('priority').value || 'не выбран',
            bugType: document.getElementById('bugType').value || 'не выбран',
            status: document.getElementById('status').value || 'не указан',
            environment: {
                device: document.getElementById('envDevice').value.trim() || '—',
                os: document.getElementById('envOS').value.trim() || '—',
                browser: document.getElementById('envBrowser').value.trim() || '—',
                resolution: document.getElementById('envResolution').value.trim() || '—',
                url: document.getElementById('envURL').value.trim() || '—'
            },
            description: document.getElementById('description').value.trim() || '—',
            steps: document.getElementById('steps').value.trim() || '—',
            expected: document.getElementById('expected').value.trim() || '—',
            actual: document.getElementById('actual').value.trim() || '—',
            additionalInfo: document.getElementById('additionalInfo').value.trim() || '—'
        };

        const attachmentsInput = document.getElementById('attachments');
        const imageFiles = attachmentsInput && attachmentsInput.files ? Array.from(attachmentsInput.files).filter(f => f.type.startsWith('image/')) : [];

        // ----- 1. Текстовая часть -----
        const textContent = document.createElement('div');
        textContent.style.width = '800px';
        textContent.style.margin = '0 auto';
        textContent.style.fontFamily = 'Arial, sans-serif';
        textContent.style.fontSize = '12pt';
        textContent.style.lineHeight = '1.4';
        textContent.style.padding = '20px';
        textContent.style.backgroundColor = '#fff';
        textContent.innerHTML = `
            <h1 style="font-size: 20pt;">Баг-репорт</h1>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 20px;">
                <div><strong>ID:</strong> ${escapeHtml(formData.bugId)}</div>
                <div><strong>Название:</strong> ${escapeHtml(formData.title)}</div>
                <div><strong>Проект:</strong> ${escapeHtml(formData.project)}</div>
                <div><strong>Автор:</strong> ${escapeHtml(formData.author)}</div>
                <div><strong>Серьёзность:</strong> ${formData.severity}</div>
                <div><strong>Приоритет:</strong> ${formData.priority}</div>
                <div><strong>Тип бага:</strong> ${formData.bugType}</div>
                <div><strong>Статус:</strong> ${formData.status}</div>
            </div>

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">

            <div style="margin-bottom: 20px;">
                <strong>Среда тестирования</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-top: 4px;">
                    <div><strong>Устройство:</strong> ${escapeHtml(formData.environment.device)}</div>
                    <div><strong>ОС:</strong> ${escapeHtml(formData.environment.os)}</div>
                    <div><strong>Браузер:</strong> ${escapeHtml(formData.environment.browser)}</div>
                    <div><strong>Разрешение:</strong> ${escapeHtml(formData.environment.resolution)}</div>
                    <div style="grid-column: span 2;"><strong>URL:</strong> ${escapeHtml(formData.environment.url)}</div>
                </div>
            </div>

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">

            <h3>Описание</h3>
            <div style="margin-bottom: 20px; white-space: pre-wrap;">${escapeHtml(formData.description).replace(/\n/g, '<br>')}</div>

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">

            <h3>Шаги воспроизведения</h3>
            <div style="margin-bottom: 20px; white-space: pre-wrap;">${formatSteps(formData.steps)}</div>

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">

            <h3>Ожидаемый результат</h3>
            <div style="margin-bottom: 20px; white-space: pre-wrap;">${escapeHtml(formData.expected).replace(/\n/g, '<br>')}</div>

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">

            <h3>Фактический результат</h3>
            <div style="margin-bottom: 20px; white-space: pre-wrap;">${escapeHtml(formData.actual).replace(/\n/g, '<br>')}</div>

            ${formData.additionalInfo !== '—' ? `
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">
            <h3>Дополнительная информация</h3>
            <div style="margin-bottom: 20px; white-space: pre-wrap;">${escapeHtml(formData.additionalInfo).replace(/\n/g, '<br>')}</div>
            ` : ''}

            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">
            <p style="font-size: 10pt;">Создано в Bug Reporter | ${new Date().toLocaleString()}</p>
        `;

        const textContainer = document.createElement('div');
        textContainer.style.position = 'absolute';
        textContainer.style.left = '-9999px';
        textContainer.style.top = '-9999px';
        textContainer.appendChild(textContent);
        document.body.appendChild(textContainer);

        try {
            // Рендерим текст
            const textCanvas = await html2canvas(textContainer, { scale: 2, useCORS: true, backgroundColor: '#fff' });
            const imgDataText = textCanvas.toDataURL('image/png');

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeightText = (textCanvas.height * imgWidth) / textCanvas.width;

            let yPos = 0;
            let pageNum = 0;
            while (yPos < imgHeightText) {
                if (pageNum > 0) pdf.addPage();
                pdf.addImage(imgDataText, 'PNG', 10, -yPos, imgWidth, imgHeightText);
                yPos += pageHeight;
                pageNum++;
            }

            // ----- 2. Вложения -----
            if (imageFiles.length > 0) {
                // Страница с заголовком "Вложения"
                pdf.addPage();
                pdf.setFontSize(18);
                pdf.text('Вложения', 10, 20);
                pdf.setFontSize(12);
                pdf.text('Скриншоты и изображения:', 10, 30);
                pdf.addPage(); // отдельная страница для первого изображения (чтобы не резать)
                
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const imgData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                    
                    const img = new Image();
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.src = imgData;
                    });
                    
                    const imgWidthOnPage = pageWidth - 20;
                    const imgHeightOnPage = (img.height * imgWidthOnPage) / img.width;
                    
                    // Если изображение не помещается на текущей странице, добавляем новую
                    if (i > 0) pdf.addPage();
                    pdf.addImage(img, 'PNG', 10, 10, imgWidthOnPage, imgHeightOnPage);
                    pdf.text(file.name, 10, pageHeight - 10);
                }
            }

            // Сохраняем PDF один раз
            pdf.save(`bug-report_${formData.bugId.replace(/[^a-z0-9]/gi, '_')}.pdf`);
            showMessage('PDF успешно создан!', 'success');
        } catch (err) {
            console.error('PDF error:', err);
            showMessage('Ошибка при создании PDF: ' + err.message, 'error');
        } finally {
            document.body.removeChild(textContainer);
        }
    }

    // ==== Обработчики событий ====
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveCurrentReport();
    });

    exportPdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportToPDF();
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('severity').value = '';
        document.getElementById('priority').value = '';
        document.getElementById('bugType').value = '';
        document.getElementById('status').value = 'Открыт';
        const attachmentsInput = document.getElementById('attachments');
        if (attachmentsInput) attachmentsInput.value = '';
        showMessage('Форма очищена', 'success');
    });

    showReportsLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (reportsSection.style.display === 'none') {
            displayReports();
            reportsSection.style.display = 'block';
            showReportsLink.textContent = 'Скрыть список';
        } else {
            reportsSection.style.display = 'none';
            showReportsLink.textContent = 'Сохранённые';
        }
    });
});