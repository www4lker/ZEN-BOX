
// scripts/uiManager.js
export function createUIManager(elements) {
    const {
    // Elementos da interface principal
    phaseTextEl,
    phaseTimerEl,
    currentCycleEl,
    totalCyclesEl,
    progressBarFillEl,
    startPauseBtn,
    resetBtn,
    settingsBtn,
    // Elementos do box de animação
    animationBoxEl,
    breathingDotEl,
    breathingBoxEl, // SVG container
    // Overlay de contagem regressiva
    countdownOverlayEl,
    countdownNumberEl,
    countdownTextEl,
    // Botões de fase (para feedback visual)
    phaseButtons, // Coleção de botões de fase
    // Modal de configurações
    settingsModalEl,
    settingsFormEl,
    durationSelectEl,
    cyclesInputEl,
    saveSettingsBtn,
    cancelSettingsBtn,
    closeSettingsBtn,
    // Modal de conclusão
    completionModalEl,
    completedCyclesTextEl,
    newSessionBtn,
    closeCompletionBtn,
    // Aria-live regions
    controlStatusEl,
    } = elements;
    function updatePhaseDisplay(phaseText, timer, phaseKey) {
        if (phaseTextEl) phaseTextEl.textContent = phaseText;
        if (phaseTimerEl) phaseTimerEl.textContent = timer;
    
        if (phaseButtons) {
            phaseButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.phase === phaseKey) {
                    btn.classList.add('active');
                }
            });
        }
        // Atualiza a classe no dot para animação CSS e no box para cor
        if (breathingDotEl) {
            breathingDotEl.className = 'breathing-dot'; // Reset classes
            if (phaseKey) breathingDotEl.classList.add(`phase-${phaseKey}`);
        }
        if (breathingBoxEl) { // O SVG container
            breathingBoxEl.className = 'breathing-box'; // Reset classes
             breathingBoxEl.classList.add('active'); // Mantém o box visível durante as fases
            if (phaseKey) breathingBoxEl.classList.add(`phase-${phaseKey}`);
        }
    }
    
    function updateCycleCount(current, total) {
        if (currentCycleEl) currentCycleEl.textContent = current;
        if (totalCyclesEl) totalCyclesEl.textContent = total;
    }
    
    function updateProgressBar(currentCycle, totalCycles, currentTimeInPhase, phaseDuration) {
        if (!progressBarFillEl) return;
        const cycleProgress = totalCycles > 0 ? (currentCycle / totalCycles) * 100 : 0;
        const phaseProgressFraction = phaseDuration > 0 ? (phaseDuration - currentTimeInPhase) / phaseDuration : 0;
        
        // Progress within the current cycle based on phase progress
        // Each cycle has 4 phases. So, current progress is (currentCycle / totalCycles) + (phaseProgressWithinCurrentCycle / totalCycles)
        let overallProgress = 0;
        if (totalCycles > 0) {
            const progressOfCompletedCycles = (currentCycle / totalCycles) * 100;
            const progressOfCurrentCycle = ( (PHASES.indexOf(currentPhaseKey) * phaseDuration + (phaseDuration - currentTimeInPhase) ) / (PHASES.length * phaseDuration) ) * (100 / totalCycles) ;
    
            overallProgress = progressOfCompletedCycles + progressOfCurrentCycle;
             if(currentCycle >= totalCycles) overallProgress = 100; // Ensure 100% at the end
        }
        
        // Simpler approach: progress based on cycles and current phase completion relative to total duration.
        // Let's use a simpler cycle-based progress for now.
        // const overallProgress = cycleProgress; // This only updates per cycle.
        // For smoother progress, consider time elapsed. Total time = totalCycles * 4 * phaseDuration
        // Time elapsed = (currentCycle * 4 * phaseDuration) + (currentPhaseIndex * phaseDuration) + (phaseDuration - currentTimeInPhase)
        // Simplified: progress only increases per cycle complete for now.
        progressBarFillEl.style.width = `${cycleProgress}%`;
        progressBarFillEl.setAttribute('aria-valuenow', cycleProgress.toFixed(0));
    }
    
    // Helper: Obter a chave da fase atual para a barra de progresso
    let currentPhaseKey = 'inhale'; // Default or updated by timerController
    const PHASES = ['inhale', 'hold1', 'exhale', 'hold2']; // Should match timerController
    
    function setPhaseKeyForProgress(phaseKey) {
        currentPhaseKey = phaseKey;
    }
    
    
    function setStartPauseButtonState(isPaused) {
        if (startPauseBtn) {
            startPauseBtn.querySelector('.btn-text').textContent = isPaused ? 'Retomar' : 'Pausar';
            startPauseBtn.setAttribute('aria-label', isPaused ? 'Retomar exercício' : 'Pausar exercício');
            if (controlStatusEl) controlStatusEl.textContent = isPaused ? "Exercício pausado." : "Exercício em andamento.";
        }
        if (animationBoxEl) {
            animationBoxEl.classList.toggle('breathing-paused', isPaused);
        }
    }
    
    function setInitialButtonStates() {
        if (startPauseBtn) {
            startPauseBtn.querySelector('.btn-text').textContent = 'Iniciar';
            startPauseBtn.setAttribute('aria-label', 'Iniciar exercício');
        }
        if (resetBtn) resetBtn.disabled = true;
        if (animationBoxEl) {
            animationBoxEl.classList.remove('breathing-paused');
            animationBoxEl.classList.remove('breathing-active'); // Box não ativo inicialmente
        }
        if (breathingBoxEl) {
            breathingBoxEl.className = 'breathing-box'; // Reset SVG box color/state
        }
        if (breathingDotEl) {
            breathingDotEl.className = 'breathing-dot'; // Reset dot
             breathingDotEl.classList.add('reset'); // Posicionar no início
        }
         if (phaseButtons) {
            phaseButtons.forEach(btn => btn.classList.remove('active'));
        }
        if (progressBarFillEl) {
            progressBarFillEl.style.width = `0%`;
            progressBarFillEl.setAttribute('aria-valuenow', '0');
        }
        if(controlStatusEl) controlStatusEl.textContent = "Pronto para iniciar.";
    
    }
    
    function enableResetButton(enable = true) {
        if (resetBtn) resetBtn.disabled = !enable;
    }
    
    function showCountdown(duration, callback) {
        if (!countdownOverlayEl || !countdownNumberEl || !countdownTextEl) {
            if(callback) callback(); // Proceed if countdown elements are missing
            return;
        }
        
        countdownOverlayEl.classList.remove('hidden');
        let count = duration;
        countdownNumberEl.textContent = count;
        countdownTextEl.textContent = "Prepare-se...";
    
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumberEl.textContent = count;
            } else if (count === 0) {
                countdownNumberEl.textContent = "VAI!"; // Or some other text
            } else {
                clearInterval(interval);
                countdownOverlayEl.classList.add('hidden');
                if (breathingBoxEl) breathingBoxEl.classList.add('active'); // Ativa o box após countdown
                if (animationBoxEl) animationBoxEl.classList.add('breathing-active');
                if (callback) callback();
            }
        }, 1000);
    }
    
    function showSettingsModal(show = true) {
        if (settingsModalEl) {
            settingsModalEl.setAttribute('aria-hidden', !show);
            settingsModalEl.classList.toggle('show', show);
            if (show) durationSelectEl.focus();
        }
    }
    
    function showCompletionModal(show = true, cyclesCompleted) {
        if (completionModalEl) {
            completionModalEl.setAttribute('aria-hidden', !show);
            completionModalEl.classList.toggle('show', show);
            if (show && completedCyclesTextEl) {
                completedCyclesTextEl.textContent = cyclesCompleted;
                if (animationBoxEl) animationBoxEl.classList.add('breathing-complete');
                if (newSessionBtn) newSessionBtn.focus();
                 if (controlStatusEl) controlStatusEl.textContent = `Exercício concluído! Você completou ${cyclesCompleted} ciclos.`;
            } else {
                if (animationBoxEl) animationBoxEl.classList.remove('breathing-complete');
            }
        }
    }
    
    function updatePhaseDurationsInUI(duration) {
        if (phaseButtons) {
            phaseButtons.forEach(btn => {
                const durationSpan = btn.querySelector('.phase-duration');
                if (durationSpan) durationSpan.textContent = `${duration}s`;
            });
        }
        if(breathingDotEl) { // Atualiza a variável CSS para a duração da animação
            document.documentElement.style.setProperty('--animation-duration', `${duration}s`);
        }
    }
    
    // Public methods
    return {
        updatePhaseDisplay,
        updateCycleCount,
        updateProgressBar,
        setStartPauseButtonState,
        setInitialButtonStates,
        enableResetButton,
        showCountdown,
        showSettingsModal,
        showCompletionModal,
        updatePhaseDurationsInUI,
        setPhaseKeyForProgress, // Para a barra de progresso
        // Expor os elementos para que app.js possa adicionar listeners diretamente
        // ou adicionar métodos aqui para configurar listeners e chamar callbacks
        elements: { // Expor para `app.js` poder ligar os handlers
            startPauseBtn,
            resetBtn,
            settingsBtn,
            settingsFormEl, // Para settings.js
            saveSettingsBtn, // Para app.js ou settings.js
            cancelSettingsBtn, // Para app.js ou settings.js
            closeSettingsBtn,
            newSessionBtn,
            closeCompletionBtn,
        }
    };
    }