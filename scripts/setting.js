// scripts/settings.js
const STORAGE_KEY = 'zenBoxSettings';
const DEFAULT_SETTINGS = {
duration: 6, // segundos
cycles: 13, // número de ciclos
};
let currentSettings = { ...DEFAULT_SETTINGS };
/**
Carrega as configurações do LocalStorage. Se não houver, usa os padrões.
@returns {object} As configurações carregadas.
*/
export function loadSettings() {
try {
const storedSettings = localStorage.getItem(STORAGE_KEY);
if (storedSettings) {
const parsedSettings = JSON.parse(storedSettings);
// Validar e mesclar para garantir que todas as chaves existam e tenham tipos válidos
currentSettings = {
duration: parseInt(parsedSettings.duration, 10) || DEFAULT_SETTINGS.duration,
cycles: parseInt(parsedSettings.cycles, 10) || DEFAULT_SETTINGS.cycles,
};
} else {
currentSettings = { ...DEFAULT_SETTINGS };
}
} catch (error) {
console.error("Erro ao carregar configurações do LocalStorage:", error);
currentSettings = { ...DEFAULT_SETTINGS };
}
return { ...currentSettings };
}
/**
Salva as configurações no LocalStorage.
@param {object} newSettings - O novo objeto de configurações.
@param {number} newSettings.duration - Duração por fase.
@param {number} newSettings.cycles - Número total de ciclos.
*/
export function saveSettings(newSettings) {
try {
// Validar antes de salvar
const validatedSettings = {
duration: parseInt(newSettings.duration, 10),
cycles: parseInt(newSettings.cycles, 10),
};
if (isNaN(validatedSettings.duration) || validatedSettings.duration < 1) {
validatedSettings.duration = DEFAULT_SETTINGS.duration;
}
if (isNaN(validatedSettings.cycles) || validatedSettings.cycles < 1) {
validatedSettings.cycles = DEFAULT_SETTINGS.cycles;
}
// Limites conforme o HTML (embora a validação final deva ocorrer no form)
if (validatedSettings.cycles > 50) validatedSettings.cycles = 50;
currentSettings = { ...validatedSettings };
localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
} catch (error) {
console.error("Erro ao salvar configurações no LocalStorage:", error);
}
}
/**
Retorna uma cópia das configurações atuais.
@returns {object} As configurações atuais.
*/
export function getSettings() {
return { ...currentSettings };
}
/**
Inicializa o formulário de configurações com os valores atuais e configura listeners.
@param {object} elements - Referências aos elementos do DOM.
@param {HTMLFormElement} elements.form - O elemento do formulário.
@param {HTMLSelectElement} elements.durationSelect - O select de duração.
@param {HTMLInputElement} elements.cyclesInput - O input de ciclos.
@param {HTMLButtonElement} elements.saveButton - O botão de salvar.
@param {HTMLButtonElement} elements.cancelButton - O botão de cancelar.
@param {function} onSave - Callback chamado quando as configurações são salvas. Recebe (newSettings).
@param {function} onCancel - Callback chamado quando o cancelamento é solicitado.
*/
export function initSettingsForm({ form, durationSelect, cyclesInput, saveButton, cancelButton }, onSave, onCancel) {
if (!form || !durationSelect || !cyclesInput || !saveButton || !cancelButton) {
console.error("Elementos do formulário de configurações ausentes.");
return;
}
// Popula o formulário com as configurações atuais
function populateForm() {
const settings = getSettings();
durationSelect.value = settings.duration.toString();
cyclesInput.value = settings.cycles.toString();
}
populateForm(); // Popula ao inicializar
form.addEventListener('submit', (event) => {
event.preventDefault();
const newDuration = parseInt(durationSelect.value, 10);
const newCycles = parseInt(cyclesInput.value, 10);
// Adicionar validação mais robusta se necessário (ex: min/max para ciclos)
 if (isNaN(newDuration) || isNaN(newCycles) || newCycles < 1 || newCycles > 50) {
     // Idealmente, mostrar feedback de erro no formulário
     console.warn("Valores de configuração inválidos.");
     // Poderia repopular para os valores válidos anteriores ou mostrar erro
     populateForm(); // Restaura para os valores atuais válidos
     return;
 }
 
 const newSettings = { duration: newDuration, cycles: newCycles };
 saveSettings(newSettings);
 if (onSave) {
     onSave(newSettings);
 }
Use code with caution.
});
if (cancelButton) {
cancelButton.addEventListener('click', () => {
populateForm(); // Restaura os valores para os atuais antes de fechar/cancelar
if (onCancel) {
onCancel();
}
});
}
// Chamada inicial para carregar configurações se ainda não foram
loadSettings();
populateForm();
}
// Carrega as configurações na inicialização do módulo
loadSettings();