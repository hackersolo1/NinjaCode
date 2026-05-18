document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    //       SUPABASE CLIENT
    // ============================================
    const supabaseClient = supabase.createClient(
        'https://ykcuvifswqpbdlfxacuq.supabase.co',
        'sb_publishable_3wmlV5-OK_EZnXwgRvbKPg_7hftDG08'
    );

    // ============================================
    //       LINGUAGENS SUPORTADAS
    // ============================================
    const LANGUAGES = [
        { value: 'javascript', label: '🟨  JavaScript' },
        { value: 'typescript', label: '🔷  TypeScript' },
        { value: 'html', label: '🌐  HTML' },
        { value: 'css', label: '🎨  CSS' },
        { value: 'python', label: '🐍  Python' },
        { value: 'java', label: '☕  Java' },
        { value: 'c', label: '🔧  C' },
        { value: 'cpp', label: '⚙️  C++' },
        { value: 'csharp', label: '💜  C#' },
        { value: 'php', label: '🐘  PHP' },
        { value: 'sql', label: '🗄️  SQL' },
        { value: 'ruby', label: '💎  Ruby' },
        { value: 'go', label: '🐹  Go' },
        { value: 'rust', label: '🦀  Rust' },
        { value: 'plaintext', label: '📝  Texto simples' },
    ];

    function populateLanguageSelect(select) {
        LANGUAGES.forEach(({ value, label }) => {
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = label;
            select.appendChild(opt);
        });
    }

    // ============================================
    //       ELEMENTOS DO DOM
    // ============================================
    const addNewCodeBtn = document.getElementById("addNewCodeBtn");
    const modal = document.getElementById("newCodeModal");
    const closeModalBtn = modal.querySelector(".modal__close-btn");
    const cancelBtn = document.getElementById("cancelBtn");
    const newCodeForm = document.getElementById("newCodeForm");
    const codeLanguage = document.getElementById("codeLanguage");
    const codeContent = document.getElementById("codeContent");
    const newCodePreview = document.getElementById("newCodePreview");

    const logoutBtn = document.getElementById("logout");
    const snippetsList = document.querySelector('.snippets');
    const loginCard = document.querySelector('.login-card');
    const avatarImg = document.querySelector('.topbar__avatar img');

    const homeView = document.getElementById("homeView");
    const codeEditor = document.getElementById("codeEditor");
    const editCodeForm = document.getElementById("editCodeForm");
    const editLanguage = document.getElementById("editLanguage");
    const editTitle = document.getElementById("editTitle");
    const editContent = document.getElementById("editContent");
    const editPreview = document.getElementById("editPreview");
    const backBtn = document.getElementById("backBtn");
    const deleteCodeBtn = document.getElementById("deleteCodeBtn");

    // Popula os selects
    populateLanguageSelect(codeLanguage);
    populateLanguageSelect(editLanguage);

    // ============================================
    //       SUPABASE CRUD
    // ============================================
    async function fetchCodes() {
        const { data, error } = await supabaseClient
            .from('codes')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function fetchCodeById(id) {
        const { data, error } = await supabaseClient
            .from('codes')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async function insertCode({ title, language, code, createBy, createByEmail }) {
        const { data, error } = await supabaseClient
            .from('codes')
            .insert({ code_title: title, code_language: language, code_snippet: code, createBy: createBy, createByEmail: createByEmail })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function updateCode(id, { title, language, code }) {
        const { data, error } = await supabaseClient
            .from('codes')
            .update({ code_title: title, code_language: language, code_snippet: code })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function deleteCode(id) {
        const { error } = await supabaseClient
            .from('codes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    let disabled = 'disabled';

    // ============================================
    //       RENDER DA LISTA DE SNIPPETS
    // ============================================
    function createSnippetCard({ id, title, language, code, createBy, emailUs }) {
        const article = document.createElement("article");
        article.className = "snippet-card";
        article.dataset.id = id;

        article.innerHTML = `
            <div class="snippet-card__header">
                <div class="snippet-card__header-left">
                    <span class="material-symbols-outlined snippet-card__icon">terminal</span>
                    <h3 class="snippet-card__title"></h3>
                </div>
                <div class="snippet-card__actions">
                    <button class="snippet-card__action-btn" data-action="copy" title="Copiar código" aria-label="Copiar código">
                        <span class="material-symbols-outlined material-symbols-outlined--sm">content_copy</span>
                    </button>
                    <button class="snippet-card__action-btn" data-action="edit" title="Editar código" aria-label="Editar código" ${emailUs != emailU ? 'disabled' : ''}>
                        <span class="material-symbols-outlined material-symbols-outlined--sm">edit</span>
                    </button>
                </div>
            </div>
            <div class="snippet-card__code">
                <pre class="snippet-card__pre"><code></code></pre>
            </div>
            <div class="snippet-card__footer">
                <div>
                    <span class="material-symbols-outlined snippet-card__footer-icon">person</span>
                    <span class="snippet-card__footer-text">${createBy || 'Desconecido(a)'}</span>
                </div>
                <div>
                    <span class="material-symbols-outlined snippet-card__footer-icon">email</span>
                    <span class="snippet-card__footer-text">${emailUs || 'Desconecido(a)'}</span>
                </div>
            </div>
        `;

        // textContent evita XSS (não interpreta HTML do código do usuário)
        article.querySelector(".snippet-card__title").textContent = title;
        const codeEl = article.querySelector("code");
        codeEl.className = `language-${language}`;
        codeEl.textContent = code;
        hljs.highlightElement(codeEl);

        return article;
    }

    function renderEmptyState() {
        snippetsList.innerHTML = `
            <div class="snippets__empty">
                <span class="material-symbols-outlined">code_blocks</span>
                <p>Nenhum código salvo ainda.<br>Clique em <strong>Novo código</strong> pra começar.</p>
            </div>
        `;
    }

    async function renderSnippets() {
        snippetsList.innerHTML = `<div class="snippets__empty"><p>Carregando...</p></div>`;

        try {
            const rows = await fetchCodes();
            snippetsList.innerHTML = '';

            if (rows.length === 0) {
                renderEmptyState();
                return;
            }

            rows.forEach(row => {
                const card = createSnippetCard({
                    id: row.id,
                    title: row.code_title,
                    language: row.code_language,
                    code: row.code_snippet,
                    createBy: row.createBy,
                    emailUs: row.createByEmail
                });
                snippetsList.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao buscar códigos:', error);
            snippetsList.innerHTML = `
                <div class="snippets__empty">
                    <span class="material-symbols-outlined">error</span>
                    <p>Erro ao carregar códigos. Veja o console.<br>
                    <small>Dica: verifique se o RLS da tabela <code>codes</code> está desabilitado.</small></p>
                </div>
            `;
        }
    }

    // ============================================
    //       PREVIEW LIVE (highlight em tempo real)
    // ============================================
    function attachLivePreview(langEl, codeEl, previewEl) {
        function update() {
            const lang = langEl.value;
            const code = codeEl.value;

            previewEl.className = `hljs language-${lang || 'plaintext'}`;

            if (!lang || !code.trim()) {
                previewEl.textContent = '';
                return;
            }

            try {
                const result = hljs.highlight(code, { language: lang, ignoreIllegals: true });
                previewEl.innerHTML = result.value;
            } catch (e) {
                previewEl.textContent = code;
            }
        }
        langEl.addEventListener('change', update);
        codeEl.addEventListener('input', update);
        return update;
    }

    const updateNewCodePreview = attachLivePreview(codeLanguage, codeContent, newCodePreview);
    const updateEditPreview = attachLivePreview(editLanguage, editContent, editPreview);

    // ============================================
    //       VIEWS + HASH ROUTING
    // ============================================
    function showView(viewToShow) {
        [homeView, codeEditor].forEach(v => {
            if (v === viewToShow) {
                v.classList.remove('view--hidden');
                v.setAttribute('aria-hidden', 'false');
            } else {
                v.classList.add('view--hidden');
                v.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function navigate(hash) {
        if (hash) {
            // Se o hash já é o atual, força o handleRoute (hashchange só dispara quando muda)
            if (location.hash === `#${hash}`) {
                handleRoute();
            } else {
                location.hash = hash;
            }
        } else {
            // Remove o hash da URL sem reload e sem deixar `#` solto
            history.replaceState(null, '', location.pathname + location.search);
            handleRoute();
        }
    }

    async function handleRoute() {
        const hash = location.hash;

        if (hash === '#novo') {
            showView(homeView);
            if (!modal.open) modal.showModal();
        } else if (hash.startsWith('#editar/')) {
            const id = hash.slice('#editar/'.length);
            if (modal.open) modal.close();
            await openEditor(id);
        } else {
            if (modal.open) modal.close();
            showView(homeView);
        }
    }

    async function openEditor(id) {
        try {
            const data = await fetchCodeById(id);
            editCodeForm.elements.id.value = data.id;
            editCodeForm.elements.title.value = data.code_title;
            editCodeForm.elements.language.value = data.code_language;
            editCodeForm.elements.code.value = data.code_snippet;
            updateEditPreview();
            showView(codeEditor);
        } catch (error) {
            console.error('Erro ao abrir editor:', error);
            alert('Não foi possível abrir este código pra edição.');
            navigate('');
        }
    }

    window.addEventListener('hashchange', handleRoute);

    // ============================================
    //       AUTH STATE
    // ============================================
    let emailU = null;
    let userName = null;
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("Evento de Autenticação:", event, session);

        if (session && session.user) {
            const user = session.user;
            const userInfo = {
                id: user.id,
                email: user.email,
                name: user.user_metadata.full_name || user.user_metadata.name,
                avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture
            };

            userName = `${userInfo.name}`;
            emailU = userInfo.email;

            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // UI logado
            snippetsList.style.display = 'flex';
            loginCard.style.display = 'none';
            addNewCodeBtn.style.display = 'flex';
            logoutBtn.style.display = 'flex';

            if (userInfo.avatar_url) {
                avatarImg.src = userInfo.avatar_url;
            }

            // Carrega os snippets do banco e aplica rota inicial
            renderSnippets().then(() => handleRoute());
        } else {
            // UI deslogado
            localStorage.removeItem('userInfo');
            snippetsList.style.display = 'none';
            loginCard.style.display = 'flex';
            addNewCodeBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            avatarImg.src = "https://ui-avatars.com/api/?name=Guest&background=random&size=128";

            // Volta pra home se estava em outra rota
            if (location.hash) navigate('');
            else showView(homeView);
            emailU = 'Desconhecido(a)';
            userName = 'Desconecido(a)';
        }
    });

    // ============================================
    //       LOGIN / LOGOUT
    // ============================================
    async function signInWithGoogle() {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'index.html'
            }
        });
        if (error) console.error("Erro ao tentar fazer login:", error.message);

    }

    document.getElementById('loginBtn').addEventListener('click', signInWithGoogle);

    logoutBtn.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'home.html';
    });

    // ============================================
    //       MODAL — NOVO CÓDIGO
    // ============================================
    addNewCodeBtn.addEventListener("click", () => navigate('novo'));
    closeModalBtn.addEventListener("click", () => modal.close());
    cancelBtn.addEventListener("click", () => modal.close());

    modal.addEventListener("close", () => {
        newCodeForm.reset();
        updateNewCodePreview();
        if (location.hash === '#novo') navigate('');
    });

    newCodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(newCodeForm);
        const payload = {
            title: formData.get("title").trim(),
            language: formData.get("language"),
            code: formData.get("code"),
            createBy: userName || 'Desconecido(a)',
            createByEmail: emailU || 'Desconecido(a)'
        };

        try {
            const inserted = await insertCode(payload);

            // Remove empty state se existir, e adiciona o card no topo
            const empty = snippetsList.querySelector('.snippets__empty');
            if (empty) empty.remove();

            const card = createSnippetCard({
                id: inserted.id,
                title: inserted.code_title,
                language: inserted.code_language,
                code: inserted.code_snippet,
                createBy: inserted.createBy
            });
            snippetsList.prepend(card);

            modal.close();
        } catch (error) {
            console.error('Erro ao salvar código:', error);
            alert('Erro ao salvar código. Veja o console.');
        }
    });

    // ============================================
    //       EDITOR — SALVAR / EXCLUIR / VOLTAR
    // ============================================
    backBtn.addEventListener("click", () => navigate(''));

    editCodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(editCodeForm);
        const id = formData.get('id');
        const payload = {
            title: formData.get("title").trim(),
            language: formData.get("language"),
            code: formData.get("code"),
        };

        try {
            await updateCode(id, payload);
            await renderSnippets();
            navigate('');
        } catch (error) {
            console.error('Erro ao atualizar código:', error);
            alert('Erro ao atualizar código. Veja o console.');
        }
    });

    deleteCodeBtn.addEventListener("click", async () => {
        const id = editCodeForm.elements.id.value;
        const title = editCodeForm.elements.title.value;
        if (!confirm(`Tem certeza que quer excluir "${title}"? Essa ação não pode ser desfeita.`)) return;

        try {
            await deleteCode(id);
            await renderSnippets();
            navigate('');
        } catch (error) {
            console.error('Erro ao excluir código:', error);
            alert('Erro ao excluir código. Veja o console.');
        }
    });

    // ============================================
    //       EVENT DELEGATION — CARDS (copy / edit)
    // ============================================
    snippetsList.addEventListener("click", async (e) => {
        const article = e.target.closest('.snippet-card');
        if (!article) return;
        const id = article.dataset.id;

        if (e.target.closest('[data-action="edit"]')) {
            navigate(`editar/${id}`);
            return;
        }

        if (e.target.closest('[data-action="copy"]')) {
            const codeEl = article.querySelector('code');
            try {
                await navigator.clipboard.writeText(codeEl.textContent);
                const btn = e.target.closest('[data-action="copy"]');
                const icon = btn.querySelector('.material-symbols-outlined');
                const original = icon.textContent;
                icon.textContent = 'check';
                btn.style.color = 'var(--color-primary)';
                setTimeout(() => {
                    icon.textContent = original;
                    btn.style.color = '';
                }, 1200);
            } catch (error) {
                console.error('Erro ao copiar:', error);
                alert('Não foi possível copiar.');
            }
        }
    });
});
