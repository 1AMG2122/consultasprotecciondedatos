const WEBHOOK_URL = "https://TU-WEBHOOK-DE-N8N";

const chatMessages = document.getElementById('chat-messages');
const interactionContainer = document.getElementById('interaction-container');

let state = {
    step: 'welcome',
    userData: {
        nombre: '',
        email: '',
        tipoConsulta: '',
        asunto: '',
        mensaje: '',
        archivos: [],
        consentimiento: false
    }
};

const steps = {
    welcome: {
        messages: ["¡Bienvenido a LexPrivacy Hub!", "Soy tu asistente experto en protección de datos.", "¿Cómo te llamas?"],
        renderInput: () => renderTextInput('Escribe tu nombre completo', 'nombre', 'next')
    },
    email: {
        messages: (data) => [`Encantado, ${data.nombre}.`, "¿Cuál es tu correo electrónico de contacto?"],
        renderInput: () => renderTextInput('nombre@empresa.com', 'email', 'next', 'email')
    },
    tipo: {
        messages: ["¿Qué tipo de consulta deseas realizar?"],
        renderInput: () => renderSelectInput([
            { value: 'ejercicio_derechos', label: 'Ejercicio de Derechos' },
            { value: 'brecha_seguridad', label: 'Brecha de Seguridad' },
            { value: 'incidencia', label: 'Incidencia' },
            { value: 'consulta_general', label: 'Consulta General' }
        ], 'tipoConsulta', 'next')
    },
    asunto: {
        messages: ["Indica un breve asunto para tu consulta."],
        renderInput: () => renderTextInput('Asunto de la consulta', 'asunto', 'next')
    },
    mensaje: {
        messages: ["Por favor, describe detalladamente tu consulta."],
        renderInput: () => renderTextAreaInput('Escribe aquí los detalles...', 'mensaje', 'next')
    },
    upload: {
        messages: ["Si tienes documentos que ayuden a verificar el cumplimiento, puedes subirlos ahora.", "Si no, puedes continuar."],
        renderInput: () => renderFileUploadInput('next')
    },
    consent: {
        messages: ["Para finalizar, necesitamos que confirmes que esta consulta es exclusivamente sobre protección de datos y que aceptas nuestra política de privacidad."],
        renderInput: () => renderConsentInput('Enviar Consulta')
    },
    submitting: {
        messages: ["Procesando tu solicitud..."],
        renderInput: () => { interactionContainer.innerHTML = ''; }
    },
    success: {
        messages: ["¡Solicitud enviada con éxito!", "Nuestro equipo revisará tu caso y te contactará a la mayor brevedad."],
        renderInput: () => renderButton('Nueva Consulta', () => location.reload())
    },
    error: {
        messages: ["Lo sentimos, ha ocurrido un error al enviar tu solicitud.", "Por favor, inténtalo de nuevo más tarde."],
        renderInput: () => renderButton('Reintentar', () => goToStep('consent'))
    }
};

function addMessage(text, sender = 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderTextInput(placeholder, field, nextStep, type = 'text') {
    interactionContainer.innerHTML = `
        <div class="input-group">
            <input type="${type}" id="current-input" placeholder="${placeholder}" required>
            <button id="submit-input">Continuar</button>
        </div>
    `;

    document.getElementById('submit-input').onclick = () => {
        const value = document.getElementById('current-input').value.trim();
        if (value) {
            state.userData[field] = value;
            addMessage(value, 'user');
            goToStep(getNextStep(state.step));
        }
    };
}

function renderTextAreaInput(placeholder, field, nextStep) {
    interactionContainer.innerHTML = `
        <div class="input-group-vertical" style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
            <textarea id="current-input" placeholder="${placeholder}" rows="4" required></textarea>
            <button id="submit-input">Continuar</button>
        </div>
    `;

    document.getElementById('submit-input').onclick = () => {
        const value = document.getElementById('current-input').value.trim();
        if (value) {
            state.userData[field] = value;
            addMessage(value, 'user');
            goToStep(getNextStep(state.step));
        }
    };
}

function renderSelectInput(options, field, nextStep) {
    const optionsHtml = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    interactionContainer.innerHTML = `
        <div class="input-group">
            <select id="current-input">
                <option value="" disabled selected>Selecciona una opción</option>
                ${optionsHtml}
            </select>
            <button id="submit-input">Continuar</button>
        </div>
    `;

    document.getElementById('submit-input').onclick = () => {
        const value = document.getElementById('current-input').value;
        const label = document.getElementById('current-input').options[document.getElementById('current-input').selectedIndex].text;
        if (value) {
            state.userData[field] = value;
            addMessage(label, 'user');
            goToStep(getNextStep(state.step));
        }
    };
}

function renderFileUploadInput(nextStep) {
    interactionContainer.innerHTML = `
        <div class="file-upload-container">
            <label for="file-input" class="file-upload-label">
                <span>📎 Adjuntar archivos</span>
                <input type="file" id="file-input" multiple>
            </label>
            <div id="file-list" style="font-size: 0.8rem; margin: 0.5rem 0; color: var(--text-muted);"></div>
            <button id="submit-input" style="width: 100%; margin-top: 0.5rem;">Continuar</button>
        </div>
    `;

    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        state.userData.archivos = files;
        fileList.textContent = files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : '';
    };

    document.getElementById('submit-input').onclick = () => {
        if (state.userData.archivos.length > 0) {
            addMessage(`${state.userData.archivos.length} archivo(s) subido(s)`, 'user');
        } else {
            addMessage("No se adjuntaron archivos", 'user');
        }
        goToStep(getNextStep(state.step));
    };
}

function renderConsentInput(buttonText) {
    interactionContainer.innerHTML = `
        <div class="consent-container">
            <input type="checkbox" id="consent-check" required>
            <label for="consent-check">
                Confirmo que esta solicitud es exclusivamente sobre protección de datos y acepto el tratamiento de mis datos según la <a href="#" target="_blank">Política de Privacidad</a>.
            </label>
        </div>
        <button id="submit-input" style="width: 100%;"> ${buttonText} </button>
    `;

    document.getElementById('submit-input').onclick = () => {
        const isChecked = document.getElementById('consent-check').checked;
        if (isChecked) {
            state.userData.consentimiento = true;
            addMessage("Acepto los términos y condiciones.", 'user');
            submitToWebhook();
        } else {
            alert("Debes aceptar el consentimiento legal para continuar.");
        }
    };
}

function renderButton(text, callback) {
    interactionContainer.innerHTML = `
        <button id="action-btn" style="width: 100%;">${text}</button>
    `;
    document.getElementById('action-btn').onclick = callback;
}

function getNextStep(currentStep) {
    const order = ['welcome', 'email', 'tipo', 'asunto', 'mensaje', 'upload', 'consent', 'submitting'];
    const index = order.indexOf(currentStep);
    return order[index + 1];
}

async function goToStep(stepName) {
    state.step = stepName;
    const step = steps[stepName];

    interactionContainer.innerHTML = ''; // Clear previous inputs

    const messages = typeof step.messages === 'function' ? step.messages(state.userData) : step.messages;

    for (const msg of messages) {
        await new Promise(r => setTimeout(r, 600)); // Typing simulation
        addMessage(msg);
    }

    step.renderInput();
}

async function submitToWebhook() {
    goToStep('submitting');

    try {
        // En un escenario real, aquí manejaríamos la subida de archivos a un storage o base64
        // Para este ejemplo, enviamos los datos textuales
        const payload = {
            ...state.userData,
            archivos: state.userData.archivos.map(f => f.name), // Solo nombres para el ejemplo
            timestamp: new Date().toISOString()
        };

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            goToStep('success');
        } else {
            goToStep('error');
        }
    } catch (e) {
        console.error(e);
        goToStep('error');
    }
}

// Start conversation
window.onload = () => goToStep('welcome');
