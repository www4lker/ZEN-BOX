// scripts/app.js
import { createTimerController } from './timerController.js';
import { loadSettings, saveSettings, getSettings, initSettingsForm } from './settings.js';
import { createUIManager } from './uiManager.js';


document.addEventListener('DOMContentLoaded', () => {
// 1. Coletar referências do DOM
const elements = {
// UI Principal
phaseTextEl: document.getElementById('phase-text'),
phaseTimerEl: document.getElementById('phase-timer'),
currentCycleEl: document.getElementById('current-cycle'),
totalCyclesEl: document.getElementById('total-cycles'),
progressBarFillEl: document.querySelector('.progress-fill'),
startPauseBtn: document.getElementById('start-pause-btn'),
resetBtn: document.getElementById('reset-btn'),
settingsBtn: document.querySelector('.settings-btn'),
// Animação
animationBoxEl: document.querySelector('.animation-box'), // container da animação
breathingDotEl: document.querySelector('.breathing-dot'),
breathingBoxEl: document.querySelector('.breathing-box'), // SVG element
// Countdown
countdownOverlayEl: document.getElementById('countdown'),
countdownNumberEl: document.querySelector('.countdown-number'),
countdownTextEl: document.querySelector('.countdown-text'),
// Botões de Fase (NodeList)
phaseButtons: document.querySelectorAll('.phase-btn'),
// Modal Configurações
settingsModalEl: document.getElementById('settings-modal'),
settingsFormEl: document.querySelector('#settings-modal .settings-form'),
durationSelectEl: document.getElementById('duration-select'),
cyclesInputEl: document.getElementById('cycles-input'),
saveSettingsBtn: document.getElementById('save-settings'),
cancelSettingsBtn: document.getElementById('cancel-settings'),
closeSettingsBtn: document.querySelector('#settings-modal .modal-close'),
// Modal Conclusão
completionModalEl: document.getElementById('completion-modal'),
completedCyclesTextEl: document.getElementById('completed-cycles'),
newSessionBtn: document.getElementById('new-session'),
closeCompletionBtn: document.querySelector('#completion-modal .modal-close'),
// Aria-live
controlStatusEl: document.getElementById('control-status'),
};

// 2. Instanciar UI Manager
const ui = createUIManager(elements);
ui.setInitialButtonStates(); // Define o estado visual inicial

// 3. Carregar configurações e inicializar
let currentAppSettings = loadSettings();
ui.updatePhaseDurationsInUI(currentAppSettings.duration);
ui.updateCycleCount(0, currentAppSettings.cycles); // Exibe ciclos iniciais

// 4. Instanciar Timer Controller com callbacks para UI
const timerController = createTimerController({
    initialPhaseDuration: currentAppSettings.duration,
    initialTotalCycles: currentAppSettings.cycles,
    onPhaseChange: (data) => {
        ui.setPhaseKeyForProgress(data.phase);
        ui.updatePhaseDisplay(data.phaseText, data.timer, data.phase);
        ui.updateProgressBar(data.cycle, data.totalCycles, data.timer, data.duration);
    },
    onTimerUpdate: (data) => {
        ui.updatePhaseDisplay(data.phaseText, data.timer, data.phase);
         // A barra de progresso principal avança por ciclo, mas podemos adicionar sub-progresso aqui
        ui.updateProgressBar(data.cycle, data.totalCycles, data.timer, getSettings().duration);
    },
    onCycleComplete: (data) => {
        ui.updateCycleCount(data.cycle, data.totalCycles);
        ui.updateProgressBar(data.cycle, data.totalCycles, getSettings().duration, getSettings().duration); // Atualiza para 100% do ciclo
    },
    onAllCyclesComplete: (data) => {
        ui.showCompletionModal(true, data.totalCycles);
        ui.setInitialButtonStates();
        ui.enableResetButton(false); // Desabilita reset após completar e antes de nova sessão
        // A animação do dot deve parar, o uiManager pode precisar de um método para 'idle'
         if (elements.breathingDotEl) elements.breathingDotEl.className = 'breathing-dot';
         if (elements.breathingBoxEl) elements.breathingBoxEl.className = 'breathing-box';
         if (elements.animationBoxEl) elements.animationBoxEl.classList.remove('breathing-active');
    },
    onReset: (data) => {
        ui.setInitialButtonStates();
        ui.updatePhaseDisplay("Clique para começar", data.duration, null);
        ui.updateCycleCount(data.cycle, data.totalCycles);
        ui.updateProgressBar(data.cycle, data.totalCycles, data.duration, data.duration);
        ui.updatePhaseDurationsInUI(data.duration); // Garante que durações nos botões estejam corretas
        if (elements.countdownOverlayEl) elements.countdownOverlayEl.classList.add('hidden'); // Esconde countdown no reset
    }
});

// 5. Inicializar Formulário de Configurações
// (Usando elementos diretamente, pois initSettingsForm os espera)
initSettingsForm(
    {
        form: elements.settingsFormEl,
        durationSelect: elements.durationSelectEl,
        cyclesInput: elements.cyclesInputEl,
        saveButton: elements.saveSettingsBtn, // saveButton é parte do form, event listener no form
        cancelButton: elements.cancelSettingsBtn,
    },
    (newSettings) => { // onSave callback
        currentAppSettings = newSettings;
        timerController.updateSettings(newSettings.duration, newSettings.cycles);
        ui.updatePhaseDurationsInUI(newSettings.duration);
        ui.updateCycleCount(0, newSettings.cycles); // Atualiza contagem de ciclos na UI
        ui.setInitialButtonStates();
        ui.updatePhaseDisplay("Clique para começar", newSettings.duration, null);
        ui.showSettingsModal(false);
    },
    () => { // onCancel callback
        ui.showSettingsModal(false);
        // O formulário é resetado para os valores atuais (antes da tentativa de mudança) pelo próprio settings.js
    }
);

// 6. Configurar Event Listeners Principais
let isSessionActive = false; // Para controlar o countdown

elements.startPauseBtn.addEventListener('click', () => {
    const state = timerController.getCurrentState();
    if (state.isRunning) {
        timerController.pause();
        ui.setStartPauseButtonState(true); // UI para "Retomar" (paused = true)
    } else {
        if (!isSessionActive) { // Primeira vez clicando ou após reset/conclusão
            isSessionActive = true;
            ui.showCountdown(3, () => { // Duração do countdown em segundos
                timerController.start();
                ui.setStartPauseButtonState(false); // UI para "Pausar"
                ui.enableResetButton(true);
            });
        } else { // Retomando uma sessão pausada
            timerController.start();
            ui.setStartPauseButtonState(false); // UI para "Pausar"
        }
    }
});

elements.resetBtn.addEventListener('click', () => {
    timerController.reset();
    isSessionActive = false;
    // O callback onReset do timerController já chama ui.setInitialButtonStates, etc.
    ui.enableResetButton(false); // Desabilita após resetar
});

elements.settingsBtn.addEventListener('click', () => {
    // Popula o form com as configs atuais toda vez que abre, caso não tenham sido salvas
    const currentSavedSettings = getSettings();
    elements.durationSelectEl.value = currentSavedSettings.duration.toString();
    elements.cyclesInputEl.value = currentSavedSettings.cycles.toString();
    ui.showSettingsModal(true);
});

elements.closeSettingsBtn.addEventListener('click', () => {
    // O botão cancelar do form já tem uma lógica, mas este é o 'X'
    // Reverte para os valores salvos se o usuário fechar sem salvar/cancelar
    const currentSavedSettings = getSettings();
    elements.durationSelectEl.value = currentSavedSettings.duration.toString();
    elements.cyclesInputEl.value = currentSavedSettings.cycles.toString();
    ui.showSettingsModal(false);
});

// Modal de Conclusão
elements.newSessionBtn.addEventListener('click', () => {
    ui.showCompletionModal(false);
    timerController.reset(); // Reseta o estado do timer
    isSessionActive = false;
    // O onReset do timerController cuidará de atualizar a UI para o estado inicial
    ui.enableResetButton(false);
});

elements.closeCompletionBtn.addEventListener('click', () => {
    ui.showCompletionModal(false);
    // Permanece no estado de conclusão, mas modal some
    // Usuário pode querer ver o estado final antes de resetar ou abrir settings
});

// Estado inicial da UI, garantindo que o texto de ciclo e progresso sejam mostrados
// O callback onReset do timerController faz muito disso, mas uma chamada inicial é segura
timerController.reset(); // força o estado inicial e os callbacks
ui.enableResetButton(false);


// Se houver um módulo boxAnimation.js dedicado, seria inicializado aqui.
// Por enquanto, as animações são controladas por CSS classes aplicadas pelo uiManager.
// Ex: import { initBoxAnimation } from './boxAnimation.js';
// if (initBoxAnimation) initBoxAnimation(elements.breathingDotEl, elements.breathingBoxEl);


});