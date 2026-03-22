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

    // ==== Модальные окна ====
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); loginModal.style.display = 'block'; });
    if (registerBtn) registerBtn.addEventListener('click', (e) => { e.preventDefault(); registerModal.style.display = 'block'; });

    if (document.getElementById('closeLogin')) {
        document.getElementById('closeLogin').addEventListener('click', () => loginModal.style.display = 'none');
    }
    if (document.getElementById('closeRegister')) {
        document.getElementById('closeRegister').addEventListener('click', () => registerModal.style.display = 'none');
    }

    // Регистрация
    if (document.getElementById('registerSubmit')) {
        document.getElementById('registerSubmit').addEventListener('click', async () => {
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const msgDiv = document.getElementById('registerMessage');

            if (!username || !email || !password) {
                msgDiv.innerText = 'Заполните все поля';
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { username: username } }
            });

            if (error) {
                msgDiv.innerText = error.message;
            } else {
                msgDiv.innerText = 'Регистрация успешна! Проверьте email для подтверждения.';
                setTimeout(() => registerModal.style.display = 'none', 2000);
            }
        });
    }

    // Вход
    if (document.getElementById('loginSubmit')) {
        document.getElementById('loginSubmit').addEventListener('click', async () => {
            const email = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const msgDiv = document.getElementById('loginMessage');

            if (!email || !password) {
                msgDiv.innerText = 'Введите email и пароль';
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                msgDiv.innerText = error.message;
            } else {
                msgDiv.innerText = 'Вход выполнен';
                loginModal.style.display = 'none';
                updateUIForAuth();
            }
        });
    }

    // Выход
    async function logout() {
        await supabase.auth.signOut();
        updateUIForAuth();
        showMessage('Вы вышли', 'success');
    }

    function updateUIForAuth() {
        const user = supabase.auth.user();
        const nav = document.querySelector('nav');
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (!document.getElementById('logoutBtn')) {
                const logoutBtn = document.createElement('a');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.href = '#';
                logoutBtn.innerText = 'Выход';
                logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
                nav.appendChild(logoutBtn);
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'inline';
            if (registerBtn) registerBtn.style.display = 'inline';
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.remove();
        }
    }

    // Следим за изменением состояния аутентификации
    supabase.auth.onAuthStateChange((event, session) => {
        updateUIForAuth();
        if (event === 'SIGNED_IN') {
            showMessage('Добро пожаловать!', 'success');
        }
    });

    // Инициализация UI
    updateUIForAuth();

    // ==== Сохранение репорта ====
    async function saveCurrentReport() {
        const user = supabase.auth.user();
        if (!user) {
            showMessage('Пожалуйста, войдите, чтобы сохранить репорт', 'error');
            return false;
        }

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

        const reportData = {
            bug_id: bugId,
            title: title,
            project: document.getElementById('project').value.trim(),
            author: document.getElementById('author').value.trim(),
            severity: document.getElementById('severity').value,
            priority: document.getElementById('priority').value,
            bug_type: document.getElementById('bugType').value,
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
            additional_info: document.getElementById('additionalInfo').value.trim()
        };

        const { data, error } = await supabase
            .from('reports')
            .insert([reportData]);

        if (error) {
            showMessage('Ошибка сохранения: ' + error.message, 'error');
            return false;
        } else {
            showMessage('Репорт успешно сохранён!', 'success');
            form.reset();
            // Сброс select'ов
            document.getElementById('severity').value = '';
            document.getElementById('priority').value = '';
            document.getElementById('bugType').value = '';
            document.getElementById('status').value = 'Открыт';
            document.getElementById('attachments').value = '';
            return true;
        }
    }

    // ==== Отображение списка репортов ====
    async function displayReports() {
        const user = supabase.auth.user();
        if (!user) {
            reportsListDiv.innerHTML = '<p>Войдите, чтобы видеть свои репорты.</p>';
            return;
        }

        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            reportsListDiv.innerHTML = '<p>Ошибка загрузки репортов</p>';
            return;
        }

        if (!reports || reports.length === 0) {
            reportsListDiv.innerHTML = '<p>Нет сохранённых репортов.</p>';
            return;
        }

        let html = '';
        reports.forEach(r => {
            html += `
                <div class="report-item">
                    <strong>${escapeHtml(r.bug_id)}</strong> — ${escapeHtml(r.title)}<br>
                    <span class="meta">${new Date(r.created_at).toLocaleString()} | ${r.project || '—'} | Статус: ${r.status || 'Открыт'}</span>
                    <div class="report-actions">
                        <button class="view-report" data-id="${r.id}">Просмотр</button>
                        <button class="delete-report" data-id="${r.id}">Удалить</button>
                    </div>
                </div>
            `;
        });
        reportsListDiv.innerHTML = html;

        document.querySelectorAll('.view-report').forEach(btn => {
            btn.addEventListener('click', () => viewReport(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.delete-report').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Удалить репорт?')) {
                    const { error } = await supabase.from('reports').delete().eq('id', id);
                    if (!error) displayReports();
                    else alert('Ошибка удаления');
                }
            });
        });
    }

    // Просмотр репорта (заполнение формы)
    async function viewReport(id) {
        const user = supabase.auth.user();
        if (!user) return;

        const { data: report, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !report) return;

        document.getElementById('bugId').value = report.bug_id;
        document.getElementById('title').value = report.title;
        document.getElementById('project').value = report.project || '';
        document.getElementById('author').value = report.author || '';
        document.getElementById('severity').value = report.severity || '';
        document.getElementById('priority').value = report.priority || '';
        document.getElementById('bugType').value = report.bug_type || '';
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
        document.getElementById('additionalInfo').value = report.additional_info || '';

        form.scrollIntoView({ behavior: 'smooth' });
        showMessage('Репорт загружен. Вы можете отредактировать и сохранить как новый.', 'success');
    }

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

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = 'form-message ' + type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'form-message';
        }, 3000);
    }

    // ==== Экспорт PDF (оставляем как есть) ====
    async function exportToPDF() {
        // ... ваш существующий код экспорта в PDF (не меняем)
        // Он работает с текущими данными формы
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
        document.getElementById('attachments').value = '';
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