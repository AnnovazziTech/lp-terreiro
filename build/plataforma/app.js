// ============================================
// CURSO SACERDOTAL DE UMBANDA - APP.JS
// Sistema de Navegação e Progresso
// ============================================

// Estado da aplicação
let currentLesson = 0;
let completedLessons = [];
let courseStarted = false;
let expandedModules = [1]; // Módulo 1 começa expandido
let currentModule = 1; // Módulo atual
let currentUser = null; // Usuário autenticado

// Tracking de tempo de estudo
let lessonStartTime = null; // Timestamp de quando a aula foi aberta
let lastTrackedLesson = 0; // Última aula que teve tempo rastreado

// Estrutura dos 8 Módulos do Curso (baseado em CURSO_SACERDOTAL_UMBANDA_Estrutura_Geral.md)
const courseModules = [
    {
        id: 1,
        title: "Módulo 1",
        subtitle: "Fundamentos e História da Umbanda",
        icon: "📖",
        hours: "40h",
        status: "available", // available, locked
        lessons: courseLessons.filter(lesson => lesson.id >= 1 && lesson.id <= 10) // Aulas 1-10
    },
    {
        id: 2,
        title: "Módulo 2",
        subtitle: "Teologia e Cosmologia Umbandista",
        icon: "✨",
        hours: "40h",
        status: "available", // Desbloqueado para permitir acesso
        lessons: courseLessons.filter(lesson => lesson.id >= 11 && lesson.id <= 20) // Aulas 11-20
    },
    {
        id: 3,
        title: "Módulo 3",
        subtitle: "Os Orixás - Estudo Completo",
        icon: "⚡",
        hours: "50h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 21 && lesson.id <= 33) // Aulas 21-33 (13 aulas)
    },
    {
        id: 4,
        title: "Módulo 4",
        subtitle: "Entidades e Guias Espirituais",
        icon: "🌟",
        hours: "40h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 34 && lesson.id <= 43) // Aulas 34-43
    },
    {
        id: 5,
        title: "Módulo 5",
        subtitle: "Rituais e Práticas Litúrgicas",
        icon: "🕯️",
        hours: "50h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 44 && lesson.id <= 53) // Aulas 44-53
    },
    {
        id: 6,
        title: "Módulo 6",
        subtitle: "Mirongas e Trabalhos Espirituais",
        icon: "🔮",
        hours: "40h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 54 && lesson.id <= 63) // Aulas 54-63
    },
    {
        id: 7,
        title: "Módulo 7",
        subtitle: "Organização e Montagem de Terreiro",
        icon: "🏛️",
        hours: "40h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 64 && lesson.id <= 73) // Aulas 64-73
    },
    {
        id: 8,
        title: "Módulo 8",
        subtitle: "Formação Sacerdotal e Ética",
        icon: "🎓",
        hours: "40h",
        status: "available", // DESBLOQUEADO
        lessons: courseLessons.filter(lesson => lesson.id >= 74 && lesson.id <= 83) // Aulas 74-83
    }
];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    // Proteger página - verificar autenticação
    const authenticated = await protectPage();

    if (!authenticated) {
        return; // Será redirecionado para login
    }

    // Carregar usuário atual
    currentUser = await getCurrentUser();

    if (currentUser) {
        // Exibir saudação personalizada no header
        const userGreeting = document.getElementById('userGreeting');
        const name = currentUser.profile?.full_name || currentUser.profile?.username || 'Estudante';

        // Saudação baseada na hora do dia
        const hour = new Date().getHours();
        let greeting = '🌅 Bom dia';
        if (hour >= 12 && hour < 18) greeting = '☀️ Boa tarde';
        if (hour >= 18) greeting = '🌙 Boa noite';

        userGreeting.innerHTML = `${greeting}, <strong>${name}</strong>!`;

        console.log('👤 Usuário logado:', name);
        console.log('🎭 Role:', currentUser.profile?.role);
    }

    // Recuperar tempo pendente (se fechou a página sem salvar)
    await recoverPendingTime();

    // Carregar progresso do Supabase
    await loadProgress();
    renderLessonNavigation();
    updateProgressBar();

    // Se o curso já foi iniciado, mostrar a última aula visualizada
    if (courseStarted && currentLesson > 0) {
        showLesson(currentLesson);
    }
});

// ============================================
// TRACKING DE TEMPO DE ESTUDO
// ============================================

/**
 * Inicia o timer para rastrear tempo na aula
 */
function startLessonTimer(lessonId) {
    lessonStartTime = Date.now();
    lastTrackedLesson = lessonId;
    console.log(`⏱️ Timer iniciado para aula ${lessonId}`);
}

/**
 * Salva o tempo gasto na aula atual
 */
async function saveLessonTime() {
    if (!lessonStartTime || !lastTrackedLesson) {
        return;
    }

    const timeSpentSeconds = Math.floor((Date.now() - lessonStartTime) / 1000);

    // Só salvar se passou mais de 5 segundos (evitar saves acidentais)
    if (timeSpentSeconds < 5) {
        return;
    }

    // Limitar a 2 horas por sessão (7200 segundos) para evitar dados incorretos
    const cappedTime = Math.min(timeSpentSeconds, 7200);

    const moduleId = getModuleFromLessonId(lastTrackedLesson);

    console.log(`⏱️ Salvando ${cappedTime}s de estudo na aula ${lastTrackedLesson} (Módulo ${moduleId})`);

    try {
        await updateLessonTime(moduleId, lastTrackedLesson, cappedTime);
    } catch (error) {
        console.error('Erro ao salvar tempo de estudo:', error);
    }

    // Resetar timer
    lessonStartTime = null;
}

// Salvar tempo ao fechar/recarregar a página
window.addEventListener('beforeunload', function() {
    if (lessonStartTime && lastTrackedLesson) {
        const timeSpentSeconds = Math.floor((Date.now() - lessonStartTime) / 1000);
        if (timeSpentSeconds >= 5) {
            const moduleId = getModuleFromLessonId(lastTrackedLesson);
            const cappedTime = Math.min(timeSpentSeconds, 7200);

            // Usar sendBeacon para garantir que o request seja enviado
            // Como não podemos usar sendBeacon com Supabase diretamente,
            // salvamos no localStorage para recuperar depois
            const pendingTime = {
                moduleId: moduleId,
                lessonId: lastTrackedLesson,
                seconds: cappedTime,
                timestamp: Date.now()
            };
            localStorage.setItem('pendingLessonTime', JSON.stringify(pendingTime));
            console.log('⏱️ Tempo pendente salvo no localStorage');
        }
    }
});

/**
 * Recupera e salva tempo pendente do localStorage (se houver)
 */
async function recoverPendingTime() {
    const pending = localStorage.getItem('pendingLessonTime');
    if (pending) {
        try {
            const data = JSON.parse(pending);
            // Só recuperar se foi salvo há menos de 1 hora
            if (Date.now() - data.timestamp < 3600000) {
                console.log(`⏱️ Recuperando tempo pendente: ${data.seconds}s na aula ${data.lessonId}`);
                await updateLessonTime(data.moduleId, data.lessonId, data.seconds);
            }
        } catch (error) {
            console.error('Erro ao recuperar tempo pendente:', error);
        }
        localStorage.removeItem('pendingLessonTime');
    }
}

// ============================================
// GERENCIAMENTO DE PROGRESSO
// ============================================

async function loadProgress() {
    try {
        // Carregar configurações do usuário do Supabase
        const settings = await loadUserProgress();

        if (settings) {
            currentLesson = settings.current_lesson || 0;
            currentModule = settings.current_module || 1;
            courseStarted = settings.course_started || false;
            completedLessons = settings.completed_lessons || [];
        }

        // Fallback para localStorage (migração)
        if (!settings) {
            const savedProgress = localStorage.getItem('umbandaCourseProgress');
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                completedLessons = progress.completedLessons || [];
                currentLesson = progress.currentLesson || 0;
                courseStarted = progress.courseStarted || false;

                // Migrar para Supabase
                await saveProgress();

                // Limpar localStorage após migração
                localStorage.removeItem('umbandaCourseProgress');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);

        // Fallback para localStorage em caso de erro
        const savedProgress = localStorage.getItem('umbandaCourseProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            completedLessons = progress.completedLessons || [];
            currentLesson = progress.currentLesson || 0;
            courseStarted = progress.courseStarted || false;
        }
    }
}

async function saveProgress() {
    try {
        // Salvar no Supabase
        await updateUserSettings({
            current_module: currentModule,
            current_lesson: currentLesson,
            course_started: courseStarted,
            completed_lessons: completedLessons
        });

        // Salvar também no localStorage como backup
        const progress = {
            completedLessons: completedLessons,
            currentLesson: currentLesson,
            courseStarted: courseStarted
        };
        localStorage.setItem('umbandaCourseProgress', JSON.stringify(progress));
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);

        // Fallback para localStorage
        const progress = {
            completedLessons: completedLessons,
            currentLesson: currentLesson,
            courseStarted: courseStarted
        };
        localStorage.setItem('umbandaCourseProgress', JSON.stringify(progress));
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const percentage = Math.round((completedLessons.length / courseLessons.length) * 100);

    progressBar.style.width = percentage + '%';

    // Texto dinâmico baseado no progresso
    if (percentage === 0) {
        progressText.textContent = '🚀 Comece sua jornada!';
    } else if (percentage < 25) {
        progressText.textContent = `${percentage}% Concluído - Continue assim! 💪`;
    } else if (percentage < 50) {
        progressText.textContent = `${percentage}% Concluído - Ótimo progresso! ⭐`;
    } else if (percentage < 75) {
        progressText.textContent = `${percentage}% Concluído - Mais da metade! 🔥`;
    } else if (percentage < 100) {
        progressText.textContent = `${percentage}% Concluído - Quase lá! 🎯`;
    } else {
        progressText.textContent = `100% Concluído - Parabéns, Sacerdote! 🏆`;
    }

    // Adicionar classe especial para 100%
    if (percentage === 100) {
        progressBar.classList.add('completed');
    } else {
        progressBar.classList.remove('completed');
    }

    // Adicionar indicador de progresso alto (>= 75%)
    if (percentage >= 75 && percentage < 100) {
        progressBar.setAttribute('data-progress', 'high');
    } else {
        progressBar.removeAttribute('data-progress');
    }
}

// ============================================
// RENDERIZAÇÃO DA NAVEGAÇÃO COM MÓDULOS
// ============================================

function renderLessonNavigation() {
    const modulesNav = document.getElementById('modulesNav');
    modulesNav.innerHTML = '';

    courseModules.forEach((module) => {
        // Container do módulo
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';

        if (module.status === 'locked') {
            moduleItem.classList.add('locked');
        }

        // Se tem aulas do módulo atual em andamento, marcar como ativo
        if (module.id === currentModule && currentLesson > 0) {
            moduleItem.classList.add('active');
        }

        // Calcular progresso do módulo
        let completedCount = 0;
        let totalCount = module.lessons.length;
        module.lessons.forEach(lesson => {
            if (completedLessons.includes(lesson.id)) {
                completedCount++;
            }
        });

        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Header do módulo (clicável para expandir/retrair)
        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'module-header';

        if (module.status === 'locked') {
            moduleHeader.classList.add('locked');
        }

        if (expandedModules.includes(module.id)) {
            moduleHeader.classList.add('expanded');
        }

        if (module.id === currentModule && currentLesson > 0) {
            moduleHeader.classList.add('active');
        }

        moduleHeader.innerHTML = `
            <div class="module-header-content">
                <span class="module-icon">${module.icon}</span>
                <div class="module-info">
                    <h3>${module.title}</h3>
                    <p>${module.subtitle} • ${module.hours}</p>
                </div>
            </div>
            <div>
                ${totalCount > 0 ? `<span class="module-progress">${completedCount}/${totalCount}</span>` : ''}
                <span class="module-expand-icon">${module.status === 'locked' ? '🔒' : '▶'}</span>
            </div>
        `;

        // Clicar no header para expandir/retrair (se não estiver bloqueado)
        if (module.status !== 'locked') {
            moduleHeader.onclick = () => toggleModule(module.id);
        }

        moduleItem.appendChild(moduleHeader);

        // Lista de aulas (se o módulo tiver aulas)
        if (module.lessons.length > 0) {
            const moduleLessons = document.createElement('div');
            moduleLessons.className = 'module-lessons';

            if (expandedModules.includes(module.id)) {
                moduleLessons.classList.add('expanded');
            }

            const lessonsList = document.createElement('div');
            lessonsList.className = 'lessons-list';

            console.log(`Renderizando ${module.lessons.length} aulas do Módulo ${module.id}`);

            module.lessons.forEach((lesson) => {
                const lessonItem = document.createElement('div');
                lessonItem.className = 'lesson-item';

                // Adicionar classes de estado
                if (completedLessons.includes(lesson.id)) {
                    lessonItem.classList.add('completed');
                }
                if (currentLesson === lesson.id) {
                    lessonItem.classList.add('active');
                }

                lessonItem.innerHTML = `
                    <span class="lesson-number">${lesson.id}</span>
                    <span class="lesson-title">${lesson.title.replace('Aula ' + lesson.id + ' - ', '')}</span>
                `;

                lessonItem.onclick = () => selectLesson(lesson.id);
                lessonsList.appendChild(lessonItem);
            });

            moduleLessons.appendChild(lessonsList);
            moduleItem.appendChild(moduleLessons);
        }

        modulesNav.appendChild(moduleItem);
    });
}

// Função para expandir/retrair módulos
function toggleModule(moduleId) {
    const index = expandedModules.indexOf(moduleId);

    if (index > -1) {
        // Módulo já está expandido, retrair
        expandedModules.splice(index, 1);
    } else {
        // Módulo está retraído, expandir
        expandedModules.push(moduleId);
    }

    // Re-renderizar navegação
    renderLessonNavigation();
}

// ============================================
// CONTROLE DE VISUALIZAÇÃO
// ============================================

function startCourse() {
    courseStarted = true;
    saveProgress();
    showLesson(1);
}

// Função helper para determinar o módulo baseado no ID da aula
function getModuleFromLessonId(lessonId) {
    if (lessonId >= 74) return 8;
    if (lessonId >= 64) return 7;
    if (lessonId >= 54) return 6;
    if (lessonId >= 44) return 5;
    if (lessonId >= 34) return 4;
    if (lessonId >= 21) return 3;
    if (lessonId >= 11) return 2;
    return 1;
}

function selectLesson(lessonId) {
    currentLesson = lessonId;
    // Atualizar módulo atual baseado na aula selecionada
    currentModule = getModuleFromLessonId(lessonId);
    saveProgress();
    showLesson(lessonId);

    // Fechar menu mobile ao selecionar aula
    closeMobileMenuOnLessonSelect();
}

async function showLesson(lessonId) {
    // Salvar tempo da aula anterior (se houver)
    if (lessonStartTime && lastTrackedLesson && lastTrackedLesson !== lessonId) {
        await saveLessonTime();
    }

    // Ocultar tela de boas-vindas
    document.getElementById('welcomeScreen').style.display = 'none';

    // Ocultar área de quiz
    document.getElementById('quizSection').style.display = 'none';

    // Mostrar conteúdo da aula
    const lessonContent = document.getElementById('lessonContent');
    lessonContent.style.display = 'block';

    // Buscar dados da aula
    const lesson = courseLessons.find(l => l.id === lessonId);

    if (!lesson) {
        console.error('Aula não encontrada:', lessonId);
        return;
    }

    // Atualizar conteúdo
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonMeta').innerHTML = `
        <span>📚 ${lesson.subtitle}</span> •
        <span>⏱️ ${lesson.duration}</span> •
        <span>📍 ${lesson.format}</span>
    `;
    document.getElementById('lessonBody').innerHTML = lesson.content;

    // Atualizar navegação
    currentLesson = lessonId;
    renderLessonNavigation();

    // Marcar aula como "in_progress" no Supabase (se não estiver completada)
    if (!completedLessons.includes(lessonId)) {
        await saveUserProgress(currentModule, lessonId, 'in_progress');
    }

    // Atualizar botões de navegação
    updateNavigationButtons();

    // Scroll para o topo
    window.scrollTo(0, 0);

    await saveProgress();

    // Iniciar timer para rastrear tempo nesta aula
    startLessonTimer(lessonId);
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Botão anterior
    if (currentLesson <= 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
        prevBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
        prevBtn.style.cursor = 'pointer';
    }

    // Botão próximo
    // AULA 1 não tem quiz (é apenas apresentação)
    if (currentLesson === 1) {
        nextBtn.textContent = 'Próxima Aula →';
    } else if (currentLesson >= courseLessons.length) {
        nextBtn.textContent = 'Fazer Quiz →';
    } else {
        // Verificar se a aula atual foi concluída
        if (completedLessons.includes(currentLesson)) {
            nextBtn.textContent = 'Próxima Aula →';
        } else {
            nextBtn.textContent = 'Fazer Quiz →';
        }
    }
}

// ============================================
// NAVEGAÇÃO ENTRE AULAS
// ============================================

async function previousLesson() {
    if (currentLesson > 1) {
        await showLesson(currentLesson - 1);
    }
}

async function nextLesson() {
    // AULA 1 não tem quiz - vai direto para Aula 2
    if (currentLesson === 1) {
        // Marca Aula 1 como concluída automaticamente
        if (!completedLessons.includes(1)) {
            completedLessons.push(1);
            await saveProgress();
            updateProgressBar();
        }
        await showLesson(2);
        return;
    }

    // Se a aula já foi concluída, ir para a próxima
    if (completedLessons.includes(currentLesson)) {
        if (currentLesson < courseLessons.length) {
            await showLesson(currentLesson + 1);
        }
    } else {
        // Se não foi concluída, mostrar o quiz
        await showQuiz();
    }
}

// ============================================
// CONTROLE DE QUIZ
// ============================================

async function showQuiz() {
    // AULA 1 não tem quiz
    if (currentLesson === 1) {
        console.warn('Aula 1 não possui quiz');
        return;
    }

    // Salvar tempo de estudo da aula antes de ir para o quiz
    await saveLessonTime();

    // Ocultar conteúdo da aula
    document.getElementById('lessonContent').style.display = 'none';

    // Mostrar área de quiz
    const quizSection = document.getElementById('quizSection');
    quizSection.style.display = 'block';

    // Atualizar número da aula no quiz
    document.getElementById('quizLessonNumber').textContent = currentLesson;

    // Renderizar perguntas do quiz
    renderQuizQuestions();

    // Ocultar resultados
    document.getElementById('quizResults').style.display = 'none';

    // Scroll para o topo
    window.scrollTo(0, 0);
}

function renderQuizQuestions() {
    const quizQuestions = document.getElementById('quizQuestions');
    quizQuestions.innerHTML = '';

    const questions = lessonQuizzes[currentLesson];

    if (!questions) {
        quizQuestions.innerHTML = '<p>Nenhuma pergunta disponível para esta aula.</p>';
        return;
    }

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.setAttribute('data-question-index', index);

        questionDiv.innerHTML = `
            <h4>Pergunta ${index + 1}</h4>
            <p class="question-text">${q.question}</p>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <div class="option" data-option-index="${optIndex}" onclick="selectOption(${index}, ${optIndex})">
                        ${option}
                    </div>
                `).join('')}
            </div>
            <div class="explanation" style="display: none;">
                <strong>Explicação:</strong> ${q.explanation}
            </div>
        `;

        quizQuestions.appendChild(questionDiv);
    });

    // Adicionar botão de enviar quiz
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary btn-submit-quiz';
    submitBtn.textContent = '📝 Enviar Respostas';
    submitBtn.onclick = submitQuiz;
    submitBtn.disabled = true;
    submitBtn.id = 'submitQuizBtn';

    quizQuestions.appendChild(submitBtn);
}

function selectOption(questionIndex, optionIndex) {
    const questionDiv = document.querySelector(`[data-question-index="${questionIndex}"]`);
    const options = questionDiv.querySelectorAll('.option');

    // Remover seleção anterior
    options.forEach(opt => opt.classList.remove('selected'));

    // Adicionar seleção à opção clicada
    options[optionIndex].classList.add('selected');

    // Verificar se todas as perguntas foram respondidas
    checkAllQuestionsAnswered();
}

function checkAllQuestionsAnswered() {
    const questions = lessonQuizzes[currentLesson];
    const selectedOptions = document.querySelectorAll('.option.selected');

    const submitBtn = document.getElementById('submitQuizBtn');

    if (selectedOptions.length === questions.length) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

function submitQuiz() {
    const questions = lessonQuizzes[currentLesson];
    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q, index) => {
        const questionDiv = document.querySelector(`[data-question-index="${index}"]`);
        const options = questionDiv.querySelectorAll('.option');
        const selectedOption = questionDiv.querySelector('.option.selected');
        const explanation = questionDiv.querySelector('.explanation');

        if (!selectedOption) return;

        const selectedIndex = parseInt(selectedOption.getAttribute('data-option-index'));

        // Desabilitar todas as opções
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        // Marcar resposta correta
        options[q.correct].classList.add('correct');

        // Se a resposta selecionada estiver errada, marcar
        if (selectedIndex !== q.correct) {
            selectedOption.classList.add('incorrect');
            wrongCount++;
        } else {
            correctCount++;
        }

        // Mostrar explicação
        explanation.style.display = 'block';
    });

    // Desabilitar botão de enviar
    document.getElementById('submitQuizBtn').disabled = true;
    document.getElementById('submitQuizBtn').textContent = '✅ Quiz Concluído';

    // Mostrar resultados
    showQuizResults(correctCount, wrongCount, questions.length);
}

function showQuizResults(correct, wrong, total) {
    const quizResults = document.getElementById('quizResults');
    quizResults.style.display = 'block';

    const percentage = Math.round((correct / total) * 100);

    // Atualizar elementos de resultado
    document.getElementById('scorePercentage').textContent = percentage + '%';
    document.getElementById('correctAnswers').textContent = correct;
    document.getElementById('wrongAnswers').textContent = wrong;
    document.getElementById('totalQuestions').textContent = total;

    // Atualizar círculo de pontuação
    const scoreCircle = document.getElementById('scoreCircle');
    if (percentage >= 70) {
        scoreCircle.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (percentage >= 50) {
        scoreCircle.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else {
        scoreCircle.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }

    // Mensagem de resultado
    const resultsMessage = document.getElementById('resultsMessage');
    if (percentage >= 70) {
        resultsMessage.innerHTML = `
            <p style="color: #10b981; font-weight: bold;">🎉 Parabéns! Você teve um excelente desempenho!</p>
            <p>Você demonstrou um ótimo entendimento do conteúdo da aula.</p>
        `;
    } else if (percentage >= 50) {
        resultsMessage.innerHTML = `
            <p style="color: #f59e0b; font-weight: bold;">📚 Bom trabalho!</p>
            <p>Você compreendeu parte do conteúdo. Considere revisar alguns tópicos.</p>
        `;
    } else {
        resultsMessage.innerHTML = `
            <p style="color: #ef4444; font-weight: bold;">📖 Continue estudando!</p>
            <p>Recomendamos revisar o conteúdo da aula antes de prosseguir.</p>
        `;
    }

    // Scroll para resultados
    quizResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function retakeQuiz() {
    // Recarregar o quiz
    renderQuizQuestions();
    document.getElementById('quizResults').style.display = 'none';
    window.scrollTo(0, 0);
}

async function completeLesson() {
    // Adicionar aula aos concluídos se ainda não estiver
    if (!completedLessons.includes(currentLesson)) {
        completedLessons.push(currentLesson);

        // Salvar progresso no Supabase
        await saveUserProgress(currentModule, currentLesson, 'completed');
        await saveProgress();
        updateProgressBar();
    }

    // Mostrar modal de conclusão
    showCompletionModal();
}

// ============================================
// MODAL DE CONCLUSÃO
// ============================================

function showCompletionModal() {
    const modal = document.getElementById('completionModal');
    modal.style.display = 'flex';

    // Atualizar navegação
    renderLessonNavigation();
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    modal.style.display = 'none';

    // Ir para a próxima aula ou voltar ao conteúdo
    if (currentLesson < courseLessons.length) {
        showLesson(currentLesson + 1);
    } else {
        // Curso completo!
        showCourseCompletion();
    }
}

function showCourseCompletion() {
    const modal = document.getElementById('completionModal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <h2>🎊 Parabéns!</h2>
        <p style="font-size: 1.2rem; margin: 1rem 0;">
            Você concluiu o <strong>Módulo 1 - Fundamentos e História da Umbanda</strong>!
        </p>
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 2rem; border-radius: 12px; color: white; margin: 1.5rem 0;">
            <h3 style="margin-bottom: 1rem;">📜 Certificado de Conclusão</h3>
            <p>Você completou todas as 10 aulas do módulo com sucesso!</p>
            <p style="margin-top: 1rem;">Total de progresso: <strong>100%</strong></p>
        </div>
        <p>Continue sua jornada de formação sacerdotal no próximo módulo!</p>
        <button class="btn-primary" onclick="resetCourse()">Ver Todas as Aulas</button>
    `;

    modal.style.display = 'flex';
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function resetCourse() {
    const modal = document.getElementById('completionModal');
    modal.style.display = 'none';

    // Voltar à tela de boas-vindas
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('lessonContent').style.display = 'none';
    document.getElementById('quizSection').style.display = 'none';

    window.scrollTo(0, 0);
}

// ============================================
// ATALHOS DE TECLADO
// ============================================

document.addEventListener('keydown', function(e) {
    // Se estiver na área de quiz, não processar atalhos
    const quizSection = document.getElementById('quizSection');
    if (quizSection.style.display !== 'none') {
        return;
    }

    // Seta esquerda - Aula anterior
    if (e.key === 'ArrowLeft' && currentLesson > 1) {
        previousLesson();
    }

    // Seta direita - Próxima aula
    if (e.key === 'ArrowRight' && currentLesson < courseLessons.length) {
        nextLesson();
    }
});

// ============================================
// MENU MOBILE
// ============================================

let mobileMenuOpen = false;

function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('mobileMenuBtn');
    const fabBtn = document.getElementById('fabModules');

    if (mobileMenuOpen) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        menuBtn.classList.add('active');
        if (fabBtn) fabBtn.classList.add('hidden');
        document.body.style.overflow = 'hidden'; // Prevenir scroll do body
    } else {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.classList.remove('active');
        if (fabBtn) fabBtn.classList.remove('hidden');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

function closeMobileMenu() {
    if (mobileMenuOpen) {
        mobileMenuOpen = false;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const menuBtn = document.getElementById('mobileMenuBtn');
        const fabBtn = document.getElementById('fabModules');

        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.classList.remove('active');
        if (fabBtn) fabBtn.classList.remove('hidden');
        document.body.style.overflow = '';
    }
}

// Fechar menu ao clicar em uma aula (mobile)
function closeMobileMenuOnLessonSelect() {
    if (window.innerWidth <= 768) {
        closeMobileMenu();
    }
}

// Fechar menu com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
    }
});

// Fechar menu se a tela for redimensionada para desktop
window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && mobileMenuOpen) {
        closeMobileMenu();
    }
});

// ============================================
// CONSOLE LOG PARA DEBUG
// ============================================

console.log('🕯️ Curso Sacerdotal de Umbanda - Plataforma Iniciada');
console.log(`📚 Total de aulas: ${courseLessons.length}`);
console.log(`✅ Aulas concluídas: ${completedLessons.length}`);
console.log(`📍 Aula atual: ${currentLesson}`);
