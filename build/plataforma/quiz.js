// ============================================
// CURSO SACERDOTAL DE UMBANDA - QUIZ.JS
// Sistema de Quiz Interativo com Feedback
// ============================================

// Estado do quiz
let quizState = {
    currentLesson: 0,
    selectedAnswers: {},
    quizSubmitted: false
};

// ============================================
// RENDERIZAÇÃO DO QUIZ
// ============================================

function renderQuizQuestions() {
    const quizQuestions = document.getElementById('quizQuestions');
    quizQuestions.innerHTML = '';

    const questions = lessonQuizzes[currentLesson];

    if (!questions) {
        quizQuestions.innerHTML = `
            <div class="no-quiz-message">
                <p>📝 Nenhuma pergunta disponível para esta aula.</p>
            </div>
        `;
        return;
    }

    // Reset quiz state
    quizState = {
        currentLesson: currentLesson,
        selectedAnswers: {},
        quizSubmitted: false
    };

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.setAttribute('data-question-index', index);

        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Pergunta ${index + 1} de ${questions.length}</span>
            </div>
            <p class="question-text">${q.question}</p>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <div class="option"
                         data-question-index="${index}"
                         data-option-index="${optIndex}"
                         onclick="selectOption(${index}, ${optIndex})">
                        <span class="option-letter">${String.fromCharCode(65 + optIndex)}</span>
                        <span class="option-text">${option}</span>
                    </div>
                `).join('')}
            </div>
            <div class="explanation" style="display: none;">
                <div class="explanation-header">
                    <strong>💡 Explicação:</strong>
                </div>
                <p>${q.explanation}</p>
            </div>
        `;

        quizQuestions.appendChild(questionDiv);
    });

    // Adicionar botão de enviar quiz
    const submitBtnContainer = document.createElement('div');
    submitBtnContainer.className = 'quiz-submit-container';
    submitBtnContainer.innerHTML = `
        <button class="btn-primary btn-submit-quiz" id="submitQuizBtn" onclick="submitQuiz()" disabled>
            📝 Enviar Respostas
        </button>
        <p class="quiz-hint" id="quizHint">Responda todas as perguntas para enviar</p>
    `;

    quizQuestions.appendChild(submitBtnContainer);
}

// ============================================
// SELEÇÃO DE OPÇÕES
// ============================================

function selectOption(questionIndex, optionIndex) {
    // Se o quiz já foi enviado, não permitir mudanças
    if (quizState.quizSubmitted) {
        return;
    }

    const questionDiv = document.querySelector(`[data-question-index="${questionIndex}"]`);
    const options = questionDiv.querySelectorAll('.option');

    // Remover seleção anterior desta pergunta
    options.forEach(opt => {
        if (opt.getAttribute('data-question-index') == questionIndex) {
            opt.classList.remove('selected');
        }
    });

    // Adicionar seleção à opção clicada
    const selectedOption = questionDiv.querySelector(`[data-option-index="${optionIndex}"]`);
    selectedOption.classList.add('selected');

    // Salvar resposta selecionada
    quizState.selectedAnswers[questionIndex] = optionIndex;

    // Feedback visual
    selectedOption.style.transform = 'scale(0.98)';
    setTimeout(() => {
        selectedOption.style.transform = 'scale(1)';
    }, 100);

    // Verificar se todas as perguntas foram respondidas
    checkAllQuestionsAnswered();
}

function checkAllQuestionsAnswered() {
    const questions = lessonQuizzes[currentLesson];
    const totalAnswered = Object.keys(quizState.selectedAnswers).length;

    const submitBtn = document.getElementById('submitQuizBtn');
    const quizHint = document.getElementById('quizHint');

    if (totalAnswered === questions.length) {
        submitBtn.disabled = false;
        submitBtn.classList.add('btn-ready');
        quizHint.textContent = `✅ Todas as ${questions.length} perguntas respondidas!`;
        quizHint.style.color = '#10b981';
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-ready');
        quizHint.textContent = `${totalAnswered}/${questions.length} perguntas respondidas`;
        quizHint.style.color = '#6b7280';
    }
}

// ============================================
// ENVIO E CORREÇÃO DO QUIZ
// ============================================

function submitQuiz() {
    // Marcar quiz como enviado
    quizState.quizSubmitted = true;

    const questions = lessonQuizzes[currentLesson];
    let correctCount = 0;
    let wrongCount = 0;

    // Animação de envio
    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.textContent = '⏳ Corrigindo...';
    submitBtn.disabled = true;

    // Simular tempo de correção para melhor UX
    setTimeout(() => {
        questions.forEach((q, index) => {
            const questionDiv = document.querySelector(`[data-question-index="${index}"]`);
            const options = questionDiv.querySelectorAll('.option');
            const selectedIndex = quizState.selectedAnswers[index];
            const explanation = questionDiv.querySelector('.explanation');

            // Desabilitar todas as opções
            options.forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.classList.remove('selected');
            });

            // Marcar resposta correta em verde
            const correctOption = questionDiv.querySelector(`[data-option-index="${q.correct}"]`);
            correctOption.classList.add('correct');

            // Adicionar ícone de correto
            if (!correctOption.querySelector('.result-icon')) {
                const correctIcon = document.createElement('span');
                correctIcon.className = 'result-icon';
                correctIcon.textContent = '✓';
                correctOption.appendChild(correctIcon);
            }

            // Se a resposta selecionada estiver errada, marcar em vermelho
            if (selectedIndex !== q.correct) {
                const wrongOption = questionDiv.querySelector(`[data-option-index="${selectedIndex}"]`);
                wrongOption.classList.add('incorrect');

                // Adicionar ícone de incorreto
                if (!wrongOption.querySelector('.result-icon')) {
                    const wrongIcon = document.createElement('span');
                    wrongIcon.className = 'result-icon';
                    wrongIcon.textContent = '✗';
                    wrongOption.appendChild(wrongIcon);
                }

                wrongCount++;
            } else {
                correctCount++;
            }

            // Mostrar explicação com animação
            explanation.style.display = 'block';
            explanation.style.animation = 'fadeIn 0.5s ease-in-out';
        });

        // Atualizar botão
        submitBtn.textContent = '✅ Quiz Corrigido';
        submitBtn.classList.add('btn-completed');

        // Mostrar resultados
        setTimeout(() => {
            showQuizResults(correctCount, wrongCount, questions.length);
        }, 500);
    }, 1000);
}

// ============================================
// EXIBIÇÃO DE RESULTADOS
// ============================================

function showQuizResults(correct, wrong, total) {
    const quizResults = document.getElementById('quizResults');
    quizResults.style.display = 'block';

    const percentage = Math.round((correct / total) * 100);

    // Atualizar elementos de resultado com animação
    document.getElementById('scorePercentage').textContent = '0%';
    document.getElementById('correctAnswers').textContent = '0';
    document.getElementById('wrongAnswers').textContent = '0';
    document.getElementById('totalQuestions').textContent = total;

    // Atualizar círculo de pontuação com cor baseada no desempenho
    const scoreCircle = document.getElementById('scoreCircle');

    if (percentage >= 80) {
        scoreCircle.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        scoreCircle.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)';
    } else if (percentage >= 60) {
        scoreCircle.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        scoreCircle.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
    } else if (percentage >= 40) {
        scoreCircle.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        scoreCircle.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.3)';
    } else {
        scoreCircle.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        scoreCircle.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.3)';
    }

    // Animar os números
    animateValue('scorePercentage', 0, percentage, 1000, '%');
    animateValue('correctAnswers', 0, correct, 1000);
    animateValue('wrongAnswers', 0, wrong, 1000);

    // Mensagem de resultado
    const resultsMessage = document.getElementById('resultsMessage');

    if (percentage >= 80) {
        resultsMessage.innerHTML = `
            <div class="result-excellent">
                <h3>🎉 Excelente!</h3>
                <p>Você demonstrou um entendimento excepcional do conteúdo da aula.</p>
                <p>Continue assim e você será um grande sacerdote de Umbanda!</p>
            </div>
        `;
    } else if (percentage >= 60) {
        resultsMessage.innerHTML = `
            <div class="result-good">
                <h3>👏 Muito Bom!</h3>
                <p>Você compreendeu bem o conteúdo apresentado.</p>
                <p>Revise os pontos onde teve dúvidas para consolidar seu aprendizado.</p>
            </div>
        `;
    } else if (percentage >= 40) {
        resultsMessage.innerHTML = `
            <div class="result-fair">
                <h3>📚 Continue Estudando!</h3>
                <p>Você compreendeu parte do conteúdo, mas há espaço para melhorar.</p>
                <p>Recomendamos revisar a aula com mais atenção antes de prosseguir.</p>
            </div>
        `;
    } else {
        resultsMessage.innerHTML = `
            <div class="result-needs-improvement">
                <h3>📖 Precisa Revisar</h3>
                <p>Parece que você teve dificuldade com este conteúdo.</p>
                <p>Sugerimos reler a aula cuidadosamente e refazer o quiz.</p>
            </div>
        `;
    }

    // Scroll suave para os resultados
    setTimeout(() => {
        quizResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // Salvar resultado do quiz
    saveQuizResult(currentLesson, correct, wrong, percentage);
}

// ============================================
// ANIMAÇÕES
// ============================================

function animateValue(elementId, start, end, duration, suffix = '') {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, 16);
}

// ============================================
// REFAZER QUIZ
// ============================================

function retakeQuiz() {
    // Resetar estado
    quizState = {
        currentLesson: currentLesson,
        selectedAnswers: {},
        quizSubmitted: false
    };

    // Ocultar resultados
    document.getElementById('quizResults').style.display = 'none';

    // Recarregar perguntas
    renderQuizQuestions();

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Feedback visual
    const quizSection = document.getElementById('quizSection');
    quizSection.style.animation = 'fadeIn 0.5s ease-in-out';
}

// ============================================
// SALVAR RESULTADOS
// ============================================

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

async function saveQuizResult(lessonId, correct, wrong, percentage) {
    const total = correct + wrong;
    // Calcular módulo correto baseado na aula
    const moduleId = getModuleFromLessonId(lessonId);

    // Salvar no Supabase
    try {
        await saveQuizAttempt(
            moduleId,
            lessonId,
            correct,
            total,
            quizState.selectedAnswers
        );
    } catch (error) {
        console.error('Erro ao salvar quiz no Supabase:', error);
    }

    // Salvar também no localStorage como backup
    const quizResults = JSON.parse(localStorage.getItem('umbandaQuizResults') || '{}');

    if (!quizResults[lessonId]) {
        quizResults[lessonId] = [];
    }

    quizResults[lessonId].push({
        date: new Date().toISOString(),
        correct: correct,
        wrong: wrong,
        percentage: percentage,
        total: total
    });

    localStorage.setItem('umbandaQuizResults', JSON.stringify(quizResults));
}

function getQuizHistory(lessonId) {
    const quizResults = JSON.parse(localStorage.getItem('umbandaQuizResults') || '{}');
    return quizResults[lessonId] || [];
}

function getBestScore(lessonId) {
    const history = getQuizHistory(lessonId);
    if (history.length === 0) return 0;

    return Math.max(...history.map(result => result.percentage));
}

// ============================================
// ESTATÍSTICAS DO QUIZ
// ============================================

function getQuizStatistics() {
    const quizResults = JSON.parse(localStorage.getItem('umbandaQuizResults') || '{}');
    const stats = {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageScore: 0,
        lessonScores: {}
    };

    Object.keys(quizResults).forEach(lessonId => {
        const lessonHistory = quizResults[lessonId];
        lessonHistory.forEach(result => {
            stats.totalQuizzes++;
            stats.totalQuestions += result.total;
            stats.totalCorrect += result.correct;
        });

        // Melhor pontuação por aula
        stats.lessonScores[lessonId] = getBestScore(lessonId);
    });

    if (stats.totalQuestions > 0) {
        stats.averageScore = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
    }

    return stats;
}

// ============================================
// CONSOLE LOG PARA DEBUG
// ============================================

console.log('📝 Sistema de Quiz Interativo Carregado');
console.log(`Total de quizzes disponíveis: ${Object.keys(lessonQuizzes).length}`);
