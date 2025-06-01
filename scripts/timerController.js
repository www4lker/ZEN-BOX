// scripts/timerController.js


const PHASES = ['inhale', 'hold1', 'exhale', 'hold2'];
const PHASE_TEXTS = {
inhale: 'Inspirar',
hold1: 'Segurar',
exhale: 'Expirar',
hold2: 'Segurar',
};

export function createTimerController(config) {
let {
initialPhaseDuration = 6,
initialTotalCycles = 13,
onPhaseChange = () => {},
onTimerUpdate = () => {},
onCycleComplete = () => {},
onAllCyclesComplete = () => {},
onReset = () => {},
} = config;

let phaseDuration = initialPhaseDuration;
let totalCycles = initialTotalCycles;

let currentPhaseIndex = 0;
let currentTimeInPhase = phaseDuration;
let currentCycle = 0;
let isRunning = false;
let timerId = null;

function _resetState() {
    currentPhaseIndex = 0;
    currentTimeInPhase = phaseDuration;
    currentCycle = 0;
    isRunning = false;
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function _tick() {
    if (!isRunning) return;

    currentTimeInPhase--;
    onTimerUpdate({
        timer: currentTimeInPhase,
        phase: PHASES[currentPhaseIndex],
        cycle: currentCycle,
        totalCycles: totalCycles,
        phaseText: PHASE_TEXTS[PHASES[currentPhaseIndex]],
    });

    if (currentTimeInPhase <= 0) {
        _nextPhase();
    }
}

function _nextPhase() {
    currentPhaseIndex++;
    if (currentPhaseIndex >= PHASES.length) {
        currentPhaseIndex = 0;
        currentCycle++;
        onCycleComplete({
            cycle: currentCycle,
            totalCycles: totalCycles,
        });

        if (currentCycle >= totalCycles) {
            onAllCyclesComplete({ totalCycles: totalCycles });
            pause(); // Stop the timer
            return;
        }
    }
    currentTimeInPhase = phaseDuration;
    onPhaseChange({
        phase: PHASES[currentPhaseIndex],
        duration: phaseDuration,
        cycle: currentCycle,
        totalCycles: totalCycles,
        phaseText: PHASE_TEXTS[PHASES[currentPhaseIndex]],
        timer: currentTimeInPhase
    });
}

function start() {
    if (isRunning) return;
    isRunning = true;
    
    // Initial call to set the first phase display before timer starts ticking down
    onPhaseChange({
        phase: PHASES[currentPhaseIndex],
        duration: phaseDuration,
        cycle: currentCycle,
        totalCycles: totalCycles,
        phaseText: PHASE_TEXTS[PHASES[currentPhaseIndex]],
        timer: currentTimeInPhase
    });
    
    if (timerId) clearInterval(timerId);
    timerId = setInterval(_tick, 1000);
}

function pause() {
    if (!isRunning) return;
    isRunning = false;
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function reset() {
    pause();
    _resetState();
    // Notify UI about reset state
    onReset({
        phase: PHASES[currentPhaseIndex], // Should be initial phase (e.g. inhale)
        duration: phaseDuration,
        cycle: currentCycle, // Should be 0
        totalCycles: totalCycles,
        phaseText: "Clique para começar", // Or initial phase text
        timer: phaseDuration
    });
}

function updateSettings(newPhaseDuration, newTotalCycles) {
    const wasRunning = isRunning;
    if (isRunning) {
        pause();
    }
    phaseDuration = newPhaseDuration;
    totalCycles = newTotalCycles;
    _resetState(); // Reset to apply new settings from a clean state
    
    // Notify UI about reset state with new settings
    onReset({
        phase: PHASES[currentPhaseIndex],
        duration: phaseDuration,
        cycle: currentCycle,
        totalCycles: totalCycles,
        phaseText: "Clique para começar",
        timer: phaseDuration
    });

    if (wasRunning) {
        // Optionally, decide if it should auto-start or wait for user
        // For now, it remains paused, user has to click start again.
    }
}

function getCurrentState() {
    return {
        phase: PHASES[currentPhaseIndex],
        phaseText: PHASE_TEXTS[PHASES[currentPhaseIndex]],
        timer: currentTimeInPhase,
        cycle: currentCycle,
        totalCycles: totalCycles,
        phaseDuration: phaseDuration,
        isRunning: isRunning,
    };
}

// Initialize with default state for UI
// This is called implicitly by reset logic or initial setup
// Let's call onReset initially to set UI from app.js if needed
// Or, let app.js call reset() upon initialization.
// For now, `updateSettings` or `reset` will trigger the callback.

return {
    start,
    pause,
    reset,
    updateSettings,
    getCurrentState,
    // Expose constants if needed by other modules, though phase texts are now passed in callbacks
    // PHASES, 
    // PHASE_TEXTS 
};


}