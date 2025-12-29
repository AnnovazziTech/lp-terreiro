// ============================================
// CURSO SACERDOTAL DE UMBANDA - SUPABASE CONFIG
// Configuração e funções de integração com Supabase
// ============================================

const SUPABASE_URL = 'https://atvsijaopskezeidoubt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnNpamFvcHNrZXplaWRvdWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDAzMTEsImV4cCI6MjA3OTUxNjMxMX0.8DL-3ooyLWMFOxQV5jRaC10cn0GaNL6SguBS1y3u8cU';

// Inicializar cliente Supabase (usar variável diferente para evitar conflito)
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Erro ao inicializar Supabase:', e);
}

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * Faz login do usuário
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} dados do usuário ou erro
 */
async function login(email, password) {
    try {
        console.log('🔐 Tentando fazer login...', email);

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('❌ Erro na autenticação:', error);
            throw error;
        }

        console.log('✅ Autenticação OK, buscando perfil...');

        // Aguardar um pouco para garantir que o perfil foi criado
        await new Promise(resolve => setTimeout(resolve, 500));

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('⚠️ Erro ao buscar perfil:', profileError);
            console.log('Usando role padrão: student');
            // Se não encontrar perfil, criar um básico
            return {
                success: true,
                user: data.user,
                profile: {
                    id: data.user.id,
                    username: email.split('@')[0],
                    full_name: email.split('@')[0],
                    role: data.user.user_metadata?.role || 'student'
                }
            };
        }

        console.log('✅ Perfil encontrado:', profile);
        console.log('👤 Role:', profile.role);

        // Criar sessão de estudo (não bloquear o login se falhar)
        try {
            await createStudySession(data.user.id);
            console.log('✅ Sessão de estudo criada');
        } catch (sessionError) {
            console.warn('⚠️ Erro ao criar sessão (não crítico):', sessionError);
        }

        return {
            success: true,
            user: data.user,
            profile: profile
        };
    } catch (error) {
        console.error('❌ Erro no login:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Faz logout do usuário
 */
async function logout() {
    try {
        // Atualizar sessão de estudo
        await endStudySession();

        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        // Redirecionar para login
        window.location.href = 'login.html';

        return { success: true };
    } catch (error) {
        console.error('Erro no logout:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtém usuário atual
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) return null;

        // Buscar perfil
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return {
            ...user,
            profile: profile
        };
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
    }
}

/**
 * Verifica se usuário está autenticado
 * @returns {Promise<boolean>}
 */
async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

// ============================================
// SESSÕES DE ESTUDO
// ============================================

let currentSessionId = null;
let sessionStartTime = null;

/**
 * Cria nova sessão de estudo
 */
async function createStudySession(userId) {
    try {
        sessionStartTime = Date.now();

        const { data, error } = await supabaseClient
            .from('study_sessions')
            .insert({
                user_id: userId,
                login_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        currentSessionId = data.id;

        // Atualizar sessão periodicamente (a cada 30 segundos)
        setInterval(updateStudySession, 30000);

        return data;
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
    }
}

/**
 * Atualiza sessão de estudo atual
 */
async function updateStudySession() {
    if (!currentSessionId) return;

    try {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

        const { error } = await supabaseClient
            .from('study_sessions')
            .update({
                duration_seconds: durationSeconds,
                last_module_id: currentModule || 1,
                last_lesson_id: currentLesson || 0
            })
            .eq('id', currentSessionId);

        if (error) throw error;
    } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
    }
}

/**
 * Finaliza sessão de estudo
 */
async function endStudySession() {
    if (!currentSessionId) return;

    try {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

        const { error } = await supabaseClient
            .from('study_sessions')
            .update({
                logout_at: new Date().toISOString(),
                duration_seconds: durationSeconds,
                last_module_id: currentModule || 1,
                last_lesson_id: currentLesson || 0
            })
            .eq('id', currentSessionId);

        if (error) throw error;

        currentSessionId = null;
        sessionStartTime = null;
    } catch (error) {
        console.error('Erro ao finalizar sessão:', error);
    }
}

// ============================================
// PROGRESSO DO USUÁRIO
// ============================================

/**
 * Salva progresso da aula
 */
async function saveUserProgress(moduleId, lessonId, status) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Preparar dados base
        const progressData = {
            user_id: user.id,
            module_id: moduleId,
            lesson_id: lessonId,
            status: status
        };

        // Se é 'in_progress', definir started_at
        if (status === 'in_progress') {
            progressData.started_at = new Date().toISOString();
        }

        // Se é 'completed', definir completed_at
        if (status === 'completed') {
            progressData.completed_at = new Date().toISOString();

            // Buscar registro existente para preservar started_at
            const { data: existing } = await supabaseClient
                .from('user_lesson_progress')
                .select('started_at')
                .eq('user_id', user.id)
                .eq('module_id', moduleId)
                .eq('lesson_id', lessonId)
                .single();

            // Se existe e tem started_at, preservar
            if (existing?.started_at) {
                progressData.started_at = existing.started_at;
            } else {
                // Se não tem started_at, definir agora
                progressData.started_at = new Date().toISOString();
            }
        }

        const { data, error } = await supabaseClient
            .from('user_lesson_progress')
            .upsert(progressData, {
                onConflict: 'user_id,module_id,lesson_id'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Progresso salvo:', { moduleId, lessonId, status });
        return data;
    } catch (error) {
        console.error('❌ Erro ao salvar progresso:', error);
    }
}

/**
 * Atualiza tempo gasto na aula
 */
async function updateLessonTime(moduleId, lessonId, additionalSeconds) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { data: existing } = await supabaseClient
            .from('user_lesson_progress')
            .select('time_spent_seconds')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .eq('lesson_id', lessonId)
            .single();

        const currentTime = existing?.time_spent_seconds || 0;

        const { error } = await supabaseClient
            .from('user_lesson_progress')
            .update({
                time_spent_seconds: currentTime + additionalSeconds
            })
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .eq('lesson_id', lessonId);

        if (error) throw error;
    } catch (error) {
        console.error('Erro ao atualizar tempo:', error);
    }
}

/**
 * Carrega progresso do usuário
 * Cria registro automaticamente se não existir
 */
async function loadUserProgress() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        // Tentar buscar settings existentes
        let { data: settings, error } = await supabaseClient
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Se não existe, criar registro inicial
        if (error && error.code === 'PGRST116') {
            console.log('📝 Criando registro de progresso para novo usuário...');

            const { data: newSettings, error: insertError } = await supabaseClient
                .from('user_settings')
                .insert({
                    user_id: user.id,
                    current_module: 1,
                    current_lesson: 0,
                    course_started: false,
                    completed_lessons: []
                })
                .select()
                .single();

            if (insertError) {
                console.error('Erro ao criar settings:', insertError);
                return null;
            }

            console.log('✅ Registro de progresso criado com sucesso!');
            return newSettings;
        }

        if (error) throw error;

        return settings;
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        return null;
    }
}

/**
 * Atualiza configurações do usuário
 * Usa UPSERT para criar se não existir
 */
async function updateUserSettings(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Usar upsert para criar ou atualizar
        const { error } = await supabaseClient
            .from('user_settings')
            .upsert({
                user_id: user.id,
                ...updates,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;

        console.log('✅ Progresso salvo no Supabase');
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
    }
}

// ============================================
// QUIZ
// ============================================

/**
 * Salva tentativa de quiz
 */
async function saveQuizAttempt(moduleId, lessonId, score, totalQuestions, answers) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Contar tentativas anteriores
        const { count } = await supabaseClient
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .eq('lesson_id', lessonId);

        const attemptNumber = (count || 0) + 1;
        const percentage = (score / totalQuestions) * 100;

        const { data, error } = await supabaseClient
            .from('quiz_attempts')
            .insert({
                user_id: user.id,
                module_id: moduleId,
                lesson_id: lessonId,
                attempt_number: attemptNumber,
                score: score,
                total_questions: totalQuestions,
                percentage: percentage,
                answers: answers
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar quiz:', error);
    }
}

// ============================================
// ADMIN - Estatísticas
// ============================================

/**
 * Busca estatísticas de todos os usuários (admin only)
 */
async function getAdminUserStats() {
    try {
        const { data, error } = await supabaseClient
            .from('admin_user_stats')
            .select('*')
            .order('registered_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return [];
    }
}

/**
 * Busca detalhes de progresso de um usuário específico
 */
async function getUserDetailedProgress(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .order('module_id, lesson_id');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar progresso detalhado:', error);
        return [];
    }
}

/**
 * Busca sessões de estudo de um usuário
 */
async function getUserSessions(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('study_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('login_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar sessões:', error);
        return [];
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Formata segundos para horas:minutos
 */
function formatDuration(seconds) {
    if (!seconds) return '0h 0min';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}min`;
}

/**
 * Formata data para exibição
 */
function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// PROTEÇÃO DE ROTAS
// ============================================

/**
 * Protege página - redireciona para login se não autenticado
 */
async function protectPage() {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

/**
 * Protege página admin - redireciona se não for admin
 */
async function protectAdminPage() {
    const user = await getCurrentUser();

    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    if (user.profile?.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Listener para mudanças de autenticação
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_OUT') {
        // Limpar dados locais
        currentSessionId = null;
        sessionStartTime = null;
    }
});

console.log('✅ Supabase configurado e pronto!');
