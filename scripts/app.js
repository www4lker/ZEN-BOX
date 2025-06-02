// scripts/app.js
console.log('app.js carregado com sucesso!');

import { createTimerController } from './timerController.js';
import { loadSettings, getSettings, initSettingsForm } from './settings.js';
import { createUIManager } from './uiManager.js';

// Configuração declarativa do aplicativo
const APP_CONFIG = {
    selectors: {
        // UI Principal
        phaseText: '#phase-text',
        phaseTimer: '#phase-timer',
        currentCycle: '#current-cycle',
        totalCycles: '#total-cycles',
        progressBarFill: '.progress-fill',
        startPauseBtn: '#start-pause-btn',
        resetBtn: '#reset-btn',
        settingsBtn: '.settings-btn',
        
        // Animação
        animationBox: '.animation-box',
        breathingDot: '.breathing-dot',
        breathingBox: '.breathing-box',
        
        // Countdown
        countdownOverlay: '#countdown',
        countdownNumber: '.countdown-number',
        countdownText: '.countdown-text',
        
        // Modais
        settingsModal: '#settings-modal',
        settingsForm: '#settings-modal .settings-form',
        durationSelect: '#duration-select',
        cyclesInput: '#cycles-input',
        saveSettings: '#save-settings',
        cancelSettings: '#cancel-settings',
        closeSettings: '#settings-modal .modal-close',
        
        completionModal: '#completion-modal',
        completedCyclesText: '#completed-cycles',
        newSession: '#new-session',
        closeCompletion: '#completion-modal .modal-close',
        
        controlStatus: '#control-status'
    },
    
    events: {
        startPause: 'startPause',
        reset: 'reset',
        settingsOpen: 'settingsOpen',
        settingsClose: 'settingsClose',
        newSession: 'newSession',
        completionClose: 'completionClose'
    },
    
    states: {
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        COMPLETED: 'completed'
    }
};

/**
 * Classe principal da aplicação - Padrão Facade simplificado
 */
class ZenBoxApp {
    constructor() {
        this.state = APP_CONFIG.states.IDLE;
        this.isSessionActive = false;
        this.elements = {};
        this.settings = {};
        
        this.init();
    }
    
    /**
     * Inicialização usando método de composição
     */
    init() {
        this.collectElements()
            .loadSettings()
            .createControllers()
            .bindEvents()
            .setInitialState();
    }
    
    /**
     * Coleta elementos do DOM usando seletores declarativos
     */
    collectElements() {
        this.elements = Object.entries(APP_CONFIG.selectors).reduce((acc, [key, selector]) => {
            const element = key === 'phaseButtons' 
                ? document.querySelectorAll(selector)
                : document.querySelector(selector);
            
            if (!element) console.warn(`Elemento não encontrado: ${selector}`);
            acc[key] = element;
            return acc;
        }, {});
        
        return this;
    }
    
    /**
     * Carrega configurações e atualiza estado interno
     */
    loadSettings() {
        this.settings = loadSettings();
        return this;
    }
    
    /**
     * Cria controladores usando injeção de dependência
     */
    createControllers() {
        this.ui = createUIManager(this.elements);
        this.timer = createTimerController(this.createTimerConfig());
        this.initSettingsController();
        
        return this;
    }
    
    /**
     * Configuração do timer usando callbacks funcionais
     */
    createTimerConfig() {
        return {
            initialPhaseDuration: this.settings.duration,
            initialTotalCycles: this.settings.cycles,
            onPhaseChange: this.handlePhaseChange.bind(this),
            onTimerUpdate: this.handleTimerUpdate.bind(this),
            onCycleComplete: this.handleCycleComplete.bind(this),
            onAllCyclesComplete: this.handleAllCyclesComplete.bind(this),
            onReset: this.handleReset.bind(this)
        };
    }
    
    /**
     * Inicializa controlador de configurações
     */
    initSettingsController() {
        const settingsElements = {
            form: this.elements.settingsForm,
            durationSelect: this.elements.durationSelect,
            cyclesInput: this.elements.cyclesInput,
            saveButton: this.elements.saveSettings,
            cancelButton: this.elements.cancelSettings
        };
        
        initSettingsForm(
            settingsElements,
            this.handleSettingsSave.bind(this),
            this.handleSettingsCancel.bind(this)
        );
    }
    
    /**
     * Vincula eventos usando mapeamento declarativo
     */
    bindEvents() {
        const eventMap = {
            [this.elements.startPauseBtn]: () => this.handleStartPause(),
            [this.elements.resetBtn]: () => this.handleReset(),
            [this.elements.settingsBtn]: () => this.handleSettingsOpen(),
            [this.elements.closeSettings]: () => this.handleSettingsClose(),
            [this.elements.newSession]: () => this.handleNewSession(),
            [this.elements.closeCompletion]: () => this.handleCompletionClose()
        };
        
        Object.entries(eventMap).forEach(([element, handler]) => {
            if (element) element.addEventListener('click', handler);
        });
        
        return this;
    }
    
    /**
     * Define estado inicial da aplicação
     */
    setInitialState() {
        this.ui.setInitialButtonStates();
        this.ui.updatePhaseDurationsInUI(this.settings.duration);
        this.ui.updateCycleCount(0, this.settings.cycles);
        this.timer.reset();
        this.ui.enableResetButton(false);
        
        return this;
    }
    
    // ============ HANDLERS DE EVENTOS ============
    
    /**
     * Gerencia start/pause com máquina de estados implícita
     */
    handleStartPause() {
        const timerState = this.timer.getCurrentState();
        
        if (timerState.isRunning) {
            this.pauseSession();
        } else {
            this.isSessionActive ? this.resumeSession() : this.startNewSession();
        }
    }
    
    startNewSession() {
        this.isSessionActive = true;
        this.ui.showCountdown(3, () => {
            this.timer.start();
            this.ui.setStartPauseButtonState(false);
            this.ui.enableResetButton(true);
        });
    }
    
    resumeSession() {
        this.timer.start();
        this.ui.setStartPauseButtonState(false);
    }
    
    pauseSession() {
        this.timer.pause();
        this.ui.setStartPauseButtonState(true);
    }
    
    handleReset() {
        this.timer.reset();
        this.isSessionActive = false;
        this.ui.enableResetButton(false);
    }
    
    // ============ HANDLERS DE CONFIGURAÇÕES ============
    
    handleSettingsOpen() {
        this.populateSettingsForm();
        this.ui.showSettingsModal(true);
    }
    
    handleSettingsClose() {
        this.populateSettingsForm(); // Reverte mudanças não salvas
        this.ui.showSettingsModal(false);
    }
    
    handleSettingsSave(newSettings) {
        this.settings = newSettings;
        this.updateAppWithNewSettings();
        this.ui.showSettingsModal(false);
    }
    
    handleSettingsCancel() {
        this.ui.showSettingsModal(false);
    }
    
    populateSettingsForm() {
        const current = getSettings();
        this.elements.durationSelect.value = current.duration.toString();
        this.elements.cyclesInput.value = current.cycles.toString();
    }
    
    updateAppWithNewSettings() {
        this.timer.updateSettings(this.settings.duration, this.settings.cycles);
        this.ui.updatePhaseDurationsInUI(this.settings.duration);
        this.ui.updateCycleCount(0, this.settings.cycles);
        this.ui.setInitialButtonStates();
        this.ui.updatePhaseDisplay("Clique para começar", this.settings.duration, null);
    }
    
    // ============ HANDLERS DE CONCLUSÃO ============
    
    handleNewSession() {
        this.ui.showCompletionModal(false);
        this.handleReset();
    }
    
    handleCompletionClose() {
        this.ui.showCompletionModal(false);
    }
    
    // ============ CALLBACKS DO TIMER ============
    
    handlePhaseChange(data) {
        this.ui.setPhaseKeyForProgress(data.phase);
        this.ui.updatePhaseDisplay(data.phaseText, data.timer, data.phase);
        this.ui.updateProgressBar(data.cycle, data.totalCycles, data.timer, data.duration);
    }
    
    handleTimerUpdate(data) {
        this.ui.updatePhaseDisplay(data.phaseText, data.timer, data.phase);
        this.ui.updateProgressBar(data.cycle, data.totalCycles, data.timer, getSettings().duration);
    }
    
    handleCycleComplete(data) {
        this.ui.updateCycleCount(data.cycle, data.totalCycles);
        this.ui.updateProgressBar(data.cycle, data.totalCycles, getSettings().duration, getSettings().duration);
    }
    
    handleAllCyclesComplete(data) {
        this.state = APP_CONFIG.states.COMPLETED;
        this.ui.showCompletionModal(true, data.totalCycles);
        this.ui.setInitialButtonStates();
        this.ui.enableResetButton(false);
        this.resetAnimations();
    }
    
    handleReset(data) {
        this.state = APP_CONFIG.states.IDLE;
        this.ui.setInitialButtonStates();
        this.ui.updatePhaseDisplay("Clique para começar", data.duration, null);
        this.ui.updateCycleCount(data.cycle, data.totalCycles);
        this.ui.updateProgressBar(data.cycle, data.totalCycles, data.duration, data.duration);
        this.ui.updatePhaseDurationsInUI(data.duration);
        
        if (this.elements.countdownOverlay) {
            this.elements.countdownOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Reseta animações para estado inicial
     */
    resetAnimations() {
        const { breathingDot, breathingBox, animationBox } = this.elements;
        
        if (breathingDot) breathingDot.className = 'breathing-dot';
        if (breathingBox) breathingBox.className = 'breathing-box';
        if (animationBox) animationBox.classList.remove('breathing-active');
    }
}

// ============ INICIALIZAÇÃO ============

document.addEventListener('DOMContentLoaded', () => {
    // Uma única linha para inicializar toda a aplicação
    new ZenBoxApp();
});