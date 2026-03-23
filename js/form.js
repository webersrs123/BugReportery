// ==== Инициализация Supabase через ES модуль ====
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qfurbgyuahfrwsrpyzzy.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_HlkmY177rbdacKTJGOleZQ_PB8Sk7Cu';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка инициализации
console.log('Supabase initialized:', supabase);

// ==== Основной код ====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
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

    // Проверка элементов модальных окон
    console.log('Login modal:', loginModal);
    console.log('Register modal:', registerModal);
    console.log('Login btn:', loginBtn);
    console.log('Register btn:', registerBtn);

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (loginModal) loginModal.style.display = 'block'; 
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (registerModal) registerModal.style.display = 'block'; 
        });
    }

    if (document.getElementById('closeLogin')) {
        document.getElementById('closeLogin').addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
        });
    }
    
    if (document.getElementById('closeRegister')) {
        document.getElementById('closeRegister').addEventListener('click', () => {
            if (registerModal) registerModal.style.display = 'none';
        });
    }

    // Получение текущего пользователя
    async function getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('getUser error:', error);
                return null;
            }
            return user;
        } catch (e) {
            console.error('getCurrentUser exception:', e);
            return null;
        }
    }

// Регистрация
const registerSubmit = document.getElementById('registerSubmit');
if (registerSubmit) {
    console.log('Register submit button found');
    registerSubmit.addEventListener('click', async () => {
        console.log('Register clicked');
        
        const usernameInput = document.getElementById('regUsername');
        const emailInput = document.getElementById('regEmail');
        const passwordInput = document.getElementById('regPassword');
        const msgDiv = document.getElementById('registerMessage');

        if (!usernameInput || !emailInput || !passwordInput) {
            console.error('Register inputs not found!');
            return;
        }

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!username || !email || !password) {
            if (msgDiv) msgDiv.innerText = 'Заполните все поля';
            return;
        }

        try {
            console.log('Checking if email exists...');
            // Пробуем войти — если успешно, значит email уже есть
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (!signInError) {
                // Вошли успешно = email уже существует!
                console.log('Email already exists');
                if (msgDiv) msgDiv.innerText = 'Пользователь с таким email уже существует';
                return;
            }

            // Если не вошли — регистрируем
            console.log('Email available, registering...');
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { 
                    data: { username: username }
                }
            });

            if (error) {
    console.error('SignUp error:', error);
    // Переводим стандартные ошибки Supabase
    let errorMessage = error.message;
    if (error.message.includes('User already registered')) {
        errorMessage = 'Пользователь с таким email уже существует';
    } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Некорректный email';
    } else if (error.message.includes('Password should be')) {
        errorMessage = 'Пароль слишком простой (минимум 6 символов)';
    }
    if (msgDiv) msgDiv.innerText = 'Ошибка: ' + errorMessage;
}
    });
}
    // Вход
    const loginSubmit = document.getElementById('loginSubmit');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', async () => {
            console.log('Login clicked');
            
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const msgDiv = document.getElementById('loginMessage');

            if (!emailInput || !passwordInput) {
                console.error('Login inputs not found!');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                if (msgDiv) msgDiv.innerText = 'Введите email и пароль';
                return;
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) {
                    if (msgDiv) msgDiv.innerText = error.message;
                } else {
                    if (msgDiv) msgDiv.innerText = 'Вход выполнен';
                    if (loginModal) loginModal.style.display = 'none';
                    await updateUIForAuth();
                }
            } catch (e) {
                console.error('Login exception:', e);
                if (msgDiv) msgDiv.innerText = 'Ошибка: ' + e.message;
            }
        });
    }

    // Выход
    async function logout() {
        await supabase.auth.signOut();
        await updateUIForAuth();
        showMessage('Вы вышли', 'success');
    }

    async function updateUIForAuth() {
        const user = await getCurrentUser();
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
                if (nav) nav.appendChild(logoutBtn);
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'inline';
            if (registerBtn) registerBtn.style.display = 'inline';
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.remove();
        }
    }

    // Следим за изменением состояния аутентификации
    if (supabase && supabase.auth) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            await updateUIForAuth();
            if (event === 'SIGNED_IN') {
                showMessage('Добро пожаловать!', 'success');
            }
        });
    } else {
        console.error('Supabase auth not available!');
    }

    // Инициализация UI
    await updateUIForAuth();

    // ==== Сохранение репорта ====
    async function saveCurrentReport() {
        const user = await getCurrentUser();
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
            user_id: user.id,
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
        const user = await getCurrentUser();
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
        const user = await getCurrentUser();
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

    // ==== Экспорт PDF ====
    async function exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const bugId = document.getElementById('bugId').value || 'N/A';
        const title = document.getElementById('title').value || 'Без названия';
        
        doc.setFontSize(16);
        doc.text(`Bug Report: ${bugId}`, 20, 20);
        doc.setFontSize(12);
        doc.text(`Title: ${title}`, 20, 30);
        doc.text(`Project: ${document.getElementById('project').value || 'N/A'}`, 20, 40);
        doc.text(`Author: ${document.getElementById('author').value || 'N/A'}`, 20, 50);
        doc.text(`Severity: ${document.getElementById('severity').value || 'N/A'}`, 20, 60);
        doc.text(`Priority: ${document.getElementById('priority').value || 'N/A'}`, 20, 70);
        
        doc.text('Description:', 20, 90);
        const description = document.getElementById('description').value || 'N/A';
        doc.text(doc.splitTextToSize(description, 170), 20, 100);
        
        doc.text('Steps to Reproduce:', 20, 130);
        const steps = document.getElementById('steps').value || 'N/A';
        doc.text(doc.splitTextToSize(steps, 170), 20, 140);
        
        doc.text('Expected Result:', 20, 170);
        const expected = document.getElementById('expected').value || 'N/A';
        doc.text(doc.splitTextToSize(expected, 170), 20, 180);
        
        doc.text('Actual Result:', 20, 210);
        const actual = document.getElementById('actual').value || 'N/A';
        doc.text(doc.splitTextToSize(actual, 170), 20, 220);
        
        doc.save(`${bugId}_report.pdf`);
    }

    // ==== Обработчики событий ====
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveCurrentReport();
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportToPDF();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            document.getElementById('severity').value = '';
            document.getElementById('priority').value = '';
            document.getElementById('bugType').value = '';
            document.getElementById('status').value = 'Открыт';
            document.getElementById('attachments').value = '';
            showMessage('Форма очищена', 'success');
        });
    }

    if (showReportsLink) {
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
    }
    
    console.log('App initialized successfully!');
});